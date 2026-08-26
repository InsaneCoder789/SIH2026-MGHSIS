"use client";

import Link from "next/link";
import {
  Activity, Camera, ChevronRight, DoorOpen, Eye, EyeOff, FilterX, Layers3,
  LocateFixed, Minus, Pause, Play, Plus, Search, ShieldCheck, Siren, UsersRound, Watch,
} from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from "react";
import { StadiumTwin } from "@/components/command-center-dashboard";
import { useDemoOperations } from "@/components/demo-operations-context";
import { OperationsHeader } from "@/components/operations-header";
import { BAND_ZONES, DEMO_BANDS, ZONE_SEGMENT_COUNTS, summarizeBands, type BandStatus, type SafetyBand } from "@/lib/bands";
import { getDigitalTwinSnapshot, levelFor, overallRisk, type Zone } from "@/lib/mghsis-demo";

type RailView = "BANDS" | "ZONES";
type StatusFilter = "ALL" | BandStatus;
type TwinSimulationState = {
  scenario: string;
  running: boolean;
  tick: number;
  active_action: { action: string; zone_id: string } | null;
  aggregate: { peak_score: number; average_score: number; high_or_above: number; critical_zones: number };
  zones: Array<{ observation: { current_count: number; inflow_per_min: number; outflow_per_min: number; gateway_health: number }; prediction: { zone_id: string; score: number; level: string; trend: string } }>;
};

