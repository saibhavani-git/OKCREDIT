import { NextResponse } from "next/server";
import path from "path";
import dbConnect from "../../lib/db";
import CreditCard from "../../models/cards";
import User from "../../models/user";
import { verifyAuth } from "../../lib/auth";
import { predictXgbBatch } from "../../lib/xgboostPredictNode";
import { buildMlFeatureVector } from "../../lib/quizMlFeatures";
import { simulateMonthlyRewardInr } from "../../lib/cardToBuyRecommender";

const CATEGORIES = ["shopping", "travel", "dining", "fuel", "groceries"];

const DEFAULT_XGB_MODEL = path.join("ml_models", "xgboost_module2_yearly.joblib");

function getCategoryRate(card, category) {
  const raw = card?.categories?.[category];
  if (raw && typeof raw === "object" && raw.rate !== undefined) {
    return Number(raw.rate) || Number(card?.baseRewardRate) || 0;
  }
  if (typeof raw === "number") return raw;
  return Number(card?.baseRewardRate) || 0;
}

function getCategoryCap(card, category) {
  const raw = card?.categories?.[category];
  if (raw && typeof raw === "object" && raw.maxCap !== undefined) {
    const cap = Number(raw.maxCap);
    return Number.isFinite(cap) && cap > 0 ? cap : null;
  }
  return null;
}

function estimateYearlyReward(card, spendingProfile) {
  return simulateMonthlyRewardInr(card, spendingProfile) * 12;
}

function feeAfterWaiver(card, yearlySpend) {
  const annualFee = Number(card?.fees?.annual) || 0;
  const waiverSpend = Number(card?.fees?.waiverSpend) || 0;
  if (waiverSpend > 0 && yearlySpend >= waiverSpend) return 0;
  return annualFee;
}

function quizCategoryFitBonus(card, primaryCategory, secondaryCategories) {
  let bonus = 0;
  const primary = String(primaryCategory || "").trim();
  if (primary && CATEGORIES.includes(primary)) {
    bonus += getCategoryRate(card, primary) * 90;
  }
  const secs = Array.isArray(secondaryCategories) ? secondaryCategories : [];
  secs.forEach((cat) => {
    if (typeof cat === "string" && CATEGORIES.includes(cat) && cat !== primary) {
      bonus += getCategoryRate(card, cat) * 32;
    }
  });
  return Math.round(bonus * 100) / 100;
}

function normalizeRewardPreference(raw) {
  const p = String(raw || "").trim().toLowerCase();
  if (!p || p === "neutral" || p === "any" || p === "balanced") return "neutral";
  if (p === "cashback" || p === "points" || p === "travel") return p;
  return "neutral";
}

/** Scales with simulated net so a high-₹ cashback card can’t ignore a stated points/travel preference. */
function familyMismatchPenalty(yearlyNet, floor, ceiling = 12000) {
  const nv = Math.max(0, Number(yearlyNet) || 0);
  const scaled = Math.round(0.22 * nv);
  return -Math.min(ceiling, Math.max(floor, scaled));
}

/**
 * Reward-style alignment: neutral = no bonus/penalty (pure earn + category fit + ML).
 * Explicit prefs use scaled mismatches so raw ₹ estimates don’t always favor cashback.
 */
