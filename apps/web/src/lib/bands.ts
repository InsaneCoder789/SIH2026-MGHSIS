import { calculateHumanRisk, type HumanRiskLevel, type HumanRiskResult } from "@/lib/human-risk";

export type MotionState = "ACTIVE" | "WALKING" | "STATIONARY" | "IMMOBILE";
export type BandConnectivity = "ONLINE" | "DEGRADED" | "OFFLINE";
export type BandStatus = "NORMAL" | "ELEVATED" | "DISTRESSED" | "OFFLINE" | "SOS";

export type SafetyBand = {
  id: number;
  code: string;
  eventId: string;
  eventName: string;
  zone: string;
  segment: number;
  status: BandStatus;
  hr: number;
  spo2: number;
  motionState: MotionState;
  fallDetected: boolean;
  immobile: boolean;
  sos: boolean;
  battery: number;
  signalQuality: number;
  connectivity: BandConnectivity;
  connectivityReliability: number;
  persistenceMinutes: number;
  riskScore: number;
  riskLevel: HumanRiskLevel;
  risk: HumanRiskResult;
  lastSeen: string;
  dotPositionX: number;
  dotPositionY: number;
  history: {
    hr: number[];
    spo2: number[];
    battery: number[];
    movement: MotionState[];
  };
};

export type TwinMapBand = Pick<SafetyBand, "id" | "code" | "zone" | "status" | "sos" | "riskScore" | "dotPositionX" | "dotPositionY">;

export type BandRegistryRecord = Omit<SafetyBand, "risk" | "history" | "dotPositionX" | "dotPositionY">;

export type BandPopulationSummary = {
  total: number;
  active: number;
  distressed: number;
  elevated: number;
  offline: number;
  lowBattery: number;
  sos: number;
};

export const BAND_ZONES = ["M", "N", "P", "Q", "R", "J", "K", "L", "C", "D", "E", "F", "G", "H", "B", "SPW", "SPC", "SPE"] as const;
export const DEMO_BAND_COUNT = 50_000;
export const TWIN_RENDER_BAND_COUNT = 1_200;
export const TWIN_MAP_BAND_COUNT = 10_000;
export const ZONE_BAND_CAPACITIES: Record<(typeof BAND_ZONES)[number], number> = {
  M: 4_280, N: 5_020, P: 4_520, Q: 4_640, R: 4_280, J: 3_810, K: 4_050, L: 3_210,
  C: 1_900, D: 2_020, E: 1_550, F: 1_670, G: 1_960, H: 1_790, B: 1_900,
  SPW: 1_090, SPC: 1_170, SPE: 1_140,
};

export const ZONE_SEGMENT_COUNTS: Record<(typeof BAND_ZONES)[number], number> = {
  M: 6, N: 7, P: 6, Q: 6, R: 6, J: 6, K: 5, L: 4,
  C: 4, D: 6, E: 6, F: 6, G: 5, H: 5, B: 4,
  SPW: 3, SPC: 4, SPE: 3,
};

const zoneGeometry: Record<string, { start: number; end: number; inner: number; outer: number }> = {
  M: { start: 310, end: 352, inner: 256, outer: 334 }, N: { start: 352, end: 392, inner: 256, outer: 334 },
  P: { start: 32, end: 68, inner: 256, outer: 334 }, Q: { start: 68, end: 103, inner: 256, outer: 334 },
  R: { start: 103, end: 139, inner: 256, outer: 334 }, J: { start: 221, end: 257, inner: 256, outer: 334 },
  K: { start: 257, end: 286, inner: 256, outer: 334 }, L: { start: 286, end: 310, inner: 256, outer: 334 },
  C: { start: 281, end: 309, inner: 188, outer: 240 },
  D: { start: 309, end: 349, inner: 188, outer: 240 }, E: { start: 349, end: 385, inner: 188, outer: 240 },
  F: { start: 25, end: 61, inner: 188, outer: 240 }, G: { start: 61, end: 94, inner: 188, outer: 240 },
  H: { start: 94, end: 128, inner: 188, outer: 240 }, B: { start: 254, end: 281, inner: 188, outer: 240 },
  SPW: { start: 128, end: 161, inner: 188, outer: 240 }, SPC: { start: 161, end: 199, inner: 188, outer: 240 },
  SPE: { start: 199, end: 232, inner: 188, outer: 240 },
};

