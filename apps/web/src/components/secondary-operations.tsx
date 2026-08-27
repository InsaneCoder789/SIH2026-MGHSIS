"use client";

import Link from "next/link";
import {
  Activity, AlertTriangle, BarChart3, Check, ChevronLeft, ChevronRight,
  Eye, FastForward, FlaskConical, HeartPulse,
  Pause, Play, RadioTower, RefreshCw, RotateCcw, Save, Server, Settings,
  ShieldCheck, Siren, SlidersHorizontal, UsersRound, Video, Workflow,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useDemoOperations } from "@/components/demo-operations-context";
import { OperationsHeader } from "@/components/operations-header";
import { CAMERA_FEEDS, SCENARIO_CATALOG, type CameraFeed, type TimelineRecord } from "@/lib/operations-data";
import { getDigitalTwinSnapshot, levelFor, overallRisk } from "@/lib/mghsis-demo";

function ModuleTitle({ eyebrow, title, description, status }: { eyebrow: string; title: string; description: string; status: string }) {
  return <section className="module-title-band"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div><div className="module-title-status"><i /><span>Current state</span><strong>{status}</strong></div></section>;
}

function MetricStrip({ items }: { items: Array<{ label: string; value: string | number; icon: LucideIcon; tone: string }> }) {
  return <section className="module-kpis">{items.map(({ label, value, icon: Icon, tone }) => <article key={label} className={tone}><Icon size={18} /><span>{label}</span><strong>{value}</strong><small>Current event</small></article>)}</section>;
}

type MlZonePrediction = { zone_id: string; score: number; level: string; confidence: number; trend: string; recommended_actions: string[] };
type MlIntelligenceResponse = {
  connected: boolean;
  status: null | {
    model_version: string;
    model_type: string;
    training_rows: number;
    testing_rows: number;
    feature_count: number;
    metrics: { accuracy: number; macro_f1: number; per_class: { CRITICAL: { recall: number } } };
  };
  zones: MlZonePrediction[];
  message?: string;
  fallback?: string;
};

type SimulationState = {
  simulation_id: string;
  scenario: string;
  running: boolean;
  tick: number;
  simulated_time_seconds: number;
  active_action: { action: string; zone_id: string } | null;
  aggregate: { peak_score: number; average_score: number; critical_zones: number; high_or_above: number };
  zones: Array<{ observation: { current_count: number; inflow_per_min: number; outflow_per_min: number }; prediction: { zone_id: string; score: number; level: string; trend: string; recommended_actions: string[] } }>;
};

