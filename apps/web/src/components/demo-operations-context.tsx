"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { INITIAL_ALERTS, INITIAL_INTERVENTIONS, INITIAL_TIMELINE, type OperationalAlert, type OperationalIntervention, type TimelineRecord } from "@/lib/operations-data";
import type { Scenario } from "@/lib/mghsis-demo";

type DemoOperationsState = {
  scenario: Scenario;
  deploymentMode: "CRICKET_STADIUM" | "PILGRIMAGE";
  alerts: OperationalAlert[];
  interventions: OperationalIntervention[];
  timeline: TimelineRecord[];
  activateScenario: (scenario: Scenario | "pilgrimage") => void;
  acknowledgeAlert: (id: string) => void;
  resolveAlert: (id: string) => void;
  approveIntervention: (id: string) => void;
  rejectIntervention: (id: string) => void;
  verifyIntervention: (id: string) => void;
  resetEvent: () => void;
};

const DemoOperationsContext = createContext<DemoOperationsState | null>(null);

function currentTime() {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date());
}

function sendSimulationCommand(body: Record<string, string>) {
  void fetch("/api/simulation", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => undefined);
}

function liveScenarioAlert(scenario: Scenario): OperationalAlert | null {
  const common = { id: "ALT-LIVE", createdAt: currentTime(), status: "NEW" as const };
  if (scenario === "distress") return { ...common, category: "HUMAN_RISK", severity: "critical", title: "Potential wearer distress", zone: "B", bandId: 42, description: "A fused fall, immobility and abnormal telemetry pattern requires operator review.", explanation: ["Fall and low movement signals align", "Abnormal telemetry trend persisted", "Sensor confidence is included in the score"], recommendedAction: "DISPATCH_MEDICAL" };
  if (scenario === "congestion") return { ...common, category: "CROWD_RISK", severity: "critical", title: "Crowd accumulation rising fast", zone: "G", description: "Five-minute projection shows Block G exceeding configured capacity while movement slows.", explanation: ["Inflow exceeds outflow", "Projected population crosses safe capacity", "Average movement remains below baseline"], recommendedAction: "REDIRECT_TO_ZONE" };
  if (scenario === "breach") return { ...common, category: "POPULATION_INTEGRITY", severity: "critical", title: "Population integrity mismatch", zone: "H", description: "CCTV-observed population diverges from gate and authenticated-band state near G8.", explanation: ["Observed population increased without matching entries", "Gateway remains available", "Physical verification is required; no individual accusation is made"], recommendedAction: "DISPATCH_SECURITY" };
  if (scenario === "gateway") return { ...common, category: "POPULATION_INTEGRITY", severity: "high", title: "Gateway confidence degraded", zone: "Q", description: "Authenticated detections fell while CCTV-observed population remained stable.", explanation: ["Gateway health is below the configured threshold", "Observed population remains credible", "Band count should be treated as incomplete"], recommendedAction: "OPEN_ALTERNATE_ROUTE" };
  return null;
}

