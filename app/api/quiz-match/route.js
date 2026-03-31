import { NextResponse } from "next/server";
import dbConnect from "../../lib/db";
import CreditCard from "../../models/cards";
import creditCardsSeed from "../../data/creditCards.js";
import {
  buildUserFeatureVector,
  rankCardsByQuizMatch,
} from "../../lib/quizFeatureMatch.js";

export const dynamic = "force-dynamic";

/**
 * POST /api/quiz-match
 * Body JSON:
 * {
 *   "categoryWeights": { "shopping": 0.4, "travel": 0.2, ... },  // optional; sums normalized
 *   "topCategory": "shopping",  // optional if weights missing
 *   "rewardPreference": "cashback" | "points" | "miles",
 *   "feePreference": "no_fee" | "low_fee" | "flexible",
 *   "perks": ["LOUNGE_ACCESS", "FUEL_WAIVER"]
 * }
 * Returns top 5 cards by match % with light payload for UI.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));

    const input = {
      categoryWeights: body.categoryWeights,
      topCategory: body.topCategory,
      rewardPreference: body.rewardPreference || "cashback",
      feePreference: body.feePreference || "flexible",
      perks: Array.isArray(body.perks) ? body.perks : [],
    };

    let cards = [];
    try {
      await dbConnect();
      const fromDb = await CreditCard.find({}).lean();
      if (fromDb?.length) cards = fromDb;
    } catch {
      /* seed */
    }
    if (!cards.length) cards = creditCardsSeed;

    const ranked = rankCardsByQuizMatch(input, cards);
    const top5 = ranked.slice(0, 5).map((r, i) => ({
      rank: i + 1,
      matchPercent: r.matchPercent,
      bank: r.card.bank,
      cardName: r.card.cardName,
      network: r.card.network,
      cardType: r.card.cardType,
      rewardType: r.card.rewardType,
      annualFee: r.card.fees?.annual ?? 0,
      rewardRateText: r.card.rewardRateText,
      perks: r.card.perks || [],
      bestFor: r.card.bestFor || [],
      breakdown: {
        userCategoryWeights: r.breakdown.userCategoryWeights,
        cardCategoryRates: r.breakdown.categoryRates,
      },
    }));

    const payload = {
      topCards: top5,
      userProfile: {
        rewardPreference: input.rewardPreference,
        feePreference: input.feePreference,
        perks: input.perks,
      },
    };

    if (body.includeFeatureVectors) {
      const { vector, meta } = buildUserFeatureVector(input);
      payload.normalizedFeatureVector = vector;
      payload.featureMeta = meta;
    }

    return NextResponse.json(payload);
  } catch (e) {
    console.error("[quiz-match]", e);
    return NextResponse.json(
      { message: "Failed to compute quiz match" },
      { status: 500 }
    );
  }
}
