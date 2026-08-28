from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from runtime import allocate_population, captured_at, publish_observations, sequence_base, zone_wave

MODE_COUNTS = {"demo": 100, "medium": 1_000, "large": 10_000, "stress": 50_000}


def observations(mode: str, tick: int, sequence: int) -> list[dict[str, object]]:
    allocation = allocate_population(MODE_COUNTS[mode])
    records = []
    for zone, assigned in allocation.items():
        active = max(0, round(assigned * (0.94 + zone_wave(zone, tick))))
        records.append({
            "source_id": f"band-gateway-{zone}", "source_type": "BLE_GATEWAY",
            "event_id": "demo", "zone_id": zone, "captured_at": captured_at(),
            "sequence": sequence,
            "payload": {
                "registered_bands": assigned,
                "active_bands": active,
                "distressed_bands": max(0, round(active * (0.005 + max(0, zone_wave(zone, tick, 0.003))))),
                "average_battery": round(76 - (tick % 120) * 0.05, 2),
                "signal_quality": round(0.94 + zone_wave(zone, tick, 0.025), 3),
            },
        })
    return records


async def run(args: argparse.Namespace) -> None:
    base = sequence_base()
    tick = 0
    while args.ticks == 0 or tick < args.ticks:
        await publish_observations(args.api, observations(args.mode, tick, base + tick))
        tick += 1
        if args.ticks == 0 or tick < args.ticks:
            await asyncio.sleep(args.interval)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Publish deterministic Smart Safety Band fleet telemetry")
    parser.add_argument("--api", default="http://127.0.0.1:8000")
    parser.add_argument("--mode", choices=MODE_COUNTS, default="large")
    parser.add_argument("--interval", type=float, default=2.0)
    parser.add_argument("--ticks", type=int, default=0, help="0 runs continuously")
    asyncio.run(run(parser.parse_args()))
