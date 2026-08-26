import numpy as np

from app.ml.dataset import generate_crowd_dataset


def test_dataset_is_reproducible_and_contains_all_risk_classes() -> None:
    features_a, labels_a, scores_a = generate_crowd_dataset(rows=5_000, seed=26206)
    features_b, labels_b, scores_b = generate_crowd_dataset(rows=5_000, seed=26206)
    assert features_a.shape == (5_000, 22)
    assert np.array_equal(features_a, features_b)
    assert np.array_equal(labels_a, labels_b)
    assert np.array_equal(scores_a, scores_b)
    counts = np.bincount(labels_a, minlength=4)
    assert np.all(counts > 50)

