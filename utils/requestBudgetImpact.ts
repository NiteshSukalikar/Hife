export type RequestBudgetImpactInput = {
  amount: number;
  safeToSpend: number;
  categoryBudget: number;
  categoryProjectedRemaining: number;
};

export type RequestBudgetImpact = {
  safeToSpendNow: number;
  safeToSpendAfterRequest: number;
  categoryBudget: number;
  categoryProjectedRemaining: number;
  categoryRemainingAfterRequest: number;
  exceedsSafeToSpend: boolean;
  exceedsCategoryBudget: boolean;
  consumesLargeCategoryShare: boolean;
};

function cleanAmount(value: number) {
  return Math.max(0, Number(value || 0));
}

export function buildRequestBudgetImpact({
  amount,
  safeToSpend,
  categoryBudget,
  categoryProjectedRemaining,
}: RequestBudgetImpactInput): RequestBudgetImpact {
  const cleanRequestAmount = cleanAmount(amount);
  const cleanCategoryBudget = cleanAmount(categoryBudget);
  const cleanCategoryProjectedRemaining = cleanAmount(categoryProjectedRemaining);
  const safeToSpendAfterRequest = Number(safeToSpend || 0) - cleanRequestAmount;
  const categoryRemainingAfterRequest =
    cleanCategoryProjectedRemaining - cleanRequestAmount;

  return {
    safeToSpendNow: Number(safeToSpend || 0),
    safeToSpendAfterRequest,
    categoryBudget: cleanCategoryBudget,
    categoryProjectedRemaining: cleanCategoryProjectedRemaining,
    categoryRemainingAfterRequest,
    exceedsSafeToSpend: safeToSpendAfterRequest < 0,
    exceedsCategoryBudget:
      cleanCategoryBudget > 0 &&
      cleanRequestAmount > cleanCategoryProjectedRemaining,
    consumesLargeCategoryShare:
      cleanCategoryBudget > 0 &&
      cleanRequestAmount > cleanCategoryBudget * 0.5,
  };
}
