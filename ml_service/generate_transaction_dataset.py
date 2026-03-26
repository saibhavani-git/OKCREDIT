#!/usr/bin/env python3
"""
Synthetic transaction dataset: optimal card vs simulated human choice.
Usage: python ml_service/generate_transaction_dataset.py [--rows N] [--chunk-rows 200000]
Requires: ml_service/data/cards.json (run: npm run ml:export-cards)
"""
from __future__ import annotations

import argparse
import csv
import json
import random
import sys
from pathlib import Path

from reward_math import CATEGORIES, col_name, compute_transaction_cashback_inr, stable_card_names

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
CARDS_PATH = DATA_DIR / "cards.json"
OUT_PATH = DATA_DIR / "transaction_training.csv"


def load_cards() -> list:
    if not CARDS_PATH.is_file():
        print(f"Missing {CARDS_PATH}. Run: npm run ml:export-cards", file=sys.stderr)
        sys.exit(1)
    return json.loads(CARDS_PATH.read_text(encoding="utf-8"))


def pick_actual_card(cards: list, cash_by_name: dict, best_name: str, rng: random.Random) -> str:
    names = [str(c.get("cardName") or "Unknown") for c in cards]
    if rng.random() < 0.7:
        return best_name
    if rng.random() < 0.5:
        return rng.choice(names)
    weights = [max(1, int(c.get("popularityScore") or 50)) for c in cards]
    return rng.choices(names, weights=weights, k=1)[0]


def write_chunk(writer, fieldnames: list, rows: list) -> None:
    for row in rows:
        writer.writerow({k: row.get(k, "") for k in fieldnames})


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--rows", type=int, default=150_000, help="Total synthetic rows")
    ap.add_argument("--chunk-rows", type=int, default=250_000, help="Flush to disk every N rows (if rows > this)")
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()
    rng = random.Random(args.seed)

    cards = load_cards()
    names = stable_card_names(cards)
    name_to_card = {str(c.get("cardName")): c for c in cards}
    cb_cols = [col_name(n) for n in names]

    fieldnames = ["category", "amount", "best_card_logic", "actual_card"] + cb_cols

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    total = args.rows
    chunk = min(args.chunk_rows, total)

    with OUT_PATH.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        buffer = []
        written = 0
        while written < total:
            batch_size = min(chunk, total - written)
            for _ in range(batch_size):
                cat = rng.choice(CATEGORIES)
                amount = round(rng.uniform(100, 20_000), 2)
                cash_by_name = {}
                for c in cards:
                    cn = str(c.get("cardName") or "Unknown")
                    cash_by_name[cn] = compute_transaction_cashback_inr(c, cat, amount)
                best_name = max(cash_by_name, key=lambda k: cash_by_name[k])
                actual = pick_actual_card(cards, cash_by_name, best_name, rng)
                row = {
                    "category": cat,
                    "amount": amount,
                    "best_card_logic": best_name,
                    "actual_card": actual,
                }
                for n in names:
                    row[col_name(n)] = cash_by_name.get(n, 0.0)
                buffer.append(row)
            write_chunk(writer, fieldnames, buffer)
            written += len(buffer)
            buffer.clear()
            print(f"Wrote {written}/{total} rows...", flush=True)

    print(f"Saved {OUT_PATH} ({total} rows, {len(names)} card columns)")


if __name__ == "__main__":
    main()