function seeded(id: number, salt: number) {
  const value = Math.sin(id * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

const zoneCapacityBoundaries = BAND_ZONES.reduce<Array<{ zone: (typeof BAND_ZONES)[number]; end: number }>>((items, zone) => {
  const previous = items.at(-1)?.end ?? 0;
  items.push({ zone, end: previous + ZONE_BAND_CAPACITIES[zone] });
  return items;
}, []);

function zoneAndSegmentFor(id: number) {
  // 7,919 is coprime with 50,000, producing a stable permutation with exact zone totals.
  const capacitySlot = ((id - 1) * 7_919) % DEMO_BAND_COUNT;
  const zone = zoneCapacityBoundaries.find((boundary) => capacitySlot < boundary.end)?.zone ?? BAND_ZONES.at(-1)!;
  const segment = Math.floor(seeded(id, 13) * ZONE_SEGMENT_COUNTS[zone]);
  return { zone, segment };
}

function populationSummary(count: number): BandPopulationSummary {
  const summary: BandPopulationSummary = { total: count, active: 0, distressed: 0, elevated: 0, offline: 0, lowBattery: 0, sos: 0 };
  for (let id = 1; id <= count; id += 1) {
    const signal = bandSignals(id);
    const status = statusFor(signal.connectivity, signal.risk.level, signal.sos);
    if (status === "OFFLINE") summary.offline += 1;
    else summary.active += 1;
    if (status === "DISTRESSED") summary.distressed += 1;
    if (status === "ELEVATED") summary.elevated += 1;
    if (status === "SOS") summary.sos += 1;
    if (signal.battery <= 20) summary.lowBattery += 1;
  }
  return summary;
}

export const DEMO_BAND_SUMMARY = populationSummary(DEMO_BAND_COUNT);

function dotFor(id: number, zone: (typeof BAND_ZONES)[number], segment: number) {
  const geometry = zoneGeometry[zone];
  const segmentCount = ZONE_SEGMENT_COUNTS[zone];
  const segmentWidth = (geometry.end - geometry.start) / segmentCount;
  const segmentStart = geometry.start + segment * segmentWidth;
  const angle = segmentStart + 0.8 + seeded(id, 1) * Math.max(0.5, segmentWidth - 1.6);
  let innerRadius = geometry.inner;
  let outerRadius = geometry.outer;
  if (zone === "SPW" || zone === "SPC" || zone === "SPE") {
    const tier = seeded(id, 12);
    if (tier >= 1 / 6 && tier < 2 / 6) [innerRadius, outerRadius] = [252, 286];
    else if (tier >= 2 / 6 && tier < 3 / 6) [innerRadius, outerRadius] = [298, 337];
    else if (tier >= 3 / 6 && tier < 4 / 6) [innerRadius, outerRadius] = [349, 377];
    else if (tier >= 4 / 6 && tier < 5 / 6) [innerRadius, outerRadius] = [388, 420];
    else if (tier >= 5 / 6) [innerRadius, outerRadius] = [432, 464];
  }
  const radius = innerRadius + 5 + seeded(id, 2) * (outerRadius - innerRadius - 10);
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: Number((450 + radius * Math.cos(radians)).toFixed(2)),
    y: Number((330 + radius * Math.sin(radians)).toFixed(2)),
  };
}

function trend(value: number, id: number, range: number, floor: number, ceiling: number) {
  return Array.from({ length: 12 }, (_, index) => Math.round(Math.min(ceiling, Math.max(floor, value + (seeded(id + index, index + 7) - 0.5) * range))));
}

function statusFor(connectivity: BandConnectivity, riskLevel: HumanRiskLevel, sos: boolean): BandStatus {
  if (connectivity === "OFFLINE") return "OFFLINE";
  if (sos) return "SOS";
  if (riskLevel === "CRITICAL" || riskLevel === "HIGH") return "DISTRESSED";
  if (riskLevel === "MODERATE") return "ELEVATED";
  return "NORMAL";
}

function bandSignals(id: number) {
  const { zone, segment } = zoneAndSegmentFor(id);
  const isOffline = id % 97 === 0 || id === 118 || id === 244;
  const sos = id === 7 || id % 173 === 0;
  const fallDetected = id === 42 || id % 149 === 0;
  const immobile = fallDetected || id === 84 || id === 231 || id % 211 === 0;
  const elevated = id % 37 === 0 || id === 55 || id === 219;
  const hr = sos ? 138 : fallDetected ? 132 : elevated ? 116 : 68 + Math.round(seeded(id, 4) * 34);
  const spo2 = fallDetected ? 88 : sos ? 91 : elevated ? 94 : 96 + Math.round(seeded(id, 5) * 3);
  const signalQuality = isOffline ? 0.18 : Number((0.68 + seeded(id, 6) * 0.31).toFixed(2));
  const connectivity: BandConnectivity = isOffline ? "OFFLINE" : signalQuality < 0.76 ? "DEGRADED" : "ONLINE";
  const connectivityReliability = isOffline ? 0.15 : connectivity === "DEGRADED" ? 0.72 : 0.97;
  const persistenceMinutes = sos || fallDetected ? 5 : elevated ? 3 : 1;
  const battery = id % 53 === 0 ? 8 + (id % 9) : 38 + Math.round(seeded(id, 8) * 61);
  const motionState: MotionState = immobile ? "IMMOBILE" : id % 5 === 0 ? "STATIONARY" : id % 2 === 0 ? "WALKING" : "ACTIVE";
  const timestamp = `2026-08-26T20:${String(34 - (id % 5)).padStart(2, "0")}:${String(10 + (id % 49)).padStart(2, "0")}+05:30`;
  const risk = calculateHumanRisk({ hr, spo2, fallDetected, immobile, sos, persistenceMinutes, signalQuality, connectivityReliability }, timestamp);
  return { id, zone, segment, connectivity, connectivityReliability, sos, fallDetected, immobile, hr, spo2, signalQuality, persistenceMinutes, battery, motionState, timestamp, risk };
}

function registryRecordFromSignal(id: number, signal: ReturnType<typeof bandSignals>): BandRegistryRecord {
  return {
    id,
    code: `WB-${String(id).padStart(5, "0")}`,
    eventId: "gt-vs-dc-ipl-2025",
    eventName: "GT vs DC - IPL 2025",
    zone: signal.zone,
    segment: signal.segment + 1,
    status: statusFor(signal.connectivity, signal.risk.level, signal.sos),
    hr: signal.hr,
    spo2: signal.spo2,
    motionState: signal.motionState,
    fallDetected: signal.fallDetected,
    immobile: signal.immobile,
    sos: signal.sos,
    battery: signal.battery,
    signalQuality: signal.signalQuality,
    connectivity: signal.connectivity,
    connectivityReliability: signal.connectivityReliability,
    persistenceMinutes: signal.persistenceMinutes,
    riskScore: signal.risk.score,
    riskLevel: signal.risk.level,
    lastSeen: signal.timestamp,
  };
}

export function generateBandRegistryRecord(id: number): BandRegistryRecord {
  return registryRecordFromSignal(id, bandSignals(id));
}

export function generateDemoBand(id: number): SafetyBand {
  const signal = bandSignals(id);
  const dot = dotFor(id, signal.zone, signal.segment);
  return {
    ...registryRecordFromSignal(id, signal),
    risk: signal.risk,
    dotPositionX: dot.x,
    dotPositionY: dot.y,
    history: {
      hr: trend(signal.hr, id, 16, 38, 170),
      spo2: trend(signal.spo2, id + 10, 4, 82, 100),
      battery: Array.from({ length: 12 }, (_, point) => Math.max(1, signal.battery + 11 - point)),
      movement: Array.from({ length: 12 }, (_, point) => point > 7 && signal.immobile ? "IMMOBILE" : point % 4 === 0 ? "STATIONARY" : "WALKING"),
    },
  };
}

export function generateDemoBands(count: number, startId = 1): SafetyBand[] {
  return Array.from({ length: count }, (_, index) => generateDemoBand(startId + index));
}

function twinSampleIds(count: number) {
  const sampleCount = Math.min(DEMO_BAND_COUNT, Math.max(1, Math.floor(count)));
  const priority = [7, 42, 55, 84, 118, 173, 211, 244, 298, 555].filter((id) => id <= DEMO_BAND_COUNT).slice(0, sampleCount);
  const ids = new Set(priority);
  const distributedCount = sampleCount - ids.size;

  for (let index = 0; index < distributedCount; index += 1) {
    const progress = distributedCount <= 1 ? 0 : index / (distributedCount - 1);
    ids.add(Math.round(1 + progress * (DEMO_BAND_COUNT - 1)));
  }

  for (let id = 1; ids.size < sampleCount && id <= DEMO_BAND_COUNT; id += 1) {
    ids.add(id);
  }

  return [...ids].toSorted((a, b) => a - b).slice(0, sampleCount);
}

export const TWIN_RENDER_BANDS = twinSampleIds(TWIN_RENDER_BAND_COUNT).map(generateDemoBand);
let twinMapBands: TwinMapBand[] | null = null;

function generateTwinMapBand(id: number): TwinMapBand {
  const signal = bandSignals(id);
  const status = statusFor(signal.connectivity, signal.risk.level, signal.sos);
  const dot = dotFor(id, signal.zone, signal.segment);
  return {
    id,
    code: `WB-${String(id).padStart(5, "0")}`,
    zone: signal.zone,
    status,
    sos: signal.sos,
    riskScore: signal.risk.score,
    dotPositionX: dot.x,
    dotPositionY: dot.y,
  };
}

export function getTwinMapBands() {
  if (!twinMapBands) twinMapBands = twinSampleIds(TWIN_MAP_BAND_COUNT).map(generateTwinMapBand);
  return twinMapBands;
}

let registryCatalog: BandRegistryRecord[] | null = null;

export function getBandRegistryCatalog() {
  if (!registryCatalog) registryCatalog = Array.from({ length: DEMO_BAND_COUNT }, (_, index) => generateBandRegistryRecord(index + 1));
  return registryCatalog;
}

export function getBandById(id: number | string) {
  const parsed = typeof id === "string" ? Number(id.replace(/^WB-/i, "")) : id;
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= DEMO_BAND_COUNT ? generateDemoBand(parsed) : undefined;
}

export function summarizeBands(bands: Array<Pick<BandRegistryRecord, "connectivity" | "status" | "battery" | "sos">>): BandPopulationSummary {
  return {
    total: bands.length,
    active: bands.filter((band) => band.connectivity !== "OFFLINE").length,
    distressed: bands.filter((band) => band.status === "DISTRESSED").length,
    elevated: bands.filter((band) => band.status === "ELEVATED").length,
    offline: bands.filter((band) => band.status === "OFFLINE").length,
    lowBattery: bands.filter((band) => band.battery <= 20).length,
    sos: bands.filter((band) => band.sos).length,
  };
}
