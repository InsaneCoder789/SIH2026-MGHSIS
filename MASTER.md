# MASTER.md — SIH26206 Mass-Gathering Human Safety Intelligence System

> **Source of Truth for the Software Prototype**
>
> This file defines the product scope, requirements, architecture, backend, database, APIs, Digital Twin, simulation engine, CCTV analytics, risk engines, frontend, security, testing, deployment, demo scenarios, and the ordered Codex prompts required to build the system from a blank repository.
>
> **Primary SIH Category:** Software  
> **Problem Statement ID:** SIH26206  
> **Problem Statement Title:** Student Innovation  
> **Theme:** Disaster Management  

---

# 0. Project Identity

## Working Name
**Mass-Gathering Human Safety Intelligence System**

## Short Name
**MGHSIS**

## Core Concept
A local-first safety intelligence platform for concerts, cricket stadiums, pilgrimages, melas, and other high-density public gatherings.

The software combines:
- simulated Smart Safety Band telemetry;
- CCTV crowd analytics;
- gate/access records;
- venue zone information;
- a Digital Twin of the event;
- Human Risk scoring;
- Crowd Risk scoring;
- Population Integrity Risk scoring;
- targeted response recommendations;
- intervention verification.

The software prototype does **not** require a physical smart band.

Instead, Smart Safety Bands are represented by realistic digital twins that generate:
- event-scoped identity;
- zone presence;
- heart-rate telemetry;
- SpO₂ telemetry;
- motion state;
- fall events;
- immobility;
- SOS events;
- battery state;
- connectivity state.

The purpose of the software prototype is to prove that these signals can create useful, explainable, real-time safety intelligence when combined with CCTV and gate data.

---

# 1. Product Vision

## Vision
Create an India-first, local-first mass-gathering safety intelligence layer that helps organisers understand:

1. **Is an individual potentially in distress?**
2. **Is a dangerous crowd condition developing?**
3. **Does the authenticated crowd model still match physical reality?**
4. **What action should be recommended?**
5. **Did the intervention actually reduce the risk?**

## Mission
Shift large-gathering safety from purely reactive incident response toward earlier, evidence-backed intervention.

## Core Philosophy
> The crowd should not merely be counted. It should be understood.

---

# 2. Problem Scope

## 2.1 Human Risk
A person can become medically distressed inside a dense crowd without being visible to CCTV or nearby staff.

The system must detect combinations of:
- abnormal physiological trends;
- low movement;
- fall events;
- immobility;
- SOS requests;
- reliable sensor confidence.

The system must **never claim medical diagnosis**.

It must output:
- low risk;
- moderate risk;
- high risk;
- critical risk;
- explanation of the signals that caused the score.

## 2.2 Crowd Risk
Crowd disasters usually develop progressively.

The system must detect:
- increasing crowd density;
- excessive accumulation rate;
- falling average movement speed;
- rising inflow;
- low outflow;
- fall clusters;
- SOS clusters;
- zone occupancy approaching or exceeding safe capacity.

The system must support:
- current risk;
- trend;
- predicted short-term direction;
- recommended intervention.

## 2.3 Population Integrity Risk
The system must continuously compare:

### Expected Population
Derived from:
- gate scans;
- entry records;
- exit records.

### Authenticated Population
Derived from:
- active simulated Smart Safety Bands detected in a zone.

### Observed Population
Derived from:
- CCTV/computer-vision population estimates.

Example:

```text
Expected population:       3,900
Authenticated bands:       3,850
CCTV observed population:  4,420
```

This must trigger a **Population Integrity Alert**.

Possible causes:
- barricade breach;
- unauthorised entry;
- missed RFID scan;
- gateway failure;
- band failure;
- CCTV estimation error;
- rapid crowd migration.

The system must identify **an inconsistency**, not accuse a person or group.

---

# 3. Primary Deployment Modes

## 3.1 Concert Mode
Designed for:
- music festivals;
- stadium concerts;
- ticketed large venues.

Focus:
- zone density;
- human distress;
- barricade breach;
- crowd redistribution;
- targeted band alerts.

## 3.2 Cricket Stadium Mode
Designed for:
- fixed venue sectors;
- controlled gates;
- existing CCTV;
- known capacities.

Focus:
- sector-level occupancy;
- population integrity;
- inflow/outflow;
- gate anomalies;
- crowd redistribution.

## 3.3 Pilgrimage Mode
Designed for:
- long routes;
- temporary checkpoints;
- temple queues;
- high-density corridors;
- variable connectivity.

Focus:
- checkpoint counts;
- corridor congestion;
- distress;
- route accumulation;
- edge/local-first operation.

---

# 4. System Boundaries

## Implement Now
- software Digital Twin;
- venue map and zones;
- simulated wearable network;
- real-time telemetry ingestion;
- risk engines;
- gate/access event simulation;
- CCTV/video analytics;
- crowd heatmaps;
- population integrity calculations;
- alert engine;
- intervention recommendations;
- intervention verification;
- command-centre dashboard;
- local-first deployment using Docker.

## Future Hardware Integration
- physical Smart Safety Band;
- BLE gateways;
- RFID/NFC readers;
- HR/SpO₂ sensor;
- IMU;
- RGB LEDs;
- vibration motor;
- SOS button;
- battery monitoring;
- secure device provisioning.

## Non-Goals
- medical diagnosis;
- exact GPS-like indoor tracking;
- facial recognition;
- permanent personal surveillance;
- criminal identification;
- automated police enforcement;
- production-ready clinical monitoring;
- replacing security/medical personnel.

---

# 5. Success Criteria

The prototype is successful if it can demonstrate all of the following:

