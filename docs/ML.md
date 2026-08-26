# MGHSIS Onboard Crowd-Risk ML

## Purpose

The onboard model estimates zone-level crowd risk early enough to support an operator decision. It does not diagnose people, identify individuals, or autonomously authorize an intervention.

## Dataset and split

`apps/api/app/ml/dataset.py` generates 100,000 deterministic, non-identifying zone snapshots using seed `26206`. The training command creates 80,000 rows for fitting and 20,000 stratified rows held out for evaluation across `LOW`, `MODERATE`, `HIGH`, and `CRITICAL` classes. It also writes a SHA-256 manifest.

The target is generated from the documented crowd-risk factors with controlled noise. This corpus is useful for exercising the pipeline and failure modes, but it is not a substitute for labelled field data.

## Features and model

The model receives spatial capacity, current count, density, inflow, outflow, accumulation, average speed, slowdown, dwell, route width, exit count, crowd composition, heat index, fall/SOS clusters, CCTV confidence, and gateway health. The feature contract is versioned in `app/ml/features.py` and checked when the artifact loads.

The current artifact is a scikit-learn `HistGradientBoostingClassifier`. The API converts class probabilities into an advisory 0-100 score, confidence, trend, ranked reasons, and recommended actions. Safety review exposes critical recall separately from headline accuracy.

The current synthetic holdout report in `apps/api/artifacts/crowd-risk-metrics.json` is 80.78% accuracy, 75.69% macro F1, 78.76% critical recall, and 0.4316 multiclass log loss. These figures measure recovery of the synthetic generator only. A field pilot, calibrated sensors, temporal validation, drift monitoring, independent safety review, and a human-in-the-loop procedure are required before operational deployment.

## Run locally

```bash
PYTHONPATH=apps/api .venv/bin/python -m app.ml.train
PYTHONPATH=apps/api .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
curl http://127.0.0.1:8000/api/v1/ml/crowd-risk/status
```