function rewardFamilyAlignmentDelta(card, rewardPreference, yearlyNetForScale) {
  const pref = normalizeRewardPreference(rewardPreference);
  if (pref === "neutral") return 0;

  const rt = String(card?.rewardType || "cashback").toLowerCase();
  const cardType = String(card?.cardType || "").toLowerCase();
  const perks = Array.isArray(card?.perks) ? card.perks : [];

  if (pref === "cashback") {
    if (rt === "cashback") return 0;
    if (rt === "points") return familyMismatchPenalty(yearlyNetForScale, 1600, 9000);
    if (rt === "miles") return familyMismatchPenalty(yearlyNetForScale, 1900, 9500);
    return -700;
  }

  if (pref === "points") {
    if (rt === "points") return 0;
    if (rt === "cashback") return familyMismatchPenalty(yearlyNetForScale, 3200);
    if (rt === "miles") return -900;
    return -700;
  }

  if (pref === "travel") {
    const milesOk = rt === "miles";
    const travelPoints =
      rt === "points" && (cardType === "travel" || perks.includes("LOUNGE_ACCESS"));
    if (milesOk || travelPoints) return 380;
    if (perks.includes("LOUNGE_ACCESS")) return 220;
    if (rt === "cashback") return familyMismatchPenalty(yearlyNetForScale, 3800);
    if (rt === "points") return -1200;
    return -500;
  }

  return 0;
}

function preferenceBonus(card, rewardPreference, feePreference, painPoint, yearlyNetForScale) {
  let bonus = 0;
  const annualFee = Number(card?.fees?.annual) || 0;
  const rewardType = String(card?.rewardType || "cashback").toLowerCase();
  const cardType = String(card?.cardType || "").toLowerCase();
  const perks = Array.isArray(card?.perks) ? card.perks : [];
  const pref = normalizeRewardPreference(rewardPreference);

  if (pref === "cashback" && rewardType === "cashback") bonus += 320;
  if (pref === "points" && rewardType === "points") bonus += 320;
  if (pref === "travel") {
    if (rewardType === "miles") bonus += 340;
    else if (rewardType === "points" && (cardType === "travel" || perks.includes("LOUNGE_ACCESS")))
      bonus += 300;
    else if (perks.includes("LOUNGE_ACCESS")) bonus += 260;
  }

  bonus += rewardFamilyAlignmentDelta(card, rewardPreference, yearlyNetForScale);

  if (feePreference === "no" && annualFee > 0) bonus -= Math.min(annualFee * 0.45, 900);
  if (painPoint === "hidden charges" && annualFee > 2000) bonus -= 320;
  if (painPoint === "no travel benefits" && perks.includes("LOUNGE_ACCESS")) bonus += 180;
  if (painPoint === "low cashback" && rewardType === "cashback") bonus += 160;

  return Math.round(bonus);
}

function categoryPhrase(cat) {
  const c = String(cat || "").trim();
  return (
    {
      shopping: "online shopping",
      travel: "travel & holidays",
      dining: "dining out",
      fuel: "fuel & drives",
      groceries: "groceries",
    }[c] || (c ? `${c} spend` : "mixed spending")
  );
}

function buildMainQuizSummary(
  primaryCategory,
  rewardPreference,
  secondaryCategories,
  feePreference,
  painPoint
) {
  const rp = normalizeRewardPreference(rewardPreference);
  const arch =
    {
      cashback: "Cashback lover",
      points: "Points optimizer",
      travel: "Travel benefits seeker",
      neutral: "Balanced rewards seeker",
    }[rp] || "Card seeker";

  const pc = String(primaryCategory || "").trim();
  const primaryPhrase = CATEGORIES.includes(pc) ? categoryPhrase(pc) : "mixed spending";

  const sec = Array.isArray(secondaryCategories)
    ? secondaryCategories.filter((c) => typeof c === "string" && CATEGORIES.includes(c) && c !== pc).slice(0, 2)
    : [];
  const secPart = sec.length ? ` + ${sec.map(categoryPhrase).join(" + ")}` : "";

  const fp = String(feePreference || "").toLowerCase();
  const pp = String(painPoint || "").toLowerCase();
  const notes = [];
  if (fp === "no") notes.push("zero annual fee priority");
  if (fp === "yes") notes.push("open to a fee for value");
  if (pp.includes("travel")) notes.push("wants travel perks");
  if (pp.includes("cashback") || pp.includes("low cashback")) notes.push("wants stronger cashback");
  if (pp.includes("hidden")) notes.push("wary of hidden charges");
  const noteStr = notes.length ? ` · ${notes.slice(0, 2).join(", ")}` : "";

  return `${arch}, ${primaryPhrase}${secPart}${noteStr}`;
}