1. Spawn at least **10,000 simulated bands**.
2. Maintain real-time zone occupancy.
3. Generate realistic HR, SpO₂, motion, fall, SOS, battery and connectivity telemetry.
4. Show a real-time Digital Twin with zone heatmaps.
5. Process a CCTV/video feed and estimate crowd density.
6. Compare CCTV counts with simulated authenticated bands.
7. Detect individual distress, zone congestion, dangerous accumulation, barricade breach, population integrity mismatch, and gateway failure.
8. Recommend an intervention.
9. Simulate the intervention.
10. Verify whether the zone risk decreased.
11. Run locally without dependence on public cloud services.
12. Produce a complete event timeline and audit log.

---

# 6. High-Level Architecture

```text
                         ┌────────────────────┐
                         │  COMMAND CENTRE    │
                         │   Next.js UI       │
                         └─────────┬──────────┘
                                   │
                            WebSocket / REST
                                   │
                    ┌──────────────▼──────────────┐
                    │        FASTAPI CORE         │
                    │ Event Orchestrator          │
                    │ Risk Engine                 │
                    │ Alert Engine                │
                    │ Intervention Engine         │
                    │ Digital Twin API            │
                    └─────┬───────────────┬──────┘
                          │               │
                   PostgreSQL          Redis
                          │               │
                          │         Live state/cache
                          │
       ┌──────────────────┼─────────────────────┐
       │                  │                     │
       ▼                  ▼                     ▼
Band Simulator       CCTV Service         Gate Simulator
Python               Python/OpenCV         Python
       │                  │                     │
       └──────────────────┴─────────────────────┘
                          │
                    Event Bus / API
```

---

# 7. Recommended Technology Stack

## Frontend
- Next.js
- TypeScript
- React
- Tailwind CSS
- shadcn/ui
- MapLibre GL or SVG/canvas venue map
- Recharts or ECharts
- WebSocket client

## Backend
- Python 3.12+
- FastAPI
- Pydantic v2
- SQLAlchemy 2
- Alembic
- WebSockets
- asyncio

## Database
- PostgreSQL 16+

## Cache / Live State
- Redis

## Simulation
- Python
- asyncio
- NumPy

## CCTV Analytics
- Python
- OpenCV
- YOLO-family model or another supported person detector
- optional ByteTrack / DeepSORT for tracking

## Infrastructure
- Docker
- Docker Compose
- Nginx optional
- local-first development
- optional future cloud deployment

---

# 8. Repository Structure

```text
/
├── MASTER.md
├── README.md
├── docker-compose.yml
├── .env.example
│
├── apps/
│   ├── web/
│   │   └── Next.js command-centre frontend
│   └── api/
│       └── FastAPI core backend
│
├── services/
│   ├── band-simulator/
│   ├── gate-simulator/
│   ├── cctv-analytics/
│   └── scenario-engine/
│
├── packages/
│   ├── schemas/
│   ├── shared-types/
│   └── risk-models/
│
├── infra/
│   ├── postgres/
│   ├── redis/
│   └── docker/
│
├── docs/
│   ├── Requirements.md
│   ├── Architecture.md
│   ├── Backend.md
│   ├── Database.md
│   ├── API.md
│   ├── DigitalTwin.md
│   ├── Simulation.md
│   ├── CCTV.md
│   ├── RiskEngine.md
│   ├── Frontend.md
│   ├── Security.md
│   ├── Testing.md
│   └── Deployment.md
│
├── tests/
└── scripts/
```

---

# 9. Requirements.md

## Functional Requirements

### FR-001 Event Management
The system shall support creation of an event.

Fields:
- name;
- event type;
- start time;
- end time;
- venue;
- deployment mode;
- expected capacity.

### FR-002 Venue Zones
An event shall contain multiple zones.

Each zone must store:
- zone ID;
- name;
- polygon/bounds;
- safe capacity;
- warning threshold;
- critical threshold;
- adjacency;
- entry points;
- exit points.

### FR-003 Digital Bands
The system shall maintain simulated band identities.

Each band must store:
- event-scoped band ID;
- active state;
- current zone;
- HR;
- SpO₂;
- motion state;
- fall state;
- SOS state;
- battery;
- connectivity;
- signal quality;
- last seen.

### FR-004 Band Simulation
The simulator shall support:
- normal;
- distress;
- tachycardia;
- low-SpO₂;
- fall;
- immobile;
- SOS;
- offline;
- low battery;
- movement between zones.

### FR-005 Crowd Movement
Simulated bands shall move between zones based on:
- predefined flow graph;
- probability;
- scenario events;
- crowd pressure.

### FR-006 Gate Events
The system shall simulate:
- valid entry;
- valid exit;
- duplicate entry attempt;
- unregistered entry;
- barricade breach.

### FR-007 CCTV Analytics
The system shall ingest:
- live camera feed;
- recorded demo video;
- synthetic crowd-count stream.

Output:
- camera ID;
- zone;
- timestamp;
- person count;
- density;
- motion direction;
- restricted-line crossings;
- confidence.

### FR-008 Human Risk
The backend shall generate Human Risk scores per band.

### FR-009 Crowd Risk
The backend shall generate Crowd Risk scores per zone.

### FR-010 Population Integrity Risk
The backend shall generate Population Integrity scores per zone.

### FR-011 Alerts
The backend shall generate alerts with:
- severity;
- category;
- affected zone;
- affected band if applicable;
- explanation;
- recommended action;
- timestamp;
- status.

### FR-012 Intervention
Operators shall be able to:
- acknowledge alerts;
- dispatch medical response;
- dispatch security;
- restrict inflow;
- redirect crowd;
- simulate band alert;
- simulate signage update.

### FR-013 Verification
The platform shall calculate:
- pre-intervention risk;
- post-intervention risk;
- change in crowd count;
- change in inflow/outflow;
- elapsed time.

