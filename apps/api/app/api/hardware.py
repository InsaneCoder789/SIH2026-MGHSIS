from __future__ import annotations

from collections import deque
from datetime import datetime, timezone
from threading import Lock
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from app.ml.schemas import HardwareObservation

router = APIRouter(prefix="/api/v1/hardware", tags=["hardware-ingestion"])
_observations: deque[dict[str, object]] = deque(maxlen=500)
_last_sequence: dict[str, int] = {}
_lock = Lock()


@router.post("/observations", status_code=202)
def ingest_hardware_observation(observation: HardwareObservation) -> dict[str, object]:
    with _lock:
        last_sequence = _last_sequence.get(observation.source_id, -1)
        if observation.sequence <= last_sequence:
            raise HTTPException(status_code=409, detail=f"Sequence must be greater than {last_sequence} for {observation.source_id}")
        _last_sequence[observation.source_id] = observation.sequence
        record = {
            "ingestion_id": str(uuid4()),
            "received_at": datetime.now(timezone.utc).isoformat(),
            **observation.model_dump(mode="json"),
        }
        _observations.append(record)
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
    with _lock:
        records = list(_observations)[-limit:]
    return {"count": len(records), "observations": records}


@router.get("/contracts")
def hardware_contracts() -> dict[str, object]:
    return {
        "supported_sources": ["CCTV", "BLE_GATEWAY", "RFID_GATE", "MANUAL", "SIMULATOR"],
        "transport": ["REST_JSON", "future:MQTT", "future:BLE_GATEWAY_BRIDGE"],
        "ordering": "Monotonic source-local sequence number",
        "identity_scope": "Event-scoped device identity; no facial recognition",
        "location_precision": "Zone and segment only; no GPS claim",
        "security_next_steps": ["mutual TLS", "device provisioning", "signed firmware", "key rotation", "replay protection"],
    }

