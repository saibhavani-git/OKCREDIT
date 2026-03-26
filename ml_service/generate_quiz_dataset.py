#!/usr/bin/env python3
"""Synthetic quiz-like rows for explainable DecisionTree."""
from __future__ import annotations

import argparse
import csv
import json
import random
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
CARDS_PATH = DATA_DIR / "cards.json"
OUT_PATH = DATA_DIR / "quiz_training.csv"


def load_cards() -> list:
    if not CARDS_PATH.is_file():
        print(f"Missing {CARDS_PATH}", file=sys.stderr)
        sys.exit(1)
    return json.loads(CARDS_PATH.read_text(encoding="utf-8"))


def pick_target_card(cards: list, travel: int, shop: int, dining: int, fuel: int, grocery: int, income: int, bank: str, rng: random.Random):
    """Rule-based label + noise."""
    eligible = [
        c
        for c in cards
        if float(c.get("eligibility", {}).get("minIncome") or 0) <= income + rng.randint(-5000, 5000)
    ]
    if not eligible:
        eligible = cards
    pool = [c for c in eligible if (c.get("bank") or "") == bank] or eligible

    def score_card(c):
        t = str(c.get("rewardType") or "").lower()
        ct = str(c.get("cardType") or "").lower()
        s = 0
        if travel >= 70 and (t == "miles" or ct == "travel"):
            s += 40
        if shop >= 70 and t == "cashback":
            s += 35
        bf = " ".join(str(x) for x in (c.get("bestFor") or [])).lower()
        if dining >= 65 and (ct in ("lifestyle", "dining") or "dining" in bf):
            s += 25
        if fuel >= 65 and ct == "fuel":
            s += 25
        if grocery >= 60:
            s += 10
        s += (float(c.get("popularityScore") or 50) / 100.0) * 8
        return s + rng.random() * 6

    best = max(pool, key=score_card)
    if rng.random() < 0.12:
        return rng.choice(eligible)
    return best


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--rows", type=int, default=8000)
    ap.add_argument("--seed", type=int, default=99)
    args = ap.parse_args()
    rng = random.Random(args.seed)
    cards = load_cards()
    banks = list({str(c.get("bank") or "Any") for c in cards})

    fields = [
        "travel_score",
        "shopping_score",
        "dining_score",
        "fuel_score",
        "groceries_score",
        "income",
        "preferred_bank",
        "target_card",
    ]
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with OUT_PATH.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for _ in range(args.rows):
            vec = [rng.randint(0, 100) for _ in range(5)]
            ssum = sum(vec) or 1
            vec = [round(v * 100 / ssum) for v in vec]
            income = rng.choice([25000, 35000, 50000, 75000, 120000, 200000])
            bank = rng.choice(banks)
            tgt = pick_target_card(
                cards,
                vec[0],
                vec[1],
                vec[2],
                vec[3],
                vec[4],
                income,
                bank,
                rng,
            )
            w.writerow(
                {
                    "travel_score": vec[0],
                    "shopping_score": vec[1],
                    "dining_score": vec[2],
                    "fuel_score": vec[3],
                    "groceries_score": vec[4],
                    "income": income,
                    "preferred_bank": bank,
                    "target_card": str(tgt.get("cardName") or "Unknown"),
                }
            )
    print(f"Saved {OUT_PATH}")


if __name__ == "__main__":
    main()
