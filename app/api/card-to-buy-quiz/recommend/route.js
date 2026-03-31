import { NextResponse } from "next/server";
import dbConnect from "../../../lib/db";
import { verifyAuth } from "../../../lib/auth";
import User from "../../../models/user";
import CreditCard from "../../../models/cards";
import { recommendCardToBuy } from "../../../lib/cardToBuyRecommender";

export const dynamic = "force-dynamic";

const CATEGORIES = ["shopping", "travel", "fuel", "dining", "groceries"];
const INCOME_BUCKET_VALUES = {
  under_3l: 250000,
  "3l_6l": 450000,
  "6l_12l": 900000,
  "12l_plus": 1500000,
};

function synthMonthlySplit(total, topCategory) {
  const out = {};
  if (!topCategory || topCategory === "spread" || !CATEGORIES.includes(topCategory)) {
    const each = total / CATEGORIES.length;
    CATEGORIES.forEach((c) => (out[c] = each));
    return out;
  }
  const mainShare = 0.5;
  const restEach = (total * (1 - mainShare)) / (CATEGORIES.length - 1);
  CATEGORIES.forEach((c) => (out[c] = c === topCategory ? total * mainShare : restEach));
  return out;
}

function computeSmartMatchPercents(rows, incomeValue) {
  if (!rows?.length) return [];
  const keys = rows.map((r) => Number(r.sortScore) || Number(r.netValue) || 0);
  const maxK = Math.max(...keys, 1);
  const minK = Math.min(...keys);
  const span = Math.max(maxK - minK, maxK * 0.025);
  return rows.map((r, i) => {
    const k = keys[i];
    const t = span > 0 ? (k - minK) / span : Math.max(0, 1 - i * 0.05);
    const minIncome = Number(r?.card?.eligibility?.minIncome) || 0;
    const incomePenalty =
      incomeValue && minIncome > incomeValue ? Math.min(14, Math.ceil((minIncome - incomeValue) / 100000) * 3) : 0;
    const raw = 66 + t * 24 - i * 2.5 - incomePenalty;
    return Math.round(Math.min(97, Math.max(60, raw)));
  });
}

function toPayload(item, idx, matchPercents, topCategory) {
  if (!item) return null;
  return {
    _id: item.card._id,
    bank: item.card.bank,
    cardName: item.card.cardName,
    network: item.card.network,
    cardType: item.card.cardType,
    rewardType: item.card.rewardType,
    yearlyRewardInr: Math.round((Number(item.yearlyRewardInr) || 0) * 100) / 100,
    annualFee: Number(item.annualFee) || 0,
    netValue: Math.round((Number(item.netValue) || 0) * 100) / 100,
    rewardRateText: item.card.rewardRateText,
    perks: item.card.perks || [],
    bestFor: item.card.bestFor || [],
    smartMatchPercent: matchPercents[idx] ?? 75,
    aiBoostInr: idx === 0 ? Math.max(0, Math.round((Number(item.sortScore) || 0) * 0.015)) : 0,
    matchesLine: item.card.rewardRateText || `Good fit for ${topCategory || "your"} spend profile`,
    whyRankOne: idx === 0 ? "Highest simulated net value for your quiz inputs" : null,
    sparkleLine: Number(item.annualFee) <= 0 ? "No annual fee • Easy redeem" : "Competitive rewards • Easy redeem",
  };
}

export async function GET(request) {
  try {
    await dbConnect();
    const token = request.cookies.get("authToken")?.value;
    if (!token) return NextResponse.json({ message: "Please log in to get recommendations" }, { status: 401 });

    const verified = await verifyAuth(token);
    const userId = verified?.userId;
    if (!userId) return NextResponse.json({ message: "Invalid session. Please log in again." }, { status: 401 });

    const user = await User.findById(userId).select("cards").lean();
    const userCardIds = (user?.cards || []).map((id) => (id && id._id ? id._id : id)).filter(Boolean);

    const { searchParams } = new URL(request.url);
    const rewardType = searchParams.get("rewardType") || null;
    const cardType = searchParams.get("cardType") || null;
    const topCategory = searchParams.get("topCategory") || null;
    const preferredNetwork = searchParams.get("preferredNetwork") || null;
    const monthlySpendRaw = Number(searchParams.get("monthlySpend"));
    const incomeBucket = searchParams.get("incomeBucket") || "3l_6l";
    const incomeValue = INCOME_BUCKET_VALUES[incomeBucket] || 450000;

    const totalMonthly =
      Number.isFinite(monthlySpendRaw) && monthlySpendRaw > 0
        ? Math.min(200000, Math.max(1000, monthlySpendRaw))
        : 20000;
    const monthlyCategorySpend = synthMonthlySplit(totalMonthly, topCategory || "spread");

    let cards = await CreditCard.find(userCardIds.length ? { _id: { $nin: userCardIds } } : {}).lean();
    if (rewardType) cards = cards.filter((c) => String(c.rewardType || "").toLowerCase() === String(rewardType).toLowerCase());
    if (cardType) cards = cards.filter((c) => String(c.cardType || "") === String(cardType));
    if (preferredNetwork) cards = cards.filter((c) => String(c.network || "").toLowerCase() === String(preferredNetwork).toLowerCase());
    if (!cards.length) cards = await CreditCard.find(userCardIds.length ? { _id: { $nin: userCardIds } } : {}).lean();

    const goal = cardType || rewardType || null;
    const { recommendedCard, allSimulations } = recommendCardToBuy(cards, monthlyCategorySpend, incomeValue, null, {
      goal,
      topCategory,
    });

    const chartData = CATEGORIES.map((category) => ({
      category,
      spend: monthlyCategorySpend[category] || 0,
      label: category.charAt(0).toUpperCase() + category.slice(1),
      share: ((monthlyCategorySpend[category] || 0) / totalMonthly) * 100,
    }));

    const topSlice = (allSimulations || []).slice(0, 5);
    const matchPercents = computeSmartMatchPercents(topSlice, incomeValue);
    const topCards = topSlice.map((item, idx) => toPayload(item, idx, matchPercents, topCategory));

    const quizSummary = `${rewardType || "Rewards"} focus, ${topCategory || "mixed"} spend · ~₹${Math.round(totalMonthly).toLocaleString("en-IN")}/mo`;

    return NextResponse.json({
      chartData,
      quizSummary,
      income: incomeValue,
      recommendedCard: toPayload(recommendedCard, 0, matchPercents, topCategory),
      topCards,
    });
  } catch (error) {
    console.error("card-to-buy-quiz recommend:", error);
    return NextResponse.json({ message: "Failed to get recommendations" }, { status: 500 });
  }
}

