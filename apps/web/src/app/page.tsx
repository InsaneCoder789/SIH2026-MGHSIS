"use client";

import Image from "next/image";
import {
  Activity,
  AlertTriangle,
  Ambulance,
  ArrowRightLeft,
  BadgeCheck,
  Camera,
  CircleDot,
  Gauge,
  Radio,
  RotateCcw,
  ShieldAlert,
  Siren,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

type RiskLevel = "low" | "moderate" | "high" | "critical";
type Scenario = "normal" | "distress" | "congestion" | "breach" | "gateway" | "redirect";

type Zone = {
  id: string;
  label: string;
  ring: "outer" | "inner" | "premium";
  start: number;
  end: number;
  expected: number;
  authenticated: number;
  observed: number;
  crowdRisk: number;
  integrityRisk: number;
  humanAlerts: number;
  inflow: number;
  outflow: number;
};

const baseZones: Zone[] = [
  { id: "M", label: "Block M", ring: "outer", start: 214, end: 249, expected: 2360, authenticated: 2332, observed: 2390, crowdRisk: 22, integrityRisk: 9, humanAlerts: 0, inflow: 86, outflow: 78 },
  { id: "N", label: "Block N", ring: "outer", start: 250, end: 285, expected: 3180, authenticated: 3139, observed: 3206, crowdRisk: 31, integrityRisk: 11, humanAlerts: 0, inflow: 112, outflow: 104 },
  { id: "P", label: "Block P", ring: "outer", start: 286, end: 321, expected: 2810, authenticated: 2798, observed: 2876, crowdRisk: 38, integrityRisk: 13, humanAlerts: 0, inflow: 128, outflow: 91 },
  { id: "Q", label: "Block Q", ring: "outer", start: 322, end: 357, expected: 2920, authenticated: 2895, observed: 3092, crowdRisk: 47, integrityRisk: 21, humanAlerts: 0, inflow: 145, outflow: 98 },
  { id: "R", label: "Block R", ring: "outer", start: 358, end: 393, expected: 2640, authenticated: 2614, observed: 2712, crowdRisk: 41, integrityRisk: 16, humanAlerts: 0, inflow: 116, outflow: 103 },
  { id: "J", label: "Block J", ring: "outer", start: 142, end: 177, expected: 2280, authenticated: 2255, observed: 2314, crowdRisk: 26, integrityRisk: 10, humanAlerts: 0, inflow: 82, outflow: 88 },
  { id: "K", label: "Block K", ring: "outer", start: 178, end: 213, expected: 2510, authenticated: 2479, observed: 2551, crowdRisk: 29, integrityRisk: 12, humanAlerts: 0, inflow: 94, outflow: 86 },
  { id: "C", label: "Block C", ring: "inner", start: 195, end: 225, expected: 1210, authenticated: 1194, observed: 1228, crowdRisk: 46, integrityRisk: 13, humanAlerts: 1, inflow: 64, outflow: 57 },
  { id: "D", label: "Block D", ring: "inner", start: 226, end: 258, expected: 1370, authenticated: 1348, observed: 1411, crowdRisk: 52, integrityRisk: 17, humanAlerts: 0, inflow: 76, outflow: 49 },
  { id: "E", label: "Block E", ring: "inner", start: 259, end: 289, expected: 1030, authenticated: 1016, observed: 1084, crowdRisk: 58, integrityRisk: 19, humanAlerts: 0, inflow: 81, outflow: 46 },
  { id: "F", label: "Block F", ring: "inner", start: 290, end: 320, expected: 1135, authenticated: 1121, observed: 1198, crowdRisk: 62, integrityRisk: 22, humanAlerts: 0, inflow: 89, outflow: 51 },
  { id: "G", label: "Block G", ring: "inner", start: 321, end: 351, expected: 1470, authenticated: 1444, observed: 1568, crowdRisk: 76, integrityRisk: 27, humanAlerts: 0, inflow: 126, outflow: 54 },
  { id: "H", label: "Block H", ring: "inner", start: 352, end: 382, expected: 1180, authenticated: 1162, observed: 1210, crowdRisk: 44, integrityRisk: 14, humanAlerts: 0, inflow: 70, outflow: 68 },
  { id: "B", label: "Block B", ring: "inner", start: 164, end: 194, expected: 1320, authenticated: 1301, observed: 1392, crowdRisk: 69, integrityRisk: 20, humanAlerts: 1, inflow: 111, outflow: 57 },
  { id: "SPW", label: "South Premium West", ring: "premium", start: 130, end: 170, expected: 790, authenticated: 772, observed: 818, crowdRisk: 35, integrityRisk: 15, humanAlerts: 0, inflow: 34, outflow: 31 },
  { id: "SPC", label: "South Premium Centre", ring: "premium", start: 171, end: 209, expected: 840, authenticated: 829, observed: 856, crowdRisk: 28, integrityRisk: 9, humanAlerts: 0, inflow: 28, outflow: 35 },
  { id: "SPE", label: "South Premium East", ring: "premium", start: 210, end: 250, expected: 820, authenticated: 806, observed: 887, crowdRisk: 56, integrityRisk: 18, humanAlerts: 0, inflow: 55, outflow: 33 },
];

const scenarioNotes: Record<Scenario, string> = {
  normal: "Normal GT vs DC event state with live aggregate telemetry.",
  distress: "Human Risk scenario: fall + low movement + abnormal SpO2 trend in Block B.",
  congestion: "Crowd Risk scenario: Block G inflow rises while outflow drops.",
  breach: "Population Integrity scenario: observed count diverges near Gate G8.",
  gateway: "Gateway failure scenario: authenticated bands drop while CCTV stays stable.",
  redirect: "Intervention scenario: inflow is redirected from Block G toward Block F.",
};

const scenarioConfig: Record<Scenario, { label: string; icon: typeof Siren; tone: string }> = {
  normal: { label: "Reset", icon: RotateCcw, tone: "border-slate-600 text-slate-200 hover:border-slate-400" },
  distress: { label: "Distress", icon: Ambulance, tone: "border-red-500/60 text-red-200 hover:border-red-300" },
  congestion: { label: "Congestion", icon: Users, tone: "border-orange-500/60 text-orange-200 hover:border-orange-300" },
  breach: { label: "Breach", icon: ShieldAlert, tone: "border-yellow-500/60 text-yellow-100 hover:border-yellow-300" },
  gateway: { label: "Gateway", icon: Radio, tone: "border-cyan-500/60 text-cyan-100 hover:border-cyan-300" },
  redirect: { label: "Redirect", icon: ArrowRightLeft, tone: "border-teal-500/60 text-teal-100 hover:border-teal-300" },
};

const riskClass: Record<RiskLevel, string> = {
  low: "fill-emerald-500/75 stroke-emerald-200/50",
  moderate: "fill-yellow-400/80 stroke-yellow-100/50",
  high: "fill-orange-500/85 stroke-orange-100/55",
  critical: "fill-red-500/90 stroke-red-100/70",
};

function fmt(value: number) {
  return Number(value.toFixed(3));
}

function levelFor(score: number): RiskLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 35) return "moderate";
  return "low";
}

