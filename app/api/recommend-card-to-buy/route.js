import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "../../lib/db";

export const dynamic = "force-dynamic";
import { verifyAuth } from "../../lib/auth";
import Transaction from "../../models/transaction";
import CreditCard from "../../models/cards";
import User from "../../models/user";
import { rankCardToBuyHybrid } from "../../lib/spendingHybridMl";
import {
  buildUpgradeComparison,
  buildMlNarrative,
  formatCategoryRateLabel,
} from "../../lib/upgradeCardToBuyInsights";

const CATEGORIES = ["shopping", "travel", "fuel", "dining", "groceries"];
const DEFAULT_MONTHLY_SPEND = 3000;
const HISTORY_WINDOW_MONTHS = 3;

const SPEND_BUCKET_VALUES = { under_10k: 8000 };
SPEND_BUCKET_VALUES["10k_30k"] = 20000;
SPEND_BUCKET_VALUES["30k_50k"] = 40000;
SPEND_BUCKET_VALUES["50k_plus"] = 60000;

function syntheticMonthlySpend(totalMonthly, topCategory) {
  const out = {};
  if (!topCategory || topCategory === "spread") {
    const perCat = totalMonthly / CATEGORIES.length;
    CATEGORIES.forEach((c) => (out[c] = perCat));
    return out;
  }
  const primary = CATEGORIES.includes(topCategory) ? topCategory : CATEGORIES[0];
  const primaryShare = 0.5;
  const restShare = 1 - primaryShare;
  const restCategories = CATEGORIES.filter((c) => c !== primary);
  const restEach = (totalMonthly * restShare) / restCategories.length;
  CATEGORIES.forEach((c) => (out[c] = c === primary ? totalMonthly * primaryShare : restEach));
  return out;
}

function getRollingMonthWindowUtc(monthCount = 3) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (monthCount - 1), 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  return { start, end };
}

async function buildTransactionCategoryCardMix(userObjId, monthlyCategorySpend) {
  const coll = CreditCard.collection.name;
  const rows = await Transaction.aggregate([
    { $match: { user: userObjId } },
    { $lookup: { from: coll, localField: "card", foreignField: "_id", as: "cd" } },
    { $unwind: { path: "$cd", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { cat: "$resolvedCategory", cid: "$card" },
        spend: { $sum: "$amount" },
        cd: { $first: "$cd" },
      },
    },
  ]);

  const totals = {};
  CATEGORIES.forEach((c) => {
    totals[c] = 0;
  });
  for (const r of rows) {
    const rawCat = r._id?.cat || "shopping";
    const cat = CATEGORIES.includes(rawCat) ? rawCat : "shopping";
    totals[cat] += r.spend || 0;
  }

  const byCategory = {};
  CATEGORIES.forEach((c) => {
    byCategory[c] = [];
  });

  for (const r of rows) {
    const rawCat = r._id?.cat || "shopping";
    const cat = CATEGORIES.includes(rawCat) ? rawCat : "shopping";
    const spend = r.spend || 0;
    const total = totals[cat] || 1;
    const cd = r.cd || {};
    const rateLabel = formatCategoryRateLabel(cd, cat);
    byCategory[cat].push({
      cardId: r._id?.cid ? String(r._id.cid) : "",
      cardName: cd.cardName || "Card",
      bank: cd.bank || "",
      spend,
      sharePercent: total > 0 ? (spend / total) * 100 : 0,
      rateLabel,
    });
  }

  CATEGORIES.forEach((c) => {
    byCategory[c].sort((a, b) => b.spend - a.spend);
  });

  const intelligenceLines = [];
  for (const c of CATEGORIES) {
    const monthSpend = Number(monthlyCategorySpend[c]) || 0;
    const yearSpend = monthSpend * 12;
    const slices = byCategory[c] || [];
    if (slices.length === 0 && monthSpend <= 0) continue;
    const summary =
      slices.length > 0
        ? slices
            .map(
              (p) =>
                `${p.sharePercent.toFixed(0)}% ${[p.bank, p.cardName].filter(Boolean).join(" ")} (${p.rateLabel})`
            )
            .join(" · ")
        : "No tagged spend on this category yet";
    intelligenceLines.push({
      category: c,
      label: c.charAt(0).toUpperCase() + c.slice(1),
      yearlySpendApprox: Math.round(yearSpend),
      summary,
    });
  }

  return { byCategory, intelligenceLines };
}

function toPayloadCard(row) {
  if (!row) return null;
  const c = row.card;
  return {
    _id: c._id,
    bank: c.bank,
    cardName: c.cardName,
    network: c.network,
    cardType: c.cardType,
    rewardType: c.rewardType,
    yearlyRewardInr: row.yearlyRewardInr,
    annualFee: row.annualFee,
    netValue: row.netValue,
    ruleAlignmentBoost: row.ruleAlignmentBoost,
    spendShapeBonus: row.spendShapeBonus,
    ruleSubtotal: row.ruleSubtotal,
    mlPredictedYearly: row.mlPredictedYearly,
    mlBoost: row.mlBoost,
    finalScore: row.finalScore,
    rewardRateText: c.rewardRateText,
    perks: c.perks || [],
    bestFor: c.bestFor || [],
  };
}

