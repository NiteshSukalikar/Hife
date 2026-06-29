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
} from "@/utils/budget";
import {
  getPriorityChipColor,
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

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ filter?: string }>();
  const toast = useToast();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [budgetSettings, setBudgetSettings] = useState<BudgetSettings>(
    DEFAULT_BUDGET_SETTINGS
  );
  const [monthlyBudgetInput, setMonthlyBudgetInput] = useState("");
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
      setCategoryBudgetInputs(budgetInputsFromSettings(nextSettings));
    } catch (e) {
      logError("Failed to fetch requests", e);
      setError("Could not load purchase requests. Pull to try again.");
    } finally {
      setLoading(false);
    }
  }, []);

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
  }, []);

  const budgetSummary = useMemo(
    () => buildBudgetSummary(requests, budgetSettings),
    [budgetSettings, requests]
  );
  const budgetCategories = useMemo(
    () => getBudgetCategories(budgetSettings),
    [budgetSettings]
  );

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
          <Text style={styles.budgetEyebrow}>Current month</Text>
          <Text style={styles.budgetTitle}>Budget overview</Text>
        </View>
        <View style={styles.budgetHeaderAction}>
          <Text style={styles.budgetHeaderMeta}>
            {formatInr(budgetSummary.remainingBudget)} left
          </Text>
          <Ionicons
            name={showBudgetOverview ? "chevron-up" : "chevron-down"}
            size={20}
            color="#A85C44"
          />
        </View>
      </Pressable>

      {!showBudgetOverview ? (
        <View style={styles.compactBudgetRow}>
          <View>
            <Text style={styles.statLabel}>Monthly</Text>
            <Text style={styles.compactBudgetValue}>
              {formatInr(budgetSummary.monthlyBudget)}
            </Text>
          </View>
          <View style={styles.compactDivider} />
          <View>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={styles.compactBudgetValue}>
              {formatInr(budgetSummary.pendingTotal)}
            </Text>
          </View>
          <Pressable
            style={styles.compactDetailsButton}
            onPress={() => setShowBudgetOverview(true)}
          >
            <Text style={styles.compactDetailsText}>Details</Text>
          </Pressable>
        </View>
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
              <Text style={styles.statLabel}>Approved</Text>
              <Text style={styles.statValue}>
                {formatInr(budgetSummary.approvedTotal)}
              </Text>
            </View>
            <View style={styles.budgetStat}>
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={styles.statValue}>
                {formatInr(budgetSummary.pendingTotal)}
              </Text>
            </View>
            <View style={styles.budgetStat}>
              <Text style={styles.statLabel}>Remaining</Text>
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
                thumbColor="#3A2E28"
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
                    thumbColor="#3A2E28"
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
                {formatInr(item.pendingTotal)} pending
              </Text>
              <Text style={styles.summaryText}>
                {formatInr(item.remaining)} left of {formatInr(item.budget)}
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
                {error ? "Requests unavailable" : "No matching requests"}
              </Text>
              <Text style={styles.emptyText}>
                {error
                  ? error
                  : "Create a purchase request or switch filters to see more."}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const statusColor = getStatusChipColor(item.status);
          const priorityColor = getPriorityChipColor(
            item.priority as RequestPriority
          );

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
                  <Text style={styles.title} numberOfLines={1}>
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
                      {item.priority}
                    </Text>
                  </View>
                </View>

                <Text style={styles.metaText} numberOfLines={1}>
                  {item.category}
                </Text>
                <Text style={styles.budget}>
                  Max budget {formatInr(item.maxBudget)}
                </Text>
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
                    color="#7A8C6E"
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
                  color="#8F867A"
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
    borderColor: "#E8DECE",
  },
  filters: {
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterChip: {
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8DECE",
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: "#A85C44",
    borderColor: "#A85C44",
  },
  filterText: {
    color: "#8F867A",
    fontSize: 13,
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#FAF6EE",
  },
  listContent: {
    padding: 12,
  },
  budgetPanel: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E8DECE",
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
    padding: 12,
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
  budgetHeaderMeta: {
    color: "#A85C44",
    fontSize: 13,
    fontWeight: "800",
  },
  budgetEyebrow: {
    color: "#7A8C6E",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  budgetTitle: {
    color: "#3A2E28",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 2,
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
  compactBudgetValue: {
    color: "#3A2E28",
    fontSize: 14,
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
    minHeight: 36,
    paddingHorizontal: 12,
  },
  compactDetailsText: {
    color: "#A85C44",
    fontSize: 12,
    fontWeight: "900",
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
    color: "#8F867A",
    fontSize: 12,
    fontWeight: "700",
  },
  statValue: {
    color: "#3A2E28",
    fontSize: 15,
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
    backgroundColor: "#FAF6EE",
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
    color: "#8F867A",
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
    color: "#7A8C6E",
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
    color: "#8F867A",
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
    color: "#8F867A",
    flex: 1,
    fontSize: 12,
    textAlign: "right",
  },
  historyEmpty: {
    color: "#8F867A",
    fontSize: 13,
  },
  card: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E8DECE",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 12,
    padding: 12,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 8,
    marginRight: 10,
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
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  title: {
    color: "#3A2E28",
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
  },
  priceText: {
    color: "#A85C44",
    fontSize: 14,
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
    color: "#8F867A",
    fontSize: 13,
    marginTop: 5,
  },
  budget: {
    marginTop: 3,
    color: "#A85C44",
    fontSize: 13,
    fontWeight: "600",
  },
  activityText: {
    color: "#8F867A",
    fontSize: 11,
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
    color: "#8F867A",
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
    color: "#8F867A",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
});