function normalizeCatConfig(val) {
  if (val == null) return { rate: 0 };
  if (typeof val === "number") return { rate: val };
  return { rate: Number(val.rate) || 0 };
}

function matchesLineFromCard(card, primaryCategory) {
  const t = String(card?.rewardRateText || "").trim();
  if (t) return t;
  const cat =
    primaryCategory && CATEGORIES.includes(primaryCategory) ? primaryCategory : "shopping";
  const { rate: cfgRate } = normalizeCatConfig(card?.categories?.[cat]);
  const base = Number(card?.baseRewardRate) || 0;
  const r = cfgRate > 0 ? cfgRate : base;
  const rt = String(card?.rewardType || "").toLowerCase();
  if (rt === "cashback" && cat === "shopping") return `${r}% cashback on all online spends`;
  if (rt === "cashback") return `${r}% cashback on ${cat} spends`;
  return `${r}× rewards on ${cat} spends`;
}

function sparkleLineFromCard(card, effectiveFee) {
  const tags = [];
  if (effectiveFee <= 0) tags.push("No annual fee");
  const rt = String(card?.rewardType || "").toLowerCase();
  if (rt === "cashback") tags.push("Instant cashback");
  else if (rt === "miles") tags.push("Miles for travel");
  else tags.push("Reward points");
  tags.push("Easy redeem");
  return tags.slice(0, 4).join(" • ");
}

/** Smart Match % from final score spread, net value, and quiz-fit — not fixed tiers. */
function computeSmartMatchPercents(rows) {
  if (!rows.length) return [];
  const finals = rows.map((r) => Number(r.finalScore) || 0);
  const maxF = Math.max(...finals, 1);
  const minF = Math.min(...finals);
  const span = Math.max(maxF - minF, maxF * 0.025);
  const maxNet = Math.max(...rows.map((r) => Number(r.netValue) || 0), 1);
  const maxQuiz = Math.max(...rows.map((r) => Number(r.quizFitBonus) || 0), 1e-6);
  return rows.map((r, i) => {
    const fr = Number(r.finalScore) || 0;
    const tScore = span > 0 ? (fr - minF) / span : Math.max(0, 1 - i * 0.06);
    const netBlend = (Number(r.netValue) || 0) / maxNet;
    const quizBlend = (Number(r.quizFitBonus) || 0) / maxQuiz;
    const raw = 68 + tScore * 20 + netBlend * 5 + quizBlend * 5 - i * 2.8;
    return Math.round(Math.min(97, Math.max(62, raw)));
  });
}

function computeTopPickBoostInr(topRow, secondRow, xgbWorked) {
  if (!topRow) return 0;
  const ml = Number(topRow.mlBoost) || 0;
  if (xgbWorked && ml >= 1) return Math.round(ml);
  const pref = Number(topRow.preferenceBonus) || 0;
  const quiz = Number(topRow.quizFitBonus) || 0;
  const yr = Number(topRow.yearlyRewardInr) || 0;
  const gap =
    secondRow != null
      ? Math.max(0, (Number(topRow.finalScore) || 0) - (Number(secondRow.finalScore) || 0))
      : 0;
  const fromPrefs = Math.round(pref * 0.1 + quiz * 0.05 + gap * 0.35);
  const cap = Math.max(120, Math.round(yr * 0.12));
  return Math.min(cap, Math.max(0, fromPrefs));
}

