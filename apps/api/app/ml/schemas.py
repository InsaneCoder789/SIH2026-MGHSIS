from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field, model_validator

EventType = Literal["CRICKET_STADIUM", "CONCERT", "PILGRIMAGE"]


class CrowdObservation(BaseModel):
    event_id: str = "demo"
    zone_id: str = Field(min_length=1, max_length=24)
    event_type: EventType = "CRICKET_STADIUM"
    area_m2: float = Field(gt=0, le=100_000)
    current_count: int = Field(ge=0, le=1_000_000)
    safe_capacity: int = Field(gt=0, le=1_000_000)
    inflow_per_min: float = Field(ge=0, le=10_000)
    outflow_per_min: float = Field(ge=0, le=10_000)
    average_speed_mps: float = Field(ge=0, le=10)
    baseline_speed_mps: float = Field(default=1.25, gt=0, le=10)
    dwell_time_min: float = Field(ge=0, le=1_440)
    route_width_m: float = Field(gt=0, le=100)
    exit_count: int = Field(ge=0, le=100)
    elderly_share: float = Field(ge=0, le=1)
    child_share: float = Field(ge=0, le=1)
    mobility_limited_share: float = Field(ge=0, le=1)
    heat_index_c: float = Field(ge=-20, le=70)
    fall_cluster_5m: int = Field(ge=0, le=1_000)
    sos_cluster_5m: int = Field(ge=0, le=1_000)
    cctv_confidence: float = Field(ge=0, le=1)
    gateway_health: float = Field(ge=0, le=1)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @model_validator(mode="after")
    def validate_crowd_mix(self) -> "CrowdObservation":
        if self.elderly_share + self.child_share + self.mobility_limited_share > 1.5:
            raise ValueError("crowd composition shares are implausibly high")
        return self


class RiskReason(BaseModel):
    factor: str
    value: float
    severity: Literal["LOW", "MODERATE", "HIGH", "CRITICAL"]
    explanation: str


class CrowdRiskPrediction(BaseModel):
    event_id: str
    zone_id: str
    score: float
    level: Literal["LOW", "MODERATE", "HIGH", "CRITICAL"]
    confidence: float
    trend: Literal["FALLING", "STABLE", "RISING", "RISING_FAST"]
    probabilities: dict[str, float]
    reasons: list[RiskReason]
    recommended_actions: list[str]
    model_version: str
    timestamp: datetime
    advisory_only: bool = True


class HardwareObservation(BaseModel):
    source_id: str = Field(min_length=1, max_length=64)
    source_type: Literal["CCTV", "BLE_GATEWAY", "RFID_GATE", "MANUAL", "SIMULATOR"]
    event_id: str
    zone_id: str
    captured_at: datetime
    sequence: int = Field(ge=0)
    payload: dict[str, float | int | str | bool | None]

