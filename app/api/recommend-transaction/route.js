import { NextResponse } from "next/server";
import dbConnect from "../../lib/db";
import CreditCard from "../../models/cards";
import creditCardsSeed from "../../data/creditCards.js";
import {
  computeRewardsForAllCards,
} from "../../lib/transactionRewardEngine.js";

const ML_BASE = process.env.ML_FASTAPI_URL || "http://127.0.0.1:8000";

function reasonLine({ category, normCashback, mlProb }) {
  const bits = [];
  if (normCashback >= 0.85) bits.push(`Strong earn for ${category}`);
  else if (normCashback >= 0.5) bits.push(`Competitive on ${category}`);
  if (mlProb >= 0.2) bits.push("similar users often pick this card");
  else bits.push("rules-first pick");
  return `${bits[0]} · ${bits[1] || "balanced hybrid score"}`;
}

/**
 * Hybrid: 0.7 × normalized rule cashback + 0.3 × ML class probability (when FastAPI is up).
 * POST { category: "shopping", amount: 5000 }
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const category = String(body?.category || "shopping").toLowerCase();
    const amount = Number(body?.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ message: "Valid category and amount are required" }, { status: 400 });
    }

    let cards = [];
    try {
      await dbConnect();
      const fromDb = await CreditCard.find({}).lean();
      if (fromDb?.length) cards = fromDb;
    } catch {
      /* use seed */
    }
    if (!cards.length) cards = creditCardsSeed;

    const rewardRows = computeRewardsForAllCards(cards, { category, amount });
    const cashbacks = Object.fromEntries(rewardRows.map((r) => [r.card, r.cashback]));
    const maxCb = Math.max(...rewardRows.map((r) => r.cashback), 1e-9);

    let probabilities = {};
    let mlAvailable = false;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(`${ML_BASE.replace(/\/$/, "")}/predict-transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, amount, cashbacks }),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (res.ok) {
        const data = await res.json();
        probabilities = data.probabilities || {};
        mlAvailable = true;
      }
    } catch {
      /* ML service optional */
    }

    const nCards = rewardRows.length || 1;
    const uniform = 1 / nCards;

    const merged = rewardRows.map((r) => {
      const normCashback = r.cashback / maxCb;
      const mlProb = Number(probabilities[r.card]);
      const p = Number.isFinite(mlProb) ? mlProb : uniform;
      const finalScore = Number((0.7 * normCashback + 0.3 * p).toFixed(4));
      return {
        name: r.card,
        cashback: Number(r.cashback.toFixed(2)),
        ml_score: Math.round(p * 1000) / 1000,
        ml_score_percent: Math.round(p * 100),
        final_score: finalScore,
        reason: reasonLine({
          category,
          normCashback,
          mlProb: p,
        }),
      };
    });

    merged.sort((a, b) => b.final_score - a.final_score);
    const top = merged.slice(0, 3);

    return NextResponse.json({
      cards: top,
      ml_service: mlAvailable,
      hybrid_weights: { rules: 0.7, ml: 0.3 },
    });
  } catch (e) {
    console.error("[recommend-transaction]", e);
    return NextResponse.json({ message: "Failed to build recommendation" }, { status: 500 });
  }
}
