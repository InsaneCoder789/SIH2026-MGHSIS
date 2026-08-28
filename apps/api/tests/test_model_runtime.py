import shutil

from app.ml.model import CrowdRiskModel, DEFAULT_ARTIFACT, DEFAULT_METRICS


def test_model_status_caches_metrics_at_load_time(tmp_path) -> None:
    artifact = tmp_path / "model.joblib"
    metrics = tmp_path / "metrics.json"
    shutil.copyfile(DEFAULT_ARTIFACT, artifact)
    shutil.copyfile(DEFAULT_METRICS, metrics)
    model = CrowdRiskModel(artifact, metrics)

    first = model.status()["metrics"]
    metrics.write_text('{"changed_after_load": true}', encoding="utf-8")

    assert model.status()["metrics"] == first
