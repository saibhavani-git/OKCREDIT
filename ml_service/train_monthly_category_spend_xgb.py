#!/usr/bin/env python3
"""
Train XGBoost regressors to predict *next month* category-wise spending (INR).

- Input CSV: realistic_monthly_spend.csv (from generate_realistic_monthly_spending.py)
  columns: month, food, groceries, travel, fuel, entertainment, shopping, bills, healthcare
- Features per row t: lag1, lag2, roll3 (shifted) per category + month sin/cos + total_lag1
- Target: same-row category amounts are NEXT month in supervised setup:
  we align X[t] built from history ending t-1 with y = row t values.

Usage (from repo root):
  python ml_service/generate_realistic_monthly_spending.py --months 120 --seed 1
  python ml_service/train_monthly_category_spend_xgb.py
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.multioutput import MultiOutputRegressor
from xgboost import XGBRegressor

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
MODEL_DIR = ROOT / "models"
DEFAULT_CSV = DATA_DIR / "realistic_monthly_spend.csv"
OUT_PATH = MODEL_DIR / "monthly_category_spend_xgb.joblib"

CATS = [
    "food",
    "groceries",
    "travel",
    "fuel",
    "entertainment",
    "shopping",
    "bills",
    "healthcare",
]


def build_supervised_frame(df: pd.DataFrame) -> tuple[pd.DataFrame, list[str], list[str]]:
    df = df.sort_values("month").reset_index(drop=True)
    for c in CATS:
        df[f"{c}_lag1"] = df[c].shift(1)
        df[f"{c}_lag2"] = df[c].shift(2)
        df[f"{c}_roll3"] = df[c].shift(1).rolling(window=3, min_periods=3).mean()

    mdt = pd.to_datetime(df["month"] + "-01", errors="coerce")
    month_i = mdt.dt.month.fillna(1).astype(int)
    df["month_sin"] = np.sin(2 * np.pi * (month_i - 1) / 12.0)
    df["month_cos"] = np.cos(2 * np.pi * (month_i - 1) / 12.0)
    df["total_lag1"] = df[CATS].sum(axis=1).shift(1)

    feat_cols = []
    for c in CATS:
        feat_cols.extend([f"{c}_lag1", f"{c}_lag2", f"{c}_roll3"])
    feat_cols.extend(["month_sin", "month_cos", "total_lag1"])

    clean = df.dropna(subset=feat_cols).copy()
    return clean, feat_cols, CATS


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", type=str, default=str(DEFAULT_CSV))
    ap.add_argument("--test-size", type=float, default=0.15)
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    csv_path = Path(args.csv)
    if not csv_path.is_file():
        print(
            f"Missing {csv_path}. Run:\n"
            f"  python ml_service/generate_realistic_monthly_spending.py --months 120 --seed 1",
            file=sys.stderr,
        )
        sys.exit(1)

    df = pd.read_csv(csv_path)
    for c in CATS:
        if c not in df.columns:
            print(f"CSV missing column {c}", file=sys.stderr)
            sys.exit(1)

    supervised, feat_cols, target_cols = build_supervised_frame(df)
    if len(supervised) < 30:
        print(
            "Need more monthly rows (>= ~30 after lag/roll). "
            "Regenerate with --months 120.",
            file=sys.stderr,
        )
        sys.exit(1)

    X = supervised[feat_cols].astype(np.float64).values
    y = supervised[target_cols].astype(np.float64).values

    n = len(X)
    split = int(n * (1 - args.test_size))
    split = max(split, min(n - 5, n * 4 // 5))
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    base = XGBRegressor(
        n_estimators=400,
        max_depth=6,
        learning_rate=0.06,
        subsample=0.9,
        colsample_bytree=0.85,
        random_state=args.seed,
        tree_method="hist",
        n_jobs=-1,
    )
    model = MultiOutputRegressor(base)
    model.fit(X_train, y_train)

    pred = model.predict(X_test)
    mae = float(np.mean(np.abs(pred - y_test)))
    print(f"Multi-output spend MAE (mean abs error INR): {mae:.2f}")

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {
            "model": model,
            "feature_cols": feat_cols,
            "target_cols": target_cols,
            "version": 1,
        },
        OUT_PATH,
    )
    print(f"Saved {OUT_PATH}")


if __name__ == "__main__":
    main()