### FR-014 Audit Log
Every major action must be logged.

---

# 10. Architecture.md

## Architectural Style
Use an **event-driven modular architecture**.

The system does not require Kafka for the SIH prototype.

Use:
- REST for configuration/query;
- WebSockets for live dashboard updates;
- Redis Pub/Sub or Streams for internal real-time event distribution;
- PostgreSQL for persistent history.

## Core Modules

### Event Service
Owns events, venues, zones.

### Band Service
Owns band registry, band state, telemetry ingestion.

### Gate Service
Owns entries, exits, access events.

### CCTV Service
Owns camera metadata, crowd observations, boundary-crossing events.

### Risk Service
Owns Human Risk, Crowd Risk, Population Integrity Risk.

### Alert Service
Owns alert lifecycle, severity, acknowledgement.

### Intervention Service
Owns actions, intervention tracking, verification.

### Digital Twin Service
Owns aggregated live state for the venue.

---

# 11. Backend.md

## FastAPI Application

Recommended module layout:

```text
apps/api/app/
├── main.py
├── core/
│   ├── config.py
│   ├── database.py
│   ├── redis.py
│   └── logging.py
├── models/
├── schemas/
├── api/
│   ├── events.py
│   ├── zones.py
│   ├── bands.py
│   ├── cameras.py
│   ├── gates.py
│   ├── alerts.py
│   ├── interventions.py
│   └── scenarios.py
├── services/
│   ├── risk/
│   ├── digital_twin/
│   ├── alerts/
│   └── interventions/
└── websocket/
```

## Backend Responsibilities
- persistence;
- validation;
- event orchestration;
- risk calculation;
- WebSocket broadcasting;
- audit logs;
- simulator control;
- Digital Twin aggregation.

---

# 12. Database.md

## Core Tables

### events
```text
id UUID PK
name VARCHAR
event_type VARCHAR
deployment_mode VARCHAR
starts_at TIMESTAMP
ends_at TIMESTAMP
status VARCHAR
expected_capacity INTEGER
created_at TIMESTAMP
```

### venues
```text
id UUID PK
name VARCHAR
city VARCHAR
country VARCHAR
map_width FLOAT
map_height FLOAT
```

### zones
```text
id UUID PK
event_id UUID FK
venue_id UUID FK
name VARCHAR
zone_type VARCHAR
safe_capacity INTEGER
warning_threshold FLOAT
critical_threshold FLOAT
geometry JSONB
adjacent_zone_ids JSONB
```

### bands
```text
id UUID PK
event_id UUID FK
band_code VARCHAR UNIQUE
state VARCHAR
current_zone_id UUID
battery_percent FLOAT
connectivity_state VARCHAR
last_seen TIMESTAMP
```

### band_telemetry
```text
id BIGSERIAL PK
band_id UUID FK
timestamp TIMESTAMP
heart_rate FLOAT
spo2 FLOAT
motion_state VARCHAR
fall_detected BOOLEAN
immobile BOOLEAN
sos BOOLEAN
signal_quality FLOAT
battery_percent FLOAT
zone_id UUID
```

### gates
```text
id UUID PK
event_id UUID FK
zone_id UUID
name VARCHAR
direction VARCHAR
```

### gate_events
```text
id BIGSERIAL PK
gate_id UUID FK
timestamp TIMESTAMP
event_type VARCHAR
band_id UUID NULL
authenticated BOOLEAN
```

### cameras
```text
id UUID PK
event_id UUID FK
zone_id UUID
name VARCHAR
stream_source VARCHAR
```

### cctv_observations
```text
id BIGSERIAL PK
camera_id UUID
zone_id UUID
timestamp TIMESTAMP
person_count INTEGER
density FLOAT
average_speed FLOAT
flow_direction JSONB
restricted_crossings INTEGER
confidence FLOAT
```

### zone_state
```text
zone_id UUID PK
timestamp TIMESTAMP
authenticated_population INTEGER
expected_population INTEGER
observed_population INTEGER
inflow_per_min FLOAT
outflow_per_min FLOAT
human_risk_count INTEGER
crowd_risk_score FLOAT
population_integrity_score FLOAT
overall_risk_score FLOAT
```

### alerts
```text
id UUID PK
event_id UUID
zone_id UUID NULL
band_id UUID NULL
category VARCHAR
severity VARCHAR
title VARCHAR
description TEXT
explanation JSONB
recommended_action JSONB
status VARCHAR
created_at TIMESTAMP
acknowledged_at TIMESTAMP NULL
```

### interventions
```text
id UUID PK
alert_id UUID
zone_id UUID
action_type VARCHAR
parameters JSONB
pre_risk_score FLOAT
post_risk_score FLOAT NULL
started_at TIMESTAMP
completed_at TIMESTAMP NULL
status VARCHAR
```

### audit_logs
```text
id BIGSERIAL PK
event_id UUID
actor VARCHAR
action VARCHAR
entity_type VARCHAR
entity_id VARCHAR
payload JSONB
timestamp TIMESTAMP
```

## Indexing
At minimum:
- band_telemetry(band_id, timestamp DESC)
- band_telemetry(zone_id, timestamp DESC)
- cctv_observations(zone_id, timestamp DESC)
- gate_events(gate_id, timestamp DESC)
- alerts(event_id, created_at DESC)
- alerts(status, severity)

---

# 13. API.md

## Events
```http
POST /api/v1/events
GET  /api/v1/events
GET  /api/v1/events/{event_id}
PATCH /api/v1/events/{event_id}
```

## Zones
```http
POST /api/v1/events/{event_id}/zones
GET  /api/v1/events/{event_id}/zones
GET  /api/v1/zones/{zone_id}
```

