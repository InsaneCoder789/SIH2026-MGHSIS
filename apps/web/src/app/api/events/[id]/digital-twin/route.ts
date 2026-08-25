import { NextResponse } from "next/server";
import { demoEvent, getDigitalTwinSnapshot, parseScenario } from "@/lib/mghsis-demo";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  if (id !== demoEvent.id && id !== "demo") {
    return NextResponse.json(
      {
        error: "Event not found",
        accepted_ids: [demoEvent.id, "demo"],
      },
      { status: 404 },
    );
  }

  const url = new URL(request.url);
  const scenario = parseScenario(url.searchParams.get("scenario"));

  return NextResponse.json(getDigitalTwinSnapshot(scenario));
}
