from __future__ import annotations

import math
from datetime import datetime, timezone
from threading import Lock
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.ml.model import crowd_risk_model
from app.ml.schemas import CrowdObservation

router = APIRouter(prefix="/api/v1/simulation", tags=["event-simulation"])

ScenarioName = Literal["normal", "distress", "congestion", "breach", "gateway", "redirect"]

ZONE_CONFIG = {
    "M": (3600, 1200), "N": (4200, 1400), "P": (3800, 1260), "Q": (3900, 1300),
    "R": (3600, 1200), "J": (3200, 1060), "K": (3400, 1130), "C": (1600, 530),
    "D": (1700, 565), "E": (1300, 430), "F": (1400, 465), "G": (1650, 550),
    "H": (1500, 500), "B": (1600, 530), "SPW": (920, 305), "SPC": (980, 325),
    "SPE": (960, 320),
}


class ScenarioRequest(BaseModel):
    scenario: ScenarioName


class ActionRequest(BaseModel):
    action: Literal["RESTRICT_INFLOW", "OPEN_ALTERNATE_ROUTE", "REDIRECT_TO_ZONE", "DISPATCH_MEDICAL"]
    zone_id: str = Field(min_length=1, max_length=12)


class SimulationState:
    def __init__(self) -> None:
        self.lock = Lock()
        self.scenario: ScenarioName = "normal"
        self.running = False
        self.tick = 0
        self.action: str | None = None
        self.action_zone: str | None = None

    def reset(self) -> None:
        self.scenario = "normal"
        self.running = False
        self.tick = 0
        self.action = None
        self.action_zone = None

    def set_scenario(self, scenario: ScenarioName) -> None:
        self.scenario = scenario
        self.tick = 0
        self.action = None
        self.action_zone = None

    def _observation(self, zone_id: str, capacity: int, area: int) -> CrowdObservation:
        phase = self.tick * 0.22 + sum(ord(char) for char in zone_id) * 0.03
        wave = math.sin(phase) * 0.025
        pressure = 0.64 + wave
        inflow = 24.0 + math.sin(phase * 0.7) * 5
        outflow = 26.0 + math.cos(phase * 0.5) * 4
        speed = 0.84 + math.sin(phase * 0.4) * 0.07
        route_width = 4.8
        exits = 3
        falls = 0
        sos = 0
        gateway = 0.96

        if self.scenario == "congestion" and zone_id == "G":
            pressure = min(1.48, 1.03 + self.tick * 0.022 + wave)
            inflow, outflow, speed, route_width, exits = 76.0, 7.0, 0.22, 1.9, 1
        elif self.scenario == "redirect" and zone_id == "G":
            pressure = max(0.72, 1.28 - self.tick * 0.018 + wave)
            inflow, outflow, speed = 19.0, 38.0, 0.68
        elif self.scenario == "redirect" and zone_id == "F":
            pressure = min(1.12, 0.72 + self.tick * 0.009 + wave)
            inflow, outflow, speed = 42.0, 28.0, 0.61
        elif self.scenario == "distress" and zone_id == "B":
            pressure, speed, falls, sos = 0.92, 0.22, 2, 1
        elif self.scenario == "breach" and zone_id == "H":
            pressure, inflow, outflow = 1.04, 42.0, 19.0
        elif self.scenario == "gateway" and zone_id == "Q":
            pressure, gateway = 0.88, 0.48

        if self.action_zone == zone_id:
            if self.action == "RESTRICT_INFLOW":
                inflow *= 0.52
                pressure = max(0.72, pressure - 0.16)
            elif self.action == "OPEN_ALTERNATE_ROUTE":
                route_width, exits, outflow = route_width + 2.0, exits + 1, outflow * 1.45
                pressure = max(0.68, pressure - 0.20)
            elif self.action == "REDIRECT_TO_ZONE":
                inflow *= 0.58
                outflow *= 1.35
                pressure = max(0.64, pressure - 0.26)
            elif self.action == "DISPATCH_MEDICAL":
                falls, sos = max(0, falls - 1), max(0, sos - 1)

        count = max(1, round(capacity * max(0.08, pressure)))
        return CrowdObservation(
            event_id="virtual-live-event",
            zone_id=zone_id,
            area_m2=float(area),
            current_count=count,
            safe_capacity=capacity,
            inflow_per_min=max(0, inflow),
            outflow_per_min=max(0, outflow),
            average_speed_mps=max(0.12, speed),
            baseline_speed_mps=1.05,
            dwell_time_min=11 + max(0, pressure - 0.7) * 25,
            route_width_m=route_width,
            exit_count=exits,
            elderly_share=0.12,
            child_share=0.09,
            mobility_limited_share=0.04,
            heat_index_c=34.0,
            fall_cluster_5m=falls,
            sos_cluster_5m=sos,
            cctv_confidence=0.93,
            gateway_health=gateway,
            timestamp=datetime.now(timezone.utc),
        )

    def snapshot(self, advance: bool = True) -> dict[str, object]:
        if advance and self.running:
            self.tick += 1
        predictions = []
        for zone_id, (capacity, area) in ZONE_CONFIG.items():
            observation = self._observation(zone_id, capacity, area)
            predictions.append({
                "observation": observation.model_dump(mode="json"),
                "prediction": crowd_risk_model.predict(observation).model_dump(mode="json"),
            })
        scores = [item["prediction"]["score"] for item in predictions]
        return {
            "simulation_id": "virtual-live-event",
            "scenario": self.scenario,
            "running": self.running,
            "tick": self.tick,
            "simulated_time_seconds": self.tick * 15,
            "active_action": {"action": self.action, "zone_id": self.action_zone} if self.action else None,
            "model": crowd_risk_model.status(),
            "aggregate": {
                "peak_score": max(scores),
                "average_score": round(sum(scores) / len(scores), 1),
                "critical_zones": sum(1 for item in predictions if item["prediction"]["level"] == "CRITICAL"),
                "high_or_above": sum(1 for item in predictions if item["prediction"]["level"] in {"HIGH", "CRITICAL"}),
            },
            "zones": predictions,
        }


simulation = SimulationState()


@router.get("/state")
def simulation_state() -> dict[str, object]:
    with simulation.lock:
        return simulation.snapshot()


@router.post("/start")
def start_simulation() -> dict[str, object]:
    with simulation.lock:
        simulation.running = True
        return simulation.snapshot(advance=False)


@router.post("/pause")
def pause_simulation() -> dict[str, object]:
    with simulation.lock:
        simulation.running = False
        return simulation.snapshot(advance=False)


@router.post("/reset")
def reset_simulation() -> dict[str, object]:
    with simulation.lock:
        simulation.reset()
        return simulation.snapshot(advance=False)


@router.post("/scenario")
def choose_scenario(request: ScenarioRequest) -> dict[str, object]:
    with simulation.lock:
        simulation.set_scenario(request.scenario)
        simulation.running = True
        return simulation.snapshot(advance=False)


@router.post("/action")
def apply_simulated_action(request: ActionRequest) -> dict[str, object]:
    with simulation.lock:
        simulation.action = request.action
        simulation.action_zone = request.zone_id
        return simulation.snapshot(advance=False)