## Bands
```http
GET  /api/v1/events/{event_id}/bands
GET  /api/v1/bands/{band_id}
POST /api/v1/bands/telemetry
```

## Gate Events
```http
POST /api/v1/gates/{gate_id}/events
GET  /api/v1/events/{event_id}/gates
```

## CCTV
```http
POST /api/v1/cctv/observations
GET  /api/v1/events/{event_id}/cameras
```

## Digital Twin
```http
GET /api/v1/events/{event_id}/digital-twin
GET /api/v1/events/{event_id}/zones/{zone_id}/state
```

## Alerts
```http
GET  /api/v1/events/{event_id}/alerts
POST /api/v1/alerts/{alert_id}/acknowledge
```

## Interventions
```http
POST /api/v1/interventions
PATCH /api/v1/interventions/{id}/complete
GET /api/v1/interventions/{id}/verification
```

## Scenarios
```http
POST /api/v1/scenarios/start
POST /api/v1/scenarios/stop
POST /api/v1/scenarios/reset
GET  /api/v1/scenarios
```

---

# 14. WebSocket Contract

Endpoint:

```text
/ws/events/{event_id}
```

## zone.state.updated
```json
{
  "type": "zone.state.updated",
  "timestamp": "2026-09-01T12:00:00Z",
  "payload": {
    "zone_id": "B2",
    "authenticated_population": 2841,
    "observed_population": 2770,
    "expected_population": 2790,
    "crowd_risk": 91,
    "population_integrity_risk": 28
  }
}
```

## band.distress
```json
{
  "type": "band.distress",
  "payload": {
    "band_id": "WB-01842",
    "zone_id": "B3",
    "human_risk": 87,
    "signals": ["fall_detected", "low_movement", "abnormal_spo2_trend"]
  }
}
```

## alert.created
```json
{
  "type": "alert.created",
  "payload": {
    "alert_id": "uuid",
    "category": "CROWD_RISK",
    "severity": "CRITICAL",
    "zone_id": "B2"
  }
}
```

## intervention.updated
```json
{
  "type": "intervention.updated",
  "payload": {
    "intervention_id": "uuid",
    "zone_id": "B2",
    "status": "VERIFYING"
  }
}
```

---

# 15. DigitalTwin.md

## Definition
The Digital Twin is the **real-time software representation of the event**.

It must show:
- venue;
- zones;
- crowd state;
- active bands;
- camera observations;
- gate status;
- alerts;
- responders;
- interventions;
- risk evolution.

## Zone State
Each zone must calculate:

```text
zone_id
safe_capacity
authenticated_population
observed_population
expected_population
density_ratio
inflow_per_min
outflow_per_min
accumulation_rate
crowd_risk
population_integrity_risk
active_human_alerts
status
```

## Suggested Zone Status
```text
NORMAL
ELEVATED
HIGH
CRITICAL
```

## Visualization
The frontend must support:
- polygon or block-based zone map;
- heatmap overlay;
- risk color;
- flow arrows;
- click-to-open zone details;
- alert markers;
- camera/gate markers.

---

# 16. Simulation.md

## Band Simulator Goals
The simulator must behave like thousands of active wearable nodes.

## Band Model
Each simulated band has:

```python
band_id
event_id
zone_id
heart_rate
spo2
motion_state
fall_detected
immobile
sos
battery
signal_quality
connected
state_profile
```

## Simulation Profiles

### NORMAL
Normal HR/SpO₂ demonstration values, walking/standing motion, no SOS, no fall.

### DISTRESS
Gradually increase HR, lower SpO₂, reduce movement, optionally trigger fall.

### FALL
Sudden movement change, fall flag true, followed by immobility.

### SOS
Explicit SOS event.

### LOW_BATTERY
Battery decays quickly.

### OFFLINE
Stops transmitting.

## Movement Model
Represent venue as a graph:

```text
A1 ↔ A2 ↔ A3
↓     ↓     ↓
B1 ↔ B2 ↔ B3
↓     ↓     ↓
C1 ↔ C2 ↔ C3
```

Each zone stores:
- neighbour list;
- transition probability;
- inflow pressure;
- capacity.

## Scalability Modes
```text
demo:       100 bands
medium:   1,000 bands
large:   10,000 bands
stress:  50,000 bands
```

Do not render every simulated band individually in the browser. Aggregate zone state.

---

# 17. Scenario Engine

## Scenario 1 — Concert Congestion
Increase B2 inflow and reduce B2 outflow.

Expected:
- accumulation rises;
- crowd risk rises;
- system recommends redirection.

## Scenario 2 — Individual Distress
One band in B3 develops abnormal HR/SpO₂ trend, low movement and fall.

Expected:
- Human Risk increases;
- distress alert created;
- medical response recommended.

## Scenario 3 — Barricade Breach
CCTV restricted crossings +80; gate authenticated entries +4; authenticated bands +5.

Expected:
- observed population diverges;
- Population Integrity alert created.

## Scenario 4 — Gateway Failure
Authenticated bands suddenly drop in B2 while CCTV population remains stable.

Expected:
- system must not claim crowd disappeared;
- integrity anomaly indicates likely sensing failure.

## Scenario 5 — Pilgrimage Checkpoint Overload
Large inflow to checkpoint P4, low outflow, rising distress events.

Expected:
- corridor risk rises;
- alternate checkpoint route recommended.

## Scenario 6 — Intervention Verification
B2 begins at critical risk. Redirect 25% of incoming bands toward B3.

Expected:
- B2 net accumulation falls;
- risk score trends downward;
- intervention marked effective.

---

# 18. CCTV.md

## Prototype Goal
Demonstrate real software-based visual crowd analytics.

## Minimum MVP
From recorded video:
- detect people;
- count people;
- estimate density;
- assign count to a zone;
- output confidence.

