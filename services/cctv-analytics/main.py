from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from runtime import ZONE_CAPACITIES, captured_at, publish_observations, sequence_base, zone_wave


def observations(tick: int, sequence: int) -> list[dict[str, object]]:
    records = []
    for zone, capacity in ZONE_CAPACITIES.items():
        observed = round(capacity * (0.64 + zone_wave(zone, tick, 0.035)))
        records.append({
            "source_id": f"cctv-fusion-{zone}", "source_type": "CCTV", "event_id": "demo",
            "zone_id": zone, "captured_at": captured_at(), "sequence": sequence,
            "payload": {
                "person_count": observed,
                "density_ratio": round(observed / capacity, 4),
                "confidence": round(0.91 + zone_wave(zone, tick, 0.035), 3),
                "average_speed_mps": round(0.86 - max(0, zone_wave(zone, tick, 0.16)), 3),
                "adapter": "SYNTHETIC_FALLBACK",
            },
        })
    return records


async def run(args: argparse.Namespace) -> None:
    base = sequence_base()
    tick = 0
    while args.ticks == 0 or tick < args.ticks:
        await publish_observations(args.api, observations(tick, base + tick))
        tick += 1
        if args.ticks == 0 or tick < args.ticks:
            await asyncio.sleep(args.interval)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Publish replaceable CCTV crowd-observation telemetry")
    parser.add_argument("--api", default="http://127.0.0.1:8000")
    parser.add_argument("--interval", type=float, default=2.5)
    parser.add_argument("--ticks", type=int, default=0, help="0 runs continuously")
    asyncio.run(run(parser.parse_args()))
