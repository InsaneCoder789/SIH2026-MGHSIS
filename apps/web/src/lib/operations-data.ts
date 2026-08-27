import type { AlertCategory, RiskLevel, Scenario } from "@/lib/mghsis-demo";

export type AlertLifecycle = "NEW" | "ACKNOWLEDGED" | "RESOLVED";
export type InterventionStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";

export type OperationalAlert = {
  id: string;
  category: AlertCategory;
  severity: RiskLevel;
  title: string;
  zone: string;
  bandId?: number;
  description: string;
  explanation: string[];
  recommendedAction: string;
  createdAt: string;
  status: AlertLifecycle;
};

export type OperationalIntervention = {
  id: string;
  alertId: string;
  action: "DISPATCH_MEDICAL" | "DISPATCH_SECURITY" | "RESTRICT_INFLOW" | "REDIRECT_TO_ZONE" | "BAND_CAUTION";
  targetZone: string;
  reason: string;
  baselineRisk: number;
  projectedRisk: number;
  baselinePopulation: number;
  projectedPopulation: number;
  verificationWindow: string;
  status: InterventionStatus;
};

export type TimelineRecord = {
  id: string;
  time: string;
  type: "ALERT" | "ACTION" | "SYSTEM" | "SENSOR";
  title: string;
  detail: string;
  zone?: string;
  severity?: RiskLevel;
};

export type CameraFeed = {
  id: string;
  name: string;
  zone: string;
  status: "ONLINE" | "DEGRADED" | "OFFLINE";
  personCount: number;
  density: number;
  averageSpeed: number;
  restrictedCrossings: number;
  confidence: number;
  direction: "NORTH" | "SOUTH" | "EAST" | "WEST";
};

export const INITIAL_ALERTS: OperationalAlert[] = [
  { id: "ALT-001", category: "CROWD_RISK", severity: "critical", title: "Severe congestion developing", zone: "G", description: "Observed density and accumulation are rising while outflow remains constrained.", explanation: ["Density 91% of critical threshold", "Inflow 248/min exceeds outflow 37/min", "Average movement speed fell 42%"], recommendedAction: "REDIRECT_TO_ZONE", createdAt: "20:34:05", status: "NEW" },
  { id: "ALT-002", category: "POPULATION_INTEGRITY", severity: "high", title: "Population count mismatch", zone: "H", description: "Observed population exceeds expected and authenticated counts near Gate G8.", explanation: ["Observed count is 510 above authenticated", "CCTV confidence remains 91%", "Gateway reports healthy, requiring physical verification"], recommendedAction: "DISPATCH_SECURITY", createdAt: "20:33:59", status: "NEW" },
  { id: "ALT-003", category: "HUMAN_RISK", severity: "critical", title: "Potential wearer distress", zone: "C", bandId: 42, description: "Multiple safety signals indicate a high-priority wearer risk estimate.", explanation: ["Fall event detected", "SpO2 demo signal below configured range", "Immobility persisted for five minutes"], recommendedAction: "DISPATCH_MEDICAL", createdAt: "20:33:41", status: "NEW" },
  { id: "ALT-004", category: "HUMAN_RISK", severity: "critical", title: "Manual SOS trigger", zone: "G", bandId: 7, description: "Manual SOS has priority even where telemetry is incomplete.", explanation: ["SOS button state active", "Signal confidence 91%", "Immediate operator verification required"], recommendedAction: "DISPATCH_MEDICAL", createdAt: "20:33:32", status: "ACKNOWLEDGED" },
  { id: "ALT-005", category: "CROWD_RISK", severity: "high", title: "High density trend", zone: "F", description: "The zone is approaching its configured safe capacity.", explanation: ["Observed population at 86% capacity", "Five-minute density trend is rising", "Adjacent Zone E remains available"], recommendedAction: "RESTRICT_INFLOW", createdAt: "20:33:28", status: "NEW" },
  { id: "ALT-006", category: "POPULATION_INTEGRITY", severity: "moderate", title: "Re-entry pattern detected", zone: "Q", description: "Gate records contain duplicate event-scoped entry attempts.", explanation: ["Eight duplicate scans in three minutes", "No person-level accusation is generated", "Manual gate review recommended"], recommendedAction: "DISPATCH_SECURITY", createdAt: "20:33:11", status: "ACKNOWLEDGED" },
  { id: "ALT-007", category: "CROWD_RISK", severity: "moderate", title: "Queue accumulation", zone: "SPW", description: "Premium entry queue accumulation is above the warning threshold.", explanation: ["Inflow exceeds outflow by 23/min", "Average speed 0.51 m/s", "No fall cluster detected"], recommendedAction: "REDIRECT_TO_ZONE", createdAt: "20:32:51", status: "NEW" },
  { id: "ALT-008", category: "HUMAN_RISK", severity: "high", title: "Fall and immobility pattern", zone: "H", bandId: 298, description: "A fall event followed by low movement requires manual verification.", explanation: ["Fall event detected", "No meaningful movement for four minutes", "Connectivity remains online"], recommendedAction: "DISPATCH_MEDICAL", createdAt: "20:32:18", status: "NEW" },
  { id: "ALT-009", category: "POPULATION_INTEGRITY", severity: "high", title: "Restricted boundary crossings", zone: "B", description: "CCTV detected repeated crossings of a configured restricted boundary.", explanation: ["Seven restricted line crossings", "Camera confidence 92%", "Authenticated count variance also rising"], recommendedAction: "DISPATCH_SECURITY", createdAt: "20:31:58", status: "NEW" },
  { id: "ALT-010", category: "CROWD_RISK", severity: "moderate", title: "Outflow slowdown", zone: "D", description: "Zone outflow has remained below baseline for six minutes.", explanation: ["Outflow 49/min versus baseline 78/min", "Density remains below critical", "Observe and prepare alternate route"], recommendedAction: "RESTRICT_INFLOW", createdAt: "20:31:35", status: "RESOLVED" },
  { id: "ALT-011", category: "HUMAN_RISK", severity: "moderate", title: "Elevated telemetry trend", zone: "N", bandId: 555, description: "An elevated trend is present without fall, immobility, or SOS.", explanation: ["Heart-rate demo signal above configured range", "SpO2 remains stable", "Active movement reduces urgency"], recommendedAction: "BAND_CAUTION", createdAt: "20:31:22", status: "ACKNOWLEDGED" },
  { id: "ALT-012", category: "POPULATION_INTEGRITY", severity: "moderate", title: "Gateway count degradation", zone: "P", description: "Authenticated detections briefly dropped below the expected population model.", explanation: ["Gateway health fell to 78%", "CCTV population remained stable", "Likely infrastructure inconsistency"], recommendedAction: "DISPATCH_SECURITY", createdAt: "20:30:47", status: "RESOLVED" },
];

