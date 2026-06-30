import Header from "@/components/header";
import {
  BudgetSettings,
  PurchaseRequest,
  RequestPriority,
  RequestStatus,
} from "@/constants/types";
import { getBudgetSettings, updateBudgetSettings } from "@/services/budgets";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Switch,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  getPurchaseRequests,
  subscribeToPurchaseRequests,
} from "@/services/purchaseRequests";
import useToast from "@/components/toast/useToast";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  getNotificationSettings,
  getReadCommentCounts,
  requestNotificationPermission,
  scheduleLocalNotification,
  updateNotificationSettings,
} from "@/services/notifications";
import { getDeviceUserId } from "@/utils/deviceUser";
import {
  buildBudgetSummary,
  DEFAULT_BUDGET_SETTINGS,
  formatInr,
  getBudgetCategories,
  getRequestAmount,
} from "@/utils/budget";
import {
  getPriorityChipColor,
  getPriorityLabel,
  getStatusChipColor,
  getStatusLabel,
} from "@/utils/requestPresentation";
import { logError } from "@/utils/safeLogger";

type FilterValue = "all" | RequestStatus;

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Need Info", value: "needs_more_info" },
  { label: "Approved", value: "approved" },
  { label: "Declined", value: "declined" },
  { label: "Buy Later", value: "buy_later" },
  { label: "Purchased", value: "purchased" },
];

const FILTER_VALUES = new Set<FilterValue>(FILTERS.map((filter) => filter.value));
const previewTimestamp = {
  toDate: () => new Date("2026-06-29T19:54:28+05:30"),
};
const PREVIEW_BUDGET_SETTINGS: BudgetSettings = {
  monthlyBudget: 5000,
  monthlyIncome: 12000,
  committedExpenses: 3000,
  savingsReserve: 2000,
  categoryBudgets: {
    Home: 5000,
    Kitchen: 2500,
    Work: 2000,
  },
};
const PREVIEW_REQUESTS: PurchaseRequest[] = [
  {
    id: "preview",
    title: "Quiet Air Purifier",
    productName: "Quiet Air Purifier",
    info: "Needed for better sleep and cleaner room air.",
    reason: "The room gets dusty quickly and this keeps the space healthier without making noise.",
    priority: "P1",
    expectedPrice: 3500,
    maxBudget: 5000,
    budget: 5000,
    category: "Home",
    links: [],
    status: "purchased",
    decisionReason: "Approved because it improves daily comfort and stays within the monthly room budget.",
    decisionBy: null,
    decisionAt: null,
    image: null,
    householdId: "preview-household",
    createdBy: "partner-a",
    createdByDisplayName: "Nitesh",
    createdByRoleLabel: "Partner A",
    createdAt: previewTimestamp,
    updatedAt: previewTimestamp,
    lastActivityAt: previewTimestamp,
    lastActivityType: "comment",
    commentCount: 4,
    lastCommentBy: "partner-b",
    lastCommentText: "Looks useful. Approved.",
  },
];

function splitMonthlyBudgetAcrossCategories(
  monthlyBudget: number,
  categories: string[]
) {
  const cleanCategories = categories.map((item) => item.trim()).filter(Boolean);
  const targetCategories = cleanCategories.length ? cleanCategories : ["Other"];
  const total = Math.max(0, Math.round(monthlyBudget || 0));
  const base = Math.floor(total / targetCategories.length);
  const remainder = total % targetCategories.length;

  return targetCategories.reduce((budgets, category, index) => {
    budgets[category] = base + (index < remainder ? 1 : 0);
    return budgets;
  }, {} as Record<string, number>);
}

function budgetInputsFromSettings(settings: BudgetSettings) {
  return Object.entries(settings.categoryBudgets || {}).reduce(
    (inputs, [category, value]) => ({
      ...inputs,
      [category]: value ? String(value) : "0",
    }),
    {} as Record<string, string>
  );
}

type NotificationSettings = typeof DEFAULT_NOTIFICATION_SETTINGS;

const HEALTH_COPY = {
  safe: {
    label: "Safe",
    message: "Pending requests still fit inside this month's budget.",
    color: "#BFD4B8",
  },
  tight: {
    label: "Tight",
    message: "There is little room left after pending decisions.",
    color: "#E0B95C",
  },
  over_budget: {
    label: "Over budget",
    message: "Pending and approved spend are above the monthly budget.",
    color: "#E7A18E",
  },
  needs_review: {
    label: "Needs review",
    message: "Set a monthly budget before relying on safe-to-spend.",
    color: "#EDE4D6",
  },
} as const;

function clampProgress(value: number) {
  return `${Math.max(0, Math.min(1, value)) * 100}%`;
}

