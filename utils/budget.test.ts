import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BudgetSettings, PurchaseRequest } from "@/constants/types";
import {
  buildBudgetSummary,
  buildCategoryBudgetsFromInputs,
  sumCategoryBudgetInputs,
} from "@/utils/budget";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-15T10:00:00+05:30"));
});

afterEach(() => {
  vi.useRealTimers();
});

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

  it("keeps exact-budget decisions at zero safe-to-spend without marking over budget", () => {
    const summary = buildBudgetSummary(
      [
        request({ id: "approved", expectedPrice: 7000, status: "approved" }),
        request({ id: "pending", expectedPrice: 3000, status: "pending" }),
      ],
      settings
    );

    expect(summary.safeToSpend).toBe(0);
    expect(summary.remainingBudget).toBe(3000);
    expect(summary.spendingProgress).toBe(1);
    expect(summary.budgetHealth).toBe("tight");
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

  it("groups purchase history by month with category spend and decision counts", () => {
    const summary = buildBudgetSummary(
      [
        request({
          id: "current-purchased",
          category: "Home",
          expectedPrice: 3000,
          status: "purchased",
          createdAt: { toDate: () => new Date("2026-06-10T10:00:00+05:30") },
        }),
        request({
          id: "current-approved",
          category: "Kitchen",
          expectedPrice: 1200,
          status: "approved",
          createdAt: { toDate: () => new Date("2026-06-12T10:00:00+05:30") },
        }),
        request({
          id: "past-declined",
          expectedPrice: 900,
          status: "declined",
          createdAt: { toDate: () => new Date("2026-05-02T10:00:00+05:30") },
        }),
        request({
          id: "past-buy-later",
          expectedPrice: 600,
          status: "buy_later",
          createdAt: { toDate: () => new Date("2026-05-03T10:00:00+05:30") },
        }),
      ],
      settings
    );

    expect(summary.monthlyHistory[0].monthKey).toBe("2026-06");
    expect(summary.monthlyHistory[0].approvedTotal).toBe(4200);
    expect(summary.monthlyHistory[0].purchasedTotal).toBe(3000);
    expect(summary.monthlyHistory[0].categorySpend).toEqual([
      {
        category: "Home",
        total: 3000,
        purchasedTotal: 3000,
        approvedTotal: 3000,
      },
      {
        category: "Kitchen",
        total: 1200,
        purchasedTotal: 0,
        approvedTotal: 1200,
      },
    ]);
    expect(summary.monthlyHistory[1].declinedCount).toBe(1);
    expect(summary.monthlyHistory[1].buyLaterCount).toBe(1);
    expect(summary.monthlyHistory[1].postponedCount).toBe(1);
  });

  it("summarizes decisions, top categories, month comparison, and repeat signals", () => {
    const summary = buildBudgetSummary(
      [
        request({
          id: "current",
          productName: "Water filter refill",
          category: "Home",
          expectedPrice: 2000,
          status: "purchased",
          createdAt: { toDate: () => new Date("2026-06-10T10:00:00+05:30") },
        }),
        request({
          id: "previous",
          productName: "Water Filter Refill",
          category: "Home",
          expectedPrice: 1000,
          status: "approved",
          createdAt: { toDate: () => new Date("2026-05-10T10:00:00+05:30") },
        }),
        request({
          id: "declined",
          expectedPrice: 500,
          status: "declined",
          createdAt: { toDate: () => new Date("2026-06-11T10:00:00+05:30") },
        }),
        request({
          id: "later",
          expectedPrice: 700,
          status: "buy_later",
          createdAt: { toDate: () => new Date("2026-06-12T10:00:00+05:30") },
        }),
        request({
          id: "info",
          expectedPrice: 800,
          status: "needs_more_info",
          createdAt: { toDate: () => new Date("2026-06-13T10:00:00+05:30") },
        }),
      ],
      settings
    );

    expect(summary.decisionSummary).toMatchObject({
      approvedCount: 1,
      declinedCount: 1,
      buyLaterCount: 1,
      postponedCount: 2,
      purchasedCount: 1,
      requestedCount: 5,
    });
    expect(summary.topCategoriesBySpend[0]).toMatchObject({
      category: "Home",
      total: 3000,
    });
    expect(summary.monthOverMonth).toMatchObject({
      currentMonthKey: summary.currentMonthKey,
      previousMonthKey: "2026-05",
      currentApprovedTotal: 2000,
      previousApprovedTotal: 1000,
      difference: 1000,
      percentChange: 1,
    });
    expect(summary.recurringSignals).toEqual([
      {
        key: "water filter refill",
        label: "Water filter refill",
        category: "Home",
        count: 2,
        total: 3000,
      },
    ]);
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
