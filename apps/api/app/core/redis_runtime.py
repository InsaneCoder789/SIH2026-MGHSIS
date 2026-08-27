from __future__ import annotations

import json
from contextlib import contextmanager
from time import perf_counter
from typing import Any, Iterator

from redis import Redis
from redis.exceptions import RedisError

from app.core.config import settings


class RedisRuntime:
    def __init__(self) -> None:
        self._client: Redis | None = None
        self._available = False
        self._last_error: str | None = None

    @property
    def available(self) -> bool:
        return self._available

    @property
    def last_error(self) -> str | None:
        return self._last_error

    def _get_client(self) -> Redis:
        if self._client is None:
            self._client = Redis.from_url(
                settings.redis_url,
                decode_responses=True,
                socket_connect_timeout=1.0,
                socket_timeout=1.0,
                health_check_interval=15,
            )
        return self._client

    def _mark_success(self) -> None:
        self._available = True
        self._last_error = None

    def _mark_failure(self, error: Exception) -> None:
        self._available = False
        self._last_error = str(error)

    def connect(self) -> bool:
        try:
            self._get_client().ping()
            self._mark_success()
            return True
        except RedisError as error:
            self._mark_failure(error)
            return False

    def close(self) -> None:
        if self._client is not None:
            self._client.close()
        self._client = None
        self._available = False

    def diagnostics(self) -> dict[str, object]:
        started = perf_counter()
        connected = self.connect()
        latency_ms = max(1, round((perf_counter() - started) * 1000))
        details: dict[str, object] = {
            "name": "Redis Shared Runtime",
            "group": "DATA",
            "status": "HEALTHY" if connected else "OFFLINE",
            "health": 100 if connected else 0,
            "latency_ms": latency_ms,
            "required": True,
            "detail": "Shared state, replay protection, cache and event fan-out" if connected else (self.last_error or "Redis is unavailable"),
        }
        if connected:
            try:
                info = self._get_client().info(section="server")
                details["version"] = info.get("redis_version", "unknown")
            except RedisError:
                pass
        return details

    def get_text(self, key: str) -> str | None:
        try:
            value = self._get_client().get(key)
            self._mark_success()
            return value
        except RedisError as error:
            self._mark_failure(error)
            return None

    def set_text(self, key: str, value: str, ttl_seconds: int | None = None) -> bool:
        try:
            self._get_client().set(key, value, ex=ttl_seconds)
            self._mark_success()
            return True
        except RedisError as error:
            self._mark_failure(error)
            return False

    def get_json(self, key: str) -> dict[str, Any] | None:
        value = self.get_text(key)
        if value is None:
            return None
        try:
            payload = json.loads(value)
            return payload if isinstance(payload, dict) else None
        except json.JSONDecodeError:
            return None

    def set_json(self, key: str, value: dict[str, object], ttl_seconds: int | None = None) -> bool:
        return self.set_text(key, json.dumps(value, separators=(",", ":")), ttl_seconds)

    def append_json(self, key: str, value: dict[str, object], limit: int) -> bool:
        try:
            pipeline = self._get_client().pipeline(transaction=True)
            pipeline.rpush(key, json.dumps(value, separators=(",", ":")))
            pipeline.ltrim(key, -limit, -1)
            pipeline.execute()
            self._mark_success()
            return True
        except RedisError as error:
            self._mark_failure(error)
            return False

    def recent_json(self, key: str, limit: int) -> list[dict[str, object]] | None:
        try:
            values = self._get_client().lrange(key, -limit, -1)
            self._mark_success()
            return [payload for value in values if isinstance((payload := json.loads(value)), dict)]
        except (RedisError, json.JSONDecodeError) as error:
            if isinstance(error, RedisError):
                self._mark_failure(error)
            return None

    def publish(self, channel: str, value: dict[str, object]) -> bool:
        try:
            self._get_client().publish(channel, json.dumps(value, separators=(",", ":")))
            self._mark_success()
            return True
        except RedisError as error:
            self._mark_failure(error)
            return False

    def transaction_json(
        self,
        values: list[tuple[str, dict[str, object], int | None]],
        channel: str,
        event: dict[str, object],
    ) -> bool:
        try:
            pipeline = self._get_client().pipeline(transaction=True)
            for key, value, ttl_seconds in values:
                pipeline.set(key, json.dumps(value, separators=(",", ":")), ex=ttl_seconds)
            pipeline.publish(channel, json.dumps(event, separators=(",", ":")))
            pipeline.execute()
            self._mark_success()
            return True
        except RedisError as error:
            self._mark_failure(error)
            return False

    def record_hardware_event(
        self,
        sequence_key: str,
        sequence: int,
        history_key: str,
        record: dict[str, object],
        history_limit: int,
        channel: str,
    ) -> bool:
        try:
            encoded = json.dumps(record, separators=(",", ":"))
            pipeline = self._get_client().pipeline(transaction=True)
            pipeline.set(sequence_key, sequence)
            pipeline.rpush(history_key, encoded)
            pipeline.ltrim(history_key, -history_limit, -1)
            pipeline.publish(channel, encoded)
            pipeline.execute()
            self._mark_success()
            return True
        except RedisError as error:
            self._mark_failure(error)
            return False

    @contextmanager
    def lock(self, name: str, timeout_seconds: int = 5) -> Iterator[bool]:
        lock = self._get_client().lock(name, timeout=timeout_seconds, blocking_timeout=1)
        acquired = False
        try:
            acquired = bool(lock.acquire())
            if acquired:
                self._mark_success()
        except RedisError as error:
            self._mark_failure(error)
        if not acquired:
            yield False
            return
        try:
            yield True
        finally:
            try:
                lock.release()
            except RedisError as error:
                self._mark_failure(error)


redis_runtime = RedisRuntime()
