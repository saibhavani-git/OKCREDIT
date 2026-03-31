"""Build feature row for monthly_category_spend_xgb from last completed months."""
from __future__ import annotations

from typing import Any, Dict, List

import numpy as np
import pandas as pd

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


def _month_parts(ym: str) -> tuple[int, int]:
    parts = str(ym).split("-")
    y, m = int(parts[0]), int(parts[1])
    return y, m


def _next_month_str(ym: str) -> str:
    y, m = _month_parts(ym)
    if m == 12:
        return f"{y + 1}-01"
    return f"{y}-{m + 1:02d}"


def build_feature_row(
    history_rows: List[Dict[str, Any]],
    predict_for_month: str | None = None,
) -> np.ndarray:
    """
    history_rows: oldest first, each dict has category keys (INR). Optional 'month' on last row.
    predict_for_month: YYYY-MM for the month being forecast; if None, inferred as month after last row.
    """
    if not history_rows:
        raise ValueError("history_rows required")

    rows = list(history_rows)
    while len(rows) < 3:
        rows.insert(0, dict(rows[0]))

    last_three = rows[-3:]
    lag2 = last_three[0]
    mid = last_three[1]
    lag1 = last_three[2]

    if predict_for_month is None:
        lm = lag1.get("month")
        if lm:
            predict_for_month = _next_month_str(str(lm))
        else:
            predict_for_month = "2025-01"

    y, m = _month_parts(predict_for_month)
    month_sin = np.sin(2 * np.pi * (m - 1) / 12.0)
    month_cos = np.cos(2 * np.pi * (m - 1) / 12.0)

    feat: list[float] = []
    for c in CATS:
        v1 = float(lag1.get(c, 0) or 0)
        v2 = float(lag2.get(c, 0) or 0)
        r3 = (float(lag2.get(c, 0) or 0) + float(mid.get(c, 0) or 0) + v1) / 3.0
        feat.extend([v1, v2, r3])

    total_lag1 = sum(float(lag1.get(c, 0) or 0) for c in CATS)
    feat.extend([month_sin, month_cos, total_lag1])

    return np.array(feat, dtype=np.float64).reshape(1, -1)


def predictions_dict(bundle: dict, history_rows: List[Dict[str, Any]], predict_month: str | None = None):
    model = bundle["model"]
    rows = list(history_rows)
    while len(rows) < 3:
        rows.insert(0, dict(rows[0]))
    lag1 = rows[-1]
    resolved_month = predict_month
    if resolved_month is None:
        lm = lag1.get("month")
        resolved_month = _next_month_str(str(lm)) if lm else "2025-01"

    X = build_feature_row(history_rows, resolved_month)
    yhat = model.predict(X)[0]
    cats = bundle["target_cols"]
    out = {cats[i]: max(0, round(float(yhat[i]))) for i in range(len(cats))}
    out["total_predicted"] = sum(out[c] for c in cats)
    return out, resolved_month
