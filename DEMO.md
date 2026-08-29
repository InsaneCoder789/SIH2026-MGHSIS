# MGHSIS Demonstration Runbook

This runbook is the repeatable presentation path for the local-first MGHSIS prototype.

## Start the complete stack

1. Open Docker Desktop and wait until it reports that Docker is running.
2. From the repository root, run:

```bash
./start-all.sh
```

The launcher starts PostgreSQL, Redis, FastAPI, the 10,000-band telemetry stream, CCTV observations, gate events, and the Next.js portal. Press `Ctrl+C` once to stop every process cleanly.

## Readiness checks

- Portal: <http://localhost:3000>
- Digital Twin: <http://localhost:3000/digital-twin>
- Command Centre: <http://localhost:3000/command-center>
- API documentation: <http://localhost:8000/docs>
- Runtime readiness: <http://localhost:8000/api/v1/system/readiness>

Do not begin the scenario demonstration until the portal shows synchronized Twin health and the readiness endpoint reports `ready: true`.

## Seven-minute demonstration

### 1. Establish the normal operating picture

Open `/digital-twin`. Point out the 50,000 event-scoped digital bands, 49,483 connected bands, complete stadium heatmap, premium areas, gates, cameras, and G1/G8 replacement stations. Select any visible band and open its record to prove that the map is inspectable.

### 2. Explain the three-engine model

Select **Zones** in the Venue Intelligence rail. Choose Block G and show expected, authenticated, and observed population beside Human, Crowd, and Population Integrity risk. Explain that MGHSIS reports inconsistencies and risk estimates, not identity, guilt, or medical diagnosis.

### 3. Create a crowd-surge projection

Select **Virtualisation**, then **Crowd Surge**. The backend advances a deterministic event clock, scores every zone with the onboard ML model, and projects five-minute population movement. The twin highlights the affected zone and animates the projected route.

### 4. Show explainability

Use the fusion panel to compare expected gate state, authenticated band state, CCTV-observed population, and variance. The ranked zone list displays the combined operational risk while the ML model retains its crowd-risk probability and reasons.

### 5. Apply a human-authorized response

Select **Redirect Zone G**. The action changes simulated inflow and outflow; it is never applied autonomously. The verification panel compares the captured baseline with the post-action state.

### 6. Prove effectiveness

Point out the before/after risk, population change, inflow change, elapsed simulated time, and `EFFECTIVE`, `PARTIALLY EFFECTIVE`, `INEFFECTIVE`, or `INCONCLUSIVE` result. This is the evidence loop: detect, explain, recommend, authorize, act, and verify.

### 7. Show operational continuity

Open `/command-center`, `/alerts`, `/interventions`, `/replay`, and `/system-health`. Scenario changes, acknowledgements, operator actions, verification, and audit records remain part of one event-scoped operating state.

## Recovery

If a port is unexpectedly occupied:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
lsof -nP -iTCP:8000 -sTCP:LISTEN
```

Stop only the stale process shown by `lsof`, then rerun `./start-all.sh`. Avoid starting a second `next dev` process while the launcher is active.

## Prototype boundaries

- Synthetic telemetry is used until physical bands and venue feeds are connected.
- The ML model is advisory and trained on synthetic data; it is not field validated.
- Location is zone and segment level, not exact indoor GPS.
- Human-risk output is not a medical diagnosis.
- Every intervention requires operator authorization and field verification.
