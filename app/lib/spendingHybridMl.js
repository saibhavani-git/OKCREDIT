/**
 * Hybrid scoring for “card to buy”: rules drive ranking; XGBoost is surfaced as an auxiliary score.
 */
import path from "path";
import { predictXgbBatch } from "./xgboostPredictNode";
import { buildMlFeatureVector } from "./quizMlFeatures";
import {
  yearlyRewardInr,
  netValueAfterFee,
  filterByEligibility,
  ruleAlignmentBoost,
} from "./cardToBuyRecommender";
import { getRewardRate } from "./recommendCard";

const DEFAULT_XGB_MODEL = path.join("ml_models", "xgboost_module2_yearly.joblib");

const SPEND_KEYS = ["shopping", "travel", "dining", "fuel", "groceries"];

/**
 * Extra ranking signal: reward cards that pay well on categories where the user actually spends most.
 * (Does not replace net value — nudges close ties when spend mix differs.)
 */
function dominantSpendShapeBonus(card, monthlyCategorySpend) {
  const pairs = SPEND_KEYS.map((c) => ({
    c,
    v: Math.max(0, Number(monthlyCategorySpend[c]) || 0),
  }));
  const total = pairs.reduce((s, p) => s + p.v, 0) || 1;
  pairs.sort((a, b) => b.v - a.v);
  let bonus = 0;
  pairs.slice(0, 3).forEach((p, i) => {
    const share = p.v / total;
    if (share < 0.05) return;
    const { rate } = getRewardRate(card, p.c);
    const w = i === 0 ? 1 : i === 1 ? 0.55 : 0.3;
    bonus += share * rate * 520 * w;
  });
  return Math.round(bonus * 100) / 100;
}

/**
 * @param {object} params
 * @param {object[]} params.allCards - full catalog (for stable cardNorm index)
 * @param {object} params.monthlyCategorySpend - ₹ per category / month
 * @param {Set<string>} [params.ownedIds] - exclude these card ids
 * @param {string|null} [params.goal]
 * @param {string|null} [params.topCategory]
 * @param {number|null} [params.userIncome]
 * @param {number|null} [params.userCreditScore]
 */
export function rankCardToBuyHybrid(params) {
  const {
    allCards,
    monthlyCategorySpend,
    ownedIds = new Set(),
    goal = null,
    topCategory = null,
    userIncome = null,
    userCreditScore = null,
  } = params;

  let cards = filterByEligibility(allCards, userIncome, userCreditScore);
  cards = cards.filter((c) => !ownedIds.has(String(c._id)));

  if (!cards.length) {
    return { rows: [], xgbEnabled: false, topThree: [], excludedOwnedCount: ownedIds.size };
  }

  const sortedAll = [...allCards].sort((a, b) => String(a._id).localeCompare(String(b._id)));
  const nAll = sortedAll.length;
  const idToIndex = new Map(sortedAll.map((c, i) => [String(c._id), i]));

  const totalMonthly =
    SPEND_KEYS.reduce((s, c) => s + (Number(monthlyCategorySpend[c]) || 0), 0) || 1;
  const estimatedYearlySpend = totalMonthly * 12;

  const mlSpend = {
    shopping: Number(monthlyCategorySpend.shopping) || 0,
    travel: Number(monthlyCategorySpend.travel) || 0,
    dining: Number(monthlyCategorySpend.dining) || 0,
    fuel: Number(monthlyCategorySpend.fuel) || 0,
    groceries: Number(monthlyCategorySpend.groceries) || 0,
  };

  const featureRows = cards.map((card) =>
    buildMlFeatureVector(mlSpend, idToIndex.get(String(card._id)) ?? 0, nAll)
  );

  const modelRel =
    process.env.ML_XGBOOST_MODEL_PATH || process.env.ML_MODULE2_MODEL_PATH || DEFAULT_XGB_MODEL;
  const modelAbs = path.isAbsolute(modelRel) ? modelRel : path.join(process.cwd(), modelRel);

  const preds = predictXgbBatch(featureRows, modelAbs, "[api/recommend-card-to-buy]");
  const xgbWorked = Boolean(preds && preds.length === cards.length);

  const mlYearly = xgbWorked ? preds.map((p) => Number(p)) : cards.map(() => 0);
  const maxMl = Math.max(0, ...mlYearly);

  const rows = cards.map((card, idx) => {
    const yearly = yearlyRewardInr(card, monthlyCategorySpend);
    const netValue = netValueAfterFee(card, yearly, estimatedYearlySpend);
    const annualFee = Number(card?.fees?.annual) || 0;
    const waiverSpend = Number(card?.fees?.waiverSpend) || 0;
    const effectiveFee =
      waiverSpend > 0 && estimatedYearlySpend >= waiverSpend ? 0 : annualFee;

    const alignBoost = ruleAlignmentBoost(card, goal, topCategory);
    const shapeBonus = dominantSpendShapeBonus(card, monthlyCategorySpend);

    let mlPredictedYearly = Number((mlYearly[idx] || 0).toFixed(2));
    let normalizedMl = maxMl > 0 ? mlYearly[idx] / maxMl : 0;
    let mlBoost = Number((normalizedMl * 0.1 * netValue).toFixed(4));

    if (!xgbWorked) {
      mlPredictedYearly = 0;
      normalizedMl = 0;
      mlBoost = 0;
    }

    const ruleSubtotal = Number((netValue + alignBoost + shapeBonus).toFixed(4));
    // Ranking is rule-only. ML remains visible as an informational signal.
    const finalScore = Number(ruleSubtotal.toFixed(4));

    return {
      card,
      yearlyRewardInr: Math.round(yearly * 100) / 100,
      annualFee: effectiveFee,
      netValue: Math.round(netValue * 100) / 100,
      ruleAlignmentBoost: alignBoost,
      spendShapeBonus: shapeBonus,
      mlPredictedYearly,
      normalizedMl: Number(normalizedMl.toFixed(6)),
      mlBoost,
      ruleSubtotal,
      finalScore,
    };
  });

  rows.sort((a, b) => {
    const d = b.finalScore - a.finalScore;
    if (Math.abs(d) > 0.01) return d;
    const d2 = b.spendShapeBonus - a.spendShapeBonus;
    if (Math.abs(d2) > 0.01) return d2;
    return b.netValue - a.netValue;
  });

  return {
    rows,
    xgbEnabled: xgbWorked,
    topThree: rows.slice(0, 3),
    excludedOwnedCount: ownedIds.size,
  };
}
