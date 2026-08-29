from __future__ import annotations

import math
from datetime import datetime, timezone
from threading import Lock
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.redis_runtime import redis_runtime
from app.ml.model import crowd_risk_model
from app.ml.schemas import CrowdObservation

router = APIRouter(prefix="/api/v1/simulation", tags=["event-simulation"])

ScenarioName = Literal["normal", "distress", "congestion", "breach", "gateway", "redirect"]

ZONE_CONFIG = {
    "M": (4280, 1200), "N": (5020, 1400), "P": (4520, 1260), "Q": (4640, 1300),
    "R": (4280, 1200), "J": (3810, 1060), "K": (4050, 1130), "L": (3210, 900),
    "C": (1900, 530),
    "D": (2020, 565), "E": (1550, 430), "F": (1670, 465), "G": (1960, 550),
    "H": (1790, 500), "B": (1900, 530), "SPW": (1090, 305), "SPC": (1170, 325),
    "SPE": (1140, 320),
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
        self.verification_baseline: dict[str, object] | None = None

    def reset(self) -> None:
        self.scenario = "normal"
        self.running = False
        self.tick = 0
        self.action = None
        self.action_zone = None
        self.verification_baseline = None

    def set_scenario(self, scenario: ScenarioName) -> None:
        self.scenario = scenario
        self.tick = 0
        self.action = None
        self.action_zone = None
        self.verification_baseline = None

    def export_control_state(self) -> dict[str, object]:
        return {
            "scenario": self.scenario,
            "running": self.running,
            "tick": self.tick,
            "action": self.action,
            "action_zone": self.action_zone,
            "verification_baseline": self.verification_baseline,
        }

    def restore_control_state(self, state: dict[str, object]) -> None:
        scenario = state.get("scenario")
        if scenario in {"normal", "distress", "congestion", "breach", "gateway", "redirect"}:
            self.scenario = scenario  # type: ignore[assignment]
        self.running = bool(state.get("running", False))
        self.tick = max(0, int(state.get("tick", 0)))
        action = state.get("action")
        self.action = str(action) if action else None
        action_zone = state.get("action_zone")
        self.action_zone = str(action_zone) if action_zone else None
        baseline = state.get("verification_baseline")
        self.verification_baseline = baseline if isinstance(baseline, dict) else None

    def _observation(self, zone_id: str, capacity: int, area: int) -> CrowdObservation:
        phase = self.tick * 0.22 + sum(ord(char) for char in zone_id) * 0.03
        wave = math.sin(phase) * 0.025
        pressure = 0.98966 + wave * 0.04
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
            pressure, inflow, outflow = 1.32, 84.0, 19.0
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

    @staticmethod
    def _risk_level(score: float) -> str:
        if score >= 75:
            return "CRITICAL"
        if score >= 55:
            return "HIGH"
        if score >= 30:
            return "MODERATE"
        return "LOW"

    def _fused_zone(self, observation: CrowdObservation, prediction: object) -> dict[str, object]:
        zone_id = observation.zone_id
        expected = round(observation.safe_capacity * 0.99)
        authenticated = round(observation.safe_capacity * 0.98966)
        if self.scenario == "congestion" and zone_id == "G":
            authenticated = min(observation.current_count, authenticated + round(self.tick * 22))
        elif self.scenario == "breach" and zone_id == "H":
            authenticated = expected - 9
        elif self.scenario == "gateway" and zone_id == "Q":
            authenticated = round(expected * 0.62)
        elif self.scenario == "redirect" and zone_id in {"F", "G"}:
            authenticated = min(observation.current_count, round(observation.current_count * 0.985))

        observed = observation.current_count
        largest_variance = max(abs(observed - authenticated), abs(observed - expected))
        variance_ratio = largest_variance / max(1, observation.safe_capacity)
        integrity_score = min(
            100.0,
            variance_ratio * 220
            + max(0.0, 0.88 - observation.cctv_confidence) * 45
            + (1.0 - observation.gateway_health) * 75,
        )
        human_score = min(
            100.0,
            observation.fall_cluster_5m * 24
            + observation.sos_cluster_5m * 34
            + max(0.0, 0.48 - observation.average_speed_mps) * 32
            + max(0.0, observation.heat_index_c - 36) * 2,
        )
        crowd_score = float(getattr(prediction, "score"))
        overall_score = min(
            100.0,
            max(
                crowd_score * 0.64 + integrity_score * 0.24 + human_score * 0.12,
                human_score * 0.9,
                integrity_score * 0.92,
            ),
        )
        accumulation = observation.inflow_per_min - observation.outflow_per_min
        projected_count = max(0, round(observed + accumulation * 5))
        projected_utilization = projected_count / max(1, observation.safe_capacity)

        return {
            "fusion": {
                "expected_population": expected,
                "authenticated_population": authenticated,
                "observed_population": observed,
                "largest_variance": largest_variance,
                "variance_percent": round(variance_ratio * 100, 1),
                "cctv_confidence": observation.cctv_confidence,
                "gateway_health": observation.gateway_health,
                "population_state": "MISMATCH" if integrity_score >= 55 else "WATCH" if integrity_score >= 30 else "ALIGNED",
            },
            "risk_engines": {
                "human": {"score": round(human_score, 1), "level": self._risk_level(human_score)},
                "crowd": {"score": round(crowd_score, 1), "level": getattr(prediction, "level")},
                "integrity": {"score": round(integrity_score, 1), "level": self._risk_level(integrity_score)},
                "overall": {"score": round(overall_score, 1), "level": self._risk_level(overall_score)},
            },
            "forecast": {
                "horizon_minutes": 5,
                "projected_population": projected_count,
                "projected_utilization_percent": round(projected_utilization * 100, 1),
                "net_flow_per_min": round(accumulation, 1),
                "direction": "RISING_FAST" if accumulation >= 18 else "RISING" if accumulation >= 5 else "FALLING" if accumulation <= -5 else "STABLE",
            },
        }

    def _verification(self, zones: list[dict[str, object]]) -> dict[str, object] | None:
        baseline = self.verification_baseline
        if not baseline or not self.action_zone:
            return None
        current = next((item for item in zones if item["prediction"]["zone_id"] == self.action_zone), None)  # type: ignore[index]
        if current is None:
            return None
        current_observation = current["observation"]  # type: ignore[index]
        current_risk = current["risk_engines"]["overall"]["score"]  # type: ignore[index]
        risk_delta = round(float(current_risk) - float(baseline["risk"]), 1)
        reduction = -risk_delta
        inflow_delta = round(float(current_observation["inflow_per_min"]) - float(baseline["inflow_per_min"]), 1)
        outflow_delta = round(float(current_observation["outflow_per_min"]) - float(baseline["outflow_per_min"]), 1)
        flow_improvement = -inflow_delta + outflow_delta
        result = (
            "EFFECTIVE" if reduction >= 15 or (flow_improvement >= 20 and risk_delta <= 2)
            else "PARTIALLY_EFFECTIVE" if reduction >= 5 or flow_improvement >= 8
            else "INEFFECTIVE" if risk_delta >= 3
            else "INCONCLUSIVE"
        )
        return {
            "action": self.action,
            "zone_id": self.action_zone,
            "result": result,
            "elapsed_simulated_seconds": max(15, (self.tick - int(baseline["tick"])) * 15),
            "baseline": baseline,
            "current": {
                "risk": current_risk,
                "population": current_observation["current_count"],
                "inflow_per_min": current_observation["inflow_per_min"],
                "outflow_per_min": current_observation["outflow_per_min"],
            },
            "delta": {
                "risk": risk_delta,
                "population": int(current_observation["current_count"]) - int(baseline["population"]),
                "inflow_per_min": inflow_delta,
                "outflow_per_min": outflow_delta,
            },
        }

    def _normalize_authenticated_population(self, zones: list[dict[str, object]]) -> None:
        if self.scenario == "gateway":
            return
        target = 49_483
        current = sum(int(item["fusion"]["authenticated_population"]) for item in zones)  # type: ignore[index]
        if current <= 0 or current == target:
            return
        scaled = [int(int(item["fusion"]["authenticated_population"]) * target / current) for item in zones]  # type: ignore[index]
        remainder = target - sum(scaled)
        for index, item in enumerate(zones):
            item["fusion"]["authenticated_population"] = scaled[index] + (1 if index < remainder else 0)  # type: ignore[index]
            fusion = item["fusion"]  # type: ignore[index]
            observation = item["observation"]  # type: ignore[index]
            largest_variance = max(
                abs(int(fusion["observed_population"]) - int(fusion["authenticated_population"])),
                abs(int(fusion["observed_population"]) - int(fusion["expected_population"])),
            )
            variance_ratio = largest_variance / max(1, int(observation["safe_capacity"]))
            integrity_score = min(
                100.0,
                variance_ratio * 220
                + max(0.0, 0.88 - float(fusion["cctv_confidence"])) * 45
                + (1.0 - float(fusion["gateway_health"])) * 75,
            )
            engines = item["risk_engines"]  # type: ignore[index]
            human_score = float(engines["human"]["score"])
            crowd_score = float(engines["crowd"]["score"])
            overall_score = min(
                100.0,
                max(
                    crowd_score * 0.64 + integrity_score * 0.24 + human_score * 0.12,
                    human_score * 0.9,
                    integrity_score * 0.92,
                ),
            )
            fusion["largest_variance"] = largest_variance
            fusion["variance_percent"] = round(variance_ratio * 100, 1)
            fusion["population_state"] = "MISMATCH" if integrity_score >= 55 else "WATCH" if integrity_score >= 30 else "ALIGNED"
            engines["integrity"] = {"score": round(integrity_score, 1), "level": self._risk_level(integrity_score)}
            engines["overall"] = {"score": round(overall_score, 1), "level": self._risk_level(overall_score)}

    def snapshot(self, advance: bool = True) -> dict[str, object]:
        if advance and self.running:
            self.tick += 1
        observations = []
        for zone_id, (capacity, area) in ZONE_CONFIG.items():
            observation = self._observation(zone_id, capacity, area)
            observations.append(observation)
        predictions = []
        for observation, prediction in zip(observations, crowd_risk_model.predict_many(observations), strict=True):
            predictions.append({
                "observation": observation.model_dump(mode="json"),
                "prediction": prediction.model_dump(mode="json"),
                **self._fused_zone(observation, prediction),
            })
        self._normalize_authenticated_population(predictions)
        scores = [item["prediction"]["score"] for item in predictions]
        expected_total = sum(item["fusion"]["expected_population"] for item in predictions)
        authenticated_total = sum(item["fusion"]["authenticated_population"] for item in predictions)
        observed_total = sum(item["fusion"]["observed_population"] for item in predictions)
        verification = self._verification(predictions)
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
                "critical_zones": sum(1 for item in predictions if item["risk_engines"]["overall"]["level"] == "CRITICAL"),
                "high_or_above": sum(1 for item in predictions if item["risk_engines"]["overall"]["level"] in {"HIGH", "CRITICAL"}),
                "expected_population": expected_total,
                "authenticated_population": authenticated_total,
                "observed_population": observed_total,
                "population_variance": observed_total - authenticated_total,
                "overall_peak_score": max(item["risk_engines"]["overall"]["score"] for item in predictions),
            },
            "zones": predictions,
            "verification": verification,
        }


