import Header from "@/components/header";
import { BudgetSettings, PurchaseRequest, RequestStatus } from "@/constants/types";
import { getBudgetSettings, updateBudgetSettings } from "@/services/budgets";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
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
  REQUEST_CATEGORIES,
} from "@/utils/budget";
import { logError } from "@/utils/safeLogger";

type FilterValue = "all" | RequestStatus;

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Declined", value: "declined" },
  { label: "Buy Later", value: "buy_later" },
  { label: "Purchased", value: "purchased" },
];

const STATUS_LABELS: Record<RequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  declined: "Declined",
  needs_more_info: "Needs Info",
  buy_later: "Buy Later",
  purchased: "Purchased",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<RequestStatus, { bg: string; text: string }> = {
  pending: { bg: "#fef3c7", text: "#92400e" },
  approved: { bg: "#dcfce7", text: "#166534" },
  declined: { bg: "#fee2e2", text: "#991b1b" },
  needs_more_info: { bg: "#dbeafe", text: "#1e40af" },
  buy_later: { bg: "#ede9fe", text: "#5b21b6" },
  purchased: { bg: "#ccfbf1", text: "#115e59" },
  cancelled: { bg: "#e5e7eb", text: "#374151" },
};

const DEFAULT_STATUS_COLOR = STATUS_COLORS.pending;

type NotificationSettings = typeof DEFAULT_NOTIFICATION_SETTINGS;

function getStatusLabel(status: RequestStatus) {
  return STATUS_LABELS[status] || STATUS_LABELS.pending;
}

function getStatusColor(status: RequestStatus) {
  return STATUS_COLORS[status] || DEFAULT_STATUS_COLOR;
}

