/**
 * Quiz → normalized feature alignment with card catalog → match % (0–100).
 * Used for top-K card ranking by profile fit (reward type, fees, perks, category emphasis).
 */

export const QUIZ_CATEGORIES = [
  "shopping",
  "travel",
  "fuel",
  "dining",
  "groceries",
];

const REWARD_TYPES = ["cashback", "points", "miles"];

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function normalizeCategoryWeights(input) {
  const w = {};
  let sum = 0;
  if (input?.categoryWeights && typeof input.categoryWeights === "object") {
    for (const c of QUIZ_CATEGORIES) {
      const v = Number(input.categoryWeights[c]);
      if (Number.isFinite(v) && v >= 0) {
        w[c] = v;
        sum += v;
      }
    }
  }
  if (sum <= 0 && input?.topCategory) {
    const top = String(input.topCategory).toLowerCase();
    if (top === "spread" || !QUIZ_CATEGORIES.includes(top)) {
      const u = 1 / QUIZ_CATEGORIES.length;
      QUIZ_CATEGORIES.forEach((c) => (w[c] = u));
    } else {
      const rest = (1 - 0.45) / (QUIZ_CATEGORIES.length - 1);
      QUIZ_CATEGORIES.forEach((c) => {
        w[c] = c === top ? 0.45 : rest;
      });
    }
    sum = 1;
  }
  if (sum <= 0) {
    const u = 1 / QUIZ_CATEGORIES.length;
    QUIZ_CATEGORIES.forEach((c) => (w[c] = u));
    sum = 1;
  }
  const out = {};
  QUIZ_CATEGORIES.forEach((c) => {
    out[c] = (w[c] || 0) / sum;
  });
  return out;
}

function cardCategoryRates(card) {
  const base = Number(card?.baseRewardRate) || 0;
  const out = {};
  for (const c of QUIZ_CATEGORIES) {
    const raw = card?.categories?.[c];
    const rate =
      typeof raw === "number"
        ? raw
        : Number(raw?.rate) || base;
    out[c] = clamp(Number(rate) || 0, 0, 20);
  }
  return out;
}

/** L2-normalize values into a unit vector for cosine-style similarity. */
function unitVector(obj, keys) {
  let sq = 0;
  const v = keys.map((k) => {
    const x = Number(obj[k]) || 0;
    sq += x * x;
    return x;
  });
  const norm = Math.sqrt(sq) || 1;
  return v.map((x) => x / norm);
}

/**
 * @param {object} input
 * @param {Record<string, number>} [input.categoryWeights]
 * @param {string} [input.topCategory]
 * @param {string} [input.rewardPreference] cashback | points | miles
 * @param {string} [input.feePreference] no_fee | low_fee | flexible
 * @param {string[]} [input.perks]
 * @returns {{ vector: number[], meta: object }}
 */
export function buildUserFeatureVector(input) {
  const catW = normalizeCategoryWeights(input);
  const uCat = unitVector(catW, QUIZ_CATEGORIES);

  const rp = String(input?.rewardPreference || "cashback").toLowerCase();
  const rewardIdx = REWARD_TYPES.includes(rp) ? REWARD_TYPES.indexOf(rp) : 0;
  const rewardOneHot = REWARD_TYPES.map((_, i) => (i === rewardIdx ? 1 : 0));

  const fp = String(input?.feePreference || "flexible").toLowerCase();
  const feeOneHot = [
    fp === "no_fee" ? 1 : 0,
    fp === "low_fee" ? 1 : 0,
    fp === "flexible" || fp === "ok_fee" ? 1 : 0,
  ];

  const perksDesired = Array.isArray(input?.perks)
    ? input.perks.map((p) => String(p).toUpperCase())
    : [];

  const vector = [...uCat, ...rewardOneHot, ...feeOneHot];
  return {
    vector,
    meta: { catW, rewardPreference: REWARD_TYPES[rewardIdx], feePreference: fp, perksDesired },
  };
}

/**
 * Card side: same structural dims as user vector prefix (5 cat + 3 reward + 3 fee soft scores).
 * Perks are compared separately (Jaccard).
 */
