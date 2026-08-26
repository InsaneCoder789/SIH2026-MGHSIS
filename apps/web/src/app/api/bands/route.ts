import { NextResponse } from "next/server";
import { DEMO_BANDS } from "@/lib/bands";

export function GET(request: Request) {
  const url = new URL(request.url);
  const zone = url.searchParams.get("zone");
  const status = url.searchParams.get("status");
  const limit = Math.min(300, Math.max(1, Number(url.searchParams.get("limit") ?? 300)));
  const bands = DEMO_BANDS.filter((band) => (!zone || band.zone === zone) && (!status || band.status === status)).slice(0, limit);
  return NextResponse.json({ count: bands.length, bands });
}
