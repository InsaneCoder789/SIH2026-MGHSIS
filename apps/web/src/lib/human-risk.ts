export type HumanRiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type RecommendedAction =
  | "MONITOR_ONLY"
  | "SEND_CAUTION_ALERT"
  | "VERIFY_MANUALLY"
  | "DISPATCH_MEDICAL";

export type HumanRiskInput = {
  hr: number;
  spo2: number;
  fallDetected: boolean;
  immobile: boolean;
  sos: boolean;
  persistenceMinutes: number;
  signalQuality: number;
  connectivityReliability: number;
};

export type RiskContribution = {
  signal: "HR" | "SPO2" | "FALL" | "IMMOBILITY" | "SOS";
  weight: number;
  severity: number;
  points: number;
  explanation: string;
};

export type HumanRiskResult = {
  score: number;
  level: HumanRiskLevel;
  confidence: number;
  reasons: string[];
  contributions: RiskContribution[];
  recommendedAction: RecommendedAction;
  lastUpdated: string;
};

export const HUMAN_RISK_WEIGHTS = {
  hr: 0.2,
  spo2: 0.2,
  fall: 0.25,
  immobility: 0.15,
  sos: 0.2,
} as const;

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function hrSeverity(hr: number) {
  if (hr < 40 || hr > 145) return 1;
  if (hr < 48 || hr > 128) return 0.72;
  if (hr < 55 || hr > 110) return 0.38;
  return 0;
}

function spo2Severity(spo2: number) {
  if (spo2 < 88) return 1;
  if (spo2 < 92) return 0.75;
  if (spo2 < 95) return 0.4;
  return 0;
}

export function riskLevelFor(score: number): HumanRiskLevel {
  if (score >= 75) return "CRITICAL";
  if (score >= 55) return "HIGH";
  if (score >= 30) return "MODERATE";
  return "LOW";
}

function actionFor(level: HumanRiskLevel, input: HumanRiskInput): RecommendedAction {
  if (level === "CRITICAL" || (input.fallDetected && input.immobile)) return "DISPATCH_MEDICAL";
  if (level === "HIGH" || input.sos) return "VERIFY_MANUALLY";
  if (level === "MODERATE") return "SEND_CAUTION_ALERT";
  return "MONITOR_ONLY";
}

export function calculateHumanRisk(input: HumanRiskInput, timestamp = "2026-08-26T14:00:00+05:30"): HumanRiskResult {
  const hr = hrSeverity(input.hr);
  const spo2 = spo2Severity(input.spo2);
  const contributions: RiskContribution[] = [
    {
      signal: "HR",
      weight: HUMAN_RISK_WEIGHTS.hr,
      severity: hr,
      points: Math.round(hr * HUMAN_RISK_WEIGHTS.hr * 100),
      explanation: hr === 0 ? `HR ${input.hr} bpm is within the configured event range.` : `HR ${input.hr} bpm is outside the configured event range.`,
    },
    {
      signal: "SPO2",
      weight: HUMAN_RISK_WEIGHTS.spo2,
      severity: spo2,
      points: Math.round(spo2 * HUMAN_RISK_WEIGHTS.spo2 * 100),
      explanation: spo2 === 0 ? `SpO2 ${input.spo2}% is within the configured range.` : `SpO2 ${input.spo2}% is below the configured safety threshold.`,
    },
    {
      signal: "FALL",
      weight: HUMAN_RISK_WEIGHTS.fall,
      severity: input.fallDetected ? 1 : 0,
      points: input.fallDetected ? 25 : 0,
      explanation: input.fallDetected ? "A fall event was detected." : "No fall event is active.",
    },
    {
      signal: "IMMOBILITY",
      weight: HUMAN_RISK_WEIGHTS.immobility,
      severity: input.immobile ? 1 : 0,
      points: input.immobile ? 15 : 0,
      explanation: input.immobile ? "Movement remains below the immobility threshold." : "Movement is present.",
    },
    {
      signal: "SOS",
      weight: HUMAN_RISK_WEIGHTS.sos,
      severity: input.sos ? 1 : 0,
      points: input.sos ? 20 : 0,
      explanation: input.sos ? "The wearer triggered SOS." : "No manual SOS is active.",
    },
  ];

  const rawScore = contributions.reduce((sum, item) => sum + item.points, 0);
  const confidence = clamp(input.signalQuality * 0.6 + input.connectivityReliability * 0.4);
  const persistenceMultiplier = 1 + Math.min(0.22, Math.max(0, input.persistenceMinutes - 1) * 0.025);
  const confidenceAdjustment = 0.62 + confidence * 0.38;
  let score = Math.round(rawScore * persistenceMultiplier * confidenceAdjustment);

  if (input.sos) score = Math.max(score, 75);
  if (input.fallDetected && input.immobile && (hr > 0 || spo2 > 0)) score = Math.max(score, 78);
  score = Math.min(100, score);

  const level = riskLevelFor(score);
  const activeReasons = contributions.filter((item) => item.severity > 0).map((item) => item.explanation);
  const reasons = activeReasons.length > 0 ? activeReasons : ["No configured distress indicators are active."];
  if (input.persistenceMinutes >= 3 && activeReasons.length > 0) reasons.push(`Signals have persisted for ${input.persistenceMinutes} minutes.`);
  if (confidence < 0.6) reasons.push("Low signal confidence reduces certainty; manual verification is recommended.");

  return {
    score,
    level,
    confidence: Number(confidence.toFixed(2)),
    reasons,
    contributions,
    recommendedAction: actionFor(level, input),
    lastUpdated: timestamp,
  };
}
