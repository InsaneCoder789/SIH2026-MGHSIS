import { ZONE_BAND_CAPACITIES } from "@/lib/bands";

export type RiskLevel = "low" | "moderate" | "high" | "critical";
export type Scenario = "normal" | "distress" | "congestion" | "breach" | "gateway" | "redirect";

export type Zone = {
  id: string;
  label: string;
  ring: "outer" | "inner" | "premium";
  start: number;
  end: number;
  safeCapacity: number;
  expected: number;
  authenticated: number;
  observed: number;
  crowdRisk: number;
  integrityRisk: number;
  humanAlerts: number;
  inflow: number;
  outflow: number;
  cctvConfidence: number;
  gatewayHealth: number;
  adjacent: string[];
  gates: string[];
  cameras: string[];
};

export type AlertCategory = "HUMAN_RISK" | "CROWD_RISK" | "POPULATION_INTEGRITY";

export type DemoAlert = {
  id: string;
  category: AlertCategory;
  severity: RiskLevel;
  title: string;
  zoneId: string;
  zoneLabel: string;
  explanation: string[];
  recommendedAction: string;
  timestamp: string;
};

export type EventSummary = {
  id: string;
  name: string;
  eventType: "CRICKET";
  deploymentMode: "CRICKET_STADIUM";
  venue: {
    id: string;
    name: string;
    city: string;
    country: string;
    mapWidth: number;
    mapHeight: number;
  };
  expectedCapacity: number;
  eventTime: string;
  systemHealth: "GOOD" | "DEGRADED";
};

export type DigitalTwinSnapshot = {
  event: EventSummary;
  scenario: Scenario;
  zones: Zone[];
  totals: {
    expected: number;
    authenticated: number;
    observed: number;
    alerts: number;
    averageDensity: number;
    gatewayHealth: number;
    cctvConfidence: number;
  };
  alerts: DemoAlert[];
  timeline: string[];
};

export const demoEvent: EventSummary = {
  id: "gt-vs-dc-ipl-2025",
  name: "GT vs DC - IPL 2025",
  eventType: "CRICKET",
  deploymentMode: "CRICKET_STADIUM",
  venue: {
    id: "narendra-modi-style-demo",
    name: "Cricket Stadium Digital Twin",
    city: "Ahmedabad",
    country: "India",
    mapWidth: 720,
    mapHeight: 720,
  },
  expectedCapacity: 50_000,
  eventTime: "20:34 IST",
  systemHealth: "GOOD",
};

