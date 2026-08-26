# MGHSIS Presentation Model

## Presentation Title

**MGHSIS: Mass-Gathering Human Safety Intelligence System**

### Presentation Format

- Total slides: 7
- Suggested duration: 7 to 10 minutes
- Audience: judges, event-safety stakeholders, technical reviewers, and operations teams
- Product type: Next.js operations portal with FastAPI backend, Digital Twin, ML inference, and hardware-ready ingestion

---

## Slide 1: The Problem

### On-slide title

**Large Events Are Difficult to Observe in Real Time**

### On-slide content

- Stadiums contain thousands of people moving through different zones simultaneously.
- Crowd pressure can develop before an incident becomes visually obvious.
- Human distress, congestion, gate mismatches, and infrastructure failures are often monitored separately.
- Operators need one shared operational picture to decide quickly and responsibly.

### Visual direction

Use a stadium image or a dark stadium command-centre screenshot with highlighted zones, gates, and crowd movement. Keep the visual focused on the scale and complexity of a live event.

### Speaker notes

At a major event, the challenge is not only counting people. Operators must understand where people are, how quickly they are moving, whether inflow is exceeding outflow, whether exits are available, whether vulnerable groups may need support, and whether the sensing infrastructure is trustworthy. Existing tools can become fragmented dashboards. MGHSIS brings these signals into one operational system.

### Key message

**The problem is fragmented, delayed, and difficult-to-interpret safety information during mass gatherings.**

---

## Slide 2: Our Solution

### On-slide title

**MGHSIS Creates a Live Operational Digital Twin**

### On-slide content

- Digital twin of a cricket stadium
- 17 mapped venue zones and section segments
- 1,200 event-scoped safety bands
- Crowd, human-risk, and population-integrity monitoring
- Alerts, interventions, replay, analytics, CCTV, and system health
- One interface for observation, decision, and response verification

### Visual direction

Show the `/digital-twin` page in Live Twin mode. Highlight the stadium orbit, premium tiers, band markers, gates, cameras, heatmap, and live data rail.

### Speaker notes

The Digital Twin is the central spatial model of the venue. It connects the physical event layout to the software system. Each zone can be inspected, each segment can be compared, and each band can be opened for its current event-scoped status. The design is intended for repeated operational use, not only for a one-time visual demonstration.

### Key message

**MGHSIS turns the venue into a shared, spatially organized safety picture.**

---

## Slide 3: How the ML Model Works

### On-slide title

**From Sensor Signals to Explainable Crowd-Risk Predictions**

### On-slide content

The model evaluates 22 features, including:

- Current count, safe capacity, density, and utilization
- Inflow, outflow, accumulation, and movement slowdown
- Route width and exit availability
- Heat index and crowd composition
- Fall and SOS clusters
- CCTV confidence and gateway health

### Model output

- Risk score from 0 to 100
- LOW, MODERATE, HIGH, or CRITICAL classification
- Confidence and trend
- Ranked reasons for the prediction
- Recommended operator actions

### Speaker notes

The model is a scikit-learn HistGradientBoostingClassifier. The backend converts a current zone observation into the 22-feature contract, runs local inference, and returns both the risk classification and an explanation. The model does not identify people, diagnose medical conditions, or autonomously authorize interventions. It supports an operator decision.

### Key message

**The ML layer does not only produce a risk color; it explains the contributing factors and proposes a response path.**

---

## Slide 4: Training and Evaluation

### On-slide title

**A Reproducible 100,000-Record Training Pipeline**

### On-slide content

- 100,000 deterministic synthetic zone observations
- 80,000 records used for training
- 20,000 records held out for testing
- Four risk classes: Low, Moderate, High, Critical
- Stratified holdout to preserve class balance

### Evaluation results

| Metric | Result |
|---|---:|
| Accuracy | 80.78% |
| Macro F1 | 75.69% |
| Critical-risk recall | 78.76% |
| Multiclass log loss | 0.4316 |

### Visual direction

Show the Analytics page with the ML Inference Online panel. Emphasize the 80,000/20,000 split and critical recall rather than only headline accuracy.

### Speaker notes

