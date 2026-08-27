import { NextResponse } from "next/server";

const API_BASE_URL = process.env.MGHSIS_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/system/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) throw new Error(`Runtime diagnostics returned ${response.status}`);
    return NextResponse.json(await response.json());
  } catch (error) {
    return NextResponse.json({
      status: "OFFLINE",
      ready: false,
      services: [{
        name: "Event API",
        group: "CORE",
        status: "OFFLINE",
        health: 0,
        latency_ms: 0,
        required: true,
        detail: error instanceof Error ? error.message : "Runtime diagnostics unavailable",
      }],
    }, { status: 503 });
  }
}
