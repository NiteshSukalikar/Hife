import { db } from "@/services/firebase";
import { requireActiveHousehold } from "@/services/households";
import { recordUsage } from "@/services/usageMonitoring";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";

const DEFAULT_CATEGORIES = [
  "Household",
  "Kitchen",
  "Electronics",
  "Personal",
  "Health",
  "Other",
];

function normalizeCategoryBudgets(categoryBudgets = {}) {
  return DEFAULT_CATEGORIES.reduce((budgets, category) => {
    budgets[category] = Number(categoryBudgets[category] || 0);
    return budgets;
  }, {});
}

export async function getBudgetSettings() {
  const household = await requireActiveHousehold();

  return {
    monthlyBudget: Number(household.monthlyBudget || 0),
    categoryBudgets: normalizeCategoryBudgets(household.categoryBudgets),
  };
}

export async function updateBudgetSettings({ monthlyBudget, categoryBudgets }) {
  const household = await requireActiveHousehold();
  const cleanCategoryBudgets = normalizeCategoryBudgets(categoryBudgets);

  await updateDoc(doc(db, "households", household.id), {
    monthlyBudget: Number(monthlyBudget || 0),
    categoryBudgets: cleanCategoryBudgets,
    updatedAt: serverTimestamp(),
  });
  await recordUsage("budgets.update", { writes: 1 });

  return {
    monthlyBudget: Number(monthlyBudget || 0),
    categoryBudgets: cleanCategoryBudgets,
  };
}
