/**
 * Credit Card Recommendation Engine
 *
 * Given category, amount, merchant, user-owned cards, and full card catalog,
 * returns best owned card, best overall card, and top 3 recommended cards.
 * Complexity: O(N log N) where N = number of cards.
 */

/**
 * Normalizes category config: supports both legacy (number = rate) and new
 * schema { rate, maxCap, period }. Returns { rate, maxCap }.
 * @param {number|{ rate: number, maxCap?: number, period?: string }|undefined} val
 * @returns {{ rate: number, maxCap: number }}
 */
function normalizeCategoryValue(val) {
  if (val == null) return { rate: 0, maxCap: Infinity };
  if (typeof val === "number") return { rate: val, maxCap: Infinity };
  const rate = Number(val.rate);
  const maxCap = val.maxCap != null && Number.isFinite(Number(val.maxCap))
    ? Number(val.maxCap)
    : Infinity;
  return { rate: Number.isFinite(rate) ? rate : 0, maxCap };
}

/**
 * Gets reward rate and maxCap for a card and category.
 * If category exists in card.categories, use its rate and maxCap;
 * otherwise use card.baseRewardRate and no cap (Infinity).
 *
 * @param {Object} card - Card object with categories and baseRewardRate
 * @param {string} category - Transaction category (shopping, fuel, dining, travel, groceries, etc.)
 * @returns {{ rate: number, maxCap: number }}
 */
export function getRewardRate(card, category) {
  const catConfig = card.categories?.[category];
  if (catConfig != null) {
    return normalizeCategoryValue(catConfig);
  }
  const baseRate = Number(card.baseRewardRate);
  return {
    rate: Number.isFinite(baseRate) ? baseRate : 0,
    maxCap: Infinity,
  };
}

/**
 * Calculates raw reward and applies cap.
 * reward = amount * rate / 100, then reward = min(reward, maxCap).
 * For cashback cards the result is in ₹; for points/miles cards the result is in points/miles.
 *
 * @param {number} rate - Reward rate (e.g. 5 for 5% cashback, or 4 for 4 points per ₹100)
 * @param {number} amount - Transaction amount
 * @param {number} maxCap - Maximum reward allowed (use Infinity for no cap)
 * @returns {number} Capped reward value (₹ for cashback, points/miles for points/miles)
 */
export function calculateReward(rate, amount, maxCap) {
  if (!Number.isFinite(rate) || !Number.isFinite(amount) || amount <= 0) {
    return 0;
  }
  const raw = (amount * rate) / 100;
  const cap = Number.isFinite(maxCap) && maxCap >= 0 ? maxCap : Infinity;
  return Math.min(raw, cap);
}

/**
 * Converts reward to INR for fair comparison when ranking.
 * Cashback is already in ₹; points/miles are converted using card.pointValueInr.
 *
 * @param {Object} card - Card with rewardType and pointValueInr
 * @param {number} rawReward - Reward in card's natural unit (₹ or points/miles)
 * @returns {number} Reward value in INR
 */
export function rewardToInr(card, rawReward) {
  const type = (card.rewardType || "").toLowerCase();
  if (type === "cashback") return Number(rawReward) || 0;
  const pointValue = Number(card.pointValueInr);
  const valueInr = Number.isFinite(pointValue) && pointValue > 0 ? pointValue : 0.25;
  return (Number(rawReward) || 0) * valueInr;
}

/**
 * Computes score for ranking: reward value (in INR) + popularity weight + merchant boost.
 * Uses rewardInr so cashback and points/miles cards are comparable.
 *
 * @param {Object} card - Card object with popularityScore and bestFor
 * @param {number} rewardInr - Reward value in INR (use rewardToInr for points/miles cards)
 * @param {string} merchant - Merchant name (e.g. Amazon, Swiggy, Uber)
 * @returns {number} Score for sorting (higher = better)
 */
