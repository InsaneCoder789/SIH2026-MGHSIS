from __future__ import annotations

import argparse
import asyncio

import httpx


async def run(args: argparse.Namespace) -> None:
    async with httpx.AsyncClient(base_url=args.api.rstrip("/"), timeout=10.0) as client:
        response = await client.post("/api/v1/simulation/scenario", json={"scenario": args.scenario})
        response.raise_for_status()
        state = response.json()
        for _ in range(args.ticks):
            await asyncio.sleep(args.interval)
            tick = await client.get("/api/v1/simulation/state")
            tick.raise_for_status()
            state = tick.json()
        if args.action:
            action = await client.post("/api/v1/simulation/action", json={"action": args.action, "zone_id": args.zone})
            action.raise_for_status()
            state = action.json()
        aggregate = state["aggregate"]
        print(f"scenario={state['scenario']} tick={state['tick']} peak={aggregate['peak_score']} critical={aggregate['critical_zones']}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Drive and inspect a deterministic Digital Twin scenario")
    parser.add_argument("--api", default="http://127.0.0.1:8000")
    parser.add_argument("--scenario", choices=["normal", "distress", "congestion", "breach", "gateway", "redirect"], default="congestion")
    parser.add_argument("--ticks", type=int, default=4)
    parser.add_argument("--interval", type=float, default=0.2)
    parser.add_argument("--action", choices=["RESTRICT_INFLOW", "OPEN_ALTERNATE_ROUTE", "REDIRECT_TO_ZONE", "DISPATCH_MEDICAL"])
    parser.add_argument("--zone", default="G")
    asyncio.run(run(parser.parse_args()))
