import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "@/services/firebase";
import { requireActiveHousehold } from "@/services/households";
import { recordUsage } from "@/services/usageMonitoring";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";

const DEFAULT_CATEGORIES = ["Other"];
const LOCAL_FINANCE_KEY_PREFIX = "HIFE_LOCAL_FINANCE_SETTINGS_";

function localFinanceKey(householdId) {
  return `${LOCAL_FINANCE_KEY_PREFIX}${householdId}`;
}

function normalizeFinanceSettings({
  monthlyIncome = 0,
  committedExpenses = 0,
  savingsReserve = 0,
} = {}) {
  return {
    monthlyIncome: Number(monthlyIncome || 0),
    committedExpenses: Number(committedExpenses || 0),
    savingsReserve: Number(savingsReserve || 0),
  };
}

function isPermissionDenied(error) {
  return (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "permission-denied"
  );
}

async function readLocalFinanceSettings(householdId) {
  try {
    const raw = await AsyncStorage.getItem(localFinanceKey(householdId));
    return raw ? normalizeFinanceSettings(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

async function writeLocalFinanceSettings(householdId, settings) {
  await AsyncStorage.setItem(
    localFinanceKey(householdId),
    JSON.stringify(normalizeFinanceSettings(settings))
  );
}

function normalizeCategoryBudgets(categoryBudgets = {}) {
  const categories = Object.keys(categoryBudgets || {}).filter(Boolean);
  const normalizedCategories = categories.length ? categories : DEFAULT_CATEGORIES;

  return normalizedCategories.reduce((budgets, category) => {
    budgets[category] = Number(categoryBudgets[category] || 0);
    return budgets;
  }, {});
}

export async function getBudgetSettings() {
  const household = await requireActiveHousehold();
  const localFinanceSettings = await readLocalFinanceSettings(household.id);
  const remoteFinanceSettings = normalizeFinanceSettings(household);
  const financeSettings = localFinanceSettings || remoteFinanceSettings;

  return {
    monthlyBudget: Number(household.monthlyBudget || 0),
    monthlyIncome: financeSettings.monthlyIncome,
    committedExpenses: financeSettings.committedExpenses,
    savingsReserve: financeSettings.savingsReserve,
    categoryBudgets: normalizeCategoryBudgets(household.categoryBudgets),
  };
}

export async function updateBudgetSettings({
  monthlyBudget,
  monthlyIncome,
  committedExpenses,
  savingsReserve,
  categoryBudgets,
}) {
  const household = await requireActiveHousehold();
  const cleanCategoryBudgets = normalizeCategoryBudgets(categoryBudgets);
  const financeSettings = normalizeFinanceSettings({
    monthlyIncome,
    committedExpenses,
    savingsReserve,
  });
  const cleanMonthlyBudget = Number(monthlyBudget || 0);

  try {
    await updateDoc(doc(db, "households", household.id), {
      monthlyBudget: cleanMonthlyBudget,
      ...financeSettings,
      categoryBudgets: cleanCategoryBudgets,
      updatedAt: serverTimestamp(),
    });
    await writeLocalFinanceSettings(household.id, financeSettings);
  } catch (error) {
    if (!isPermissionDenied(error)) {
      throw error;
    }

    await updateDoc(doc(db, "households", household.id), {
      monthlyBudget: cleanMonthlyBudget,
      categoryBudgets: cleanCategoryBudgets,
      updatedAt: serverTimestamp(),
    });
    await writeLocalFinanceSettings(household.id, financeSettings);
  }

  await recordUsage("budgets.update", { writes: 1 });

  return {
    monthlyBudget: cleanMonthlyBudget,
    ...financeSettings,
    categoryBudgets: cleanCategoryBudgets,
  };
}
