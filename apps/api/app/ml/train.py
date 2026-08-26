from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, log_loss
from sklearn.model_selection import train_test_split

from .dataset import DATASET_VERSION, DEFAULT_SEED, generate_crowd_dataset, write_dataset
from .features import FEATURE_NAMES, RISK_LABELS


def train(rows: int, seed: int, dataset_path: Path, artifact_path: Path, metrics_path: Path) -> dict[str, object]:
    features, labels, _ = generate_crowd_dataset(rows=rows, seed=seed)
    train_x, test_x, train_y, test_y = train_test_split(
        features,
        labels,
        test_size=0.20,
        random_state=seed,
        stratify=labels,
    )
    model = HistGradientBoostingClassifier(
        learning_rate=0.075,
        max_iter=180,
        max_leaf_nodes=31,
        min_samples_leaf=35,
        l2_regularization=0.8,
        class_weight="balanced",
        random_state=seed,
    )
    model.fit(train_x, train_y)
    predictions = model.predict(test_x)
    probabilities = model.predict_proba(test_x)
    report = classification_report(test_y, predictions, target_names=RISK_LABELS, output_dict=True, zero_division=0)
    matrix = confusion_matrix(test_y, predictions, labels=np.arange(4))
    metrics: dict[str, object] = {
        "evaluated_at": datetime.now(timezone.utc).isoformat(),
        "dataset_version": DATASET_VERSION,
        "seed": seed,
        "total_rows": rows,
        "training_rows": int(len(train_y)),
        "testing_rows": int(len(test_y)),
        "accuracy": round(float(accuracy_score(test_y, predictions)), 4),
        "macro_f1": round(float(report["macro avg"]["f1-score"]), 4),
        "weighted_f1": round(float(report["weighted avg"]["f1-score"]), 4),
        "multiclass_log_loss": round(float(log_loss(test_y, probabilities, labels=np.arange(4))), 4),
        "per_class": {
            label: {
                "precision": round(float(report[label]["precision"]), 4),
                "recall": round(float(report[label]["recall"]), 4),
                "f1": round(float(report[label]["f1-score"]), 4),
                "support": int(report[label]["support"]),
            }
            for label in RISK_LABELS
        },
        "confusion_matrix": matrix.tolist(),
        "limitations": [
            "All samples and labels are synthetic.",
            "Holdout performance measures recovery of the synthetic generator, not real-event safety outcomes.",
            "A field pilot, sensor calibration, drift monitoring and independent safety review are required before operational deployment.",
        ],
    }
    artifact_path.parent.mkdir(parents=True, exist_ok=True)
    bundle = {
        "model": model,
        "model_version": f"{DATASET_VERSION}-hgb-1",
        "model_type": "HistGradientBoostingClassifier",
        "feature_names": FEATURE_NAMES,
        "risk_labels": RISK_LABELS,
        "training_rows": int(len(train_y)),
        "testing_rows": int(len(test_y)),
        "seed": seed,
    }
    joblib.dump(bundle, artifact_path, compress=3)
    metrics_path.write_text(json.dumps(metrics, indent=2) + "\n", encoding="utf-8")
    write_dataset(dataset_path, rows=rows, seed=seed)
    return metrics


def main() -> None:
    root = Path(__file__).resolve().parents[2]
    parser = argparse.ArgumentParser(description="Train the onboard MGHSIS crowd-risk model")
    parser.add_argument("--rows", type=int, default=100_000)
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument("--dataset", type=Path, default=root / "data" / "generated" / "crowd-risk-100k.csv.gz")
    parser.add_argument("--artifact", type=Path, default=root / "artifacts" / "crowd-risk-model.joblib")
    parser.add_argument("--metrics", type=Path, default=root / "artifacts" / "crowd-risk-metrics.json")
    args = parser.parse_args()
    metrics = train(args.rows, args.seed, args.dataset, args.artifact, args.metrics)
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()

