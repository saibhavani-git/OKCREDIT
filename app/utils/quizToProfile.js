const CATEGORIES = ["shopping", "travel", "dining", "fuel", "groceries"];

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

export function convertQuizToSpendingProfile(answers = {}) {
  const weights = {
    shopping: 0,
    travel: 0,
    dining: 0,
    fuel: 0,
    groceries: 0,
  };

  const primary = answers.primaryCategory;
  if (primary && weights[primary] !== undefined) {
    weights[primary] += 40;
  }

  const secondary = Array.isArray(answers.secondaryCategories)
    ? answers.secondaryCategories
    : [];
  secondary.forEach((cat) => {
    if (weights[cat] !== undefined) weights[cat] += 20;
  });

  CATEGORIES.forEach((cat) => {
    weights[cat] += 10;
  });

  const total = CATEGORIES.reduce((sum, cat) => sum + weights[cat], 0) || 1;

  return CATEGORIES.reduce((acc, cat) => {
    acc[cat] = Number(((weights[cat] / total) * 100).toFixed(2));
    return acc;
  }, {});
}

export function convertProfileToMonthlyAmounts(spendingProfile = {}, totalSpend = 10000) {
  const monthlySpend = clamp(Number(totalSpend) || 10000, 1000, 1000000);
  return CATEGORIES.reduce((acc, cat) => {
    const pct = Number(spendingProfile[cat]) || 0;
    acc[cat] = Number(((pct / 100) * monthlySpend).toFixed(2));
    return acc;
  }, {});
}

/** Payload for POST /api/recommend — reward engine uses spendingProfile + quiz context */
export function buildRecommendationPayload(answers = {}, totalSpend = 10000) {
  const percentages = convertQuizToSpendingProfile(answers);
  const spendingProfile = convertProfileToMonthlyAmounts(percentages, totalSpend);
  return {
    spendingProfile,
    percentages,
    totalSpend: Number(totalSpend) || 10000,
    /** Sent as-is; API treats empty as neutral (no cashback bias). */
    rewardPreference: String(answers.rewardPreference || "").trim(),
    feePreference: answers.feePreference || "no",
    /** No default — avoids silently tagging every session as “low cashback” (+bias to cashback cards). */
    painPoint: answers.painPoint != null && answers.painPoint !== "" ? answers.painPoint : "",
    primaryCategory: answers.primaryCategory || "",
    secondaryCategories: Array.isArray(answers.secondaryCategories)
      ? answers.secondaryCategories
      : [],
  };
}
