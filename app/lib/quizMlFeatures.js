/**
 * Feature vector for quiz / Module 2 XGBoost (must match training CSV & Python script).
 * cardIndex = position of this card in the full catalog sorted by _id (stable card identity).
 */
export function buildMlFeatureVector(spendingProfile, cardIndexInFullCatalog, numCardsInFullCatalog) {
  const n = numCardsInFullCatalog;
  const denom = Math.max(1, n - 1);
  const cardNorm = n <= 1 ? 0 : cardIndexInFullCatalog / denom;
  return [
    Number(spendingProfile?.shopping) || 0,
    Number(spendingProfile?.travel) || 0,
    Number(spendingProfile?.dining) || 0,
    Number(spendingProfile?.fuel) || 0,
    Number(spendingProfile?.groceries) || 0,
    cardNorm,
  ];
}
