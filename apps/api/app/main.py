from fastapi import FastAPI

app = FastAPI(
    title="MGHSIS Core API",
    version="0.1.0",
    description="FastAPI core for the local-first mass-gathering safety intelligence prototype.",
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "mghsis-api"}


@app.get("/api/v1/events/demo/digital-twin")
def demo_digital_twin() -> dict[str, object]:
    return {
        "event_id": "demo",
        "mode": "CRICKET_STADIUM",
        "status": "BOOTSTRAPPED",
        "message": "Digital Twin API skeleton ready for Phase 3 implementation.",
    }
