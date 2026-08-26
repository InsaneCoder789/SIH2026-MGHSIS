# Architecture

This repository follows the architecture in `MASTER.md`:

- Next.js command-centre frontend
- FastAPI core backend
- PostgreSQL for persistent history
- Redis for live state/cache
- Separate simulator and analytics services
- Explainable rules for Human Risk, Crowd Risk, and Population Integrity Risk

## Implemented Frontend Boundaries

- `app/page.tsx`: operations portal and module entry points
- `components/command-center-dashboard.tsx`: scenario state, stadium geometry, band map, alerts, timeline, and response controls
- `components/band-registry.tsx`: event-scoped search, filtering, sorting, and pagination
- `app/bands/[id]/page.tsx`: telemetry, contribution breakdown, reasons, confidence, and recommended response
- `lib/bands.ts`: deterministic 300-band demo source and stadium coordinates
- `lib/human-risk.ts`: pure explainable Human Risk calculation
- `app/api/bands/*`: typed demo read endpoints

The frontend uses local deterministic data so the SIH demonstration is repeatable. The data functions form the boundary that later FastAPI and WebSocket adapters can replace without rewriting the views.

## Human Risk Contract

The Human Risk engine returns a `0-100` score, `LOW` through `CRITICAL` level, weighted signal contributions, human-readable reasons, confidence, and a recommended action. The current weights are heart rate 20%, SpO2 20%, fall 25%, immobility 15%, and SOS 20%. Persistence and telemetry reliability adjust confidence, while explicit SOS and combined fall/immobility anomalies impose safety floors.

The output is decision support and remains explicitly non-diagnostic.