export default function HomeScreen() {
  const router = useRouter();
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
  const [showBudgetSettings, setShowBudgetSettings] = useState(false);
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
      setCategoryBudgetInputs(
        REQUEST_CATEGORIES.reduce(
          (inputs, category) => ({
            ...inputs,
            [category]: nextSettings.categoryBudgets[category]
              ? String(nextSettings.categoryBudgets[category])
              : "",
          }),
          {} as Record<string, string>
        )
      );
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
      const settings = await updateBudgetSettings({
        monthlyBudget: Number(monthlyBudgetInput || 0),
        categoryBudgets: REQUEST_CATEGORIES.reduce(
          (budgets, category) => ({
            ...budgets,
            [category]: Number(categoryBudgetInputs[category] || 0),
          }),
          {} as Record<string, number>
        ),
      });

      setBudgetSettings(settings);
      setShowBudgetSettings(false);
      toast.show("Budget settings saved", "success");
    } catch (saveError) {
      logError("Failed to save budget settings", saveError);
      toast.show("Failed to save budget settings", "error");
    } finally {
      setSavingBudget(false);
    }
  };

  const ListHeader = (
    <View style={styles.budgetPanel}>
      <View style={styles.budgetHeader}>
        <View>
          <Text style={styles.budgetEyebrow}>Current month</Text>
          <Text style={styles.budgetTitle}>Budget overview</Text>
        </View>
        <Pressable
          style={styles.settingsButton}
          onPress={() => setShowBudgetSettings((value) => !value)}
        >
          <Text style={styles.settingsButtonText}>
            {showBudgetSettings ? "Close" : "Edit"}
          </Text>
        </Pressable>
      </View>

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

      {showBudgetSettings ? (
        <View style={styles.settingsPanel}>
          <Text style={styles.inputLabel}>Monthly household budget</Text>
          <TextInput
            style={styles.budgetInput}
            value={monthlyBudgetInput}
            keyboardType="numeric"
            onChangeText={(text) =>
              setMonthlyBudgetInput(text.replace(/[^0-9]/g, ""))
            }
            placeholder="INR"
            placeholderTextColor="#71717A"
          />

          <Text style={styles.inputLabel}>Category budgets</Text>
          {REQUEST_CATEGORIES.map((category) => (
            <View key={category} style={styles.categoryInputRow}>
              <Text style={styles.categoryInputLabel}>{category}</Text>
              <TextInput
                style={styles.categoryInput}
                value={categoryBudgetInputs[category] || ""}
                keyboardType="numeric"
                onChangeText={(text) =>
                  setCategoryBudgetInputs((inputs) => ({
                    ...inputs,
                    [category]: text.replace(/[^0-9]/g, ""),
                  }))
                }
                placeholder="INR"
                placeholderTextColor="#71717A"
              />
            </View>
          ))}

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
                trackColor={{ false: "#263026", true: "#39FF14" }}
                thumbColor="#F8FAFC"
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
                    trackColor={{ false: "#263026", true: "#39FF14" }}
                    thumbColor="#F8FAFC"
                  />
                </View>
              )
            )}
          </View>
        </View>
      ) : null}

      <Text style={styles.sectionHeading}>Category summary</Text>
      {budgetSummary.categorySummaries.map((item) => (
        <View key={item.category} style={styles.summaryRow}>
          <Text style={styles.summaryCategory}>{item.category}</Text>
          <Text style={styles.summaryText}>
            {formatInr(item.approvedTotal)} approved / {formatInr(item.pendingTotal)} pending
          </Text>
          <Text style={styles.summaryText}>
            {formatInr(item.remaining)} left of {formatInr(item.budget)}
          </Text>
        </View>
      ))}

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
          const statusColor = getStatusColor(item.status);

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
                <View style={styles.titleRow}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.productName}
                  </Text>
                  <View
                    style={[
                      styles.statusChip,
                      { backgroundColor: statusColor.bg },
                    ]}
                  >
                    <Text
                      style={[styles.statusText, { color: statusColor.text }]}
                    >
                      {getStatusLabel(item.status)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.metaText} numberOfLines={1}>
                  {item.category} - {item.priority}
                </Text>
                <Text style={styles.budget}>
                  {formatInr(item.expectedPrice)} expected / {formatInr(item.maxBudget)} max
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
                    color="#2563eb"
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
                  color="#64748b"
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
    backgroundColor: "#050505",
  },
  filtersWrapper: {
    borderBottomWidth: 1,
    borderColor: "#263026",
  },
  filters: {
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: "#263026",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: "#39FF14",
    borderColor: "#39FF14",
  },
  filterText: {
    color: "#A1A1AA",
    fontSize: 13,
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#050505",
  },
  listContent: {
    padding: 12,
  },
  budgetPanel: {
    backgroundColor: "#101312",
    borderColor: "#263026",
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
    padding: 12,
  },
  budgetHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  budgetEyebrow: {
    color: "#B8FFB0",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  budgetTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 2,
  },
  settingsButton: {
    borderColor: "#39FF14",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  settingsButtonText: {
    color: "#39FF14",
    fontSize: 13,
    fontWeight: "800",
  },
  budgetStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  budgetStat: {
    backgroundColor: "#171A18",
    borderColor: "#263026",
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: "48%",
    flexGrow: 1,
    padding: 10,
  },
  statLabel: {
    color: "#A1A1AA",
    fontSize: 12,
    fontWeight: "700",
  },
  statValue: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 3,
  },
  settingsPanel: {
    borderTopColor: "#263026",
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 12,
  },
  inputLabel: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 6,
    marginTop: 8,
  },
  budgetInput: {
    backgroundColor: "#050505",
    borderColor: "#263026",
    borderRadius: 8,
    borderWidth: 1,
    color: "#F8FAFC",
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
    color: "#A1A1AA",
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  categoryInput: {
    backgroundColor: "#050505",
    borderColor: "#263026",
    borderRadius: 8,
    borderWidth: 1,
    color: "#F8FAFC",
    fontSize: 14,
    padding: 9,
    width: 120,
  },
  saveBudgetButton: {
    alignItems: "center",
    backgroundColor: "#39FF14",
    borderRadius: 8,
    marginTop: 8,
    paddingVertical: 12,
  },
  saveBudgetText: {
    color: "#050505",
    fontSize: 14,
    fontWeight: "800",
  },
  disabledButton: {
    opacity: 0.65,
  },
  sectionHeading: {
    color: "#39FF14",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 14,
    marginBottom: 8,
  },
  summaryRow: {
    borderTopColor: "#263026",
    borderTopWidth: 1,
    paddingVertical: 8,
  },
  summaryCategory: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "800",
  },
  summaryText: {
    color: "#A1A1AA",
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
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "800",
  },
  historyText: {
    color: "#A1A1AA",
    flex: 1,
    fontSize: 12,
    textAlign: "right",
  },
  historyEmpty: {
    color: "#A1A1AA",
    fontSize: 13,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#101312",
    borderColor: "#263026",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 12,
    alignItems: "center",
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
    position: "relative",
  },
  info: {
    flex: 1,
    justifyContent: "center",
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  title: {
    color: "#F8FAFC",
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
  },
  statusChip: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  metaText: {
    color: "#A1A1AA",
    fontSize: 13,
    marginTop: 5,
  },
  budget: {
    marginTop: 3,
    color: "#39FF14",
    fontSize: 13,
    fontWeight: "600",
  },
  activityText: {
    color: "#71717A",
    fontSize: 11,
    marginTop: 3,
  },
  unreadBadge: {
    alignItems: "center",
    backgroundColor: "#39FF14",
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
    color: "#050505",
    fontSize: 10,
    fontWeight: "900",
  },
  notificationPanel: {
    borderTopColor: "#263026",
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
    color: "#A1A1AA",
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
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "700",
  },
  imagePlaceholder: {
    backgroundColor: "#171A18",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 56,
  },
  emptyTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyText: {
    color: "#A1A1AA",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
});
