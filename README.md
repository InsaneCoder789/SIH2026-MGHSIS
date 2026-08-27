# MGHSIS

Mass-Gathering Human Safety Intelligence System is a local-first SIH2026 software prototype for event safety command centres.

It fuses simulated Smart Safety Band telemetry, CCTV crowd observations, gate/access counts, a venue Digital Twin, explainable Human Risk, Crowd Risk, Population Integrity Risk, intervention recommendations, and intervention verification.

## Current Status

This repository has been bootstrapped from `MASTER.md` and includes:

- `apps/web`: Next.js operations portal, command centre, interactive cricket stadium Digital Twin, Band Registry, and Band Detail workflows.
- `apps/api`: FastAPI core with persisted onboard crowd-risk ML inference, evaluation metrics, and hardware-ready observation ingestion.
- `services/*`: simulator and analytics service placeholders for the ordered roadmap.
- `packages/*`, `infra/*`, `docs/*`: monorepo structure from the source-of-truth document.
- `docker-compose.yml`: local PostgreSQL, Redis, API, and web service wiring with persistent data volumes.

The UI uses the uploaded cricket stadium seating reference to model block-level heatmap zones, a server-paginated catalogue of 20,000 deterministic Smart Safety Bands, a bounded 5,000-track Digital Twin sample, and explainable demo risk. The backend trains and serves a crowd-risk classifier from a reproducible 100,000-row synthetic corpus (80,000 train / 20,000 holdout). It does not claim medical diagnosis, facial recognition, exact GPS tracking, or completed physical hardware integration.

## Quick Start

```bash
npm install
npm run infra:up
npm run dev
```

Run the API in another terminal:

```bash
PYTHONPATH=apps/api .venv/bin/uvicorn app.main:app --app-dir apps/api --reload --port 8000
```

Open `http://localhost:3000`. The main routes are:

- `/`: operations portal and module overview
- `/command-center`: live stadium Digital Twin and scenario controls
- `/digital-twin`: dedicated stadium twin with live layers, zone segments, band inspection, and real-time status rail
- `/bands`: searchable event-scoped Band Registry
- `/bands/:id`: telemetry and explainable Human Risk detail
- `/alerts`: operator-controlled alert lifecycle
- `/interventions`: authorization and post-intervention verification
- `/analytics`: onboard ML connection, holdout metrics, zone predictions, and explainable trends
- `/cctv`, `/scenario-lab`, `/replay`, `/system-health`, `/settings`: supporting operations modules
- `/api/bands` and `/api/bands/:id`: deterministic demo data endpoints
- `/api/v1/ml/crowd-risk/status`: model version, split, accuracy, macro F1, and per-class metrics
- `/api/v1/ml/crowd-risk/predict`: single zone inference endpoint
- `/api/v1/ml/crowd-risk/demo-zones`: inference for every demo stadium zone
- `/api/v1/hardware/observations`: ordered CCTV, BLE gateway, RFID, manual, or simulator observations
- `/api/v1/system/health`: live API, Redis, ML, simulation-state, and ingestion diagnostics

## Frontend Commands

```bash
npm run lint
npm run build
```

## Docker Start

```bash
cp .env.example .env
docker compose up --build
```

Recommended local ports from `MASTER.md`:

- Web: `3000`
- API: `8000`
- PostgreSQL: `5432`
- Redis: `6379`

## Demo Scenarios

The current command centre includes deterministic frontend scenario controls, 20,000 tracked event bands, and a performance-bounded 5,000-track map layer:

- Human distress in a stadium block
- Crowd congestion
- Population Integrity anomaly
- Gateway degradation
- Crowd redirect intervention preview
- Reset to normal event state
- Search, hide, distress-only, and selected-zone wristband controls
- Click-through from a map dot to the corresponding Band Detail record

The Analytics module connects to FastAPI when it is running and clearly reports when the deterministic frontend fallback is active. Redis now provides shared simulation control state, the latest scored Digital Twin snapshot, sensor replay protection, bounded observation history, and pub/sub channels for downstream real-time consumers. If Redis is unavailable, the API keeps a local demonstration fallback while readiness and System Health report the degradation.

## Redis Runtime

```bash
npm run infra:up
npm run infra:status
npm run infra:down
```

Redis persists to the `mghsis_redis-data` Docker volume. Runtime keys are namespaced by `REDIS_PREFIX`; simulation events publish to `mghsis:events:simulation` and hardware observations publish to `mghsis:events:hardware`.

## Repository Structure

```text
apps/web                 Next.js command-centre frontend
apps/api                 FastAPI core backend
services/band-simulator  Digital Smart Safety Band simulator
services/gate-simulator  Gate/access event simulator
services/cctv-analytics  CCTV crowd analytics service
services/scenario-engine Deterministic SIH demo scenarios
packages/shared-types    Shared contracts
packages/schemas         API/event schemas
packages/risk-models     Explainable risk formulas
infra                    Local infrastructure config
docs                     Product and design docs
```

## Source of Truth

`MASTER.md` is the project source of truth. Before adding features, preserve the three-engine architecture:

- Human Risk
- Crowd Risk
- Population Integrity Risk

Every new feature should strengthen one of those engines, response coordination, or intervention verification.

## Onboard ML

The first model is a `HistGradientBoostingClassifier` trained by `apps/api/app/ml/train.py`. The generated dataset is intentionally synthetic and includes spatial, flow, movement, route, composition, heat, fall/SOS, CCTV confidence, and gateway health features. The model artifact and metrics are stored under `apps/api/artifacts/`; the generated 100,000-row compressed CSV is ignored because it can be recreated exactly from the seed and manifest.

```bash
PYTHONPATH=apps/api .venv/bin/python -m app.ml.train
PYTHONPATH=apps/api .venv/bin/pytest apps/api/tests -q
```

The classifier is advisory decision support. Its holdout metrics are software-pipeline evidence only, not field safety validation. Read `docs/ML.md` and `docs/HardwareIntegration.md` before connecting real sensors.
