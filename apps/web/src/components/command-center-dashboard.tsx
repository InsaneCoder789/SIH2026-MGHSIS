"use client";

import Link from "next/link";
import {
  Activity, AlertTriangle, BatteryCharging, CloudSun, Construction, Crosshair,
  Hand, HeartPulse, ListFilter, LocateFixed, LockKeyhole, Minus, MousePointer2,
  Plus, Radio, RotateCcw, ShieldCheck, Siren, Users, UsersRound, Wind,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { useDemoOperations } from "@/components/demo-operations-context";
import { OperationsHeader } from "@/components/operations-header";
import { getTwinMapBands, type TwinMapBand } from "@/lib/bands";
import {
  getDigitalTwinSnapshot, levelFor, scenarioNotes,
  type RiskLevel, type Scenario, type Zone,
} from "@/lib/mghsis-demo";

type AlertTone = "human" | "crowd" | "integrity";
type VisualSector = {
  id: string;
  label: string;
  zoneId: string;
  ring: "outer" | "inner" | "premium";
  start: number;
  end: number;
  color: string;
  divisions: number;
};
type ReplacementStation = {
  gate: "G1" | "G8";
  angle: number;
  readyBands: number;
  chargingSlots: number;
  technicians: number;
};

const scenarioControls: Array<{ id: Scenario; label: string; icon: typeof Siren; tone: string }> = [
  { id: "distress", label: "Distress", icon: Siren, tone: "danger" },
  { id: "congestion", label: "Congestion", icon: UsersRound, tone: "danger" },
  { id: "breach", label: "Barricade Breach", icon: Construction, tone: "danger" },
  { id: "gateway", label: "Gateway Failure", icon: LockKeyhole, tone: "warning" },
  { id: "redirect", label: "Redirect Crowd", icon: LocateFixed, tone: "teal" },
  { id: "normal", label: "Reset", icon: RotateCcw, tone: "neutral" },
];

const alertGroups: Array<{ title: string; count: number; tone: AlertTone; rows: Array<[string, string, string]> }> = [
  { title: "Human Risk", count: 4, tone: "human", rows: [
    ["20:33:41", "Medical Emergency - Gate G3", "High"],
    ["20:33:02", "Unattended Child - Block F4", "High"],
    ["20:32:18", "Heat Stress Report - Block K6", "Medium"],
    ["20:31:47", "Person in Distress - Block B2", "Medium"],
  ] },
  { title: "Crowd Risk", count: 5, tone: "crowd", rows: [
    ["20:34:05", "Congestion - Block H3", "Severe"],
    ["20:33:28", "High Density - Block G5", "High"],
    ["20:32:51", "Congestion - South Premium East", "High"],
    ["20:32:10", "Bottleneck - Gate G7", "Medium"],
    ["20:31:35", "High Density - Block M2", "Medium"],
  ] },
  { title: "Population Integrity", count: 3, tone: "integrity", rows: [
    ["20:33:59", "Possible Ticket Forgery - Gate G5", "High"],
    ["20:33:40", "Re-entry Attempt - Gate G2", "Medium"],
    ["20:31:22", "Unregistered Access - Gate G8", "Medium"],
  ] },
];

const timelineRows: Array<[string, string, "ALERT" | "ACTION" | "SYSTEM"]> = [
  ["20:34:05", "Congestion detected - Block H3", "ALERT"],
  ["20:33:41", "Medical emergency reported - Gate G3", "ALERT"],
  ["20:33:28", "Field team dispatched - Gate G3", "ACTION"],
  ["20:33:12", "Crowd flow normal - Block N", "SYSTEM"],
  ["20:32:51", "Congestion detected - South Premium East", "ALERT"],
];

const riskColors: Record<RiskLevel, string> = {
  low: "#76b85a", moderate: "#e1c326", high: "#ef9414", critical: "#ed4a37",
};

const subscribeToBrowser = () => () => undefined;

const visualSectors: VisualSector[] = [
  { id: "M", label: "Block M", zoneId: "M", ring: "outer", start: 310, end: 352, color: "#5c99ad", divisions: 6 },
  { id: "N", label: "Block N", zoneId: "N", ring: "outer", start: 352, end: 392, color: "#5c99ad", divisions: 7 },
  { id: "P", label: "Block P", zoneId: "P", ring: "outer", start: 32, end: 68, color: "#5c99ad", divisions: 6 },
  { id: "Q", label: "Block Q", zoneId: "Q", ring: "outer", start: 68, end: 103, color: "#5c99ad", divisions: 6 },
  { id: "R", label: "Block R", zoneId: "R", ring: "outer", start: 103, end: 139, color: "#5c99ad", divisions: 6 },
  { id: "J", label: "Block J", zoneId: "J", ring: "outer", start: 221, end: 257, color: "#5c99ad", divisions: 6 },
  { id: "K", label: "Block K", zoneId: "K", ring: "outer", start: 257, end: 286, color: "#5c99ad", divisions: 5 },
  { id: "L", label: "Block L", zoneId: "L", ring: "outer", start: 286, end: 310, color: "#5c99ad", divisions: 4 },
  { id: "D", label: "Block D", zoneId: "D", ring: "inner", start: 309, end: 349, color: "#ef8f17", divisions: 6 },
  { id: "E", label: "Block E", zoneId: "E", ring: "inner", start: 349, end: 385, color: "#ef8f17", divisions: 6 },
  { id: "F", label: "Block F", zoneId: "F", ring: "inner", start: 25, end: 61, color: "#e7b51d", divisions: 6 },
  { id: "G", label: "Block G", zoneId: "G", ring: "inner", start: 61, end: 94, color: "#ef9414", divisions: 5 },
  { id: "H", label: "Block H", zoneId: "H", ring: "inner", start: 94, end: 128, color: "#ef7b22", divisions: 5 },
  { id: "A", label: "Block A", zoneId: "SPE", ring: "inner", start: 218, end: 254, color: "#e7a916", divisions: 5 },
  { id: "B", label: "Block B", zoneId: "B", ring: "inner", start: 254, end: 281, color: "#f08d14", divisions: 4 },
  { id: "C", label: "Block C", zoneId: "C", ring: "inner", start: 281, end: 309, color: "#ec4b39", divisions: 4 },
  { id: "SPW", label: "South Premium West", zoneId: "SPW", ring: "premium", start: 128, end: 161, color: "#f0b61f", divisions: 3 },
  { id: "SPC", label: "South Premium Centre", zoneId: "SPC", ring: "premium", start: 161, end: 199, color: "#e6e3da", divisions: 4 },
  { id: "SPE", label: "South Premium East", zoneId: "SPE", ring: "premium", start: 199, end: 232, color: "#aabd4d", divisions: 3 },
];

const replacementStations: ReplacementStation[] = [
  { gate: "G1", angle: 223, readyBands: 48, chargingSlots: 24, technicians: 2 },
  { gate: "G8", angle: 137, readyBands: 52, chargingSlots: 24, technicians: 2 },
];

function fmt(value: number) { return Number(value.toFixed(3)); }
function polar(cx: number, cy: number, radius: number, degrees: number) {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return { x: fmt(cx + radius * Math.cos(radians)), y: fmt(cy + radius * Math.sin(radians)) };
}
function stagePoint(radius: number, degrees: number) {
  const point = polar(450, 330, radius, degrees);
  return { x: point.x, y: fmt(75.9 + point.y * 0.77) };
}
function arcPath(cx: number, cy: number, inner: number, outer: number, start: number, end: number, gap = 0.6) {
  const s = start + gap; const e = end - gap;
  const p1 = polar(cx, cy, outer, s); const p2 = polar(cx, cy, outer, e);
  const p3 = polar(cx, cy, inner, e); const p4 = polar(cx, cy, inner, s);
  return `M ${p1.x} ${p1.y} A ${outer} ${outer} 0 ${e - s > 180 ? 1 : 0} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${inner} ${inner} 0 ${e - s > 180 ? 1 : 0} 0 ${p4.x} ${p4.y} Z`;
}

function HeaderMetric({ label, children, accent }: { label: string; children: ReactNode; accent?: string }) {
  return <div className="header-metric"><span>{label}</span><strong className={accent}>{children}</strong></div>;
}

function CommandHeader({ scenario }: { scenario: Scenario }) {
  const { event } = getDigitalTwinSnapshot(scenario);
  const authenticated = scenario === "gateway" ? 36_612 : scenario === "congestion" ? 38_569 : 38_247;
  const observed = scenario === "breach" ? 42_402 : scenario === "congestion" ? 42_378 : 41_892;
  return <header className="command-header">
    <HeaderMetric label="Event"><span>GT vs DC - IPL 2025</span><i className="live-dot" /><small>LIVE</small></HeaderMetric>
    <HeaderMetric label="Mode" accent="teal">Cricket Stadium</HeaderMetric>
    <HeaderMetric label="Authenticated"><Users size={19} /> {authenticated.toLocaleString()}</HeaderMetric>
    <HeaderMetric label="Observed (Est.)"><UsersRound size={19} /> {observed.toLocaleString()}</HeaderMetric>
    <HeaderMetric label="Active Alerts" accent="red"><AlertTriangle size={19} /> 12</HeaderMetric>
    <HeaderMetric label="System Health" accent={event.systemHealth === "GOOD" ? "green" : "amber"}><ShieldCheck size={19} /> {event.systemHealth}</HeaderMetric>
    <HeaderMetric label="Event Time"><span className="event-clock">20:34:18</span><small className="event-date">Wed, 14 May 2025</small></HeaderMetric>
  </header>;
}

function StatusOverlay({ capacity, scenario }: { capacity: number; scenario: Scenario }) {
  return <section className="status-overlay">
    <h2>Stadium Status</h2>
    <dl>
      <div><dt>Overall Risk</dt><dd className="risk-high">{scenario === "normal" ? "High" : "Severe"}</dd></div>
      <div><dt>Weather</dt><dd><CloudSun size={15} /> 28°C</dd></div>
      <div><dt>Capacity</dt><dd>{capacity}%</dd></div>
      <div><dt>Wind</dt><dd><Wind size={14} /> 12 km/h</dd></div>
      <div><dt>Visibility</dt><dd>Good</dd></div>
    </dl>
    <footer><span>Last Updated</span><strong>20:34:18</strong></footer>
  </section>;
}

function MapTools({ zoom, setZoom }: { zoom: number; setZoom: (value: number) => void }) {
  return <div className="map-tools" aria-label="Digital twin map tools">
    <div><button title="Select zone"><MousePointer2 size={19} /></button><button title="Pan map"><Hand size={19} /></button><button title="Fit stadium"><Crosshair size={19} /></button></div>
    <div><button title="Zoom in" onClick={() => setZoom(Math.min(1.16, zoom + 0.04))}><Plus size={20} /></button><button title="Zoom out" onClick={() => setZoom(Math.max(0.88, zoom - 0.04))}><Minus size={20} /></button></div>
  </div>;
}

function RiskLegend() {
  return <section className="risk-legend"><h3>Risk Level</h3>
    <span><i className="low" />Low (0-30%)</span><span><i className="moderate" />Moderate (31-60%)</span>
    <span><i className="high" />High (61-80%)</span><span><i className="severe" />Severe (81-100%)</span><span><i className="none" />No Data</span>
  </section>;
}

function BowlSector({ sector, zone, selected, heatmapVisible, onSelect }: { sector: VisualSector; zone: Zone; selected: boolean; heatmapVisible: boolean; onSelect: (id: string) => void }) {
  const level = levelFor(Math.max(zone.crowdRisk, zone.integrityRisk));
  const radii = sector.ring === "outer" ? [250, 343] : [182, 246];
  const mid = (sector.start + sector.end) / 2;
  const label = polar(450, 330, (radii[0] + radii[1]) / 2, mid);
  const neutralFill = sector.ring === "outer" ? "#5c99ad" : sector.ring === "premium" ? "#d7d9d4" : "#d9dbd7";
  const fill = heatmapVisible ? level === "critical" ? riskColors.critical : sector.color : neutralFill;
  return <g className={`bowl-sector ${selected ? "selected" : ""}`} onClick={() => onSelect(sector.zoneId)}>
    {Array.from({ length: sector.divisions }, (_, index) => {
      const size = (sector.end - sector.start) / sector.divisions;
      const sectionMid = sector.start + size * index + size / 2;
      const seatPosition = polar(450, 330, radii[0] + (sector.ring === "outer" ? 25 : 18), sectionMid);
      return <g key={index}>
        <path d={arcPath(450, 330, radii[0], radii[1], sector.start + index * size, sector.start + (index + 1) * size, 0.25)} fill={fill} className="seat-wedge" />
        <text x={seatPosition.x} y={seatPosition.y} textAnchor="middle" dominantBaseline="middle" transform={`rotate(${sectionMid}, ${seatPosition.x}, ${seatPosition.y})`} className="seat-number">{index + 1}</text>
      </g>;
    })}
    <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle" transform={sector.ring === "premium" ? undefined : `rotate(${mid}, ${label.x}, ${label.y})`} className={`block-label ${sector.ring === "premium" ? "premium-block-label" : ""}`}>
      {sector.ring === "premium" ? <>
        <tspan x={label.x} dy="-9">SOUTH</tspan>
        <tspan x={label.x} dy="10">PREMIUM</tspan>
        <tspan x={label.x} dy="10">{sector.label.split(" ").at(-1)?.toUpperCase()}</tspan>
      </> : sector.label.toUpperCase()}
    </text>
  </g>;
}

function virtualBandOffset(band: TwinMapBand, scenario: string | undefined, tick: number) {
  if (!scenario || scenario === "normal") return { x: 0, y: 0 };
  const phase = (tick + band.id % 13) * 0.52;
  const pulse = Math.sin(phase) * 3.4;
  if (scenario === "congestion" && (band.zone === "G" || band.zone === "H")) return { x: -Math.abs(pulse) - 2, y: -Math.abs(Math.cos(phase) * 4) };
  if (scenario === "redirect" && band.zone === "G") return { x: -8 - Math.abs(pulse), y: -5 + Math.sin(phase) * 2 };
  if (scenario === "redirect" && band.zone === "F") return { x: -4 + Math.sin(phase) * 5, y: 3 + Math.cos(phase) * 2 };
  if (scenario === "distress" && band.zone === "B") return { x: Math.cos(phase) * 2, y: Math.sin(phase) * 2 };
  if (scenario === "breach" && band.zone === "H") return { x: 5 + Math.abs(pulse), y: 4 + Math.cos(phase) * 3 };
  return { x: Math.sin(phase) * 0.8, y: Math.cos(phase) * 0.8 };
}

const virtualFlowPaths: Record<string, { path: string; label: string }> = {
  congestion: { path: "M725 410 C680 395 642 390 603 372", label: "Crowd accumulating toward Block G" },
  redirect: { path: "M690 392 C642 355 602 315 560 285", label: "Redirected flow from Block G toward Block F" },
  distress: { path: "M226 286 C260 300 286 313 316 326", label: "Response team converging on Block B" },
  breach: { path: "M664 442 C708 466 748 490 792 508", label: "Outward movement at the Block H boundary" },
  gateway: { path: "M744 240 C770 260 782 286 788 315", label: "Gateway coverage degradation at Block Q" },
};

function VirtualCrowdFlow({ scenario, running }: { scenario?: string; running?: boolean }) {
  const flow = scenario ? virtualFlowPaths[scenario] : undefined;
  if (!flow) return null;
  return <g className={`virtual-crowd-flow ${running ? "running" : "paused"}`} aria-label={flow.label}>
    <path d={flow.path} className="virtual-flow-route" />
    {running ? Array.from({ length: 6 }, (_, index) => <circle key={index} r={index === 0 ? 4 : 3} className="virtual-flow-particle">
      <animateMotion dur={`${1.6 + index * .16}s`} begin={`${index * -.3}s`} repeatCount="indefinite" path={flow.path} />
    </circle>) : null}
  </g>;
}

function BandMapCanvas({ bands, selectedBand, onSelectBand, movementScenario, movementTick }: {
  bands: TwinMapBand[];
  selectedBand?: number | null;
  onSelectBand: (bandId: number) => void;
  movementScenario?: string;
  movementTick: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pixelRatio = 1;
    canvas.width = 900 * pixelRatio;
    canvas.height = 690 * pixelRatio;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, 900, 690);

    const colors = { NORMAL: "#48cf82", ELEVATED: "#e1c326", OFFLINE: "#778186", DISTRESSED: "#ed4a37", SOS: "#ed4a37" } as const;
    for (const status of ["NORMAL", "ELEVATED", "OFFLINE", "DISTRESSED", "SOS"] as const) {
      context.beginPath();
      for (const band of bands) {
        if (band.id === selectedBand || band.status !== status) continue;
        const offset = virtualBandOffset(band, movementScenario, movementTick);
        context.moveTo(band.dotPositionX + offset.x + (band.sos ? 3.2 : 2.1), band.dotPositionY + offset.y);
        context.arc(band.dotPositionX + offset.x, band.dotPositionY + offset.y, band.sos ? 3.2 : 2.1, 0, Math.PI * 2);
      }
      context.fillStyle = colors[status];
      context.fill();
      context.strokeStyle = "rgba(5,16,18,.8)";
      context.lineWidth = 0.8;
      context.stroke();
    }

    const selected = bands.find((band) => band.id === selectedBand);
    if (selected) {
      const offset = virtualBandOffset(selected, movementScenario, movementTick);
      context.beginPath();
      context.arc(selected.dotPositionX + offset.x, selected.dotPositionY + offset.y, 4.2, 0, Math.PI * 2);
      context.fillStyle = colors[selected.status];
      context.fill();
      context.strokeStyle = "#ffffff";
      context.lineWidth = 1.5;
      context.stroke();
    }
  }, [bands, movementScenario, movementTick, selectedBand]);

  const selectNearestBand = (event: MouseEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) * (900 / bounds.width);
    const y = (event.clientY - bounds.top) * (690 / bounds.height);
    let nearest: TwinMapBand | undefined;
    let nearestDistance = 7 * 7;
    for (const band of bands) {
      const offset = virtualBandOffset(band, movementScenario, movementTick);
      const distance = (band.dotPositionX + offset.x - x) ** 2 + (band.dotPositionY + offset.y - y) ** 2;
      if (distance < nearestDistance) {
        nearest = band;
        nearestDistance = distance;
      }
    }
    if (nearest) onSelectBand(nearest.id);
  };

  return <foreignObject x="0" y="0" width="900" height="690" className="band-map-canvas-layer">
    <canvas ref={canvasRef} onClick={selectNearestBand} aria-label={`${bands.length} interactive safety bands visible`} />
  </foreignObject>;
}

