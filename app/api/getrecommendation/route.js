import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "../../lib/db";
import User from "../../models/user";
import CreditCard from "../../models/cards";
import Offer from "../../models/offers";
import Transaction from "../../models/transaction";
import { verifyAuth } from "../../lib/auth";
import { recommendCard } from "../../lib/recommendCard";

/** Check if an offer applies to this card (validCards contains bank + cardName). */
function offerAppliesToCard(offer, card) {
  const validCards = offer.validCards || [];
  const cardBank = (card.bank || "").toString().trim();
  const cardName = (card.cardName || "").toString().trim();
  return validCards.some(
    (v) =>
      (v.bank || "").toString().trim() === cardBank &&
      (v.cardName || "").toString().trim() === cardName
  );
}

/**
 * Get offer value in INR for this transaction.
 * rewardValue: for CASHBACK/DISCOUNT treated as INR; for REWARD_POINTS treated as points, converted via pointValueInr.
 * Capped by maxRewardCap if set. Only applies if amount >= minTransactionAmount.
 */
function getOfferValueInr(offer, card, amount) {
  const minAmount = Number(offer.minTransactionAmount) || 0;
  if (amount < minAmount) return 0;
  let value = Number(offer.rewardValue) || 0;
  const rewardType = (offer.rewardType || "").toUpperCase();
  if (rewardType === "REWARD_POINTS") {
    const pointValueInr = Number(card.pointValueInr) > 0 ? Number(card.pointValueInr) : 0.25;
    value = value * pointValueInr;
  }
  const cap = Number(offer.maxRewardCap);
  if (Number.isFinite(cap) && cap >= 0) value = Math.min(value, cap);
  return value;
}

// Intent → transaction category for reward lookup
const INTENT_TO_CATEGORY = {
  "daily-expenses": "shopping",
  "online-shopping": "shopping",
  "travel-bookings": "travel",
  "fuel-savings": "fuel",
  "dining-lifestyle": "dining",
  "grocery-bills": "groceries",
  "build-credit": "shopping",
  "high-rewards": "shopping",
  "business-expenses": "travel",
  "low-interest": "shopping",
  cashback: "shopping",
  travel: "travel",
  fuel: "fuel",
  "online shopping": "shopping",
  dining: "dining",
  groceries: "groceries",
  "rewards points": "shopping",
  "travel miles": "travel",
  shopping: "shopping",
  basic: "shopping",
};

