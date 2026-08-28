from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.hardware import router as hardware_router
from app.api.ml import router as ml_router
from app.api.simulation import router as simulation_router
from app.api.system import router as system_router
from app.api.realtime import router as realtime_router
from app.core.postgres_runtime import postgres_runtime
from app.core.redis_runtime import redis_runtime


@asynccontextmanager
async def lifespan(_: FastAPI):
    redis_runtime.connect()
    postgres_runtime.connect()
    yield
    postgres_runtime.close()
    redis_runtime.close()

app = FastAPI(
    title="MGHSIS Core API",
    version="0.2.0",
    description="Local-first mass-gathering safety intelligence, onboard ML inference, and hardware-ready ingestion.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(ml_router)
app.include_router(hardware_router)
app.include_router(simulation_router)
app.include_router(system_router)
app.include_router(realtime_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "mghsis-api", "version": "0.2.0"}


@app.get("/api/v1/events/demo/digital-twin")
def demo_digital_twin() -> dict[str, object]:
    return {
        "event_id": "demo",
        "mode": "CRICKET_STADIUM",
        "status": "ML_READY",
        "message": "Digital Twin aggregation endpoint is online with onboard crowd-risk inference.",
    }