export function StadiumTwin({ zones, selectedZone, onSelect, zoom, bands, selectedBand, onSelectBand, showHeatmap, showGates, showCameras, movementScenario, movementTick = 0, movementRunning = false }: {
  zones: Zone[];
  selectedZone: string;
  onSelect: (id: string) => void;
  zoom: number;
  bands: TwinMapBand[];
  selectedBand: number | null;
  onSelectBand: (id: number) => void;
  showHeatmap: boolean;
  showGates: boolean;
  showCameras: boolean;
  movementScenario?: string;
  movementTick?: number;
  movementRunning?: boolean;
}) {
  const sectionTicks = useMemo(() => Array.from({ length: 52 }, (_, index) => index * (360 / 52)), []);
  const [selectedStation, setSelectedStation] = useState<ReplacementStation | null>(null);
  const [replacementQueuedFor, setReplacementQueuedFor] = useState<string | null>(null);
  const selectedStationPoint = selectedStation ? stagePoint(400, selectedStation.angle) : null;
  return <div className="stadium-stage" style={{ "--stadium-zoom": zoom } as CSSProperties}>
    <svg viewBox="0 0 900 690" role="img" aria-label="Interactive cricket stadium digital twin risk heatmap">
      <defs>
        <radialGradient id="turf" cx="50%" cy="43%" r="64%"><stop offset="0%" stopColor="#78a85c" /><stop offset="65%" stopColor="#628f4d" /><stop offset="100%" stopColor="#4f7942" /></radialGradient>
        <linearGradient id="outerBowl" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#73b3c6" /><stop offset="1" stopColor="#4d8ea5" /></linearGradient>
        <filter id="stadiumShadow"><feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="#000" floodOpacity=".55" /></filter>
      </defs>
      <g className="stadium-geometry" filter="url(#stadiumShadow)">
        <ellipse cx="450" cy="330" rx="345" ry="267" className="outer-bowl" />
        {sectionTicks.map((angle) => { const outside = polar(450, 330, 343, angle); const inside = polar(450, 330, 250, angle); return <line key={angle} x1={inside.x} y1={inside.y} x2={outside.x} y2={outside.y} className="section-line" />; })}
        <ellipse cx="450" cy="330" rx="248" ry="192" className="concourse-ring" />
        <g transform="translate(0 75.9) scale(1 .77)">
          {visualSectors.map((sector) => {
            const zone = zones.find((item) => item.id === sector.zoneId) ?? zones[0];
            return <BowlSector key={sector.id} sector={sector} zone={zone} selected={selectedZone === sector.zoneId} heatmapVisible={showHeatmap} onSelect={onSelect} />;
          })}
          {Array.from({ length: 8 }, (_, index) => {
            const start = 128 + index * 13;
            const end = start + 13;
            return <path key={`service-${index}`} d={arcPath(450, 330, 246, 292, start, end, 0.25)} className="service-wedge" />;
          })}
          {Array.from({ length: 8 }, (_, index) => {
            const start = 128 + index * 13;
            const end = start + 13;
            const mid = (start + end) / 2;
            const label = polar(450, 330, 316, mid);
            return <g key={`bay-${index}`}>
              <path d={arcPath(450, 330, 292, 343, start, end, 0.25)} className={`bay-wedge bay-${index % 3}`} />
              <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle" transform={`rotate(${mid}, ${label.x}, ${label.y})`} className="bay-label">BAY {index + 1}</text>
            </g>;
          })}
          <g className="premium-tiers">
            <path d={arcPath(450, 330, 343, 382, 128, 232, 0.2)} className="premium-tier tier-gallery" />
            <path d={arcPath(450, 330, 382, 426, 128, 232, 0.2)} className="premium-tier tier-fourth" />
            <path d={arcPath(450, 330, 426, 472, 128, 232, 0.2)} className="premium-tier tier-fifth" />
            {[382, 426].map((radius) => <path key={radius} d={arcPath(450, 330, radius - 0.5, radius + 0.5, 128, 232, 0)} className="premium-tier-divider" />)}
          </g>
          <BandMapCanvas bands={bands} selectedBand={selectedBand} onSelectBand={onSelectBand} movementScenario={movementScenario} movementTick={movementTick} />
          <VirtualCrowdFlow scenario={movementScenario} running={movementRunning} />
        </g>
        <ellipse cx="450" cy="330" rx="181" ry="140" fill="url(#turf)" className="field" />
        <ellipse cx="450" cy="330" rx="154" ry="117" className="field-ring" />
        <path d="M450 230 L500 282 L482 282 L526 335 L488 335 L546 407 L450 382 L354 407 L412 335 L374 335 L418 282 L400 282 Z" className="neutral-field-mark" />
        <rect x="440" y="289" width="20" height="82" rx="1" className="pitch" /><line x1="437" y1="299" x2="463" y2="299" className="crease" /><line x1="437" y1="361" x2="463" y2="361" className="crease" />
        {[[450,205,"N"],[560,235,"NE"],[620,334,"E"],[555,432,"SE"],[450,467,"S"],[342,432,"SW"],[280,334,"W"],[340,235,"NW"]].map(([x,y,label]) => <text key={String(label)} x={x} y={y} className="direction">{label}</text>)}
        <g className="premium-tier-labels">
          <text x="450" y="614" className="premium-label gallery-label">PRESIDENT GALLERY</text>
          <text x="450" y="649" className="premium-label">PRESIDENTIAL SUITES 4TH FLOOR</text>
          <text x="450" y="681" className="premium-label">PREMIUM SUITES 5TH FLOOR</text>
        </g>
        {showGates ? [
          { ...stagePoint(350, 223), text: "G1", className: "gate-green" },
          { ...stagePoint(367, 202), text: "G3", className: "" },
          { ...stagePoint(367, 158), text: "G6", className: "" },
          { ...stagePoint(350, 137), text: "G8", className: "gate-red" },
        ].map(({ x, y, text, className }) => <g key={text} className="gate-marker"><rect x={x - 15} y={y - 12} width="30" height="24" className={`gate ${className}`} /><text x={x} y={y + 5} className="gate-label">{text}</text></g>) : null}
        {showGates ? replacementStations.map((station) => {
          const point = stagePoint(400, station.angle);
          return <foreignObject key={station.gate} x={point.x - 61} y={point.y - 23} width="122" height="46" className="replacement-station-object">
            <button type="button" className={selectedStation?.gate === station.gate ? "active" : ""} onClick={() => { setSelectedStation(station); setReplacementQueuedFor(null); }} aria-label={`Open ${station.gate} band replacement station`}>
              <BatteryCharging size={15} /><span><b>{station.gate} Replacement</b><small>{station.readyBands} bands ready</small></span>
            </button>
          </foreignObject>;
        }) : null}
        {selectedStation && selectedStationPoint ? <foreignObject
          x={Math.max(8, Math.min(692, selectedStationPoint.x - 100))}
          y={selectedStationPoint.y - 132}
          width="200"
          height="108"
          className="replacement-station-panel-object"
        >
          <section className="replacement-station-panel">
            <header><span>Band Replacement Station</span><button type="button" onClick={() => setSelectedStation(null)} aria-label="Close replacement station">×</button></header>
            <strong><i /> {selectedStation.gate} Operational</strong>
            <div><span><b>{selectedStation.readyBands}</b> Ready bands</span><span><b>{selectedStation.chargingSlots}</b> Charging slots</span><span><b>{selectedStation.technicians}</b> Technicians</span></div>
            <button type="button" className="replacement-queue-button" onClick={() => setReplacementQueuedFor(selectedStation.gate)}>{replacementQueuedFor === selectedStation.gate ? "Replacement desk notified" : "Queue band replacement"}</button>
          </section>
        </foreignObject> : null}
        {showCameras ? [
          { ...stagePoint(332, 286), text: "C1" }, { ...stagePoint(270, 318), text: "C2" },
          { ...stagePoint(270, 42), text: "C3" }, { ...stagePoint(332, 74), text: "C4" },
          { ...stagePoint(232, 112), text: "C5" }, { ...stagePoint(232, 248), text: "C6" },
        ].map(({ x, y, text }) => <g key={text} className="camera-marker"><rect x={x - 7} y={y - 7} width="14" height="14" transform={`rotate(45 ${x} ${y})`} /><circle cx={x} cy={y} r="2.2" /><text x={x + 10} y={y + 3}>{text}</text></g>) : null}
      </g>
    </svg>
  </div>;
}

