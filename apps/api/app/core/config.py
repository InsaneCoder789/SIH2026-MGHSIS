from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    redis_url: str = "redis://127.0.0.1:6379/0"
    redis_prefix: str = "mghsis"
    redis_snapshot_ttl_seconds: int = Field(default=3600, ge=60)
    hardware_history_limit: int = Field(default=500, ge=50, le=10_000)
    database_url: str = "postgresql+psycopg://mghsis:mghsis_dev_password@127.0.0.1:5433/mghsis"


settings = Settings()