simulation = SimulationState()
SIMULATION_STATE_KEY = f"{settings.redis_prefix}:simulation:virtual-live-event:control"
SIMULATION_SNAPSHOT_KEY = f"{settings.redis_prefix}:simulation:virtual-live-event:snapshot"
SIMULATION_LOCK_KEY = f"{settings.redis_prefix}:locks:simulation:virtual-live-event"
SIMULATION_CHANNEL = f"{settings.redis_prefix}:events:simulation"


def _simulation_response(operation: str, update: object | None = None, advance: bool = False) -> dict[str, object]:
    with redis_runtime.lock(SIMULATION_LOCK_KEY) as shared_lock:
        if redis_runtime.available and not shared_lock:
            raise HTTPException(status_code=503, detail="Shared simulation state is busy; retry the command")
        with simulation.lock:
            if shared_lock:
                shared_state = redis_runtime.get_json(SIMULATION_STATE_KEY)
                if shared_state:
                    simulation.restore_control_state(shared_state)
            if callable(update):
                update()
            snapshot = simulation.snapshot(advance=advance)
            if shared_lock:
                redis_runtime.transaction_json(
                    [
                        (SIMULATION_STATE_KEY, simulation.export_control_state(), None),
                        (SIMULATION_SNAPSHOT_KEY, snapshot, settings.redis_snapshot_ttl_seconds),
                    ],
                    SIMULATION_CHANNEL,
                    {
                        "operation": operation,
                        "simulation_id": snapshot["simulation_id"],
                        "scenario": snapshot["scenario"],
                        "running": snapshot["running"],
                        "tick": snapshot["tick"],
                        "active_action": snapshot["active_action"],
                    },
                )
            snapshot["shared_runtime"] = "REDIS" if shared_lock and redis_runtime.available else "LOCAL_FALLBACK"
            return snapshot


