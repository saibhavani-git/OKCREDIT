import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "../../../lib/db";
import { verifyAuth } from "../../../lib/auth";
import User from "../../../models/user";
import CreditCard from "../../../models/cards";
import { recommendCardToBuy } from "../../../lib/cardToBuyRecommender";

export const dynamic = "force-dynamic";

const CATEGORIES = ["shopping", "travel", "fuel", "dining", "groceries"];

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

/**
 * GET: Returns card recommendations based on quiz answers.
 * Only returns cards the user does NOT already have.
 * Query: rewardType, cardType, topCategory, spendBucket.
 */
export async function GET(request) {
  try {
    await dbConnect();

    const token = request.cookies.get("authToken")?.value;
    if (!token) {
      return NextResponse.json(
        { message: "Please log in to get recommendations" },
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

    const user = await User.findById(userId).select("cards").lean();
    const userCardIds = (user?.cards || []).map((id) => (id && id._id ? id._id : id)).filter(Boolean);

    const { searchParams } = new URL(request.url);
    const rewardType = searchParams.get("rewardType") || null;
    const cardType = searchParams.get("cardType") || null;
    const topCategory = searchParams.get("topCategory") || null;
    const spendBucket = searchParams.get("spendBucket") || "10k_30k";

    const totalMonthly =
      spendBucket && SPEND_BUCKET_VALUES[spendBucket] != null
        ? SPEND_BUCKET_VALUES[spendBucket]
        : 20000;
    const monthlyCategorySpend = syntheticMonthlySpend(totalMonthly, topCategory || "spread");

    let cards = await CreditCard.find(
      userCardIds.length ? { _id: { $nin: userCardIds } } : {}
    ).lean();

    if (rewardType) {
      cards = cards.filter(
        (c) => String(c.rewardType || "").toLowerCase() === String(rewardType).toLowerCase()
      );
    }
    if (cardType) {
      cards = cards.filter((c) => String(c.cardType || "") === String(cardType));
    }
    if (cards.length === 0) {
      cards = await CreditCard.find(
        userCardIds.length ? { _id: { $nin: userCardIds } } : {}
      ).lean();
    }

    const goalMap = {
      Travel: "travel_rewards",
      Cashback: "cash_back",
      Fuel: "fuel",
      Shopping: "everyday",
      Basic: "everyday",
      Lifestyle: "dining",
    };
    const goal = (cardType && goalMap[cardType]) || cardType || rewardType || null;
    const { recommendedCard, allSimulations } = recommendCardToBuy(
      cards,
      monthlyCategorySpend,
      null,
      null,
      { goal, topCategory }
    );

    const totalMonthlySum = CATEGORIES.reduce((s, c) => s + (monthlyCategorySpend[c] || 0), 0) || 1;
    const chartData = CATEGORIES.map((category) => ({
      category,
      spend: monthlyCategorySpend[category] || 0,
      label: category.charAt(0).toUpperCase() + category.slice(1),
      share: ((monthlyCategorySpend[category] || 0) / totalMonthlySum) * 100,
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

    const toPayload = (item) =>
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

    const topCards = allSimulations.slice(0, 5).map(toPayload);

    return NextResponse.json({
      chartData: finalChartData,
      recommendedCard: toPayload(recommendedCard),
      topCards,
    });
  } catch (error) {
    console.error("card-to-buy-quiz recommend:", error);
    return NextResponse.json(
      { message: "Failed to get recommendations" },
      { status: 500 }
    );
  }
}
