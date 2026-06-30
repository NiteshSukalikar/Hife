import { BudgetSettings, PurchaseRequest, RequestPriority } from "@/constants/types";

export const REQUEST_CATEGORIES = ["Other"];

export const DEFAULT_CATEGORY_BUDGETS = REQUEST_CATEGORIES.reduce(
  (budgets, category) => ({
    ...budgets,
    [category]: 0,
  }),
  {} as Record<string, number>
);

export const DEFAULT_BUDGET_SETTINGS: BudgetSettings = {
  monthlyBudget: 0,
  categoryBudgets: DEFAULT_CATEGORY_BUDGETS,
  monthlyIncome: 0,
  committedExpenses: 0,
  savingsReserve: 0,
};

export function getBudgetCategories(
  settings: BudgetSettings = DEFAULT_BUDGET_SETTINGS
) {
  const categories = Object.keys(settings.categoryBudgets || {}).filter(Boolean);
  return categories.length ? categories : REQUEST_CATEGORIES;
}

export const PRIORITY_EXPLANATIONS: Record<RequestPriority, string> = {
  P0: "Needed right away and hard to delay.",
  P1: "Important soon, but there is time to compare options.",
  P2: "Useful this week or this month if the budget allows.",
  P3: "Nice to have and safe to postpone.",
};

export type CategorySummary = {
  category: string;
  approvedTotal: number;
  pendingTotal: number;
  purchasedTotal: number;
  declinedCount: number;
  buyLaterCount: number;
  budget: number;
  remaining: number;
  projectedRemaining: number;
};

export type CategorySpendSummary = {
  category: string;
  total: number;
  purchasedTotal: number;
  approvedTotal: number;
};

export type MonthSummary = {
  monthKey: string;
  label: string;
  approvedTotal: number;
  pendingTotal: number;
  purchasedTotal: number;
  declinedCount: number;
  buyLaterCount: number;
  postponedCount: number;
  requestedCount: number;
  categorySpend: CategorySpendSummary[];
};

export type DecisionSummary = {
  approvedCount: number;
  declinedCount: number;
  buyLaterCount: number;
  postponedCount: number;
  purchasedCount: number;
  requestedCount: number;
};

export type MonthOverMonthSummary = {
  currentMonthKey: string;
  previousMonthKey: string | null;
  currentApprovedTotal: number;
  previousApprovedTotal: number;
  difference: number;
  percentChange: number | null;
};

export type RecurringSignal = {
  key: string;
  label: string;
  category: string;
  count: number;
  total: number;
};

export type BudgetSummary = {
  currentMonthKey: string;
  monthlyIncome: number;
  committedExpenses: number;
  savingsReserve: number;
  incomeAvailableForPurchases: number;
  decisionBudget: number;
  monthlyBudget: number;
  approvedTotal: number;
  pendingTotal: number;
  purchasedTotal: number;
  remainingBudget: number;
  safeToSpend: number;
  spendingProgress: number;
  budgetHealth: "safe" | "tight" | "over_budget" | "needs_review";
  categorySummaries: CategorySummary[];
  monthlyHistory: MonthSummary[];
  currentMonthCategorySpend: CategorySpendSummary[];
  topCategoriesBySpend: CategorySpendSummary[];
  decisionSummary: DecisionSummary;
  monthOverMonth: MonthOverMonthSummary;
  recurringSignals: RecurringSignal[];
};

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;

  const maybeTimestamp = value as { toDate?: () => Date; seconds?: number };
  if (typeof maybeTimestamp.toDate === "function") {
    return maybeTimestamp.toDate();
  }

  if (typeof maybeTimestamp.seconds === "number") {
    return new Date(maybeTimestamp.seconds * 1000);
  }

  return null;
}

export function formatInr(amount: number) {
  return `INR ${Math.max(0, Math.round(amount)).toLocaleString("en-IN")}`;
}

export function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

export function getRequestMonthKey(request: PurchaseRequest) {
  return getMonthKey(toDate(request.createdAt) || new Date());
}

export function getRequestAmount(request: PurchaseRequest) {
  return Number(request.expectedPrice || request.maxBudget || request.budget || 0);
}

function normalizeRecurringKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function emptyDecisionSummary(): DecisionSummary {
  return {
    approvedCount: 0,
    declinedCount: 0,
    buyLaterCount: 0,
    postponedCount: 0,
    purchasedCount: 0,
    requestedCount: 0,
  };
}

function emptyMonthSummary(monthKey: string): MonthSummary {
  return {
    monthKey,
    label: getMonthLabel(monthKey),
    approvedTotal: 0,
    pendingTotal: 0,
    purchasedTotal: 0,
    declinedCount: 0,
    buyLaterCount: 0,
    postponedCount: 0,
    requestedCount: 0,
    categorySpend: [],
  };
}

