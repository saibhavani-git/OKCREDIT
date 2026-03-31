#!/usr/bin/env python3
"""
Realistic simulated monthly spending (INR) for personal finance / card ML.

- 24+ months, monthly granularity
- Categories: food, groceries, travel, fuel, entertainment, shopping, bills, healthcare
- Pattern-based (not i.i.d. random): stable bills, travel spikes in summer, festival shopping, etc.
- Small Gaussian noise on weights and totals
- Monthly total clamped to ₹10,000 – ₹80,000
- Outputs pandas DataFrame + CSV with total_spend and dominant_category

Usage:
  python generate_realistic_monthly_spending.py --months 24 --output data/realistic_monthly_spend.csv
  python generate_realistic_monthly_spending.py --months 36 --users 3 --seed 42
"""
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd

CATEGORIES = [
    "food",
    "groceries",
    "travel",
    "fuel",
    "entertainment",
    "shopping",
    "bills",
    "healthcare",
]

# Typical share of wallet (sum ≈ 1); seasonality multipliers adjust these per month.
# Bills are large but not always #1 — shopping can dominate Nov; travel in May–Jun.
BASE_SHARE = np.array([0.11, 0.18, 0.08, 0.09, 0.11, 0.15, 0.20, 0.08], dtype=float)


def _month_calendar_index(dates: pd.DatetimeIndex) -> np.ndarray:
    """1–12 for each row."""
    return dates.month.to_numpy(dtype=int)


def travel_multiplier(month: int) -> float:
    """Summer vacation + mild December travel."""
    if month in (5, 6):
        return 2.0 if month == 5 else 1.75
    if month == 7:
        return 1.2
    if month == 12:
        return 1.25
    if month in (1, 2):
        return 0.75
    return 0.95


def shopping_multiplier(month: int) -> float:
    """Festivals + year-start sales."""
    if month == 11:  # Diwali / peak festive
        return 1.9
    if month in (10, 12):
        return 1.45
    if month == 1:
        return 1.22
    if month == 3:  # EOFY / spring sales (mild)
        return 1.12
    return 0.92


def food_groceries_multiplier(month: int) -> float:
    """Slightly higher in festive quarter + consistent base."""
    if month in (10, 11, 12):
        return 1.08 + 0.04 * (month - 10) / 2.0
    return 0.98 + 0.02 * np.sin((month - 1) * np.pi / 6)


def entertainment_multiplier(month: int) -> float:
    if month in (10, 11, 12):
        return 1.28
    if month in (5, 6, 7):
        return 1.12
    return 0.94


def fuel_multiplier(month: int) -> float:
    """Commute stable; tiny monsoon / holiday dip."""
    if month in (7, 8):
        return 1.05
    if month in (5, 6, 11, 12):
        return 1.08
    return 1.0


def bills_multiplier(month: int) -> float:
    """Mostly flat; AC season bump."""
    if month in (4, 5, 6, 7, 8):
        return 1.06
    return 1.0


def healthcare_multiplier(month: int) -> float:
    """Slight winter / monsoon uptick."""
    if month in (11, 12, 1, 2):
        return 1.12
    if month in (7, 8):
        return 1.08
    return 0.98


def category_multipliers_vectorized(months: np.ndarray) -> np.ndarray:
    """Shape (n_months, n_cats)."""
    n = len(months)
    m = np.zeros((n, len(CATEGORIES)), dtype=float)
    idx = {c: i for i, c in enumerate(CATEGORIES)}
    for t in range(n):
        mo = int(months[t])
        m[t, idx["food"]] = food_groceries_multiplier(mo)
        m[t, idx["groceries"]] = food_groceries_multiplier(mo) * 1.02
        m[t, idx["travel"]] = travel_multiplier(mo)
        m[t, idx["fuel"]] = fuel_multiplier(mo)
        m[t, idx["entertainment"]] = entertainment_multiplier(mo)
        m[t, idx["shopping"]] = shopping_multiplier(mo)
        m[t, idx["bills"]] = bills_multiplier(mo)
        m[t, idx["healthcare"]] = healthcare_multiplier(mo)
    return m