function polar(cx: number, cy: number, radius: number, degrees: number) {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return { x: fmt(cx + radius * Math.cos(radians)), y: fmt(cy + radius * Math.sin(radians)) };
}

function arcPath(cx: number, cy: number, inner: number, outer: number, start: number, end: number) {
  const gap = 1.1;
  const s = start + gap;
  const e = end - gap;
  const p1 = polar(cx, cy, outer, s);
  const p2 = polar(cx, cy, outer, e);
  const p3 = polar(cx, cy, inner, e);
  const p4 = polar(cx, cy, inner, s);
  const large = e - s > 180 ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${outer} ${outer} 0 ${large} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${inner} ${inner} 0 ${large} 0 ${p4.x} ${p4.y} Z`;
}

function ringRadii(ring: Zone["ring"]) {
  if (ring === "outer") return { inner: 214, outer: 286 };
  if (ring === "inner") return { inner: 151, outer: 210 };
  return { inner: 292, outer: 332 };
}

function useScenarioZones(scenario: Scenario) {
  return useMemo(() => {
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
        return { ...zone, integrityRisk: 82, authenticated: Math.round(zone.authenticated * 0.62), crowdRisk: 48 };
      }
      if (scenario === "redirect" && zone.id === "G") {
        return { ...zone, crowdRisk: 48, inflow: 82, outflow: 116, observed: zone.observed - 260 };
      }
      if (scenario === "redirect" && zone.id === "F") {
        return { ...zone, crowdRisk: 54, inflow: 136, observed: zone.observed + 168 };
      }
      return zone;
    });
  }, [scenario]);
}

function StadiumTwin({ zones, selectedZone, onSelect }: { zones: Zone[]; selectedZone: string; onSelect: (id: string) => void }) {
  return (
    <section className="panel twin-panel">
      <div className="panel-title">
        <div>
          <p className="label">Digital Twin</p>
          <h2>Cricket Stadium Heatmap</h2>
        </div>
        <div className="live-chip"><CircleDot size={12} /> Live fusion stream</div>
      </div>
      <div className="stadium-frame">
        <svg viewBox="0 0 720 720" role="img" aria-label="Cricket stadium digital twin with risk heatmap zones">
          <defs>
            <radialGradient id="field" cx="50%" cy="48%" r="55%">
              <stop offset="0%" stopColor="#b9dc93" />
              <stop offset="100%" stopColor="#75a55f" />
            </radialGradient>
          </defs>
          <circle cx="360" cy="360" r="324" className="outer-shell" />
          <circle cx="360" cy="360" r="211" className="concourse" />
          <circle cx="360" cy="360" r="145" fill="url(#field)" />
          <path d="M348 297h24v126h-24z" className="pitch" />
          <text x="360" y="345" textAnchor="middle" className="field-title">GUJARAT</text>
          <text x="360" y="377" textAnchor="middle" className="field-title large">TITANS</text>
          {zones.map((zone) => {
            const { inner, outer } = ringRadii(zone.ring);
            const level = levelFor(Math.max(zone.crowdRisk, zone.integrityRisk));
            const mid = (zone.start + zone.end) / 2;
            const labelPos = polar(360, 360, (inner + outer) / 2, mid);
            return (
              <g key={zone.id}>
                <path
                  d={arcPath(360, 360, inner, outer, zone.start, zone.end)}
                  className={`${riskClass[level]} stadium-zone ${selectedZone === zone.id ? "selected-zone" : ""}`}
                  onClick={() => onSelect(zone.id)}
                />
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="zone-label"
                  transform={`rotate(${mid}, ${labelPos.x}, ${labelPos.y})`}
                >
                  {zone.id}
                </text>
              </g>
            );
          })}
          {["N", "NE", "E", "SE", "S", "SW", "W", "NW"].map((dir, index) => {
            const point = polar(360, 360, 126, index * 45);
            return <text key={dir} x={point.x} y={point.y} textAnchor="middle" className="direction-label">{dir}</text>;
          })}
          <g className="markers">
            <circle cx="564" cy="546" r="9" />
            <text x="578" y="550">G8</text>
            <circle cx="206" cy="480" r="8" />
            <text x="164" y="484">CAM-B</text>
            <circle cx="540" cy="240" r="8" />
            <text x="552" y="244">CAM-F</text>
          </g>
        </svg>
        <div className="legend">
          <span><i className="bg-emerald-400" /> Low</span>
          <span><i className="bg-yellow-300" /> Moderate</span>
          <span><i className="bg-orange-500" /> High</span>
          <span><i className="bg-red-500" /> Critical</span>
        </div>
      </div>
    </section>
  );
}

function RiskRail({ zones, scenario, onScenario }: { zones: Zone[]; scenario: Scenario; onScenario: (scenario: Scenario) => void }) {
  const selectedAlerts = [
    { title: "Person in distress", zone: scenario === "distress" ? "Block B" : "Block C", type: "Human Risk", severity: "High", icon: Ambulance },
    { title: "Congestion developing", zone: scenario === "redirect" ? "Block F" : "Block G", type: "Crowd Risk", severity: scenario === "congestion" ? "Critical" : "High", icon: Users },
    { title: "Population Integrity Anomaly", zone: scenario === "breach" ? "Gate G8 / Block H" : "Block Q", type: "Integrity", severity: scenario === "breach" || scenario === "gateway" ? "Critical" : "Moderate", icon: ShieldAlert },
  ];
  const criticalZones = zones.filter((zone) => Math.max(zone.crowdRisk, zone.integrityRisk) >= 75);

  return (
    <aside className="rail">
      <div className="panel">
        <div className="panel-title">
          <div>
            <p className="label">Active Alerts</p>
            <h2>{criticalZones.length + 9} open signals</h2>
          </div>
          <AlertTriangle className="text-red-300" size={22} />
        </div>
        <div className="tabs">
          <span>All 12</span>
          <span>Human 4</span>
          <span>Crowd 5</span>
          <span>Integrity 3</span>
        </div>
        <div className="alert-list">
          {selectedAlerts.map((alert) => {
            const Icon = alert.icon;
            return (
              <article key={alert.title} className="alert-row">
                <Icon size={18} />
                <div>
                  <strong>{alert.title}</strong>
                  <span>{alert.type} - {alert.zone}</span>
                </div>
                <b>{alert.severity}</b>
              </article>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <p className="label">Scenario Controls</p>
        <div className="scenario-grid">
          {(Object.keys(scenarioConfig) as Scenario[]).map((key) => {
            const config = scenarioConfig[key];
            const Icon = config.icon;
            return (
              <button key={key} className={`scenario-button ${config.tone}`} onClick={() => onScenario(key)}>
                <Icon size={20} />
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>
        <p className="scenario-note">{scenarioNotes[scenario]}</p>
      </div>
    </aside>
  );
}

function ZoneDrawer({ zone }: { zone: Zone }) {
  const density = zone.observed / Math.max(zone.expected, 1);
  const overall = Math.round(zone.crowdRisk * 0.55 + zone.integrityRisk * 0.2 + zone.humanAlerts * 12);
  return (
    <section className="panel zone-drawer">
      <div className="panel-title">
        <div>
          <p className="label">Selected Zone</p>
          <h2>{zone.label}</h2>
        </div>
        <span className={`risk-pill ${levelFor(overall)}`}>{levelFor(overall).toUpperCase()}</span>
      </div>
      <div className="zone-stats">
        <Metric label="Expected" value={zone.expected.toLocaleString()} />
        <Metric label="Authenticated" value={zone.authenticated.toLocaleString()} />
        <Metric label="Observed" value={zone.observed.toLocaleString()} />
        <Metric label="Density" value={`${density.toFixed(2)}x`} />
      </div>
      <div className="explain">
        <div><Gauge size={16} /> Crowd risk {zone.crowdRisk}/100 from density, accumulation, and movement slowdown.</div>
        <div><BadgeCheck size={16} /> Integrity risk {zone.integrityRisk}/100 from expected/authenticated/observed divergence.</div>
        <div><Activity size={16} /> Inflow {zone.inflow}/min, outflow {zone.outflow}/min, human alerts {zone.humanAlerts}.</div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function Home() {
  const [scenario, setScenario] = useState<Scenario>("normal");
  const zones = useScenarioZones(scenario);
  const [selectedZone, setSelectedZone] = useState("G");
  const selected = zones.find((zone) => zone.id === selectedZone) ?? zones[0];
  const totals = zones.reduce(
    (acc, zone) => ({
      expected: acc.expected + zone.expected,
      authenticated: acc.authenticated + zone.authenticated,
      observed: acc.observed + zone.observed,
      alerts: acc.alerts + zone.humanAlerts + (zone.crowdRisk > 60 ? 1 : 0) + (zone.integrityRisk > 60 ? 1 : 0),
    }),
    { expected: 0, authenticated: 0, observed: 0, alerts: 0 },
  );

  return (
    <main className="min-h-screen bg-[#070b0f] text-slate-100">
      <header className="command-header">
        <div className="brand">
          <ShieldAlert size={34} />
          <div>
            <strong>MGHSIS</strong>
            <span>Mass-Gathering Human Safety Intelligence System</span>
          </div>
        </div>
        <Metric label="Event" value="GT vs DC - IPL 2025" />
        <Metric label="Mode" value="Cricket Stadium" />
        <Metric label="Authenticated" value={totals.authenticated.toLocaleString()} />
        <Metric label="Observed Est." value={totals.observed.toLocaleString()} />
        <Metric label="Active Alerts" value={String(Math.max(12, totals.alerts))} />
        <Metric label="System Health" value={scenario === "gateway" ? "Degraded" : "Good"} />
        <Metric label="Event Time" value="20:34 IST" />
      </header>

      <div className="dashboard-grid">
        <section className="side-status panel">
          <p className="label">Stadium Status</p>
          <Metric label="Overall Risk" value={scenario === "normal" ? "High" : "Critical"} />
          <Metric label="Capacity" value="62%" />
          <Metric label="CCTV Confidence" value="91%" />
          <Metric label="Gateway Health" value={scenario === "gateway" ? "62%" : "98%"} />
          <div className="source-card">
            <Camera size={18} />
            <span>CAM-F and CAM-B mapped to bowl sectors. No facial recognition enabled.</span>
          </div>
          <Image
            src="/references/cricket-stadium-reference.png"
            alt="Reference seating layout used for the cricket stadium digital twin"
            width={743}
            height={685}
            className="reference-map"
            priority
          />
        </section>

        <StadiumTwin zones={zones} selectedZone={selected.id} onSelect={setSelectedZone} />
        <RiskRail zones={zones} scenario={scenario} onScenario={setScenario} />
        <ZoneDrawer zone={selected} />

        <section className="panel timeline">
          <div className="panel-title">
            <div>
              <p className="label">Event Timeline</p>
              <h2>Audit-ready operations log</h2>
            </div>
          </div>
          {[
            "20:34:05 Congestion detected - Block G",
            "20:33:59 Population Integrity Anomaly - Gate G8",
            "20:33:41 Medical team dispatched - Block B",
            "20:32:51 CCTV observation fused - South Premium East",
          ].map((item) => (
            <div className="timeline-row" key={item}>
              <Radio size={14} />
              <span>{item}</span>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
