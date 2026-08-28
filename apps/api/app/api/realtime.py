from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from redis.asyncio import Redis
from redis.exceptions import RedisError

from app.core.config import settings

router = APIRouter(tags=["realtime-events"])


@router.websocket("/api/v1/ws/events")
async def event_stream(websocket: WebSocket) -> None:
    await websocket.accept()
    client = Redis.from_url(settings.redis_url, decode_responses=True)
    pubsub = client.pubsub()
    channels = [f"{settings.redis_prefix}:events:hardware", f"{settings.redis_prefix}:events:simulation"]
    try:
        await pubsub.subscribe(*channels)
        await websocket.send_json({"type": "STREAM_READY", "channels": channels})
        heartbeat = 0
        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message and message.get("type") == "message":
                raw = message.get("data")
                try:
                    payload = json.loads(raw) if isinstance(raw, str) else raw
                except json.JSONDecodeError:
                    payload = {"raw": raw}
                await websocket.send_json({"type": "EVENT", "channel": message.get("channel"), "payload": payload})
            heartbeat += 1
            if heartbeat >= 15:
                await websocket.send_json({"type": "HEARTBEAT", "timestamp": datetime.now(timezone.utc).isoformat()})
                heartbeat = 0
            await asyncio.sleep(0.05)
    except (WebSocketDisconnect, RedisError):
        pass
    finally:
        await pubsub.aclose()
        await client.aclose()
