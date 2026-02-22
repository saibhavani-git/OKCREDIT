// import { NextResponse } from "next/server";
// import dbConnect from "../../lib/db";
// import User from "../../models/user";
// import Offer from "../../models/offers";
// import CreditCard from "../../models/cards";
// import {verifyAuth } from "../../lib/auth"; 


// export async function POST(request) {
//   try {
//     await dbConnect();
//     const token = request.cookies.get("authToken")?.value;
//     let user = null;
//     if (token) {
//       try {
//         const { userId } = await verifyAuth(token);
//         if (userId) {
//           user = await User.findById(userId).populate("cards").lean();
//         }
//       } catch {
//         user = null;
//       }
//     }

//     const candidateCards = user?.cards?.length ? user.cards : await CreditCard.find().lean();
//     if (!candidateCards.length) {
//       return NextResponse.json({ message: "No cards found" }, { status: 404 });
//     }

//     //  Request body
//     const { amount: requestAmount, intent } = await request.json();
    
//     // Validate amount and intent are provided
//     if (!requestAmount || !intent) {
//       return NextResponse.json(
//         { message: "Amount and intent are required" },
//         { status: 400 }
//       );
//     }

//     const amount = parseFloat(requestAmount);
//     if (isNaN(amount) || amount <= 0) {
//       return NextResponse.json(
//         { message: "Valid amount is required" },
//         { status: 400 }
//       );
//     }

//     const now = new Date();
//     const activeOffers = await Offer.find({
//       isActive: true,
//       validFrom: { $lte: now },
//       validTill: { $gte: now },
//       minTransactionAmount: { $lte: amount },
//     }).lean();

//     const offersByCardKey = activeOffers.reduce((acc, offer) => {
//       if (!Array.isArray(offer.validCards)) return acc;
//       offer.validCards.forEach((validCard) => {
//         if (!validCard?.bank || !validCard?.cardName) return;
//         const key = `${validCard.bank}::${validCard.cardName}`;
//         if (!acc[key]) acc[key] = [];
//         acc[key].push(offer);
//       });
//       return acc;
//     }, {});

//     // Map intent to spending category (for accurate reward calculations)
//     const intentToCategory = {
//       cashback: "shopping",
//       travel: "travel",
//       fuel: "fuel",
//       "online shopping": "shopping",
//       dining: "dining",
//       groceries: "groceries",
//       "rewards points": "shopping",
//       "travel miles": "travel",
//       shopping: "shopping",
//       basic: "shopping",
//       "daily-expenses": "shopping",
//       "online-shopping": "shopping",
//       "travel-bookings": "travel",
//       "fuel-savings": "fuel",
//       "dining-lifestyle": "dining",
//       "grocery-bills": "groceries",
//       "build-credit": "shopping",
//       "high-rewards": "shopping",
//       "business-expenses": "travel",
//       "low-interest": "shopping",
//     };

//     const categoryKeywords = {
//       travel: ["travel", "flight", "hotel", "miles"],
//       fuel: ["fuel", "petrol", "diesel", "hpcl", "bpcl", "iocl"],
//       dining: ["dining", "restaurant", "food", "swiggy", "zomato"],
//       groceries: ["grocery", "groceries", "supermarket"],
//       shopping: ["shopping", "amazon", "flipkart", "myntra", "online"],
//     };

//     const resolveCategoryFromCardText = (card) => {
//       const combined = [
//         card.rewardRateText || "",
//         ...(Array.isArray(card.bestFor) ? card.bestFor : []),
//         card.cardType || "",
//       ]
//         .join(" ")
//         .toLowerCase();

//       for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
//         if (keywords.some((keyword) => combined.includes(keyword))) {
//           return categoryName;
//         }
//       }

//       return "shopping";
//     };

//     const getRewardSpendUnit = (card) => {
//       const text = (card.rewardRateText || "").toLowerCase();
//       const perMatch = text.match(/per\s*[^\d]{0,3}(\d{2,5})/i);
//       if (perMatch?.[1]) {
//         const parsed = Number(perMatch[1]);
//         if (Number.isFinite(parsed) && parsed > 0) return parsed;
//       }
//       return 100;
//     };