async function simulationCommand(body: Record<string, string>) {
  const response = await fetch("/api/simulation", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error("Simulation service unavailable");
  return response.json() as Promise<SimulationState>;
}

function LiveSimulationPanel() {
  const [state, setState] = useState<SimulationState | null>(null);
  const [connected, setConnected] = useState(true);
  const [busy, setBusy] = useState(false);
  const load = () => fetch("/api/simulation", { cache: "no-store" }).then((response) => { if (!response.ok) throw new Error("offline"); return response.json(); }).then((payload: SimulationState) => { setState(payload); setConnected(true); }).catch(() => setConnected(false));
  useEffect(() => { load(); const timer = window.setInterval(load, 1000); return () => window.clearInterval(timer); }, []);
  const command = async (body: Record<string, string>) => { setBusy(true); try { setState(await simulationCommand(body)); setConnected(true); } catch { setConnected(false); } finally { setBusy(false); } };
  const highest = state?.zones.toSorted((a, b) => b.prediction.score - a.prediction.score).slice(0, 5) ?? [];
  return <section className="live-simulation-panel"><header><div><p className="eyebrow">Real-Time Scenario Virtualisation</p><h2>ML event simulator</h2><p>Sensor-like zone observations evolve every 15 simulated seconds and are rescored by the local model.</p></div><span className={`simulation-connection ${connected ? "online" : "offline"}`}><i />{connected ? "API online" : "API offline"}</span></header>
    <div className="simulation-toolbar"><div><span>Scenario</span><strong>{state?.scenario?.toUpperCase() ?? "CONNECTING"}</strong></div><div><span>Virtual time</span><strong>{state ? `${Math.floor(state.simulated_time_seconds / 60)}m ${state.simulated_time_seconds % 60}s` : "--"}</strong></div><div><span>Tick</span><strong>{state?.tick ?? "--"}</strong></div><button disabled={busy || !connected} onClick={() => command({ command: state?.running ? "pause" : "start" })}>{state?.running ? <Pause size={15} /> : <Play size={15} />}{state?.running ? "Pause" : "Start"}</button><button disabled={busy || !connected} onClick={() => command({ command: "reset" })}><RotateCcw size={15} />Reset</button></div>
    <div className="simulation-kpis"><article><span>Peak ML score</span><strong>{state?.aggregate.peak_score.toFixed(1) ?? "--"}</strong></article><article><span>Average score</span><strong>{state?.aggregate.average_score.toFixed(1) ?? "--"}</strong></article><article><span>High / critical zones</span><strong>{state?.aggregate.high_or_above ?? "--"}</strong></article><article><span>Critical zones</span><strong>{state?.aggregate.critical_zones ?? "--"}</strong></article></div>
    <div className="simulation-body"><section><header><div><p className="eyebrow">Live Inference Stream</p><h3>Zone predictions</h3></div><span>{state?.active_action ? `${state.active_action.action.replaceAll("_", " ")} / ${state.active_action.zone_id}` : "No response applied"}</span></header><div className="simulation-zone-list">{highest.map((item) => <article key={item.prediction.zone_id}><b>{item.prediction.zone_id}</b><div><strong>{item.prediction.level}</strong><span>{item.prediction.trend} / {item.observation.current_count.toLocaleString()} observed</span></div><i><em className={item.prediction.level.toLowerCase()} style={{ width: `${Math.min(100, item.prediction.score)}%` }} /></i><strong className="simulation-score">{item.prediction.score.toFixed(1)}</strong></article>)}</div></section><aside><p className="eyebrow">Operator Response</p><h3>Test the feedback loop</h3><p>Apply an action to Block G and observe whether the model sees the pressure recover across subsequent ticks.</p><button disabled={busy || !connected} onClick={() => command({ command: "action", action: "REDIRECT_TO_ZONE", zone_id: "G" })}><Workflow size={15} />Redirect Block G</button><button disabled={busy || !connected} onClick={() => command({ command: "action", action: "OPEN_ALTERNATE_ROUTE", zone_id: "G" })}><ChevronRight size={15} />Open alternate route</button><button disabled={busy || !connected} onClick={() => command({ command: "action", action: "RESTRICT_INFLOW", zone_id: "G" })}><ShieldCheck size={15} />Restrict inflow</button></aside></div>
  </section>;
}

function MlIntelligencePanel() {
  const [data, setData] = useState<MlIntelligenceResponse | null>(null);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/ml/crowd-risk", { signal: controller.signal })
      .then((response) => response.json())
      .then((payload: MlIntelligenceResponse) => setData(payload))
      .catch(() => setData({ connected: false, status: null, zones: [], message: "Unable to query onboard inference", fallback: "Deterministic frontend risk engine remains active." }));
    return () => controller.abort();
  }, [reload]);
  const status = data?.status;
  const priorityZones = data?.zones.toSorted((a, b) => b.score - a.score).slice(0, 4) ?? [];
  return <section className={`ml-model-card ${data?.connected ? "connected" : "fallback"}`}>
    <header><div><p className="eyebrow">Onboard Crowd Intelligence</p><h2>{data === null ? "Connecting to local model" : data.connected ? "ML inference online" : "Deterministic fallback active"}</h2></div><div className="ml-runtime-state"><i /><span>{data?.connected ? "FastAPI / Local CPU" : "Backend disconnected"}</span><strong>{status?.model_type ?? "Frontend rules"}</strong></div></header>
    <div className="ml-model-facts">
      <article><span>Training corpus</span><strong>{status ? status.training_rows.toLocaleString() : "80,000"}</strong><small>80% fit partition</small></article>
      <article><span>Unseen holdout</span><strong>{status ? status.testing_rows.toLocaleString() : "20,000"}</strong><small>20% test partition</small></article>
      <article><span>Test accuracy</span><strong>{status ? `${(status.metrics.accuracy * 100).toFixed(2)}%` : "Unavailable"}</strong><small>Synthetic holdout only</small></article>
      <article><span>Macro F1</span><strong>{status ? `${(status.metrics.macro_f1 * 100).toFixed(2)}%` : "Unavailable"}</strong><small>Across four risk classes</small></article>
      <article><span>Critical recall</span><strong>{status ? `${(status.metrics.per_class.CRITICAL.recall * 100).toFixed(2)}%` : "Unavailable"}</strong><small>Safety-prioritized sensitivity</small></article>
      <article><span>Input features</span><strong>{status?.feature_count ?? 22}</strong><small>Spatial, flow and crowd factors</small></article>
    </div>
    <div className="ml-zone-output"><div><span>Highest inferred risk</span>{priorityZones.length ? priorityZones.map((zone) => <article key={zone.zone_id}><b>{zone.zone_id}</b><div><strong>{zone.level}</strong><small>{zone.trend} / {(zone.confidence * 100).toFixed(0)}% confidence</small></div><em>{zone.score.toFixed(1)}</em></article>) : <p>{data?.fallback ?? "Waiting for local inference results."}</p>}</div><aside><AlertTriangle size={17} /><div><strong>Advisory decision support</strong><span>Synthetic performance is not field validation. Operators remain responsible for intervention approval and verification.</span></div><button onClick={() => setReload((value) => value + 1)}><RefreshCw size={13} />Reconnect</button></aside></div>
  </section>;
}

