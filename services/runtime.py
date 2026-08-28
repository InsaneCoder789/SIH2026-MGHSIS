from __future__ import annotations

import asyncio
import math
import time
from datetime import datetime, timezone
from typing import Iterable

import httpx

ZONE_CAPACITIES = {
    "M": 4280, "N": 5020, "P": 4520, "Q": 4640, "R": 4280, "J": 3810,
    "K": 4050, "L": 3210, "C": 1900, "D": 2020, "E": 1550, "F": 1670,
    "G": 1960, "H": 1790, "B": 1900, "SPW": 1090, "SPC": 1170, "SPE": 1140,
}
TOTAL_CAPACITY = sum(ZONE_CAPACITIES.values())


def allocate_population(total: int) -> dict[str, int]:
    if total < 1 or total > TOTAL_CAPACITY:
        raise ValueError(f"population must be between 1 and {TOTAL_CAPACITY}")
    raw = {zone: total * capacity / TOTAL_CAPACITY for zone, capacity in ZONE_CAPACITIES.items()}
    allocation = {zone: int(value) for zone, value in raw.items()}
    remainder = total - sum(allocation.values())
    for zone in sorted(raw, key=lambda item: raw[item] - allocation[item], reverse=True)[:remainder]:
        allocation[zone] += 1
    return allocation


def sequence_base() -> int:
    return int(time.time() * 1_000)


def captured_at() -> str:
    return datetime.now(timezone.utc).isoformat()


async def publish_observations(api_base: str, observations: Iterable[dict[str, object]]) -> None:
    async with httpx.AsyncClient(base_url=api_base.rstrip("/"), timeout=5.0) as client:
        responses = await asyncio.gather(
            *(client.post("/api/v1/hardware/observations", json=observation) for observation in observations),
        )
    failures = [response for response in responses if response.status_code != 202]
    if failures:
        details = "; ".join(f"{response.status_code}: {response.text[:120]}" for response in failures[:3])
        raise RuntimeError(f"hardware ingestion rejected {len(failures)} observation(s): {details}")


def zone_wave(zone: str, tick: int, amplitude: float = 0.025) -> float:
    phase = tick * 0.41 + sum(ord(character) for character in zone) * 0.07
    return math.sin(phase) * amplitude