function buildWhyRankOne(row, card, primaryCategory, rewardPreference, painPoint) {
  if (!card) return "Top pick for your quiz profile";
  const candidates = [];
  const pc = String(primaryCategory || "").trim();
  if (pc && CATEGORIES.includes(pc)) {
    const { rate: cfgR } = normalizeCatConfig(card.categories?.[pc]);
    const base = Number(card.baseRewardRate) || 0;
    const r = cfgR > 0 ? cfgR : base;
    if (r >= 4)
      candidates.push({
        w: 4,
        text: `Strong earn on your main category (${pc}) at about ${r}% (or equivalent points)`,
      });
    else if (r > 0)
      candidates.push({ w: 2, text: `Solid ${pc} rewards relative to the other finalists` });
  }
  const rp = normalizeRewardPreference(rewardPreference);
  const rt = String(card.rewardType || "").toLowerCase();
  const ct = String(card.cardType || "").toLowerCase();
  if (rp === "cashback" && rt === "cashback")
    candidates.push({ w: 3, text: "Matches the cashback style you said you want" });
  if (rp === "points" && rt === "points")
    candidates.push({ w: 3, text: "Matches the reward-points style you said you want" });
  if (rp === "travel" && (rt === "miles" || ct === "travel"))
    candidates.push({ w: 3, text: "Fits your travel-benefits priority" });

  const pp = String(painPoint || "").toLowerCase();
  const perks = Array.isArray(card.perks) ? card.perks : [];
  if ((pp.includes("travel") || pp.includes("benefits")) && perks.includes("LOUNGE_ACCESS"))
    candidates.push({ w: 3, text: "Adds lounge access — relevant to what frustrates you today" });
  if (pp.includes("cashback") && rt === "cashback")
    candidates.push({ w: 2, text: "Directly targets the cashback gap you called out" });

  const nv = Math.round(Number(row.netValue) || 0);
  candidates.push({
    w: 1,
    text: `Leads your shortlist on estimated net yearly value (~${nv.toLocaleString("en-IN")} ₹/yr after fee logic)`,
  });

  candidates.sort((a, b) => b.w - a.w);
  return candidates[0]?.text || "Best combined rules + quiz fit in your top three";
}

function enrichQuizCardRow(
  row,
  card,
  idx,
  primaryCategory,
  yearlySpend,
  smartMatchPercent,
  aiBoostInr,
  whyRankOneText,
  rewardPreference,
  painPoint
) {
  const base = toPublicCardShape(row);
  if (!card) {
    return {
      ...base,
      rewardRateText: "",
      smartMatchPercent,
      aiBoostInr: idx === 0 ? aiBoostInr : 0,
      matchesLine: "Strong rewards for your spend profile",
      sparkleLine: "Competitive rewards",
      whyRankOne: idx === 0 ? whyRankOneText : null,
    };
  }
  const eff = feeAfterWaiver(card, yearlySpend);
  return {
    ...base,
    rewardRateText: card.rewardRateText || "",
    smartMatchPercent,
    aiBoostInr: idx === 0 ? aiBoostInr : 0,
    matchesLine: matchesLineFromCard(card, primaryCategory),
    sparkleLine: sparkleLineFromCard(card, eff),
    whyRankOne: idx === 0 ? whyRankOneText : null,
  };
}

function toPublicCardShape(r) {
  return {
    _id: r._id,
    bank: r.bank,
    cardName: r.cardName,
    rewardType: r.rewardType,
    cardType: r.cardType,
    annualFee: r.annualFee,
    yearlyRewardInr: r.yearlyRewardInr,
    netValue: r.netValue,
    ruleScore: r.ruleScore,
    preferenceBonus: r.preferenceBonus,
    quizFitBonus: r.quizFitBonus,
    ruleSubtotal: r.ruleSubtotal,
    mlPredictedYearly: r.mlPredictedYearly,
    normalizedMl: r.normalizedMl,
    mlBoost: r.mlBoost,
    finalScore: r.finalScore,
  };
}

