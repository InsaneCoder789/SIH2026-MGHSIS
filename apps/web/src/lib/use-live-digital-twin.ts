"use client";

import { useEffect, useMemo, useState } from "react";
import { getDigitalTwinSnapshot, type Scenario } from "@/lib/mghsis-demo";

const LIVE_UPDATE_INTERVAL_MS = 2_000;

export function useLiveDigitalTwin(scenario: Scenario) {
  const [liveTick, setLiveTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setLiveTick((tick) => tick + 1), LIVE_UPDATE_INTERVAL_MS);
    const websocketBase = process.env.NEXT_PUBLIC_WS_BASE_URL;
    let socket: WebSocket | undefined;

    if (websocketBase) {
      socket = new WebSocket(`${websocketBase.replace(/\/$/, "")}/api/v1/ws/events`);
      socket.onmessage = () => setLiveTick((tick) => tick + 1);
    }

    return () => {
      window.clearInterval(timer);
      socket?.close();
    };
  }, [scenario]);

  return useMemo(() => getDigitalTwinSnapshot(scenario, liveTick), [liveTick, scenario]);
}