## Better Version
Add:
- person tracking;
- movement speed;
- flow direction;
- virtual boundary crossing;
- restricted-zone crossing.

## Input
```text
MP4 file
RTSP optional
webcam optional
```

## Output Schema
```json
{
  "camera_id": "CAM-B2",
  "zone_id": "B2",
  "timestamp": "ISO8601",
  "person_count": 1240,
  "density": 0.84,
  "average_speed": 0.42,
  "flow_direction": {"x": 0.81, "y": 0.13},
  "restricted_crossings": 7,
  "confidence": 0.91
}
```

Every observation must contain a confidence score.

---

# 19. RiskEngine.md

## 19.1 Human Risk
Use an explainable configurable score.

Conceptual formula:

```text
HumanRisk =
  HR_Anomaly * 0.20
+ SpO2_Anomaly * 0.20
+ Fall * 0.25
+ Immobility * 0.15
+ SOS * 0.20
```

Then:

```text
AdjustedHumanRisk = HumanRisk × SensorConfidence
```

Do not hardcode clinical diagnostic thresholds as medical truth. Use configurable demonstration thresholds.

Risk levels:

```text
0–29   LOW
30–54  MODERATE
55–74  HIGH
75–100 CRITICAL
```

## 19.2 Crowd Risk
Candidate factors:

```text
density_score
capacity_score
accumulation_score
movement_slowdown_score
fall_cluster_score
sos_cluster_score
```

Example:

```text
CrowdRisk =
  density_score          * 0.30
+ capacity_score         * 0.20
+ accumulation_score     * 0.20
+ movement_slowdown      * 0.10
+ fall_cluster_score     * 0.10
+ sos_cluster_score      * 0.10
```

## 19.3 Population Integrity Risk

```text
expected = gate_entries - gate_exits
authenticated = unique active bands in zone
observed = CCTV population estimate
```

Compute:

```text
gap_expected_authenticated = abs(expected - authenticated) / max(expected, 1)
gap_authenticated_observed = abs(authenticated - observed) / max(observed, 1)
gap_expected_observed = abs(expected - observed) / max(observed, 1)
```

Then:

```text
PopulationIntegrityRisk = (
  gap_expected_authenticated * 0.30
+ gap_authenticated_observed * 0.45
+ gap_expected_observed * 0.25
) * 100
```

Weight result by CCTV confidence and gateway health.

## 19.4 Overall Zone Risk

```text
OverallZoneRisk =
  CrowdRisk * 0.55
+ PopulationIntegrityRisk * 0.20
+ HumanClusterRisk * 0.25
```

Weights must live in configuration. The frontend must show **why** the score changed.

---

# 20. Intervention Engine

## Supported Actions
```text
DISPATCH_MEDICAL
DISPATCH_SECURITY
RESTRICT_INFLOW
REDIRECT_TO_ZONE
BAND_CAUTION
BAND_EVACUATE
UPDATE_SIGNAGE
OPEN_ALTERNATE_ROUTE
OBSERVE_ONLY
```

## Intervention Model
```text
target_zone
action
reason
recommended_by
started_at
baseline_metrics
target_metrics
verification_window
status
```

## Verification
Compare:
- risk before;
- risk after;
- population before;
- population after;
- inflow before;
- inflow after;
- outflow before;
- outflow after.

Possible result:
```text
EFFECTIVE
PARTIALLY_EFFECTIVE
INEFFECTIVE
INCONCLUSIVE
```

---

# 21. Frontend.md

## Main Command Centre

### Global Header
Display:
- event name;
- event mode;
- total authenticated population;
- total observed population;
- active alerts;
- system health;
- current event time.

### Main Layout
```text
┌──────────────────────────────────────────────────────────────┐
│ Header                                                       │
├────────────────────────────────┬─────────────────────────────┤
│                                │ Active Alerts               │
│        DIGITAL TWIN            │                             │
│        Venue Heatmap           │ Human / Crowd / Integrity   │
│                                │                             │
├────────────────────────────────┼─────────────────────────────┤
│ Zone Metrics                   │ Event Timeline              │
└────────────────────────────────┴─────────────────────────────┘
```

## Digital Twin Map
Must display:
- zones;
- heat state;
- occupancy;
- risk;
- gates;
- cameras;
- alerts.

## Zone Detail Drawer
Click zone:
- current population;
- expected;
- authenticated;
- observed;
- inflow/outflow;
- human alerts;
- risk explanation;
- recommended actions;
- trend chart.

## Band Detail Drawer
Click distress alert:
- band ID;
- zone;
- telemetry trend;
- current risk;
- explanation;
- action buttons.

## Scenario Control Panel
For demonstration:
- Start Concert Congestion;
- Trigger Distress;
- Trigger Barricade Breach;
- Trigger Gateway Failure;
- Start Pilgrimage Overload;
- Reset Event.

---

# 22. Dashboard Pages

```text
/
├── /command-center
├── /event/[id]
├── /event/[id]/digital-twin
├── /event/[id]/alerts
├── /event/[id]/bands
├── /event/[id]/cameras
├── /event/[id]/interventions
├── /event/[id]/analytics
└── /scenario-lab
```

---

# 23. Security.md

## Prototype Security Principles

### Event-Scoped Identity
Band IDs must be event-specific.

### No Real Personal Identity Required
The simulator should not contain real names, phone numbers, or biometric identities.

### Authentication
Suggested roles:
```text
ADMIN
COMMAND_OPERATOR
MEDICAL_OPERATOR
SECURITY_OPERATOR
VIEWER
```

### Audit
All operator actions logged.

### API
Use:
- JWT or secure session;
- validation;
- rate limits;
- CORS restrictions.

### Future Hardware
Design placeholders for:
- signed band credentials;
- rotating BLE identifiers;
- encrypted gateway communication.

