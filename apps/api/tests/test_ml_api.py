from fastapi.testclient import TestClient
from uuid import uuid4

from app.main import app

client = TestClient(app)


def observation(**overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "zone_id": "G",
        "event_type": "CRICKET_STADIUM",
        "area_m2": 500,
        "current_count": 850,
        "safe_capacity": 1500,
        "inflow_per_min": 16,
        "outflow_per_min": 22,
        "average_speed_mps": 1.15,
        "dwell_time_min": 10,
        "route_width_m": 6,
        "exit_count": 4,
        "elderly_share": 0.08,
        "child_share": 0.08,
        "mobility_limited_share": 0.03,
        "heat_index_c": 29,
        "fall_cluster_5m": 0,
        "sos_cluster_5m": 0,
        "cctv_confidence": 0.95,
        "gateway_health": 0.98,
    }
    payload.update(overrides)
    return payload


def test_model_status_reports_80_20_holdout() -> None:
    response = client.get("/api/v1/ml/crowd-risk/status")
    assert response.status_code == 200
    body = response.json()
    assert body["training_rows"] == 80_000
    assert body["testing_rows"] == 20_000
    assert body["synthetic_only"] is True


def test_congested_zone_scores_above_normal_zone() -> None:
    normal = client.post("/api/v1/ml/crowd-risk/predict", json=observation()).json()
    congested = client.post("/api/v1/ml/crowd-risk/predict", json=observation(
        current_count=1_850,
        inflow_per_min=70,
        outflow_per_min=9,
        average_speed_mps=0.24,
        dwell_time_min=42,
        route_width_m=2.1,
        exit_count=1,
        fall_cluster_5m=5,
        sos_cluster_5m=4,
        heat_index_c=39,
    )).json()
    assert congested["score"] > normal["score"] + 25
    assert congested["level"] in {"HIGH", "CRITICAL"}
    assert "RESTRICT_INFLOW" in congested["recommended_actions"]
    assert congested["advisory_only"] is True


def test_hardware_ingestion_rejects_replayed_sequence() -> None:
    payload = {
        "source_id": f"gateway-test-{uuid4()}",
        "source_type": "BLE_GATEWAY",
        "event_id": "demo",
        "zone_id": "G",
        "captured_at": "2026-08-26T18:00:00Z",
        "sequence": 1,
        "payload": {"active_bands": 118, "signal_quality": 0.94},
    }
    assert client.post("/api/v1/hardware/observations", json=payload).status_code == 202
    assert client.post("/api/v1/hardware/observations", json=payload).status_code == 409
    recent = client.get("/api/v1/hardware/observations/recent?limit=10").json()
    assert any(item["source_id"] == payload["source_id"] for item in recent["observations"])


def test_system_health_exposes_real_runtime_dependencies() -> None:
    response = client.get("/api/v1/system/health")
    assert response.status_code == 200
    body = response.json()
    names = {service["name"] for service in body["services"]}
    assert {"Event API", "Redis Shared Runtime", "Crowd Risk Model", "Simulation State", "Hardware Event Stream"} <= names
    assert body["status"] in {"READY", "DEGRADED"}
