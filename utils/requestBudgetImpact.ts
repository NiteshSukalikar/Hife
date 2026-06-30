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

export type RequestDecisionSummary = {
  state: "safe" | "risky" | "over_budget";
  title: string;
  message: string;
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

export function buildRequestDecisionSummary(
  impact: RequestBudgetImpact
): RequestDecisionSummary {
  if (impact.exceedsSafeToSpend) {
    return {
      state: "over_budget",
      title: "Over budget",
      message:
        "Approval would take safe-to-spend below zero. Postponing or lowering the amount is the calmer choice.",
    };
  }

  if (impact.exceedsCategoryBudget || impact.consumesLargeCategoryShare) {
    return {
      state: "risky",
      title: "Needs care",
      message:
        "Safe-to-spend can cover this, but the category impact is high. Compare timing before approving.",
    };
  }

  return {
    state: "safe",
    title: "Looks safe",
    message:
      "Approval keeps safe-to-spend and the selected category in a workable range.",
  };
}
