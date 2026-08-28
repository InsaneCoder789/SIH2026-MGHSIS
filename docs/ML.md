# MGHSIS Onboard Crowd-Risk ML

## Purpose

The onboard model estimates zone-level crowd risk early enough to support an operator decision. It does not diagnose people, identify individuals, or autonomously authorize an intervention.

## Dataset and split

`apps/api/app/ml/dataset.py` generates 100,000 deterministic, non-identifying zone snapshots using seed `26206`. The training command creates 80,000 rows for fitting and 20,000 stratified rows held out for evaluation across `LOW`, `MODERATE`, `HIGH`, and `CRITICAL` classes. It also writes a SHA-256 manifest.

The target is generated from the documented crowd-risk factors with controlled noise. This corpus is useful for exercising the pipeline and failure modes, but it is not a substitute for labelled field data.

## Features and model

The model receives spatial capacity, current count, density, inflow, outflow, accumulation, average speed, slowdown, dwell, route width, exit count, crowd composition, heat index, fall/SOS clusters, CCTV confidence, and gateway health. The feature contract is versioned in `app/ml/features.py` and checked when the artifact loads.

The current artifact is a scikit-learn `HistGradientBoostingClassifier`. The API converts class probabilities into an advisory 0-100 score, confidence, trend, ranked reasons, and recommended actions. Safety review exposes critical recall separately from headline accuracy.

The current synthetic holdout report in `apps/api/artifacts/crowd-risk-metrics.json` is 90.79% accuracy, 89.05% macro F1, 87.28% critical recall, and 0.2745 multiclass log loss. The v2 dataset removes training-serving skew from the accumulation feature and includes explicit severe-congestion, density-flow-collapse, and distress-cluster examples. These figures measure recovery of the synthetic generator only. A field pilot, calibrated sensors, temporal validation, drift monitoring, independent safety review, and a human-in-the-loop procedure are required before operational deployment.

## Real-scenario virtualisation

The Scenario Lab now runs a stateful virtual event through `apps/api/app/api/simulation.py`. It synthesizes changing zone observations every 15 simulated seconds, sends all 17 zones through the persisted model, and returns aggregate peak risk, trends, probabilities, and recommended operator actions. The congestion scenario ramps Block G into `CRITICAL`; redirect, inflow restriction, alternate-route, and medical-dispatch actions modify the next observations so operators can observe escalation and recovery.

Simulation endpoints are `GET /api/v1/simulation/state`, `POST /start`, `POST /pause`, `POST /reset`, `POST /scenario`, and `POST /action`. The Next.js `/api/simulation` route proxies these locally to the Scenario Lab. This is a virtualisation and operator-training loop, not a claim of live sensor connectivity.

## Run locally

```bash
PYTHONPATH=apps/api .venv/bin/python -m app.ml.train
PYTHONPATH=apps/api .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
curl http://127.0.0.1:8000/api/v1/ml/crowd-risk/status
```
