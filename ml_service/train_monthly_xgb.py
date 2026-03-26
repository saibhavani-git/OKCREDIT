#!/usr/bin/env python3
"""Train monthly profile → recommended card (predicts best_card_logic)."""
from __future__ import annotations

import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
MODEL_DIR = ROOT / "models"
CSV_PATH = DATA_DIR / "monthly_training.csv"
OUT_PATH = MODEL_DIR / "monthly_xgb.joblib"


def main() -> None:
    if not CSV_PATH.is_file():
        print(f"Missing {CSV_PATH}; run generate_monthly_dataset.py", file=sys.stderr)
        sys.exit(1)

    df = pd.read_csv(CSV_PATH)
    feat_cols = ["total_spend"] + [c for c in df.columns if c.startswith("spend_")]
    X = df[feat_cols].astype(np.float64).values
    y = df["best_card_logic"].astype(str)
    le = LabelEncoder()
    y_enc = le.fit_transform(y)

    try:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_enc, test_size=0.2, random_state=42, stratify=y_enc
        )
    except ValueError:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_enc, test_size=0.2, random_state=42, stratify=None
        )

    try:
        clf = XGBClassifier(
            n_estimators=250,
            max_depth=7,
            learning_rate=0.08,
            random_state=42,
            tree_method="gpu_hist",
            predictor="gpu_predictor",
            eval_metric="mlogloss",
        )
        clf.fit(X_train, y_train)
    except Exception as e:
        print("GPU fallback:", e)
        clf = XGBClassifier(
            n_estimators=250,
            max_depth=7,
            learning_rate=0.08,
            random_state=42,
            tree_method="hist",
            eval_metric="mlogloss",
        )
        clf.fit(X_train, y_train)

    acc = float((clf.predict(X_test) == y_test).mean())
    print(f"Monthly model test accuracy: {acc:.4f}")

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {
            "model": clf,
            "label_encoder": le,
            "feature_cols": feat_cols,
        },
        OUT_PATH,
    )
    print(f"Saved {OUT_PATH}")


if __name__ == "__main__":
    main()