//     const requestedCategory = intentToCategory[intent.toLowerCase()] || "shopping";

//     // Calculate benefits for each user card
//     // This calculates for ALL cards regardless of intent match
//     const calculateCardBenefits = (card, transactionAmount, spendingCategory) => {
//       const categoryFromText = resolveCategoryFromCardText(card);
//       const effectiveCategory = card.categories?.[spendingCategory]
//         ? spendingCategory
//         : categoryFromText;
//       const categoryMultiplier = card.categories?.[effectiveCategory] || 1;
//       const rewardSpendUnit = getRewardSpendUnit(card);
      
//       // Base card cashback/rewards
//       let cashback = 0;
//       let rewards = 0;
//       let rewardsValue = 0;
//       const pointValueInr = Number(card.pointValueInr) > 0 ? Number(card.pointValueInr) : 0.25;
      
//       if (card.rewardType === 'cashback') {
//         // Cashback: percentage of amount
//         // Use baseRewardRate multiplied by category multiplier
//         const cashbackRate = (card.baseRewardRate || 0) * categoryMultiplier;
//         cashback = (transactionAmount * cashbackRate) / 100;
//       } else if (card.rewardType === 'points') {
//         // Points: typically calculated as points per ₹100 spent
//         // baseRewardRate is usually points per ₹100, multiplied by category
//         const pointsRate = (card.baseRewardRate || 0) * categoryMultiplier;
//         rewards = (transactionAmount * pointsRate) / rewardSpendUnit;
//         // Convert points to value (assuming 1 point = ₹0.25, adjust as needed)
//         rewardsValue = rewards * pointValueInr;
//       } else if (card.rewardType === 'miles') {
//         // Miles: similar to points
//         const milesRate = (card.baseRewardRate || 0) * categoryMultiplier;
//         rewards = (transactionAmount * milesRate) / rewardSpendUnit;
//         // Convert miles to value (assuming 1 mile = ₹1, adjust as needed)
//         rewardsValue = rewards * pointValueInr;
//       }
      
//       // Add live offer-driven cashback/rewards/discounts for this card
//       const cardKey = `${card.bank}::${card.cardName}`;
//       const cardOffers = offersByCardKey[cardKey] || [];

//       let offerCashback = 0;
//       let offerRewards = 0;
//       let offerRewardsValue = 0;
//       let perksValue = 0;

//       cardOffers.forEach((offer) => {
//         if (offer.rewardType === "CASHBACK" || offer.rewardType === "DISCOUNT") {
//           let offerValue = (transactionAmount * (offer.rewardValue || 0)) / 100;
//           if (offer.maxRewardCap && offer.maxRewardCap > 0) {
//             offerValue = Math.min(offerValue, offer.maxRewardCap);
//           }

//           if (offer.rewardType === "CASHBACK") {
//             offerCashback += offerValue;
//           } else {
//             // Treat discount savings as perks value
//             perksValue += offerValue;
//           }
//         }

//         if (offer.rewardType === "REWARD_POINTS") {
//           const rawPoints = (transactionAmount * (offer.rewardValue || 0)) / 100;
//           const rawPointsValue = rawPoints * pointValueInr;
//           const cappedPointsValue =
//             offer.maxRewardCap && offer.maxRewardCap > 0
//               ? Math.min(rawPointsValue, offer.maxRewardCap)
//               : rawPointsValue;
//           const effectivePoints = pointValueInr > 0 ? cappedPointsValue / pointValueInr : 0;

//           offerRewards += effectivePoints;
//           offerRewardsValue += cappedPointsValue;
//         }
//       });

//       cashback += offerCashback;
//       rewards += offerRewards;
//       rewardsValue += offerRewardsValue;

//       // Total benefit from cashback + rewards monetary value + discount/perk value
//       const totalBenefit = cashback + rewardsValue + perksValue;
      
