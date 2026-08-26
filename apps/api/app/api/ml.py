from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.ml.model import crowd_risk_model
from app.ml.schemas import CrowdObservation, CrowdRiskPrediction

router = APIRouter(prefix="/api/v1/ml/crowd-risk", tags=["crowd-risk-ml"])


def _predict(observation: CrowdObservation) -> CrowdRiskPrediction:
    try:
        return crowd_risk_model.predict(observation)
    except FileNotFoundError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@router.get("/status")
def model_status() -> dict[str, object]:
    try:
        return crowd_risk_model.status()
    except FileNotFoundError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@router.post("/predict", response_model=CrowdRiskPrediction)
def predict_crowd_risk(observation: CrowdObservation) -> CrowdRiskPrediction:
    return _predict(observation)


@router.post("/predict/batch", response_model=list[CrowdRiskPrediction])
def predict_crowd_risk_batch(observations: list[CrowdObservation]) -> list[CrowdRiskPrediction]:
    if not observations or len(observations) > 500:
        raise HTTPException(status_code=422, detail="Batch size must be between 1 and 500 observations")
    return [_predict(observation) for observation in observations]


@router.get("/demo-zones", response_model=list[CrowdRiskPrediction])
def demo_zone_predictions() -> list[CrowdRiskPrediction]:
    zones = ["M", "N", "P", "Q", "R", "J", "K", "C", "D", "E", "F", "G", "H", "B", "SPW", "SPC", "SPE"]
    observations: list[CrowdObservation] = []
    for index, zone in enumerate(zones):
        pressure = 1.17 if zone == "G" else 0.93 if zone in {"C", "H", "SPE"} else 0.58 + (index % 4) * 0.07
        area = 480.0 if len(zone) == 1 else 360.0
        safe_capacity = int(area * 3.0)
        observations.append(CrowdObservation(
            zone_id=zone,
            area_m2=area,
            current_count=int(safe_capacity * pressure),
            safe_capacity=safe_capacity,
            inflow_per_min=46 if zone == "G" else 18 + index % 5 * 2,
            outflow_per_min=15 if zone == "G" else 20 + index % 3 * 2,
            average_speed_mps=0.35 if zone == "G" else 0.82 + (index % 4) * 0.08,
            dwell_time_min=28 if zone == "G" else 12 + index % 7,
            route_width_m=2.6 if zone == "G" else 4.2 + (index % 3),
            exit_count=1 if zone == "G" else 2 + index % 3,
            elderly_share=0.12,
            child_share=0.09,
            mobility_limited_share=0.04,
            heat_index_c=34,
            fall_cluster_5m=3 if zone == "G" else int(zone in {"C", "H"}),
            sos_cluster_5m=2 if zone == "G" else 0,
            cctv_confidence=0.93,
            gateway_health=0.96,
        ))
    return [_predict(observation) for observation in observations]

