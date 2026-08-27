import { NextResponse } from "next/server";
import { getBandRegistryCatalog, summarizeBands } from "@/lib/bands";

export const dynamic = "force-dynamic";

function parameter(url: URL, key: string, fallback = "ALL") {
  return (url.searchParams.get(key) ?? fallback).toUpperCase();
}

function integerParameter(url: URL, key: string, fallback: number) {
  const value = Number(url.searchParams.get(key) ?? fallback);
  return Number.isFinite(value) ? Math.floor(value) : fallback;
}

export function GET(request: Request) {
  const url = new URL(request.url);
  const catalog = getBandRegistryCatalog();
  const query = (url.searchParams.get("query") ?? "").trim().toLowerCase();
  const zone = parameter(url, "zone");
  const status = parameter(url, "status");
  const risk = parameter(url, "risk");
  const connectivity = parameter(url, "connectivity");
  const motion = parameter(url, "motion");
  const battery = parameter(url, "battery");
  const flag = parameter(url, "flag");
  const sort = parameter(url, "sort", "RISK_DESC");
  const pageSize = Math.min(200, Math.max(25, integerParameter(url, "pageSize", 100)));
  const requestedPage = Math.max(1, integerParameter(url, "page", 1));

  const filtered = catalog.filter((band) => {
    if (query && !band.code.toLowerCase().includes(query) && !String(band.id).includes(query)) return false;
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

  filtered.sort((a, b) => {
    if (sort === "ID_ASC") return a.id - b.id;
    if (sort === "BATTERY_ASC") return a.battery - b.battery || a.id - b.id;
    if (sort === "LAST_SEEN") return b.lastSeen.localeCompare(a.lastSeen) || a.id - b.id;
    return b.riskScore - a.riskScore || a.id - b.id;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const start = (page - 1) * pageSize;

  return NextResponse.json({
    total: catalog.length,
    filteredCount: filtered.length,
    page,
    pageSize,
    totalPages,
    summary: summarizeBands(catalog),
    bands: filtered.slice(start, start + pageSize),
  });
}
