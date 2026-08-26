import { NextResponse } from "next/server";
import { getBandById } from "@/lib/bands";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const band = getBandById(id);
  return band ? NextResponse.json(band) : NextResponse.json({ error: "Band not found" }, { status: 404 });
}