function AlertPanel() {
  const [activeTab, setActiveTab] = useState<"all" | AlertTone>("all");
  const visible = activeTab === "all" ? alertGroups : alertGroups.filter((group) => group.tone === activeTab);
  return <section className="alerts-panel" id="alerts"><h2>Active Alerts</h2>
    <div className="alert-tabs">
      <button className={activeTab === "all" ? "active" : ""} onClick={() => setActiveTab("all")}>All <b>12</b></button>
      <button className={activeTab === "human" ? "active" : ""} onClick={() => setActiveTab("human")}>Human Risk <b className="red-badge">4</b></button>
      <button className={activeTab === "crowd" ? "active" : ""} onClick={() => setActiveTab("crowd")}>Crowd Risk <b className="orange-badge">5</b></button>
      <button className={activeTab === "integrity" ? "active" : ""} onClick={() => setActiveTab("integrity")}>Pop. Integrity <b className="yellow-badge">3</b></button>
    </div>
    <div className="alert-groups">{visible.map((group) => <article key={group.title} className={`alert-group ${group.tone}`}><header><strong>{group.title}</strong><span>{group.count} Alerts</span></header><div>{group.rows.map(([time,message,severity]) => <p key={`${time}-${message}`}><time>{time}</time><span>{message}</span><b className={severity.toLowerCase()}>{severity}</b></p>)}</div></article>)}</div>
    <Link href="/alerts" className="feed-button"><ListFilter size={18} /> View Alert Feed</Link>
  </section>;
}