export function calculateScore(card, rewardInr, merchant) {
  let score = Number(rewardInr) || 0;

  // Popularity weight: 0.01 per popularity point
  const popularity = Number(card.popularityScore);
  if (Number.isFinite(popularity) && popularity >= 0) {
    score += popularity * 0.01;
  }

  // Merchant boost: +10 if merchant matches any bestFor keyword
  const bestFor = Array.isArray(card.bestFor) ? card.bestFor : [];
  const merchantNorm = (merchant || "").toLowerCase().trim();
  if (merchantNorm) {
    const hasMatch = bestFor.some((keyword) => {
      if (typeof keyword !== "string") return false;
      const kw = keyword.toLowerCase().trim();
      return kw && (kw.includes(merchantNorm) || merchantNorm.includes(kw));
    });
    if (hasMatch) score += 10;
  }

  return score;
}

/**
 * Main recommendation function.
 *
 * 1. Loops through allCards, skips cards where amount > card.limits.available.
 * 2. For each card: get rate/maxCap via getRewardRate, compute reward via calculateReward, score via calculateScore.
 * 3. Sorts by score descending.
 * 4. bestOwnedCard = first card in sorted list whose cardName is in userOwnedCards.
 * 5. bestOverallCard = first card in sorted list.
 * 6. recommendedCards = top 3 by score.
 *
 * @param {string} category - Transaction category (shopping, fuel, dining, travel, groceries, etc.)
 * @param {number} amount - Transaction amount
 * @param {string} merchant - Merchant name (e.g. Amazon, Swiggy)
 * @param {string[]} userOwnedCards - Array of card names the user owns
 * @param {Object[]} allCards - Array of all card objects (full catalog)
 * @returns {{
 *   bestOwnedCard: { cardName: string, expectedReward: number } | null,
 *   bestOverallCard: { cardName: string, expectedReward: number } | null,
 *   recommendedCards: Array<{ cardName: string, expectedReward: number, score: number, card?: Object }>
 * }}
 */
export function recommendCard(category, amount, merchant, userOwnedCards, allCards) {
  const ownedSet = new Set(
    (userOwnedCards || []).map((name) => (name || "").toString().trim()).filter(Boolean)
  );

  // Step 1 & 2: Build list of results, skipping cards with insufficient limit
  const results = [];

  for (const card of allCards || []) {
    const available = Number(card?.limits?.available ?? card?.limits?.max ?? 0);
    if (!Number.isFinite(available) || amount > available) {
      continue; // Ignore: amount exceeds available limit
    }

    const { rate, maxCap } = getRewardRate(card, category);
    const rawReward = calculateReward(rate, amount, maxCap);
    const rewardInr = rewardToInr(card, rawReward);
    const score = calculateScore(card, rewardInr, merchant);

    results.push({
      cardName: (card.cardName || "Unknown").toString(),
      expectedReward: rawReward,
      expectedRewardInr: rewardInr,
      score,
      card,
    });
  }

  // Step 3: Sort by score descending — O(N log N)
  results.sort((a, b) => b.score - a.score);

  // Step 4: Best card the user already owns (first in sorted list that is owned)
  let bestOwnedCard = null;
  for (const r of results) {
    if (ownedSet.has(r.cardName)) {
      bestOwnedCard = {
        cardName: r.cardName,
        expectedReward: r.expectedReward,
        expectedRewardInr: r.expectedRewardInr,
      };
      break;
    }
  }

  // Step 5: Best overall = first in sorted list
  const bestOverallCard =
    results.length > 0
      ? {
          cardName: results[0].cardName,
          expectedReward: results[0].expectedReward,
          expectedRewardInr: results[0].expectedRewardInr,
        }
      : null;

  // Step 6: Top 3 recommended cards (all cards, by score)
  const recommendedCards = results.slice(0, 3).map((r) => ({
    cardName: r.cardName,
    expectedReward: r.expectedReward,
    expectedRewardInr: r.expectedRewardInr,
    score: r.score,
    card: r.card,
  }));

  // Top 3 cards the user owns (for UI "Pay" list)
  const topOwnedCards = results
    .filter((r) => ownedSet.has(r.cardName))
    .slice(0, 3)
    .map((r) => ({
      cardName: r.cardName,
      expectedReward: r.expectedReward,
      expectedRewardInr: r.expectedRewardInr,
      score: r.score,
      card: r.card,
    }));

  return {
    bestOwnedCard,
    bestOverallCard,
    recommendedCards,
    topOwnedCards,
  };
}