def smooth_monthly_total(
    t: np.ndarray,
    months: np.ndarray,
    rng: np.random.Generator,
    user_phase: float,
) -> np.ndarray:
    """
    Realistic evolving monthly total in INR before clamp.
    Uses slow drift + annual cycle + festival bump + noise.
    """
    # Base in middle of allowed range
    base = 38_000.0
    # Long drift (salary raises, lifestyle creep) — very gentle
    drift = 600.0 * (t / max(len(t), 1))
    # Annual cycle
    seasonal = 5_500.0 * np.sin(2 * np.pi * (t / 12.0 + user_phase))
    # Festival quarter lift (Oct–Dec)
    fest = np.array([1.12 if int(mo) in (10, 11, 12) else 1.0 for mo in months], dtype=float)
    fest *= np.array(
        [1.06 if int(mo) == 11 else 1.0 for mo in months], dtype=float
    )
    raw = (base + drift + seasonal) * fest
    noise = rng.normal(0, 2_800, size=len(t))
    out = raw + noise
    return np.clip(out, 10_000.0, 80_000.0)


def generate_user_months(
    n_months: int,
    start: pd.Timestamp,
    rng: np.random.Generator,
    user_id: int | None,
) -> pd.DataFrame:
    dates = pd.date_range(start=start, periods=n_months, freq="MS")
    t = np.arange(n_months, dtype=float)
    months = _month_calendar_index(dates)
    user_phase = rng.uniform(0, 1.0)

    mult = category_multipliers_vectorized(months)
    # Slight user-specific habit tilt (stable across time)
    habit = rng.normal(1.0, 0.06, size=len(CATEGORIES))
    habit = np.clip(habit, 0.82, 1.18)

    weights = BASE_SHARE * habit
    weights = weights / weights.sum()
    # Per-month weight noise (AR-ish: correlate with previous month)
    eps = rng.normal(0, 0.035, size=(n_months, len(CATEGORIES)))
    for i in range(1, n_months):
        eps[i] += 0.35 * eps[i - 1]
    w = weights.reshape(1, -1) * mult * (1.0 + eps)
    w = np.clip(w, 0.02, None)
    w = w / w.sum(axis=1, keepdims=True)

    totals = smooth_monthly_total(t, months, rng, user_phase)
    amounts = (w.T * totals).T
    amounts = np.round(amounts).astype(int)
    amounts = np.maximum(amounts, 0)

    df = pd.DataFrame(amounts, columns=CATEGORIES)
    df.insert(0, "month", dates.strftime("%Y-%m"))
    df["total_spend"] = df[CATEGORIES].sum(axis=1)
    df["dominant_category"] = df[CATEGORIES].idxmax(axis=1)

    # Enforce total band after rounding (scale if needed)
    lo, hi = 10_000, 80_000
    scale = np.ones(len(df))
    for i in range(len(df)):
        s = int(df.loc[i, "total_spend"])
        if s < lo:
            scale[i] = lo / max(s, 1)
        elif s > hi:
            scale[i] = hi / max(s, 1)
    if not np.allclose(scale, 1.0):
        for c in CATEGORIES:
            df[c] = np.round(df[c].values * scale).astype(int)
        df["total_spend"] = df[CATEGORIES].sum(axis=1)
        df["dominant_category"] = df[CATEGORIES].idxmax(axis=1)

    if user_id is not None:
        df.insert(0, "user_id", user_id)
    return df


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--months", type=int, default=24, help="Number of months (>=24)")
    ap.add_argument(
        "--start",
        type=str,
        default="2023-01-01",
        help="First month (YYYY-MM-DD, day ignored)",
    )
    ap.add_argument("--users", type=int, default=1, help="Number of independent synthetic users")
    ap.add_argument("--seed", type=int, default=2026)
    ap.add_argument(
        "--output",
        type=str,
        default="",
        help="Write CSV to this path (default: ml_service/data/realistic_monthly_spend.csv)",
    )
    ap.add_argument("--print", dest="print_df", action="store_true", help="Print DataFrame head")
    args = ap.parse_args()

    n_months = max(24, args.months)
    start = pd.Timestamp(args.start).normalize()

    root = Path(__file__).resolve().parent
    out_path = (
        Path(args.output)
        if args.output
        else root / "data" / "realistic_monthly_spend.csv"
    )

    rng = np.random.default_rng(args.seed)
    frames = []
    for u in range(args.users):
        ur = np.random.default_rng(args.seed + u * 10_001)
        uid = u + 1 if args.users > 1 else None
        frames.append(generate_user_months(n_months, start, ur, uid))

    df = pd.concat(frames, ignore_index=True)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out_path, index=False)

    print(f"Wrote {len(df)} rows x {len(df.columns)} cols to {out_path}")
    print("\nSummary (total_spend INR):")
    print(df["total_spend"].describe())
    if args.print_df:
        pd.set_option("display.max_columns", None)
        pd.set_option("display.width", 200)
        print("\n", df.head(14).to_string(index=False))


if __name__ == "__main__":
    main()