---

# 24. Testing.md

## Unit Tests
Test:
- risk formulas;
- zone aggregation;
- population integrity math;
- intervention verification;
- simulator state transitions.

## API Tests
Test:
- event creation;
- telemetry ingestion;
- alert acknowledgement;
- scenarios;
- Digital Twin state.

## Integration Tests
Test:

```text
Simulator → Backend → Database → Risk Engine → WebSocket → Frontend
```

## Scenario Tests

### Barricade Breach
Assert:
- observed population rises;
- authenticated population stays near stable;
- integrity risk increases;
- alert created.

### Distress
Assert:
- target band risk rises;
- human alert created.

### Congestion
Assert:
- zone risk crosses threshold;
- intervention recommendation created.

## Performance Tests
Targets:
- 10k simulated active bands;
- backend aggregation without rendering every device;
- stable WebSocket dashboard update frequency.

---

# 25. Deployment.md

## Local-First Demo Deployment

Use Docker Compose:

```text
web
api
postgres
redis
band-simulator
gate-simulator
cctv-analytics
```

## Docker Requirements
- start entire stack;
- health checks;
- persistent database volume;
- expose only needed ports;
- support `.env`.

## Recommended Ports
```text
3000  frontend
8000  FastAPI
5432  PostgreSQL
6379  Redis
```

## Demo Laptop Mode
All services should run on one development laptop where possible.

---

# 26. README.md Content

README must include:

1. Project summary
2. SIH context
3. Problem
4. Solution
5. Three risk engines
6. Architecture
7. Tech stack
8. Quick start
9. Docker start
10. Scenario demo instructions
11. Repository structure
12. Limitations
13. Future Smart Safety Band integration

---

# 27. Development Roadmap

## Phase 0 — Repository Foundation
Monorepo, Docker, docs, linting, configuration.

## Phase 1 — Event + Venue + Zone Core
Database, FastAPI, event CRUD, venue map, zones.

## Phase 2 — Digital Band Simulator
Thousands of bands, movement, telemetry, backend ingestion.

## Phase 3 — Digital Twin
Live zone state, heatmap, WebSocket updates.

## Phase 4 — Human Risk
Distress scoring, alerts, band detail.

## Phase 5 — Crowd Risk
Density, capacity, accumulation, crowd alerts.

## Phase 6 — Population Integrity
Gate counts, authenticated counts, observed counts, mismatch alerts.

## Phase 7 — CCTV Analytics
Recorded crowd video, person count, virtual crossing detection.

## Phase 8 — Sensor Fusion
CCTV + bands + gates, confidence-aware scoring.

## Phase 9 — Intervention Engine
Recommendations, operator action, simulated redirection.

## Phase 10 — Verification
Measure before/after, intervention effectiveness.

## Phase 11 — Scenario Lab
SIH demonstration controls.

## Phase 12 — Production Polish
UI polish, animations, reliability, docs, final demo.

---

# 28. Final SIH Demo Flow

## Scene 1 — Normal Event
Show 10,000 simulated bands and mostly green zones.

## Scene 2 — Individual Distress
Trigger one band with HR/SpO₂ trend change and fall. Show Human Risk alert and medical response recommendation.

## Scene 3 — Crowd Accumulation
Trigger B2 congestion. Show heatmap yellow → orange → red and inflow > outflow.

## Scene 4 — Barricade Breach
Show:

```text
Expected      2,800
Authenticated 2,790
Observed      3,180
```

Generate Population Integrity alert.

## Scene 5 — Intervention
Redirect simulated crowd from B2 → B3.

## Scene 6 — Verification
Show:

```text
Risk before: 91
Risk after:  48
Intervention: EFFECTIVE
```

---

# 29. Codex Execution Prompts

> Run these in dependency order. Before every prompt, Codex must read `MASTER.md` completely.

## CODEX PROMPT 0 — Bootstrap Repository

```text
Read MASTER.md fully before making changes.

Create the initial monorepo for the Mass-Gathering Human Safety Intelligence System described in MASTER.md.

Requirements:
- apps/web: Next.js + TypeScript + Tailwind
- apps/api: FastAPI + Python 3.12
- services/band-simulator
- services/gate-simulator
- services/cctv-analytics
- services/scenario-engine
- packages/shared-types
- infra/
- tests/
- docs/

Add:
- root README.md
- .gitignore
- .env.example
- Dockerfiles
- docker-compose.yml
- formatting/linting configuration
- basic health endpoints
- startup instructions

Use PostgreSQL and Redis from Docker Compose.

Do not implement product features yet.

Verify:
- frontend starts
- backend starts
- PostgreSQL is reachable
- Redis is reachable
- docker compose up works

Update README.md with exact local setup steps.

Do not deviate from MASTER.md without documenting the reason.
```

## CODEX PROMPT 1 — Database + Event Core

```text
Read MASTER.md before making changes.

Implement Phase 1: Event, Venue, and Zone core.

Backend:
- configure SQLAlchemy 2
- configure Alembic
- implement Event, Venue, Zone database models
- create migrations
- implement Pydantic schemas
- implement REST CRUD APIs
- add validation
- add tests

Zone geometry may initially use JSON polygon coordinates.

Frontend:
- create an event list page
- create an event detail page
- create a basic venue-zone editor/viewer
- allow creating sample zones

Seed one sample cricket stadium event with 9 zones:
A1 A2 A3
B1 B2 B3
C1 C2 C3

Acceptance:
- create event through API
- retrieve zones
- render zones in browser
- tests pass
```

## CODEX PROMPT 2 — Band Registry + Simulator