export async function POST(request) {
  try {
    await dbConnect();

    const token = request.cookies.get("authToken")?.value;
    let user = null;
    if (token) {
      try {
        const { userId } = await verifyAuth(token);
        if (userId) {
          user = await User.findById(userId).populate("cards").lean();
        }
      } catch {
        user = null;
      }
    }

    const userCards = user?.cards?.length ? user.cards : [];
    if (!userCards.length) {
      return NextResponse.json(
        { message: "No user cards found. Please add your cards first in My Cards." },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { amount: requestAmount, intent, merchant } = body;

    if (!requestAmount || !intent) {
      return NextResponse.json(
        { message: "Amount and intent are required" },
        { status: 400 }
      );
    }

    const amount = parseFloat(requestAmount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { message: "Valid amount is required" },
        { status: 400 }
      );
    }

    const category = INTENT_TO_CATEGORY[(intent || "").toLowerCase()] ?? "shopping";
    const merchantName = typeof merchant === "string" ? merchant.trim() : "";

    // Fetch all cards from catalog and merge user limits for owned cards
    const allCardsFromDb = await CreditCard.find().lean();
    const userOwnedCards = userCards.map((c) => (c.cardName || "").toString().trim()).filter(Boolean);
    const allCards = allCardsFromDb.map((card) => {
      const userCard = userCards.find(
        (uc) => String(uc._id) === String(card._id)
      );
      return userCard
        ? { ...card, limits: userCard.limits ?? card.limits }
        : card;
    });

    const userObjId = mongoose.Types.ObjectId.isValid(user._id)
      ? new mongoose.Types.ObjectId(String(user._id))
      : user._id;
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const usedAgg = await Transaction.aggregate([
      {
        $match: {
          user: userObjId,
          createdAt: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: "$card",
          usedInr: {
            $sum: {
              $add: [{ $ifNull: ["$cashback", 0] }, { $ifNull: ["$rewardsValue", 0] }],
            },
          },
        },
      },
    ]);
    const usedMonthlyRewardInrByCardId = {};
    for (const row of usedAgg) {
      usedMonthlyRewardInrByCardId[String(row._id)] = Number(row.usedInr) || 0;
    }

    const result = recommendCard(category, amount, merchantName, userOwnedCards, allCards, {
      usedMonthlyRewardInrByCardId,
    });

    // Fetch active offers (valid now) to add to card benefits
    const now = new Date();
    const activeOffers = await Offer.find({
      isActive: true,
      validFrom: { $lte: now },
      validTill: { $gte: now },
    }).lean();

    // Build UI list from top owned cards (so user can "Pay" with them)
    // Include offer value: perksValue = sum of applicable offer values; totalBenefit = base reward + perksValue
    const pointValueInr = (card) =>
      Number(card?.pointValueInr) > 0 ? Number(card.pointValueInr) : 0.25;
    const cards = (result.topOwnedCards || []).map((r) => {
      const c = r.card || {};
      const rawReward = Number(r.expectedReward) || 0;
      const rewardInr = Number(r.expectedRewardInr) ?? (rawReward * (c.rewardType === "cashback" ? 1 : pointValueInr(c)));
      const isCashback = c.rewardType === "cashback";
      const cashback = isCashback ? rawReward : 0;
      const rewards = !isCashback ? rawReward : 0;
      const rewardsValue = !isCashback ? rewardInr : 0;

      // Sum applicable offer values for this card (from offers database); dedupe by description
      let perksValue = 0;
      const offerByDesc = {};
      for (const offer of activeOffers) {
        if (!offerAppliesToCard(offer, c)) continue;
        const value = getOfferValueInr(offer, c, amount);
        if (value > 0) {
          const desc = (offer.description || "").trim() || "Offer";
          offerByDesc[desc] = (offerByDesc[desc] || 0) + value;
        }
      }
      const appliedOffers = Object.entries(offerByDesc).map(([description, value]) => ({ description, value }));
      perksValue = appliedOffers.reduce((sum, o) => sum + o.value, 0);

      const totalBenefit = rewardInr + perksValue;
      return {
        ...c,
        _id: c._id?.toString?.() ?? c._id,
        expectedReward: rawReward,
        expectedRewardInr: rewardInr,
        score: r.score,
        cashback,
        rewards,
        rewardsValue,
        perksValue,
        totalBenefit,
        appliedOffers,
        fitReason: isCashback
          ? `Expected cashback ₹${rawReward.toFixed(2)}`
          : `Expected ${rawReward.toFixed(0)} pts (₹${rewardInr.toFixed(2)} value)`,
        monthlyCapHit: Boolean(r.monthlyCapHit),
      };
    });

    return NextResponse.json({
      bestOwnedCard: result.bestOwnedCard,
      bestOverallCard: result.bestOverallCard,
      recommendedCards: result.recommendedCards,
      cards,
      cardIds: cards.map((c) => c._id),
      resolvedCategory: category,
      message: `Best for you: ${result.bestOwnedCard?.cardName ?? "—"}. Top overall: ${result.bestOverallCard?.cardName ?? "—"} for ₹${amount.toLocaleString("en-IN")} · ${category}`,
    });
  } catch (error) {
    console.error("Error generating recommendation:", error);
    return NextResponse.json(
      { message: "Failed to generate recommendation" },
      { status: 500 }
    );
  }
}
