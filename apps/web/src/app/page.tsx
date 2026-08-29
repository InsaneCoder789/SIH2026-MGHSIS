import Link from "next/link";
import {
  Activity, AlertTriangle, ArrowUpRight, BarChart3, Camera, Clock3, Command,
  FlaskConical, HeartPulse, RadioTower, Settings, ShieldCheck, Siren, Users,
  Watch, Workflow,
} from "lucide-react";
import { OperationsHeader } from "@/components/operations-header";
import { DEMO_BAND_COUNT, DEMO_BAND_SUMMARY, TWIN_RENDER_BANDS } from "@/lib/bands";

const modules = [
  { title: "Command Centre", description: "Live venue Digital Twin, zone heat, alerts and interventions.", icon: RadioTower, metric: "12 active alerts", href: "/command-center", tone: "teal" },
  { title: "Dedicated Digital Twin", description: "Full venue view with a performant live sample, segment heat and zone intelligence.", icon: RadioTower, metric: `${DEMO_BAND_COUNT.toLocaleString()} tracked`, href: "/digital-twin", tone: "teal" },
  { title: "Band Registry", description: "Trace every registered Smart Safety Band and its risk state.", icon: Watch, metric: `${DEMO_BAND_COUNT.toLocaleString()} registered`, href: "/bands", tone: "blue" },
  { title: "Live Alerts & Incidents", description: "Triage Human, Crowd and Population Integrity alerts.", icon: Siren, metric: "3 critical", href: "/alerts", tone: "red" },
  { title: "Risk Analytics", description: "Compare risk history, zone trends and response effectiveness.", icon: BarChart3, metric: "7 zones elevated", href: "/analytics", tone: "orange" },
  { title: "CCTV & Zone Monitoring", description: "Inspect mapped feeds, observed counts and confidence.", icon: Camera, metric: "10 / 12 online", href: "/cctv", tone: "green" },
  { title: "Scenario Lab", description: "Trigger deterministic event conditions for SIH demonstration.", icon: FlaskConical, metric: "6 scenarios", href: "/scenario-lab", tone: "yellow" },
  { title: "Intervention Console", description: "Review, authorize and verify recommended field actions.", icon: Workflow, metric: "5 recommendations", href: "/interventions", tone: "teal" },
  { title: "Event Timeline / Replay", description: "Follow risk spikes, alerts and operator actions over time.", icon: Clock3, metric: "12+ audit events", href: "/replay", tone: "blue" },
  { title: "System Health", description: "Gateway, camera, API and real-time stream diagnostics.", icon: Activity, metric: "Live diagnostics", href: "/system-health", tone: "green" },
  { title: "Settings / Configuration", description: "Risk weights, event thresholds and deployment mode.", icon: Settings, metric: "Cricket mode", href: "/settings", tone: "neutral" },
] as const;

const incidents = [
  { time: "20:34:05", title: "Congestion developing", location: "Block G", severity: "SEVERE", type: "Crowd Risk" },
  { time: "20:33:59", title: "Population count mismatch", location: "Gate G8", severity: "HIGH", type: "Integrity" },
  { time: "20:33:41", title: "Potential wearer distress", location: "Block B", severity: "HIGH", type: "Human Risk" },
];

export default function HomePage() {
  const summary = DEMO_BAND_SUMMARY;
  const priorityBands = TWIN_RENDER_BANDS.filter((band) => band.status === "SOS" || band.status === "DISTRESSED").slice(0, 4);

  return (
    <main className="portal-page">
      <OperationsHeader section="Overview" />
      <section className="portal-event-band">
        <div><span>Active Event</span><strong>GT vs DC - IPL 2025</strong><small><i /> Live · Narendra Modi Stadium</small></div>
        <div><span>Mode</span><strong>Cricket Stadium</strong><small>Fixed sector deployment</small></div>
        <div><span>Authenticated</span><strong>{summary.active.toLocaleString()}</strong><small><Users size={13} /> Issued bands online</small></div>
        <div><span>Observed Estimate</span><strong>{summary.active.toLocaleString()}</strong><small>Sensor sources aligned</small></div>
        <div><span>Active Alerts</span><strong className="danger">12</strong><small><AlertTriangle size={13} /> Requires review</small></div>
        <div><span>System Health</span><strong className="healthy">Good</strong><small><ShieldCheck size={13} /> All core services</small></div>
      </section>

      <section className="portal-intro">
        <div>
          <p className="eyebrow">Operations Portal · Cricket Deployment</p>
          <h1>Mass-gathering safety intelligence, in one operating picture.</h1>
          <p>Monitor the venue, trace event-scoped bands, understand explainable risk and coordinate targeted response from a single local-first control surface.</p>
        </div>
        <Link href="/command-center" className="primary-command"><Command size={20} /><span>Enter Command Centre<small>Open live Digital Twin</small></span><ArrowUpRight size={19} /></Link>
      </section>

      <div className="portal-layout">
        <section className="module-section">
          <header><div><p className="eyebrow">Software Modules</p><h2>Operational workspace</h2></div><span>{modules.length} modules</span></header>
          <div className="module-grid">
            {modules.map(({ title, description, icon: Icon, metric, href, tone }) => (
              <Link href={href} key={title} className={`module-card ${tone}`}>
                <div className="module-icon"><Icon size={20} /></div><ArrowUpRight className="module-arrow" size={17} />
                <h3>{title}</h3><p>{description}</p><footer><span>{metric}</span><b>Open</b></footer>
              </Link>
            ))}
          </div>
        </section>

        <aside className="portal-rail">
          <section className="incident-stack">
            <header><div><p className="eyebrow">Priority Queue</p><h2>Top incidents</h2></div><Link href="/alerts">View all</Link></header>
            {incidents.map((incident) => <article key={incident.time}><time>{incident.time}</time><div><strong>{incident.title}</strong><span>{incident.type} · {incident.location}</span></div><b className={incident.severity.toLowerCase()}>{incident.severity}</b></article>)}
          </section>
          <section className="band-watchlist">
            <header><div><p className="eyebrow">Human Risk</p><h2>Band watchlist</h2></div><HeartPulse size={19} /></header>
            {priorityBands.map((band) => <Link href={`/bands/${band.id}`} key={band.id}><i className={band.status.toLowerCase()} /><div><strong>{band.code}</strong><span>Zone {band.zone} · HR {band.hr} · SpO2 {band.spo2}%</span></div><b>{band.riskScore}</b></Link>)}
            <footer><span>{summary.active} active</span><span>{summary.distressed} distressed</span><span>{summary.sos} SOS</span></footer>
          </section>
          <section className="health-summary" id="system-health">
            <header><div><p className="eyebrow">Infrastructure</p><h2>System health</h2></div><strong>GOOD</strong></header>
            {[['Band gateway','99.1%'],['CCTV fusion','96.8%'],['Event API','100%'],['Realtime stream','98.4%']].map(([label,value]) => <div key={label}><span>{label}</span><i><b style={{ width: value }} /></i><strong>{value}</strong></div>)}
          </section>
        </aside>
      </div>
    </main>
  );
}
