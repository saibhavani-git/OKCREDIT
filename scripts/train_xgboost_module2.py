#!/usr/bin/env python3
"""Train XGBoost on ml_models/module2_synthetic.csv → ml_models/xgboost_module2_yearly.joblib"""
from __future__ import annotations

import csv
from pathlib import Path

import joblib
import numpy as np
from xgboost import XGBRegressor

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "ml_models" / "module2_synthetic.csv"
OUT_PATH = ROOT / "ml_models" / "xgboost_module2_yearly.joblib"
FEATURES = ["shopping", "travel", "dining", "fuel", "groceries", "cardNorm"]


def main() -> None:
    if not CSV_PATH.is_file():
        raise SystemExit(f"Missing {CSV_PATH} — run: npm run synthetic-module2")
    rows = list(csv.DictReader(CSV_PATH.open(newline="", encoding="utf-8")))
    X = np.array([[float(row[k]) for k in FEATURES] for row in rows], dtype=np.float64)
    y = np.array([float(row["reward"]) for row in rows], dtype=np.float64)
    model = XGBRegressor(
        n_estimators=200, max_depth=6, learning_rate=0.06,
        subsample=0.85, colsample_bytree=0.85, random_state=42, n_jobs=-1,
    )
    model.fit(X, y)
    joblib.dump({"model": model}, OUT_PATH)
    print(f"Saved {OUT_PATH} ({len(rows)} rows)")


if __name__ == "__main__":
    main()
