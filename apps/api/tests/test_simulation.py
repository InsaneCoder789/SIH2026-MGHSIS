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
