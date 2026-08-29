"use client";

import Link from "next/link";
import { AlertTriangle, Check, ChevronRight, Clock3, FilterX, Search, ShieldAlert, Siren, UserCheck, type LucideIcon } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { useDemoOperations } from "@/components/demo-operations-context";
import { OperationsHeader } from "@/components/operations-header";
import type { AlertCategory, RiskLevel } from "@/lib/mghsis-demo";
import type { AlertLifecycle } from "@/lib/operations-data";

export function AlertFeed() {
  const { alerts, acknowledgeAlert, resolveAlert } = useDemoOperations();
  const [selectedId, setSelectedId] = useState(alerts[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.toLowerCase());
  const [category, setCategory] = useState<"ALL" | AlertCategory>("ALL");
  const [severity, setSeverity] = useState<"ALL" | RiskLevel>("ALL");
  const [status, setStatus] = useState<"ALL" | AlertLifecycle>("ALL");
  const filtered = useMemo(() => alerts.filter((alert) => {
    if (deferredQuery && !`${alert.id} ${alert.title} ${alert.zone} ${alert.description}`.toLowerCase().includes(deferredQuery)) return false;
    if (category !== "ALL" && alert.category !== category) return false;
    if (severity !== "ALL" && alert.severity !== severity) return false;
    if (status !== "ALL" && alert.status !== status) return false;
    return true;
  }), [alerts, category, deferredQuery, severity, status]);
  const selected = alerts.find((alert) => alert.id === selectedId) ?? filtered[0] ?? alerts[0];
  const clear = () => { setQuery(""); setCategory("ALL"); setSeverity("ALL"); setStatus("ALL"); };
  const counts = { new: alerts.filter((alert) => alert.status === "NEW").length, critical: alerts.filter((alert) => alert.severity === "critical" && alert.status !== "RESOLVED").length, acknowledged: alerts.filter((alert) => alert.status === "ACKNOWLEDGED").length, resolved: alerts.filter((alert) => alert.status === "RESOLVED").length };
  const kpis: Array<{ label: string; value: number; icon: LucideIcon; tone: string }> = [
    { label: "New", value: counts.new, icon: Siren, tone: "red" },
    { label: "Critical open", value: counts.critical, icon: AlertTriangle, tone: "red" },
    { label: "Acknowledged", value: counts.acknowledged, icon: UserCheck, tone: "teal" },
    { label: "Resolved", value: counts.resolved, icon: Check, tone: "green" },
  ];

  return <main className="ops-module-page">
    <OperationsHeader section="Alerts" />
    <section className="module-title-band"><div><p className="eyebrow">Incident Operations</p><h1>Live Alerts & Incidents</h1><p>Explainable Human, Crowd and Population Integrity alerts with operator-controlled lifecycle.</p></div><div className="module-title-status"><i /><span>Live feed</span><strong>{alerts.length} event alerts</strong></div></section>
    <section className="module-kpis">{kpis.map(({ label, value, icon: Icon, tone }) => <article key={label} className={tone}><Icon size={18} /><span>{label}</span><strong>{value}</strong><small>Current event</small></article>)}</section>
    <div className="alert-workspace">
      <section className="alert-feed-list">
        <header><div className="module-filter-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search alerts, zones, bands" aria-label="Search alert queue" /></div><select aria-label="Filter alerts by category" value={category} onChange={(event) => setCategory(event.target.value as typeof category)}><option>ALL</option><option>HUMAN_RISK</option><option>CROWD_RISK</option><option>POPULATION_INTEGRITY</option></select><select aria-label="Filter alerts by severity" value={severity} onChange={(event) => setSeverity(event.target.value as typeof severity)}><option>ALL</option><option>critical</option><option>high</option><option>moderate</option><option>low</option></select><select aria-label="Filter alerts by lifecycle" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option>ALL</option><option>NEW</option><option>ACKNOWLEDGED</option><option>RESOLVED</option></select><button title="Clear alert filters" onClick={clear}><FilterX size={15} /></button></header>
        <div className="alert-feed-count"><span>Incident queue</span><strong>{filtered.length} matching alerts</strong></div>
        <div className="alert-feed-rows">{filtered.map((alert) => <button key={alert.id} className={`${alert.severity} ${selected?.id === alert.id ? "selected" : ""}`} onClick={() => setSelectedId(alert.id)}><i /><time>{alert.createdAt}</time><div><strong>{alert.title}</strong><span>{alert.category.replaceAll("_"," ")} / Zone {alert.zone}{alert.bandId ? ` / WB-${String(alert.bandId).padStart(5,"0")}` : ""}</span></div><b>{alert.severity}<small>{alert.status}</small></b><ChevronRight size={14} /></button>)}</div>
      </section>
      {selected ? <aside className={`alert-inspector ${selected.severity}`}>
        <header><div><span>{selected.id} / {selected.category.replaceAll("_"," ")}</span><h2>{selected.title}</h2><small><Clock3 size={12} /> Created {selected.createdAt} / Zone {selected.zone}</small></div><b>{selected.severity}<small>{selected.status}</small></b></header>
        <section><p className="eyebrow">Operational interpretation</p><p>{selected.description}</p></section>
        <section><p className="eyebrow">Why this alert exists</p><ul>{selected.explanation.map((reason) => <li key={reason}><ShieldAlert size={14} /><span>{reason}</span></li>)}</ul></section>
        <section className="alert-action-recommendation"><p className="eyebrow">Recommended action</p><strong>{selected.recommendedAction.replaceAll("_"," ")}</strong><span>Recommendation requires operator authorization and field verification.</span></section>
        <section className="alert-lifecycle"><p className="eyebrow">Lifecycle</p><div><span className="done">Created<small>{selected.createdAt}</small></span><i /><span className={selected.status !== "NEW" ? "done" : ""}>Acknowledged<small>{selected.status !== "NEW" ? "Operator 1" : "Pending"}</small></span><i /><span className={selected.status === "RESOLVED" ? "done" : ""}>Resolved<small>{selected.status === "RESOLVED" ? "Verified" : "Pending"}</small></span></div></section>
        <footer>{selected.status === "NEW" ? <button className="acknowledge" onClick={() => acknowledgeAlert(selected.id)}><UserCheck size={15} />Acknowledge alert</button> : null}{selected.status !== "RESOLVED" ? <button onClick={() => resolveAlert(selected.id)}><Check size={15} />Resolve</button> : null}<Link href={`/interventions?alert=${selected.id}`}>Open intervention console<ChevronRight size={14} /></Link></footer>
      </aside> : <aside className="alert-inspector empty"><Search size={22} /><strong>No matching alert</strong></aside>}
    </div>
  </main>;
}
