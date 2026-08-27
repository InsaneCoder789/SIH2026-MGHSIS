"use client";

import Link from "next/link";
import { BatteryLow, ChevronLeft, ChevronRight, RefreshCw, Search, SlidersHorizontal, WifiOff } from "lucide-react";
import { useDeferredValue, useEffect, useState } from "react";
import { BAND_ZONES, type BandConnectivity, type BandPopulationSummary, type BandRegistryRecord, type BandStatus } from "@/lib/bands";
import type { HumanRiskLevel } from "@/lib/human-risk";

type RegistryResponse = {
  total: number;
  filteredCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: BandPopulationSummary;
  bands: BandRegistryRecord[];
};

const PAGE_SIZE = 100;

export function BandRegistry({ total }: { total: number }) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());
  const [zone, setZone] = useState("ALL");
  const [status, setStatus] = useState<"ALL" | BandStatus>("ALL");
  const [risk, setRisk] = useState<"ALL" | HumanRiskLevel>("ALL");
  const [connectivity, setConnectivity] = useState<"ALL" | BandConnectivity>("ALL");
  const [flag, setFlag] = useState<"ALL" | "SOS" | "FALL" | "LOW_BATTERY">("ALL");
  const [motion, setMotion] = useState<"ALL" | BandRegistryRecord["motionState"]>("ALL");
  const [battery, setBattery] = useState<"ALL" | "BELOW_20" | "20_50" | "ABOVE_50">("ALL");
  const [sort, setSort] = useState<"RISK_DESC" | "ID_ASC" | "BATTERY_ASC" | "LAST_SEEN">("RISK_DESC");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<RegistryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const parameters = new URLSearchParams({
      query: deferredQuery,
      zone,
      status,
      risk,
      connectivity,
      flag,
      motion,
      battery,
      sort,
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    queueMicrotask(() => {
      if (!controller.signal.aborted) { setLoading(true); setError(""); }
    });
    fetch(`/api/bands?${parameters}`, { signal: controller.signal, cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Band registry request failed")))
      .then((payload: RegistryResponse) => {
        setData(payload);
        if (payload.page !== page) setPage(payload.page);
      })
      .catch((requestError: Error) => {
        if (requestError.name !== "AbortError") setError("The band catalogue could not be loaded. Retry the request.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [battery, connectivity, deferredQuery, flag, motion, page, retryKey, risk, sort, status, zone]);

  const resetPage = () => setPage(1);
  const summary = data?.summary ?? { total, active: 0, distressed: 0, elevated: 0, offline: 0, lowBattery: 0, sos: 0 };
  const start = data && data.filteredCount > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
  const end = data ? Math.min(data.page * data.pageSize, data.filteredCount) : 0;

  return <>
    <section className="registry-summary">
      {[
        ["Total Bands", summary.total, "neutral"], ["Active", summary.active, "green"], ["Distressed", summary.distressed, "red"],
        ["Offline", summary.offline, "gray"], ["Low Battery", summary.lowBattery, "orange"], ["SOS Active", summary.sos, "red"],
      ].map(([label, value, tone]) => <article key={String(label)} className={String(tone)}><span>{label}</span><strong>{Number(value).toLocaleString()}</strong><small>Current event</small></article>)}
    </section>

    <section className="registry-controls">
      <label className="registry-search"><Search size={16} /><input value={query} onChange={(event) => { setQuery(event.target.value); resetPage(); }} placeholder="Search band ID or code" /></label>
      <label><span>Zone</span><select value={zone} onChange={(event) => { setZone(event.target.value); resetPage(); }}><option>ALL</option>{BAND_ZONES.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Status</span><select value={status} onChange={(event) => { setStatus(event.target.value as typeof status); resetPage(); }}>{["ALL","NORMAL","ELEVATED","DISTRESSED","OFFLINE","SOS"].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Risk</span><select value={risk} onChange={(event) => { setRisk(event.target.value as typeof risk); resetPage(); }}>{["ALL","LOW","MODERATE","HIGH","CRITICAL"].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Connectivity</span><select value={connectivity} onChange={(event) => { setConnectivity(event.target.value as typeof connectivity); resetPage(); }}>{["ALL","ONLINE","DEGRADED","OFFLINE"].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Motion</span><select value={motion} onChange={(event) => { setMotion(event.target.value as typeof motion); resetPage(); }}>{["ALL","ACTIVE","WALKING","STATIONARY","IMMOBILE"].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Battery</span><select value={battery} onChange={(event) => { setBattery(event.target.value as typeof battery); resetPage(); }}><option value="ALL">All levels</option><option value="BELOW_20">Below 20%</option><option value="20_50">20% to 50%</option><option value="ABOVE_50">Above 50%</option></select></label>
      <label><span>Condition</span><select value={flag} onChange={(event) => { setFlag(event.target.value as typeof flag); resetPage(); }}>{["ALL","SOS","FALL","LOW_BATTERY"].map((item) => <option key={item}>{item.replace("_", " ")}</option>)}</select></label>
      <label><span>Sort</span><select value={sort} onChange={(event) => { setSort(event.target.value as typeof sort); resetPage(); }}><option value="RISK_DESC">Risk: high first</option><option value="ID_ASC">Band ID</option><option value="BATTERY_ASC">Battery: low first</option><option value="LAST_SEEN">Last seen</option></select></label>
    </section>

    <section className="registry-table-panel" aria-busy={loading}>
      <header><div><SlidersHorizontal size={15} /><strong>{(data?.filteredCount ?? total).toLocaleString()} bands</strong><span>matching current filters</span></div><span>{loading ? "Refreshing live catalogue" : `Rows ${start.toLocaleString()}-${end.toLocaleString()}`}</span></header>
      <div className="registry-table-scroll">
        <table className="registry-table">
          <thead><tr><th>Band</th><th>Zone</th><th>Status</th><th>Risk</th><th>HR</th><th>SpO2</th><th>Motion</th><th>Battery</th><th>Signal</th><th>Connectivity</th><th>Last Seen</th><th /></tr></thead>
          <tbody>{data?.bands.map((band) => <tr key={band.id}>
            <td><Link href={`/bands/${band.id}`}><i className={`band-state ${band.status.toLowerCase()}`} /><strong>{band.code}</strong><span>#{band.id}</span></Link></td>
            <td><b className="zone-code">{band.zone} / S{band.segment}</b></td><td><span className={`status-tag ${band.status.toLowerCase()}`}>{band.status}</span></td>
            <td><div className="risk-cell"><strong>{band.riskScore}</strong><span className={band.riskLevel.toLowerCase()}>{band.riskLevel}</span></div></td>
            <td>{band.hr} <small>bpm</small></td><td>{band.spo2}<small>%</small></td><td>{band.motionState}</td>
            <td><span className={band.battery <= 20 ? "battery-low" : ""}>{band.battery <= 20 ? <BatteryLow size={13} /> : null}{band.battery}%</span></td>
            <td>{Math.round(band.signalQuality * 100)}%</td><td><span className={`connectivity ${band.connectivity.toLowerCase()}`}>{band.connectivity === "OFFLINE" ? <WifiOff size={12} /> : null}{band.connectivity}</span></td>
            <td><time>{band.lastSeen.slice(11,19)}</time></td><td><Link href={`/bands/${band.id}`} className="row-open">Open</Link></td>
          </tr>)}</tbody>
        </table>
        {loading ? <div className="registry-loading"><RefreshCw size={18} /><span>Loading requested band page</span></div> : null}
      </div>
      {error ? <div className="registry-empty"><RefreshCw size={22} /><strong>Registry temporarily unavailable</strong><span>{error}</span><button onClick={() => setRetryKey((value) => value + 1)}>Retry</button></div> : null}
      {!loading && !error && data?.filteredCount === 0 ? <div className="registry-empty"><Search size={22} /><strong>No bands match these filters</strong><span>Clear or broaden the filter set.</span></div> : null}
      <footer><span>Showing {start.toLocaleString()}-{end.toLocaleString()} of {(data?.filteredCount ?? 0).toLocaleString()}</span><div><button disabled={!data || data.page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={14} />Previous</button><strong>Page {data?.page ?? page} / {data?.totalPages ?? 1}</strong><button disabled={!data || data.page >= data.totalPages || loading} onClick={() => setPage((value) => value + 1)}>Next<ChevronRight size={14} /></button></div><strong>{total.toLocaleString()} total event devices</strong></footer>
    </section>
  </>;
}
