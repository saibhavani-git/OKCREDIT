/**
 * ML-Powered Card Recommendation Engine
 * Uses collaborative filtering + user behavior analysis
 */

/**
 * Analyzes user's transaction history to build a preference profile
 */
export async function buildUserProfile(transactions) {
  if (!transactions || transactions.length === 0) {
    return null;
  }

  const profile = {
    totalTransactions: transactions.length,
    categoryPreferences: {},
    amountRanges: {},
    cardPerformance: {},
    timePatterns: {},
    avgTransactionAmount: 0,
    preferredCategories: [],
  };

  let totalAmount = 0;

  // Analyze each transaction
  transactions.forEach((txn) => {
    const category = txn.resolvedCategory || "shopping";
    const amount = Number(txn.amount) || 0;
    const cardId = String(txn.card);
    const benefit = Number(txn.totalBenefit) || 0;
    const hour = new Date(txn.createdAt).getHours();

    totalAmount += amount;

    // Category frequency and total spend
    if (!profile.categoryPreferences[category]) {
      profile.categoryPreferences[category] = {
        count: 0,
        totalSpend: 0,
        totalBenefit: 0,
        avgBenefit: 0,
      };
    }
    profile.categoryPreferences[category].count++;
    profile.categoryPreferences[category].totalSpend += amount;
    profile.categoryPreferences[category].totalBenefit += benefit;

    // Amount range patterns
    const range = getAmountRange(amount);
    profile.amountRanges[range] = (profile.amountRanges[range] || 0) + 1;

    // Card performance tracking
    if (!profile.cardPerformance[cardId]) {
      profile.cardPerformance[cardId] = {
        usageCount: 0,
        totalBenefit: 0,
        avgBenefit: 0,
        categories: {},
      };
    }
    profile.cardPerformance[cardId].usageCount++;
    profile.cardPerformance[cardId].totalBenefit += benefit;
    if (!profile.cardPerformance[cardId].categories[category]) {
      profile.cardPerformance[cardId].categories[category] = 0;
    }
    profile.cardPerformance[cardId].categories[category]++;

    // Time patterns (morning, afternoon, evening, night)
    const timeSlot = getTimeSlot(hour);
    profile.timePatterns[timeSlot] = (profile.timePatterns[timeSlot] || 0) + 1;
  });

  // Calculate averages
  profile.avgTransactionAmount = totalAmount / transactions.length;

  Object.keys(profile.categoryPreferences).forEach((cat) => {
    const pref = profile.categoryPreferences[cat];
    pref.avgBenefit = pref.totalBenefit / pref.count;
  });

  Object.keys(profile.cardPerformance).forEach((cardId) => {
    const perf = profile.cardPerformance[cardId];
    perf.avgBenefit = perf.totalBenefit / perf.usageCount;
  });

  // Identify top 3 preferred categories
  profile.preferredCategories = Object.entries(profile.categoryPreferences)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3)
    .map(([cat]) => cat);

  return profile;
}

/**
 * ML-based card scoring with personalization
 */
export function mlScoreCard(card, userProfile, transactionContext) {
  const { amount, category } = transactionContext;
  
  let mlScore = 0;

  // 1. Historical Performance Score (0-100 points)
  if (userProfile && userProfile.cardPerformance) {
    const cardId = String(card._id);
    const cardPerf = userProfile.cardPerformance[cardId];
    
    if (cardPerf) {
      // Card has been used before
      const usageFrequency = cardPerf.usageCount / userProfile.totalTransactions;
      const categoryMatch = cardPerf.categories[category] || 0;
      const categoryFrequency = categoryMatch / cardPerf.usageCount;
      
      mlScore += usageFrequency * 50; // 0-50 points for overall usage
      mlScore += categoryFrequency * 30; // 0-30 points for category match
      mlScore += Math.min(cardPerf.avgBenefit / 10, 20); // 0-20 points for past benefits
    }
  }

  // 2. Category Affinity Score (0-50 points)
  if (userProfile && userProfile.categoryPreferences) {
    const categoryPref = userProfile.categoryPreferences[category];
    if (categoryPref) {
      const categoryImportance = categoryPref.count / userProfile.totalTransactions;
      mlScore += categoryImportance * 50;
    }
  }

  // 3. Amount Pattern Score (0-30 points)
  if (userProfile && userProfile.avgTransactionAmount) {
    const amountRatio = amount / userProfile.avgTransactionAmount;
    if (amountRatio >= 0.5 && amountRatio <= 2.0) {
      // Transaction is within typical range
      mlScore += 30;
    } else if (amountRatio >= 0.3 && amountRatio <= 3.0) {
      mlScore += 15;
    }
  }

  // 4. Exploration Bonus (0-20 points)
  // Encourage trying new cards occasionally
  if (userProfile && userProfile.cardPerformance) {
    const cardId = String(card._id);
    if (!userProfile.cardPerformance[cardId]) {
      // New card - give exploration bonus
      mlScore += 10;
    }
  }

  return Math.round(mlScore);
}

