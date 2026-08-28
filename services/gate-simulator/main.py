from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from runtime import captured_at, publish_observations, sequence_base

GATES = {"G1": "J", "G2": "K", "G3": "M", "G4": "N", "G5": "P", "G6": "Q", "G7": "R", "G8": "H"}


def observations(tick: int, sequence: int, breach: bool) -> list[dict[str, object]]:
    return [{
        "source_id": f"rfid-gate-{gate}", "source_type": "RFID_GATE", "event_id": "demo",
        "zone_id": zone, "captured_at": captured_at(), "sequence": sequence,
        "payload": {
            "gate_id": gate,
            "entries": 18 + (tick + index * 3) % 17,
            "exits": 8 + (tick + index) % 9,
            "duplicate_attempts": int((tick + index) % 23 == 0),
            "restricted_crossings": 80 if breach and gate == "G8" else 0,
        },
    } for index, (gate, zone) in enumerate(GATES.items())]


async def run(args: argparse.Namespace) -> None:
    base = sequence_base()
    tick = 0
    while args.ticks == 0 or tick < args.ticks:
        await publish_observations(args.api, observations(tick, base + tick, args.breach))
        tick += 1
        if args.ticks == 0 or tick < args.ticks:
            await asyncio.sleep(args.interval)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Publish gate entry, exit and integrity telemetry")
    parser.add_argument("--api", default="http://127.0.0.1:8000")
    parser.add_argument("--interval", type=float, default=3.0)
    parser.add_argument("--ticks", type=int, default=0, help="0 runs continuously")
    parser.add_argument("--breach", action="store_true")
    asyncio.run(run(parser.parse_args()))