function CameraVisual({ camera, expanded = false }: { camera: CameraFeed; expanded?: boolean }) {
  const people = Array.from({ length: camera.status === "OFFLINE" ? 0 : Math.min(expanded ? 54 : 24, Math.round(camera.personCount / 70)) }, (_, index) => ({ left: 7 + ((index * 37 + camera.id.length * 11) % 87), top: 13 + ((index * 53 + camera.zone.charCodeAt(0)) % 72) }));
  return <div className={`camera-visual ${camera.status.toLowerCase()} ${expanded ? "expanded" : ""}`}><div className="camera-scan-line" />{people.map((point, index) => <i key={index} style={{ left: `${point.left}%`, top: `${point.top}%` }} />)}<span className="camera-id">{camera.id} / ZONE {camera.zone}</span><span className="camera-rec"><b />{camera.status}</span>{camera.status === "OFFLINE" ? <strong>FEED UNAVAILABLE</strong> : null}</div>;
}

export function CctvMonitoring() {
  const [selectedId, setSelectedId] = useState(CAMERA_FEEDS[1].id);
  const [filter, setFilter] = useState<"ALL" | CameraFeed["status"]>("ALL");
  const selected = CAMERA_FEEDS.find((camera) => camera.id === selectedId) ?? CAMERA_FEEDS[0];
  const visible = CAMERA_FEEDS.filter((camera) => filter === "ALL" || camera.status === filter);
  const online = CAMERA_FEEDS.filter((camera) => camera.status === "ONLINE").length;
  const crossings = CAMERA_FEEDS.reduce((sum, camera) => sum + camera.restrictedCrossings, 0);
  return <main className="ops-module-page"><OperationsHeader section="CCTV" /><ModuleTitle eyebrow="Computer Vision Fusion" title="CCTV & Zone Monitoring" description="Synthetic camera observations mapped to venue zones with count, density, movement and confidence." status={`${online} / ${CAMERA_FEEDS.length} online`} />
    <MetricStrip items={[{label:"Feeds online",value:online,icon:Video,tone:"green"},{label:"Observed total",value:CAMERA_FEEDS.reduce((sum,camera)=>sum+camera.personCount,0).toLocaleString(),icon:UsersRound,tone:"teal"},{label:"Boundary crossings",value:crossings,icon:AlertTriangle,tone:"red"},{label:"Average confidence",value:"88.8%",icon:Eye,tone:"blue"}]} />
    <div className="cctv-workspace"><section className="camera-grid-panel"><header><div><p className="eyebrow">Mapped Feeds</p><h2>Venue cameras</h2></div><div>{(["ALL","ONLINE","DEGRADED","OFFLINE"] as const).map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div></header><div className="camera-grid">{visible.map((camera) => <button key={camera.id} className={selected.id === camera.id ? "selected" : ""} onClick={() => setSelectedId(camera.id)}><CameraVisual camera={camera} /><footer><div><strong>{camera.name}</strong><span>Zone {camera.zone} / Confidence {Math.round(camera.confidence * 100)}%</span></div><b className={camera.status.toLowerCase()}>{camera.status}</b></footer></button>)}</div></section>
      <aside className="camera-inspector"><header><div><span>{selected.id} / Zone {selected.zone}</span><h2>{selected.name}</h2></div><b className={selected.status.toLowerCase()}>{selected.status}</b></header><CameraVisual camera={selected} expanded /><section className="camera-metrics">{[["Person count",selected.personCount.toLocaleString()],["Density",`${selected.density.toFixed(2)} / m2`],["Average speed",`${selected.averageSpeed.toFixed(2)} m/s`],["Direction",selected.direction],["Crossings",selected.restrictedCrossings],["Confidence",`${Math.round(selected.confidence*100)}%`]].map(([label,value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</section><section className="camera-observation"><p className="eyebrow">Fusion interpretation</p><strong>{selected.restrictedCrossings > 0 ? "Restricted boundary activity requires review" : selected.density > 1.6 ? "Density trend exceeds warning threshold" : "Observation remains within configured range"}</strong><p>Counts are estimates with confidence, not identity or facial recognition.</p></section><footer><Link href={`/digital-twin`}>Locate on Digital Twin<ChevronRight size={14} /></Link></footer></aside>
    </div>
  </main>;
}

export function ScenarioLab() {
  const { scenario, deploymentMode, activateScenario, resetEvent } = useDemoOperations();
  const [selectedId, setSelectedId] = useState<(typeof SCENARIO_CATALOG)[number]["id"]>("congestion");
  const selected = SCENARIO_CATALOG.find((item) => item.id === selectedId) ?? SCENARIO_CATALOG[0];
  const active = deploymentMode === "PILGRIMAGE" ? "pilgrimage" : scenario;
  return <main className="ops-module-page"><OperationsHeader section="Scenario Lab" /><ModuleTitle eyebrow="Deterministic Demonstration" title="Scenario Lab" description="Activate repeatable safety conditions and carry the resulting state into the Command Centre and Digital Twin." status={active === "normal" ? "Normal event" : `${active} active`} />
    <div className="scenario-lab-layout"><section className="scenario-catalog"><header><p className="eyebrow">Scenario Presets</p><h2>Choose an event condition</h2></header><div>{SCENARIO_CATALOG.map((item,index) => <button key={item.id} className={`${selected.id === item.id ? "selected" : ""} ${active === item.id ? "active" : ""}`} onClick={() => setSelectedId(item.id)}><span>0{index+1}</span><div><strong>{item.title}</strong><p>{item.description}</p><small>{item.effect}</small></div>{active === item.id ? <b><Activity size={12} />Active</b> : <ChevronRight size={15} />}</button>)}</div></section>
      <section className="scenario-preview"><header><div><p className="eyebrow">Scenario Preview</p><h2>{selected.title}</h2></div><FlaskConical size={22} /></header><div className={`scenario-signal ${selected.id}`}><i /><i /><i /><strong>{selected.effect}</strong></div><section><p>{selected.description}</p><dl><div><dt>Affected engine</dt><dd>{selected.id === "distress" ? "Human Risk" : selected.id === "breach" || selected.id === "gateway" ? "Population Integrity" : "Crowd Risk"}</dd></div><div><dt>Data source</dt><dd>Deterministic simulator</dd></div><div><dt>Reset support</dt><dd>Immediate</dd></div><div><dt>Operator control</dt><dd>Required</dd></div></dl></section><footer><button className="scenario-run" onClick={() => activateScenario(selected.id)}><Play size={16} />Activate scenario</button><button onClick={resetEvent}><RotateCcw size={16} />Reset event</button></footer><div className="scenario-links"><Link href="/command-center">Open Command Centre<ChevronRight size={14} /></Link><Link href="/digital-twin">Open dedicated twin<ChevronRight size={14} /></Link></div></section>
    </div><LiveSimulationPanel />
  </main>;
}

function TimelineRow({ record, selected, onClick }: { record: TimelineRecord; selected: boolean; onClick: () => void }) {
  return <button className={`${record.type.toLowerCase()} ${selected ? "selected" : ""}`} onClick={onClick}><time>{record.time}</time><i /><div><strong>{record.title}</strong><span>{record.detail}</span></div><b>{record.type}</b>{record.zone ? <small>{record.zone}</small> : null}</button>;
}

export function EventReplay() {
  const { timeline } = useDemoOperations();
  const ordered = timeline.toReversed();
  const [index, setIndex] = useState(Math.max(0, ordered.length - 1));
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);
  const selected = ordered[index] ?? ordered[0];
  const stop = () => { if (timer.current !== null) window.clearInterval(timer.current); timer.current = null; setPlaying(false); };
  const togglePlay = () => {
    if (playing) { stop(); return; }
    setPlaying(true);
    timer.current = window.setInterval(() => setIndex((value) => value >= ordered.length - 1 ? 0 : value + 1), 900);
  };
  useEffect(() => () => { if (timer.current !== null) window.clearInterval(timer.current); }, []);
  return <main className="ops-module-page"><OperationsHeader section="Replay" /><ModuleTitle eyebrow="Event Reconstruction" title="Event Timeline / Replay" description="Step through alerts, sensor changes, operator actions and system events in chronological order." status={`${timeline.length} audit records`} />
    <div className="replay-layout"><section className="replay-stage"><header><div><p className="eyebrow">Playback Position</p><h2>{selected?.time} / {selected?.title}</h2></div><span>{index+1} of {ordered.length}</span></header><div className="replay-visual"><div className="replay-radar"><i /><i /><i /><b className={selected?.severity ?? "low"} /></div><section><span>{selected?.type} / Zone {selected?.zone ?? "ALL"}</span><strong>{selected?.title}</strong><p>{selected?.detail}</p></section></div><div className="replay-controls"><button onClick={() => setIndex((value) => Math.max(0,value-1))}><ChevronLeft size={17} /></button><button className="play" onClick={togglePlay}>{playing ? <Pause size={18} /> : <Play size={18} />}</button><button onClick={() => setIndex((value) => Math.min(ordered.length-1,value+1))}><ChevronRight size={17} /></button><input type="range" min="0" max={Math.max(0,ordered.length-1)} value={index} onChange={(event) => { stop(); setIndex(Number(event.target.value)); }} /><button onClick={() => setIndex((value) => Math.min(ordered.length-1,value+3))}><FastForward size={17} /></button></div><footer><span>Audit records are deterministic demo data.</span><Link href="/digital-twin">Open current Digital Twin<ChevronRight size={13} /></Link></footer></section><section className="replay-events"><header><p className="eyebrow">Audit Stream</p><h2>Event records</h2></header><div>{ordered.map((record,rowIndex) => <TimelineRow key={record.id} record={record} selected={rowIndex === index} onClick={() => { stop(); setIndex(rowIndex); }} />)}</div></section></div>
  </main>;
}

export function RiskAnalytics() {
  const { scenario, alerts, interventions } = useDemoOperations();
  const { zones } = getDigitalTwinSnapshot(scenario);
  const [engine, setEngine] = useState<"CROWD" | "INTEGRITY" | "HUMAN">("CROWD");
  const sorted = zones.toSorted((a,b) => (engine === "CROWD" ? b.crowdRisk-a.crowdRisk : engine === "INTEGRITY" ? b.integrityRisk-a.integrityRisk : b.humanAlerts-a.humanAlerts));
  const riskValues = [24,27,31,36,42,51,63,76,91,84,69,58,48];
  const points = riskValues.map((value,index) => `${index/(riskValues.length-1)*620},${150-value*1.25}`).join(" ");
  const verified = interventions.filter((item) => item.status === "COMPLETED");
  return <main className="ops-module-page"><OperationsHeader section="Analytics" /><ModuleTitle eyebrow="Explainable Risk Trends" title="Risk Analytics" description="Compare zone risk, alert history, human distress and response effectiveness for the active event." status={`${scenario} scenario`} />
    <MetricStrip items={[{label:"Peak crowd risk",value:Math.max(...zones.map(z=>z.crowdRisk)),icon:BarChart3,tone:"red"},{label:"Elevated zones",value:zones.filter(z=>overallRisk(z)>=55).length,icon:AlertTriangle,tone:"orange"},{label:"Human alerts",value:alerts.filter(a=>a.category==="HUMAN_RISK"&&a.status!=="RESOLVED").length,icon:HeartPulse,tone:"red"},{label:"Verified actions",value:verified.length,icon:ShieldCheck,tone:"green"}]} />
    <div className="analytics-layout"><MlIntelligencePanel /><section className="risk-history-chart"><header><div><p className="eyebrow">Event Risk History</p><h2>Block G accumulation and response</h2></div><span>20:20 - 20:34</span></header><svg viewBox="0 0 620 170" role="img" aria-label="Crowd risk history rising to 91 and falling to 48"><line x1="0" y1="150" x2="620" y2="150"/><line x1="0" y1="82" x2="620" y2="82" className="threshold"/><polyline points={points} /><circle cx="413" cy="36" r="4" className="peak"/><circle cx="620" cy="90" r="4" className="after"/></svg><footer><span>Warning threshold 55</span><strong>Risk 91 → 48 after redirect scenario</strong></footer></section><section className="response-effectiveness"><header><p className="eyebrow">Response Effectiveness</p><h2>Intervention outcomes</h2></header>{interventions.slice(0,4).map((item) => <article key={item.id}><div><strong>{item.action.replaceAll("_"," ")}</strong><span>Zone {item.targetZone} / {item.status}</span></div><i><b style={{width:`${item.projectedRisk}%`}}/></i><em>{item.baselineRisk}<small>before</small></em><em className="after">{item.projectedRisk}<small>after</small></em></article>)}</section><section className="zone-comparison"><header><div><p className="eyebrow">Zone Comparison</p><h2>{engine} risk ranking</h2></div><div>{(["CROWD","INTEGRITY","HUMAN"] as const).map(item=><button key={item} className={engine===item?"active":""} onClick={()=>setEngine(item)}>{item}</button>)}</div></header><div>{sorted.map(zone=>{const value=engine==="CROWD"?zone.crowdRisk:engine==="INTEGRITY"?zone.integrityRisk:Math.min(100,zone.humanAlerts*25);return <article key={zone.id}><b>{zone.id}</b><span>{zone.label}</span><i><em style={{width:`${value}%`}}/></i><strong className={levelFor(value)}>{value}</strong></article>})}</div></section></div>
  </main>;
}

type RuntimeService = {
  name: string;
  group: string;
  health: number;
  latency: number;
  status: "HEALTHY" | "DEGRADED" | "OFFLINE";
  detail: string;
  required: boolean;
};

type RuntimeHealthResponse = {
  status: "READY" | "DEGRADED" | "OFFLINE";
  ready: boolean;
  services: Array<Omit<RuntimeService, "latency"> & { latency_ms: number }>;
};

const fallbackServices: RuntimeService[] = [
  { name:"Event API",group:"CORE",health:0,latency:0,status:"OFFLINE",detail:"Waiting for backend diagnostics",required:true },
  { name:"Redis Shared Runtime",group:"DATA",health:0,latency:0,status:"OFFLINE",detail:"Waiting for shared-state diagnostics",required:true },
  { name:"Crowd Risk Model",group:"INTELLIGENCE",health:0,latency:0,status:"OFFLINE",detail:"Waiting for model diagnostics",required:true },
  { name:"Simulation State",group:"SIMULATION",health:0,latency:0,status:"OFFLINE",detail:"Waiting for simulation diagnostics",required:true },
  { name:"Hardware Event Stream",group:"INGESTION",health:0,latency:0,status:"OFFLINE",detail:"Waiting for ingestion diagnostics",required:true },
];

export function SystemHealth() {
  const [runs,setRuns]=useState(0);
  const [selected,setSelected]=useState<string>(fallbackServices[0].name);
  const [services,setServices]=useState<RuntimeService[]>(fallbackServices);
  const [checking,setChecking]=useState(true);
  const loadDiagnostics = useCallback(async (manual = false) => {
    setChecking(true);
    try {
      const response = await fetch("/api/system-health", { cache:"no-store" });
      const payload = await response.json() as RuntimeHealthResponse;
      setServices(payload.services.map(item => ({ ...item, latency:item.latency_ms })));
    } catch {
      setServices(fallbackServices);
    } finally {
      setChecking(false);
      if (manual) setRuns(value => value + 1);
    }
  }, []);
  useEffect(() => {
    const initial=window.setTimeout(()=>void loadDiagnostics(),0);
    const timer=window.setInterval(()=>void loadDiagnostics(),10_000);
    return()=>{ window.clearTimeout(initial); window.clearInterval(timer); };
  },[loadDiagnostics]);
  const service=services.find(item=>item.name===selected)??services[0];
  const healthy=services.filter(item=>item.status==="HEALTHY").length;
  const offline=services.filter(item=>item.status==="OFFLINE").length;
  const overall=offline===0&&healthy===services.length?"READY":checking?"CHECKING":"DEGRADED";
  return <main className="ops-module-page"><OperationsHeader section="Health"/><ModuleTitle eyebrow="Local-First Infrastructure" title="System Health" description="Monitor API, shared Redis state, onboard intelligence, simulation and hardware ingestion." status={overall}/>
    <MetricStrip items={[{label:"Core services",value:services.length,icon:Server,tone:"teal"},{label:"Healthy",value:healthy,icon:ShieldCheck,tone:"green"},{label:"Offline",value:offline,icon:AlertTriangle,tone:"orange"},{label:"Diagnostics",value:runs,icon:RefreshCw,tone:"blue"}]} />
    <div className="health-layout"><section className="service-matrix"><header><div><p className="eyebrow">Service Matrix</p><h2>Live runtime dependencies</h2></div><button disabled={checking} onClick={()=>void loadDiagnostics(true)}><RefreshCw className={checking?"spin":""} size={14}/>{checking?"Checking":"Run diagnostics"}</button></header><div>{services.map(item=><button key={item.name} className={selected===item.name?"selected":""} onClick={()=>setSelected(item.name)}><Activity size={17}/><div><strong>{item.name}</strong><span>{item.group}</span></div><i><b className={item.status.toLowerCase()} style={{width:`${item.health}%`}}/></i><em>{item.latency} ms</em><small className={item.status.toLowerCase()}>{item.status}</small></button>)}</div></section><aside className={`health-inspector ${service.status.toLowerCase()}`}><header><span>{service.group}</span><h2>{service.name}</h2><strong>{service.status}</strong></header><div className="health-gauge" style={{"--health":`${service.health*3.6}deg`} as CSSProperties}><div><strong>{service.health}%</strong><span>availability</span></div></div><dl><div><dt>Current latency</dt><dd>{service.latency} ms</dd></div><div><dt>Last heartbeat</dt><dd>{checking?"Checking now":"Live"}</dd></div><div><dt>Deployment</dt><dd>Local runtime</dd></div><div><dt>Dependency</dt><dd>{service.required?"Required":"Optional"}</dd></div></dl><section><Check size={16}/><div><strong>{service.status==="HEALTHY"?"Diagnostic passed":"Action required"}</strong><span>{service.detail}</span></div></section></aside></div>
  </main>;
}

export function Configuration() {
  const defaults = { hr:20, spo2:20, fall:25, immobility:15, sos:20 };
  const [tab, setTab] = useState<"RISK" | "DEPLOYMENT" | "ALERTS" | "INTERVENTIONS" | "SYSTEM">("RISK");
  const [weights, setWeights] = useState(defaults);
  const [saved, setSaved] = useState(true);
  const [mode, setMode] = useState("CRICKET_STADIUM");
  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [gatewayAlerts, setGatewayAlerts] = useState(true);
  const [escalationMinutes, setEscalationMinutes] = useState(3);
  const [secondApproval, setSecondApproval] = useState(true);
  const [verificationMinutes, setVerificationMinutes] = useState(6);
  const [auditRetention, setAuditRetention] = useState(30);
  const [simulationCadence, setSimulationCadence] = useState(15);
  const total = Object.values(weights).reduce((sum,value)=>sum+value,0);
  const update = (key:keyof typeof weights,value:number) => { setWeights(items=>({...items,[key]:value})); setSaved(false); };
  const markChanged = () => setSaved(false);
  const restoreDefaults = () => {
    setWeights(defaults); setMode("CRICKET_STADIUM"); setCriticalAlerts(true); setGatewayAlerts(true);
    setEscalationMinutes(3); setSecondApproval(true); setVerificationMinutes(6); setAuditRetention(30); setSimulationCadence(15); setSaved(false);
  };
  const panels = {
    RISK: <><header><div><p className="eyebrow">Human Risk Engine</p><h2>Configurable weighted scoring</h2><p>Demonstration safety thresholds, not clinical diagnostic truth.</p></div><b className={total===100?"valid":"invalid"}>{total}% total</b></header><div className="weight-settings">{([['hr','HR anomaly'],['spo2','SpO2 anomaly'],['fall','Fall detected'],['immobility','Immobility'],['sos','SOS trigger']] as const).map(([key,label])=><label key={key}><div><span>{label}</span><strong>{weights[key]}%</strong></div><input type="range" min="0" max="40" value={weights[key]} onChange={event=>update(key,Number(event.target.value))}/><small>{key==='sos'?'Manual SOS enforces a priority floor.':key==='fall'?'Combined with immobility, raises urgency.':'Weighted into the explainable score.'}</small></label>)}</div><section className="threshold-settings"><header><p className="eyebrow">Risk bands</p><h3>Score classification</h3></header>{[['Low','0 - 29','green'],['Moderate','30 - 54','yellow'],['High','55 - 74','orange'],['Critical','75 - 100','red']].map(([label,range,tone])=><div key={label}><i className={tone}/><span>{label}</span><strong>{range}</strong></div>)}</section></>,
    DEPLOYMENT: <><header><div><p className="eyebrow">Venue Deployment</p><h2>Operating profile</h2><p>Choose the geometry and flow assumptions used across the portal.</p></div><b className="valid">ACTIVE</b></header><section className="settings-option-list"><div><span>Deployment mode</span><strong>{mode.replaceAll("_"," ")}</strong><p>Updates venue labels, route behavior, and scenario presets.</p><div className="settings-segmented">{['CONCERT','CRICKET_STADIUM','PILGRIMAGE'].map(item=><button key={item} className={mode===item?'active':''} onClick={()=>{setMode(item);markChanged();}}>{item.replaceAll('_',' ')}</button>)}</div></div><div><span>Device capacity</span><strong>20,000 safety bands</strong><p>The catalogue is server-paginated while the twin renders a bounded visual sample.</p></div></section></>,
    ALERTS: <><header><div><p className="eyebrow">Alert Routing</p><h2>Escalation policy</h2><p>Control which operational conditions create actionable incidents.</p></div><b className="valid">LIVE</b></header><section className="settings-option-list"><label><div><span>Critical risk alerts</span><p>Create immediate incidents for critical ML predictions.</p></div><input type="checkbox" checked={criticalAlerts} onChange={event=>{setCriticalAlerts(event.target.checked);markChanged();}} /></label><label><div><span>Gateway health alerts</span><p>Warn operators when coverage or source confidence degrades.</p></div><input type="checkbox" checked={gatewayAlerts} onChange={event=>{setGatewayAlerts(event.target.checked);markChanged();}} /></label><label><div><span>Escalation delay</span><p>Minutes before an unacknowledged alert is raised again.</p></div><input type="number" min="1" max="15" value={escalationMinutes} onChange={event=>{setEscalationMinutes(Number(event.target.value));markChanged();}} /></label></section></>,
    INTERVENTIONS: <><header><div><p className="eyebrow">Response Governance</p><h2>Authorization and verification</h2><p>Keep simulated and live field actions under explicit operator control.</p></div><b className="valid">CONTROLLED</b></header><section className="settings-option-list"><label><div><span>Second approval for critical actions</span><p>Require another operator before high-impact route changes.</p></div><input type="checkbox" checked={secondApproval} onChange={event=>{setSecondApproval(event.target.checked);markChanged();}} /></label><label><div><span>Verification window</span><p>Minutes allowed before the intervention outcome is reviewed.</p></div><input type="number" min="2" max="30" value={verificationMinutes} onChange={event=>{setVerificationMinutes(Number(event.target.value));markChanged();}} /></label></section></>,
    SYSTEM: <><header><div><p className="eyebrow">System Runtime</p><h2>Audit and simulation</h2><p>Configure operational history and virtual time cadence.</p></div><b className="valid">HEALTHY</b></header><section className="settings-option-list"><label><div><span>Audit retention</span><p>Days to retain local event actions and verification records.</p></div><input type="number" min="7" max="365" value={auditRetention} onChange={event=>{setAuditRetention(Number(event.target.value));markChanged();}} /></label><label><div><span>Virtual tick cadence</span><p>Seconds represented by each simulation update.</p></div><input type="number" min="5" max="60" step="5" value={simulationCadence} onChange={event=>{setSimulationCadence(Number(event.target.value));markChanged();}} /></label></section></>,
  };
  return <main className="ops-module-page"><OperationsHeader section="Configuration"/><ModuleTitle eyebrow="Event Rules & Thresholds" title="Settings / Configuration" description="Configure explainable risk weights, deployment mode and operational thresholds for demo behavior." status={saved?"Configuration saved":"Unsaved changes"}/>
    <div className="settings-layout"><section className="settings-nav">{([["RISK","Risk engine",SlidersHorizontal],["DEPLOYMENT","Deployment",RadioTower],["ALERTS","Alerts",Siren],["INTERVENTIONS","Interventions",Workflow],["SYSTEM","System",Settings]] as const).map(([id,label,Icon])=><button key={id} className={tab===id?"active":""} onClick={()=>setTab(id)}><Icon size={16}/>{label}</button>)}</section><section className="settings-main">{panels[tab]}<footer><button onClick={restoreDefaults}><RotateCcw size={15}/>Restore defaults</button><button className="save" disabled={total!==100} onClick={()=>setSaved(true)}><Save size={15}/>Save configuration</button></footer></section></div>
  </main>;
}
