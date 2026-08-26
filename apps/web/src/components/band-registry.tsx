"use client";

import Link from "next/link";
import { BatteryLow, ChevronLeft, ChevronRight, Search, SlidersHorizontal, WifiOff } from "lucide-react";
import { useMemo, useState } from "react";
import { BAND_ZONES, summarizeBands, type BandConnectivity, type BandStatus, type SafetyBand } from "@/lib/bands";
import type { HumanRiskLevel } from "@/lib/human-risk";

const pageSize = 24;

export function BandRegistry({ bands }: { bands: SafetyBand[] }) {
  const [query, setQuery] = useState("");
  const [zone, setZone] = useState("ALL");
  const [status, setStatus] = useState<"ALL" | BandStatus>("ALL");
  const [risk, setRisk] = useState<"ALL" | HumanRiskLevel>("ALL");
  const [connectivity, setConnectivity] = useState<"ALL" | BandConnectivity>("ALL");
  const [flag, setFlag] = useState<"ALL" | "SOS" | "FALL" | "LOW_BATTERY">("ALL");
  const [sort, setSort] = useState<"RISK_DESC" | "ID_ASC" | "BATTERY_ASC" | "LAST_SEEN">("RISK_DESC");
  const [page, setPage] = useState(1);
  const summary = summarizeBands(bands);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const result = bands.filter((band) => {
      if (normalized && !band.code.toLowerCase().includes(normalized) && !String(band.id).includes(normalized)) return false;
      if (zone !== "ALL" && band.zone !== zone) return false;
      if (status !== "ALL" && band.status !== status) return false;
      if (risk !== "ALL" && band.riskLevel !== risk) return false;
      if (connectivity !== "ALL" && band.connectivity !== connectivity) return false;
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
  }, [bands, connectivity, flag, query, risk, sort, status, zone]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const update = (setter: (value: never) => void, value: never) => { setter(value); setPage(1); };

  return <>
    <section className="registry-summary">
      {[
        ["Total Bands", summary.total, "neutral"], ["Active", summary.active, "green"], ["Distressed", summary.distressed, "red"],
        ["Offline", summary.offline, "gray"], ["Low Battery", summary.lowBattery, "orange"], ["SOS Active", summary.sos, "red"],
      ].map(([label, value, tone]) => <article key={String(label)} className={String(tone)}><span>{label}</span><strong>{value}</strong><small>Current event</small></article>)}
    </section>

    <section className="registry-controls">
      <label className="registry-search"><Search size={16} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search band ID or code" /></label>
      <label><span>Zone</span><select value={zone} onChange={(event) => update(setZone as (value: never) => void, event.target.value as never)}><option>ALL</option>{BAND_ZONES.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Status</span><select value={status} onChange={(event) => update(setStatus as (value: never) => void, event.target.value as never)}>{["ALL","NORMAL","ELEVATED","DISTRESSED","OFFLINE","SOS"].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Risk</span><select value={risk} onChange={(event) => update(setRisk as (value: never) => void, event.target.value as never)}>{["ALL","LOW","MODERATE","HIGH","CRITICAL"].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Connectivity</span><select value={connectivity} onChange={(event) => update(setConnectivity as (value: never) => void, event.target.value as never)}>{["ALL","ONLINE","DEGRADED","OFFLINE"].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Condition</span><select value={flag} onChange={(event) => update(setFlag as (value: never) => void, event.target.value as never)}>{["ALL","SOS","FALL","LOW_BATTERY"].map((item) => <option key={item}>{item.replace("_", " ")}</option>)}</select></label>
      <label><span>Sort</span><select value={sort} onChange={(event) => update(setSort as (value: never) => void, event.target.value as never)}><option value="RISK_DESC">Risk: high first</option><option value="ID_ASC">Band ID</option><option value="BATTERY_ASC">Battery: low first</option><option value="LAST_SEEN">Last seen</option></select></label>
    </section>

    <section className="registry-table-panel">
      <header><div><SlidersHorizontal size={15} /><strong>{filtered.length} bands</strong><span>matching current filters</span></div><span>Page {currentPage} of {pageCount}</span></header>
      <div className="registry-table-scroll">
        <table className="registry-table">
          <thead><tr><th>Band</th><th>Zone</th><th>Status</th><th>Risk</th><th>HR</th><th>SpO2</th><th>Motion</th><th>Battery</th><th>Signal</th><th>Connectivity</th><th>Last Seen</th><th /></tr></thead>
          <tbody>{visible.map((band) => <tr key={band.id}>
            <td><Link href={`/bands/${band.id}`}><i className={`band-state ${band.status.toLowerCase()}`} /><strong>{band.code}</strong><span>#{band.id}</span></Link></td>
            <td><b className="zone-code">{band.zone}</b></td><td><span className={`status-tag ${band.status.toLowerCase()}`}>{band.status}</span></td>
            <td><div className="risk-cell"><strong>{band.riskScore}</strong><span className={band.riskLevel.toLowerCase()}>{band.riskLevel}</span></div></td>
            <td>{band.hr} <small>bpm</small></td><td>{band.spo2}<small>%</small></td><td>{band.motionState}</td>
            <td><span className={band.battery <= 20 ? "battery-low" : ""}>{band.battery <= 20 ? <BatteryLow size={13} /> : null}{band.battery}%</span></td>
            <td>{Math.round(band.signalQuality * 100)}%</td><td><span className={`connectivity ${band.connectivity.toLowerCase()}`}>{band.connectivity === "OFFLINE" ? <WifiOff size={12} /> : null}{band.connectivity}</span></td>
            <td><time>{band.lastSeen.slice(11,19)}</time></td><td><Link href={`/bands/${band.id}`} className="row-open">Open</Link></td>
          </tr>)}</tbody>
        </table>
      </div>
      {visible.length === 0 ? <div className="registry-empty"><Search size={22} /><strong>No bands match these filters</strong><span>Clear or broaden the filter set.</span></div> : null}
      <footer><span>Showing {visible.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}</span><div><button disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={16} />Previous</button><button disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next<ChevronRight size={16} /></button></div></footer>
    </section>
  </>;
}