//       return {
//         cashback: Math.round(cashback * 100) / 100,
//         rewards: Math.round(rewards * 100) / 100,
//         rewardsValue: Math.round(rewardsValue * 100) / 100,
//         perksValue: Math.round(perksValue * 100) / 100,
//         totalBenefit: Math.round(totalBenefit * 100) / 100,
//         categoryMultiplier,
//         rewardType: card.rewardType,
//         usedCategory: effectiveCategory
//       };
//     };

//     // Calculate benefits for ALL user cards, regardless of intent match
//     // Each card will show its benefits based on the selected category multiplier
//     const userCardsWithBenefits = candidateCards.map(card => {
//       const benefits = calculateCardBenefits(card, amount, requestedCategory);
//       return {
//         ...card,
//         ...benefits,
//         _id: card._id.toString()
//       };
//     });

//     // Sort by total benefit in descending order
//     const sortedCards = userCardsWithBenefits.sort((a, b) => b.totalBenefit - a.totalBenefit);
//     const topCards = sortedCards.slice(0, 3);

//     // Return top user cards sorted by total benefit
//     return NextResponse.json({
//       cards: topCards,
//       cardIds: topCards.map(c => c._id),
//       message: `Showing top ${topCards.length} card(s) for amount ${amount} and intent "${intent}".`
//     });
//   } catch (error) {
//     console.error("Error generating recommendation:", error);

//     return NextResponse.json(
//       { message: "Failed to generate recommendation" },
//       { status: 500 }
//     );
//   }
// }



import { NextResponse } from "next/server";
import dbConnect from "../../lib/db";
import User from "../../models/user";
import Offer from "../../models/offers";
import CreditCard from "../../models/cards";
import { verifyAuth } from "../../lib/auth";

// ─── Intent → canonical spending category ────────────────────────────────────
const INTENT_TO_CATEGORY = {
  "daily-expenses":    "shopping",
  "online-shopping":   "shopping",
  "build-credit":      "shopping",
  "high-rewards":      "shopping",
  "low-interest":      "shopping",
  cashback:            "shopping",
  "rewards points":    "shopping",
  shopping:            "shopping",
  basic:               "shopping",
  "travel-bookings":   "travel",
  "business-expenses": "travel",
  travel:              "travel",
  "travel miles":      "travel",
  "fuel-savings":      "fuel",
  fuel:                "fuel",
  "dining-lifestyle":  "dining",
  dining:              "dining",
  "grocery-bills":     "groceries",
  groceries:           "groceries",
};

// Keyword fallback — infer category from card's own text fields
const CATEGORY_KEYWORDS = {
  travel:    ["travel", "flight", "hotel", "miles"],
  fuel:      ["fuel", "petrol", "diesel", "hpcl", "bpcl", "iocl"],
  dining:    ["dining", "restaurant", "food", "swiggy", "zomato"],
  groceries: ["grocery", "groceries", "supermarket"],
  shopping:  ["shopping", "amazon", "flipkart", "myntra", "online"],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Maps intent string → canonical category. Never silently returns undefined. */
function resolveCategory(intent) {
  const key = intent.trim().toLowerCase();
  if (INTENT_TO_CATEGORY[key]) return INTENT_TO_CATEGORY[key];

  // Partial match — handles sentence-style intents
  for (const [intentKey, cat] of Object.entries(INTENT_TO_CATEGORY)) {
    if (key.includes(intentKey)) return cat;
  }
  return "shopping";
}

/**
 * Infers category from card text when the card has no explicit rate for
 * the requested category.
 */
function inferCategoryFromCard(card) {
  const combined = [
    card.rewardRateText ?? "",
    ...(Array.isArray(card.bestFor) ? card.bestFor : []),
    card.cardType ?? "",
  ]
    .join(" ")
    .toLowerCase();

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => combined.includes(kw))) return cat;
  }
  return "shopping";
}

/**
 * Parses the denominator from rewardRateText.
 * e.g. "5 pts per ₹100" → 100, "2 pts per Rs.150" → 150
 * Falls back to 100 if unparseable.
 */
