from __future__ import annotations

from typing import Final

RISK_LABELS: Final[list[str]] = ["LOW", "MODERATE", "HIGH", "CRITICAL"]
RISK_MIDPOINTS: Final[dict[str, float]] = {
    "LOW": 15.0,
    "MODERATE": 42.0,
    "HIGH": 65.0,
    "CRITICAL": 88.0,
}

FEATURE_NAMES: Final[list[str]] = [
    "event_type_code",
    "area_m2",
    "current_count",
    "safe_capacity",
    "density_per_m2",
    "capacity_utilization",
    "inflow_per_min",
    "outflow_per_min",
    "accumulation_per_min",
    "average_speed_mps",
    "speed_drop_ratio",
    "dwell_time_min",
    "route_width_m",
    "exit_count",
    "elderly_share",
    "child_share",
    "mobility_limited_share",
    "heat_index_c",
    "fall_cluster_5m",
    "sos_cluster_5m",
    "cctv_confidence",
    "gateway_health",
]

EVENT_TYPE_CODES: Final[dict[str, int]] = {
    "CRICKET_STADIUM": 0,
    "CONCERT": 1,
    "PILGRIMAGE": 2,
}