export async function GET(request) {
  try {
    await dbConnect();

    const token = request.cookies.get("authToken")?.value;
    if (!token) {
      return NextResponse.json({ message: "Please log in to get a card recommendation" }, { status: 401 });
    }

    const verified = await verifyAuth(token);
    const userId = verified?.userId;
    if (!userId) {
      return NextResponse.json(
        { message: "Invalid or expired session. Please log in again." },
        { status: 401 }
      );
    }

    const userObjId =
      mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;

    const { searchParams } = new URL(request.url);
    const goal = searchParams.get("goal") || null;
    const topCategory = searchParams.get("topCategory") || null;
    const spendBucket = searchParams.get("spendBucket") || null;

    let monthlyCategorySpend = {};
    let numMonths = 1;
    const useSynthetic =
      spendBucket && spendBucket !== "use_history" && SPEND_BUCKET_VALUES[spendBucket] != null;

    if (useSynthetic) {
      const totalMonthly = SPEND_BUCKET_VALUES[spendBucket];
      monthlyCategorySpend = syntheticMonthlySpend(totalMonthly, topCategory);
    } else {
      const { start, end } = getRollingMonthWindowUtc(HISTORY_WINDOW_MONTHS);
      const historyMatch = { user: userObjId, createdAt: { $gte: start, $lt: end } };
      const categoryAgg = await Transaction.aggregate([
        { $match: historyMatch },
        { $group: { _id: "$resolvedCategory", totalSpend: { $sum: "$amount" } } },
      ]);

      const totalByCategory = {};
      CATEGORIES.forEach((c) => (totalByCategory[c] = 0));
      categoryAgg.forEach((row) => {
        const cat = row._id || "shopping";
        if (CATEGORIES.includes(cat)) totalByCategory[cat] = row.totalSpend || 0;
      });

      const countMonthsAgg = await Transaction.aggregate([
        { $match: historyMatch },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
          },
        },
        { $count: "months" },
      ]);
      const observedMonths = Number(countMonthsAgg[0]?.months) || 0;
      numMonths = observedMonths > 0 ? HISTORY_WINDOW_MONTHS : 1;

      CATEGORIES.forEach((cat) => {
        const total = totalByCategory[cat] || 0;
        monthlyCategorySpend[cat] =
          observedMonths > 0 ? total / HISTORY_WINDOW_MONTHS || DEFAULT_MONTHLY_SPEND : DEFAULT_MONTHLY_SPEND;
      });
    }

    const totalMonthly = CATEGORIES.reduce((s, c) => s + (monthlyCategorySpend[c] || 0), 0) || 1;
    const chartData = CATEGORIES.map((category) => ({
      category,
      spend: monthlyCategorySpend[category] || 0,
      label: category.charAt(0).toUpperCase() + category.slice(1),
      share: ((monthlyCategorySpend[category] || 0) / totalMonthly) * 100,
    })).filter((d) => d.spend > 0);

    const finalChartData =
      chartData.length > 0
        ? chartData
        : CATEGORIES.map((c) => ({
            category: c,
            spend: monthlyCategorySpend[c] || 0,
            label: c.charAt(0).toUpperCase() + c.slice(1),
            share: 100 / CATEGORIES.length,
          }));

    const allCards = await CreditCard.find().lean();
    const user = await User.findById(userId).select("cards").lean();
    const ownedIds = new Set((user?.cards || []).map((id) => String(id)));

    const { topThree, xgbEnabled, excludedOwnedCount } = rankCardToBuyHybrid({
      allCards,
      monthlyCategorySpend,
      ownedIds,
      goal,
      topCategory,
      userIncome: null,
      userCreditScore: null,
    });

    const topCards = topThree.map(toPayloadCard);
    const recommendedCard = topThree[0]
      ? {
          card: topThree[0].card,
          yearlyRewardInr: topThree[0].yearlyRewardInr,
          annualFee: topThree[0].annualFee,
          netValue: topThree[0].netValue,
        }
      : null;

    const ownedOidList = [...ownedIds]
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));
    const ownedCards =
      ownedOidList.length > 0 ? await CreditCard.find({ _id: { $in: ownedOidList } }).lean() : [];

    const upgradeComparison = topThree[0]?.card
      ? buildUpgradeComparison(ownedCards, topThree[0].card, monthlyCategorySpend)
      : null;

    let transactionMix = null;
    if (!useSynthetic) {
      transactionMix = await buildTransactionCategoryCardMix(userObjId, monthlyCategorySpend);
    }

    const recName = topThree[0]?.card?.cardName || "recommended card";
    const narrative =
      upgradeComparison != null
        ? buildMlNarrative(
            finalChartData,
            recName,
            xgbEnabled,
            upgradeComparison.gapNetYearly,
            upgradeComparison.upliftPercent
          )
        : null;

    const gapNet = upgradeComparison?.gapNetYearly ?? 0;
    const monthlyBoost = Math.round(Math.max(0, gapNet) / 12);

    const upgradeAlert =
      upgradeComparison && topThree[0]
        ? {
            ...upgradeComparison,
            recommendedCardName: recName,
            recommendedBank: topThree[0].card?.bank || "",
            narrative,
            predictionLine: `Buy ${recName} · ~+\u20B9${monthlyBoost}/mo vs your current portfolio ceiling`,
            mlEngineLabel: xgbEnabled ? "XGBoost + rules" : "Rules + spend fit (ML boost off)",
            transactionMix,
            topPickMlBoost: topThree[0].mlBoost ?? 0,
            topPickMlPredictedYearly: topThree[0].mlPredictedYearly ?? 0,
          }
        : null;

    return NextResponse.json({
      monthlyCategorySpend,
      chartData: finalChartData,
      recommendedCard: toPayloadCard(topThree[0]),
      topCards,
      numMonths,
      xgbEnabled,
      excludedOwnedCount,
      rankingModel: "hybrid_rules_xgboost",
      upgradeAlert,
      ownedCardCount: ownedCards.length,
    });
  } catch (error) {
    console.error("Error in recommend-card-to-buy:", error);
    return NextResponse.json({ message: "Failed to get recommendation" }, { status: 500 });
  }
}
