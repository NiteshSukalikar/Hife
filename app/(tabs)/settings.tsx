import Header from "@/components/header";
import useToast from "@/components/toast/useToast";
import { BudgetSettings } from "@/constants/types";
import { HifeThemeMode, HifeThemes } from "@/constants/theme";
import { useHifeTheme } from "@/hooks/use-hife-theme";
import { getBudgetSettings, updateBudgetSettings } from "@/services/budgets";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  getNotificationSettings,
  requestNotificationPermission,
  updateNotificationSettings,
} from "@/services/notifications";
import { logError } from "@/utils/safeLogger";
import {
  buildCategoryBudgetsFromInputs,
  cleanMoneyInputValue,
  formatInr,
  sumCategoryBudgetInputs,
} from "@/utils/budget";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const THEME_OPTIONS: HifeThemeMode[] = ["warm", "espresso"];
type NotificationSettings = typeof DEFAULT_NOTIFICATION_SETTINGS;
type SettingsTab = "general" | "budget";

function budgetInputsFromSettings(settings: BudgetSettings) {
  return Object.entries(settings.categoryBudgets || {}).reduce(
    (inputs, [category, value]) => ({
      ...inputs,
      [category]: value ? String(value) : "0",
    }),
    {} as Record<string, string>
  );
}

