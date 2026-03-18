/**
 * Recommend a card to buy: simulate yearly rewards from monthly category spend,
 * subtract annual fee, filter by eligibility, pick highest net value.
 */
import { getRewardRate, calculateReward, rewardToInr } from "./recommendCard";

const CATEGORIES = ["shopping", "travel", "fuel", "dining", "groceries"];

/**
 * Simulate monthly reward (INR) for a card given monthly spend per category.
 * Sum over categories: reward = rate * spend / 100, capped; convert to INR for points/miles.
 */
export function simulateMonthlyRewardInr(card, monthlyCategorySpend) {
  let totalRaw = 0;
  for (const cat of CATEGORIES) {
    const spend = Number(monthlyCategorySpend[cat]) || 0;
    if (spend <= 0) continue;
    const { rate, maxCap } = getRewardRate(card, cat);
    const rawReward = calculateReward(rate, spend, maxCap);
    totalRaw += rawReward;
  }
  return rewardToInr(card, totalRaw);
}

/**
 * Yearly reward in INR = monthly * 12.
 */
export function yearlyRewardInr(card, monthlyCategorySpend) {
  const monthly = simulateMonthlyRewardInr(card, monthlyCategorySpend);
  return monthly * 12;
}

/**
 * Net value = yearly reward - annual fee. Fee waived if estimated yearly spend >= waiverSpend.
 */
export function netValueAfterFee(card, yearlyReward, estimatedYearlySpend) {
  const annualFee = Number(card?.fees?.annual) || 0;
  const waiverSpend = Number(card?.fees?.waiverSpend) || 0;
  const waived = waiverSpend > 0 && estimatedYearlySpend >= waiverSpend;
  const effectiveAnnual = waived ? 0 : annualFee;
  return yearlyReward - effectiveAnnual;
}

/**
 * Filter cards by eligibility (minIncome, minCreditScore). If userIncome/userScore not provided, skip filter.
 */
export function filterByEligibility(cards, userIncome, userCreditScore) {
  if ((!userIncome && userIncome !== 0) && (!userCreditScore && userCreditScore !== 0)) {
    return cards;
  }
  return cards.filter((card) => {
    const minIncome = Number(card?.eligibility?.minIncome);
    const minScore = Number(card?.eligibility?.minCreditScore);
    if (Number.isFinite(minIncome) && userIncome != null && Number(userIncome) < minIncome) return false;
    if (Number.isFinite(minScore) && userCreditScore != null && Number(userCreditScore) < minScore) return false;
    return true;
  });
}

/** Map quiz "goal" to card traits (rewardType, cardType, bestFor). */
function cardMatchesGoal(card, goal) {
  if (!goal) return true;
  const g = (goal || "").toLowerCase();
  const rewardType = (card.rewardType || "").toLowerCase();
  const cardType = (card.cardType || "").toLowerCase();
  const bestFor = (card.bestFor || []).map((x) => String(x).toLowerCase());

  if (g === "travel_rewards")
    return rewardType === "miles" || rewardType === "points" || cardType === "travel" || bestFor.some((b) => b.includes("travel"));
  if (g === "cash_back") return rewardType === "cashback" || cardType === "cashback";
  if (g === "everyday")
    return ["shopping", "groceries"].some((c) => bestFor.some((b) => b.includes(c))) || cardType === "shopping";
  if (g === "fuel") return cardType === "fuel" || bestFor.some((b) => b.includes("fuel"));
  if (g === "dining") return bestFor.some((b) => b.includes("dining")) || cardType === "lifestyle";
  return true;
}

/** Boost net value for cards that match user's top spending category (better rewards there). */
function categoryBoost(card, topCategory) {
  if (!topCategory || topCategory === "spread") return 0;
  const cat = (topCategory || "").toLowerCase();
  const rate = getRewardRate(card, cat);
  if (rate.rate > 0) return 200; // small boost so matching category cards rank higher when close
  return 0;
}

/**
 * Full pipeline: given monthly category spend and all cards, return sorted list and best card.
 * options: { goal, topCategory } from quiz — cards matching goal/topCategory get a small boost.
 */
export function recommendCardToBuy(allCards, monthlyCategorySpend, userIncome, userCreditScore, options = {}) {
  const { goal, topCategory } = options;
  const eligible = filterByEligibility(allCards, userIncome, userCreditScore);
  const totalMonthlySpend =
    CATEGORIES.reduce((s, c) => s + (Number(monthlyCategorySpend[c]) || 0), 0) || 1;
  const estimatedYearlySpend = totalMonthlySpend * 12;

  const withNet = eligible.map((card) => {
    const yearly = yearlyRewardInr(card, monthlyCategorySpend);
    const net = netValueAfterFee(card, yearly, estimatedYearlySpend);
    const annualFee = Number(card?.fees?.annual) || 0;
    const waiverSpend = Number(card?.fees?.waiverSpend) || 0;
    const effectiveFee =
      waiverSpend > 0 && estimatedYearlySpend >= waiverSpend ? 0 : annualFee;
    const boost = (cardMatchesGoal(card, goal) ? 300 : 0) + categoryBoost(card, topCategory);
    return {
      card,
      yearlyRewardInr: yearly,
      annualFee: effectiveFee,
      netValue: net,
      sortScore: net + boost,
    };
  });
  withNet.sort((a, b) => b.sortScore - a.sortScore);
  const best = withNet[0] || null;
  return {
    recommendedCard: best,
    allSimulations: withNet,
  };
}