function formatSafeToSpend(amount: number) {
  return amount < 0 ? `Over by ${formatInr(Math.abs(amount))}` : formatInr(amount);
}

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ filter?: string }>();
  const isPreview =
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("preview");
  const toast = useToast();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [budgetSettings, setBudgetSettings] = useState<BudgetSettings>(
    DEFAULT_BUDGET_SETTINGS
  );
  const [monthlyBudgetInput, setMonthlyBudgetInput] = useState("");
  const [monthlyIncomeInput, setMonthlyIncomeInput] = useState("");
  const [committedExpensesInput, setCommittedExpensesInput] = useState("");
  const [savingsReserveInput, setSavingsReserveInput] = useState("");
  const [categoryBudgetInputs, setCategoryBudgetInputs] = useState<
    Record<string, string>
  >({});
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const [loading, setLoading] = useState(true);
  const [savingBudget, setSavingBudget] = useState(false);
  const [showBudgetOverview, setShowBudgetOverview] = useState(false);
  const [showBudgetSettings, setShowBudgetSettings] = useState(false);
  const [showCategorySummary, setShowCategorySummary] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [readCommentCounts, setReadCommentCounts] = useState<
    Record<string, number>
  >({});
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const initialSnapshotSeen = useRef(false);
  const myUserIdRef = useRef<string | null>(null);
  const notificationSettingsRef = useRef<NotificationSettings>(
    DEFAULT_NOTIFICATION_SETTINGS
  );

  const loadRequests = useCallback(async () => {
    if (isPreview) {
      setError(null);
      setRequests(PREVIEW_REQUESTS);
      setBudgetSettings(PREVIEW_BUDGET_SETTINGS);
      setReadCommentCounts({ preview: 1 });
      setMyUserId("partner-a");
      setMonthlyBudgetInput(String(PREVIEW_BUDGET_SETTINGS.monthlyBudget));
      setMonthlyIncomeInput(String(PREVIEW_BUDGET_SETTINGS.monthlyIncome || 0));
      setCommittedExpensesInput(
        String(PREVIEW_BUDGET_SETTINGS.committedExpenses || 0)
      );
      setSavingsReserveInput(String(PREVIEW_BUDGET_SETTINGS.savingsReserve || 0));
      setCategoryBudgetInputs(budgetInputsFromSettings(PREVIEW_BUDGET_SETTINGS));
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const [data, settings, readCounts, savedNotificationSettings, userId] =
        await Promise.all([
        getPurchaseRequests(),
        getBudgetSettings(),
        getReadCommentCounts(),
        getNotificationSettings(),
        getDeviceUserId(),
      ]);
      const nextSettings = settings as BudgetSettings;
      setRequests(data);
      setBudgetSettings(nextSettings);
      setReadCommentCounts(readCounts);
      setNotificationSettings(savedNotificationSettings);
      setMyUserId(userId);
      myUserIdRef.current = userId;
      notificationSettingsRef.current = savedNotificationSettings;
      setMonthlyBudgetInput(
        nextSettings.monthlyBudget ? String(nextSettings.monthlyBudget) : ""
      );
      setMonthlyIncomeInput(
        nextSettings.monthlyIncome ? String(nextSettings.monthlyIncome) : ""
      );
      setCommittedExpensesInput(
        nextSettings.committedExpenses
          ? String(nextSettings.committedExpenses)
          : ""
      );
      setSavingsReserveInput(
        nextSettings.savingsReserve ? String(nextSettings.savingsReserve) : ""
      );
      setCategoryBudgetInputs(budgetInputsFromSettings(nextSettings));
    } catch (e) {
      logError("Failed to fetch requests", e);
      setError("Could not load purchase requests. Pull to try again.");
    } finally {
      setLoading(false);
    }
  }, [isPreview]);

  useEffect(() => {
    myUserIdRef.current = myUserId;
  }, [myUserId]);

  useEffect(() => {
    notificationSettingsRef.current = notificationSettings;
  }, [notificationSettings]);

  useEffect(() => {
    const nextFilter = Array.isArray(params.filter)
      ? params.filter[0]
      : params.filter;

    if (nextFilter && FILTER_VALUES.has(nextFilter as FilterValue)) {
      setActiveFilter(nextFilter as FilterValue);
    }
  }, [params.filter]);

  useEffect(() => {
    if (isPreview) return;

    let unsubscribe: undefined | (() => void);
    let cancelled = false;

    getDeviceUserId().then((userId) => {
      if (!cancelled) setMyUserId(userId);
    });

    subscribeToPurchaseRequests(
      (data: PurchaseRequest[], snapshot: any) => {
        setRequests(data);
        setError(null);
        setLoading(false);

        if (!initialSnapshotSeen.current) {
          initialSnapshotSeen.current = true;
          return;
        }

        snapshot.docChanges().forEach((change: any) => {
          const item = data.find(
            (request: PurchaseRequest) => request.id === change.doc.id
          );
          const currentUserId = myUserIdRef.current;
          const settings = notificationSettingsRef.current;
          if (!item || !currentUserId) return;

          if (
            change.type === "added" &&
            item.createdBy !== currentUserId &&
            settings.enabled &&
            settings.newRequests
          ) {
            scheduleLocalNotification({
              title: "New purchase request",
              body: item.productName,
              data: { requestId: item.id },
            });
          }

          if (
            change.type === "modified" &&
            ["approved", "declined"].includes(item.lastActivityType || "") &&
            item.decisionBy !== currentUserId &&
            settings.enabled &&
            settings.statusChanges
          ) {
            scheduleLocalNotification({
              title: `Request ${getStatusLabel(item.status).toLowerCase()}`,
              body: item.productName,
              data: { requestId: item.id },
            });
          }

          if (
            change.type === "modified" &&
            item.lastActivityType === "comment" &&
            item.lastCommentBy !== currentUserId &&
            settings.enabled &&
            settings.comments
          ) {
            scheduleLocalNotification({
              title: `New comment on ${item.productName}`,
              body: item.lastCommentText || "Open Hife to read the discussion.",
              data: { requestId: item.id },
            });
          }
        });
      },
      (listenerError: unknown) => {
        logError("Realtime request listener failed", listenerError);
        setError("Could not listen for purchase requests. Pull to try again.");
        setLoading(false);
      }
    ).then((stop) => {
      if (cancelled) {
        stop();
      } else {
        unsubscribe = stop;
      }
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [isPreview]);

  const budgetSummary = useMemo(
    () => buildBudgetSummary(requests, budgetSettings),
    [budgetSettings, requests]
  );
  const budgetCategories = useMemo(
    () => getBudgetCategories(budgetSettings),
    [budgetSettings]
  );
  const healthCopy = HEALTH_COPY[budgetSummary.budgetHealth];
  const topCategorySummaries = budgetSummary.categorySummaries.slice(0, 3);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests])
  );

  const enableNotifications = async () => {
    const result = await requestNotificationPermission();
    setNotificationSettings(result.settings);
    notificationSettingsRef.current = result.settings;
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
    const settings = await updateNotificationSettings({
      ...notificationSettings,
      [key]: value,
    });
    setNotificationSettings(settings);
    notificationSettingsRef.current = settings;
  };

  const formatActivity = (value: any) => {
    const date = value?.toDate?.();
    return date ? date.toLocaleString() : "No activity yet";
  };

  const filteredRequests = useMemo(() => {
    if (activeFilter === "all") return requests;
    return requests.filter((item) => item.status === activeFilter);
  }, [activeFilter, requests]);

  const saveBudgetSettings = async () => {
    if (savingBudget) return;

    try {
      setSavingBudget(true);
      const categories = Object.keys(categoryBudgetInputs);
      const settings = await updateBudgetSettings({
        monthlyBudget: Number(monthlyBudgetInput || 0),
        monthlyIncome: Number(monthlyIncomeInput || 0),
        committedExpenses: Number(committedExpensesInput || 0),
        savingsReserve: Number(savingsReserveInput || 0),
        categoryBudgets: splitMonthlyBudgetAcrossCategories(
          Number(monthlyBudgetInput || 0),
          categories
        ),
      });

      setBudgetSettings(settings);
      setCategoryBudgetInputs(budgetInputsFromSettings(settings));
      setShowBudgetSettings(false);
      toast.show("Budget settings saved", "success");
    } catch (saveError) {
      logError("Failed to save budget settings", saveError);
      toast.show("Failed to save budget settings", "error");
    } finally {
      setSavingBudget(false);
    }
  };

  const updateMonthlyBudgetInput = (value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, "");
    const categories = Object.keys(categoryBudgetInputs);

    setMonthlyBudgetInput(cleanValue);
    setCategoryBudgetInputs(
      Object.entries(
        splitMonthlyBudgetAcrossCategories(Number(cleanValue || 0), categories)
      ).reduce(
        (inputs, [category, amount]) => ({
          ...inputs,
          [category]: String(amount),
        }),
        {} as Record<string, string>
      )
    );
  };

  const updateMoneyInput =
    (setter: (value: string) => void) => (value: string) => {
      setter(value.replace(/[^0-9]/g, ""));
    };

  const addCategory = async () => {
    if (savingBudget) return;

    const cleanName = newCategoryName.trim();
    if (!cleanName) {
      toast.show("Add a category name", "error");
      return;
    }

    if (Object.keys(categoryBudgetInputs).includes(cleanName)) {
      toast.show("Category already exists", "error");
      return;
    }

    try {
      setSavingBudget(true);
      const categories = [...Object.keys(categoryBudgetInputs), cleanName];
      const settings = await updateBudgetSettings({
        monthlyBudget: Number(monthlyBudgetInput || 0),
        monthlyIncome: Number(monthlyIncomeInput || 0),
        committedExpenses: Number(committedExpensesInput || 0),
        savingsReserve: Number(savingsReserveInput || 0),
        categoryBudgets: splitMonthlyBudgetAcrossCategories(
          Number(monthlyBudgetInput || 0),
          categories
        ),
      });

      setBudgetSettings(settings);
      setCategoryBudgetInputs(budgetInputsFromSettings(settings));
      setNewCategoryName("");
      toast.show("Category added", "success");
    } catch (error) {
      logError("Failed to add category", error);
      toast.show("Failed to add category", "error");
    } finally {
      setSavingBudget(false);
    }
  };

  const removeCategory = async (category: string) => {
    if (savingBudget) return;

    const categories = Object.keys(categoryBudgetInputs).filter(
      (item) => item !== category
    );

    if (!categories.length) {
      toast.show("Keep at least one category", "error");
      return;
    }

    try {
      setSavingBudget(true);
      const settings = await updateBudgetSettings({
        monthlyBudget: Number(monthlyBudgetInput || 0),
        monthlyIncome: Number(monthlyIncomeInput || 0),
        committedExpenses: Number(committedExpensesInput || 0),
        savingsReserve: Number(savingsReserveInput || 0),
        categoryBudgets: splitMonthlyBudgetAcrossCategories(
          Number(monthlyBudgetInput || 0),
          categories
        ),
      });

      setBudgetSettings(settings);
      setCategoryBudgetInputs(budgetInputsFromSettings(settings));
      toast.show("Category removed", "success");
    } catch (error) {
      logError("Failed to remove category", error);
      toast.show("Failed to remove category", "error");
    } finally {
      setSavingBudget(false);
    }
  };

  const ListHeader = (
    <View style={styles.budgetPanel}>
      <Pressable
        style={styles.budgetHeader}
        onPress={() => setShowBudgetOverview((value) => !value)}
      >
        <View>
          <Text style={styles.budgetEyebrow}>Can we safely buy?</Text>
          <Text style={styles.budgetTitle}>Safe to spend</Text>
        </View>
        <View style={styles.budgetHeaderAction}>
          <Text
            style={[styles.healthPill, { color: healthCopy.color }]}
            numberOfLines={1}
          >
            {healthCopy.label}
          </Text>
          <Ionicons
            name={showBudgetOverview ? "chevron-up" : "chevron-down"}
            size={20}
            color="#A85C44"
          />
        </View>
      </Pressable>

      <View style={styles.safeSpendHero}>
        <Text style={styles.safeSpendValue}>
          {formatSafeToSpend(budgetSummary.safeToSpend)}
        </Text>
        <Text style={styles.safeSpendHelp}>{healthCopy.message}</Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: clampProgress(budgetSummary.spendingProgress) },
              budgetSummary.budgetHealth === "over_budget" &&
                styles.progressFillWarning,
            ]}
          />
        </View>
        <View style={styles.progressMetaRow}>
          <Text style={styles.progressMetaText}>
            Approved + pending{" "}
            {formatInr(budgetSummary.approvedTotal + budgetSummary.pendingTotal)}
          </Text>
          <Text style={styles.progressMetaText}>
            Decision budget {formatInr(budgetSummary.decisionBudget)}
          </Text>
        </View>
      </View>

      <View style={styles.compactBudgetRow}>
        <View style={styles.compactBudgetItem}>
          <Text style={styles.statLabel}>Approved</Text>
          <Text style={styles.compactBudgetValue}>
            {formatInr(budgetSummary.approvedTotal)}
          </Text>
        </View>
        <View style={styles.compactDivider} />
        <View style={styles.compactBudgetItem}>
          <Text style={styles.statLabel}>Pending</Text>
          <Text style={styles.compactBudgetValue}>
            {formatInr(budgetSummary.pendingTotal)}
          </Text>
        </View>
        <View style={styles.compactDivider} />
        <View style={styles.compactBudgetItem}>
          <Text style={styles.statLabel}>Remaining</Text>
          <Text style={styles.compactBudgetValue}>
            {formatInr(budgetSummary.remainingBudget)}
          </Text>
        </View>
      </View>

      {topCategorySummaries.length > 0 ? (
        <View style={styles.categoryPreview}>
          {topCategorySummaries.map((item) => {
            const categoryProgress =
              item.budget > 0
                ? (item.approvedTotal + item.pendingTotal) / item.budget
                : 0;

            return (
              <View key={item.category} style={styles.categoryPreviewRow}>
                <View style={styles.categoryPreviewTop}>
                  <Text style={styles.categoryPreviewName} numberOfLines={1}>
                    {item.category}
                  </Text>
                  <Text style={styles.categoryPreviewAmount}>
                    {formatInr(item.remaining)} left
                  </Text>
                </View>
                <View style={styles.categoryTrack}>
                  <View
                    style={[
                      styles.categoryFill,
                      { width: clampProgress(categoryProgress) },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {!showBudgetOverview ? (
        <Pressable
          style={styles.compactDetailsButton}
          onPress={() => setShowBudgetOverview(true)}
        >
          <Text style={styles.compactDetailsText}>View budget details</Text>
        </Pressable>
      ) : null}

      {showBudgetOverview ? (
        <>
          <View style={styles.budgetStats}>
            <View style={styles.budgetStat}>
              <Text style={styles.statLabel}>Monthly budget</Text>
              <Text style={styles.statValue}>
                {formatInr(budgetSummary.monthlyBudget)}
              </Text>
            </View>
            <View style={styles.budgetStat}>
              <Text style={styles.statLabel}>Monthly income</Text>
              <Text style={styles.statValue}>
                {formatInr(budgetSummary.monthlyIncome)}
              </Text>
            </View>
            <View style={styles.budgetStat}>
              <Text style={styles.statLabel}>Committed expenses</Text>
              <Text style={styles.statValue}>
                {formatInr(budgetSummary.committedExpenses)}
              </Text>
            </View>
            <View style={styles.budgetStat}>
              <Text style={styles.statLabel}>Savings reserve</Text>
              <Text style={styles.statValue}>
                {formatInr(budgetSummary.savingsReserve)}
              </Text>
            </View>
            <View style={styles.budgetStat}>
              <Text style={styles.statLabel}>Decision budget</Text>
              <Text style={styles.statValue}>
                {formatInr(budgetSummary.decisionBudget)}
              </Text>
            </View>
            <View style={styles.budgetStat}>
              <Text style={styles.statLabel}>Approved spend</Text>
              <Text style={styles.statValue}>
                {formatInr(budgetSummary.approvedTotal)}
              </Text>
            </View>
            <View style={styles.budgetStat}>
              <Text style={styles.statLabel}>Pending decisions</Text>
              <Text style={styles.statValue}>
                {formatInr(budgetSummary.pendingTotal)}
              </Text>
            </View>
            <View style={styles.budgetStat}>
              <Text style={styles.statLabel}>Remaining before pending</Text>
              <Text style={styles.statValue}>
                {formatInr(budgetSummary.remainingBudget)}
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.settingsButton}
            onPress={() => setShowBudgetSettings((value) => !value)}
          >
            <Text style={styles.settingsButtonText}>
              {showBudgetSettings ? "Close budget settings" : "Edit budget"}
            </Text>
          </Pressable>

      {showBudgetSettings ? (
        <View style={styles.settingsPanel}>
          <Text style={styles.inputLabel}>Monthly room budget</Text>
          <TextInput
            style={styles.budgetInput}
            value={monthlyBudgetInput}
            keyboardType="numeric"
            onChangeText={updateMonthlyBudgetInput}
            placeholder="INR"
            placeholderTextColor="#8F867A"
          />

          <Text style={styles.inputLabel}>Monthly household income</Text>
          <TextInput
            style={styles.budgetInput}
            value={monthlyIncomeInput}
            keyboardType="numeric"
            onChangeText={updateMoneyInput(setMonthlyIncomeInput)}
            placeholder="INR"
            placeholderTextColor="#8F867A"
          />

          <Text style={styles.inputLabel}>Committed monthly expenses</Text>
          <TextInput
            style={styles.budgetInput}
            value={committedExpensesInput}
            keyboardType="numeric"
            onChangeText={updateMoneyInput(setCommittedExpensesInput)}
            placeholder="INR"
            placeholderTextColor="#8F867A"
          />

          <Text style={styles.inputLabel}>Emergency buffer / reserve</Text>
          <TextInput
            style={styles.budgetInput}
            value={savingsReserveInput}
            keyboardType="numeric"
            onChangeText={updateMoneyInput(setSavingsReserveInput)}
            placeholder="INR"
            placeholderTextColor="#8F867A"
          />

          <Text style={styles.inputLabel}>Category budgets auto split</Text>
          {budgetCategories.map((category) => (
            <View key={category} style={styles.categoryInputRow}>
              <Text style={styles.categoryInputLabel}>{category}</Text>
              <Text style={styles.categoryAmountText}>
                {formatInr(Number(categoryBudgetInputs[category] || 0))}
              </Text>
              <Pressable
                style={styles.removeCategoryButton}
                disabled={savingBudget}
                onPress={() => removeCategory(category)}
              >
                <Ionicons name="close" size={18} color="#A85C44" />
              </Pressable>
            </View>
          ))}

          <View style={styles.addCategoryRow}>
            <TextInput
              style={[styles.budgetInput, styles.addCategoryInput]}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="Add custom category"
              placeholderTextColor="#8F867A"
            />
            <Pressable
              style={[styles.addCategoryButton, savingBudget && styles.disabledButton]}
              disabled={savingBudget}
              onPress={addCategory}
            >
              <Text style={styles.addCategoryText}>
                {savingBudget ? "Saving" : "Add"}
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={[styles.saveBudgetButton, savingBudget && styles.disabledButton]}
            disabled={savingBudget}
            onPress={saveBudgetSettings}
          >
            <Text style={styles.saveBudgetText}>
              {savingBudget ? "Saving..." : "Save Budget"}
            </Text>
          </Pressable>

          <View style={styles.notificationPanel}>
            <View style={styles.notificationHeader}>
              <View style={styles.notificationHeaderText}>
                <Text style={styles.inputLabel}>Notifications</Text>
                <Text style={styles.notificationHint}>
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
                trackColor={{ false: "#E8DECE", true: "#A85C44" }}
                thumbColor="#FAF6EE"
              />
            </View>

            {(["newRequests", "statusChanges", "comments"] as const).map(
              (key) => (
                <View key={key} style={styles.notificationRow}>
                  <Text style={styles.notificationLabel}>
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
                    trackColor={{ false: "#E8DECE", true: "#A85C44" }}
                    thumbColor="#FAF6EE"
                  />
                </View>
              )
            )}
          </View>
        </View>
      ) : null}

      <Pressable
        style={styles.summaryToggle}
        onPress={() => setShowCategorySummary((value) => !value)}
      >
        <Text style={styles.sectionHeading}>Category summary</Text>
        <Text style={styles.summaryToggleText}>
          {showCategorySummary ? "Hide" : "Show"}
        </Text>
      </Pressable>

      {showCategorySummary
        ? budgetSummary.categorySummaries.map((item) => (
            <View key={item.category} style={styles.summaryRow}>
              <Text style={styles.summaryCategory}>{item.category}</Text>
              <Text style={styles.summaryText}>
                {formatInr(item.approvedTotal)} approved /{" "}
                {formatInr(item.pendingTotal)} pending /{" "}
                {formatInr(item.purchasedTotal)} purchased
              </Text>
              <Text style={styles.summaryText}>
                {formatInr(item.projectedRemaining)} projected left of{" "}
                {formatInr(item.budget)}
              </Text>
            </View>
          ))
        : null}

      <Text style={styles.sectionHeading}>Spending history</Text>
      {budgetSummary.monthlyHistory.length === 0 ? (
        <Text style={styles.historyEmpty}>No approved or pending requests yet.</Text>
      ) : (
        budgetSummary.monthlyHistory.slice(0, 4).map((item) => (
          <View key={item.monthKey} style={styles.historyRow}>
            <Text style={styles.historyMonth}>{item.label}</Text>
            <Text style={styles.historyText}>
              {formatInr(item.approvedTotal)} approved, {formatInr(item.pendingTotal)} pending
            </Text>
          </View>
        ))
      )}
        </>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.value;

            return (
              <Pressable
                key={filter.value}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveFilter(filter.value)}
              >
                <Text
                  style={[
                    styles.filterText,
                    isActive && styles.filterTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={filteredRequests}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        refreshing={loading}
        onRefresh={loadRequests}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                {error
                  ? "Requests unavailable"
                  : budgetSummary.monthlyBudget <= 0
                    ? "Set a monthly budget first"
                    : requests.length === 0
                      ? "No purchase decisions yet"
                      : "No matching requests"}
              </Text>
              <Text style={styles.emptyText}>
                {error
                  ? error
                  : budgetSummary.monthlyBudget <= 0
                    ? "Add a monthly room budget so Hife can calculate safe-to-spend before requests are created."
                    : requests.length === 0
                      ? "Create the first request when someone wants to buy something and needs a quick budget check."
                      : "Switch filters to see approved, pending, postponed, or purchased requests."}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const statusColor = getStatusChipColor(item.status);
          const priorityColor = getPriorityChipColor(
            item.priority as RequestPriority
          );
          const itemAmount = getRequestAmount(item);
          const categorySummary = budgetSummary.categorySummaries.find(
            (summary) => summary.category === item.category
          );
          const reservesBudget =
            item.status === "pending" || item.status === "needs_more_info";
          const afterApproval = budgetSummary.safeToSpend;
          const categoryAfterApproval =
            categorySummary?.projectedRemaining || 0;
          const safeSpendWarning = reservesBudget && budgetSummary.safeToSpend < 0;
          const categoryWarning =
            reservesBudget &&
            !!categorySummary?.budget &&
            (categorySummary.approvedTotal + categorySummary.pendingTotal >
              categorySummary.budget ||
              itemAmount > categorySummary.budget * 0.5);

          return (
            <Pressable
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/task/[id]",
                  params: { id: item.id },
                })
              }
            >
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.image} />
              ) : (
                <View style={[styles.image, styles.imagePlaceholder]} />
              )}

              <View style={styles.info}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.productName}
                  </Text>
                  <Text style={styles.priceText}>
                    {formatInr(item.expectedPrice)}
                  </Text>
                </View>

                <View style={styles.chipRow}>
                  <View
                    style={[
                      styles.statusChip,
                      { backgroundColor: statusColor.bg },
                      { borderColor: statusColor.border },
                    ]}
                  >
                    <Text
                      style={[styles.statusText, { color: statusColor.text }]}
                    >
                      {getStatusLabel(item.status)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.priorityChip,
                      { backgroundColor: priorityColor.bg },
                      { borderColor: priorityColor.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        { color: priorityColor.text },
                      ]}
                    >
                      {getPriorityLabel(item.priority as RequestPriority)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.metaText} numberOfLines={1}>
                  {item.category} category
                </Text>
                <Text style={styles.budget} numberOfLines={1}>
                  {reservesBudget ? "After approval" : "Safe to spend"}:{" "}
                  {formatSafeToSpend(afterApproval)}
                </Text>
                <Text style={styles.cardBudgetMeta} numberOfLines={1}>
                  Category projected left:{" "}
                  {formatSafeToSpend(categoryAfterApproval)}
                </Text>
                {safeSpendWarning ? (
                  <Text style={styles.cardWarningText} numberOfLines={1}>
                    Would push safe-to-spend below zero.
                  </Text>
                ) : categoryWarning ? (
                  <Text style={styles.cardWarningText} numberOfLines={1}>
                    Large impact on this category.
                  </Text>
                ) : null}
                <Text style={styles.activityText} numberOfLines={1}>
                  Last activity: {formatActivity(item.lastActivityAt)}
                </Text>
              </View>

              <View style={styles.actions}>
                <Pressable
                  style={styles.chatButton}
                  hitSlop={10}
                  onPress={() =>
                    router.push({
                      pathname: "/task/[id]/comments",
                      params: { id: item.id, title: item.productName },
                    })
                  }
                >
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={22}
                    color="#6F7F6A"
                  />
                  {Math.max(
                    Number(item.commentCount || 0) -
                      Number(readCommentCounts[item.id] || 0),
                    0
                  ) > 0 ? (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>
                        {Math.max(
                          Number(item.commentCount || 0) -
                            Number(readCommentCounts[item.id] || 0),
                          0
                        )}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>

                <Ionicons
                  name="chevron-forward"
                  size={22}
                  color="#776E64"
                />
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF6EE",
  },
  filtersWrapper: {
    borderBottomWidth: 1,
    backgroundColor: "#FAF6EE",
    borderColor: "#E8DECE",
  },
  filters: {
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  filterChip: {
    alignItems: "center",
    borderWidth: 1,
    backgroundColor: "#FFFFFF",
    borderColor: "#E8DECE",
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  filterChipActive: {
    backgroundColor: "#A85C44",
    borderColor: "#A85C44",
  },
  filterText: {
    color: "#8F867A",
    fontSize: 15,
    fontWeight: "700",
  },
  filterTextActive: {
    color: "#FAF6EE",
  },
  listContent: {
    padding: 18,
    paddingBottom: 28,
  },
  budgetPanel: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E8DECE",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 22,
    overflow: "hidden",
    padding: 18,
    shadowColor: "#7A4B36",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.08,
    shadowRadius: 26,
  },
  budgetHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 44,
  },
  budgetHeaderAction: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  healthPill: {
    backgroundColor: "#F5F0E8",
    borderColor: "#E8DECE",
    borderRadius: 999,
    borderWidth: 1,
    fontSize: 12,
    fontWeight: "900",
    maxWidth: 116,
    paddingHorizontal: 10,
    paddingVertical: 6,
    textTransform: "uppercase",
  },
  budgetEyebrow: {
    color: "#7A8C6E",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  budgetTitle: {
    color: "#3A2E28",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 2,
  },
  safeSpendHero: {
    borderBottomColor: "#E8DECE",
    borderBottomWidth: 1,
    marginTop: 14,
    paddingBottom: 14,
  },
  safeSpendValue: {
    color: "#3A2E28",
    fontSize: 36,
    fontWeight: "900",
  },
  safeSpendHelp: {
    color: "#776E64",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  progressTrack: {
    backgroundColor: "#F5F0E8",
    borderRadius: 999,
    height: 9,
    marginTop: 12,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: "#7A8C6E",
    borderRadius: 999,
    height: "100%",
  },
  progressFillWarning: {
    backgroundColor: "#A85C44",
  },
  progressMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 7,
  },
  progressMetaText: {
    color: "#8F867A",
    flexShrink: 1,
    fontSize: 11,
    fontWeight: "700",
  },
  settingsButton: {
    alignItems: "center",
    borderColor: "#A85C44",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 10,
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  settingsButtonText: {
    color: "#A85C44",
    fontSize: 13,
    fontWeight: "800",
  },
  budgetStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  compactBudgetRow: {
    alignItems: "center",
    backgroundColor: "#F5F0E8",
    borderColor: "#E8DECE",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  compactBudgetItem: {
    flex: 1,
    minWidth: 0,
  },
  compactBudgetValue: {
    color: "#3A2E28",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 3,
  },
  compactDivider: {
    alignSelf: "stretch",
    backgroundColor: "#E8DECE",
    width: 1,
  },
  compactDetailsButton: {
    alignItems: "center",
    borderColor: "#A85C44",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 12,
    minHeight: 36,
    paddingHorizontal: 12,
  },
  compactDetailsText: {
    color: "#A85C44",
    fontSize: 12,
    fontWeight: "900",
  },
  categoryPreview: {
    gap: 10,
    marginTop: 12,
  },
  categoryPreviewRow: {
    gap: 6,
  },
  categoryPreviewTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  categoryPreviewName: {
    color: "#3A2E28",
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
  },
  categoryPreviewAmount: {
    color: "#776E64",
    fontSize: 12,
    fontWeight: "700",
  },
  categoryTrack: {
    backgroundColor: "#F5F0E8",
    borderRadius: 999,
    height: 6,
    overflow: "hidden",
  },
  categoryFill: {
    backgroundColor: "#C4943A",
    borderRadius: 999,
    height: "100%",
  },
  budgetStat: {
    backgroundColor: "#F5F0E8",
    borderColor: "#E8DECE",
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: "48%",
    flexGrow: 1,
    padding: 10,
  },
  statLabel: {
    color: "#776E64",
    fontSize: 12,
    fontWeight: "700",
  },
  statValue: {
    color: "#3A2E28",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 3,
  },
  settingsPanel: {
    borderTopColor: "#E8DECE",
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 12,
  },
  inputLabel: {
    color: "#3A2E28",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 6,
    marginTop: 8,
  },
  budgetInput: {
    backgroundColor: "#F5F0E8",
    borderColor: "#E8DECE",
    borderRadius: 8,
    borderWidth: 1,
    color: "#3A2E28",
    fontSize: 14,
    padding: 10,
  },
  categoryInputRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  categoryInputLabel: {
    color: "#776E64",
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  categoryAmountText: {
    color: "#3A2E28",
    fontSize: 13,
    fontWeight: "900",
  },
  removeCategoryButton: {
    alignItems: "center",
    borderColor: "#E8DECE",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 34,
    minWidth: 34,
  },
  categoryInput: {
    backgroundColor: "#FAF6EE",
    borderColor: "#E8DECE",
    borderRadius: 8,
    borderWidth: 1,
    color: "#3A2E28",
    fontSize: 14,
    padding: 9,
    width: 120,
  },
  addCategoryRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  addCategoryInput: {
    flex: 1,
  },
  addCategoryButton: {
    alignItems: "center",
    borderColor: "#A85C44",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 14,
  },
  addCategoryText: {
    color: "#A85C44",
    fontSize: 13,
    fontWeight: "900",
  },
  saveBudgetButton: {
    alignItems: "center",
    backgroundColor: "#A85C44",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 8,
    minHeight: 48,
    paddingVertical: 12,
  },
  saveBudgetText: {
    color: "#FAF6EE",
    fontSize: 14,
    fontWeight: "800",
  },
  disabledButton: {
    opacity: 0.65,
  },
  sectionHeading: {
    color: "#A85C44",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 14,
    marginBottom: 8,
  },
  summaryToggle: {
    alignItems: "center",
    borderTopColor: "#E8DECE",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    minHeight: 48,
  },
  summaryToggleText: {
    color: "#3A2E28",
    fontSize: 13,
    fontWeight: "900",
  },
  summaryRow: {
    borderTopColor: "#E8DECE",
    borderTopWidth: 1,
    paddingVertical: 8,
  },
  summaryCategory: {
    color: "#3A2E28",
    fontSize: 14,
    fontWeight: "800",
  },
  summaryText: {
    color: "#776E64",
    fontSize: 12,
    marginTop: 2,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 6,
  },
  historyMonth: {
    color: "#3A2E28",
    fontSize: 13,
    fontWeight: "800",
  },
  historyText: {
    color: "#776E64",
    flex: 1,
    fontSize: 12,
    textAlign: "right",
  },
  historyEmpty: {
    color: "#776E64",
    fontSize: 13,
  },
  card: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E8DECE",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 16,
    padding: 12,
    shadowColor: "#7A4B36",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.10,
    shadowRadius: 22,
  },
  image: {
    width: 82,
    height: 92,
    borderRadius: 8,
    marginRight: 12,
  },
  actions: {
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 8,
    height: 58,
  },
  chatButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    minWidth: 44,
    position: "relative",
  },
  info: {
    flex: 1,
    justifyContent: "center",
  },
  cardTopRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
  },
  title: {
    color: "#3A2E28",
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
  },
  priceText: {
    color: "#3A2E28",
    flexShrink: 0,
    fontSize: 16,
    fontWeight: "900",
  },
  chipRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  statusChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  priorityChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "900",
  },
  metaText: {
    color: "#776E64",
    fontSize: 16,
    marginTop: 5,
  },
  budget: {
    marginTop: 3,
    color: "#A85C44",
    fontSize: 15,
    fontWeight: "800",
  },
  cardBudgetMeta: {
    color: "#776E64",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  cardWarningText: {
    color: "#A85C44",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 2,
  },
  activityText: {
    color: "#776E64",
    fontSize: 13,
    marginTop: 3,
  },
  unreadBadge: {
    alignItems: "center",
    backgroundColor: "#A85C44",
    borderRadius: 999,
    justifyContent: "center",
    minWidth: 18,
    paddingHorizontal: 5,
    paddingVertical: 2,
    position: "absolute",
    right: -8,
    top: -8,
  },
  unreadText: {
    color: "#FAF6EE",
    fontSize: 10,
    fontWeight: "900",
  },
  notificationPanel: {
    borderTopColor: "#E8DECE",
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 10,
  },
  notificationHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  notificationHeaderText: {
    flex: 1,
  },
  notificationHint: {
    color: "#776E64",
    fontSize: 12,
    lineHeight: 17,
    marginTop: -2,
  },
  notificationRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  notificationLabel: {
    color: "#3A2E28",
    fontSize: 13,
    fontWeight: "700",
  },
  imagePlaceholder: {
    backgroundColor: "#F5F0E8",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 56,
  },
  emptyTitle: {
    color: "#3A2E28",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyText: {
    color: "#776E64",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
});
