from __future__ import annotations

import json
from threading import Lock
from time import perf_counter
from typing import Any

import psycopg
from psycopg import Connection
from psycopg.rows import dict_row

from app.core.config import settings


SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS hardware_observations (
    ingestion_id uuid PRIMARY KEY,
    received_at timestamptz NOT NULL,
    source_id text NOT NULL,
    source_type text NOT NULL,
    event_id text NOT NULL,
    zone_id text NOT NULL,
    sequence bigint NOT NULL,
    captured_at timestamptz NOT NULL,
    payload jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS hardware_observations_event_received_idx
    ON hardware_observations (event_id, received_at DESC);
"""


class PostgresRuntime:
    def __init__(self) -> None:
        self._connection: Connection[Any] | None = None
        self._available = False
        self._last_error: str | None = None
        self._schema_ready = False
        self._lock = Lock()

    @property
    def available(self) -> bool:
        return self._available

    @property
    def last_error(self) -> str | None:
        return self._last_error

    @staticmethod
    def _connection_url() -> str:
        return settings.database_url.replace("postgresql+psycopg://", "postgresql://", 1)

    def connect(self) -> bool:
        with self._lock:
            try:
                if self._connection is None or self._connection.closed:
                    self._connection = psycopg.connect(
                        self._connection_url(),
                        autocommit=True,
                        connect_timeout=2,
                        row_factory=dict_row,
                    )
                    self._schema_ready = False
                if not self._schema_ready:
                    self._connection.execute(SCHEMA_SQL)
                    self._schema_ready = True
                else:
                    self._connection.execute("SELECT 1")
                self._available = True
                self._last_error = None
                return True
            except psycopg.Error as error:
                self._available = False
                self._last_error = str(error)
                self._connection = None
                self._schema_ready = False
                return False

    def close(self) -> None:
        with self._lock:
            if self._connection is not None:
                self._connection.close()
            self._connection = None
            self._available = False
            self._schema_ready = False

    def diagnostics(self) -> dict[str, object]:
        started = perf_counter()
        connected = self.connect()
        return {
            "name": "PostgreSQL Event History",
            "group": "DATA",
            "status": "HEALTHY" if connected else "OFFLINE",
            "health": 100 if connected else 0,
            "latency_ms": max(1, round((perf_counter() - started) * 1000)),
            "required": True,
            "detail": "Durable hardware telemetry and event history" if connected else (self.last_error or "PostgreSQL is unavailable"),
        }

    def record_hardware_observation(self, record: dict[str, object]) -> bool:
        if not self.available and not self.connect():
            return False
        with self._lock:
            try:
                assert self._connection is not None
                self._connection.execute(
                    """
                    INSERT INTO hardware_observations (
                        ingestion_id, received_at, source_id, source_type, event_id,
                        zone_id, sequence, captured_at, payload
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb)
                    ON CONFLICT (ingestion_id) DO NOTHING
                    """,
                    (
                        record["ingestion_id"], record["received_at"], record["source_id"],
                        record["source_type"], record["event_id"], record["zone_id"],
                        record["sequence"], record["captured_at"], json.dumps(record["payload"]),
                    ),
                )
                self._available = True
                self._last_error = None
                return True
            except (psycopg.Error, KeyError, TypeError) as error:
                self._available = False
                self._last_error = str(error)
                return False

    def recent_hardware_observations(self, limit: int) -> list[dict[str, object]] | None:
        if not self.available and not self.connect():
            return None
        with self._lock:
            try:
                assert self._connection is not None
                rows = self._connection.execute(
                    "SELECT * FROM hardware_observations ORDER BY received_at DESC LIMIT %s",
                    (limit,),
                ).fetchall()
                return [dict(row) for row in reversed(rows)]
            except psycopg.Error as error:
                self._available = False
                self._last_error = str(error)
                return None


postgres_runtime = PostgresRuntime()