const baseZoneSeeds: Zone[] = [
  { id: "M", label: "Block M", ring: "outer", start: 214, end: 249, safeCapacity: 3600, expected: 2360, authenticated: 2332, observed: 2390, crowdRisk: 22, integrityRisk: 9, humanAlerts: 0, inflow: 86, outflow: 78, cctvConfidence: 0.9, gatewayHealth: 0.98, adjacent: ["N", "L", "D"], gates: ["G3"], cameras: [] },
  { id: "N", label: "Block N", ring: "outer", start: 250, end: 285, safeCapacity: 4200, expected: 3180, authenticated: 3139, observed: 3206, crowdRisk: 31, integrityRisk: 11, humanAlerts: 0, inflow: 112, outflow: 104, cctvConfidence: 0.91, gatewayHealth: 0.98, adjacent: ["M", "P", "E"], gates: ["G4"], cameras: [] },
  { id: "P", label: "Block P", ring: "outer", start: 286, end: 321, safeCapacity: 3800, expected: 2810, authenticated: 2798, observed: 2876, crowdRisk: 38, integrityRisk: 13, humanAlerts: 0, inflow: 128, outflow: 91, cctvConfidence: 0.88, gatewayHealth: 0.96, adjacent: ["N", "Q", "F"], gates: ["G5"], cameras: ["CAM-F"] },
  { id: "Q", label: "Block Q", ring: "outer", start: 322, end: 357, safeCapacity: 3900, expected: 2920, authenticated: 2895, observed: 3092, crowdRisk: 47, integrityRisk: 21, humanAlerts: 0, inflow: 145, outflow: 98, cctvConfidence: 0.89, gatewayHealth: 0.98, adjacent: ["P", "R", "G"], gates: ["G6"], cameras: [] },
  { id: "R", label: "Block R", ring: "outer", start: 358, end: 393, safeCapacity: 3600, expected: 2640, authenticated: 2614, observed: 2712, crowdRisk: 41, integrityRisk: 16, humanAlerts: 0, inflow: 116, outflow: 103, cctvConfidence: 0.87, gatewayHealth: 0.97, adjacent: ["Q", "J", "H"], gates: ["G7"], cameras: [] },
  { id: "J", label: "Block J", ring: "outer", start: 142, end: 177, safeCapacity: 3200, expected: 2280, authenticated: 2255, observed: 2314, crowdRisk: 26, integrityRisk: 10, humanAlerts: 0, inflow: 82, outflow: 88, cctvConfidence: 0.9, gatewayHealth: 0.98, adjacent: ["R", "K", "B"], gates: ["G1"], cameras: [] },
  { id: "K", label: "Block K", ring: "outer", start: 178, end: 213, safeCapacity: 3400, expected: 2510, authenticated: 2479, observed: 2551, crowdRisk: 29, integrityRisk: 12, humanAlerts: 0, inflow: 94, outflow: 86, cctvConfidence: 0.91, gatewayHealth: 0.98, adjacent: ["J", "L", "C"], gates: ["G2"], cameras: [] },
  { id: "L", label: "Block L", ring: "outer", start: 214, end: 237, safeCapacity: 2700, expected: 1940, authenticated: 1916, observed: 1988, crowdRisk: 25, integrityRisk: 10, humanAlerts: 0, inflow: 72, outflow: 68, cctvConfidence: 0.9, gatewayHealth: 0.98, adjacent: ["K", "M", "C", "D"], gates: ["G3"], cameras: [] },
  { id: "C", label: "Block C", ring: "inner", start: 195, end: 225, safeCapacity: 1600, expected: 1210, authenticated: 1194, observed: 1228, crowdRisk: 46, integrityRisk: 13, humanAlerts: 1, inflow: 64, outflow: 57, cctvConfidence: 0.91, gatewayHealth: 0.97, adjacent: ["K", "D", "SPC"], gates: [], cameras: ["CAM-B"] },
  { id: "D", label: "Block D", ring: "inner", start: 226, end: 258, safeCapacity: 1700, expected: 1370, authenticated: 1348, observed: 1411, crowdRisk: 52, integrityRisk: 17, humanAlerts: 0, inflow: 76, outflow: 49, cctvConfidence: 0.9, gatewayHealth: 0.98, adjacent: ["C", "E", "M"], gates: [], cameras: [] },
  { id: "E", label: "Block E", ring: "inner", start: 259, end: 289, safeCapacity: 1300, expected: 1030, authenticated: 1016, observed: 1084, crowdRisk: 58, integrityRisk: 19, humanAlerts: 0, inflow: 81, outflow: 46, cctvConfidence: 0.88, gatewayHealth: 0.96, adjacent: ["D", "F", "N"], gates: [], cameras: [] },
  { id: "F", label: "Block F", ring: "inner", start: 290, end: 320, safeCapacity: 1400, expected: 1135, authenticated: 1121, observed: 1198, crowdRisk: 62, integrityRisk: 22, humanAlerts: 0, inflow: 89, outflow: 51, cctvConfidence: 0.92, gatewayHealth: 0.98, adjacent: ["E", "G", "P"], gates: [], cameras: ["CAM-F"] },
  { id: "G", label: "Block G", ring: "inner", start: 321, end: 351, safeCapacity: 1650, expected: 1470, authenticated: 1444, observed: 1568, crowdRisk: 76, integrityRisk: 27, humanAlerts: 0, inflow: 126, outflow: 54, cctvConfidence: 0.91, gatewayHealth: 0.98, adjacent: ["F", "H", "Q"], gates: ["G8"], cameras: [] },
  { id: "H", label: "Block H", ring: "inner", start: 352, end: 382, safeCapacity: 1500, expected: 1180, authenticated: 1162, observed: 1210, crowdRisk: 44, integrityRisk: 14, humanAlerts: 0, inflow: 70, outflow: 68, cctvConfidence: 0.9, gatewayHealth: 0.97, adjacent: ["G", "R"], gates: ["G8"], cameras: [] },
  { id: "B", label: "Block B", ring: "inner", start: 164, end: 194, safeCapacity: 1600, expected: 1320, authenticated: 1301, observed: 1392, crowdRisk: 69, integrityRisk: 20, humanAlerts: 1, inflow: 111, outflow: 57, cctvConfidence: 0.9, gatewayHealth: 0.98, adjacent: ["J", "C", "SPW"], gates: [], cameras: ["CAM-B"] },
  { id: "SPW", label: "South Premium West", ring: "premium", start: 130, end: 170, safeCapacity: 920, expected: 790, authenticated: 772, observed: 818, crowdRisk: 35, integrityRisk: 15, humanAlerts: 0, inflow: 34, outflow: 31, cctvConfidence: 0.86, gatewayHealth: 0.96, adjacent: ["B", "SPC"], gates: ["VIP-1"], cameras: [] },
  { id: "SPC", label: "South Premium Centre", ring: "premium", start: 171, end: 209, safeCapacity: 980, expected: 840, authenticated: 829, observed: 856, crowdRisk: 28, integrityRisk: 9, humanAlerts: 0, inflow: 28, outflow: 35, cctvConfidence: 0.87, gatewayHealth: 0.97, adjacent: ["SPW", "SPE", "C"], gates: ["VIP-2"], cameras: [] },
  { id: "SPE", label: "South Premium East", ring: "premium", start: 210, end: 250, safeCapacity: 960, expected: 820, authenticated: 806, observed: 887, crowdRisk: 56, integrityRisk: 18, humanAlerts: 0, inflow: 55, outflow: 33, cctvConfidence: 0.89, gatewayHealth: 0.97, adjacent: ["SPC", "F"], gates: ["VIP-3"], cameras: [] },
];