function getRewardSpendUnit(card) {
  const text = (card.rewardRateText ?? "").toLowerCase();
  const match = text.match(/per\s*(?:₹|rs\.?|inr)?\s*(\d{2,5})/i);
  if (match) {
    const parsed = Number(match[1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 100;
}

/**
 * Safe point-value accessor.
 * Distinguishes null/undefined (→ default 0.25) from explicit 0
 * (→ card has no monetary point value).
 */
function getPointValue(card) {
  if (card.pointValueInr == null) return 0.25;
  const v = Number(card.pointValueInr);
  return Number.isFinite(v) ? v : 0.25;
}

/**
 * Groups active offers by "bank::cardName" for O(1) lookup during scoring.
 */
function buildOfferLookup(offers) {
  const map = new Map();
  for (const offer of offers) {
    if (!Array.isArray(offer.validCards)) continue;
    for (const vc of offer.validCards) {
      if (!vc?.bank || !vc?.cardName) continue;
      const key = `${vc.bank}::${vc.cardName}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(offer);
    }
  }
  return map;
}

// ─── Core benefit calculator ─────────────────────────────────────────────────

/**
 * Calculates cashback, reward points/miles, offer bonuses, and perks value
 * for a single card given a transaction amount and the user's spending category.
 *
 * Category multiplier logic (fixed):
 *   - Use `requestedCategory` if the card explicitly defines a rate for it
 *     (checked with `in` operator, not truthiness, so 0 is still valid).
 *   - Otherwise fall back to the category inferred from the card's own text.
 *
 * @param {object}              card
 * @param {number}              amount
 * @param {string}              requestedCategory
 * @param {Map<string,object[]>} offerLookup
 */
function calculateCardBenefits(card, amount, requestedCategory, offerLookup) {
  const categories = card.categories ?? {};

  // FIX: use `in` so an explicit 0 multiplier isn't skipped
  const hasExplicitRate = requestedCategory in categories;
  const usedCategory    = hasExplicitRate ? requestedCategory : inferCategoryFromCard(card);

  // FIX: default to 1 only when key truly absent, preserve 0 when explicit
  const categoryMultiplier = usedCategory in categories ? categories[usedCategory] : 1;

  const rewardSpendUnit = getRewardSpendUnit(card);
  const pointValue      = getPointValue(card);
  const baseRate        = card.baseRewardRate ?? 0;
  const effectiveRate   = baseRate * categoryMultiplier;

  // ── Base card rewards ──────────────────────────────────────────────
  let cashback     = 0;
  let rewards      = 0;   // raw points or miles
  let rewardsValue = 0;   // monetary equivalent of rewards

  switch (card.rewardType) {
    case "cashback":
      // effectiveRate is a percentage → divide by 100
      cashback = (amount * effectiveRate) / 100;
      break;

    case "points":
    case "miles":
      // effectiveRate = points per `rewardSpendUnit` rupees
      rewards      = (amount / rewardSpendUnit) * effectiveRate;
      rewardsValue = rewards * pointValue;
      break;

    default:
      // Unknown rewardType — log in dev, treat as 0 benefit
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[recommendation] Unknown rewardType "${card.rewardType}" on card "${card.cardName}"`);
      }
  }

  // ── Live offer bonuses ─────────────────────────────────────────────
  const cardKey   = `${card.bank}::${card.cardName}`;
  const cardOffers = offerLookup.get(cardKey) ?? [];

  let offerCashback     = 0;
  let offerRewards      = 0;
  let offerRewardsValue = 0;
  let perksValue        = 0;   // monetary value of discount-type offers

  for (const offer of cardOffers) {
    const raw = (amount * (offer.rewardValue ?? 0)) / 100;

    switch (offer.rewardType) {
      case "CASHBACK": {
        const capped = offer.maxRewardCap > 0 ? Math.min(raw, offer.maxRewardCap) : raw;
        offerCashback += capped;
        break;
      }

      case "DISCOUNT": {
        // Discount saves money → treat as perks value, not cashback
        const capped = offer.maxRewardCap > 0 ? Math.min(raw, offer.maxRewardCap) : raw;
        perksValue += capped;
        break;
      }

      case "REWARD_POINTS": {
        const rawPtsValue  = raw * pointValue;
        const cappedPtsVal = offer.maxRewardCap > 0 ? Math.min(rawPtsValue, offer.maxRewardCap) : rawPtsValue;
        const effectivePts = pointValue > 0 ? cappedPtsVal / pointValue : 0;

        offerRewards      += effectivePts;
        offerRewardsValue += cappedPtsVal;
        break;
      }

      default:
        break;
    }
  }

  const totalCashback     = cashback + offerCashback;
  const totalRewards      = rewards  + offerRewards;
  const totalRewardsValue = rewardsValue + offerRewardsValue;
  const totalBenefit      = totalCashback + totalRewardsValue + perksValue;

  const r2 = (n) => Math.round(n * 100) / 100;

  return {
    cashback:           r2(totalCashback),
    rewards:            r2(totalRewards),
    rewardsValue:       r2(totalRewardsValue),
    perksValue:         r2(perksValue),
    totalBenefit:       r2(totalBenefit),
    categoryMultiplier,
    rewardType:         card.rewardType,
    usedCategory,
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    await dbConnect();

    // ── Auth (optional) ────────────────────────────────────────────────
    let user = null;
    const token = request.cookies.get("authToken")?.value;
    if (token) {
      try {
        const { userId } = await verifyAuth(token);
        if (userId) user = await User.findById(userId).populate("cards").lean();
      } catch {
        user = null; // expired / invalid token → unauthenticated, not an error
      }
    }

    // ── Parse & validate body ──────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: "Request body must be valid JSON." }, { status: 400 });
    }

    const { amount: rawAmount, intent: rawIntent } = body;

    if (rawAmount == null || rawIntent == null) {
      return NextResponse.json({ message: "Both 'amount' and 'intent' are required." }, { status: 400 });
    }

    if (typeof rawIntent !== "string" || !rawIntent.trim() || rawIntent.length > 200) {
      return NextResponse.json({ message: "'intent' must be a non-empty string (max 200 chars)." }, { status: 400 });
    }

    const amount = parseFloat(rawAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ message: "'amount' must be a positive number." }, { status: 400 });
    }

    // ── Candidate cards ────────────────────────────────────────────────
    const candidateCards =
      user?.cards?.length > 0
        ? user.cards
        : await CreditCard.find().lean();

    if (!candidateCards.length) {
      return NextResponse.json({ message: "No cards found." }, { status: 404 });
    }

    // ── Active offers ──────────────────────────────────────────────────
    const now = new Date();
    const activeOffers = await Offer.find({
      isActive: true,
      validFrom:              { $lte: now },
      validTill:              { $gte: now },
      minTransactionAmount:   { $lte: amount },
    }).lean();

    const offerLookup = buildOfferLookup(activeOffers);

    // ── Resolve category from intent ───────────────────────────────────
    const requestedCategory = resolveCategory(rawIntent);

    // ── Score every card ───────────────────────────────────────────────
    const scoredCards = candidateCards
      .map((card) => {
        const benefits = calculateCardBenefits(card, amount, requestedCategory, offerLookup);
        return {
          ...card,
          ...benefits,
          _id: card._id.toString(), // serialize ObjectId for JSON
        };
      })
      .sort((a, b) => b.totalBenefit - a.totalBenefit);

    const topCards = scoredCards.slice(0, 3);

    return NextResponse.json({
      cards:            topCards,
      cardIds:          topCards.map((c) => c._id),
      resolvedCategory: requestedCategory,
      message:          `Top ${topCards.length} card(s) for ₹${amount} · intent: "${rawIntent}" · category: ${requestedCategory}`,
    });
  } catch (error) {
    console.error("[recommendation] Unexpected error:", error);
    return NextResponse.json({ message: "Failed to generate recommendation." }, { status: 500 });
  }
}