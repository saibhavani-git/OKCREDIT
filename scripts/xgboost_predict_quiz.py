#!/usr/bin/env python3
"""
Batch predict for quiz XGBoost model.
Usage: python scripts/xgboost_predict_quiz.py <path_to_joblib> < stdin JSON
Stdin: {"X": [[shopping, travel, dining, fuel, groceries, cardNorm], ...]}
Stdout: {"scores": [float, ...]}  # yearly ₹ reward (same scale as training target)

Requires: pip install joblib numpy xgboost
"""
from __future__ import annotations

import json
import sys

import joblib
import numpy as np


def main() -> None:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "missing model path"}), file=sys.stderr)
        sys.exit(1)
    model_path = sys.argv[1]
    raw = sys.stdin.read()
    payload = json.loads(raw)
    X = np.array(payload["X"], dtype=np.float64)
    bundle = joblib.load(model_path)
    model = bundle["model"]
    scores = model.predict(X)
    print(json.dumps({"scores": [float(x) for x in scores.tolist()]}))


if __name__ == "__main__":
    main()