export const baseZones: Zone[] = baseZoneSeeds.map((zone) => ({
  ...zone,
  safeCapacity: ZONE_BAND_CAPACITIES[zone.id as keyof typeof ZONE_BAND_CAPACITIES] ?? zone.safeCapacity,
}));

export const scenarioNotes: Record<Scenario, string> = {
  normal: "Normal GT vs DC event state with live aggregate telemetry.",
  distress: "Human Risk scenario: fall + low movement + abnormal SpO2 trend in Block B.",
  congestion: "Crowd Risk scenario: Block G inflow rises while outflow drops.",
  breach: "Population Integrity scenario: observed count diverges near Gate G8.",
  gateway: "Gateway failure scenario: authenticated bands drop while CCTV stays stable.",
  redirect: "Intervention scenario: inflow is redirected from Block G toward Block F.",
};

export function levelFor(score: number): RiskLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 35) return "moderate";
  return "low";
}

export function overallRisk(zone: Zone) {
  return Math.round(zone.crowdRisk * 0.55 + zone.integrityRisk * 0.2 + zone.humanAlerts * 12);
}

export function applyScenario(scenario: Scenario, liveTick = 0): Zone[] {
  return baseZones.map((zone) => {
    if (scenario === "distress" && zone.id === "B") {
      return { ...zone, humanAlerts: 4, crowdRisk: 74, observed: zone.observed + 42 };
    }
    if (scenario === "congestion" && zone.id === "G") {
      return { ...zone, crowdRisk: 91, inflow: 248, outflow: 37, observed: zone.observed + 486, authenticated: zone.authenticated + 322 };
    }
    if (scenario === "breach" && zone.id === "H") {
      return { ...zone, integrityRisk: 88, observed: zone.observed + 510, authenticated: zone.authenticated + 5, expected: zone.expected + 4 };
    }
    if (scenario === "gateway" && zone.id === "Q") {
      return { ...zone, integrityRisk: 82, authenticated: Math.round(zone.authenticated * 0.62), crowdRisk: 48, gatewayHealth: 0.62 };
    }
    if (scenario === "redirect" && zone.id === "G") {
      return { ...zone, crowdRisk: 48, inflow: 82, outflow: 116, observed: zone.observed - 260 };
    }
    if (scenario === "redirect" && zone.id === "F") {
      return { ...zone, crowdRisk: 54, inflow: 136, observed: zone.observed + 168 };
    }
    return zone;
  }).map((zone, index) => {
    if (liveTick === 0) return zone;
    const phase = liveTick * 0.47 + index * 0.73;
    const flowPressure = Math.max(-60, Math.min(60, zone.inflow - zone.outflow));
    const observedDelta = Math.round(
      Math.sin(phase) * zone.safeCapacity * 0.0035
      + Math.cos(phase * 0.61) * zone.safeCapacity * 0.0015
      + flowPressure * 0.08,
    );
    const authenticatedDelta = Math.round(Math.sin(phase * 0.79) * zone.safeCapacity * 0.0018);
    return {
      ...zone,
      observed: Math.max(0, Math.min(Math.round(zone.safeCapacity * 1.35), zone.observed + observedDelta)),
      authenticated: Math.max(0, Math.min(zone.observed + observedDelta, zone.authenticated + authenticatedDelta)),
    };
  });
}

