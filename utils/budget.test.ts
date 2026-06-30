import { describe, expect, it } from "vitest";

import { BudgetSettings, PurchaseRequest } from "@/constants/types";
import {
  buildBudgetSummary,
  buildCategoryBudgetsFromInputs,
  sumCategoryBudgetInputs,
} from "@/utils/budget";

const currentTimestamp = {
  toDate: () => new Date(),
};

function request(
  overrides: Partial<PurchaseRequest>
): PurchaseRequest {
  return {
    id: "request",
    title: "Request",
    productName: "Request",
    info: "",
    reason: "",
    priority: "P1",
    expectedPrice: 0,
    maxBudget: 0,
    budget: 0,
    category: "Home",
    links: [],
    status: "pending",
    createdAt: currentTimestamp,
    ...overrides,
  };
}

const settings: BudgetSettings = {
  monthlyBudget: 10000,
  categoryBudgets: {
    Home: 6000,
    Kitchen: 4000,
  },
};

describe("buildBudgetSummary", () => {
  it("calculates safe-to-spend after approved and pending requests", () => {
    const summary = buildBudgetSummary(
      [
        request({ id: "approved", expectedPrice: 2500, status: "approved" }),
        request({ id: "pending", expectedPrice: 1500, status: "pending" }),
      ],
      settings
    );

    expect(summary.approvedTotal).toBe(2500);
    expect(summary.pendingTotal).toBe(1500);
    expect(summary.remainingBudget).toBe(7500);
    expect(summary.safeToSpend).toBe(6000);
    expect(summary.spendingProgress).toBe(0.4);
    expect(summary.budgetHealth).toBe("safe");
  });

  it("keeps legacy monthly budget behavior when new budget fields are missing", () => {
    const summary = buildBudgetSummary(
      [
        request({ id: "approved", expectedPrice: 2500, status: "approved" }),
        request({ id: "pending", expectedPrice: 1500, status: "pending" }),
      ],
      {
        monthlyBudget: 10000,
        categoryBudgets: { Home: 10000 },
      }
    );

    expect(summary.monthlyIncome).toBe(0);
    expect(summary.committedExpenses).toBe(0);
    expect(summary.savingsReserve).toBe(0);
    expect(summary.decisionBudget).toBe(10000);
    expect(summary.safeToSpend).toBe(6000);
  });

  it("uses income after committed expenses and savings reserve for safe-to-spend", () => {
    const summary = buildBudgetSummary(
      [
        request({ id: "approved", expectedPrice: 3000, status: "approved" }),
        request({ id: "pending", expectedPrice: 2000, status: "pending" }),
      ],
      {
        monthlyBudget: 15000,
        monthlyIncome: 20000,
        committedExpenses: 7000,
        savingsReserve: 3000,
        categoryBudgets: { Home: 15000 },
      }
    );

    expect(summary.incomeAvailableForPurchases).toBe(10000);
    expect(summary.decisionBudget).toBe(10000);
    expect(summary.safeToSpend).toBe(5000);
  });

  it("uses monthly budget as a cap when income allows more spending", () => {
    const summary = buildBudgetSummary([], {
      monthlyBudget: 8000,
      monthlyIncome: 25000,
      committedExpenses: 5000,
      savingsReserve: 5000,
      categoryBudgets: { Home: 8000 },
    });

    expect(summary.incomeAvailableForPurchases).toBe(15000);
    expect(summary.decisionBudget).toBe(8000);
    expect(summary.safeToSpend).toBe(8000);
  });

  it("marks budget health as tight when safe-to-spend is low", () => {
    const summary = buildBudgetSummary(
      [
        request({ id: "approved", expectedPrice: 7900, status: "approved" }),
        request({ id: "pending", expectedPrice: 100, status: "pending" }),
      ],
      settings
    );

    expect(summary.safeToSpend).toBe(2000);
    expect(summary.budgetHealth).toBe("tight");
  });

  it("marks budget health as over budget when pending spend exceeds budget", () => {
    const summary = buildBudgetSummary(
      [
        request({ id: "approved", expectedPrice: 8000, status: "approved" }),
        request({ id: "pending", expectedPrice: 3000, status: "pending" }),
      ],
      settings
    );

    expect(summary.safeToSpend).toBe(-1000);
    expect(summary.budgetHealth).toBe("over_budget");
    expect(summary.spendingProgress).toBe(1);
  });

  it("marks budget health as needs review when no monthly budget is set", () => {
    const summary = buildBudgetSummary([], {
      monthlyBudget: 0,
      categoryBudgets: { Home: 0 },
    });

    expect(summary.safeToSpend).toBe(0);
    expect(summary.spendingProgress).toBe(0);
    expect(summary.budgetHealth).toBe("needs_review");
  });

  it("tracks approved, pending, and purchased totals by category", () => {
    const summary = buildBudgetSummary(
      [
        request({ id: "approved", expectedPrice: 1000, status: "approved" }),
        request({ id: "purchased", expectedPrice: 1500, status: "purchased" }),
        request({ id: "pending", expectedPrice: 2000, status: "pending" }),
      ],
      settings
    );
    const home = summary.categorySummaries.find(
      (item) => item.category === "Home"
    );

    expect(summary.approvedTotal).toBe(2500);
    expect(summary.pendingTotal).toBe(2000);
    expect(summary.purchasedTotal).toBe(1500);
    expect(home?.approvedTotal).toBe(2500);
    expect(home?.pendingTotal).toBe(2000);
    expect(home?.purchasedTotal).toBe(1500);
    expect(home?.remaining).toBe(3500);
    expect(home?.projectedRemaining).toBe(1500);
  });
});

describe("category budget input helpers", () => {
  it("builds category budgets and totals the monthly budget from category rows", () => {
    const inputs = {
      Grocery: "5000",
      Home: "3500",
      Empty: "",
    };

    expect(buildCategoryBudgetsFromInputs(inputs)).toEqual({
      Grocery: 5000,
      Home: 3500,
      Empty: 0,
    });
    expect(sumCategoryBudgetInputs(inputs)).toBe(8500);
  });
});
