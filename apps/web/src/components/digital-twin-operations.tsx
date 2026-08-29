"use client";

import Link from "next/link";
import {
  Activity, Camera, ChevronRight, DoorOpen, Eye, EyeOff, FilterX, Layers3,
  LocateFixed, Minus, Pause, Play, Plus, Search, ShieldCheck, Siren, UsersRound, Watch,
} from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { StadiumTwin } from "@/components/command-center-dashboard";
import { useDemoOperations } from "@/components/demo-operations-context";
import { OperationsHeader } from "@/components/operations-header";
import { BAND_ZONES, DEMO_BAND_COUNT, DEMO_BAND_SUMMARY, TWIN_RENDER_BANDS, ZONE_BAND_CAPACITIES, ZONE_SEGMENT_COUNTS, generateDemoBand, getTwinMapBands, type BandStatus, type SafetyBand } from "@/lib/bands";
import { levelFor, overallRisk, type Zone } from "@/lib/mghsis-demo";
import { useLiveDigitalTwin } from "@/lib/use-live-digital-twin";

type RailView = "BANDS" | "ZONES" | "VIRTUALISATION";
type StatusFilter = "ALL" | BandStatus;
const subscribeToBrowser = () => () => undefined;
type SimulationRisk = { score: number; level: string };
type SimulationZone = {
  observation: { current_count: number; inflow_per_min: number; outflow_per_min: number; gateway_health: number };
  prediction: { zone_id: string; score: number; level: string; trend: string; confidence: number; recommended_actions: string[] };
  fusion: { expected_population: number; authenticated_population: number; observed_population: number; largest_variance: number; variance_percent: number; cctv_confidence: number; gateway_health: number; population_state: string };
  risk_engines: { human: SimulationRisk; crowd: SimulationRisk; integrity: SimulationRisk; overall: SimulationRisk };
  forecast: { horizon_minutes: number; projected_population: number; projected_utilization_percent: number; net_flow_per_min: number; direction: string };
};
type SimulationVerification = {
  action: string;
  zone_id: string;
  result: "EFFECTIVE" | "PARTIALLY_EFFECTIVE" | "INEFFECTIVE" | "INCONCLUSIVE";
  elapsed_simulated_seconds: number;
  baseline: { risk: number; population: number; inflow_per_min: number; outflow_per_min: number };
  current: { risk: number; population: number; inflow_per_min: number; outflow_per_min: number };
  delta: { risk: number; population: number; inflow_per_min: number; outflow_per_min: number };
};
type TwinSimulationState = {
  scenario: string;
  running: boolean;
  tick: number;
  active_action: { action: string; zone_id: string } | null;
  aggregate: { peak_score: number; average_score: number; high_or_above: number; critical_zones: number; expected_population: number; authenticated_population: number; observed_population: number; population_variance: number; overall_peak_score: number };
  zones: SimulationZone[];
  verification: SimulationVerification | null;
};

