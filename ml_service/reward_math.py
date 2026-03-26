"""Mirror of app/lib/recommendCard.js logic for dataset generation & sanity checks."""
from __future__ import annotations

import math
from typing import Any, Dict, Tuple

CATEGORIES = ("shopping", "travel", "fuel", "dining", "groceries")


def _normalize_cat(val: Any) -> Tuple[float, float]:
    if val is None:
        return 0.0, math.inf
    if isinstance(val, (int, float)):
        return float(val), math.inf
    if isinstance(val, dict):
        r = float(val.get("rate") or 0)
        cap = val.get("maxCap")
        if cap is not None and math.isfinite(float(cap)) and float(cap) >= 0:
            return r, float(cap)
        return r, math.inf
    return 0.0, math.inf


def get_reward_rate(card: Dict[str, Any], category: str) -> Tuple[float, float]:
    cats = card.get("categories") or {}
    if category in cats:
        return _normalize_cat(cats[category])
    base = float(card.get("baseRewardRate") or 0)
    return base, math.inf


def calculate_reward(rate: float, amount: float, max_cap: float) -> float:
    if not (math.isfinite(rate) and math.isfinite(amount)) or amount <= 0:
        return 0.0
    raw = (amount * rate) / 100.0
    if math.isfinite(max_cap) and max_cap >= 0:
        return min(raw, max_cap)
    return raw


def reward_to_inr(card: Dict[str, Any], raw_reward: float) -> float:
    t = str(card.get("rewardType") or "").lower()
    if t == "cashback":
        return float(raw_reward or 0)
    pv = float(card.get("pointValueInr") or 0)
    if not (math.isfinite(pv) and pv > 0):
        pv = 0.25
    return float(raw_reward or 0) * pv


def compute_transaction_cashback_inr(card: Dict[str, Any], category: str, amount: float) -> float:
    category = (category or "shopping").lower()
    amount = float(amount or 0)
    if amount <= 0:
        return 0.0
    rate, max_cap = get_reward_rate(card, category)
    raw = calculate_reward(rate, amount, max_cap)
    return round(reward_to_inr(card, raw), 4)


def stable_card_names(cards: list) -> list:
    return sorted([str(c.get("cardName") or "Unknown") for c in cards])


def col_name(card_name: str) -> str:
    s = "".join(ch if ch.isalnum() or ch in " _-" else "_" for ch in card_name)
    return "cb_" + s.replace(" ", "_").replace("__", "_")
