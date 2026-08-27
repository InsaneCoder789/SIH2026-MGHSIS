# MGHSIS: SIH 2026 Presentation Content

This presentation model follows the supplied **SIH2026 Idea Presentation Format**.
The final submission must contain a maximum of **six slides, including the title
slide**. The template's seventh slide is an instruction page and must be deleted
before submission.

## Presentation Objective

By the end of the presentation, SIH judges should understand that MGHSIS is a
working, human-controlled crowd-safety intelligence platform combining a venue
Digital Twin, explainable ML risk analysis, scenario virtualisation, and a
hardware-ready data interface.

---

## Slide 1: TITLE PAGE

### Details to place on the slide

- **Problem Statement ID:** `[Fill from SIH portal]`
- **Problem Statement Title:** `[Use the exact SIH portal title]`
- **Theme:** `[Fill from SIH portal]`
- **PS Category:** `[Use the registered Software/Hardware category]`
- **Team ID:** `[Fill from SIH portal]`
- **Team Name:** `[Use the exact registered team name]`
- **Idea Title:** **MGHSIS - Mass-Gathering Human Safety Intelligence System**

### Visual direction

Keep the official SIH title-page layout and logo unchanged. Use only the
registered portal details and do not place technical explanations on this slide.

### Speaker notes

MGHSIS is an event-safety intelligence system for stadiums and other mass
gatherings. It gives operators a live spatial view of crowd conditions, predicts
emerging risks, explains why a zone may become unsafe, and allows response
strategies to be rehearsed before they are used during a real event.

---

## Slide 2: IDEA TITLE

### Proposed Solution (Describe your Idea/Solution/Prototype)

**MGHSIS creates a live, explainable safety Digital Twin for mass gatherings.**

- Maps a cricket stadium into **17 operational zones** and detailed segments.
- Tracks **1,200 event-scoped safety bands** and their latest status.
- Combines density, flow, distress, gate, weather, and infrastructure signals.
- Classifies each zone as **Low, Moderate, High, or Critical** risk.
- Shows risk scores, trends, contributing factors, alerts, and recommended actions.
- Simulates congestion, distress, barricade breach, and gateway failure.
- Keeps intervention approval and verification under human control.

### How it addresses the problem

- Replaces fragmented monitoring screens with one shared operational picture.
- Detects pressure through flow and capacity changes before it is visually obvious.
- Links alerts to the exact zone, segment, gate, camera, or safety band.
- Helps teams compare responses and verify whether conditions improve.

### Innovation and uniqueness

- The **Digital Twin, ML engine, and virtualisation** form one continuous workflow.
- Predictions include ranked reasons rather than only a warning colour.
- Scenario outcomes appear on the same stadium used for live monitoring.
- The system is hardware-ready without claiming facial recognition or personal GPS.

### Visual direction

Use one strong screenshot of `/digital-twin` showing the stadium heatmap, band
markers, zone rail, and virtualisation controls. Add only three short callouts:
**See**, **Predict**, and **Respond**.

### Speaker notes

The Digital Twin is the centre of MGHSIS. Operators can select a zone, inspect
its live measurements and band status, understand why the model raised its risk
level, and move directly into an intervention or rehearsal workflow. This is an
operational command system rather than a static visual dashboard.

---

## Slide 3: TECHNICAL APPROACH

### Technologies used

- **Frontend:** Next.js, React, and TypeScript
- **Backend:** FastAPI and Python
- **ML:** scikit-learn `HistGradientBoostingClassifier`
- **Observation contract:** event, source, timestamp, zone, sequence, and features
- **Current inputs:** simulator and manual observations
- **Integration-ready inputs:** CCTV analytics, BLE, RFID, counters, and sensors

### Methodology and implementation flow

`Sensors / Simulator -> Normalised Observation -> 22 ML Features -> Risk Prediction -> Digital Twin Heatmap -> Operator Alert -> Approved Intervention -> Outcome Verification`

### ML training and evaluation

- **100,000** deterministic synthetic zone observations
- **80,000 training / 20,000 testing** records with a stratified split
- **22 features** covering density, utilization, flow, movement, routes, exits,
  heat, crowd composition, distress signals, and sensor health
- **Outputs:** 0-100 score, risk class, confidence, trend, reasons, and guidance

| Evaluation metric | Current result |
|---|---:|
| Accuracy | 80.78% |
| Macro F1 | 75.69% |
| Critical-risk recall | 78.76% |
| Multiclass log loss | 0.4316 |

### Working prototype process

1. The backend receives or generates observations for all 17 zones.
2. The ML model scores each zone and returns an explainable prediction.
3. The Digital Twin updates colours, trends, alerts, and band context.
4. The operator selects a response such as redirecting the crowd.
5. Later observations show whether risk is falling or still increasing.

### Visual direction

Use one left-to-right architecture diagram. Put the four model metrics in a
compact evidence strip below it instead of presenting a dense table.

### Speaker notes

The model is trained locally using a reproducible synthetic dataset so the
complete pipeline can be demonstrated without collecting personal data.
Synthetic results validate the software and experimentation workflow, not final
field safety performance. Production use requires calibrated sensors,
field-labelled observations, temporal validation, drift monitoring, and
independent safety review.

---

## Slide 4: FEASIBILITY AND VIABILITY

### Feasibility of the idea

