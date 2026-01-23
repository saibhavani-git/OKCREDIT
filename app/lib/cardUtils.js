/**
 * Calculate cashback/reward percentage for a specific category
 * @param {Object} card - Card object from database
 * @param {String} category - Category name: 'shopping', 'travel', 'fuel', 'dining', 'groceries'
 * @returns {Number} - Cashback percentage
 */
export function getCashbackPercentage(card, category) {
  if (!card || !category) return 0;
  
  const baseRate = card.baseRewardRate || 0;
  const categoryMultiplier = card.categories?.[category] || 1;
  
  // For cashback cards, multiply base rate by category multiplier
  if (card.rewardType === 'cashback') {
    return baseRate * categoryMultiplier;
  }
  
  // For points/miles, return the multiplier (points per ₹100)
  return categoryMultiplier;
}

/**
 * Get maximum cashback percentage across all categories
 * @param {Object} card - Card object from database
 * @returns {Number} - Maximum cashback percentage
 */
export function getMaxCashbackPercentage(card) {
  if (!card || !card.categories) return 0;
  
  const baseRate = card.baseRewardRate || 0;
  const multipliers = Object.values(card.categories);
  const maxMultiplier = Math.max(...multipliers);
  
  if (card.rewardType === 'cashback') {
    return baseRate * maxMultiplier;
  }
  
  return maxMultiplier;
}

/**
 * Get cashback percentage for a specific category as formatted string
 * @param {Object} card - Card object from database
 * @param {String} category - Category name
 * @returns {String} - Formatted percentage string (e.g., "5%")
 */
export function getCashbackPercentageText(card, category) {
  const percentage = getCashbackPercentage(card, category);
  
  if (card.rewardType === 'cashback') {
    return `${percentage}%`;
  } else if (card.rewardType === 'points') {
    return `${percentage}X points`;
  } else if (card.rewardType === 'miles') {
    return `${percentage}X miles`;
  }
  
  return 'N/A';
}

/**
 * Get all category cashback percentages
 * @param {Object} card - Card object from database
 * @returns {Object} - Object with category names as keys and percentages as values
 */
export function getAllCategoryCashbacks(card) {
  if (!card || !card.categories) return {};
  
  const baseRate = card.baseRewardRate || 0;
  const categories = ['shopping', 'travel', 'fuel', 'dining', 'groceries'];
  const result = {};
  
  categories.forEach(category => {
    const multiplier = card.categories[category] || 1;
    if (card.rewardType === 'cashback') {
      result[category] = baseRate * multiplier;
    } else {
      result[category] = multiplier;
    }
  });
  
  return result;
}

/**
 * Extract percentage from rewardRateText string
 * @param {String} rewardRateText - Reward rate text string
 * @returns {Array} - Array of percentage numbers found in the text
 */
export function extractPercentagesFromText(rewardRateText) {
  if (!rewardRateText) return [];
  
  // Match patterns like "5%", "10%", "1.5%", etc.
  const percentageRegex = /(\d+\.?\d*)%/g;
  const matches = rewardRateText.match(percentageRegex);
  
  if (!matches) return [];
  
  return matches.map(match => parseFloat(match.replace('%', '')));
}