export function buildCardFeatureVector(card) {
  const rates = cardCategoryRates(card);
  const maxR = Math.max(...Object.values(rates), 0.5);
  const catStrength = {};
  QUIZ_CATEGORIES.forEach((c) => {
    catStrength[c] = rates[c] / maxR;
  });
  const cCat = unitVector(catStrength, QUIZ_CATEGORIES);

  const crt = String(card?.rewardType || "").toLowerCase();
  const rewardAlign = REWARD_TYPES.map((t) => (crt === t ? 1 : 0.15));

  const annual = Number(card?.fees?.annual) || 0;
  const waiver = Number(card?.fees?.waiverSpend) || 0;
  const feeNo = annual <= 0 ? 1 : 0;
  const feeLow =
    annual > 0 && annual <= 2500 ? 1 : annual <= 5000 ? 0.55 : 0.25;
  const feeFlex = clamp(1 - annual / 15000, 0, 1) * 0.85 + (waiver > 0 ? 0.15 : 0);

  const vector = [...cCat, ...rewardAlign, feeNo, feeLow, feeFlex];
  return { vector, rates, annual, waiver, rewardType: crt, perks: card?.perks || [] };
}

function cosineSimilarity(a, b) {
  if (a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return clamp(dot, -1, 1);
}

function rewardTypeScore(userPref, cardType) {
  const u = String(userPref || "").toLowerCase();
  const c = String(cardType || "").toLowerCase();
  if (!u || !c) return 0.55;
  if (u === c) return 1;
  if (u === "points" && c === "miles") return 0.45;
  if (u === "miles" && c === "points") return 0.45;
  return 0.2;
}

function feeScore(feePreference, annual, waiverSpend) {
  const fp = String(feePreference || "flexible").toLowerCase();
  const a = Number(annual) || 0;
  const w = Number(waiverSpend) || 0;
  if (fp === "no_fee") {
    if (a <= 0) return 1;
    if (w > 0 && w < 400000) return 0.55;
    return clamp(1 - a / 12000, 0, 1);
  }
  if (fp === "low_fee") {
    if (a <= 0) return 1;
    if (a <= 1500) return 0.92;
    if (a <= 3500) return 0.65;
    return clamp(1 - a / 15000, 0.15, 0.85);
  }
  return clamp(1 - a / 20000, 0.35, 1);
}

function perkScore(desired, cardPerks) {
  if (!desired?.length) return 1;
  const set = new Set((cardPerks || []).map((p) => String(p).toUpperCase()));
  let hit = 0;
  for (const p of desired) {
    if (set.has(String(p).toUpperCase())) hit += 1;
  }
  return hit / desired.length;
}

/**
 * Weighted blend → 0–100 match percentage.
 */
export function computeCardMatchPercent(input, card) {
  const { meta, vector: uv } = buildUserFeatureVector(input);
  const { vector: cv, annual, waiver, rewardType, perks } = buildCardFeatureVector(card);

  const cos = (cosineSimilarity(uv, cv) + 1) / 2;
  const catDot =
    QUIZ_CATEGORIES.reduce(
      (s, c) => s + meta.catW[c] * (cardCategoryRates(card)[c] / 8),
      0
    ) / 1.2;

  const wCat = 0.38 * clamp(catDot, 0, 1) + 0.12 * cos;
  const wReward = 0.28 * rewardTypeScore(meta.rewardPreference, rewardType);
  const wFee = 0.17 * feeScore(meta.feePreference, annual, waiver);
  const wPerk = 0.15 * perkScore(meta.perksDesired, perks);

  const raw = wCat + wReward + wFee + wPerk;
  return Math.round(clamp(raw * 100, 35, 99));
}

/**
 * @param {object} input - quiz payload
 * @param {object[]} cards - card documents (lean)
 * @returns {{ card: object, matchPercent: number, breakdown: object }[]}
 */
export function rankCardsByQuizMatch(input, cards) {
  const list = (cards || [])
    .map((card) => {
      const matchPercent = computeCardMatchPercent(input, card);
      const { meta } = buildUserFeatureVector(input);
      const { rates, annual, rewardType, perks } = buildCardFeatureVector(card);
      return {
        card,
        matchPercent,
        breakdown: {
          rewardType,
          annualFee: annual,
          categoryRates: rates,
          userCategoryWeights: meta.catW,
        },
      };
    })
    .sort((a, b) => b.matchPercent - a.matchPercent);

  return list;
}