export const INITIAL_INTERVENTIONS: OperationalIntervention[] = [
  { id: "INT-001", alertId: "ALT-001", action: "REDIRECT_TO_ZONE", targetZone: "G", reason: "Redirect inflow from Block G toward Block F and open the alternate concourse route.", baselineRisk: 91, projectedRisk: 48, baselinePopulation: 2054, projectedPopulation: 1794, verificationWindow: "5 minutes", status: "PENDING" },
  { id: "INT-002", alertId: "ALT-003", action: "DISPATCH_MEDICAL", targetZone: "C", reason: "Dispatch the nearest medical responder to verify WB-042 at the zone-level location.", baselineRisk: 78, projectedRisk: 42, baselinePopulation: 1228, projectedPopulation: 1228, verificationWindow: "3 minutes", status: "PENDING" },
  { id: "INT-003", alertId: "ALT-002", action: "DISPATCH_SECURITY", targetZone: "H", reason: "Verify Gate G8 and the restricted boundary without attributing intent to individuals.", baselineRisk: 88, projectedRisk: 35, baselinePopulation: 1720, projectedPopulation: 1510, verificationWindow: "4 minutes", status: "PENDING" },
  { id: "INT-004", alertId: "ALT-005", action: "RESTRICT_INFLOW", targetZone: "F", reason: "Temporarily reduce inflow and direct new arrivals toward Block E.", baselineRisk: 62, projectedRisk: 44, baselinePopulation: 1198, projectedPopulation: 1110, verificationWindow: "5 minutes", status: "PENDING" },
  { id: "INT-005", alertId: "ALT-011", action: "BAND_CAUTION", targetZone: "N", reason: "Send a non-clinical caution and hydration prompt to the event-scoped band.", baselineRisk: 46, projectedRisk: 31, baselinePopulation: 3206, projectedPopulation: 3206, verificationWindow: "6 minutes", status: "PENDING" },
];

export const INITIAL_TIMELINE: TimelineRecord[] = [
  { id: "EV-001", time: "20:34:18", type: "SYSTEM", title: "Digital Twin synchronized", detail: "20,000 band states and 17 zone aggregates committed; 1,200 representative tracks rendered.", zone: "ALL" },
  { id: "EV-002", time: "20:34:05", type: "ALERT", title: "Congestion detected", detail: "Block G risk crossed the critical threshold.", zone: "G", severity: "critical" },
  { id: "EV-003", time: "20:33:59", type: "ALERT", title: "Population mismatch", detail: "Observed population diverged from authenticated count near Gate G8.", zone: "H", severity: "high" },
  { id: "EV-004", time: "20:33:41", type: "ALERT", title: "Human Risk alert", detail: "WB-042 produced fall, immobility, and low SpO2 demo signals.", zone: "C", severity: "critical" },
  { id: "EV-005", time: "20:33:32", type: "ACTION", title: "SOS acknowledged", detail: "Operator acknowledged WB-007 and requested field verification.", zone: "G" },
  { id: "EV-006", time: "20:33:28", type: "SENSOR", title: "Density trend rising", detail: "Camera CAM-F reported 1.92 persons per square metre.", zone: "F", severity: "high" },
  { id: "EV-007", time: "20:33:11", type: "SYSTEM", title: "Duplicate gate events correlated", detail: "Population Integrity engine grouped eight re-entry attempts.", zone: "Q" },
  { id: "EV-008", time: "20:32:51", type: "ALERT", title: "Premium queue accumulation", detail: "Warning threshold crossed at the west premium entrance.", zone: "SPW", severity: "moderate" },
  { id: "EV-009", time: "20:32:18", type: "ALERT", title: "Fall pattern detected", detail: "WB-298 entered a high Human Risk state.", zone: "H", severity: "high" },
  { id: "EV-010", time: "20:31:58", type: "SENSOR", title: "Restricted crossings", detail: "CAM-B counted seven configured boundary crossings.", zone: "B", severity: "high" },
  { id: "EV-011", time: "20:31:35", type: "ACTION", title: "Outflow intervention completed", detail: "Block D outflow recovered to its warning baseline.", zone: "D" },
  { id: "EV-012", time: "20:31:22", type: "SENSOR", title: "Elevated band trend", detail: "WB-555 remained active with stable SpO2.", zone: "N", severity: "moderate" },
];

