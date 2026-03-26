#!/usr/bin/env python3
"""DecisionTreeClassifier on quiz_training.csv → quiz_tree.joblib"""
from __future__ import annotations

import sys
from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, OneHotEncoder
from sklearn.tree import DecisionTreeClassifier, export_text

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
MODEL_DIR = ROOT / "models"
CSV_PATH = DATA_DIR / "quiz_training.csv"
OUT_PATH = MODEL_DIR / "quiz_tree.joblib"


def main() -> None:
    if not CSV_PATH.is_file():
        print(f"Missing {CSV_PATH}; run generate_quiz_dataset.py", file=sys.stderr)
        sys.exit(1)

    df = pd.read_csv(CSV_PATH)
    X = df.drop(columns=["target_card"])
    y = df["target_card"].astype(str)
    le_y = LabelEncoder()
    y_enc = le_y.fit_transform(y)

    numeric = ["travel_score", "shopping_score", "dining_score", "fuel_score", "groceries_score", "income"]
    categorical = ["preferred_bank"]
    pre = ColumnTransformer(
        [
            ("num", "passthrough", numeric),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical),
        ]
    )
    tree = DecisionTreeClassifier(max_depth=10, min_samples_leaf=8, random_state=42)
    pipe = Pipeline([("pre", pre), ("clf", tree)])

    try:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_enc, test_size=0.2, random_state=42, stratify=y_enc
        )
    except ValueError:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_enc, test_size=0.2, random_state=42, stratify=None
        )
    pipe.fit(X_train, y_train)
    acc = float((pipe.predict(X_test) == y_test).mean())
    print(f"Quiz tree test accuracy: {acc:.4f}")

    ohe: OneHotEncoder = pipe.named_steps["pre"].named_transformers_["cat"]
    cat_feats = list(ohe.get_feature_names_out(categorical))
    all_names = numeric + list(cat_feats)
    text = export_text(pipe.named_steps["clf"], feature_names=all_names, max_depth=6)

    importances = pipe.named_steps["clf"].feature_importances_.tolist()

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {
            "pipeline": pipe,
            "label_encoder": le_y,
            "feature_names": all_names,
            "feature_importances": dict(zip(all_names, importances)),
            "export_text_preview": text[:8000],
            "class_names": le_y.classes_.tolist(),
        },
        OUT_PATH,
    )
    print(f"Saved {OUT_PATH}")


if __name__ == "__main__":
    main()