export default function SettingsScreen() {
  const { mode, palette, setMode } = useHifeTheme();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [monthlyBudgetInput, setMonthlyBudgetInput] = useState("0");
  const [monthlyIncomeInput, setMonthlyIncomeInput] = useState("");
  const [committedExpensesInput, setCommittedExpensesInput] = useState("");
  const [savingsReserveInput, setSavingsReserveInput] = useState("");
  const [categoryBudgetInputs, setCategoryBudgetInputs] = useState<
    Record<string, string>
  >({ Other: "0" });
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryBudgetInput, setNewCategoryBudgetInput] = useState("");
  const [savingBudget, setSavingBudget] = useState(false);

  useEffect(() => {
    getNotificationSettings()
      .then(setNotificationSettings)
      .catch((error) => {
        logError("Failed to load notification settings", error);
        toast.show("Could not load notification settings", "error");
      });
  }, [toast]);

  useEffect(() => {
    getBudgetSettings()
      .then((settings) => {
        const categoryInputs = budgetInputsFromSettings(settings);
        setCategoryBudgetInputs(categoryInputs);
        setMonthlyBudgetInput(String(sumCategoryBudgetInputs(categoryInputs)));
        setMonthlyIncomeInput(settings.monthlyIncome ? String(settings.monthlyIncome) : "");
        setCommittedExpensesInput(
          settings.committedExpenses ? String(settings.committedExpenses) : ""
        );
        setSavingsReserveInput(
          settings.savingsReserve ? String(settings.savingsReserve) : ""
        );
      })
      .catch((error) => {
        logError("Failed to load budget settings", error);
        toast.show("Could not load budget settings", "error");
      });
  }, [toast]);

  const enableNotifications = async () => {
    const result = await requestNotificationPermission();
    setNotificationSettings(result.settings);
    toast.show(
      result.granted
        ? "Notifications enabled"
        : "Notification permission was not granted",
      result.granted ? "success" : "error"
    );
  };

  const toggleNotificationSetting = async (
    key: keyof NotificationSettings,
    value: boolean
  ) => {
    try {
      const settings = await updateNotificationSettings({
        ...notificationSettings,
        [key]: value,
      });
      setNotificationSettings(settings);
    } catch (error) {
      logError("Failed to update notification settings", error);
      toast.show("Could not update notification settings", "error");
    }
  };

  const updateMoneyInput =
    (setter: (value: string) => void) => (value: string) => {
      setter(cleanMoneyInputValue(value));
    };

  const updateCategoryBudgetInput = (category: string, value: string) => {
    setCategoryBudgetInputs((current) => {
      const nextInputs = {
        ...current,
        [category]: cleanMoneyInputValue(value),
      };
      setMonthlyBudgetInput(String(sumCategoryBudgetInputs(nextInputs)));
      return nextInputs;
    });
  };

  const addCategory = () => {
    const cleanName = newCategoryName.trim();

    if (!cleanName) {
      toast.show("Add a category name", "error");
      return;
    }

    if (Object.keys(categoryBudgetInputs).includes(cleanName)) {
      toast.show("Category already exists", "error");
      return;
    }

    const nextInputs = {
      ...categoryBudgetInputs,
      [cleanName]: cleanMoneyInputValue(newCategoryBudgetInput),
    };
    setCategoryBudgetInputs(nextInputs);
    setMonthlyBudgetInput(String(sumCategoryBudgetInputs(nextInputs)));
    setNewCategoryName("");
    setNewCategoryBudgetInput("");
  };

  const removeCategory = (category: string) => {
    const categories = Object.keys(categoryBudgetInputs).filter(
      (item) => item !== category
    );

    if (!categories.length) {
      toast.show("Keep at least one category", "error");
      return;
    }

    const nextInputs = categories.reduce(
      (inputs, item) => ({
        ...inputs,
        [item]: categoryBudgetInputs[item],
      }),
      {} as Record<string, string>
    );
    setCategoryBudgetInputs(nextInputs);
    setMonthlyBudgetInput(String(sumCategoryBudgetInputs(nextInputs)));
  };

  const saveBudgetSettings = async () => {
    if (savingBudget) return;

    try {
      setSavingBudget(true);
      const monthlyBudget = sumCategoryBudgetInputs(categoryBudgetInputs);
      const settings = await updateBudgetSettings({
        monthlyBudget,
        monthlyIncome: Number(monthlyIncomeInput || 0),
        committedExpenses: Number(committedExpensesInput || 0),
        savingsReserve: Number(savingsReserveInput || 0),
        categoryBudgets: buildCategoryBudgetsFromInputs(categoryBudgetInputs),
      });
      const categoryInputs = budgetInputsFromSettings(settings);
      setCategoryBudgetInputs(categoryInputs);
      setMonthlyBudgetInput(String(sumCategoryBudgetInputs(categoryInputs)));
      setMonthlyIncomeInput(settings.monthlyIncome ? String(settings.monthlyIncome) : "");
      setCommittedExpensesInput(
        settings.committedExpenses ? String(settings.committedExpenses) : ""
      );
      setSavingsReserveInput(
        settings.savingsReserve ? String(settings.savingsReserve) : ""
      );
      toast.show("Budget settings saved", "success");
    } catch (error) {
      logError("Failed to save budget settings", error);
      toast.show("Could not save budget settings", "error");
    } finally {
      setSavingBudget(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
      <Header />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.intro}>
          <Text style={[styles.eyebrow, { color: palette.primary }]}>
            Settings
          </Text>
          <Text style={[styles.title, { color: palette.chromeText }]}>
            Make Hife feel right
          </Text>
          <Text style={[styles.subtitle, { color: palette.chromeMutedText }]}>
            Choose the visual style for shared purchase decisions on this
            device. Your room, requests, budgets, and comments stay unchanged.
          </Text>
        </View>

        <View
          style={[
            styles.segmented,
            { backgroundColor: palette.card, borderColor: palette.border },
          ]}
        >
          {(["general", "budget"] as const).map((tab) => {
            const selected = activeTab === tab;

            return (
              <Pressable
                key={tab}
                style={[
                  styles.segment,
                  selected && { backgroundColor: palette.primary },
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: selected ? palette.buttonText : palette.mutedText },
                  ]}
                >
                  {tab === "general" ? "General" : "Budget"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activeTab === "general" ? (
        <>
        <View
          style={[
            styles.section,
            { backgroundColor: palette.card, borderColor: palette.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>
                Theme
              </Text>
              <Text style={[styles.sectionHint, { color: palette.mutedText }]}>
                Switch between calm readable and dramatic premium.
              </Text>
            </View>
            <View
              style={[
                styles.currentPill,
                { backgroundColor: palette.input, borderColor: palette.border },
              ]}
            >
              <Text style={[styles.currentPillText, { color: palette.text }]}>
                {HifeThemes[mode].name}
              </Text>
            </View>
          </View>

          <View style={styles.themeGrid}>
            {THEME_OPTIONS.map((option) => {
              const theme = HifeThemes[option];
              const selected = option === mode;

              return (
                <Pressable
                  key={option}
                  style={[
                    styles.themeCard,
                    {
                      backgroundColor: theme.card,
                      borderColor: selected ? palette.primary : theme.border,
                    },
                  ]}
                  onPress={() => setMode(option)}
                >
                  <View style={styles.themeTopRow}>
                    <View style={styles.swatches}>
                      <View
                        style={[
                          styles.swatch,
                          { backgroundColor: theme.background },
                        ]}
                      />
                      <View
                        style={[
                          styles.swatch,
                          { backgroundColor: theme.primary },
                        ]}
                      />
                      <View
                        style={[
                          styles.swatch,
                          { backgroundColor: theme.accent },
                        ]}
                      />
                    </View>
                    {selected ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={palette.primary}
                      />
                    ) : null}
                  </View>
                  <Text style={[styles.themeName, { color: theme.text }]}>
                    {theme.name}
                  </Text>
                  <Text style={[styles.themeDescription, { color: theme.mutedText }]}>
                    {theme.description}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View
          style={[
            styles.section,
            styles.notificationSection,
            { backgroundColor: palette.card, borderColor: palette.border },
          ]}
        >
          <View style={styles.notificationHeader}>
            <View style={styles.notificationHeaderText}>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>
                Notifications
              </Text>
              <Text style={[styles.sectionHint, { color: palette.mutedText }]}>
                Get local alerts for partner updates on this device.
              </Text>
            </View>
            <Switch
              value={notificationSettings.enabled}
              onValueChange={(value) =>
                value
                  ? enableNotifications()
                  : toggleNotificationSetting("enabled", false)
              }
              trackColor={{ false: palette.border, true: palette.primary }}
              thumbColor={palette.card}
            />
          </View>

          {(["newRequests", "statusChanges", "comments"] as const).map(
            (key) => (
              <View key={key} style={styles.notificationRow}>
                <Text style={[styles.notificationLabel, { color: palette.text }]}>
                  {key === "newRequests"
                    ? "New requests"
                    : key === "statusChanges"
                      ? "Approvals and declines"
                      : "New comments"}
                </Text>
                <Switch
                  value={notificationSettings[key]}
                  disabled={!notificationSettings.enabled}
                  onValueChange={(value) =>
                    toggleNotificationSetting(key, value)
                  }
                  trackColor={{ false: palette.border, true: palette.primary }}
                  thumbColor={palette.card}
                />
              </View>
            )
          )}
        </View>
        </>
        ) : (
        <View
          style={[
            styles.section,
            { backgroundColor: palette.card, borderColor: palette.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: palette.text }]}>
            Budget
          </Text>
          <Text style={[styles.sectionHint, { color: palette.mutedText }]}>
            Add category amounts first. Hife calculates the monthly room budget
            from the category total.
          </Text>

          <Text style={[styles.inputLabel, { color: palette.text }]}>
            Monthly room budget
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.disabledInput,
              {
                backgroundColor: palette.input,
                borderColor: palette.border,
                color: palette.text,
              },
            ]}
            value={formatInr(Number(monthlyBudgetInput || 0))}
            editable={false}
            placeholder="INR"
            placeholderTextColor={palette.mutedText}
          />

          <Text style={[styles.inputLabel, { color: palette.text }]}>
            Monthly household income
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: palette.input, borderColor: palette.border, color: palette.text },
            ]}
            value={monthlyIncomeInput}
            keyboardType="numeric"
            onChangeText={updateMoneyInput(setMonthlyIncomeInput)}
            placeholder="INR"
            placeholderTextColor={palette.mutedText}
          />

          <Text style={[styles.inputLabel, { color: palette.text }]}>
            Committed monthly expenses
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: palette.input, borderColor: palette.border, color: palette.text },
            ]}
            value={committedExpensesInput}
            keyboardType="numeric"
            onChangeText={updateMoneyInput(setCommittedExpensesInput)}
            placeholder="INR"
            placeholderTextColor={palette.mutedText}
          />

          <Text style={[styles.inputLabel, { color: palette.text }]}>
            Emergency buffer / reserve
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: palette.input, borderColor: palette.border, color: palette.text },
            ]}
            value={savingsReserveInput}
            keyboardType="numeric"
            onChangeText={updateMoneyInput(setSavingsReserveInput)}
            placeholder="INR"
            placeholderTextColor={palette.mutedText}
          />

          <Text style={[styles.inputLabel, { color: palette.text }]}>
            Category budgets
          </Text>
          {Object.keys(categoryBudgetInputs).map((category) => (
            <View key={category} style={styles.categoryRow}>
              <Text style={[styles.categoryName, { color: palette.text }]}>
                {category}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.categoryAmountInput,
                  {
                    backgroundColor: palette.input,
                    borderColor: palette.border,
                    color: palette.text,
                  },
                ]}
                value={categoryBudgetInputs[category]}
                keyboardType="numeric"
                onChangeText={(value) =>
                  updateCategoryBudgetInput(category, value)
                }
                placeholder="INR"
                placeholderTextColor={palette.mutedText}
              />
              <Pressable
                style={[styles.removeCategoryButton, { borderColor: palette.border }]}
                onPress={() => removeCategory(category)}
              >
                <Ionicons name="close" size={18} color={palette.primary} />
              </Pressable>
            </View>
          ))}

          <View style={styles.addCategoryRow}>
            <TextInput
              style={[
                styles.input,
                styles.addCategoryNameInput,
                { backgroundColor: palette.input, borderColor: palette.border, color: palette.text },
              ]}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="Grocery"
              placeholderTextColor={palette.mutedText}
            />
            <TextInput
              style={[
                styles.input,
                styles.addCategoryAmountInput,
                { backgroundColor: palette.input, borderColor: palette.border, color: palette.text },
              ]}
              value={newCategoryBudgetInput}
              keyboardType="numeric"
              onChangeText={(value) =>
                setNewCategoryBudgetInput(cleanMoneyInputValue(value))
              }
              placeholder="INR"
              placeholderTextColor={palette.mutedText}
            />
            <Pressable
              style={[styles.addButton, { borderColor: palette.primary }]}
              onPress={addCategory}
            >
              <Text style={[styles.addButtonText, { color: palette.primary }]}>
                Add
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={[
              styles.saveButton,
              { backgroundColor: palette.primary },
              savingBudget && styles.disabledInput,
            ]}
            disabled={savingBudget}
            onPress={saveBudgetSettings}
          >
            <Text style={[styles.saveButtonText, { color: palette.buttonText }]}>
              {savingBudget ? "Saving..." : "Save Budget"}
            </Text>
          </Pressable>
        </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 18,
    paddingBottom: 32,
  },
  intro: {
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  section: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  notificationSection: {
    marginTop: 14,
  },
  segmented: {
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 14,
    padding: 4,
  },
  segment: {
    alignItems: "center",
    borderRadius: 6,
    flex: 1,
    justifyContent: "center",
    minHeight: 42,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "900",
  },
  sectionHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
  },
  sectionHint: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 4,
    maxWidth: 210,
  },
  currentPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  currentPillText: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  themeGrid: {
    gap: 10,
    marginTop: 14,
  },
  themeCard: {
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 120,
    padding: 14,
  },
  themeTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  swatches: {
    flexDirection: "row",
    gap: 6,
  },
  swatch: {
    borderColor: "rgba(0, 0, 0, 0.12)",
    borderRadius: 999,
    borderWidth: 1,
    height: 22,
    width: 22,
  },
  themeName: {
    fontSize: 18,
    fontWeight: "900",
    marginTop: 14,
  },
  themeDescription: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginTop: 5,
  },
  notificationHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  notificationHeaderText: {
    flex: 1,
  },
  notificationRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 44,
  },
  notificationLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
    paddingRight: 12,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 7,
    marginTop: 14,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  disabledInput: {
    opacity: 0.76,
  },
  categoryRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    minHeight: 52,
  },
  categoryName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "900",
  },
  categoryAmountInput: {
    width: 112,
  },
  removeCategoryButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  addCategoryRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  addCategoryNameInput: {
    flexBasis: "100%",
  },
  addCategoryAmountInput: {
    flex: 1,
  },
  addButton: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    minWidth: 82,
    paddingHorizontal: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "900",
  },
  saveButton: {
    alignItems: "center",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 12,
    minHeight: 54,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "900",
  },
});
