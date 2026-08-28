import shutil
from unittest.mock import patch

import joblib
from app.ml.model import CrowdRiskModel, DEFAULT_ARTIFACT, DEFAULT_METRICS
from app.ml.schemas import CrowdObservation


def test_model_status_caches_metrics_at_load_time(tmp_path) -> None:
    artifact = tmp_path / "model.joblib"
    metrics = tmp_path / "metrics.json"
    shutil.copyfile(DEFAULT_ARTIFACT, artifact)
    shutil.copyfile(DEFAULT_METRICS, metrics)
    model = CrowdRiskModel(artifact, metrics)

    first = model.status()["metrics"]
    metrics.write_text('{"changed_after_load": true}', encoding="utf-8")

    assert model.status()["metrics"] == first


def test_model_rejects_incompatible_risk_labels(tmp_path) -> None:
    bundle = joblib.load(DEFAULT_ARTIFACT)
    bundle["risk_labels"] = ["LOW", "HIGH"]
    artifact = tmp_path / "invalid.joblib"
    joblib.dump(bundle, artifact)

    model = CrowdRiskModel(artifact, DEFAULT_METRICS)
    try:
        model.load()
    except RuntimeError as error:
        assert "risk-label contract" in str(error)
    else:
        raise AssertionError("An incompatible model artifact was accepted")


def test_predict_many_is_empty_safe_and_calls_estimator_once() -> None:
    model = CrowdRiskModel(DEFAULT_ARTIFACT, DEFAULT_METRICS)
    assert model.predict_many([]) == []
    observation = CrowdObservation(
        zone_id="G", area_m2=500, current_count=900, safe_capacity=1_500,
        inflow_per_min=20, outflow_per_min=18, average_speed_mps=0.9,
        dwell_time_min=12, route_width_m=5, exit_count=3, elderly_share=0.1,
        child_share=0.08, mobility_limited_share=0.04, heat_index_c=31,
        fall_cluster_5m=0, sos_cluster_5m=0, cctv_confidence=0.95,
        gateway_health=0.98,
    )
    estimator = model.load()["model"]
    with patch.object(estimator, "predict_proba", wraps=estimator.predict_proba) as predict_proba:
        predictions = model.predict_many([observation, observation])
    assert len(predictions) == 2
    predict_proba.assert_called_once()