export function aggregateZones(zones: Zone[]) {
  const totals = zones.reduce(
    (acc, zone) => ({
      expected: acc.expected + zone.expected,
      authenticated: acc.authenticated + zone.authenticated,
      observed: acc.observed + zone.observed,
      alerts: acc.alerts + zone.humanAlerts + (zone.crowdRisk > 60 ? 1 : 0) + (zone.integrityRisk > 60 ? 1 : 0),
      density: acc.density + zone.observed / Math.max(zone.safeCapacity, 1),
      gatewayHealth: acc.gatewayHealth + zone.gatewayHealth,
      cctvConfidence: acc.cctvConfidence + zone.cctvConfidence,
    }),
    { expected: 0, authenticated: 0, observed: 0, alerts: 0, density: 0, gatewayHealth: 0, cctvConfidence: 0 },
  );

  return {
    expected: totals.expected,
    authenticated: totals.authenticated,
    observed: totals.observed,
    alerts: Math.max(12, totals.alerts),
    averageDensity: Number((totals.density / zones.length).toFixed(2)),
    gatewayHealth: Number((totals.gatewayHealth / zones.length).toFixed(2)),
    cctvConfidence: Number((totals.cctvConfidence / zones.length).toFixed(2)),
  };
}

export function deriveAlerts(zones: Zone[], scenario: Scenario): DemoAlert[] {
  const byId = Object.fromEntries(zones.map((zone) => [zone.id, zone]));
  const humanZone = scenario === "distress" ? byId.B : byId.C;
  const crowdZone = scenario === "redirect" ? byId.F : byId.G;
  const integrityZone = scenario === "breach" ? byId.H : byId.Q;

  return [
    {
      id: "alert-human-001",
      category: "HUMAN_RISK",
      severity: scenario === "distress" ? "critical" : "high",
      title: "Person in distress",
      zoneId: humanZone.id,
      zoneLabel: humanZone.label,
      explanation: ["Fall or low movement signal", "Abnormal vital telemetry trend", "Sensor confidence included in score"],
      recommendedAction: "DISPATCH_MEDICAL",
      timestamp: "20:33:41",
    },
    {
      id: "alert-crowd-001",
      category: "CROWD_RISK",
      severity: levelFor(crowdZone.crowdRisk),
      title: "Congestion developing",
      zoneId: crowdZone.id,
      zoneLabel: crowdZone.label,
      explanation: ["Observed density rising", "Inflow exceeds outflow", "Movement slowdown detected"],
      recommendedAction: scenario === "redirect" ? "VERIFY_REDIRECT_TO_ZONE" : "REDIRECT_TO_ZONE",
      timestamp: "20:34:05",
    },
    {
      id: "alert-integrity-001",
      category: "POPULATION_INTEGRITY",
      severity: levelFor(integrityZone.integrityRisk),
      title: "Population Integrity Anomaly",
      zoneId: integrityZone.id,
      zoneLabel: integrityZone.label,
      explanation: ["Expected/authenticated/observed populations disagree", "CCTV confidence and gateway health considered", "No individual accusation is made"],
      recommendedAction: scenario === "gateway" ? "CHECK_GATEWAY_HEALTH" : "DISPATCH_SECURITY",
      timestamp: "20:33:59",
    },
  ];
}

export function getDigitalTwinSnapshot(scenario: Scenario = "normal", liveTick = 0): DigitalTwinSnapshot {
  const zones = applyScenario(scenario, liveTick);
  const totals = aggregateZones(zones);

  return {
    event: {
      ...demoEvent,
      systemHealth: scenario === "gateway" ? "DEGRADED" : "GOOD",
    },
    scenario,
    zones,
    totals,
    alerts: deriveAlerts(zones, scenario),
    timeline: [
      "20:34:05 Congestion detected - Block G",
      "20:33:59 Population Integrity Anomaly - Gate G8",
      "20:33:41 Medical team dispatched - Block B",
      "20:32:51 CCTV observation fused - South Premium East",
    ],
  };
}

export function parseScenario(value: string | null): Scenario {
  const scenarios: Scenario[] = ["normal", "distress", "congestion", "breach", "gateway", "redirect"];
  return scenarios.includes(value as Scenario) ? (value as Scenario) : "normal";
}