- A working Next.js interface and FastAPI inference service already exist.
- The twin models 17 zones, venue segments, gates, premium tiers, and 1,200 bands.
- Live Twin and Virtualisation use the same spatial model and risk language.
- Alerts support acknowledge/resolve; interventions support approve/reject/verify.
- Observations use source identities, timestamps, and sequence validation.
- Deployment can begin with existing CCTV and counters, then add BLE/RFID.

### Potential challenges and risks

- Synthetic data may not fully represent real crowd behaviour.
- Sensor blind spots, latency, drift, or failure can mislead the model.
- Rare critical incidents provide limited labelled examples.
- Venue geometry and safe capacities vary across events.
- Operators could over-trust automated recommendations under pressure.
- Physical deployment requires privacy, security, calibration, and reliability.

### Strategies for overcoming challenges

- Pilot controlled sections before attempting full-venue deployment.
- Calibrate using field-labelled, event-specific observations.
- Display confidence and sensor health; expose uncertainty clearly.
- Require human approval and verification for every intervention.
- Add temporal validation, drift monitoring, audit logs, and secure device identity.
- Run congestion, distress, breach, and gateway-failure drills before events.

### Viability roadmap

`Prototype -> Controlled Pilot -> Sensor Calibration -> Shadow Operation -> Safety Review -> Limited Live Deployment -> Multi-Venue Scale`

### Visual direction

Use three sections: **Ready Now**, **Deployment Risks**, and **Mitigation
Roadmap**. Include a small virtualisation view showing a critical zone recovering
after a redirect action.

### Speaker notes

The prototype proves the complete software path. The next phase is deliberately
staged because event safety cannot rely on an uncalibrated model. Shadow-mode
pilots allow predictions to be compared with operator observations before the
system influences live decisions.

---

## Slide 5: IMPACT AND BENEFITS

### Target audience

- Stadium and venue command centres
- Event organisers and crowd-safety teams
- Security, medical, gate, and field-response personnel
- Public authorities responsible for large gatherings

### Potential impact

- Earlier awareness of developing crowd pressure and distress
- Faster understanding of where a risk is forming and why
- More coordinated control-room and field-team decisions
- Safer rehearsal of interventions before gates open
- Measurable verification that an action improved the situation

### Benefits of the solution

- **Social:** supports safer movement, quicker response, and vulnerable groups.
- **Operational:** unifies zones, bands, alerts, cameras, and interventions.
- **Economic:** targets responses instead of closing large venue areas.
- **Environmental:** reuses available sensing infrastructure where practical.
- **Governance:** audits observations, predictions, approvals, and outcomes.

### Pilot success measures

- Critical-risk recall and false-alert rate on field-labelled observations
- Time from detection to operator acknowledgement
- Time from approved intervention to observed recovery
- Sensor uptime, data latency, and trustworthy zone coverage
- Operator agreement with explanations and recommended actions

### Visual direction

Show the journey **Fragmented Signals -> Shared Twin -> Explained Risk ->
Coordinated Response -> Verified Recovery** with a small risk trend line.

### Speaker notes

MGHSIS improves decision quality rather than replacing trained personnel. Its
value comes from early spatial awareness, explainable analysis, rehearsal, and
post-action verification. Pilot success must be measured through safety and
operational outcomes, not only ML accuracy.

---

## Slide 6: RESEARCH AND REFERENCES

### Crowd-safety and mass-gathering research

- World Health Organization, [**Generic All-Hazards Risk Assessment Tool for Mass Gathering Events**](https://www.who.int/publications/i/item/WHO-2023-Generic-Mass-gatherings-All-Hazards-RAtool-2023-1)
- UK Health and Safety Executive, [**Assess Crowd Safety Risks and Identify Hazards**](https://www.hse.gov.uk/event-safety/crowd-management-assess.htm)
- UK Health and Safety Executive, [**Put Crowd Controls in Place**](https://www.hse.gov.uk/event-safety/crowd-management-controls.htm)

### Technical references

- scikit-learn, [**HistGradientBoostingClassifier**](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.HistGradientBoostingClassifier.html)
- scikit-learn, [**Metrics and Scoring**](https://scikit-learn.org/stable/modules/model_evaluation.html)
- FastAPI, [**Official Documentation**](https://fastapi.tiangolo.com/)
- Next.js, [**App Router Documentation**](https://nextjs.org/docs/app)

### Project evidence

- Working Command Centre, Digital Twin, Bands, Alerts, Interventions, and CCTV
- Integrated scenario virtualisation and live ML heatmap
- Reproducible synthetic-data generator and ML training pipeline
- Evaluation report containing the 80/20 holdout results
- APIs for inference, simulation, interventions, and hardware observations

### Visual direction

Use short reference titles in two columns: **Safety Research** and **Technical
Foundation**. Add a repository QR code only after confirming sharing permission.

### Speaker notes

The safety approach follows all-hazards risk assessment and established
crowd-management principles covering arrival, circulation, exit, and dispersal.
The implementation uses documented open-source technologies. The team can show
the working repository and model report during judging where permitted.

---

## Submission Checklist

- Keep the final presentation to **six slides including the title slide**.
- Delete the template's **Important Instructions** slide.
- Preserve the supplied SIH template and all required content pointers.
- Prefer points, diagrams, infographics, and screenshots over paragraphs.
- Replace every bracketed title-page field with the exact portal value.
- Confirm the registered Problem Statement category before filling it in.
- Export the completed presentation as **PDF** for portal upload.
- Do not present synthetic results as proven real-world safety performance.