async function simulationCommand(body: Record<string, string>) {
  const response = await fetch("/api/simulation", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error("Simulation service unavailable");
  return response.json() as Promise<TwinSimulationState>;
}

function DigitalTwinVirtualisation({ state, busy, error, onCommand }: { state: TwinSimulationState | null; busy: boolean; error: string; onCommand: (body: Record<string, string>) => void }) {
  const highest = state?.zones.toSorted((a, b) => b.risk_engines.overall.score - a.risk_engines.overall.score).slice(0, 2) ?? [];
  const focus = highest[0];
  const scenario = state?.scenario ?? "normal";
  const scenarios = [
    { id: "congestion", label: "Crowd surge" },
    { id: "distress", label: "Wearer distress" },
    { id: "breach", label: "Gate breach" },
    { id: "gateway", label: "Gateway outage" },
  ];
  const response = scenario === "distress"
    ? { action: "DISPATCH_MEDICAL", zone: "B", label: "Dispatch Medical" }
    : scenario === "breach"
      ? { action: "RESTRICT_INFLOW", zone: "H", label: "Secure Gate G8" }
      : scenario === "gateway"
        ? { action: "OPEN_ALTERNATE_ROUTE", zone: "Q", label: "Reroute Zone Q" }
        : { action: "REDIRECT_TO_ZONE", zone: "G", label: "Redirect Zone G" };
  return <section className={`digital-twin-virtualisation scenario-${scenario}`}>
    <header><div><p className="eyebrow">Scenario Projection</p><h2>{scenarios.find((item) => item.id === scenario)?.label ?? "Ready to simulate"}</h2></div><span className={state?.running ? "running" : ""}>{busy ? "UPDATING" : state?.running ? "RUNNING" : "PAUSED"}</span></header>
    <div className="virtualisation-scenarios">
      {scenarios.map((item) => <button key={item.id} className={scenario === item.id ? "active" : ""} disabled={busy} onClick={() => onCommand({ command: "scenario", scenario: item.id })}>{item.label}</button>)}
    </div>
    <div className="virtualisation-process" aria-label="Virtualisation processing stages"><span className={state ? "complete" : "active"}>Observe</span><i /><span className={state ? "complete" : ""}>Predict</span><i /><span className={state ? "active" : ""}>Project</span><i /><span className={state?.active_action ? "complete" : ""}>Respond</span></div>
    <div className="virtualisation-summary"><div><small>Virtual tick</small><strong>{state?.tick ?? "--"}</strong></div><div><small>Overall peak</small><strong>{state ? state.aggregate.overall_peak_score.toFixed(1) : "--"}</strong></div><div><small>High+</small><strong>{state?.aggregate.high_or_above ?? "--"}</strong></div><div><small>Critical</small><strong>{state?.aggregate.critical_zones ?? "--"}</strong></div></div>
    {focus ? <section className="virtualisation-fusion"><header><span>Sensor fusion / Zone {focus.prediction.zone_id}</span><strong className={focus.fusion.population_state.toLowerCase()}>{focus.fusion.population_state}</strong></header><div><span>Expected<strong>{focus.fusion.expected_population.toLocaleString()}</strong></span><span>Bands<strong>{focus.fusion.authenticated_population.toLocaleString()}</strong></span><span>CCTV observed<strong>{focus.fusion.observed_population.toLocaleString()}</strong></span></div><footer><span>Variance <b>{focus.fusion.largest_variance.toLocaleString()}</b></span><span>5 min forecast <b>{focus.forecast.projected_population.toLocaleString()}</b></span><span>{focus.forecast.direction.replaceAll("_", " ")}</span></footer></section> : null}
    <div className="virtualisation-zones">{highest.map((item) => <article key={item.prediction.zone_id}><div><b>{item.prediction.zone_id}</b><span>{item.risk_engines.overall.level} / {item.forecast.direction}</span></div><i><em className={item.risk_engines.overall.level.toLowerCase()} style={{ width: `${Math.min(100, item.risk_engines.overall.score)}%` }} /></i><strong>{item.risk_engines.overall.score.toFixed(0)}</strong></article>)}</div>
    {state?.verification ? <section className={`virtualisation-verification ${state.verification.result.toLowerCase()}`}><header><span>Response verification / Zone {state.verification.zone_id}</span><strong>{state.verification.result.replaceAll("_", " ")}</strong></header><div><span>Risk<b>{state.verification.baseline.risk.toFixed(0)} → {state.verification.current.risk.toFixed(0)}</b></span><span>Population<b>{state.verification.delta.population > 0 ? "+" : ""}{state.verification.delta.population}</b></span><span>Net inflow<b>{state.verification.delta.inflow_per_min > 0 ? "+" : ""}{state.verification.delta.inflow_per_min.toFixed(0)}/m</b></span></div></section> : error ? <p className="virtualisation-error">{error}</p> : <p className="virtualisation-movement"><Activity size={12} />{state?.running ? "Movement layer advances with every virtual tick" : "Projection clock paused"}</p>}
    <footer><button disabled={busy || !state} onClick={() => onCommand({ command: state?.running ? "pause" : "start" })}>{state?.running ? <Pause size={13} /> : <Play size={13} />}{state?.running ? "Pause projection" : "Run projection"}</button><button disabled={busy || !state} onClick={() => onCommand({ command: "action", action: response.action, zone_id: response.zone })}><LocateFixed size={13} />{response.label}</button><button disabled={busy || !state} onClick={() => onCommand({ command: "reset" })}>Reset</button></footer>
  </section>;
}

function LayerButton({ active, label, title, danger, onClick, children }: { active: boolean; label: string; title: string; danger?: boolean; onClick: () => void; children: ReactNode }) {
  return <button className={`${active ? "active" : ""} ${danger && active ? "danger" : ""}`} title={title} onClick={onClick}>{children}<span>{label}</span></button>;
}

function SelectedBandPanel({ band }: { band: SafetyBand }) {
  return <section className={`twin-selected-band ${band.status.toLowerCase()}`}>
    <header><div><span>Selected Band</span><strong>{band.code}</strong><small>Zone {band.zone} / Segment {band.segment}</small></div><b>{band.riskScore}<small>{band.riskLevel}</small></b></header>
    <div><span>Heart rate<strong>{band.hr} BPM</strong></span><span>SpO2<strong>{band.spo2}%</strong></span><span>Motion<strong>{band.motionState}</strong></span><span>Battery<strong>{band.battery}%</strong></span></div>
    <footer><span>{band.risk.reasons[0]}</span><Link href={`/bands/${band.id}`}>Open full record<ChevronRight size={13} /></Link></footer>
  </section>;
}

function SegmentDistribution({ zone, bands }: { zone: Zone; bands: SafetyBand[] }) {
  const zoneBands = bands.filter((band) => band.zone === zone.id);
  const scale = (ZONE_BAND_CAPACITIES[zone.id as keyof typeof ZONE_BAND_CAPACITIES] ?? zoneBands.length) / Math.max(1, zoneBands.length);
  const segments = Array.from({ length: ZONE_SEGMENT_COUNTS[zone.id as keyof typeof ZONE_SEGMENT_COUNTS] ?? 1 }, (_, index) => {
    const segmentBands = zoneBands.filter((band) => band.segment === index + 1);
    return {
      id: index + 1,
      count: Math.round(segmentBands.length * scale),
      distressed: Math.round(segmentBands.filter((band) => band.status === "DISTRESSED" || band.status === "SOS").length * scale),
      elevated: Math.round(segmentBands.filter((band) => band.status === "ELEVATED").length * scale),
    };
  });
  const max = Math.max(1, ...segments.map((segment) => segment.count));
  return <section className="segment-distribution"><header><span>Zone {zone.id} segment population</span><strong>{segments.reduce((sum, segment) => sum + segment.count, 0)} bands</strong></header><div>{segments.map((segment) => <article key={segment.id} className={segment.distressed ? "danger" : segment.elevated ? "elevated" : ""}><span>S{segment.id}</span><i><b style={{ height: `${Math.max(12, (segment.count / max) * 100)}%` }} /></i><strong>{segment.count}</strong><small>{segment.distressed ? `${segment.distressed} risk` : "stable"}</small></article>)}</div></section>;
}

function SelectedZonePanel({ zone }: { zone: Zone }) {
  const engines = [
    ["Human", Math.min(100, zone.humanAlerts * 25)],
    ["Crowd", zone.crowdRisk],
    ["Integrity", zone.integrityRisk],
  ] as const;
  return <section className="twin-selected-zone intelligence"><header><div><span>Selected Zone</span><strong>{zone.label}</strong></div><b>{overallRisk(zone)}<small>overall</small></b></header><div className="zone-population-triad"><span>Expected<strong>{zone.expected.toLocaleString()}</strong></span><span>Authenticated<strong>{zone.authenticated.toLocaleString()}</strong></span><span>Observed<strong>{zone.observed.toLocaleString()}</strong></span></div><div className="zone-engine-bars">{engines.map(([label, value]) => <span key={label}><small>{label}</small><i><b className={levelFor(value)} style={{ width: `${value}%` }} /></i><strong>{Math.round(value)}</strong></span>)}</div><footer><span>Flow {zone.inflow.toFixed(1)}/m in · {zone.outflow.toFixed(1)}/m out</span><span>CCTV {Math.round(zone.cctvConfidence * 100)}% · Gateway {Math.round(zone.gatewayHealth * 100)}%</span></footer></section>;
}

function ZoneRail({ zones, bands, totalBands, selectedZone, onSelect }: { zones: Zone[]; bands: SafetyBand[]; totalBands: number; selectedZone: string; onSelect: (zone: string) => void }) {
  return <div className="twin-zone-list">{zones.toSorted((a, b) => overallRisk(b) - overallRisk(a)).map((zone) => {
    const score = overallRisk(zone);
    const zoneBands = bands.filter((band) => band.zone === zone.id);
    const zoneCapacity = ZONE_BAND_CAPACITIES[zone.id as keyof typeof ZONE_BAND_CAPACITIES] ?? Math.round(totalBands / zones.length);
    const scale = zoneCapacity / Math.max(1, zoneBands.length);
    const distressed = Math.round(zoneBands.filter((band) => band.status === "DISTRESSED" || band.status === "SOS").length * scale);
    return <button key={zone.id} className={`${selectedZone === zone.id ? "selected" : ""} ${levelFor(score)}`} onClick={() => onSelect(zone.id)}>
      <b>{zone.id}</b><div><strong>{zone.label}</strong><span>{zoneCapacity.toLocaleString()} bands / {distressed} distressed</span></div><i><span style={{ width: `${Math.min(100, score)}%` }} /></i><em>{score}</em>
    </button>;
  })}</div>;
}

export function DigitalTwinOperations() {
  const { scenario } = useDemoOperations();
  const isBrowser = useSyncExternalStore(subscribeToBrowser, () => true, () => false);
  const mapBandSample = useMemo(() => isBrowser ? getTwinMapBands() : [], [isBrowser]);
  const { zones } = useLiveDigitalTwin(scenario);
  const summary = DEMO_BAND_SUMMARY;
  const [railView, setRailView] = useState<RailView>("BANDS");
  const [selectedZone, setSelectedZone] = useState("G");
  const [zoneFilter, setZoneFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const [selectedBandId, setSelectedBandId] = useState<number | null>(7);
  const [zoom, setZoom] = useState(1);
  const [showBands, setShowBands] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showGates, setShowGates] = useState(true);
  const [showCameras, setShowCameras] = useState(true);
  const [distressOnly, setDistressOnly] = useState(false);
  const [simulation, setSimulation] = useState<TwinSimulationState | null>(null);
  const [simulationBusy, setSimulationBusy] = useState(false);
  const [simulationError, setSimulationError] = useState("");

  useEffect(() => {
    if (railView !== "VIRTUALISATION") return;
    const inFlight = { current: false };
    const load = () => {
      if (inFlight.current) return;
      inFlight.current = true;
      fetch("/api/simulation", { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject()).then((payload: TwinSimulationState) => { setSimulation(payload); setSimulationError(""); }).catch(() => setSimulationError("Simulation service is offline. Start the FastAPI service and retry.")).finally(() => { inFlight.current = false; });
    };
    load();
    const timer = window.setInterval(load, 2500);
    return () => window.clearInterval(timer);
  }, [railView]);
  const virtualZones = zones.map((item) => {
    const live = simulation?.zones.find((zoneItem) => zoneItem.prediction.zone_id === item.id);
    return live ? { ...item, expected: live.fusion.expected_population, authenticated: live.fusion.authenticated_population, observed: live.fusion.observed_population, crowdRisk: live.risk_engines.crowd.score, integrityRisk: live.risk_engines.integrity.score, humanAlerts: live.risk_engines.human.score >= 55 ? Math.max(1, item.humanAlerts) : 0, inflow: live.observation.inflow_per_min, outflow: live.observation.outflow_per_min, cctvConfidence: live.fusion.cctv_confidence, gatewayHealth: live.observation.gateway_health } : item;
  });
  const isVirtualisation = railView === "VIRTUALISATION";
  const displayZones = isVirtualisation ? virtualZones : zones;

  const searchedBand = useMemo(() => {
    const parsed = Number(deferredQuery.replace(/^wb-/i, ""));
    return deferredQuery && Number.isInteger(parsed) && parsed >= 1 && parsed <= DEMO_BAND_COUNT && !TWIN_RENDER_BANDS.some((band) => band.id === parsed) ? generateDemoBand(parsed) : null;
  }, [deferredQuery]);
  const twinBandSample = useMemo(() => searchedBand ? [searchedBand, ...TWIN_RENDER_BANDS] : TWIN_RENDER_BANDS, [searchedBand]);
  const visibleBands = useMemo(() => twinBandSample.filter((band) => {
    if (deferredQuery && !band.code.toLowerCase().includes(deferredQuery) && !String(band.id).includes(deferredQuery)) return false;
    if (zoneFilter !== "ALL" && band.zone !== zoneFilter) return false;
    if (statusFilter !== "ALL" && band.status !== statusFilter) return false;
    if (distressOnly && band.status !== "DISTRESSED" && band.status !== "SOS") return false;
    return true;
  }), [deferredQuery, distressOnly, statusFilter, twinBandSample, zoneFilter]);
  const visibleMapBands = useMemo(() => mapBandSample.filter((band) => {
    if (deferredQuery && !band.code.toLowerCase().includes(deferredQuery) && !String(band.id).includes(deferredQuery)) return false;
    if (zoneFilter !== "ALL" && band.zone !== zoneFilter) return false;
    if (statusFilter !== "ALL" && band.status !== statusFilter) return false;
    if (distressOnly && band.status !== "DISTRESSED" && band.status !== "SOS") return false;
    return true;
  }), [deferredQuery, distressOnly, mapBandSample, statusFilter, zoneFilter]);
  const railBands = useMemo(() => visibleBands.toSorted((a, b) => b.riskScore - a.riskScore || a.id - b.id).slice(0, 40), [visibleBands]);
  const selectedBand = selectedBandId === null ? null : generateDemoBand(selectedBandId);
  const zone = displayZones.find((item) => item.id === selectedZone) ?? displayZones[0];
  const clearFilters = () => { setQuery(""); setZoneFilter("ALL"); setStatusFilter("ALL"); setDistressOnly(false); };
  const runSimulationCommand = async (body: Record<string, string>) => {
    setSimulationBusy(true);
    setSimulationError("");
    try { setSimulation(await simulationCommand(body)); }
    catch { setSimulationError("The simulation command failed. Check the backend connection and retry."); }
    finally { setSimulationBusy(false); }
  };

  return <main className="twin-ops-page">
    <OperationsHeader section="Digital Twin" />
    <section className="twin-ops-summary">
      <div><span>Active Event</span><strong>GT vs DC - IPL 2025</strong><small><i /> Live stadium telemetry</small></div>
      <div><span>Digital Bands</span><strong>{summary.total.toLocaleString()}</strong><small>{summary.active.toLocaleString()} connected</small></div>
      <div><span>Observed Population</span><strong>{summary.active.toLocaleString()}</strong><small>{summary.active.toLocaleString()} authenticated</small></div>
      <div><span>Distress Signals</span><strong className="danger">{summary.distressed + summary.sos}</strong><small>{summary.sos} SOS active</small></div>
      <div><span>Selected Zone</span><strong>{zone.label}</strong><small>Risk {overallRisk(zone)} / 100</small></div>
      <div><span>Twin Health</span><strong className="healthy"><ShieldCheck size={15} /> Synchronized</strong><small>Updated 20:34:18</small></div>
    </section>

    <div className="twin-ops-layout">
      <section className="twin-ops-map">
        <div className="twin-map-toolbar">
          <div className="twin-map-zoom"><button title="Zoom out" onClick={() => setZoom((value) => Math.max(.82, value - .05))}><Minus size={16} /></button><strong>{Math.round(zoom * 100)}%</strong><button title="Zoom in" onClick={() => setZoom((value) => Math.min(1.2, value + .05))}><Plus size={16} /></button><button title="Fit stadium" onClick={() => setZoom(1)}><LocateFixed size={16} /></button></div>
          <div className="twin-map-layers">
            <LayerButton active={showBands} label="Bands" title="Show or hide bands" onClick={() => setShowBands((value) => !value)}>{showBands ? <Eye size={15} /> : <EyeOff size={15} />}</LayerButton>
            <LayerButton active={showHeatmap} label="Heatmap" title="Show or hide heatmap" onClick={() => setShowHeatmap((value) => !value)}><Layers3 size={15} /></LayerButton>
            <LayerButton active={showGates} label="Gates" title="Show or hide gates" onClick={() => setShowGates((value) => !value)}><DoorOpen size={15} /></LayerButton>
            <LayerButton active={showCameras} label="CCTV" title="Show or hide CCTV" onClick={() => setShowCameras((value) => !value)}><Camera size={15} /></LayerButton>
            <LayerButton active={distressOnly} danger label="Distress" title="Show distressed bands only" onClick={() => setDistressOnly((value) => !value)}><Siren size={15} /></LayerButton>
          </div>
        </div>
        <div className="twin-ops-map-stage">
          <StadiumTwin zones={displayZones} selectedZone={selectedZone} onSelect={(id) => { setSelectedZone(id); setSelectedBandId(null); }} zoom={zoom} bands={showBands ? visibleMapBands : []} selectedBand={selectedBandId} onSelectBand={(id) => { const band = mapBandSample.find((item) => item.id === id); setSelectedBandId(id); if (band) setSelectedZone(band.zone); }} showHeatmap={showHeatmap} showGates={showGates} showCameras={showCameras} movementScenario={isVirtualisation ? simulation?.scenario : undefined} movementTick={simulation?.tick ?? 0} movementRunning={Boolean(simulation?.running)} />
        </div>
        <div className="twin-map-legend"><span><i className="normal" />Normal</span><span><i className="elevated" />Elevated</span><span><i className="distressed" />Distressed</span><span><i className="offline" />Offline</span><span><i className="sos" />SOS</span></div>
      </section>

      <aside className="twin-live-rail">
        <header><div><p className="eyebrow">Venue Intelligence</p><h1>{isVirtualisation ? "Twin Virtualisation" : "Live Twin Data"}</h1></div>{isVirtualisation ? <Play size={18} /> : <Activity size={18} />}</header>
        <div className="twin-rail-tabs"><button className={railView === "BANDS" ? "active" : ""} onClick={() => setRailView("BANDS")}><Watch size={14} />Bands</button><button className={railView === "ZONES" ? "active" : ""} onClick={() => { setRailView("ZONES"); setSelectedBandId(null); }}><UsersRound size={14} />Zones</button><button className={isVirtualisation ? "active" : ""} onClick={() => setRailView("VIRTUALISATION")}><Play size={14} />Virtualisation</button></div>
        {!isVirtualisation ? <><div className="twin-rail-filters">
          <label><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search band ID" aria-label="Search live bands" /></label>
          <select value={zoneFilter} onChange={(event) => { setZoneFilter(event.target.value); if (event.target.value !== "ALL") setSelectedZone(event.target.value); }} aria-label="Filter live bands by zone"><option value="ALL">All zones</option>{BAND_ZONES.map((item) => <option key={item} value={item}>Zone {item}</option>)}</select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} aria-label="Filter live bands by status">{["ALL","NORMAL","ELEVATED","DISTRESSED","OFFLINE","SOS"].map((item) => <option key={item}>{item}</option>)}</select>
          <button title="Clear twin filters" onClick={clearFilters}><FilterX size={15} /></button>
        </div>

        {selectedBand ? <SelectedBandPanel band={selectedBand} /> : <SelectedZonePanel zone={zone} />}
        <SegmentDistribution zone={zone} bands={TWIN_RENDER_BANDS} />

        {railView === "BANDS" ? <div className="twin-band-list"><header><span>Highest risk bands</span><strong>Live priority records</strong></header>{railBands.map((band) => <button key={band.id} className={`${band.status.toLowerCase()} ${selectedBandId === band.id ? "selected" : ""}`} onClick={() => { setSelectedBandId(band.id); setSelectedZone(band.zone); }}><i /><div><strong>{band.code}</strong><span>Zone {band.zone} / S{band.segment} / {band.connectivity}</span></div><div><strong>{band.hr}</strong><span>BPM</span></div><div><strong>{band.spo2}%</strong><span>SpO2</span></div><b>{band.riskScore}<small>{band.status}</small></b></button>)}</div> : <ZoneRail zones={zones} bands={TWIN_RENDER_BANDS} totalBands={DEMO_BAND_COUNT} selectedZone={selectedZone} onSelect={(id) => { setSelectedZone(id); setZoneFilter(id); setSelectedBandId(null); }} />}</> : <DigitalTwinVirtualisation state={simulation} busy={simulationBusy} error={simulationError} onCommand={runSimulationCommand} />}
      </aside>
    </div>
  </main>;
}
