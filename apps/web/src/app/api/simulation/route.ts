import { NextResponse } from "next/server";

const API_BASE_URL = process.env.MGHSIS_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

async function proxy(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}/api/v1/simulation${path}`, { ...init, cache: "no-store", signal: AbortSignal.timeout(5_000) });
  const payload = await response.json();
  return NextResponse.json(payload, { status: response.status });
}

export async function GET() {
  try {
    return await proxy("/state");
  } catch (error) {
    return NextResponse.json({ connected: false, message: error instanceof Error ? error.message : "Simulation API unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { command?: string; scenario?: string; action?: string; zone_id?: string };
    const path = body.command === "start" ? "/start" : body.command === "pause" ? "/pause" : body.command === "reset" ? "/reset" : body.command === "scenario" ? "/scenario" : "/action";
    const payload = path === "/scenario" ? { scenario: body.scenario } : path === "/action" ? { action: body.action, zone_id: body.zone_id } : undefined;
    return await proxy(path, payload ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) } : { method: "POST" });
  } catch (error) {
    return NextResponse.json({ connected: false, message: error instanceof Error ? error.message : "Simulation API unavailable" }, { status: 503 });
  }
}
