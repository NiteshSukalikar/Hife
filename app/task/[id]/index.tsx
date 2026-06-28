import {
  subscribeToPurchaseRequest,
  subscribeToPurchaseRequests,
  updatePurchaseRequestStatus,
} from "@/services/purchaseRequests";
import useToast from "@/components/toast/useToast";
import {
  BudgetSettings,
  ProductLink,
  PurchaseRequest,
  RequestStatus,
} from "@/constants/types";
import { getBudgetSettings } from "@/services/budgets";
import {
  buildBudgetSummary,
  DEFAULT_BUDGET_SETTINGS,
  formatInr,
  getRequestAmount,
  PRIORITY_EXPLANATIONS,
} from "@/utils/budget";
import {
  getPriorityChipColor,
  getStatusChipColor,
  getStatusLabel,
  STATUS_LABELS,
} from "@/utils/requestPresentation";
import { logError } from "@/utils/safeLogger";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

function canMarkPurchased(status: RequestStatus) {
  return status === "approved";
}

export default function RequestDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { show } = useToast();

  const [request, setRequest] = useState<PurchaseRequest | null>(null);
  const [householdRequests, setHouseholdRequests] = useState<PurchaseRequest[]>([]);
  const [budgetSettings, setBudgetSettings] = useState<BudgetSettings>(
    DEFAULT_BUDGET_SETTINGS
  );
  const [decisionReason, setDecisionReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState<RequestStatus | null>(null);

  const requestId = id as string;

  const loadRequestContext = useCallback(async () => {
    try {
      setLoading(true);
      const [settings] = await Promise.all([
        getBudgetSettings(),
      ]);
      setBudgetSettings(settings);
    } catch (error) {
      logError("Failed to load request", error);
      show("Failed to load request", "error");
    } finally {
      setLoading(false);
    }
  }, [show]);

  useEffect(() => {
    let requestUnsubscribe: undefined | (() => void);
    let listUnsubscribe: undefined | (() => void);
    let cancelled = false;

    loadRequestContext();

    subscribeToPurchaseRequest(
      requestId,
      (data: PurchaseRequest | null) => {
        setRequest(data);
        setDecisionReason(data?.decisionReason || "");
        setLoading(false);
      },
      (error: unknown) => {
        logError("Failed to listen for request updates", error);
        show("Failed to listen for request updates", "error");
        setLoading(false);
      }
    ).then((stop) => {
      if (cancelled) {
        stop();
      } else {
        requestUnsubscribe = stop;
      }
    });

    subscribeToPurchaseRequests(
      (data: PurchaseRequest[]) => setHouseholdRequests(data),
      (error: unknown) => {
        logError("Failed to listen for request list", error);
      }
    ).then((stop) => {
      if (cancelled) {
        stop();
      } else {
        listUnsubscribe = stop;
      }
    });

    return () => {
      cancelled = true;
      requestUnsubscribe?.();
      listUnsubscribe?.();
    };
  }, [loadRequestContext, requestId, show]);

  const handleStatusChange = async (status: RequestStatus) => {
    if (!request) return;

    if (
      ["declined", "needs_more_info", "buy_later"].includes(status) &&
      !decisionReason.trim()
    ) {
      show("Add a decision reason first", "error");
      return;
    }

    try {
      setSavingStatus(status);
      await updatePurchaseRequestStatus(request.id, status, decisionReason);
      show(`Request marked ${STATUS_LABELS[status].toLowerCase()}`, "success");
    } catch (error) {
      logError("Failed to update request", error);
      show("Failed to update request", "error");
    } finally {
      setSavingStatus(null);
    }
  };

  const confirmStatusChange = (status: RequestStatus) => {
    if (!request) return;

    if (!["declined", "cancelled"].includes(status)) {
      handleStatusChange(status);
      return;
    }

    const label = STATUS_LABELS[status].toLowerCase();
    Alert.alert(
      `${STATUS_LABELS[status]} request?`,
      `This will mark "${request.productName}" as ${label}.`,
      [
        { text: "Keep reviewing", style: "cancel" },
        {
          text: STATUS_LABELS[status],
          style: "destructive",
          onPress: () => handleStatusChange(status),
        },
      ]
    );
  };

  const openLink = async (link: ProductLink) => {
    const canOpen = await Linking.canOpenURL(link.url);

    if (!canOpen) {
      show("Could not open this link", "error");
      return;
    }

    Linking.openURL(link.url);
  };

  const statusColor = request ? getStatusChipColor(request.status) : null;
  const priorityColor = request ? getPriorityChipColor(request.priority) : null;
  const budgetSummary = useMemo(
    () => buildBudgetSummary(householdRequests, budgetSettings),
    [budgetSettings, householdRequests]
  );
  const categorySummary = request
    ? budgetSummary.categorySummaries.find(
        (item) => item.category === request.category
      )
    : null;
  const requestAmount = request ? getRequestAmount(request) : 0;
  const remainingAfterApproval = Math.max(
    0,
    budgetSummary.remainingBudget -
      (request?.status === "pending" ? requestAmount : 0)
  );
  const wouldExceedMonthlyBudget =
    !!request &&
    budgetSummary.monthlyBudget > 0 &&
    request.status === "pending" &&
    requestAmount > budgetSummary.remainingBudget;
  const wouldExceedCategoryBudget =
    !!request &&
    !!categorySummary?.budget &&
    request.status === "pending" &&
    requestAmount > categorySummary.remaining;

  return (
    <>
      <Stack.Screen
        options={{
          title: request?.productName || "Request details",
          headerTitleAlign: "center",
        }}
      />

      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 60}
      >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {loading && !request ? (
          <View style={styles.centerState}>
            <Text style={styles.centerText}>Loading request...</Text>
          </View>
        ) : null}

        {!loading && !request ? (
          <View style={styles.centerState}>
            <Text style={styles.centerTitle}>Request unavailable</Text>
            <Text style={styles.centerText}>
              Go back and try opening the request again.
            </Text>
          </View>
        ) : null}

        {request ? (
          <>
            {request.image ? (
              <Image source={{ uri: request.image }} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]}>
                <Text style={styles.imagePlaceholderText}>No image added</Text>
              </View>
            )}

            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text style={styles.title}>{request.productName}</Text>
                <Text style={styles.category}>{request.category}</Text>
              </View>
              <View style={styles.headerChips}>
              {priorityColor ? (
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
                    {request.priority}
                  </Text>
                </View>
              ) : null}
              {statusColor ? (
                <View
                  style={[
                    styles.statusChip,
                    { backgroundColor: statusColor.bg },
                    { borderColor: statusColor.border },
                  ]}
                >
                  <Text style={[styles.statusText, { color: statusColor.text }]}>
                    {getStatusLabel(request.status)}
                  </Text>
                </View>
              ) : null}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Decision context</Text>
              {request.createdByDisplayName || request.createdByRoleLabel ? (
                <Text style={styles.creatorText}>
                  Requested by{" "}
                  {request.createdByDisplayName || request.createdByRoleLabel}
                  {request.createdByRoleLabel
                    ? ` (${request.createdByRoleLabel})`
                    : ""}
                </Text>
              ) : null}
              <Text style={styles.bodyText}>{request.reason || "No reason added."}</Text>
            </View>

            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Priority</Text>
                <Text style={styles.metaValue}>{request.priority}</Text>
                <Text style={styles.metaHint}>
                  {PRIORITY_EXPLANATIONS[request.priority]}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Expected</Text>
                <Text style={styles.metaValue}>INR {request.expectedPrice}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Max budget</Text>
                <Text style={styles.metaValue}>INR {request.maxBudget}</Text>
              </View>
            </View>

            <View
              style={[
                styles.section,
                styles.budgetImpact,
                wouldExceedMonthlyBudget || wouldExceedCategoryBudget
                  ? styles.budgetImpactWarning
                  : null,
              ]}
            >
              <Text style={styles.sectionTitle}>Budget impact</Text>
              <Text style={styles.budgetImpactText}>
                Current approved this month:{" "}
                {formatInr(budgetSummary.approvedTotal)}
              </Text>
              <Text style={styles.budgetImpactText}>
                Current pending this month: {formatInr(budgetSummary.pendingTotal)}
              </Text>
              <Text style={styles.budgetImpactText}>
                Monthly remaining now: {formatInr(budgetSummary.remainingBudget)}
              </Text>
              <Text style={styles.budgetImpactText}>
                Remaining after approval: {formatInr(remainingAfterApproval)}
              </Text>
              {categorySummary ? (
                <Text style={styles.budgetImpactText}>
                  {request.category} remaining:{" "}
                  {formatInr(categorySummary.remaining)} of{" "}
                  {formatInr(categorySummary.budget)}
                </Text>
              ) : null}
              {wouldExceedMonthlyBudget ? (
                <Text style={styles.warningText}>
                  Approval would exceed the available monthly budget.
                </Text>
              ) : null}
              {wouldExceedCategoryBudget ? (
                <Text style={styles.warningText}>
                  Approval would exceed the remaining {request.category} budget.
                </Text>
              ) : null}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Product links</Text>
              {request.links.length === 0 ? (
                <Text style={styles.mutedText}>No product links added.</Text>
              ) : (
                request.links.map((link, index) => (
                  <Pressable
                    key={`${link.url}-${index}`}
                    style={styles.linkRow}
                    onPress={() => openLink(link)}
                  >
                    <Text style={styles.linkSource}>{link.source}</Text>
                    <Text style={styles.linkUrl} numberOfLines={1}>
                      {link.url}
                    </Text>
                  </Pressable>
                ))
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Decision reason</Text>
              <TextInput
                style={[styles.input, styles.reasonInput]}
                value={decisionReason}
                onChangeText={setDecisionReason}
                placeholder="Add why this is approved, declined, postponed, or needs more info"
                placeholderTextColor="#71717A"
                multiline
                maxLength={300}
              />
            </View>

            <View style={styles.actionGrid}>
              <Pressable
                style={[styles.actionButton, styles.approveButton]}
                disabled={!!savingStatus}
                onPress={() => confirmStatusChange("approved")}
              >
                <Text style={styles.actionText}>
                  {savingStatus === "approved" ? "Saving..." : "Approve"}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.actionButton, styles.declineButton]}
                disabled={!!savingStatus}
                onPress={() => confirmStatusChange("declined")}
              >
                <Text style={styles.declineActionText}>
                  {savingStatus === "declined" ? "Saving..." : "Decline"}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.actionButton, styles.secondaryButton]}
                disabled={!!savingStatus}
                onPress={() => confirmStatusChange("buy_later")}
              >
                <Text style={styles.secondaryActionText}>
                  {savingStatus === "buy_later" ? "Saving..." : "Buy Later"}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.actionButton, styles.secondaryButton]}
                disabled={!!savingStatus}
                onPress={() => confirmStatusChange("needs_more_info")}
              >
                <Text style={styles.secondaryActionText}>
                  {savingStatus === "needs_more_info" ? "Saving..." : "Need Info"}
                </Text>
              </Pressable>
            </View>

            <View style={styles.footerActions}>
              {canMarkPurchased(request.status) ? (
                <Pressable
                  style={styles.purchaseButton}
                  disabled={!!savingStatus}
                  onPress={() => confirmStatusChange("purchased")}
                >
                  <Text style={styles.purchaseText}>
                    {savingStatus === "purchased"
                      ? "Saving..."
                      : "Mark as Purchased"}
                  </Text>
                </Pressable>
              ) : null}

              <Pressable
                style={styles.cancelButton}
                disabled={!!savingStatus}
                onPress={() => confirmStatusChange("cancelled")}
              >
                <Text style={styles.cancelText}>
                  {savingStatus === "cancelled" ? "Saving..." : "Cancel Request"}
                </Text>
              </Pressable>

              <Pressable style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backText}>Back</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#050505",
  },
  container: {
    backgroundColor: "#050505",
    flexGrow: 1,
    padding: 16,
  },
  centerState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingVertical: 80,
  },
  centerTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "700",
  },
  centerText: {
    color: "#A1A1AA",
    marginTop: 8,
    textAlign: "center",
  },
  image: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginBottom: 16,
  },
  imagePlaceholder: {
    alignItems: "center",
    backgroundColor: "#101312",
    borderColor: "#263026",
    borderWidth: 1,
    justifyContent: "center",
  },
  imagePlaceholderText: {
    color: "#A1A1AA",
    fontSize: 14,
    fontWeight: "600",
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
  },
  headerChips: {
    alignItems: "flex-end",
    gap: 6,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 24,
    fontWeight: "800",
  },
  category: {
    color: "#A1A1AA",
    fontSize: 14,
    marginTop: 3,
  },
  statusChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  priorityChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "900",
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    color: "#39FF14",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 8,
  },
  bodyText: {
    color: "#F8FAFC",
    fontSize: 15,
    lineHeight: 22,
  },
  creatorText: {
    color: "#A1A1AA",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  mutedText: {
    color: "#A1A1AA",
    fontSize: 14,
  },
  metaGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  metaItem: {
    backgroundColor: "#101312",
    borderColor: "#263026",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    padding: 10,
  },
  metaLabel: {
    color: "#A1A1AA",
    fontSize: 12,
    fontWeight: "700",
  },
  metaValue: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
  metaHint: {
    color: "#A1A1AA",
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  budgetImpact: {
    backgroundColor: "#101312",
    borderColor: "#263026",
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  budgetImpactWarning: {
    borderColor: "#f59e0b",
  },
  budgetImpactText: {
    color: "#F8FAFC",
    fontSize: 14,
    lineHeight: 21,
  },
  warningText: {
    color: "#FBBF24",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 6,
  },
  linkRow: {
    minHeight: 48,
    backgroundColor: "#101312",
    borderColor: "#263026",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
    padding: 10,
  },
  linkSource: {
    color: "#39FF14",
    fontSize: 13,
    fontWeight: "800",
  },
  linkUrl: {
    color: "#B8FFB0",
    fontSize: 13,
    marginTop: 3,
  },
  input: {
    backgroundColor: "#101312",
    borderWidth: 1,
    borderColor: "#263026",
    borderRadius: 8,
    color: "#F8FAFC",
    padding: 10,
    fontSize: 14,
  },
  reasonInput: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  actionButton: {
    alignItems: "center",
    borderRadius: 8,
    flexBasis: "48%",
    flexGrow: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingVertical: 12,
  },
  approveButton: {
    backgroundColor: "#39FF14",
  },
  declineButton: {
    backgroundColor: "#dc2626",
  },
  secondaryButton: {
    backgroundColor: "#101312",
    borderColor: "#263026",
    borderWidth: 1,
  },
  actionText: {
    color: "#050505",
    fontSize: 15,
    fontWeight: "800",
  },
  declineActionText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryActionText: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "800",
  },
  footerActions: {
    gap: 10,
    marginTop: 14,
  },
  purchaseButton: {
    alignItems: "center",
    backgroundColor: "#39FF14",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 48,
    paddingVertical: 12,
  },
  purchaseText: {
    color: "#050505",
    fontSize: 15,
    fontWeight: "800",
  },
  cancelButton: {
    alignItems: "center",
    backgroundColor: "#101312",
    borderColor: "#fecaca",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingVertical: 12,
  },
  cancelText: {
    color: "#b91c1c",
    fontSize: 15,
    fontWeight: "800",
  },
  backButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingVertical: 12,
  },
  backText: {
    color: "#A1A1AA",
    fontSize: 15,
    fontWeight: "700",
  },
});
