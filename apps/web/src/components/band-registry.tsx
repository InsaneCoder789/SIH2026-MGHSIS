"use client";

import Link from "next/link";
import { BatteryLow, Search, SlidersHorizontal, WifiOff } from "lucide-react";
import { useMemo, useState } from "react";
import { BAND_ZONES, summarizeBands, type BandConnectivity, type BandStatus, type SafetyBand } from "@/lib/bands";
import type { HumanRiskLevel } from "@/lib/human-risk";

export function BandRegistry({ bands }: { bands: SafetyBand[] }) {
  const [query, setQuery] = useState("");
  const [zone, setZone] = useState("ALL");
  const [status, setStatus] = useState<"ALL" | BandStatus>("ALL");
  const [risk, setRisk] = useState<"ALL" | HumanRiskLevel>("ALL");
  const [connectivity, setConnectivity] = useState<"ALL" | BandConnectivity>("ALL");
  const [flag, setFlag] = useState<"ALL" | "SOS" | "FALL" | "LOW_BATTERY">("ALL");
  const [motion, setMotion] = useState<"ALL" | SafetyBand["motionState"]>("ALL");
  const [battery, setBattery] = useState<"ALL" | "BELOW_20" | "20_50" | "ABOVE_50">("ALL");
  const [sort, setSort] = useState<"RISK_DESC" | "ID_ASC" | "BATTERY_ASC" | "LAST_SEEN">("RISK_DESC");
  const summary = summarizeBands(bands);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const result = bands.filter((band) => {
      if (normalized && !band.code.toLowerCase().includes(normalized) && !String(band.id).includes(normalized)) return false;
      if (zone !== "ALL" && band.zone !== zone) return false;
      if (status !== "ALL" && band.status !== status) return false;
      if (risk !== "ALL" && band.riskLevel !== risk) return false;
      if (connectivity !== "ALL" && band.connectivity !== connectivity) return false;
      if (motion !== "ALL" && band.motionState !== motion) return false;
      if (battery === "BELOW_20" && band.battery > 20) return false;
      if (battery === "20_50" && (band.battery < 20 || band.battery > 50)) return false;
      if (battery === "ABOVE_50" && band.battery <= 50) return false;
      if (flag === "SOS" && !band.sos) return false;
      if (flag === "FALL" && !band.fallDetected) return false;
      if (flag === "LOW_BATTERY" && band.battery > 20) return false;
      return true;
    });
    return result.toSorted((a, b) => {
      if (sort === "ID_ASC") return a.id - b.id;
      if (sort === "BATTERY_ASC") return a.battery - b.battery;
      if (sort === "LAST_SEEN") return b.lastSeen.localeCompare(a.lastSeen);
      return b.riskScore - a.riskScore || a.id - b.id;
    });
  }, [bands, battery, connectivity, flag, motion, query, risk, sort, status, zone]);

  return <>
    <section className="registry-summary">
      {[
        ["Total Bands", summary.total, "neutral"], ["Active", summary.active, "green"], ["Distressed", summary.distressed, "red"],
        ["Offline", summary.offline, "gray"], ["Low Battery", summary.lowBattery, "orange"], ["SOS Active", summary.sos, "red"],
      ].map(([label, value, tone]) => <article key={String(label)} className={String(tone)}><span>{label}</span><strong>{value}</strong><small>Current event</small></article>)}
    </section>

    <section className="registry-controls">
      <label className="registry-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search band ID or code" /></label>
      <label><span>Zone</span><select value={zone} onChange={(event) => setZone(event.target.value)}><option>ALL</option>{BAND_ZONES.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>{["ALL","NORMAL","ELEVATED","DISTRESSED","OFFLINE","SOS"].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Risk</span><select value={risk} onChange={(event) => setRisk(event.target.value as typeof risk)}>{["ALL","LOW","MODERATE","HIGH","CRITICAL"].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Connectivity</span><select value={connectivity} onChange={(event) => setConnectivity(event.target.value as typeof connectivity)}>{["ALL","ONLINE","DEGRADED","OFFLINE"].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Motion</span><select value={motion} onChange={(event) => setMotion(event.target.value as typeof motion)}>{["ALL","ACTIVE","WALKING","STATIONARY","IMMOBILE"].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Battery</span><select value={battery} onChange={(event) => setBattery(event.target.value as typeof battery)}><option value="ALL">All levels</option><option value="BELOW_20">Below 20%</option><option value="20_50">20% to 50%</option><option value="ABOVE_50">Above 50%</option></select></label>
      <label><span>Condition</span><select value={flag} onChange={(event) => setFlag(event.target.value as typeof flag)}>{["ALL","SOS","FALL","LOW_BATTERY"].map((item) => <option key={item}>{item.replace("_", " ")}</option>)}</select></label>
      <label><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option value="RISK_DESC">Risk: high first</option><option value="ID_ASC">Band ID</option><option value="BATTERY_ASC">Battery: low first</option><option value="LAST_SEEN">Last seen</option></select></label>
    </section>

    <section className="registry-table-panel">
      <header><div><SlidersHorizontal size={15} /><strong>{filtered.length} bands</strong><span>matching current filters</span></div><span>Scroll to inspect the complete result set</span></header>
      <div className="registry-table-scroll">
        <table className="registry-table">
          <thead><tr><th>Band</th><th>Zone</th><th>Status</th><th>Risk</th><th>HR</th><th>SpO2</th><th>Motion</th><th>Battery</th><th>Signal</th><th>Connectivity</th><th>Last Seen</th><th /></tr></thead>
          <tbody>{filtered.map((band) => <tr key={band.id}>
            <td><Link href={`/bands/${band.id}`}><i className={`band-state ${band.status.toLowerCase()}`} /><strong>{band.code}</strong><span>#{band.id}</span></Link></td>
            <td><b className="zone-code">{band.zone} / S{band.segment}</b></td><td><span className={`status-tag ${band.status.toLowerCase()}`}>{band.status}</span></td>
            <td><div className="risk-cell"><strong>{band.riskScore}</strong><span className={band.riskLevel.toLowerCase()}>{band.riskLevel}</span></div></td>
            <td>{band.hr} <small>bpm</small></td><td>{band.spo2}<small>%</small></td><td>{band.motionState}</td>
            <td><span className={band.battery <= 20 ? "battery-low" : ""}>{band.battery <= 20 ? <BatteryLow size={13} /> : null}{band.battery}%</span></td>
            <td>{Math.round(band.signalQuality * 100)}%</td><td><span className={`connectivity ${band.connectivity.toLowerCase()}`}>{band.connectivity === "OFFLINE" ? <WifiOff size={12} /> : null}{band.connectivity}</span></td>
            <td><time>{band.lastSeen.slice(11,19)}</time></td><td><Link href={`/bands/${band.id}`} className="row-open">Open</Link></td>
          </tr>)}</tbody>
        </table>
      </div>
      {filtered.length === 0 ? <div className="registry-empty"><Search size={22} /><strong>No bands match these filters</strong><span>Clear or broaden the filter set.</span></div> : null}
      <footer><span>Showing all {filtered.length.toLocaleString()} matching bands</span><strong>{bands.length.toLocaleString()} total event devices</strong></footer>
    </section>
  </>;
}