export function DemoOperationsProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenario] = useState<Scenario>("normal");
  const [deploymentMode, setDeploymentMode] = useState<"CRICKET_STADIUM" | "PILGRIMAGE">("CRICKET_STADIUM");
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [interventions, setInterventions] = useState(INITIAL_INTERVENTIONS);
  const [timeline, setTimeline] = useState(INITIAL_TIMELINE);

  useEffect(() => {
    fetch("/api/simulation", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((payload: { scenario?: Scenario; active_action?: { action: string; zone_id: string } | null; verification?: { result: string } | null }) => {
        if (!payload.scenario || !["normal", "distress", "congestion", "breach", "gateway", "redirect"].includes(payload.scenario)) return;
        setScenario(payload.scenario);
        const liveAlert = liveScenarioAlert(payload.scenario);
        if (liveAlert) setAlerts((items) => [liveAlert, ...items.filter((alert) => alert.id !== liveAlert.id)]);
        setTimeline((items) => {
          const restored: TimelineRecord[] = [{ id: "EV-LIVE-RESTORED", time: currentTime(), type: "SYSTEM", title: `${payload.scenario} scenario active`, detail: "Live simulator state restored across the operations portal.", zone: liveAlert?.zone }];
          if (payload.active_action) restored.unshift({ id: "EV-ACTION-RESTORED", time: currentTime(), type: "ACTION", title: `${payload.active_action.action.replaceAll("_", " ")} active`, detail: payload.verification ? `Derived response status: ${payload.verification.result.replaceAll("_", " ")}.` : "Response verification is in progress.", zone: payload.active_action.zone_id });
          return [...restored, ...items.filter((item) => !item.id.endsWith("RESTORED"))];
        });
      })
      .catch(() => undefined);
  }, []);

  const addTimeline = useCallback((record: Omit<TimelineRecord, "id" | "time">) => {
    setTimeline((items) => [{ ...record, id: `EV-LIVE-${items.length + 1}`, time: currentTime() }, ...items]);
  }, []);

  const activateScenario = useCallback((next: Scenario | "pilgrimage") => {
    if (next === "pilgrimage") {
      setDeploymentMode("PILGRIMAGE");
      setScenario("normal");
      addTimeline({ type: "SYSTEM", title: "Pilgrimage mode activated", detail: "Digital Twin changed to checkpoint corridor demonstration.", zone: "ROUTE" });
      return;
    }
    sendSimulationCommand(next === "normal" ? { command: "reset" } : { command: "scenario", scenario: next });
    setDeploymentMode("CRICKET_STADIUM");
    setScenario(next);
    if (next === "normal") setAlerts(INITIAL_ALERTS);
    else {
      const liveAlert = liveScenarioAlert(next);
      if (liveAlert) setAlerts((items) => [liveAlert, ...items.filter((alert) => alert.id !== liveAlert.id)]);
      if (next === "redirect") setAlerts((items) => items.map((alert) => alert.category === "CROWD_RISK" ? { ...alert, status: "ACKNOWLEDGED" } : alert));
    }
    addTimeline({ type: next === "normal" ? "SYSTEM" : "ACTION", title: next === "normal" ? "Event reset to normal" : `${next} scenario activated`, detail: "Deterministic event state updated across the operations portal.", zone: next === "distress" ? "B" : next === "congestion" || next === "redirect" ? "G" : next === "breach" ? "H" : next === "gateway" ? "Q" : "ALL" });
  }, [addTimeline]);

  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts((items) => items.map((alert) => alert.id === id && alert.status === "NEW" ? { ...alert, status: "ACKNOWLEDGED" } : alert));
    addTimeline({ type: "ACTION", title: `${id} acknowledged`, detail: "Operator accepted ownership of the alert for verification." });
  }, [addTimeline]);

  const resolveAlert = useCallback((id: string) => {
    setAlerts((items) => items.map((alert) => alert.id === id ? { ...alert, status: "RESOLVED" } : alert));
    addTimeline({ type: "ACTION", title: `${id} resolved`, detail: "Operator closed the alert with an auditable status change." });
  }, [addTimeline]);

  const approveIntervention = useCallback((id: string) => {
    setInterventions((items) => items.map((item) => item.id === id ? { ...item, status: "APPROVED" } : item));
    const item = INITIAL_INTERVENTIONS.find((entry) => entry.id === id);
    if (item?.action === "REDIRECT_TO_ZONE") setScenario("redirect");
    if (item && ["DISPATCH_MEDICAL", "RESTRICT_INFLOW", "REDIRECT_TO_ZONE"].includes(item.action)) {
      sendSimulationCommand({ command: "action", action: item.action, zone_id: item.targetZone });
    }
    addTimeline({ type: "ACTION", title: `${id} approved`, detail: item?.reason ?? "Operator approved the recommended intervention.", zone: item?.targetZone });
  }, [addTimeline]);

  const rejectIntervention = useCallback((id: string) => {
    setInterventions((items) => items.map((item) => item.id === id ? { ...item, status: "REJECTED" } : item));
    addTimeline({ type: "ACTION", title: `${id} rejected`, detail: "Operator rejected the recommendation; no simulated state change was applied." });
  }, [addTimeline]);

  const verifyIntervention = useCallback((id: string) => {
    const intervention = interventions.find((item) => item.id === id);
    setInterventions((items) => items.map((item) => item.id === id && item.status === "APPROVED" ? { ...item, status: "COMPLETED" } : item));
    if (intervention) {
      setAlerts((items) => items.map((alert) => alert.id === intervention.alertId ? { ...alert, status: "RESOLVED" } : alert));
      addTimeline({ type: "SYSTEM", title: `${id} verified effective`, detail: `Risk changed from ${intervention.baselineRisk} to ${intervention.projectedRisk} after the simulated action.`, zone: intervention.targetZone });
    }
  }, [addTimeline, interventions]);

  const resetEvent = useCallback(() => {
    sendSimulationCommand({ command: "reset" });
    setScenario("normal"); setDeploymentMode("CRICKET_STADIUM"); setAlerts(INITIAL_ALERTS); setInterventions(INITIAL_INTERVENTIONS); setTimeline(INITIAL_TIMELINE);
  }, []);

  const value = useMemo(() => ({ scenario, deploymentMode, alerts, interventions, timeline, activateScenario, acknowledgeAlert, resolveAlert, approveIntervention, rejectIntervention, verifyIntervention, resetEvent }), [acknowledgeAlert, activateScenario, alerts, approveIntervention, deploymentMode, interventions, rejectIntervention, resetEvent, resolveAlert, scenario, timeline, verifyIntervention]);
  return <DemoOperationsContext.Provider value={value}>{children}</DemoOperationsContext.Provider>;
}

export function useDemoOperations() {
  const context = useContext(DemoOperationsContext);
  if (!context) throw new Error("useDemoOperations must be used inside DemoOperationsProvider");
  return context;
}