```text
Read MASTER.md before making changes.

Implement Phase 2: Digital Smart Safety Band registry and simulator.

Backend:
- implement bands table
- implement band telemetry table
- implement telemetry ingestion API
- implement current band state aggregation

Simulator:
- create asynchronous Python simulator
- support 100, 1000, 10000 band modes
- each band must have band_id, zone_id, HR, SpO2, movement state, fall, immobility, SOS, battery, signal quality, connectivity

Profiles:
NORMAL
DISTRESS
FALL
SOS
LOW_BATTERY
OFFLINE

Add realistic movement between adjacent zones.

Do not insert every telemetry update blindly if that causes unnecessary database load. Keep current state efficiently and persist sampled history.

Add tests for movement, profile transition, telemetry generation, and disconnected bands.

Provide CLI commands to start the simulator.
```

## CODEX PROMPT 3 — WebSocket + Digital Twin

```text
Read MASTER.md before making changes.

Implement Phase 3: Real-time Digital Twin.

Backend:
- create event WebSocket endpoint
- aggregate per-zone authenticated population, active bands, density ratio, inflow, outflow, accumulation rate, connectivity health
- broadcast zone.state.updated events

Frontend:
- build command-centre page
- render venue zones
- update zone occupancy live through WebSocket
- color zones normal/elevated/high/critical
- clicking a zone opens a detail drawer

Do not render 10,000 individual band components. Use aggregate zone state.

Add reconnect logic for WebSocket.

Acceptance: run 10,000 simulator bands and observe live heatmap updates.
```

## CODEX PROMPT 4 — Human Risk Engine

```text
Read MASTER.md before making changes.

Implement the Human Risk Engine exactly as an explainable configurable risk model.

Requirements:
- do not present medical diagnosis
- risk model weights must be configuration
- use HR anomaly, SpO2 anomaly, fall, immobility, SOS, signal quality, persistence

Create HumanRiskResult with score, level, reasons, confidence, timestamp.

Generate alerts when configured thresholds are crossed.

Frontend:
- Human Risk alert list
- band detail drawer
- telemetry trend graph
- explanation panel showing why risk increased

Add a demo control to trigger distress on a selected band.

Tests:
- poor signal quality reduces confidence
- fall + immobility raises risk
- SOS raises risk immediately
```

## CODEX PROMPT 5 — Crowd Risk Engine

```text
Read MASTER.md before making changes.

Implement Crowd Risk per zone.

Factors:
- density
- capacity utilization
- accumulation rate
- inflow/outflow imbalance
- movement slowdown
- fall cluster
- SOS cluster

All weights configurable.

Output: score, level, reasons, trend, recommended action.

Frontend:
show zone risk score, inflow/outflow, accumulation trend, explanation, heatmap color.

Create Concert Congestion scenario: B2 inflow progressively increases while outflow decreases.

Acceptance: B2 must transition through normal -> elevated -> high -> critical.
```

## CODEX PROMPT 6 — Gate Simulation + Population Integrity

```text
Read MASTER.md before making changes.

Implement gates table, gate events, gate simulator, and expected population calculation.

Implement Population Integrity Risk.

Compare:
- expected population from gates
- authenticated population from active bands
- observed population placeholder stream

Account for data confidence, gateway health and small normal errors.

Create Barricade Breach scenario:
- observed population increases by 80
- only 4 authenticated gate entries
- only 5 new authenticated bands

Generate Population Integrity alert.

Frontend:
show EXPECTED, AUTHENTICATED, OBSERVED side-by-side, difference and explanation.

Do not label people as illegal. Use 'Population Integrity Anomaly'.
```

## CODEX PROMPT 7 — CCTV Analytics

```text
Read MASTER.md before making changes.

Implement CCTV Analytics service.

MVP:
- ingest MP4 crowd footage
- detect people
- estimate frame-level person count
- smooth noisy counts
- output confidence
- publish observation to backend

Then add virtual line crossing, movement direction and approximate average movement speed if feasible.

Use OpenCV and an appropriate person detection model.

The service must expose an adapter so recorded demo footage can later be replaced by RTSP.

Add a synthetic fallback mode for machines without suitable model runtime.

Document model requirements.

Frontend:
show camera card with current count, confidence, zone and live/recorded state.
```

## CODEX PROMPT 8 — Sensor Fusion

```text
Read MASTER.md before making changes.

Implement the sensor-fusion layer.

Per zone combine:
- CCTV observed population
- authenticated wearable population
- gate expected population
- crowd risk
- gateway health
- CCTV confidence

The system must explicitly handle disagreement.

Examples:
CCTV high confidence + bands low -> integrity risk
CCTV low confidence + bands stable -> lower integrity certainty
gateway failure + CCTV stable -> probable sensing failure

Create a FusionExplanation model.

Frontend:
show source values, source confidence, fused interpretation and risk explanation.

No black-box AI language. Keep this explainable.
```

## CODEX PROMPT 9 — Intervention Engine

```text
Read MASTER.md before making changes.

Implement intervention recommendations.

Supported actions:
DISPATCH_MEDICAL
DISPATCH_SECURITY
RESTRICT_INFLOW
REDIRECT_TO_ZONE
BAND_CAUTION
BAND_EVACUATE
UPDATE_SIGNAGE
OPEN_ALTERNATE_ROUTE
OBSERVE_ONLY

Create rule-based recommendation logic.

Example:
B2 crowd risk critical
B3 capacity available
=> recommend REDIRECT_TO_ZONE B3 + RESTRICT_INFLOW B2

Frontend:
- operator can approve intervention
- show action timeline
- simulate band LED/vibration state changes in the Digital Twin
- simulate signage status

Every intervention must save baseline metrics.
```

## CODEX PROMPT 10 — Intervention Verification

