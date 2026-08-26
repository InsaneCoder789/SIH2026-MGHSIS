"use client";

import { Check, ChevronRight, CircleX, Clock3, Play, Radio, ShieldCheck, Target, Workflow, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { useDemoOperations } from "@/components/demo-operations-context";
import { OperationsHeader } from "@/components/operations-header";

export function InterventionConsole() {
  const { interventions, alerts, approveIntervention, rejectIntervention, verifyIntervention } = useDemoOperations();
  const [selectedId, setSelectedId] = useState(interventions[0]?.id ?? "");
  const selected = interventions.find((item) => item.id === selectedId) ?? interventions[0];
  const alert = selected ? alerts.find((item) => item.id === selected.alertId) : null;
  const pending = interventions.filter((item) => item.status === "PENDING").length;
  const active = interventions.filter((item) => item.status === "APPROVED").length;
  const completed = interventions.filter((item) => item.status === "COMPLETED").length;
  const kpis: Array<{ label: string; value: string | number; icon: LucideIcon; tone: string }> = [
    { label: "Pending review", value: pending, icon: Clock3, tone: "orange" },
    { label: "Active actions", value: active, icon: Radio, tone: "teal" },
    { label: "Verified", value: completed, icon: ShieldCheck, tone: "green" },
    { label: "Projected reduction", value: "43%", icon: Target, tone: "blue" },
  ];

  return <main className="ops-module-page">
    <OperationsHeader section="Interventions" />
    <section className="module-title-band"><div><p className="eyebrow">Response Coordination</p><h1>Intervention Console</h1><p>Review recommendations, authorize simulated field actions, and verify whether risk actually decreased.</p></div><div className="module-title-status"><i /><span>Authorization</span><strong>Operator controlled</strong></div></section>
    <section className="module-kpis">{kpis.map(({ label, value, icon: Icon, tone }) => <article key={label} className={tone}><Icon size={18} /><span>{label}</span><strong>{value}</strong><small>Current event</small></article>)}</section>
    <div className="intervention-workspace">
      <section className="intervention-queue"><header><div><p className="eyebrow">Recommendation Queue</p><h2>{interventions.length} actions</h2></div><Workflow size={18} /></header>{interventions.map((item) => <button key={item.id} className={`${item.status.toLowerCase()} ${selected?.id === item.id ? "selected" : ""}`} onClick={() => setSelectedId(item.id)}><i /><div><span>{item.id} / {item.targetZone}</span><strong>{item.action.replaceAll("_"," ")}</strong><small>{item.reason}</small></div><b>{item.status}</b><ChevronRight size={14} /></button>)}</section>
      {selected ? <section className="intervention-detail">
        <header><div><span>{selected.id} / Linked alert {selected.alertId}</span><h2>{selected.action.replaceAll("_"," ")}</h2><p>{selected.reason}</p></div><b className={selected.status.toLowerCase()}>{selected.status}</b></header>
        <div className="intervention-evidence"><section><p className="eyebrow">Trigger evidence</p><strong>{alert?.title ?? "Operational recommendation"}</strong><span>{alert?.description}</span><ul>{alert?.explanation.map((reason) => <li key={reason}>{reason}</li>)}</ul></section><section><p className="eyebrow">Authorization scope</p><dl><div><dt>Target zone</dt><dd>{selected.targetZone}</dd></div><div><dt>Recommended by</dt><dd>MGHSIS rules engine</dd></div><div><dt>Verification window</dt><dd>{selected.verificationWindow}</dd></div><div><dt>Operator</dt><dd>Command Operator 1</dd></div></dl></section></div>
        <section className="verification-comparison"><header><div><p className="eyebrow">Intervention Verification</p><h3>Baseline vs projected state</h3></div>{selected.status === "COMPLETED" ? <strong><ShieldCheck size={15} /> Effective</strong> : <span>Awaiting completed action</span>}</header><div><article><span>Zone risk</span><div><i style={{ width: `${selected.baselineRisk}%` }} /><b>{selected.baselineRisk}</b></div><div className="after"><i style={{ width: `${selected.projectedRisk}%` }} /><b>{selected.projectedRisk}</b></div><small>{selected.baselineRisk - selected.projectedRisk} point reduction</small></article><article><span>Zone population</span><div><i style={{ width: "100%" }} /><b>{selected.baselinePopulation.toLocaleString()}</b></div><div className="after"><i style={{ width: `${Math.round(selected.projectedPopulation / selected.baselinePopulation * 100)}%` }} /><b>{selected.projectedPopulation.toLocaleString()}</b></div><small>{selected.baselinePopulation - selected.projectedPopulation} person change</small></article></div></section>
        <footer>{selected.status === "PENDING" ? <><button className="approve" onClick={() => approveIntervention(selected.id)}><Play size={15} />Approve & simulate</button><button className="reject" onClick={() => rejectIntervention(selected.id)}><CircleX size={15} />Reject</button></> : null}{selected.status === "APPROVED" ? <button className="approve" onClick={() => verifyIntervention(selected.id)}><Check size={15} />Complete verification</button> : null}{selected.status === "COMPLETED" ? <strong><ShieldCheck size={16} />Action verified from post-intervention state</strong> : null}{selected.status === "REJECTED" ? <strong className="rejected"><CircleX size={16} />No simulated state change applied</strong> : null}</footer>
      </section> : null}
    </div>
  </main>;
}
