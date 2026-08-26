import { NextResponse } from "next/server";

const API_BASE_URL = process.env.MGHSIS_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function GET() {
  try {
    const [statusResponse, zonesResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/api/v1/ml/crowd-risk/status`, { cache: "no-store", signal: AbortSignal.timeout(1_500) }),
      fetch(`${API_BASE_URL}/api/v1/ml/crowd-risk/demo-zones`, { cache: "no-store", signal: AbortSignal.timeout(1_500) }),
    ]);
    if (!statusResponse.ok || !zonesResponse.ok) throw new Error("Onboard ML API returned a non-success response");
    return NextResponse.json({ connected: true, status: await statusResponse.json(), zones: await zonesResponse.json() });
  } catch (error) {
    return NextResponse.json({
      connected: false,
      status: null,
      zones: [],
      message: error instanceof Error ? error.message : "Onboard ML API unavailable",
      fallback: "Deterministic frontend risk engine remains active.",
    });
  }
}