function KeyMetrics({ zones, selectedZone }: { zones: Zone[]; selectedZone: Zone }) {
  const atRisk = zones.filter((zone) => Math.max(zone.crowdRisk, zone.integrityRisk) >= 60).length;
  const metrics = [
    ["Average Density","0.68","per m²","High",Users], ["Peak Density","1.92","per m²","Severe",Activity],
    ["Congestion Zones",String(Math.max(7, atRisk)),"","Active",null], ["Gates At Risk","2","","High",null],
    ["Medical Cases",String(Math.max(1, selectedZone.humanAlerts)),"","Active",HeartPulse],
  ] as const;
  return <section className="metrics-panel" id="metrics"><h2>Key Metrics</h2><div className="metric-cards">{metrics.map(([label,value,unit,state,Icon]) => <article key={label}><span>{label}</span><div>{Icon ? <Icon size={25} /> : null}<strong>{value}</strong></div><small>{unit || "\u00a0"}</small><b className={state.toLowerCase()}>{state}</b></article>)}</div><footer><span>Data Source: Multi-sensor Fusion</span><span>System ID: MGHSIS-GT-CC-01</span><span>Operator: Command Operator 1</span><b>Connected</b></footer></section>;
}

function EventTimeline() {
  const [tab, setTab] = useState<"ALL" | "ALERT" | "ACTION" | "SYSTEM">("ALL");
  const visible = tab === "ALL" ? timelineRows : timelineRows.filter((row) => row[2] === tab);
  return <section className="timeline-panel" id="timeline"><h2>Event Timeline</h2><div className="timeline-tabs">{(["ALL","ALERT","ACTION","SYSTEM"] as const).map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item === "ALERT" ? <Siren size={11} /> : item === "ACTION" ? <Radio size={11} /> : null}{item}{item === "ALERT" || item === "ACTION" ? "S" : ""}</button>)}</div><div className="timeline-list">{visible.map(([time,message,type]) => <p key={`${time}-${message}`}><time>{time}</time><span>{message}</span><b className={type.toLowerCase()}>{type}</b></p>)}</div><Link href="/replay" className="timeline-full">View Full Timeline <span>›</span></Link></section>;
}

