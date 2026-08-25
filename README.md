# MGHSIS

Mass-Gathering Human Safety Intelligence System is a local-first SIH26206 software prototype for event safety command centres.

It fuses simulated Smart Safety Band telemetry, CCTV crowd observations, gate/access counts, a venue Digital Twin, explainable Human Risk, Crowd Risk, Population Integrity Risk, intervention recommendations, and intervention verification.

## Current Status

This repository has been bootstrapped from `MASTER.md` and includes:

- `apps/web`: Next.js command-centre frontend with an interactive cricket stadium Digital Twin slice.
- `apps/api`: FastAPI skeleton with health endpoint.
- `services/*`: simulator and analytics service placeholders for the ordered roadmap.
- `packages/*`, `infra/*`, `docs/*`: monorepo structure from the source-of-truth document.
- `docker-compose.yml`: local PostgreSQL, Redis, API, and web service wiring.

The first UI uses the uploaded cricket stadium seating reference to model block-level heatmap zones. It does not claim medical diagnosis, facial recognition, exact GPS tracking, or completed hardware integration.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

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

The current command centre includes deterministic frontend scenario controls:

- Human distress in a stadium block
- Crowd congestion
- Population Integrity anomaly
- Gateway degradation
- Crowd redirect intervention preview
- Reset to normal event state

Future phases will connect these controls to FastAPI, Redis/WebSockets, and the simulators so verification derives from live simulated state.

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