@router.get("/state")
def simulation_state() -> dict[str, object]:
    return _simulation_response("TICK", advance=True)


@router.post("/start")
def start_simulation() -> dict[str, object]:
    return _simulation_response("START", lambda: setattr(simulation, "running", True))


@router.post("/pause")
def pause_simulation() -> dict[str, object]:
    return _simulation_response("PAUSE", lambda: setattr(simulation, "running", False))


@router.post("/reset")
def reset_simulation() -> dict[str, object]:
    return _simulation_response("RESET", simulation.reset)


@router.post("/scenario")
def choose_scenario(request: ScenarioRequest) -> dict[str, object]:
    def update() -> None:
        simulation.set_scenario(request.scenario)
        simulation.running = True
    return _simulation_response("SCENARIO_SELECTED", update)


@router.post("/action")
def apply_simulated_action(request: ActionRequest) -> dict[str, object]:
    def update() -> None:
        if (
            simulation.action == request.action
            and simulation.action_zone == request.zone_id
            and simulation.verification_baseline is not None
        ):
            return
        baseline_snapshot = simulation.snapshot(advance=False)
        baseline_zone = next((item for item in baseline_snapshot["zones"] if item["prediction"]["zone_id"] == request.zone_id), None)  # type: ignore[index]
        if baseline_zone is None:
            raise HTTPException(status_code=404, detail=f"Unknown simulation zone {request.zone_id}")
        simulation.verification_baseline = {
            "tick": simulation.tick,
            "risk": baseline_zone["risk_engines"]["overall"]["score"],
            "population": baseline_zone["observation"]["current_count"],
            "inflow_per_min": baseline_zone["observation"]["inflow_per_min"],
            "outflow_per_min": baseline_zone["observation"]["outflow_per_min"],
        }
        simulation.action = request.action
        simulation.action_zone = request.zone_id
    return _simulation_response("ACTION_APPLIED", update)