/**
 * Predict user satisfaction based on historical patterns
 */
export function predictSatisfaction(card, userProfile, transactionContext) {
  if (!userProfile || !userProfile.cardPerformance) {
    return 0.5; // Neutral prediction
  }

  const cardId = String(card._id);
  const cardPerf = userProfile.cardPerformance[cardId];
  const { category } = transactionContext;

  if (!cardPerf) {
    // New card - predict based on category preferences
    const categoryPref = userProfile.categoryPreferences[category];
    if (categoryPref && categoryPref.avgBenefit > 0) {
      return Math.min(categoryPref.avgBenefit / 500, 1.0);
    }
    return 0.5;
  }

  // Card has history
  const categoryUsage = cardPerf.categories[category] || 0;
  const categoryFrequency = categoryUsage / cardPerf.usageCount;
  const benefitScore = Math.min(cardPerf.avgBenefit / 500, 1.0);

  return (categoryFrequency * 0.6) + (benefitScore * 0.4);
}

/**
 * Collaborative filtering: Find similar users and their preferences
 */
export function findSimilarUserPatterns(userProfile, allTransactions) {
  // This would typically query other users' transactions
  // For now, we'll use a simplified version
  
  if (!userProfile || !userProfile.preferredCategories) {
    return null;
  }

  // In a full implementation, you'd:
  // 1. Find users with similar category preferences
  // 2. Identify cards they use frequently
  // 3. Recommend those cards to current user
  
  return {
    similarityScore: 0.7,
    recommendedCards: [],
  };
}

/**
 * Time-based recommendation adjustment
 */
export function getTimeBasedBonus(userProfile) {
  if (!userProfile || !userProfile.timePatterns) {
    return 0;
  }

  const currentHour = new Date().getHours();
  const currentSlot = getTimeSlot(currentHour);
  const slotFrequency = userProfile.timePatterns[currentSlot] || 0;
  const totalTransactions = userProfile.totalTransactions;

  // Boost if user typically transacts at this time
  return (slotFrequency / totalTransactions) * 10;
}

/**
 * Diversity score to prevent over-recommending same card
 */
export function calculateDiversityBonus(card, recentRecommendations) {
  if (!recentRecommendations || recentRecommendations.length === 0) {
    return 0;
  }

  const cardId = String(card._id);
  const timesRecommended = recentRecommendations.filter(
    (rec) => String(rec.cardId) === cardId
  ).length;

  // Penalize if recommended too often recently
  return Math.max(0, 10 - (timesRecommended * 3));
}

// ── Helper Functions ──────────────────────────────────────────────────────

function getAmountRange(amount) {
  if (amount < 500) return "micro";
  if (amount < 2000) return "small";
  if (amount < 5000) return "medium";
  if (amount < 20000) return "large";
  return "xlarge";
}

function getTimeSlot(hour) {
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

/**
 * Feature engineering for advanced ML models
 */
export function extractFeatures(card, userProfile, transactionContext) {
  const features = {
    // Card features
    cardPopularity: card.popularityScore || 0,
    cardAnnualFee: card.fees?.annual || 0,
    cardJoiningFee: card.fees?.joining || 0,
    cardRewardRate: card.baseRewardRate || 0,
    cardType: card.cardType || "Basic",
    
    // User features
    userExperience: userProfile?.totalTransactions || 0,
    userAvgSpend: userProfile?.avgTransactionAmount || 0,
    userCategoryAffinity: 0,
    
    // Context features
    transactionAmount: transactionContext.amount,
    transactionCategory: transactionContext.category,
    isWeekend: new Date().getDay() % 6 === 0,
    
    // Interaction features
    cardUsedBefore: false,
    cardCategoryMatch: 0,
  };

  if (userProfile) {
    const cardId = String(card._id);
    const cardPerf = userProfile.cardPerformance?.[cardId];
    
    if (cardPerf) {
      features.cardUsedBefore = true;
      features.cardCategoryMatch = cardPerf.categories[transactionContext.category] || 0;
    }

    const categoryPref = userProfile.categoryPreferences?.[transactionContext.category];
    if (categoryPref) {
      features.userCategoryAffinity = categoryPref.count / userProfile.totalTransactions;
    }
  }

  return features;
}