function ScenarioPanel({ scenario, onScenario }: { scenario: Scenario; onScenario: (scenario: Scenario) => void }) {
  return <section className="scenario-panel" id="scenarios"><h2>Scenario Controls</h2><div className="scenario-grid">{scenarioControls.map(({id,label,icon:Icon,tone}) => <button key={id} className={`${tone} ${scenario === id ? "active" : ""}`} onClick={() => onScenario(id)}><Icon size={31} /><span>{label}</span></button>)}</div><p>{scenarioNotes[scenario]} All actions require authorization.</p></section>;
}

export function CommandCenterDashboard() {
  const { scenario, activateScenario } = useDemoOperations();
  const isBrowser = useSyncExternalStore(subscribeToBrowser, () => true, () => false);
  const mapBands = useMemo(() => isBrowser ? getTwinMapBands() : [], [isBrowser]);
  const [selectedZone, setSelectedZone] = useState("G");
  const [zoom, setZoom] = useState(1);
  const [selectedBandId, setSelectedBandId] = useState<number | null>(null);
  const { zones } = getDigitalTwinSnapshot(scenario);
  const selected = zones.find((zone) => zone.id === selectedZone) ?? zones[0];
  const capacity = scenario === "normal" ? 62 : scenario === "congestion" ? 67 : 64;
  return <main className="command-center"><OperationsHeader section="Command Centre" /><CommandHeader scenario={scenario} /><div className="operations-grid">
    <section className="twin-workspace" id="digital-twin"><StatusOverlay capacity={capacity} scenario={scenario} /><MapTools zoom={zoom} setZoom={setZoom} /><RiskLegend />
      <StadiumTwin zones={zones} selectedZone={selected.id} onSelect={(zone) => { setSelectedZone(zone); setSelectedBandId(null); }} zoom={zoom} bands={mapBands} selectedBand={selectedBandId} onSelectBand={(bandId) => { const band = mapBands.find((item) => item.id === bandId); setSelectedBandId(bandId); if (band) setSelectedZone(band.zone); }} showHeatmap showGates showCameras />
    </section>
    <AlertPanel /><KeyMetrics zones={zones} selectedZone={selected} /><EventTimeline /><ScenarioPanel scenario={scenario} onScenario={activateScenario} />
  </div></main>;
}