```text
Read MASTER.md before making changes.

Implement intervention verification.

For each intervention store baseline risk, population, inflow/outflow, verification start and verification duration.

After intervention compare risk, population, accumulation and inflow/outflow.

Classify:
EFFECTIVE
PARTIALLY_EFFECTIVE
INEFFECTIVE
INCONCLUSIVE

Frontend:
show before/after cards and trend chart.

Scenario:
B2 risk starts around critical. Approve redirection to B3. Simulator must move a percentage of incoming virtual bands. B2 risk should decrease.

Do not fake the result. Verification must derive from actual simulated state changes.
```

## CODEX PROMPT 11 — Scenario Lab

```text
Read MASTER.md before making changes.

Build a Scenario Lab page for SIH demonstration.

Controls:
- Reset Event
- Start Normal Concert
- Trigger Individual Distress
- Trigger B2 Congestion
- Trigger Barricade Breach
- Trigger Gateway Failure
- Trigger Pilgrimage Checkpoint Overload
- Trigger Band Network Degradation
- Apply Suggested Intervention

Each scenario must be deterministic enough for a presentation.

Display a scenario timeline.

Add a Presentation Mode with larger labels and less UI clutter.
```

## CODEX PROMPT 12 — Pilgrimage Mode

```text
Read MASTER.md before making changes.

Add Pilgrimage deployment mode.

Create route-style Digital Twin:
ENTRY -> P1 -> P2 -> P3 -> P4 -> TEMPLE

Support:
- checkpoint counts
- corridor capacity
- route inflow/outflow
- distress clusters
- checkpoint overload
- alternate route recommendation

Create sample scenario:
P4 becomes overloaded. Multiple distress alerts rise. System recommends reducing inflow from P3 and opening alternate route.

Do not duplicate stadium UI blindly. Make the route visualization appropriate for pilgrimage movement.
```

## CODEX PROMPT 13 — Security + Audit

```text
Read MASTER.md before making changes.

Implement prototype security.

Add:
- operator authentication
- roles ADMIN, COMMAND_OPERATOR, MEDICAL_OPERATOR, SECURITY_OPERATOR, VIEWER
- API authorization
- audit logs
- secure environment configuration
- input validation
- rate limiting where appropriate

No real personal identities should be required.

Band IDs remain event-scoped.

Document future security requirements for hardware integration separately.
```

## CODEX PROMPT 14 — Performance and Reliability

```text
Read MASTER.md before making changes.

Run a performance and reliability pass.

Test:
- 10,000 virtual bands
- 50,000 band stress mode if feasible
- WebSocket reconnect
- Redis outage behavior
- simulator restart
- API restart
- gateway failure scenario
- CCTV feed unavailable scenario

Optimize aggregation, database writes, WebSocket payload frequency and frontend rendering.

Do not prematurely add Kafka.

Produce PERFORMANCE.md with test machine, band count, event throughput, CPU, memory, database load and observed limitations.
```

## CODEX PROMPT 15 — UI Polish

```text
Read MASTER.md before making changes.

Polish the entire command-centre UI for SIH presentation quality.

Design principles:
- serious emergency-operations aesthetic
- information dense but readable
- avoid generic SaaS dashboard appearance
- Digital Twin is primary
- clear risk hierarchy
- motion sparingly
- accessibility
- responsive for 1080p presentation display

Refine command centre, alerts, zone drawer, band distress view, scenario lab, CCTV cards, intervention verification and pilgrimage route.

Do not change product logic.
```

## CODEX PROMPT 16 — Full Verification

```text
Read MASTER.md before making changes.

Perform an end-to-end verification of the project.

Run backend tests, frontend tests, integration tests, Docker Compose, simulator and scenario lab.

Verify the complete demo story:
1. start normal event
2. show live 10k-band Digital Twin
3. trigger individual distress
4. generate Human Risk alert
5. trigger B2 congestion
6. generate Crowd Risk alert
7. trigger barricade breach
8. generate Population Integrity alert
9. approve crowd redirection
10. simulator redirects bands
11. risk decreases
12. intervention verification marks effective

Fix failures.

Produce DEMO.md containing exact presentation steps and fallback steps if a live component fails.
```

---

# 30. Final Definition of Done

The project is ready for the SIH presentation when:

- Docker Compose starts the full stack.
- Event can be loaded/reset.
- 10,000-band simulation runs reliably.
- Digital Twin updates live.
- Human Risk works.
- Crowd Risk works.
- Population Integrity Risk works.
- CCTV analytics or recorded-video demo works.
- Scenario presets work.
- Alerts are explainable.
- Intervention is operator-controlled.
- Intervention changes the simulator state.
- Verification derives from the new state.
- Pilgrimage mode can be demonstrated.
- No part of the system claims medical diagnosis.
- No part claims exact BLE GPS tracking.
- No real user personal data is required.
- DEMO.md exists.
- README.md is complete.

---

# 31. Golden Rule for Codex

Before implementing any feature:

1. Read `MASTER.md`.
2. Preserve the three-engine architecture.
3. Keep the system software-first.
4. Keep the Digital Twin central.
5. Prefer explainable rules over unnecessary black-box AI.
6. Do not invent hardware capabilities.
7. Do not introduce new infrastructure unless the current architecture demonstrably requires it.
8. Do not turn this into a generic event-management SaaS.
9. Every feature must strengthen Human Risk, Crowd Risk, Population Integrity, Response, or Verification.
10. If a feature does not strengthen one of those, leave it out of the SIH prototype.

---

# 32. One-Sentence Product Definition

> **A local-first Digital Twin and mass-gathering safety intelligence platform that fuses simulated wearable distress signals, CCTV crowd analytics and authenticated access data to detect Human Risk, Crowd Risk and Population Integrity anomalies, coordinate targeted intervention, and verify whether the intervention actually reduced danger.**
