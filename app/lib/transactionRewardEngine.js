/**
 * Reusable per-transaction reward engine (MongoDB-shaped cards).
 * Aligns with: amount × (category_rate/100), category maxCap, rewardType → ₹.
 */

import {
  getRewardRate,
  calculateReward,
  rewardToInr,
} from "./recommendCard.js";

const DEFAULT_CATEGORIES = ["shopping", "travel", "fuel", "dining", "groceries"];

/**
 * @param {unknown} cards
 * @returns {object[]}
 */
export function loadCardsFromJson(cards) {
  if (!Array.isArray(cards)) return [];
  return cards;
}

/**
 * Category earn rate (percent) and cap for one leg.
 * @param {object} card
 * @param {string} category
 */
export function getCategoryMultiplier(card, category) {
  const { rate, maxCap } = getRewardRate(card, category);
  return { multiplier: rate, maxCap };
}

/**
 * Same as production recommendCard path: category rate (or base fallback) once, then ₹ conversion.
 * @param {object} card
 * @param {{ category: string, amount: number }} input
 * @returns {number} Estimated reward value in INR for this spend
 */
export function computeTransactionCashbackInr(card, input) {
  const category = String(input?.category || "shopping").toLowerCase();
  const amount = Number(input?.amount) || 0;
  if (amount <= 0) return 0;

  const { rate, maxCap } = getRewardRate(card, category);
  const raw = calculateReward(rate, amount, maxCap);
  return rewardToInr(card, raw);
}

/**
 * @param {object[]} cards
 * @param {{ category: string, amount: number }} input
 * @returns {{ card: string, cashback: number, cardId?: string }[]}
 */
export function computeRewardsForAllCards(cards, input) {
  const list = loadCardsFromJson(cards);
  return list.map((c) => ({
    card: String(c.cardName || "Unknown"),
    cashback: Number(computeTransactionCashbackInr(c, input).toFixed(4)),
    cardId: c._id != null ? String(c._id) : undefined,
  }));
}

/**
 * @param {{ card: string, cashback: number }[]} results
 * @param {number} [topN]
 */
export function rankCardsByCashback(results, topN = 3) {
  const copy = [...results].sort((a, b) => b.cashback - a.cashback);
  return copy.slice(0, topN);
}

/**
 * @param {object[]} cards
 * @param {{ category: string, amount: number }} input
 * @param {number} [topN]
 */
export function recommendTopCardsForTransaction(cards, input, topN = 3) {
  const rows = computeRewardsForAllCards(cards, input);
  return rankCardsByCashback(rows, topN);
}

export { DEFAULT_CATEGORIES };
