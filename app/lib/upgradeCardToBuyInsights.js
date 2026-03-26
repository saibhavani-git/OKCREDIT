/**
 * “Card to buy” upgrade narrative: compare best-case rewards with current portfolio
 * vs. adding the recommended card (per-category optimal pick).
 */
import { getRewardRate, calculateReward, rewardToInr } from "./recommendCard";
import { yearlyRewardInr, netValueAfterFee, simulateMonthlyRewardInr } from "./cardToBuyRecommender";

const CATEGORIES = ["shopping", "travel", "fuel", "dining", "groceries"];

export function rewardInrForCategory(card, category, monthlySpend) {
  const spend = Number(monthlySpend) || 0;
  if (!card || spend <= 0) return 0;
  const { rate, maxCap } = getRewardRate(card, category);
  const raw = calculateReward(rate, spend, maxCap);
  return rewardToInr(card, raw);
}

export function bestRewardAmongCards(cards, category, monthlySpend) {
  const list = Array.isArray(cards) ? cards : [];
  const spend = Number(monthlySpend) || 0;
  if (!list.length || spend <= 0) return { inr: 0, card: null };
  let bestInr = -1;
  let bestCard = null;
  for (const c of list) {
    const inr = rewardInrForCategory(c, category, spend);
    if (inr > bestInr) {
      bestInr = inr;
      bestCard = c;
    }
  }
  return { inr: Math.max(0, bestInr), card: bestCard };
}

export function formatCategoryRateLabel(card, category) {
  if (!card) return "—";
  const { rate } = getRewardRate(card, category);
  const type = (card.rewardType || "").toLowerCase();
  if (type === "cashback") return `${rate}%`;
  return `${rate}×`;
}

function estimatedYearlySpendFromMonthly(monthlyCategorySpend) {
  const totalMonthly =
    CATEGORIES.reduce((s, c) => s + (Number(monthlyCategorySpend[c]) || 0), 0) || 1;
  return totalMonthly * 12;
}

/** Assign each category’s spend to a winning card, then sum capped monthly ₹ per card (respects monthlyCap). */
function portfolioMonthlyInrCapped(pickCardForCategory, monthlyCategorySpend) {
  const byId = new Map();
  for (const cat of CATEGORIES) {
    const spend = Number(monthlyCategorySpend[cat]) || 0;
    if (spend <= 0) continue;
    const card = pickCardForCategory(cat, spend);
    if (!card) continue;
    const id = String(card._id);
    if (!byId.has(id)) {
      const profile = {};
      CATEGORIES.forEach((c) => {
        profile[c] = 0;
      });
      byId.set(id, { card, profile });
    }
    byId.get(id).profile[cat] += spend;
  }
  let sum = 0;
  for (const { card, profile } of byId.values()) {
    sum += simulateMonthlyRewardInr(card, profile);
  }
  return sum;
}

/**
 * @param {object[]} ownedCards - full card docs user owns
 * @param {object} recommendedCard - catalog card doc (top pick)
 * @param {object} monthlyCategorySpend - ₹ / month per category
 * @returns {object|null}
 */
