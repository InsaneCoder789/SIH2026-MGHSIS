from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.core.redis_runtime import redis_runtime
from app.ml.model import crowd_risk_model

router = APIRouter(prefix="/api/v1/system", tags=["system-runtime"])


def runtime_health() -> dict[str, object]:
    redis_service = redis_runtime.diagnostics()
    try:
        crowd_risk_model.status()
        model_service = {
            "name": "Crowd Risk Model",
            "group": "INTELLIGENCE",
            "status": "HEALTHY",
            "health": 100,
            "latency_ms": 1,
            "required": True,
            "detail": "Onboard model artifact loaded and ready for inference",
        }
    except (FileNotFoundError, RuntimeError) as error:
        model_service = {
            "name": "Crowd Risk Model",
            "group": "INTELLIGENCE",
            "status": "OFFLINE",
            "health": 0,
            "latency_ms": 0,
            "required": True,
            "detail": str(error),
        }
    services = [
        {
            "name": "Event API",
            "group": "CORE",
            "status": "HEALTHY",
            "health": 100,
            "latency_ms": 1,
            "required": True,
            "detail": "FastAPI request and validation layer",
        },
        redis_service,
        model_service,
        {
            "name": "Simulation State",
            "group": "SIMULATION",
            "status": redis_service["status"],
            "health": redis_service["health"],
            "latency_ms": redis_service["latency_ms"],
            "required": True,
            "detail": "Redis-backed Digital Twin control state and latest scored snapshot",
        },
        {
            "name": "Hardware Event Stream",
            "group": "INGESTION",
            "status": redis_service["status"],
            "health": redis_service["health"],
            "latency_ms": redis_service["latency_ms"],
            "required": True,
            "detail": "Ordered sensor ingestion, recent history and pub/sub fan-out",
        },
    ]
    ready = all(service["status"] == "HEALTHY" for service in services if service["required"])
    return {"status": "READY" if ready else "DEGRADED", "ready": ready, "services": services}


@router.get("/health")
def system_health() -> dict[str, object]:
    return runtime_health()


@router.get("/readiness")
def readiness() -> dict[str, object]:
    health = runtime_health()
    if not health["ready"]:
        raise HTTPException(status_code=503, detail=health)
    return health
