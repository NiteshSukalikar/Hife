import { describe, expect, it } from "vitest";

import { BudgetSettings, PurchaseRequest } from "@/constants/types";
import { buildBudgetSummary } from "@/utils/budget";

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
});
