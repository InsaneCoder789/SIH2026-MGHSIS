from __future__ import annotations

import json
from pathlib import Path
from threading import Lock

import joblib
import numpy as np

from .features import EVENT_TYPE_CODES, FEATURE_NAMES, RISK_LABELS, RISK_MIDPOINTS
from .schemas import CrowdObservation, CrowdRiskPrediction, RiskReason

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_ARTIFACT = ROOT / "artifacts" / "crowd-risk-model.joblib"
DEFAULT_METRICS = ROOT / "artifacts" / "crowd-risk-metrics.json"


def observation_to_features(observation: CrowdObservation) -> np.ndarray:
    density = observation.current_count / observation.area_m2
    utilization = observation.current_count / observation.safe_capacity
    accumulation = observation.inflow_per_min - observation.outflow_per_min
    speed_drop = max(0.0, min(1.0, (observation.baseline_speed_mps - observation.average_speed_mps) / observation.baseline_speed_mps))
    values = {
        "event_type_code": EVENT_TYPE_CODES[observation.event_type],
        "area_m2": observation.area_m2,
        "current_count": observation.current_count,
        "safe_capacity": observation.safe_capacity,
        "density_per_m2": density,
        "capacity_utilization": utilization,
        "inflow_per_min": observation.inflow_per_min,
        "outflow_per_min": observation.outflow_per_min,
        "accumulation_per_min": accumulation,
        "average_speed_mps": observation.average_speed_mps,
        "speed_drop_ratio": speed_drop,
        "dwell_time_min": observation.dwell_time_min,
        "route_width_m": observation.route_width_m,
        "exit_count": observation.exit_count,
        "elderly_share": observation.elderly_share,
        "child_share": observation.child_share,
        "mobility_limited_share": observation.mobility_limited_share,
        "heat_index_c": observation.heat_index_c,
        "fall_cluster_5m": observation.fall_cluster_5m,
        "sos_cluster_5m": observation.sos_cluster_5m,
        "cctv_confidence": observation.cctv_confidence,
        "gateway_health": observation.gateway_health,
    }
    return np.array([[float(values[name]) for name in FEATURE_NAMES]], dtype=np.float64)


def explain_observation(observation: CrowdObservation) -> list[RiskReason]:
    density = observation.current_count / observation.area_m2
    utilization = observation.current_count / observation.safe_capacity
    accumulation = observation.inflow_per_min - observation.outflow_per_min
    speed_drop = max(0.0, (observation.baseline_speed_mps - observation.average_speed_mps) / observation.baseline_speed_mps)
    factors: list[tuple[str, float, str]] = [
        ("capacity_utilization", utilization, f"Zone occupancy is {utilization * 100:.0f}% of configured safe capacity."),
        ("density", density / 4.0, f"Estimated density is {density:.2f} people per m²."),
        ("accumulation", max(0, accumulation) / 45.0, f"Net accumulation is {accumulation:+.1f} people per minute."),
        ("movement_slowdown", speed_drop, f"Average movement is {observation.average_speed_mps:.2f} m/s against a {observation.baseline_speed_mps:.2f} m/s baseline."),
        ("route_constraint", max(0, 5 - observation.route_width_m) / 4.0, f"Usable route width is {observation.route_width_m:.1f} m with {observation.exit_count} exits."),
        ("fall_sos_cluster", min(1, (observation.fall_cluster_5m + observation.sos_cluster_5m) / 7), f"Five-minute cluster contains {observation.fall_cluster_5m} falls and {observation.sos_cluster_5m} SOS signals."),
        ("crowd_composition", min(1, observation.elderly_share * 1.2 + observation.mobility_limited_share * 2.5), "Crowd composition increases the need for slower, accessible routing."),
        ("heat_load", max(0, observation.heat_index_c - 30) / 16, f"Heat index is {observation.heat_index_c:.1f}°C."),
    ]
    reasons: list[RiskReason] = []
    for factor, raw, explanation in sorted(factors, key=lambda item: item[1], reverse=True)[:5]:
        value = float(max(0, min(1.5, raw)))
        level = "CRITICAL" if value >= 0.95 else "HIGH" if value >= 0.72 else "MODERATE" if value >= 0.43 else "LOW"
        reasons.append(RiskReason(factor=factor, value=round(value, 3), severity=level, explanation=explanation))
    return reasons


