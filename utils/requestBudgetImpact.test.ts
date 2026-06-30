import { describe, expect, it } from "vitest";

import {
  buildRequestBudgetImpact,
  buildRequestDecisionSummary,
} from "@/utils/requestBudgetImpact";

describe("buildRequestBudgetImpact", () => {
  it("projects safe-to-spend and category remaining after the draft amount", () => {
    const impact = buildRequestBudgetImpact({
      amount: 1500,
      safeToSpend: 5000,
      categoryBudget: 4000,
      categoryProjectedRemaining: 2500,
    });

    expect(impact.safeToSpendAfterRequest).toBe(3500);
    expect(impact.categoryRemainingAfterRequest).toBe(1000);
    expect(impact.exceedsSafeToSpend).toBe(false);
    expect(impact.exceedsCategoryBudget).toBe(false);
  });

  it("warns when a draft would push safe-to-spend below zero", () => {
    const impact = buildRequestBudgetImpact({
      amount: 3500,
      safeToSpend: 3000,
      categoryBudget: 6000,
      categoryProjectedRemaining: 5000,
    });

    expect(impact.safeToSpendAfterRequest).toBe(-500);
    expect(impact.exceedsSafeToSpend).toBe(true);
  });

  it("warns when a draft exceeds category room or uses a large share", () => {
    const impact = buildRequestBudgetImpact({
      amount: 2600,
      safeToSpend: 7000,
      categoryBudget: 5000,
      categoryProjectedRemaining: 2000,
    });

    expect(impact.categoryRemainingAfterRequest).toBe(-600);
    expect(impact.exceedsCategoryBudget).toBe(true);
    expect(impact.consumesLargeCategoryShare).toBe(true);
  });

  it("summarizes safe, risky, and over-budget decisions", () => {
    const safe = buildRequestBudgetImpact({
      amount: 1000,
      safeToSpend: 5000,
      categoryBudget: 5000,
      categoryProjectedRemaining: 4000,
    });
    const risky = buildRequestBudgetImpact({
      amount: 3000,
      safeToSpend: 5000,
      categoryBudget: 5000,
      categoryProjectedRemaining: 4000,
    });
    const overBudget = buildRequestBudgetImpact({
      amount: 6000,
      safeToSpend: 5000,
      categoryBudget: 9000,
      categoryProjectedRemaining: 8000,
    });

    expect(buildRequestDecisionSummary(safe).state).toBe("safe");
    expect(buildRequestDecisionSummary(risky).state).toBe("risky");
    expect(buildRequestDecisionSummary(overBudget).state).toBe("over_budget");
  });
});
