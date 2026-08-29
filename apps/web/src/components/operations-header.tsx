"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity, BarChart3, Bell, Camera, Check, ChevronRight, Clock3, Command,
  FlaskConical, Map, Menu, RadioTower, Search, Settings, ShieldCheck, Siren,
  Watch, Workflow, X, type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDemoOperations } from "@/components/demo-operations-context";

type NavigationItem = { href: string; label: string; shortLabel: string; description: string; icon: LucideIcon };

const navigation: NavigationItem[] = [
  { href: "/", label: "Overview", shortLabel: "Overview", description: "Event operating picture", icon: Command },
  { href: "/command-center", label: "Command Centre", shortLabel: "Command", description: "Live command surface", icon: RadioTower },
  { href: "/digital-twin", label: "Digital Twin", shortLabel: "Twin", description: "Venue and crowd state", icon: Map },
  { href: "/bands", label: "Band Registry", shortLabel: "Bands", description: "Wearable device registry", icon: Watch },
  { href: "/alerts", label: "Alerts", shortLabel: "Alerts", description: "Incident triage queue", icon: Siren },
  { href: "/interventions", label: "Interventions", shortLabel: "Response", description: "Authorize field actions", icon: Workflow },
  { href: "/analytics", label: "Risk Analytics", shortLabel: "Analytics", description: "Risk and response trends", icon: BarChart3 },
  { href: "/cctv", label: "CCTV Monitoring", shortLabel: "CCTV", description: "Camera sensor fusion", icon: Camera },
  { href: "/scenario-lab", label: "Scenario Lab", shortLabel: "Scenarios", description: "Controlled simulations", icon: FlaskConical },
  { href: "/replay", label: "Event Replay", shortLabel: "Replay", description: "Timeline reconstruction", icon: Clock3 },
  { href: "/system-health", label: "System Health", shortLabel: "Health", description: "Infrastructure diagnostics", icon: Activity },
  { href: "/settings", label: "Configuration", shortLabel: "Settings", description: "Thresholds and policy", icon: Settings },
];

function routeIsActive(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname.startsWith(href);
}

export function OperationsHeader({ section }: { section: string }) {
  const { alerts } = useDemoOperations();
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const activeNavRef = useRef<HTMLAnchorElement>(null);
  const [clock, setClock] = useState("--:--:--");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const updateClock = () => setClock(new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "Asia/Kolkata",
    }).format(new Date()));
    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setQuery("");
        setPaletteOpen((value) => !value);
      }
      if (event.key === "Escape") { setPaletteOpen(false); setMobileOpen(false); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!paletteOpen) return;
    window.requestAnimationFrame(() => searchRef.current?.focus());
  }, [paletteOpen]);

  useEffect(() => {
    activeNavRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? navigation.filter((item) => `${item.label} ${item.description}`.toLowerCase().includes(normalized)) : navigation;
  }, [query]);
  const current = navigation.find((item) => routeIsActive(pathname, item.href));
  const activeAlertCount = alerts.filter((alert) => alert.status !== "RESOLVED").length;

  return <>
    <header className="operations-header">
      <div className="operations-topbar">
        <Link href="/" className="operations-brand" aria-label="MGHSIS overview"><span className="brand-mark"><ShieldCheck size={23} /></span><span className="brand-copy"><strong>MGHSIS</strong><small>Venue safety intelligence</small></span></Link>
        <div className="operations-context" aria-label="Current event"><span><i /> Event live</span><strong>GT vs DC · IPL 2025</strong><small>Narendra Modi Stadium</small></div>
        <div className="operations-actions">
          <button className="operations-search" onClick={() => { setQuery(""); setPaletteOpen(true); }} aria-label="Open command palette"><Search size={15} /><span>Find module</span><kbd>⌘ K</kbd></button>
          <Link href="/alerts" className="operations-alert-button" aria-label={`Open ${activeAlertCount} active alerts`}><Bell size={16} /><b>{activeAlertCount}</b></Link>
          <Link href="/system-health" className="operations-health"><i /><span>Systems</span><strong>Nominal</strong></Link>
          <time className="operations-clock">{clock}<small>IST</small></time>
          <button className="operations-menu" onClick={() => setMobileOpen((value) => !value)} aria-label="Toggle navigation" aria-expanded={mobileOpen}>{mobileOpen ? <X size={19} /> : <Menu size={19} />}</button>
        </div>
      </div>
      <div className={`operations-navigation ${mobileOpen ? "open" : ""}`}>
        <div className="current-workspace"><span>Workspace</span><strong>{current?.label ?? section}</strong></div>
        <nav aria-label="Primary operations navigation">{navigation.map(({ href, shortLabel, icon: Icon }) => { const active = routeIsActive(pathname, href); return <Link key={href} ref={active ? activeNavRef : undefined} href={href} onClick={() => setMobileOpen(false)} className={active ? "active" : ""}><Icon size={14} /><span>{shortLabel}</span></Link>; })}</nav>
      </div>
    </header>

    {paletteOpen ? <div className="command-palette-backdrop" role="presentation" onMouseDown={() => setPaletteOpen(false)}><section className="command-palette" role="dialog" aria-modal="true" aria-label="Navigate MGHSIS" onMouseDown={(event) => event.stopPropagation()}>
      <header><Search size={18} /><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && results[0]) router.push(results[0].href); }} placeholder="Search workspaces and tools" aria-label="Search workspaces and tools" /><kbd>ESC</kbd></header>
      <div className="command-results"><span className="command-results-label">{query ? `${results.length} results` : "All workspaces"}</span>{results.map(({ href, label, description, icon: Icon }) => <Link href={href} key={href} onClick={() => setPaletteOpen(false)} className={routeIsActive(pathname, href) ? "active" : ""}><span className="command-icon"><Icon size={17} /></span><div><strong>{label}</strong><small>{description}</small></div>{routeIsActive(pathname, href) ? <Check size={15} /> : <ChevronRight size={15} />}</Link>)}{!results.length ? <div className="command-empty"><Search size={20} /><strong>No matching workspace</strong><span>Try “twin”, “alerts”, or “health”.</span></div> : null}</div>
      <footer><span><kbd>↵</kbd> Open first result</span><span><kbd>Esc</kbd> Close</span><strong><Activity size={12} /> Live operations</strong></footer>
    </section></div> : null}
  </>;
}
