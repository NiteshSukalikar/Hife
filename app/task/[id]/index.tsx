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
  buildRequestBudgetImpact,
  buildRequestDecisionSummary,
} from "@/utils/requestBudgetImpact";
import {
  getPriorityChipColor,
  getPriorityLabel,
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

const PURCHASE_TIMING_LABELS: Record<string, string> = {
  today: "Needed today",
  few_days: "In a few days",
  this_month: "This month",
  no_rush: "No rush",
};

const PURCHASE_TYPE_LABELS: Record<string, string> = {
  new_purchase: "New purchase",
  replacement: "Replacement",
  upgrade: "Upgrade",
};

function getDecisionReasonHint(status: RequestStatus) {
  if (status === "declined") return "Add what would need to change.";
  if (status === "buy_later") return "Add when it should be reconsidered.";
  if (status === "needs_more_info") return "Add what information is missing.";
  return "Optional, but helpful for the household.";
}

function formatDecisionInr(amount: number) {
  if (amount < 0) return `-${formatInr(Math.abs(amount))}`;
  return formatInr(amount);
}

function toDisplayDate(value: unknown) {
  if (!value) return "";

  const maybeTimestamp = value as { toDate?: () => Date; seconds?: number };
  const date =
    typeof maybeTimestamp.toDate === "function"
      ? maybeTimestamp.toDate()
      : typeof maybeTimestamp.seconds === "number"
        ? new Date(maybeTimestamp.seconds * 1000)
        : value instanceof Date
          ? value
          : null;

  if (!date) return "";

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

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
const PREVIEW_REQUEST: PurchaseRequest = {
  id: "preview",
  title: "Quiet Air Purifier",
  productName: "Quiet Air Purifier",
  info: "Needed for better sleep and cleaner room air.",
  reason:
    "The room gets dusty quickly, and this keeps the space healthier without making noise.",
  priority: "P1",
  expectedPrice: 3500,
  maxBudget: 5000,
  budget: 5000,
  category: "Home",
  links: [{ source: "Amazon", url: "https://example.com/quiet-air-purifier" }],
  status: "purchased",
  decisionReason:
    "Approved because it improves daily comfort and stays within the monthly room budget.",
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
};

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
  const isPreview =
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("preview");

  const loadRequestContext = useCallback(async () => {
    if (isPreview) {
      setBudgetSettings(PREVIEW_BUDGET_SETTINGS);
      setLoading(false);
      return;
    }

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
  }, [isPreview, show]);

  useEffect(() => {
    if (isPreview) {
      setRequest(PREVIEW_REQUEST);
      setHouseholdRequests([PREVIEW_REQUEST]);
      setDecisionReason(PREVIEW_REQUEST.decisionReason || "");
      setLoading(false);
      return;
    }

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
  }, [isPreview, loadRequestContext, requestId, show]);

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
      router.replace({
        pathname: "/(tabs)",
        params: { filter: status },
      });
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
  const budgetBeforeRequest = useMemo(
    () =>
      buildBudgetSummary(
        request
          ? householdRequests.filter((item) => item.id !== request.id)
          : householdRequests,
        budgetSettings
      ),
    [budgetSettings, householdRequests, request]
  );
  const categorySummary = request
    ? budgetBeforeRequest.categorySummaries.find(
        (item) => item.category === request.category
      )
    : null;
  const requestAmount = request ? getRequestAmount(request) : 0;
  const budgetImpact = request
    ? buildRequestBudgetImpact({
        amount: requestAmount,
        safeToSpend: budgetBeforeRequest.safeToSpend,
        categoryBudget: categorySummary?.budget || 0,
        categoryProjectedRemaining: categorySummary?.projectedRemaining || 0,
      })
    : null;
  const decisionSummary = budgetImpact
    ? buildRequestDecisionSummary(budgetImpact)
    : null;
  const wouldReduceSafeToSpendBelowZero =
    !!request && request.status === "pending" && !!budgetImpact?.exceedsSafeToSpend;
  const wouldExceedCategoryBudget =
    !!request && request.status === "pending" && !!budgetImpact?.exceedsCategoryBudget;
  const wouldConsumeTooMuchCategory =
    !!request &&
    request.status === "pending" &&
    !!budgetImpact?.consumesLargeCategoryShare;
  const decisionReasonHint = request
    ? getDecisionReasonHint(request.status)
    : "";
  const decisionDate = request
    ? toDisplayDate(request.decisionAt || request.lastActivityAt)
    : "";

  return (
    <>
      <Stack.Screen
        options={{
          title: request?.productName || "Request details",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#0F0F10" },
          headerTintColor: "#F7F2EB",
          headerTitleStyle: {
            color: "#F7F2EB",
            fontFamily: "serif",
            fontWeight: "800",
          },
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
              <View style={styles.imagePlaceholder}>
                <View style={styles.imagePlaceholderMark}>
                  <Text style={styles.imagePlaceholderMarkText}>H</Text>
                </View>
                <View style={styles.imagePlaceholderCopy}>
                  <Text style={styles.imagePlaceholderText}>
                    No product image
                  </Text>
                  <Text style={styles.imagePlaceholderSubtext}>
                    Decision can still be made from the price, reason, and links.
                  </Text>
                </View>
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
                    {getPriorityLabel(request.priority)}
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
                <Text style={styles.metaValue}>
                  {getPriorityLabel(request.priority)}
                </Text>
                <Text style={styles.metaHint}>
                  {PRIORITY_EXPLANATIONS[request.priority]}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Expected</Text>
                <Text style={styles.metaValue}>{formatInr(requestAmount)}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Max budget</Text>
                <Text style={styles.metaValue}>{formatInr(request.maxBudget)}</Text>
              </View>
              {request.purchaseTiming ? (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Timing</Text>
                  <Text style={styles.metaValue}>
                    {PURCHASE_TIMING_LABELS[request.purchaseTiming] ||
                      "Timing not set"}
                  </Text>
                </View>
              ) : null}
              {request.purchaseType ? (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Type</Text>
                  <Text style={styles.metaValue}>
                    {PURCHASE_TYPE_LABELS[request.purchaseType] ||
                      "Purchase type not set"}
                  </Text>
                </View>
              ) : null}
            </View>

            {decisionSummary && budgetImpact ? (
              <View
                style={[
                  styles.summaryCard,
                  decisionSummary.state === "safe"
                    ? styles.summarySafe
                    : decisionSummary.state === "risky"
                      ? styles.summaryRisky
                      : styles.summaryOverBudget,
                ]}
              >
                <Text style={styles.summaryEyebrow}>Decision summary</Text>
                <Text style={styles.summaryTitle}>{decisionSummary.title}</Text>
                <Text style={styles.summaryText}>{decisionSummary.message}</Text>
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Money decision</Text>
              <View style={styles.impactGrid}>
                <View style={styles.impactCard}>
                  <Text style={styles.impactLabel}>Safe-to-spend before</Text>
                  <Text style={styles.impactValue}>
                    {formatInr(budgetImpact?.safeToSpendNow || 0)}
                  </Text>
                </View>
                <View style={styles.impactCard}>
                  <Text style={styles.impactLabel}>Request amount</Text>
                  <Text style={styles.impactValue}>{formatInr(requestAmount)}</Text>
                </View>
                <View style={styles.impactCard}>
                  <Text style={styles.impactLabel}>After approval</Text>
                  <Text
                    style={[
                      styles.impactValue,
                      wouldReduceSafeToSpendBelowZero
                        ? styles.impactValueWarning
                        : null,
                    ]}
                  >
                    {formatDecisionInr(
                      budgetImpact?.safeToSpendAfterRequest || 0
                    )}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.section,
                styles.budgetImpact,
                wouldReduceSafeToSpendBelowZero ||
                wouldExceedCategoryBudget ||
                wouldConsumeTooMuchCategory
                  ? styles.budgetImpactWarning
                  : null,
              ]}
            >
              <Text style={[styles.sectionTitle, styles.darkSectionTitle]}>
                Category impact
              </Text>
              <Text style={styles.budgetImpactText}>
                Household approved this month:{" "}
                {formatInr(budgetSummary.approvedTotal)}
              </Text>
              <Text style={styles.budgetImpactText}>
                Household pending this month: {formatInr(budgetSummary.pendingTotal)}
              </Text>
              <Text style={styles.budgetImpactText}>
                Decision budget: {formatInr(budgetBeforeRequest.decisionBudget)}
              </Text>
              {categorySummary ? (
                <>
                  <Text style={styles.budgetImpactText}>
                    {request.category} before request:{" "}
                    {formatInr(budgetImpact?.categoryProjectedRemaining || 0)}
                  </Text>
                  <Text style={styles.budgetImpactText}>
                    {request.category} after approval:{" "}
                    {formatDecisionInr(
                      budgetImpact?.categoryRemainingAfterRequest || 0
                    )} of{" "}
                    {formatInr(categorySummary.budget)}
                  </Text>
                </>
              ) : null}
              {wouldReduceSafeToSpendBelowZero ? (
                <Text style={styles.warningText}>
                  Approval would take safe-to-spend below zero.
                </Text>
              ) : null}
              {wouldExceedCategoryBudget ? (
                <Text style={styles.warningText}>
                  Approval would exceed the remaining {request.category} budget.
                </Text>
              ) : null}
              {!wouldExceedCategoryBudget && wouldConsumeTooMuchCategory ? (
                <Text style={styles.warningText}>
                  This uses a large share of the {request.category} category.
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
              <Text style={styles.reasonHint}>{decisionReasonHint}</Text>
              <TextInput
                style={[styles.input, styles.reasonInput]}
                value={decisionReason}
                onChangeText={setDecisionReason}
                placeholder="Add a short reason for this decision"
                placeholderTextColor="#8F867A"
                multiline
                maxLength={300}
              />
            </View>

            <View style={styles.actionPanel}>
              <Text style={styles.actionPanelTitle}>Choose a decision</Text>
              <Text style={styles.actionPanelHint}>
                Decline, buy later, and needs info require a short reason.
              </Text>
              <Pressable
                style={[styles.actionButton, styles.primaryDecisionButton]}
                disabled={!!savingStatus}
                onPress={() => confirmStatusChange("approved")}
              >
                <Text style={styles.actionText}>
                  {savingStatus === "approved" ? "Saving..." : "Approve"}
                </Text>
                <Text style={styles.actionHint}>Safe to buy now</Text>
              </Pressable>

              <View style={styles.secondaryDecisionGrid}>
                <Pressable
                  style={[styles.actionButton, styles.secondaryButton]}
                  disabled={!!savingStatus}
                  onPress={() => confirmStatusChange("buy_later")}
                >
                  <Text style={styles.secondaryActionText}>
                    {savingStatus === "buy_later" ? "Saving..." : "Buy later"}
                  </Text>
                  <Text style={styles.secondaryActionHint}>Revisit timing</Text>
                </Pressable>

                <Pressable
                  style={[styles.actionButton, styles.secondaryButton]}
                  disabled={!!savingStatus}
                  onPress={() => confirmStatusChange("needs_more_info")}
                >
                  <Text style={styles.secondaryActionText}>
                    {savingStatus === "needs_more_info" ? "Saving..." : "Needs info"}
                  </Text>
                  <Text style={styles.secondaryActionHint}>Ask before deciding</Text>
                </Pressable>

                <Pressable
                  style={[styles.actionButton, styles.declineButton]}
                  disabled={!!savingStatus}
                  onPress={() => confirmStatusChange("declined")}
                >
                  <Text style={styles.declineActionText}>
                    {savingStatus === "declined" ? "Saving..." : "Decline"}
                  </Text>
                  <Text style={styles.declineActionHint}>Not a fit now</Text>
                </Pressable>
              </View>
            </View>

            {(request.decisionReason || request.decisionBy || decisionDate) ? (
              <View style={styles.historyCard}>
                <Text style={styles.historyLabel}>Decision history</Text>
                <Text style={styles.historyText}>
                  {getStatusLabel(request.status)}
                  {decisionDate ? ` on ${decisionDate}` : ""}
                  {request.decisionBy ? " by a household member" : ""}
                </Text>
                {request.decisionReason ? (
                  <Text style={styles.historyReason}>
                    {request.decisionReason}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <View style={styles.footerActions}>
              {request.status === "purchased" ? (
                <View style={styles.purchasedState}>
                  <Text style={styles.purchasedStateTitle}>Purchase recorded</Text>
                  <Text style={styles.purchasedStateText}>
                    This item is counted as approved household spend for the month.
                  </Text>
                </View>
              ) : null}

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
                style={styles.commentButton}
                onPress={() =>
                  router.push({
                    pathname: "/task/[id]/comments",
                    params: { id: request.id, title: request.productName },
                  })
                }
              >
                <Text style={styles.commentText}>
                  Discuss{request.commentCount ? ` (${request.commentCount})` : ""}
                </Text>
              </Pressable>

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
      {request ? (
        <View style={styles.stickyDecisionBar}>
          <Pressable
            style={styles.stickySecondary}
            onPress={() =>
              router.push({
                pathname: "/task/[id]/comments",
                params: { id: request.id, title: request.productName },
              })
            }
          >
            <Text style={styles.stickySecondaryText}>Discuss</Text>
          </Pressable>
          {request.status === "pending" ? (
            <Pressable
              style={styles.stickyPrimary}
              disabled={!!savingStatus}
              onPress={() => confirmStatusChange("approved")}
            >
              <Text style={styles.stickyPrimaryText}>
                {savingStatus === "approved" ? "Saving..." : "Approve"}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.stickyStatus}>
              <Text style={styles.stickyStatusText}>
                {getStatusLabel(request.status)}
              </Text>
            </View>
          )}
        </View>
      ) : null}
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F2EB",
  },
  container: {
    backgroundColor: "#F7F2EB",
    flexGrow: 1,
    padding: 20,
    paddingBottom: 120,
  },
  centerState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingVertical: 80,
  },
  centerTitle: {
    color: "#1C1510",
    fontSize: 18,
    fontWeight: "700",
  },
  centerText: {
    color: "#776E64",
    marginTop: 8,
    textAlign: "center",
  },
  image: {
    width: "100%",
    height: 250,
    borderRadius: 18,
    marginBottom: 20,
  },
  imagePlaceholder: {
    alignItems: "center",
    backgroundColor: "#EFEAE1",
    borderColor: "#DDCDBB",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 112,
    marginBottom: 20,
    padding: 16,
  },
  imagePlaceholderMark: {
    alignItems: "center",
    backgroundColor: "#FFFBF5",
    borderColor: "#DDCDBB",
    borderRadius: 14,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  imagePlaceholderMarkText: {
    color: "#A05232",
    fontFamily: "serif",
    fontSize: 24,
    fontWeight: "900",
  },
  imagePlaceholderCopy: {
    flex: 1,
  },
  imagePlaceholderText: {
    color: "#1C1510",
    fontSize: 15,
    fontWeight: "900",
  },
  imagePlaceholderSubtext: {
    color: "#776E64",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "column",
    gap: 12,
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
  },
  headerChips: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  title: {
    color: "#1C1510",
    fontFamily: "serif",
    fontSize: 34,
    fontWeight: "800",
  },
  category: {
    color: "#776E64",
    fontSize: 17,
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
    color: "#A05232",
    fontFamily: "serif",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  darkSectionTitle: {
    color: "#C8A15A",
  },
  bodyText: {
    color: "#1C1510",
    fontSize: 17,
    lineHeight: 25,
  },
  creatorText: {
    color: "#776E64",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  mutedText: {
    color: "#776E64",
    fontSize: 14,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 18,
  },
  metaItem: {
    backgroundColor: "#FFFBF5",
    borderColor: "#DDCDBB",
    borderRadius: 16,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 0,
    minWidth: 104,
    padding: 12,
    shadowColor: "#6A3D27",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  metaLabel: {
    color: "#776E64",
    fontSize: 13,
    fontWeight: "700",
  },
  metaValue: {
    color: "#1C1510",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 4,
  },
  metaHint: {
    color: "#776E64",
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 18,
    padding: 16,
  },
  summarySafe: {
    backgroundColor: "#E9F1E4",
    borderColor: "#7A8C6E",
  },
  summaryRisky: {
    backgroundColor: "#FFF6D9",
    borderColor: "#C4943A",
  },
  summaryOverBudget: {
    backgroundColor: "#FBEDE8",
    borderColor: "#A85C44",
  },
  summaryEyebrow: {
    color: "#776E64",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  summaryTitle: {
    color: "#1C1510",
    fontFamily: "serif",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 4,
  },
  summaryText: {
    color: "#40362E",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  impactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  impactCard: {
    backgroundColor: "#FFFBF5",
    borderColor: "#DDCDBB",
    borderRadius: 14,
    borderWidth: 1,
    flexBasis: "31%",
    flexGrow: 1,
    minWidth: 104,
    padding: 12,
  },
  impactLabel: {
    color: "#776E64",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
  },
  impactValue: {
    color: "#1C1510",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 6,
  },
  impactValueWarning: {
    color: "#A85C44",
  },
  budgetImpact: {
    backgroundColor: "#171310",
    borderColor: "rgba(200, 161, 90, 0.26)",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  budgetImpactWarning: {
    borderColor: "#C4943A",
  },
  budgetImpactText: {
    color: "rgba(237, 228, 214, 0.78)",
    fontSize: 15,
    lineHeight: 24,
  },
  warningText: {
    color: "#C8A15A",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 6,
  },
  linkRow: {
    minHeight: 48,
    backgroundColor: "#FFFBF5",
    borderColor: "#DDCDBB",
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8,
    padding: 10,
  },
  linkSource: {
    color: "#A05232",
    fontSize: 13,
    fontWeight: "800",
  },
  linkUrl: {
    color: "#6F7F6A",
    fontSize: 13,
    marginTop: 3,
  },
  input: {
    backgroundColor: "#FFFBF5",
    borderWidth: 1,
    borderColor: "#DDCDBB",
    borderRadius: 12,
    color: "#1C1510",
    padding: 14,
    fontSize: 16,
  },
  reasonInput: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  reasonHint: {
    color: "#776E64",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  actionPanel: {
    backgroundColor: "#FFFBF5",
    borderColor: "#DDCDBB",
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  actionPanelTitle: {
    color: "#1C1510",
    fontSize: 15,
    fontWeight: "900",
  },
  actionPanelHint: {
    color: "#776E64",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: -4,
  },
  secondaryDecisionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  actionButton: {
    alignItems: "center",
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 64,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  primaryDecisionButton: {
    backgroundColor: "#6F7F6A",
    minHeight: 68,
  },
  approveButton: {
    backgroundColor: "#6F7F6A",
  },
  declineButton: {
    backgroundColor: "#FBEDE8",
    borderColor: "#A85C44",
    borderWidth: 1,
    flexBasis: "100%",
    flexGrow: 1,
  },
  secondaryButton: {
    backgroundColor: "#F7F2EB",
    borderColor: "#DDCDBB",
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
  },
  actionText: {
    color: "#FFF9F0",
    fontSize: 16,
    fontWeight: "900",
  },
  actionHint: {
    color: "rgba(255, 249, 240, 0.78)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  declineActionText: {
    color: "#873926",
    fontSize: 15,
    fontWeight: "900",
  },
  declineActionHint: {
    color: "#A85C44",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  secondaryActionText: {
    color: "#1C1510",
    fontSize: 15,
    fontWeight: "900",
  },
  secondaryActionHint: {
    color: "#776E64",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  historyCard: {
    backgroundColor: "#EFEAE1",
    borderColor: "#DDCDBB",
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 14,
    padding: 14,
  },
  historyLabel: {
    color: "#776E64",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  historyText: {
    color: "#1C1510",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 5,
  },
  historyReason: {
    color: "#40362E",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  footerActions: {
    gap: 10,
    marginTop: 14,
  },
  purchaseButton: {
    alignItems: "center",
    backgroundColor: "#B66A3C",
    borderRadius: 14,
    justifyContent: "center",
    minHeight: 48,
    paddingVertical: 12,
  },
  purchaseText: {
    color: "#FFF9F0",
    fontSize: 15,
    fontWeight: "800",
  },
  purchasedState: {
    backgroundColor: "#E5F4EA",
    borderColor: "#5F9077",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  purchasedStateTitle: {
    color: "#3D6C57",
    fontSize: 15,
    fontWeight: "900",
  },
  purchasedStateText: {
    color: "#4F6848",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  commentButton: {
    alignItems: "center",
    backgroundColor: "#FFFBF5",
    borderColor: "#DDCDBB",
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingVertical: 12,
  },
  commentText: {
    color: "#1C1510",
    fontSize: 15,
    fontWeight: "800",
  },
  cancelButton: {
    alignItems: "center",
    backgroundColor: "#FFFBF5",
    borderColor: "#fecaca",
    borderRadius: 14,
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
    color: "#776E64",
    fontSize: 15,
    fontWeight: "700",
  },
  stickyDecisionBar: {
    alignItems: "center",
    backgroundColor: "#171310",
    borderColor: "rgba(200, 161, 90, 0.24)",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  stickySecondary: {
    alignItems: "center",
    borderColor: "rgba(237, 228, 214, 0.22)",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 52,
  },
  stickySecondaryText: {
    color: "#EDE4D6",
    fontSize: 15,
    fontWeight: "900",
  },
  stickyPrimary: {
    alignItems: "center",
    backgroundColor: "#6F7F6A",
    borderRadius: 14,
    flex: 1,
    justifyContent: "center",
    minHeight: 52,
  },
  stickyPrimaryText: {
    color: "#FFF9F0",
    fontSize: 15,
    fontWeight: "900",
  },
  stickyStatus: {
    alignItems: "center",
    backgroundColor: "rgba(111, 127, 106, 0.18)",
    borderColor: "#6F7F6A",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 52,
  },
  stickyStatusText: {
    color: "#DDE8D8",
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
  },
});