export function buildUpgradeComparison(ownedCards, recommendedCard, monthlyCategorySpend) {
  if (!recommendedCard) return null;

  const owned = Array.isArray(ownedCards) ? ownedCards : [];
  const estimatedYearlySpend = estimatedYearlySpendFromMonthly(monthlyCategorySpend);

  const categoryLines = [];

  for (const cat of CATEGORIES) {
    const spend = Number(monthlyCategorySpend[cat]) || 0;
    if (spend <= 0) continue;

    const bestOwned = bestRewardAmongCards(owned, cat, spend);
    const recInr = rewardInrForCategory(recommendedCard, cat, spend);
    const bestWithRec = Math.max(bestOwned.inr, recInr);

    categoryLines.push({
      category: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      monthlySpend: spend,
      yearlySpend: Math.round(spend * 12),
      bestOwnedInrMonthly: bestOwned.inr,
      recommendedInrMonthly: recInr,
      deltaMonthlyInr: bestWithRec - bestOwned.inr,
      ownedRateLabel: formatCategoryRateLabel(bestOwned.card, cat),
      recRateLabel: formatCategoryRateLabel(recommendedCard, cat),
      recommendedWinsCategory: recInr > bestOwned.inr + 1e-6,
    });
  }

  const monthlyOptimalOwned = portfolioMonthlyInrCapped(
    (cat, spend) => bestRewardAmongCards(owned, cat, spend).card,
    monthlyCategorySpend
  );
  const monthlyOptimalWithRec = portfolioMonthlyInrCapped(
    (cat, spend) => {
      const bestOwned = bestRewardAmongCards(owned, cat, spend);
      const recInr = rewardInrForCategory(recommendedCard, cat, spend);
      return recInr > bestOwned.inr + 1e-9 ? recommendedCard : bestOwned.card;
    },
    monthlyCategorySpend
  );

  const yearlyOptimalOwnedRewards = monthlyOptimalOwned * 12;
  const yearlyOptimalWithRecGross = monthlyOptimalWithRec * 12;

  const yearlyRecIfAllSpendOnIt = yearlyRewardInr(recommendedCard, monthlyCategorySpend);
  const netWithRecommended = netValueAfterFee(
    recommendedCard,
    yearlyOptimalWithRecGross,
    estimatedYearlySpend
  );
  const recommendedFeeYearly = Math.round(
    Math.max(0, yearlyOptimalWithRecGross - netWithRecommended)
  );

  const gapGrossYearly = yearlyOptimalWithRecGross - yearlyOptimalOwnedRewards;
  const gapNetYearly = netWithRecommended - yearlyOptimalOwnedRewards;

  const upliftPct =
    yearlyOptimalOwnedRewards > 0
      ? ((yearlyOptimalWithRecGross - yearlyOptimalOwnedRewards) / yearlyOptimalOwnedRewards) * 100
      : yearlyOptimalWithRecGross > 0
        ? 100
        : 0;

  const sortedByDelta = [...categoryLines]
    .filter((l) => l.deltaMonthlyInr > 0.5)
    .sort((a, b) => b.deltaMonthlyInr - a.deltaMonthlyInr);

  const mlFeatures = categoryLines
    .filter((l) => l.monthlySpend > 0)
    .sort((a, b) => b.monthlySpend - a.monthlySpend)
    .slice(0, 3)
    .map((l) => {
      const under =
        l.recommendedWinsCategory
          ? `${l.label}: under-earning ${l.ownedRateLabel} vs ${l.recRateLabel} on ${recommendedCard.cardName}`
          : `${l.label}: spend ${l.label.toLowerCase()} ₹${Math.round(l.yearlySpend).toLocaleString("en-IN")}/yr — your best owned ${l.ownedRateLabel}`;
      return under;
    });

  return {
    currentOptimalRewardsYearly: Math.round(yearlyOptimalOwnedRewards),
    newOptimalRewardsGrossYearly: Math.round(yearlyOptimalWithRecGross),
    newOptimalNetYearly: Math.round(netWithRecommended),
    gapRewardsGrossYearly: Math.round(gapGrossYearly),
    gapNetYearly: Math.round(gapNetYearly),
    upliftPercent: Math.round(upliftPct * 10) / 10,
    recommendedFeeYearly,
    yearlyRewardIfSingleCard: Math.round(yearlyRecIfAllSpendOnIt),
    categoryDeltas: sortedByDelta.slice(0, 5).map((l) => ({
      category: l.category,
      label: l.label,
      yearlySpend: l.yearlySpend,
      ownedRateLabel: l.ownedRateLabel,
      recRateLabel: l.recRateLabel,
      deltaMonthlyInr: Math.round(l.deltaMonthlyInr),
    })),
    mlFeatureBullets: mlFeatures,
  };
}

/**
 * @param {{ category: string, share: number }[]} chartData - share 0–100
 * @param {string} recommendedName
 * @param {boolean} xgbEnabled
 * @param {number} gapNetYearly
 * @param {number} upliftPercent
 */
export function buildMlNarrative(chartData, recommendedName, xgbEnabled, gapNetYearly, upliftPercent) {
  const sorted = [...(chartData || [])].sort((a, b) => (b.share || 0) - (a.share || 0));
  const top = sorted.slice(0, 2).filter((x) => (x.share || 0) >= 5);
  const pattern =
    top.length >= 2
      ? `${top[0].share?.toFixed(0) ?? 0}% ${top[0].label || top[0].category} + ${top[1].share?.toFixed(0) ?? 0}% ${top[1].label || top[1].category}`
      : top.length === 1
        ? `${top[0].share?.toFixed(0) ?? 0}% ${top[0].label || top[0].category}`
        : "your category mix";

  const gapK = Math.max(0, Math.round(gapNetYearly / 1000));
  const strongGap = gapNetYearly >= 500;

  const head = !strongGap
    ? xgbEnabled
      ? `XGBoost + rules: ${recommendedName} is a close match to your mix; upside vs your current ceiling is modest right now.`
      : `Rules + spend fit: ${recommendedName} fits your pattern; extra upside vs cards you already own is small today.`
    : xgbEnabled
      ? `XGBoost + rules: you’re leaving about ₹${gapK}k/yr on the table vs the best you can do with only your current cards.`
      : `Rules + your spend mix: you could pick up about ₹${gapK}k/yr more by adding the right card.`;

  const tail = xgbEnabled
    ? `Pattern: ${pattern} → ranked ${recommendedName} highly. ~${upliftPercent}% uplift vs optimising owned cards only.`
    : `Pattern: ${pattern} → ${recommendedName} lines up with ~${upliftPercent}% more rewards vs your current portfolio ceiling.`;

  return { headline: head, patternLine: tail, patternSummary: pattern };
}
