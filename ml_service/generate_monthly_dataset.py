#!/usr/bin/env python3
"""Synthetic monthly spend profiles → best_card_logic (max total ₹ reward)."""
from __future__ import annotations

import argparse
import csv
import json
import random
import sys
from pathlib import Path

from reward_math import CATEGORIES, compute_transaction_cashback_inr, stable_card_names

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
CARDS_PATH = DATA_DIR / "cards.json"
OUT_PATH = DATA_DIR / "monthly_training.csv"


def load_cards() -> list:
    if not CARDS_PATH.is_file():
        print(f"Missing {CARDS_PATH}", file=sys.stderr)
        sys.exit(1)
    return json.loads(CARDS_PATH.read_text(encoding="utf-8"))


def best_card_for_monthly(cards: list, spends: dict) -> str:
    best_n = None
    best_v = -1.0
    for c in cards:
        cn = str(c.get("cardName") or "Unknown")
        total = 0.0
        for cat in CATEGORIES:
            amt = float(spends.get(cat, 0) or 0)
            if amt > 0:
                total += compute_transaction_cashback_inr(c, cat, amt)
        if total > best_v:
            best_v = total
            best_n = cn
    return best_n or "Unknown"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--rows", type=int, default=25_000)
    ap.add_argument("--seed", type=int, default=7)
    args = ap.parse_args()
    rng = random.Random(args.seed)
    cards = load_cards()
    names = stable_card_names(cards)

    fieldnames = (
        ["total_spend"]
        + [f"spend_{c}" for c in CATEGORIES]
        + ["best_card_logic", "most_used_card_sim"]
    )

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with OUT_PATH.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for _ in range(args.rows):
            profile = {c: rng.uniform(0, 1) for c in CATEGORIES}
            s = sum(profile.values()) or 1.0
            monthly = 8_000 + rng.random() * 52_000
            spends = {c: monthly * (profile[c] / s) for c in CATEGORIES}
            total = sum(spends.values())
            logic_best = best_card_for_monthly(cards, spends)
            # Simulated “most used” from shorter behavioral sequence
            picks = []
            for _t in range(15):
                cat = rng.choice(CATEGORIES)
                amt = spends[cat] / max(3, rng.randint(3, 10))
                cash = {str(c.get("cardName")): compute_transaction_cashback_inr(c, cat, amt) for c in cards}
                bst = max(cash, key=lambda k: cash[k])
                if rng.random() < 0.72:
                    picks.append(bst)
                elif rng.random() < 0.5:
                    picks.append(rng.choice(names))
                else:
                    wts = [max(1, int(c.get("popularityScore") or 50)) for c in cards]
                    picks.append(rng.choices(names, weights=wts, k=1)[0])
            mode = max(set(picks), key=picks.count)
            row = {
                "total_spend": round(total, 2),
                **{f"spend_{c}": round(spends[c], 2) for c in CATEGORIES},
                "best_card_logic": logic_best,
                "most_used_card_sim": mode,
            }
            w.writerow(row)
    print(f"Saved {OUT_PATH} ({args.rows} rows)")


if __name__ == "__main__":
    main()
