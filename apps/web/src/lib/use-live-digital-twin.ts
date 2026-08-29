"use client";

import { useEffect, useMemo, useState } from "react";
import { aggregateZones, getDigitalTwinSnapshot, type Scenario } from "@/lib/mghsis-demo";

const LIVE_UPDATE_INTERVAL_MS = 2_000;
type RemoteTwinState = {
  scenario: Scenario;
  zones: Array<{
    observation: { inflow_per_min: number; outflow_per_min: number };
    prediction: { zone_id: string };
    fusion: { expected_population: number; authenticated_population: number; observed_population: number; cctv_confidence: number; gateway_health: number };
    risk_engines: { human: { score: number }; crowd: { score: number }; integrity: { score: number } };
  }>;
};

export function useLiveDigitalTwin(scenario: Scenario) {
  const [liveTick, setLiveTick] = useState(0);
  const [remote, setRemote] = useState<RemoteTwinState | null>(null);

  useEffect(() => {
    const refresh = () => {
      setLiveTick((tick) => tick + 1);
      fetch("/api/simulation", { cache: "no-store" })
        .then((response) => response.ok ? response.json() : Promise.reject())
        .then((payload: RemoteTwinState) => setRemote(payload))
        .catch(() => setRemote(null));
    };
    refresh();
    const timer = window.setInterval(refresh, LIVE_UPDATE_INTERVAL_MS);
    const websocketBase = process.env.NEXT_PUBLIC_WS_BASE_URL;
    let socket: WebSocket | undefined;

    if (websocketBase) {
      socket = new WebSocket(`${websocketBase.replace(/\/$/, "")}/api/v1/ws/events`);
      socket.onmessage = refresh;
    }

    return () => {
      window.clearInterval(timer);
      socket?.close();
    };
  }, [scenario]);

  return useMemo(() => {
    const fallback = getDigitalTwinSnapshot(scenario, liveTick);
    if (!remote || remote.scenario !== scenario) return fallback;
    const zones = fallback.zones.map((zone) => {
      const live = remote.zones.find((item) => item.prediction.zone_id === zone.id);
      return live ? {
        ...zone,
        expected: live.fusion.expected_population,
        authenticated: live.fusion.authenticated_population,
        observed: live.fusion.observed_population,
        crowdRisk: live.risk_engines.crowd.score,
        integrityRisk: live.risk_engines.integrity.score,
        humanAlerts: live.risk_engines.human.score >= 55 ? Math.max(1, zone.humanAlerts) : 0,
        inflow: live.observation.inflow_per_min,
        outflow: live.observation.outflow_per_min,
        cctvConfidence: live.fusion.cctv_confidence,
        gatewayHealth: live.fusion.gateway_health,
      } : zone;
    });
    return { ...fallback, zones, totals: aggregateZones(zones) };
  }, [liveTick, remote, scenario]);
}
