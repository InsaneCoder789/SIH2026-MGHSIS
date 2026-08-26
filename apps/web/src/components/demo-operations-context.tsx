"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
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

export function DemoOperationsProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenario] = useState<Scenario>("normal");
  const [deploymentMode, setDeploymentMode] = useState<"CRICKET_STADIUM" | "PILGRIMAGE">("CRICKET_STADIUM");
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [interventions, setInterventions] = useState(INITIAL_INTERVENTIONS);
  const [timeline, setTimeline] = useState(INITIAL_TIMELINE);

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
    setDeploymentMode("CRICKET_STADIUM");
    setScenario(next);
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
