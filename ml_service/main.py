#!/usr/bin/env python3
"""
FastAPI ML serving.
Run from repo root:  uvicorn ml_service.main:app --reload --host 0.0.0.0 --port 8000
Or from ml_service:    uvicorn main:app --reload
"""
from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent
MODEL_DIR = ROOT / "models"

app = FastAPI(title="OKCredit ML Service", version="1.0.0")

_transaction_bundle = None
_monthly_bundle = None
_quiz_bundle = None
_monthly_spend_bundle = None


def _load_joblib(name: str):
    p = MODEL_DIR / name
    if not p.is_file():
        return None
    return joblib.load(p)


def get_transaction_bundle():
    global _transaction_bundle
    if _transaction_bundle is None:
        _transaction_bundle = _load_joblib("transaction_xgb.joblib")
    return _transaction_bundle


def get_monthly_bundle():
    global _monthly_bundle
    if _monthly_bundle is None:
        _monthly_bundle = _load_joblib("monthly_xgb.joblib")
    return _monthly_bundle


def get_quiz_bundle():
    global _quiz_bundle
    if _quiz_bundle is None:
        _quiz_bundle = _load_joblib("quiz_tree.joblib")
    return _quiz_bundle


def get_monthly_spend_bundle():
    global _monthly_spend_bundle
    if _monthly_spend_bundle is None:
        _monthly_spend_bundle = _load_joblib("monthly_category_spend_xgb.joblib")
    return _monthly_spend_bundle


def _encode_category(le, cat: str) -> int:
    cat = str(cat).lower().strip()
    if hasattr(le, "classes_") and cat in le.classes_:
        return int(le.transform([cat])[0])
    return 0


def build_transaction_features(bundle: dict, category: str, amount: float, cashbacks: Dict[str, float]) -> np.ndarray:
    le_cat = bundle["category_encoder"]
    scaler = bundle["scaler"]
    meta = bundle["meta"]
    cols: List[str] = meta["cashback_cols"]
    names: List[str] = meta.get("card_names") or []

    cat_enc = _encode_category(le_cat, category)
    amt_scaled = float(scaler.transform(np.array([[float(amount)]], dtype=np.float64))[0, 0])
    row = [cat_enc, amt_scaled]
    if len(names) == len(cols):
        for nm in names:
            row.append(float(cashbacks.get(nm, 0.0)))
    else:
        for _c in cols:
            row.append(0.0)
    return np.array(row, dtype=np.float64).reshape(1, -1)


class PredictTransactionBody(BaseModel):
    category: str
    amount: float = Field(gt=0)
    cashbacks: Dict[str, float]


@app.post("/predict-transaction")
def predict_transaction(body: PredictTransactionBody):
    b = get_transaction_bundle()
    if b is None:
        raise HTTPException(503, "transaction_xgb.joblib not found — train model first")
    X = build_transaction_features(b, body.category, body.amount, body.cashbacks)
    clf = b["model"]
    le_y = b["label_encoder"]
    proba = clf.predict_proba(X)[0]
    classes = le_y.classes_
    out = {str(classes[i]): float(proba[i]) for i in range(len(classes))}
    return {"probabilities": out, "predicted_card": str(classes[int(np.argmax(proba))])}


class MonthlyBody(BaseModel):
    total_spend: float
    spend_shopping: float = 0
    spend_travel: float = 0
    spend_fuel: float = 0
    spend_dining: float = 0
    spend_groceries: float = 0


@app.post("/predict-monthly")
def predict_monthly(body: MonthlyBody):
    bundle = get_monthly_bundle()
    if bundle is None:
        raise HTTPException(503, "monthly_xgb.joblib not found")
    cols = bundle["feature_cols"]
    d = body.model_dump()
    row = [float(d.get(c, 0) or 0) for c in cols]
    X = np.array(row, dtype=np.float64).reshape(1, -1)
    clf = bundle["model"]
    le = bundle["label_encoder"]
    proba = clf.predict_proba(X)[0]
    idx = int(np.argmax(proba))
    card = str(le.inverse_transform([idx])[0])
    conf = float(proba[idx])
    expected_savings = round(conf * 18_000, 0)
    return {"recommended_card": card, "confidence": round(conf, 4), "expected_savings": expected_savings}


class PredictNextMonthSpendBody(BaseModel):
    """Chronological monthly rows (oldest first). Each row: category INR + optional month YYYY-MM."""

    history: List[Dict[str, Any]]
    predict_month: str | None = None


@app.post("/predict-next-month-spend")
def predict_next_month_spend(body: PredictNextMonthSpendBody):
    from monthly_spend_inference import predictions_dict

    bundle = get_monthly_spend_bundle()
    if bundle is None:
        raise HTTPException(
            503,
            "monthly_category_spend_xgb.joblib not found — run train_monthly_category_spend_xgb.py",
        )
    if not body.history or len(body.history) < 1:
        raise HTTPException(400, "history must include at least one month (3+ recommended)")
    preds, used_month = predictions_dict(bundle, body.history, body.predict_month)
    by_cat = {k: v for k, v in preds.items() if k != "total_predicted"}
    return {
        "predict_for_month": used_month,
        "predicted_spend_inr": by_cat,
        "total_predicted_inr": int(preds.get("total_predicted", 0)),
    }


class QuizBody(BaseModel):
    travel_score: int = Field(ge=0, le=100)
    shopping_score: int = Field(ge=0, le=100)
    dining_score: int = Field(ge=0, le=100)
    fuel_score: int = Field(ge=0, le=100)
    groceries_score: int = Field(ge=0, le=100)
    income: int = Field(ge=0)
    preferred_bank: str


@app.post("/predict-quiz")
def predict_quiz(body: QuizBody):
    bundle = get_quiz_bundle()
    if bundle is None:
        raise HTTPException(503, "quiz_tree.joblib not found")
    pipe = bundle["pipeline"]
    le = bundle["label_encoder"]
    X = pd.DataFrame(
        [
            {
                "travel_score": body.travel_score,
                "shopping_score": body.shopping_score,
                "dining_score": body.dining_score,
                "fuel_score": body.fuel_score,
                "groceries_score": body.groceries_score,
                "income": body.income,
                "preferred_bank": body.preferred_bank,
            }
        ]
    )
    pred = pipe.predict(X)[0]
    card = str(le.inverse_transform([pred])[0])
    proba = np.max(pipe.predict_proba(X)[0])
    imps = bundle.get("feature_importances") or {}
    top = sorted(imps.items(), key=lambda x: -x[1])[:5]
    reason_bits = [f"{k} importance {v:.3f}" for k, v in top if v > 0.01]
    reason = "; ".join(reason_bits[:3]) or "Decision tree path over quiz profile + bank"
    return {
        "recommended_card": card,
        "confidence": round(float(proba), 4),
        "reason": reason,
        "top_features": [{"feature": k, "importance": round(v, 4)} for k, v in top],
    }


@app.get("/health")
def health():
    return {
        "ok": True,
        "transaction_model": get_transaction_bundle() is not None,
        "monthly_model": get_monthly_bundle() is not None,
        "quiz_model": get_quiz_bundle() is not None,
        "monthly_category_spend_model": get_monthly_spend_bundle() is not None,
    }
