from __future__ import annotations

from collections import deque
from datetime import datetime, timezone
from threading import Lock
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.core.postgres_runtime import postgres_runtime
from app.core.redis_runtime import redis_runtime
from app.ml.schemas import HardwareObservation

router = APIRouter(prefix="/api/v1/hardware", tags=["hardware-ingestion"])
_observations: deque[dict[str, object]] = deque(maxlen=500)
_last_sequence: dict[str, int] = {}
_lock = Lock()
HARDWARE_HISTORY_KEY = f"{settings.redis_prefix}:hardware:observations:recent"
HARDWARE_CHANNEL = f"{settings.redis_prefix}:events:hardware"


def _sequence_key(source_id: str) -> str:
    return f"{settings.redis_prefix}:hardware:sequence:{source_id}"


@router.post("/observations", status_code=202)
def ingest_hardware_observation(observation: HardwareObservation) -> dict[str, object]:
    sequence_key = _sequence_key(observation.source_id)
    with redis_runtime.lock(f"{sequence_key}:lock") as shared_lock:
        if redis_runtime.available and not shared_lock:
            raise HTTPException(status_code=503, detail="Shared ingestion state is busy; retry the observation")
        with _lock:
            shared_sequence = redis_runtime.get_text(sequence_key) if shared_lock else None
            last_sequence = int(shared_sequence) if shared_sequence is not None else _last_sequence.get(observation.source_id, -1)
            if observation.sequence <= last_sequence:
                raise HTTPException(status_code=409, detail=f"Sequence must be greater than {last_sequence} for {observation.source_id}")
            _last_sequence[observation.source_id] = observation.sequence
            record = {
                "ingestion_id": str(uuid4()),
                "received_at": datetime.now(timezone.utc).isoformat(),
                **observation.model_dump(mode="json"),
            }
            _observations.append(record)
            postgres_runtime.record_hardware_observation(record)
            if shared_lock:
                redis_runtime.record_hardware_event(
                    sequence_key,
                    observation.sequence,
                    HARDWARE_HISTORY_KEY,
                    record,
                    settings.hardware_history_limit,
                    HARDWARE_CHANNEL,
                )
    return {
        "accepted": True,
        "ingestion_id": record["ingestion_id"],
        "source_id": observation.source_id,
        "sequence": observation.sequence,
        "processing_state": "VALIDATED",
    }


@router.get("/observations/recent")
def recent_hardware_observations(limit: int = 50) -> dict[str, object]:
    if limit < 1 or limit > 500:
        raise HTTPException(status_code=422, detail="limit must be between 1 and 500")
    shared_records = redis_runtime.recent_json(HARDWARE_HISTORY_KEY, limit)
    runtime = "REDIS"
    if shared_records is None:
        shared_records = postgres_runtime.recent_hardware_observations(limit)
        runtime = "POSTGRESQL"
    if shared_records is None:
        with _lock:
            shared_records = list(_observations)[-limit:]
        runtime = "LOCAL_FALLBACK"
    return {
        "count": len(shared_records),
        "observations": shared_records,
        "shared_runtime": runtime,
    }


@router.get("/contracts")
def hardware_contracts() -> dict[str, object]:
    return {
        "supported_sources": ["CCTV", "BLE_GATEWAY", "RFID_GATE", "MANUAL", "SIMULATOR"],
        "transport": ["REST_JSON", "REDIS_PUBSUB", "future:MQTT", "future:BLE_GATEWAY_BRIDGE"],
        "ordering": "Monotonic source-local sequence number",
        "identity_scope": "Event-scoped device identity; no facial recognition",
        "location_precision": "Zone and segment only; no GPS claim",
        "security_next_steps": ["mutual TLS", "device provisioning", "signed firmware", "key rotation", "replay protection"],
    }