async function simulationCommand(body: Record<string, string>) {
  const response = await fetch("/api/simulation", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error("Simulation service unavailable");
  return response.json() as Promise<TwinSimulationState>;
}

function DigitalTwinVirtualisation({ state, onCommand }: { state: TwinSimulationState | null; onCommand: (body: Record<string, string>) => void }) {
  const highest = state?.zones.toSorted((a, b) => b.prediction.score - a.prediction.score).slice(0, 4) ?? [];
  return <section className="digital-twin-virtualisation"><header><div><p className="eyebrow">Scenario Projection On Twin</p><h2>{state?.scenario?.replaceAll("_", " ") ?? "Connecting"}</h2></div><span>{state?.running ? "RUNNING" : "PAUSED"}</span></header><div className="virtualisation-scenarios"><button onClick={() => onCommand({ command: "scenario", scenario: "congestion" })}>Congestion</button><button onClick={() => onCommand({ command: "scenario", scenario: "distress" })}>Distress</button><button onClick={() => onCommand({ command: "scenario", scenario: "breach" })}>Breach</button><button onClick={() => onCommand({ command: "scenario", scenario: "gateway" })}>Gateway</button></div><div className="virtualisation-summary"><div><small>Virtual tick</small><strong>{state?.tick ?? "--"}</strong></div><div><small>Peak score</small><strong>{state?.aggregate.peak_score.toFixed(1) ?? "--"}</strong></div><div><small>High+</small><strong>{state?.aggregate.high_or_above ?? "--"}</strong></div><div><small>Critical</small><strong>{state?.aggregate.critical_zones ?? "--"}</strong></div></div><div className="virtualisation-zones">{highest.map((item) => <article key={item.prediction.zone_id}><div><b>{item.prediction.zone_id}</b><span>{item.prediction.level} / {item.prediction.trend}</span></div><i><em className={item.prediction.level.toLowerCase()} style={{ width: `${Math.min(100, item.prediction.score)}%` }} /></i><strong>{item.prediction.score.toFixed(0)}</strong></article>)}</div><footer><button onClick={() => onCommand({ command: state?.running ? "pause" : "start" })}>{state?.running ? <Pause size={13} /> : <Play size={13} />}{state?.running ? "Pause" : "Run"}</button><button onClick={() => onCommand({ command: "action", action: "REDIRECT_TO_ZONE", zone_id: "G" })}><LocateFixed size={13} />Redirect G</button><button onClick={() => onCommand({ command: "reset" })}>Reset</button></footer></section>;
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
  const segments = Array.from({ length: ZONE_SEGMENT_COUNTS[zone.id as keyof typeof ZONE_SEGMENT_COUNTS] ?? 1 }, (_, index) => {
    const segmentBands = bands.filter((band) => band.zone === zone.id && band.segment === index + 1);
    return {
      id: index + 1,
      count: segmentBands.length,
      distressed: segmentBands.filter((band) => band.status === "DISTRESSED" || band.status === "SOS").length,
      elevated: segmentBands.filter((band) => band.status === "ELEVATED").length,
    };
  });
  const max = Math.max(1, ...segments.map((segment) => segment.count));
  return <section className="segment-distribution"><header><span>Zone {zone.id} segment population</span><strong>{segments.reduce((sum, segment) => sum + segment.count, 0)} bands</strong></header><div>{segments.map((segment) => <article key={segment.id} className={segment.distressed ? "danger" : segment.elevated ? "elevated" : ""}><span>S{segment.id}</span><i><b style={{ height: `${Math.max(12, (segment.count / max) * 100)}%` }} /></i><strong>{segment.count}</strong><small>{segment.distressed ? `${segment.distressed} risk` : "stable"}</small></article>)}</div></section>;
}

function ZoneRail({ zones, bands, selectedZone, onSelect }: { zones: Zone[]; bands: SafetyBand[]; selectedZone: string; onSelect: (zone: string) => void }) {
  return <div className="twin-zone-list">{zones.toSorted((a, b) => overallRisk(b) - overallRisk(a)).map((zone) => {
    const score = overallRisk(zone);
    const zoneBands = bands.filter((band) => band.zone === zone.id);
    const distressed = zoneBands.filter((band) => band.status === "DISTRESSED" || band.status === "SOS").length;
    return <button key={zone.id} className={`${selectedZone === zone.id ? "selected" : ""} ${levelFor(score)}`} onClick={() => onSelect(zone.id)}>
      <b>{zone.id}</b><div><strong>{zone.label}</strong><span>{zoneBands.length} bands / {distressed} distressed</span></div><i><span style={{ width: `${Math.min(100, score)}%` }} /></i><em>{score}</em>
    </button>;
  })}</div>;
}

export function DigitalTwinOperations() {
  const { scenario } = useDemoOperations();
  const { zones, totals } = getDigitalTwinSnapshot(scenario);
  const summary = summarizeBands();
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
  const [twinTab, setTwinTab] = useState<"LIVE" | "VIRTUALISATION">("LIVE");
  const [simulation, setSimulation] = useState<TwinSimulationState | null>(null);

  useEffect(() => {
    if (twinTab !== "VIRTUALISATION") return;
    const inFlight = { current: false };
    const load = () => {
      if (inFlight.current) return;
      inFlight.current = true;
      fetch("/api/simulation", { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject()).then((payload: TwinSimulationState) => setSimulation(payload)).catch(() => undefined).finally(() => { inFlight.current = false; });
    };
    load();
    const timer = window.setInterval(load, 2500);
    return () => window.clearInterval(timer);
  }, [twinTab]);
  const virtualZones = zones.map((item) => {
    const live = simulation?.zones.find((zoneItem) => zoneItem.prediction.zone_id === item.id);
    return live ? { ...item, crowdRisk: live.prediction.score, observed: live.observation.current_count, inflow: live.observation.inflow_per_min, outflow: live.observation.outflow_per_min, gatewayHealth: live.observation.gateway_health } : item;
  });
  const displayZones = twinTab === "VIRTUALISATION" ? virtualZones : zones;

  const visibleBands = useMemo(() => DEMO_BANDS.filter((band) => {
    if (deferredQuery && !band.code.toLowerCase().includes(deferredQuery) && !String(band.id).includes(deferredQuery)) return false;
    if (zoneFilter !== "ALL" && band.zone !== zoneFilter) return false;
    if (statusFilter !== "ALL" && band.status !== statusFilter) return false;
    if (distressOnly && band.status !== "DISTRESSED" && band.status !== "SOS") return false;
    return true;
  }), [deferredQuery, distressOnly, statusFilter, zoneFilter]);
  const railBands = useMemo(() => visibleBands.toSorted((a, b) => b.riskScore - a.riskScore || a.id - b.id).slice(0, 40), [visibleBands]);
  const selectedBand = selectedBandId === null ? null : DEMO_BANDS.find((band) => band.id === selectedBandId) ?? null;
  const zone = displayZones.find((item) => item.id === selectedZone) ?? displayZones[0];
  const clearFilters = () => { setQuery(""); setZoneFilter("ALL"); setStatusFilter("ALL"); setDistressOnly(false); };

  return <main className="twin-ops-page">
    <OperationsHeader section="Digital Twin" />
    <section className="twin-ops-summary">
      <div><span>Active Event</span><strong>GT vs DC - IPL 2025</strong><small><i /> Live stadium telemetry</small></div>
      <div><span>Digital Bands</span><strong>{summary.total.toLocaleString()}</strong><small>{summary.active.toLocaleString()} connected</small></div>
      <div><span>Observed Population</span><strong>{totals.observed.toLocaleString()}</strong><small>{totals.authenticated.toLocaleString()} authenticated</small></div>
      <div><span>Distress Signals</span><strong className="danger">{summary.distressed + summary.sos}</strong><small>{summary.sos} SOS active</small></div>
      <div><span>Selected Zone</span><strong>{zone.label}</strong><small>Risk {overallRisk(zone)} / 100</small></div>
      <div><span>Twin Health</span><strong className="healthy"><ShieldCheck size={15} /> Synchronized</strong><small>Updated 20:34:18</small></div>
    </section>

    <div className="twin-ops-layout">
      <section className="twin-ops-map">
        <div className="twin-map-toolbar">
          <div className="twin-digital-view-tabs"><button className={twinTab === "LIVE" ? "active" : ""} onClick={() => setTwinTab("LIVE")}><Activity size={14} />Live Twin</button><button className={twinTab === "VIRTUALISATION" ? "active" : ""} onClick={() => setTwinTab("VIRTUALISATION")}><Play size={14} />Virtualisation</button></div>
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
          <StadiumTwin zones={displayZones} selectedZone={selectedZone} onSelect={(id) => { setSelectedZone(id); setSelectedBandId(null); }} zoom={zoom} bands={showBands ? visibleBands : []} selectedBand={selectedBandId} onSelectBand={(id) => { const band = DEMO_BANDS.find((item) => item.id === id); setSelectedBandId(id); if (band) setSelectedZone(band.zone); }} showHeatmap={showHeatmap} showGates={showGates} showCameras={showCameras} />
        </div>
        {twinTab === "VIRTUALISATION" ? <DigitalTwinVirtualisation state={simulation} onCommand={(body) => simulationCommand(body).then(setSimulation).catch(() => undefined)} /> : null}
        <div className="twin-map-legend"><span><i className="normal" />Normal</span><span><i className="elevated" />Elevated</span><span><i className="distressed" />Distressed</span><span><i className="offline" />Offline</span><span><i className="sos" />SOS</span><b>{showBands ? visibleBands.length.toLocaleString() : 0} rendered</b></div>
      </section>

      <aside className="twin-live-rail">
        <header><div><p className="eyebrow">Venue Intelligence</p><h1>Live Twin Data</h1></div><Activity size={18} /></header>
        <div className="twin-rail-tabs"><button className={railView === "BANDS" ? "active" : ""} onClick={() => setRailView("BANDS")}><Watch size={14} />Bands</button><button className={railView === "ZONES" ? "active" : ""} onClick={() => setRailView("ZONES")}><UsersRound size={14} />Zones</button></div>
        <div className="twin-rail-filters">
          <label><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search band ID" aria-label="Search live bands" /></label>
          <select value={zoneFilter} onChange={(event) => { setZoneFilter(event.target.value); if (event.target.value !== "ALL") setSelectedZone(event.target.value); }} aria-label="Filter live bands by zone"><option value="ALL">All zones</option>{BAND_ZONES.map((item) => <option key={item} value={item}>Zone {item}</option>)}</select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} aria-label="Filter live bands by status">{["ALL","NORMAL","ELEVATED","DISTRESSED","OFFLINE","SOS"].map((item) => <option key={item}>{item}</option>)}</select>
          <button title="Clear twin filters" onClick={clearFilters}><FilterX size={15} /></button>
        </div>

        {selectedBand ? <SelectedBandPanel band={selectedBand} /> : <section className="twin-selected-zone"><span>Selected Zone</span><strong>{zone.label}</strong><small>{zone.observed.toLocaleString()} observed / risk {overallRisk(zone)}</small></section>}
        <SegmentDistribution zone={zone} bands={DEMO_BANDS} />

        {railView === "BANDS" ? <div className="twin-band-list"><header><span>Highest risk first</span><strong>{visibleBands.length.toLocaleString()} matching</strong></header>{railBands.map((band) => <button key={band.id} className={`${band.status.toLowerCase()} ${selectedBandId === band.id ? "selected" : ""}`} onClick={() => { setSelectedBandId(band.id); setSelectedZone(band.zone); }}><i /><div><strong>{band.code}</strong><span>Zone {band.zone} / S{band.segment} / {band.connectivity}</span></div><div><strong>{band.hr}</strong><span>BPM</span></div><div><strong>{band.spo2}%</strong><span>SpO2</span></div><b>{band.riskScore}<small>{band.status}</small></b></button>)}</div> : <ZoneRail zones={zones} bands={DEMO_BANDS} selectedZone={selectedZone} onSelect={(id) => { setSelectedZone(id); setZoneFilter(id); setSelectedBandId(null); }} />}
      </aside>
    </div>
  </main>;
}