function cleanMoneyValue(value: unknown) {
  return Math.max(0, Number(value || 0));
}

export function cleanMoneyInputValue(value: string) {
  return value.replace(/[^0-9]/g, "");
}

export function buildCategoryBudgetsFromInputs(
  inputs: Record<string, string>
) {
  return Object.entries(inputs).reduce((budgets, [category, value]) => {
    const cleanCategory = category.trim();
    if (!cleanCategory) return budgets;

    budgets[cleanCategory] = cleanMoneyValue(value);
    return budgets;
  }, {} as Record<string, number>);
}

export function sumCategoryBudgetInputs(inputs: Record<string, string>) {
  return Object.values(buildCategoryBudgetsFromInputs(inputs)).reduce(
    (total, value) => total + value,
    0
  );
}

export function buildBudgetSummary(
  requests: PurchaseRequest[],
  settings: BudgetSettings = DEFAULT_BUDGET_SETTINGS
): BudgetSummary {
  const currentMonthKey = getMonthKey();
  const categoryBudgets = settings.categoryBudgets || DEFAULT_CATEGORY_BUDGETS;
  const categoryMap = new Map<string, CategorySummary>();
  const historyMap = new Map<string, MonthSummary>();
  const categorySpendByMonth = new Map<string, Map<string, CategorySpendSummary>>();
  const allTimeCategorySpend = new Map<string, CategorySpendSummary>();
  const recurringMap = new Map<string, RecurringSignal>();
  const decisionSummary = emptyDecisionSummary();
  let approvedTotal = 0;
  let pendingTotal = 0;
  let purchasedTotal = 0;

  const budgetCategories = getBudgetCategories(settings);

  budgetCategories.forEach((category) => {
    categoryMap.set(category, {
      category,
      approvedTotal: 0,
      pendingTotal: 0,
      purchasedTotal: 0,
      declinedCount: 0,
      buyLaterCount: 0,
      budget: Number(categoryBudgets[category] || 0),
      remaining: Number(categoryBudgets[category] || 0),
      projectedRemaining: Number(categoryBudgets[category] || 0),
    });
  });

  requests.forEach((request) => {
    const amount = getRequestAmount(request);
    const monthKey = getRequestMonthKey(request);
    const isCurrentMonth = monthKey === currentMonthKey;
    const isPurchased = request.status === "purchased";
    const isApprovedSpend = request.status === "approved" || isPurchased;
    const isPending = request.status === "pending" || request.status === "needs_more_info";
    const isBuyLater = request.status === "buy_later";
    const isPostponed = request.status === "buy_later" || request.status === "needs_more_info";

    decisionSummary.requestedCount += 1;
    if (request.status === "approved") decisionSummary.approvedCount += 1;
    if (request.status === "declined") decisionSummary.declinedCount += 1;
    if (isBuyLater) decisionSummary.buyLaterCount += 1;
    if (isPostponed) decisionSummary.postponedCount += 1;
    if (isPurchased) decisionSummary.purchasedCount += 1;

    const category = budgetCategories.includes(request.category)
      ? request.category
      : "Other";
    const history = historyMap.get(monthKey) || emptyMonthSummary(monthKey);

    history.requestedCount += 1;
    if (request.status === "declined") history.declinedCount += 1;
    if (isBuyLater) history.buyLaterCount += 1;
    if (isPostponed) history.postponedCount += 1;

    if (isApprovedSpend) history.approvedTotal += amount;
    if (isPending) history.pendingTotal += amount;
    if (isPurchased) history.purchasedTotal += amount;
    historyMap.set(monthKey, history);

    if (isApprovedSpend) {
      const monthCategoryMap =
        categorySpendByMonth.get(monthKey) ||
        new Map<string, CategorySpendSummary>();
      const monthCategory = monthCategoryMap.get(category) || {
        category,
        total: 0,
        purchasedTotal: 0,
        approvedTotal: 0,
      };
      monthCategory.total += amount;
      monthCategory.approvedTotal += amount;
      if (isPurchased) monthCategory.purchasedTotal += amount;
      monthCategoryMap.set(category, monthCategory);
      categorySpendByMonth.set(monthKey, monthCategoryMap);

      const allTimeCategory = allTimeCategorySpend.get(category) || {
        category,
        total: 0,
        purchasedTotal: 0,
        approvedTotal: 0,
      };
      allTimeCategory.total += amount;
      allTimeCategory.approvedTotal += amount;
      if (isPurchased) allTimeCategory.purchasedTotal += amount;
      allTimeCategorySpend.set(category, allTimeCategory);

      const recurringKey = normalizeRecurringKey(request.productName || request.title);
      if (recurringKey) {
        const signal = recurringMap.get(recurringKey) || {
          key: recurringKey,
          label: request.productName || request.title,
          category,
          count: 0,
          total: 0,
        };
        signal.count += 1;
        signal.total += amount;
        recurringMap.set(recurringKey, signal);
      }
    }

    if (!isApprovedSpend && !isPending) {
      if (!isCurrentMonth) return;

      const summary = categoryMap.get(category);
      if (!summary) return;

      if (request.status === "declined") summary.declinedCount += 1;
      if (isBuyLater) summary.buyLaterCount += 1;
      return;
    }

    if (!isCurrentMonth) return;

    if (isApprovedSpend) approvedTotal += amount;
    if (isPending) pendingTotal += amount;
    if (isPurchased) purchasedTotal += amount;

    const summary = categoryMap.get(category);
    if (!summary) return;

    if (isApprovedSpend) summary.approvedTotal += amount;
    if (isPending) summary.pendingTotal += amount;
    if (isPurchased) summary.purchasedTotal += amount;
    if (request.status === "declined") summary.declinedCount += 1;
    if (isBuyLater) summary.buyLaterCount += 1;
    summary.remaining = Math.max(0, summary.budget - summary.approvedTotal);
    summary.projectedRemaining = Math.max(
      0,
      summary.budget - summary.approvedTotal - summary.pendingTotal
    );
  });
  const monthlyBudget = cleanMoneyValue(settings.monthlyBudget);
  const monthlyIncome = cleanMoneyValue(settings.monthlyIncome);
  const committedExpenses = cleanMoneyValue(settings.committedExpenses);
  const savingsReserve = cleanMoneyValue(settings.savingsReserve);
  const incomeAvailableForPurchases =
    monthlyIncome > 0
      ? monthlyIncome - committedExpenses - savingsReserve
      : monthlyBudget;
  const decisionBudget =
    monthlyBudget > 0 && monthlyIncome > 0
      ? Math.min(monthlyBudget, incomeAvailableForPurchases)
      : incomeAvailableForPurchases;
  const safeToSpend = decisionBudget - approvedTotal - pendingTotal;
  const spendingProgress =
    decisionBudget > 0
      ? Math.min(1, (approvedTotal + pendingTotal) / decisionBudget)
      : 0;
  const budgetHealth =
    decisionBudget <= 0
      ? "needs_review"
      : safeToSpend < 0
        ? "over_budget"
        : safeToSpend <= decisionBudget * 0.2
          ? "tight"
          : "safe";

  const monthlyHistory = Array.from(historyMap.values())
    .map((month) => ({
      ...month,
      categorySpend: Array.from(
        categorySpendByMonth.get(month.monthKey)?.values() || []
      ).sort((a, b) => b.total - a.total),
    }))
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  const previousMonth = monthlyHistory.find(
    (month) => month.monthKey !== currentMonthKey
  );
  const currentMonthHistory = monthlyHistory.find(
    (month) => month.monthKey === currentMonthKey
  );
  const currentApprovedTotal = currentMonthHistory?.approvedTotal || 0;
  const previousApprovedTotal = previousMonth?.approvedTotal || 0;
  const difference = currentApprovedTotal - previousApprovedTotal;
  const percentChange =
    previousApprovedTotal > 0 ? difference / previousApprovedTotal : null;

  return {
    currentMonthKey,
    monthlyIncome,
    committedExpenses,
    savingsReserve,
    incomeAvailableForPurchases,
    decisionBudget,
    monthlyBudget,
    approvedTotal,
    pendingTotal,
    purchasedTotal,
    remainingBudget: Math.max(0, decisionBudget - approvedTotal),
    safeToSpend,
    spendingProgress,
    budgetHealth,
    categorySummaries: Array.from(categoryMap.values()),
    monthlyHistory,
    currentMonthCategorySpend: Array.from(
      categorySpendByMonth.get(currentMonthKey)?.values() || []
    ).sort((a, b) => b.total - a.total),
    topCategoriesBySpend: Array.from(allTimeCategorySpend.values()).sort(
      (a, b) => b.total - a.total
    ),
    decisionSummary,
    monthOverMonth: {
      currentMonthKey,
      previousMonthKey: previousMonth?.monthKey || null,
      currentApprovedTotal,
      previousApprovedTotal,
      difference,
      percentChange,
    },
    recurringSignals: Array.from(recurringMap.values())
      .filter((signal) => signal.count > 1)
      .sort((a, b) => b.total - a.total),
  };
}