function buildQuizMlExplanation({ xgbWorked, mlBoost }) {
  const lines = [
    "Transparent rules (category rates, caps, points→₹, fees) decide your base net value.",
    "XGBoost adds a small boost: normalized prediction × 0.1 × net value — rules stay in charge.",
  ];
  if (xgbWorked) {
    lines.push(
      "How the model learns: it trains on many synthetic (spend profile × card) rows where the target yearly reward is computed with the same rule engine, so it picks up non-linear patterns rules don’t encode explicitly."
    );
    if (Number(mlBoost) > 0) {
      lines.push(
        "ML insight: among new cards for you, this one got the strongest combined rule + ML score for your quiz spend shape."
      );
    } else {
      lines.push(
        "ML boost is ~0 for this card (normalized score or net value edge case); ranking is effectively rule-driven."
      );
    }
  } else {
    lines.push(
      "XGBoost is off (missing joblib, Python, or failed predict). Train with `npm run synthetic-module2` then `npm run train-xgboost-module2`, or set ML_XGBOOST_MODEL_PATH — see ml_models/README.md."
    );
  }
  return lines;
}

/**
 * Quiz: owned cards excluded → rules + quiz bonuses → XGBoost mlBoost → top 3.
 */
export async function POST(request) {
  try {
    await dbConnect();

    const token = request.cookies.get("authToken")?.value;
    const auth = verifyAuth(token);
    if (!auth?.userId) {
      return NextResponse.json(
        { message: "Please log in to get card recommendations for cards you don’t own yet." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const spendingProfile = body?.spendingProfile || {};
    const rewardPreference = String(body?.rewardPreference ?? "").trim().toLowerCase();
    const feePreference = String(body?.feePreference || "no").toLowerCase();
    const painPointRaw = body?.painPoint;
    const painPoint =
      painPointRaw != null && String(painPointRaw).trim() !== ""
        ? String(painPointRaw).trim().toLowerCase()
        : "";
    const primaryCategory = String(body?.primaryCategory || "").trim();
    const secondaryCategories = Array.isArray(body?.secondaryCategories) ? body.secondaryCategories : [];

    const user = await User.findById(auth.userId).select("cards").lean();
    const ownedIds = new Set((user?.cards || []).map((id) => String(id)));

    const allCards = await CreditCard.find({}).lean();
    let cards = allCards.filter((c) => !ownedIds.has(String(c._id)));

    if (!cards.length) {
      return NextResponse.json({
        message:
          ownedIds.size > 0
            ? "You already have every card in our catalog, or no cards are available to recommend."
            : "No cards found in the system.",
        quizSummary: "",
        bestCard: null,
        topCards: [],
        excludedOwnedCount: ownedIds.size,
        xgbEnabled: false,
      });
    }

    const sortedAll = [...allCards].sort((a, b) => String(a._id).localeCompare(String(b._id)));
    const nAll = sortedAll.length;
    const idToIndex = new Map(sortedAll.map((c, i) => [String(c._id), i]));

    const monthlySpend = CATEGORIES.reduce((s, c) => s + (Number(spendingProfile[c]) || 0), 0);
    const yearlySpend = monthlySpend * 12;

    const prefNorm = normalizeRewardPreference(rewardPreference);
    /** Paid travel/miles cards are usually fee-bearing; don’t shrink the pool to “free only” when user asked for points/travel. */
    let feeFilterRelaxed = false;
    if (feePreference === "no" && (prefNorm === "cashback" || prefNorm === "neutral")) {
      const noFee = cards.filter((c) => feeAfterWaiver(c, yearlySpend) <= 0);
      if (noFee.length > 0) {
        cards = noFee;
      } else {
        feeFilterRelaxed = true;
      }
    } else if (feePreference === "no" && (prefNorm === "points" || prefNorm === "travel")) {
      feeFilterRelaxed = true;
    }

    const featureRows = cards.map((card) =>
      buildMlFeatureVector(spendingProfile, idToIndex.get(String(card._id)) ?? 0, nAll)
    );

    const modelRel =
      process.env.ML_XGBOOST_MODEL_PATH || process.env.ML_MODULE2_MODEL_PATH || DEFAULT_XGB_MODEL;
    const modelAbs = path.isAbsolute(modelRel) ? modelRel : path.join(process.cwd(), modelRel);

    const preds = predictXgbBatch(featureRows, modelAbs, "[api/recommend]");
    const xgbWorked = Boolean(preds && preds.length === cards.length);

    const mlYearly = xgbWorked ? preds.map((p) => Number(p)) : cards.map(() => 0);
    const maxMl = Math.max(0, ...mlYearly);

    const ranked = cards
      .map((card, idx) => {
        const yearlyReward = estimateYearlyReward(card, spendingProfile);
        const effectiveFee = feeAfterWaiver(card, yearlySpend);
        const netValue = yearlyReward - effectiveFee;
        const prefB = preferenceBonus(card, rewardPreference, feePreference, painPoint, netValue);
        const quizFit = quizCategoryFitBonus(card, primaryCategory, secondaryCategories);

        const mlPredictedYearly = Number((mlYearly[idx] || 0).toFixed(2));
        const normalizedMl = maxMl > 0 ? mlYearly[idx] / maxMl : 0;
        const mlBoost = Number((normalizedMl * 0.1 * netValue).toFixed(4));
        const ruleSubtotal = Number((netValue + prefB + quizFit).toFixed(4));
        const finalScore = Number((ruleSubtotal + mlBoost).toFixed(4));

        return {
          _id: String(card._id),
          bank: card.bank,
          cardName: card.cardName,
          rewardType: card.rewardType,
          cardType: card.cardType,
          annualFee: Number(card?.fees?.annual) || 0,
          yearlyRewardInr: Number(yearlyReward.toFixed(2)),
          netValue: Number(netValue.toFixed(2)),
          ruleScore: Number(netValue.toFixed(2)),
          preferenceBonus: prefB,
          quizFitBonus: Number(quizFit.toFixed(2)),
          ruleSubtotal,
          mlPredictedYearly,
          normalizedMl: Number(normalizedMl.toFixed(6)),
          mlBoost,
          finalScore,
        };
      })
      .sort((a, b) => {
        const d = b.finalScore - a.finalScore;
        if (Math.abs(d) > 0.01) return d;
        const tie = b.quizFitBonus - a.quizFitBonus;
        if (Math.abs(tie) > 0.01) return tie;
        return String(a.cardName).localeCompare(String(b.cardName));
      });

    const top = ranked.slice(0, 3);
    const first = top[0] || null;

    const quizSummary = buildMainQuizSummary(
      primaryCategory,
      rewardPreference,
      secondaryCategories,
      feePreference,
      painPoint
    );

    const matchPercents = computeSmartMatchPercents(top);
    const firstCard = top[0] ? cards.find((c) => String(c._id) === top[0]._id) : null;
    const firstBoost = computeTopPickBoostInr(top[0], top[1], xgbWorked);
    const why1 =
      top[0] && firstCard
        ? buildWhyRankOne(top[0], firstCard, primaryCategory, rewardPreference, painPoint)
        : "Best match for your answers";

    const topCards = top.map((row, idx) => {
      const card = cards.find((c) => String(c._id) === row._id);
      return enrichQuizCardRow(
        row,
        card,
        idx,
        primaryCategory,
        yearlySpend,
        matchPercents[idx] ?? 75,
        firstBoost,
        why1,
        rewardPreference,
        painPoint
      );
    });

    let bestCard = null;
    if (first && topCards[0]) {
      bestCard = {
        ...topCards[0],
        explanation: buildQuizMlExplanation({
          xgbWorked,
          mlBoost: first.mlBoost,
        }),
      };
    }

    return NextResponse.json({
      quizSummary,
      bestCard,
      topCards,
      expectedReward: first?.yearlyRewardInr || 0,
      feeFilterRelaxed,
      excludedOwnedCount: ownedIds.size,
      xgbEnabled: xgbWorked,
    });
  } catch (error) {
    console.error("[api/recommend]", error);
    return NextResponse.json({ message: "Failed to generate recommendations" }, { status: 500 });
  }
}