The dataset is synthetic and is designed to validate the software pipeline, model loading, API behavior, and operator workflow. It is not being presented as proof of real-world safety performance. Critical-risk recall is displayed separately because missing a serious crowd condition is more important than optimizing a single headline metric. Real deployment requires field-labelled data, sensor calibration, temporal validation, drift monitoring, and independent review.

### Key message

**The system has a measurable and reproducible ML pipeline, with transparent limitations.**

---

## Slide 5: Real-Scenario Virtualisation

### On-slide title

**Operators Can Rehearse Escalation and Recovery Before a Live Event**

### On-slide content

The Virtualisation mode supports scenarios such as:

- Stadium congestion
- Individual distress
- Barricade breach
- Gateway failure
- Redirect response

### Simulation loop

1. A scenario generates changing zone observations.
2. The backend advances virtual time in 15-second steps.
3. All 17 zones are scored by the ML model.
4. The stadium sectors update with the current risk state.
5. Operators apply a response and observe recovery.

### Visual direction

Show `/digital-twin` in Virtualisation mode. Demonstrate Block G rising to `CRITICAL`, then apply `Redirect G` and show the risk score falling over later ticks.

### Speaker notes

This is the bridge between a static dashboard and an operational decision system. The simulator creates a repeatable event drill. A congestion scenario increases inflow, reduces outflow, slows movement, narrows the route, and reduces exits. The ML model detects the resulting pressure. When the operator applies a redirect or alternate route, the next observations change and the risk score responds.

### Key message

**The product can demonstrate what happens before, during, and after an intervention.**

---

## Slide 6: Operations and Hardware Readiness

### On-slide title

**Designed for Human-in-the-Loop Event Operations**

### On-slide content

- FastAPI backend for inference and event simulation
- Next.js operations interface
- Alerts with acknowledge and resolve lifecycle
- Interventions with approve, reject, and verify lifecycle
- Hardware observation contract for CCTV, BLE, RFID, manual, and simulator sources
- Replayable event timeline and auditable actions
- Zone and segment precision without facial recognition or GPS claims

### Visual direction

Use a simple flow diagram:

`Sensors / Cameras / Gateways -> Normalized Observation -> ML Risk Engine -> Operator Alert -> Approved Intervention -> Verification`

### Speaker notes

The current project is hardware-ready, not hardware-complete. The ingestion endpoint accepts event-scoped observations with source identity, timestamp, zone, and monotonic sequence numbers. Replayed or out-of-order observations are rejected. The future production path includes BLE gateway adapters, device provisioning, mutual TLS, PostgreSQL persistence, Redis/WebSocket updates, firmware signing, and field calibration.

### Key message

**MGHSIS keeps operators in control while providing a clear path from virtual commissioning to physical deployment.**

---

## Slide 7: Impact, Demonstration, and Roadmap

### On-slide title

**From Visibility to Safer, Measurable Decisions**

### On-slide content

### Demonstration flow

1. Open the Command Centre for the current event overview.
2. Open `/digital-twin` and inspect Live Twin mode.
3. Switch to Virtualisation.
4. Activate Stadium Congestion.
5. Watch Block G move toward CRITICAL and RISING_FAST.
6. Apply Redirect G or Open Alternate Route.
7. Observe the risk trend and verify the simulated recovery.

### Expected impact

- Earlier awareness of developing crowd pressure
- Faster access to the reason behind a warning
- More consistent operator decisions
- Safer rehearsal before an event
- Measurable verification of intervention outcomes

### Roadmap

- Connect calibrated physical sensors and wearable bands
- Collect and label real event data
- Add persistent event storage and real-time WebSocket fan-out
- Validate model performance in controlled field pilots
- Add drift monitoring, security hardening, and independent safety review

### Closing statement

**MGHSIS is a practical safety intelligence layer for mass gatherings: it unifies venue data, explains emerging risk, helps operators rehearse responses, and creates a responsible path toward real-world deployment.**

### Final speaker notes

The important distinction is that this project is not claiming that synthetic ML alone can guarantee safety. It demonstrates the complete foundation: a venue model, an evaluated inference pipeline, a real-time simulation loop, operator workflows, and a hardware integration boundary. The next phase is to replace simulated observations with calibrated field data while preserving the same explainable, human-controlled operating model.

