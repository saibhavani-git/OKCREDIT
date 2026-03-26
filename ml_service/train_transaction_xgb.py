#!/usr/bin/env python3
"""
Train XGBoostClassifier on transaction_training.csv → models/transaction_xgb.joblib
GPU: gpu_hist + gpu_predictor with fallback to hist.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler

from reward_math import col_name, stable_card_names

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
MODEL_DIR = ROOT / "models"
CSV_PATH = DATA_DIR / "transaction_training.csv"
CARDS_PATH = DATA_DIR / "cards.json"
OUT_PATH = MODEL_DIR / "transaction_xgb.joblib"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--test-size", type=float, default=0.2)
    args = ap.parse_args()

    if not CSV_PATH.is_file():
        print(f"Missing {CSV_PATH}. Run: python ml_service/generate_transaction_dataset.py", file=sys.stderr)
        sys.exit(1)

    df = pd.read_csv(CSV_PATH)
    y = df["actual_card"].astype(str)
    feature_cols = [c for c in df.columns if c.startswith("cb_")]
    ordered_names: list = []
    if CARDS_PATH.is_file():
        cards = json.loads(CARDS_PATH.read_text(encoding="utf-8"))
        ordered_names = stable_card_names(cards)
        expected = [col_name(n) for n in ordered_names]
        if expected != feature_cols:
            print("Warning: CSV cb_ columns order differs from cards.json; using CSV order.", file=sys.stderr)
            ordered_names = []
    if not ordered_names:
        ordered_names = [c[3:].replace("_", " ") for c in feature_cols]
    meta = {
        "feature_cols": ["category_enc", "amount_scaled"] + feature_cols,
        "cashback_cols": feature_cols,
        "card_names": ordered_names,
    }

    le_cat = LabelEncoder()
    df["category_enc"] = le_cat.fit_transform(df["category"].astype(str))

    scaler = StandardScaler()
    df["amount_scaled"] = scaler.fit_transform(df[["amount"]].astype(float))

    X = df[["category_enc", "amount_scaled"] + feature_cols].astype(np.float64).values
    le_y = LabelEncoder()
    y_enc = le_y.fit_transform(y)

    try:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_enc, test_size=args.test_size, random_state=42, stratify=y_enc
        )
    except ValueError:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_enc, test_size=args.test_size, random_state=42, stratify=None
        )

    try:
        from xgboost import XGBClassifier

        clf = XGBClassifier(
            n_estimators=300,
            max_depth=8,
            learning_rate=0.08,
            subsample=0.9,
            colsample_bytree=0.9,
            random_state=42,
            tree_method="gpu_hist",
            predictor="gpu_predictor",
            eval_metric="mlogloss",
        )
        clf.fit(X_train, y_train)
    except Exception as e:
        print("GPU training failed, falling back to hist:", e)
        from xgboost import XGBClassifier

        clf = XGBClassifier(
            n_estimators=300,
            max_depth=8,
            learning_rate=0.08,
            subsample=0.9,
            colsample_bytree=0.9,
            random_state=42,
            tree_method="hist",
            eval_metric="mlogloss",
        )
        clf.fit(X_train, y_train)

    acc = float((clf.predict(X_test) == y_test).mean())
    print(f"Test accuracy: {acc:.4f}")

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    bundle = {
        "model": clf,
        "label_encoder": le_y,
        "category_encoder": le_cat,
        "scaler": scaler,
        "meta": meta,
    }
    joblib.dump(bundle, OUT_PATH)
    print(f"Saved {OUT_PATH}")


if __name__ == "__main__":
    main()
