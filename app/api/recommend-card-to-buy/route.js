import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "../../lib/db";
import { verifyAuth } from "../../lib/auth";
import Transaction from "../../models/transaction";
import CreditCard from "../../models/cards";
import { recommendCardToBuy } from "../../lib/cardToBuyRecommender";

const CATEGORIES = ["shopping", "travel", "fuel", "dining", "groceries"];
const DEFAULT_MONTHLY_SPEND = 3000; // fallback per category when no history

/** Spend bucket id -> total monthly amount (₹). Keys that start with a number use bracket assignment. */
const SPEND_BUCKET_VALUES = { under_10k: 8000 };
SPEND_BUCKET_VALUES["10k_30k"] = 20000;
SPEND_BUCKET_VALUES["30k_50k"] = 40000;
SPEND_BUCKET_VALUES["50k_plus"] = 60000;

/** Build synthetic monthly category spend from quiz: total and primary category. */
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

export async function GET(request) {
  try {
    await dbConnect();

    const token = request.cookies.get("authToken")?.value;
    if (!token) {
      return NextResponse.json(
        { message: "Please log in to get a card recommendation" },
        { status: 401 }
      );
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
    const useSynthetic = spendBucket && spendBucket !== "use_history" && SPEND_BUCKET_VALUES[spendBucket] != null;

    if (useSynthetic) {
      const totalMonthly = SPEND_BUCKET_VALUES[spendBucket];
      monthlyCategorySpend = syntheticMonthlySpend(totalMonthly, topCategory);
    } else {
      // 1. Category-wise spend from all user transactions
      const categoryAgg = await Transaction.aggregate([
        { $match: { user: userObjId } },
        { $group: { _id: "$resolvedCategory", totalSpend: { $sum: "$amount" } } },
      ]);

      const totalByCategory = {};
      CATEGORIES.forEach((c) => (totalByCategory[c] = 0));
      categoryAgg.forEach((row) => {
        const cat = row._id || "shopping";
        if (CATEGORIES.includes(cat)) totalByCategory[cat] = row.totalSpend || 0;
      });

      // 2. Monthly category spending (average over months with data)
      const countMonthsAgg = await Transaction.aggregate([
        { $match: { user: userObjId } },
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
      numMonths = Math.max(1, countMonthsAgg[0]?.months ?? 1);

      CATEGORIES.forEach((cat) => {
        const total = totalByCategory[cat] || 0;
        monthlyCategorySpend[cat] = total / numMonths || DEFAULT_MONTHLY_SPEND;
      });
    }

    // 3. Chart data for pie (monthly spend by category)
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

    // 4–8. Fetch all cards, simulate, filter by eligibility, pick best (with goal/topCategory boost)
    const allCards = await CreditCard.find().lean();
    const { recommendedCard, allSimulations } = recommendCardToBuy(
      allCards,
      monthlyCategorySpend,
      null,
      null,
      { goal, topCategory }
    );

    const toPayloadCard = (item) =>
      item
        ? {
            _id: item.card._id,
            bank: item.card.bank,
            cardName: item.card.cardName,
            network: item.card.network,
            cardType: item.card.cardType,
            rewardType: item.card.rewardType,
            yearlyRewardInr: Math.round(item.yearlyRewardInr * 100) / 100,
            annualFee: item.annualFee,
            netValue: Math.round(item.netValue * 100) / 100,
            rewardRateText: item.card.rewardRateText,
            perks: item.card.perks || [],
            bestFor: item.card.bestFor || [],
          }
        : null;

    const topCards = allSimulations.slice(0, 3).map(toPayloadCard);

    const payload = {
      monthlyCategorySpend,
      chartData: finalChartData,
      recommendedCard: toPayloadCard(recommendedCard),
      topCards,
      numMonths,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error in recommend-card-to-buy:", error);
    return NextResponse.json(
      { message: "Failed to get recommendation" },
      { status: 500 }
    );
  }
}
