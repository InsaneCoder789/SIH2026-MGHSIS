from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np

from .features import FEATURE_NAMES, RISK_LABELS

DATASET_VERSION = "crowd-risk-synthetic-v1"
DEFAULT_SEED = 26206


def _clamp(values: np.ndarray, low: float = 0.0, high: float = 100.0) -> np.ndarray:
    return np.clip(values, low, high)


def generate_crowd_dataset(rows: int = 100_000, seed: int = DEFAULT_SEED) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Generate realistic, non-identifying zone snapshots and noisy risk labels.

    Labels are derived from the source-of-truth crowd factors plus controlled noise.
    This corpus validates the software pipeline only; it is not evidence of real-world
    safety performance.
    """
    if rows < 1_000:
        raise ValueError("rows must be at least 1,000")

    rng = np.random.default_rng(seed)
    event_type = rng.integers(0, 3, rows)
    area = rng.uniform(180.0, 2_800.0, rows)
    safe_density = rng.uniform(2.1, 3.7, rows)
    capacity = np.maximum(50, np.rint(area * safe_density)).astype(int)

    regime = rng.choice(4, size=rows, p=[0.31, 0.29, 0.24, 0.16])
    utilization_centres = np.array([0.43, 0.72, 0.96, 1.18])
    utilization = np.clip(rng.normal(utilization_centres[regime], 0.12), 0.08, 1.55)
    count = np.maximum(1, np.rint(capacity * utilization)).astype(int)
    density = count / area

    inflow = np.clip(rng.normal(12 + regime * 13, 9), 0, 105)
    outflow = np.clip(rng.normal(18 + (3 - regime) * 5, 9), 0, 95)
    accumulation = inflow - outflow + rng.normal(0, 2.2, rows)
    route_width = np.clip(rng.lognormal(mean=1.25, sigma=0.42, size=rows), 1.1, 12.0)
    exits = np.clip(np.rint(area / 650 + rng.normal(1.8, 0.8, rows)), 1, 8).astype(int)

    baseline_speed = 1.35 - regime * 0.19
    speed = np.clip(rng.normal(baseline_speed - density * 0.10, 0.16), 0.08, 1.65)
    speed_drop = np.clip((1.25 - speed) / 1.25 + rng.normal(0, 0.04, rows), 0, 1)
    dwell = np.clip(rng.gamma(2.0 + regime * 0.45, 5.5, rows), 0.5, 75)

    elderly_share = np.clip(rng.beta(2.1, 11.0, rows) + (event_type == 2) * 0.08, 0, 0.55)
    child_share = np.clip(rng.beta(1.8, 13.0, rows), 0, 0.45)
    mobility_share = np.clip(rng.beta(1.3, 25.0, rows) + (event_type == 2) * 0.035, 0, 0.24)
    heat_index = np.clip(rng.normal(31.5 + (event_type == 2) * 2.0, 5.0, rows), 18, 49)

    fall_rate = np.clip((density - 1.4) * 0.7 + speed_drop * 1.8 + mobility_share * 8, 0, 7)
    falls = rng.poisson(fall_rate).clip(0, 12)
    sos_rate = np.clip((density - 1.2) * 0.55 + heat_index.clip(34, None) / 28 + elderly_share * 3, 0, 6)
    sos = rng.poisson(sos_rate).clip(0, 10)
    cctv_confidence = np.clip(rng.beta(13, 2.3, rows), 0.45, 0.999)
    gateway_health = np.clip(rng.beta(15, 1.7, rows), 0.35, 0.999)

    density_score = _clamp((density - 0.9) / 3.0 * 100)
    capacity_score = _clamp((utilization - 0.50) / 0.75 * 100)
    accumulation_score = _clamp((accumulation + 8) / 50 * 100)
    slowdown_score = _clamp(speed_drop * 100)
    cluster_score = _clamp(falls * 13 + sos * 10)
    bottleneck_score = _clamp((5.0 - route_width) / 4.0 * 70 + (3 - exits) * 9)
    vulnerability_score = _clamp(elderly_share * 40 + child_share * 28 + mobility_share * 90)
    heat_score = _clamp((heat_index - 30) / 16 * 100)

    latent_score = (
        density_score * 0.25
        + capacity_score * 0.18
        + accumulation_score * 0.17
        + slowdown_score * 0.11
        + cluster_score * 0.10
        + bottleneck_score * 0.08
        + vulnerability_score * 0.06
        + heat_score * 0.05
    )
    confidence_penalty = (1 - cctv_confidence) * 8 + (1 - gateway_health) * 7
    event_modifier = (event_type == 2) * 2.0 + (event_type == 1) * 1.0
    observed_score = _clamp(latent_score + confidence_penalty + event_modifier + rng.normal(0, 6.8, rows))

    labels = np.select(
        [observed_score < 30, observed_score < 55, observed_score < 75],
        [0, 1, 2],
        default=3,
    ).astype(int)

    features = np.column_stack([
        event_type, area, count, capacity, density, utilization, inflow, outflow,
        accumulation, speed, speed_drop, dwell, route_width, exits, elderly_share,
        child_share, mobility_share, heat_index, falls, sos, cctv_confidence,
        gateway_health,
    ]).astype(np.float64)
    return features, labels, observed_score


def write_dataset(path: Path, rows: int = 100_000, seed: int = DEFAULT_SEED) -> dict[str, object]:
    import csv
    import gzip

    features, labels, scores = generate_crowd_dataset(rows=rows, seed=seed)
    path.parent.mkdir(parents=True, exist_ok=True)
    opener = gzip.open if path.suffix == ".gz" else open
    mode = "wt" if path.suffix == ".gz" else "w"
    with opener(path, mode, newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow([*FEATURE_NAMES, "risk_score", "risk_class"])
        for feature_row, score, label in zip(features, scores, labels, strict=True):
            writer.writerow([*(round(float(value), 6) for value in feature_row), round(float(score), 3), RISK_LABELS[int(label)]])

    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    counts = np.bincount(labels, minlength=4)
    manifest = {
        "dataset_version": DATASET_VERSION,
        "rows": rows,
        "seed": seed,
        "features": FEATURE_NAMES,
        "target": "risk_class",
        "class_distribution": {RISK_LABELS[index]: int(value) for index, value in enumerate(counts)},
        "sha256": digest,
        "synthetic_only": True,
        "intended_use": "Software pipeline development and demonstration; not real-world safety certification.",
    }
    manifest_path = path.parent / "crowd-risk-dataset-manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return manifest

