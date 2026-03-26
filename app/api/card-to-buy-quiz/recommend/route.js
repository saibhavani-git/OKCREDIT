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

const REWARD_ARCHETYPE = {
  cashback: "Cashback lover",
  points: "Points optimizer",
  miles: "Travel miles seeker",
};

const TOP_CATEGORY_PHRASE = {
  shopping: "online shopping",
  travel: "travel & holidays",
  fuel: "fuel & drives",
  dining: "dining out",
  groceries: "groceries",
  spread: "all-round spending",
};

const SPEND_PROFILE_LABEL = {
  under_10k: "~₹8k/mo spend profile",
  "10k_30k": "~₹20k/mo spend profile",
  "30k_50k": "~₹40k/mo spend profile",
  "50k_plus": "~₹60k/mo spend profile",
};

function buildQuizSummary(rewardType, topCategory, spendBucket) {
  const arch =
    REWARD_ARCHETYPE[String(rewardType || "").toLowerCase()] ||
    (rewardType ? `${rewardType} fan` : "Your picks");
  const cat =
    TOP_CATEGORY_PHRASE[topCategory] ||
    (topCategory ? `${topCategory} focus` : "mixed categories");
  const spendBit = SPEND_PROFILE_LABEL[spendBucket] || "";
  const core = `${arch}, ${cat}`;
  return spendBit ? `${core} · ${spendBit}` : core;
}

function normalizeCategoryValue(val) {
  if (val == null) return { rate: 0 };
  if (typeof val === "number") return { rate: val };
  return { rate: Number(val.rate) || 0 };
}

function matchesLineFromCard(card, topCategory) {
  const t = (card?.rewardRateText || "").trim();
  if (t) return t;
  const cat =
    topCategory && topCategory !== "spread" && CATEGORIES.includes(topCategory)
      ? topCategory
      : "shopping";
  const { rate } = normalizeCategoryValue(card?.categories?.[cat]);
  const base = Number(card?.baseRewardRate) || 0;
  const r = Number.isFinite(rate) && rate > 0 ? rate : base;
  const rt = String(card?.rewardType || "").toLowerCase();
  const label = cat.charAt(0).toUpperCase() + cat.slice(1);
  if (rt === "cashback" && cat === "shopping")
    return `${r}% cashback on all online spends`;
  if (rt === "cashback") return `${r}% cashback on ${label.toLowerCase()} spends`;
  return `${r}× rewards on ${label.toLowerCase()} spends`;
}

function whyRankOneCardToBuy(card, topCategory, rewardType) {
  if (!card) return "Top pick for your answers";
  const rtQ = String(rewardType || "").toLowerCase();
  const crt = String(card.rewardType || "").toLowerCase();
  const cType = String(card.cardType || "").toLowerCase();
  const cat =
    topCategory && topCategory !== "spread" && CATEGORIES.includes(topCategory) ? topCategory : null;
  const focus = cat || "shopping";
  const { rate } = normalizeCategoryValue(card?.categories?.[focus]);
  const base = Number(card?.baseRewardRate) || 0;
  const r = Number.isFinite(rate) && rate > 0 ? rate : base;

  if (rtQ === "cashback" && crt === "cashback")
    return "Your cashback preference lines up with how this card earns";
  if (rtQ === "miles" && crt === "miles")
    return "Miles-style rewards match what you said you want";
  if (rtQ === "points" && crt === "points")
    return "Points-based earn matches your selected reward type";
  if (cat && r >= 3)
    return `Strong category rates for your top pick (${cat}) in our simulation`;
  if (cType === "travel" && (rtQ === "miles" || topCategory === "travel"))
    return "Travel-tilted card fits the travel share in your profile";
  return "Highest simulated net value for the spend mix you entered";
}

function sparkleLineFromCard(card) {
  const tags = [];
  const fee = Number(card?.annualFee) || 0;
  if (fee <= 0) tags.push("No annual fee");
  const rt = String(card?.rewardType || "").toLowerCase();
  if (rt === "cashback") tags.push("Instant cashback");
  else if (rt === "miles") tags.push("Miles for travel");
  else tags.push("Reward points");
  tags.push("Easy redeem");
  return tags.slice(0, 4).join(" • ");
}

/** Smart Match from sortScore / net spread — varies with ranking and card mix. */
function computeSmartMatchPercents(slice) {
  if (!slice.length) return [];
  const keys = slice.map((s) => Number(s.sortScore) || Number(s.netValue) || 0);
  const maxK = Math.max(...keys, 1);
  const minK = Math.min(...keys);
  const span = Math.max(maxK - minK, maxK * 0.025);
  return slice.map((s, i) => {
    const k = keys[i];
    const t = span > 0 ? (k - minK) / span : Math.max(0, 1 - i * 0.05);
    const raw = 66 + t * 24 - i * 2.5;
    return Math.round(Math.min(97, Math.max(60, raw)));
  });
}

function computeCardToBuyTopBoost(first, second) {
  if (!first) return 0;
  const y0 = Number(first.yearlyRewardInr) || 0;
  const s0 = Number(first.sortScore) || Number(first.netValue) || 0;
  const s1 = second ? Number(second.sortScore) || Number(second.netValue) || 0 : s0 * 0.9;
  const lead = Math.max(0, s0 - s1);
  return Math.round(Math.min(y0 * 0.12, Math.max(0, lead * 0.2 + y0 * 0.015)));
}

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

    const toPayload = (item, idx, matchPercents, topBoost0) =>
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
            smartMatchPercent: matchPercents[idx] ?? 75,
            aiBoostInr: idx === 0 ? topBoost0 : 0,
            matchesLine: matchesLineFromCard(item.card, topCategory),
            whyRankOne: idx === 0 ? whyRankOneCardToBuy(item.card, topCategory, rewardType) : null,
            sparkleLine: sparkleLineFromCard({
              annualFee: item.annualFee,
              rewardType: item.card.rewardType,
            }),
          }
        : null;

    const topSlice = allSimulations.slice(0, 5);
    const matchPercents = computeSmartMatchPercents(topSlice);
    const topBoost0 = computeCardToBuyTopBoost(topSlice[0], topSlice[1]);
    const topCards = topSlice.map((item, idx) => toPayload(item, idx, matchPercents, topBoost0));

    const quizSummary = buildQuizSummary(rewardType, topCategory, spendBucket);

    return NextResponse.json({
      chartData: finalChartData,
      quizSummary,
      recommendedCard: toPayload(recommendedCard, 0, matchPercents, topBoost0),
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