def recommended_actions(observation: CrowdObservation, level: str) -> list[str]:
    if level == "LOW":
        return ["OBSERVE_ONLY"]
    accumulation = observation.inflow_per_min - observation.outflow_per_min
    actions: list[str] = []
    if accumulation > 8 or observation.current_count / observation.safe_capacity > 0.9:
        actions.append("RESTRICT_INFLOW")
    if observation.route_width_m < 3.5 or observation.exit_count < 2:
        actions.extend(["OPEN_ALTERNATE_ROUTE", "UPDATE_SIGNAGE"])
    if observation.fall_cluster_5m + observation.sos_cluster_5m >= 3:
        actions.append("DISPATCH_MEDICAL")
    if observation.average_speed_mps < 0.55:
        actions.append("REDIRECT_TO_ZONE")
    return list(dict.fromkeys(actions or ["OBSERVE_ONLY"]))


class CrowdRiskModel:
    def __init__(self, artifact_path: Path = DEFAULT_ARTIFACT, metrics_path: Path = DEFAULT_METRICS):
        self.artifact_path = artifact_path
        self.metrics_path = metrics_path
        self._bundle: dict[str, object] | None = None
        self._metrics: dict[str, object] = {}
        self._lock = Lock()

    def load(self) -> dict[str, object]:
        if self._bundle is None:
            with self._lock:
                if self._bundle is None:
                    if not self.artifact_path.exists():
                        raise FileNotFoundError(f"Crowd model missing at {self.artifact_path}. Run python -m app.ml.train")
                    bundle = joblib.load(self.artifact_path)
                    if bundle.get("feature_names") != FEATURE_NAMES:
                        raise RuntimeError("Crowd model feature contract does not match this API version")
                    if bundle.get("risk_labels") != RISK_LABELS:
                        raise RuntimeError("Crowd model risk-label contract does not match this API version")
                    model = bundle.get("model")
                    model_classes = [int(value) for value in getattr(model, "classes_", [])]
                    if model_classes != list(range(len(RISK_LABELS))):
                        raise RuntimeError("Crowd model probability classes are incomplete or out of order")
                    self._bundle = bundle
                    self._metrics = json.loads(self.metrics_path.read_text(encoding="utf-8")) if self.metrics_path.exists() else {}
        return self._bundle

    def status(self) -> dict[str, object]:
        bundle = self.load()
        return {
            "ready": True,
            "model_version": bundle["model_version"],
            "model_type": bundle["model_type"],
            "feature_count": len(FEATURE_NAMES),
            "training_rows": bundle["training_rows"],
            "testing_rows": bundle["testing_rows"],
            "split": "80/20 stratified holdout",
            "metrics": self._metrics,
            "synthetic_only": True,
        }

    def _prediction_from_probabilities(self, observation: CrowdObservation, probabilities_raw: np.ndarray, bundle: dict[str, object]) -> CrowdRiskPrediction:
        model = bundle["model"]
        class_probabilities = {int(class_id): float(value) for class_id, value in zip(model.classes_, probabilities_raw, strict=True)}
        probabilities = {label: class_probabilities[index] for index, label in enumerate(RISK_LABELS)}
        level = max(probabilities, key=probabilities.get)  # type: ignore[arg-type]
        score = sum(probabilities[label] * RISK_MIDPOINTS[label] for label in RISK_LABELS)
        accumulation = observation.inflow_per_min - observation.outflow_per_min
        trend = "RISING_FAST" if accumulation >= 18 else "RISING" if accumulation >= 5 else "FALLING" if accumulation <= -5 else "STABLE"
        return CrowdRiskPrediction(
            event_id=observation.event_id,
            zone_id=observation.zone_id,
            score=round(score, 1),
            level=level,  # type: ignore[arg-type]
            confidence=round(max(probabilities.values()), 4),
            trend=trend,
            probabilities={key: round(value, 4) for key, value in probabilities.items()},
            reasons=explain_observation(observation),
            recommended_actions=recommended_actions(observation, level),
            model_version=str(bundle["model_version"]),
            timestamp=observation.timestamp,
        )

    def predict_many(self, observations: list[CrowdObservation]) -> list[CrowdRiskPrediction]:
        if not observations:
            return []
        bundle = self.load()
        model = bundle["model"]
        matrix = np.vstack([observation_to_features(observation)[0] for observation in observations])
        if not np.isfinite(matrix).all():
            raise ValueError("Crowd observation features must all be finite numbers")
        return [self._prediction_from_probabilities(observation, probabilities, bundle) for observation, probabilities in zip(observations, model.predict_proba(matrix), strict=True)]

    def predict(self, observation: CrowdObservation) -> CrowdRiskPrediction:
        return self.predict_many([observation])[0]


crowd_risk_model = CrowdRiskModel()