export const CAMERA_FEEDS: CameraFeed[] = [
  { id: "CAM-01", name: "North Concourse", zone: "N", status: "ONLINE", personCount: 3206, density: 1.14, averageSpeed: .82, restrictedCrossings: 0, confidence: .94, direction: "EAST" },
  { id: "CAM-02", name: "Block G Bowl", zone: "G", status: "ONLINE", personCount: 1568, density: 1.92, averageSpeed: .42, restrictedCrossings: 1, confidence: .91, direction: "SOUTH" },
  { id: "CAM-03", name: "Gate G8 Approach", zone: "H", status: "ONLINE", personCount: 1720, density: 1.61, averageSpeed: .48, restrictedCrossings: 7, confidence: .92, direction: "WEST" },
  { id: "CAM-04", name: "Block F Upper", zone: "F", status: "ONLINE", personCount: 1198, density: 1.68, averageSpeed: .51, restrictedCrossings: 0, confidence: .93, direction: "SOUTH" },
  { id: "CAM-05", name: "West Premium Entry", zone: "SPW", status: "DEGRADED", personCount: 818, density: 1.34, averageSpeed: .56, restrictedCrossings: 0, confidence: .76, direction: "EAST" },
  { id: "CAM-06", name: "Block B Boundary", zone: "B", status: "ONLINE", personCount: 1392, density: 1.54, averageSpeed: .58, restrictedCrossings: 7, confidence: .92, direction: "NORTH" },
  { id: "CAM-07", name: "South Premium Centre", zone: "SPC", status: "ONLINE", personCount: 856, density: .88, averageSpeed: .74, restrictedCrossings: 0, confidence: .89, direction: "WEST" },
  { id: "CAM-08", name: "Block Q Gateway", zone: "Q", status: "DEGRADED", personCount: 3092, density: 1.31, averageSpeed: .69, restrictedCrossings: 0, confidence: .78, direction: "SOUTH" },
  { id: "CAM-09", name: "East Outer Bowl", zone: "R", status: "ONLINE", personCount: 2712, density: 1.02, averageSpeed: .81, restrictedCrossings: 0, confidence: .9, direction: "NORTH" },
  { id: "CAM-10", name: "West Outer Bowl", zone: "J", status: "ONLINE", personCount: 2314, density: .96, averageSpeed: .84, restrictedCrossings: 0, confidence: .91, direction: "NORTH" },
  { id: "CAM-11", name: "Service Bay 4", zone: "SPC", status: "OFFLINE", personCount: 0, density: 0, averageSpeed: 0, restrictedCrossings: 0, confidence: 0, direction: "EAST" },
  { id: "CAM-12", name: "Gate G3 Approach", zone: "M", status: "ONLINE", personCount: 2390, density: 1.08, averageSpeed: .77, restrictedCrossings: 0, confidence: .89, direction: "WEST" },
];

export const SCENARIO_CATALOG: Array<{ id: Scenario | "pilgrimage"; title: string; description: string; effect: string }> = [
  { id: "distress", title: "Individual Distress", description: "Inject a fall, immobility and abnormal telemetry trend into one event-scoped band.", effect: "Human Risk alert and medical recommendation" },
  { id: "congestion", title: "Stadium Congestion", description: "Raise Block G inflow while slowing outflow and average movement.", effect: "Crowd Risk increases from 76 to 91" },
  { id: "breach", title: "Barricade Breach", description: "Increase CCTV observed population without matching gate or band counts.", effect: "Population Integrity anomaly near Gate G8" },
  { id: "gateway", title: "Gateway Failure", description: "Reduce authenticated detections while observed population stays stable.", effect: "Infrastructure-weighted integrity alert" },
  { id: "pilgrimage", title: "Pilgrimage Overload", description: "Switch to a checkpoint corridor accumulation demonstration.", effect: "Route heat and checkpoint overload" },
  { id: "redirect", title: "Intervention Verification", description: "Redirect Block G inflow toward Block F and compare the new state.", effect: "Risk falls from 91 to 48" },
];
