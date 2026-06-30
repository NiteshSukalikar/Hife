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
};

export function getBudgetCategories(
  settings: BudgetSettings = DEFAULT_BUDGET_SETTINGS
) {
  const categories = Object.keys(settings.categoryBudgets || {}).filter(Boolean);
  return categories.length ? categories : REQUEST_CATEGORIES;
}

export const PRIORITY_EXPLANATIONS: Record<RequestPriority, string> = {
  P0: "Emergency or must buy immediately.",
  P1: "Important, should be decided within 24 hours.",
  P2: "Useful, can wait a few days.",
  P3: "Nice to have, low urgency.",
};

export type CategorySummary = {
  category: string;
  approvedTotal: number;
  pendingTotal: number;
  budget: number;
  remaining: number;
};

export type MonthSummary = {
  monthKey: string;
  label: string;
  approvedTotal: number;
  pendingTotal: number;
};

export type BudgetSummary = {
  currentMonthKey: string;
  monthlyBudget: number;
  approvedTotal: number;
  pendingTotal: number;
  remainingBudget: number;
  safeToSpend: number;
  spendingProgress: number;
  budgetHealth: "safe" | "tight" | "over_budget" | "needs_review";
  categorySummaries: CategorySummary[];
  monthlyHistory: MonthSummary[];
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

export function buildBudgetSummary(
  requests: PurchaseRequest[],
  settings: BudgetSettings = DEFAULT_BUDGET_SETTINGS
): BudgetSummary {
  const currentMonthKey = getMonthKey();
  const categoryBudgets = settings.categoryBudgets || DEFAULT_CATEGORY_BUDGETS;
  const categoryMap = new Map<string, CategorySummary>();
  const historyMap = new Map<string, MonthSummary>();
  let approvedTotal = 0;
  let pendingTotal = 0;

  const budgetCategories = getBudgetCategories(settings);

  budgetCategories.forEach((category) => {
    categoryMap.set(category, {
      category,
      approvedTotal: 0,
      pendingTotal: 0,
      budget: Number(categoryBudgets[category] || 0),
      remaining: Number(categoryBudgets[category] || 0),
    });
  });

  requests.forEach((request) => {
    const amount = getRequestAmount(request);
    const monthKey = getRequestMonthKey(request);
    const isCurrentMonth = monthKey === currentMonthKey;
    const isApprovedSpend =
      request.status === "approved" || request.status === "purchased";
    const isPending = request.status === "pending" || request.status === "needs_more_info";

    if (!isApprovedSpend && !isPending) return;

    const history = historyMap.get(monthKey) || {
      monthKey,
      label: getMonthLabel(monthKey),
      approvedTotal: 0,
      pendingTotal: 0,
    };

    if (isApprovedSpend) history.approvedTotal += amount;
    if (isPending) history.pendingTotal += amount;
    historyMap.set(monthKey, history);

    if (!isCurrentMonth) return;

    if (isApprovedSpend) approvedTotal += amount;
    if (isPending) pendingTotal += amount;

    const category = budgetCategories.includes(request.category)
      ? request.category
      : "Other";
    const summary = categoryMap.get(category);
    if (!summary) return;

    if (isApprovedSpend) summary.approvedTotal += amount;
    if (isPending) summary.pendingTotal += amount;
    summary.remaining = Math.max(0, summary.budget - summary.approvedTotal);
  });
  const monthlyBudget = Number(settings.monthlyBudget || 0);
  const safeToSpend = monthlyBudget - approvedTotal - pendingTotal;
  const spendingProgress =
    monthlyBudget > 0
      ? Math.min(1, (approvedTotal + pendingTotal) / monthlyBudget)
      : 0;
  const budgetHealth =
    monthlyBudget <= 0
      ? "needs_review"
      : safeToSpend < 0
        ? "over_budget"
        : safeToSpend <= monthlyBudget * 0.2
          ? "tight"
          : "safe";

  return {
    currentMonthKey,
    monthlyBudget,
    approvedTotal,
    pendingTotal,
    remainingBudget: Math.max(0, monthlyBudget - approvedTotal),
    safeToSpend,
    spendingProgress,
    budgetHealth,
    categorySummaries: Array.from(categoryMap.values()),
    monthlyHistory: Array.from(historyMap.values()).sort((a, b) =>
      b.monthKey.localeCompare(a.monthKey)
    ),
  };
}
