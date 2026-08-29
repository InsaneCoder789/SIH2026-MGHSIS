from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def block_g(body: dict[str, object]) -> dict[str, object]:
    return next(item for item in body["zones"] if item["prediction"]["zone_id"] == "G")  # type: ignore[index,return-value]


def test_congestion_escalates_and_redirect_reduces_risk() -> None:
    client.post("/api/v1/simulation/reset")
    started = client.post("/api/v1/simulation/scenario", json={"scenario": "congestion"}).json()
    initial_score = block_g(started)["prediction"]["score"]

    latest = started
    for _ in range(4):
        latest = client.get("/api/v1/simulation/state").json()
    assert latest["tick"] == 4
    assert block_g(latest)["prediction"]["level"] == "CRITICAL"

    client.post("/api/v1/simulation/action", json={"action": "REDIRECT_TO_ZONE", "zone_id": "G"})
    recovered = client.get("/api/v1/simulation/state").json()
    assert recovered["active_action"]["action"] == "REDIRECT_TO_ZONE"
    assert block_g(recovered)["prediction"]["score"] < block_g(latest)["prediction"]["score"]
    assert block_g(recovered)["prediction"]["score"] < initial_score + 10


def test_snapshot_exposes_three_engine_sensor_fusion() -> None:
    client.post("/api/v1/simulation/reset")
    state = client.get("/api/v1/simulation/state").json()
    assert state["aggregate"]["authenticated_population"] == 49_483
    zone = block_g(state)
    assert set(zone["risk_engines"]) == {"human", "crowd", "integrity", "overall"}
    assert set(zone["fusion"]) >= {
        "expected_population", "authenticated_population", "observed_population",
        "largest_variance", "population_state", "cctv_confidence", "gateway_health",
    }
    assert zone["forecast"]["horizon_minutes"] == 5


def test_intervention_verification_is_derived_from_post_action_state() -> None:
    client.post("/api/v1/simulation/reset")
    client.post("/api/v1/simulation/scenario", json={"scenario": "congestion"})
    for _ in range(4):
        client.get("/api/v1/simulation/state")
    response = client.post(
        "/api/v1/simulation/action",
        json={"action": "REDIRECT_TO_ZONE", "zone_id": "G"},
    )
    assert response.status_code == 200
    verification = response.json()["verification"]
    assert verification["result"] == "EFFECTIVE"
    assert verification["delta"]["risk"] < 0
    assert verification["current"]["risk"] < verification["baseline"]["risk"]
    assert response.json()["aggregate"]["authenticated_population"] == 49_483


def test_repeated_intervention_preserves_original_verification_baseline() -> None:
    client.post("/api/v1/simulation/reset")
    client.post("/api/v1/simulation/scenario", json={"scenario": "congestion"})
    for _ in range(4):
        client.get("/api/v1/simulation/state")

    first = client.post(
        "/api/v1/simulation/action",
        json={"action": "REDIRECT_TO_ZONE", "zone_id": "G"},
    ).json()
    original_baseline = first["verification"]["baseline"]
    for _ in range(3):
        client.get("/api/v1/simulation/state")

    repeated = client.post(
        "/api/v1/simulation/action",
        json={"action": "REDIRECT_TO_ZONE", "zone_id": "G"},
    ).json()

    assert repeated["verification"]["baseline"] == original_baseline
