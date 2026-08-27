from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    redis_url: str = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0")
    redis_prefix: str = os.getenv("REDIS_PREFIX", "mghsis")
    redis_snapshot_ttl_seconds: int = int(os.getenv("REDIS_SNAPSHOT_TTL_SECONDS", "3600"))
    hardware_history_limit: int = int(os.getenv("HARDWARE_HISTORY_LIMIT", "500"))


settings = Settings()
