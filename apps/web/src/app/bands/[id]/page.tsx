import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, Battery, HeartPulse, MapPin, Radio, ShieldCheck, Siren, UserRoundCheck, Wifi } from "lucide-react";
import { OperationsHeader } from "@/components/operations-header";
import { TrendChart } from "@/components/trend-chart";
import { getBandById } from "@/lib/bands";

export default async function BandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const band = getBandById(id);
  if (!band) notFound();

  const actionLabels = { MONITOR_ONLY: "Monitor only", SEND_CAUTION_ALERT: "Send caution alert", VERIFY_MANUALLY: "Verify manually", DISPATCH_MEDICAL: "Dispatch medical team" } as const;
  return <main className="band-detail-page"><OperationsHeader section="Band Registry" />
    <section className="detail-heading"><Link href="/bands"><ArrowLeft size={16} />Back to registry</Link><div><p className="eyebrow">Individual Band Digital Twin</p><h1>{band.code}</h1><p>Event-scoped safety telemetry and explainable Human Risk estimation.</p></div><div className={`detail-risk ${band.riskLevel.toLowerCase()}`}><span>Human Risk</span><strong>{band.riskScore}</strong><b>{band.riskLevel}</b></div></section>
    <div className="detail-layout">
      <section className="detail-main">
        <div className="detail-status-grid">
          {[["Current Status",band.status,ShieldCheck],["Zone",`Block ${band.zone}`,MapPin],["Heart Rate",`${band.hr} bpm`,HeartPulse],["SpO2",`${band.spo2}%`,UserRoundCheck],["Battery",`${band.battery}%`,Battery],["Connectivity",band.connectivity,Wifi]].map(([label,value,Icon]) => <article key={String(label)}><Icon size={18} /><span>{String(label)}</span><strong>{String(value)}</strong></article>)}
        </div>
        <section className="telemetry-panel"><header><div><p className="eyebrow">Telemetry</p><h2>Live signal trends</h2></div><span>Last 12 samples</span></header><div className="telemetry-grid"><article><h3>Heart Rate <span>{band.hr} bpm</span></h3><TrendChart values={band.history.hr} color="#ff645c" suffix="" /></article><article><h3>SpO2 <span>{band.spo2}%</span></h3><TrendChart values={band.history.spo2} color="#2fc6ba" suffix="%" /></article><article><h3>Battery <span>{band.battery}%</span></h3><TrendChart values={band.history.battery} color="#47bc79" suffix="%" /></article></div></section>
        <section className="risk-explanation"><header><div><p className="eyebrow">Explainable Risk Engine</p><h2>Why this score was generated</h2></div><strong>{Math.round(band.risk.confidence * 100)}% confidence</strong></header><div className="contribution-grid">{band.risk.contributions.map((item) => <article key={item.signal}><div><span>{item.signal}</span><strong>+{item.points}</strong></div><i><b style={{ width: `${item.severity * 100}%` }} /></i><p>{item.explanation}</p></article>)}</div><ul>{band.risk.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul><footer><AlertTriangle size={15} />This is a safety risk estimate, not a clinical diagnosis.</footer></section>
      </section>
      <aside className="detail-rail">
        <section className="response-card"><header><Siren size={20} /><div><p className="eyebrow">Suggested Response</p><h2>{actionLabels[band.risk.recommendedAction]}</h2></div></header><p>{band.status === "NORMAL" ? "Continue passive monitoring and retain the current telemetry cadence." : "Confirm the wearer state using nearby field staff and preserve the alert audit trail."}</p><button>{actionLabels[band.risk.recommendedAction]}</button><small>Operator authorization required</small></section>
        <section className="mini-location"><header><p className="eyebrow">Approximate Location</p><h2>Zone {band.zone}</h2></header><svg viewBox="0 0 300 190" role="img" aria-label={`Approximate location for ${band.code} in zone ${band.zone}`}><ellipse cx="150" cy="94" rx="126" ry="76" className="mini-bowl" /><ellipse cx="150" cy="94" rx="68" ry="40" className="mini-field" /><circle cx={band.dotPositionX / 3} cy={band.dotPositionY / 3.5} r="5" className={`mini-band-dot ${band.status.toLowerCase()}`} /></svg><p><MapPin size={13} />Approximate zone-level position; not GPS tracking.</p></section>
        <section className="event-history"><header><p className="eyebrow">Event History</p><h2>Recent band events</h2></header>{[[band.lastSeen,"Telemetry packet received",Radio],[band.lastSeen,`${band.motionState.toLowerCase()} movement state`,ActivityIcon],[band.lastSeen,band.connectivity === "OFFLINE" ? "Gateway contact lost" : "Gateway contact confirmed",Wifi]].map(([time,label,Icon]) => <article key={String(label)}><Icon size={14} /><div><strong>{String(label)}</strong><time>{String(time).slice(11,19)}</time></div></article>)}</section>
      </aside>
    </div>
  </main>;
}

function ActivityIcon({ size }: { size?: number }) { return <Radio size={size} />; }
