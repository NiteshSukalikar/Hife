import Header from "@/components/header";
import { BudgetSettings, PurchaseRequest } from "@/constants/types";
import { useHifeTheme } from "@/hooks/use-hife-theme";
import { getBudgetSettings } from "@/services/budgets";
import {
  getPurchaseRequests,
  subscribeToPurchaseRequests,
} from "@/services/purchaseRequests";
import {
  buildBudgetSummary,
  DEFAULT_BUDGET_SETTINGS,
  formatInr,
} from "@/utils/budget";
import { logError } from "@/utils/safeLogger";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

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
    reason: "The room gets dusty quickly and this keeps the space healthier.",
    priority: "P1",
    expectedPrice: 3500,
    maxBudget: 5000,
    budget: 5000,
    category: "Home",
    links: [],
    status: "approved",
    householdId: "preview-household",
    createdAt: previewTimestamp,
    updatedAt: previewTimestamp,
    lastActivityAt: previewTimestamp,
  },
];

const HEALTH_COPY = {
  safe: {
    label: "Safe",
    message: "Pending requests still fit inside this month's budget.",
    color: "#6F7F6A",
  },
  tight: {
    label: "Tight",
    message: "There is little room left after pending decisions.",
    color: "#C4943A",
  },
  over_budget: {
    label: "Over budget",
    message: "Pending and approved spend are above the monthly budget.",
    color: "#A85C44",
  },
  needs_review: {
    label: "Needs review",
    message: "Set a monthly budget before relying on safe-to-spend.",
    color: "#8F867A",
  },
} as const;

function clampProgress(value: number) {
  return `${Math.max(0, Math.min(1, value)) * 100}%` as `${number}%`;
}

function formatCount(value: number, singular: string, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function formatSafeToSpend(amount: number) {
  return amount < 0 ? `Over by ${formatInr(Math.abs(amount))}` : formatInr(amount);
}

function formatMonthComparison(difference: number) {
  if (difference === 0) return "Same as the previous active month";
  return difference > 0
    ? `${formatInr(difference)} more than previous active month`
    : `${formatInr(Math.abs(difference))} less than previous active month`;
}

export default function AnalyticsScreen() {
  const { palette } = useHifeTheme();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [budgetSettings, setBudgetSettings] = useState<BudgetSettings>(
    DEFAULT_BUDGET_SETTINGS
  );
  const [showDetails, setShowDetails] = useState(true);
  const isPreview =
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("preview");

  const loadAnalytics = useCallback(async () => {
    if (isPreview) {
      setRequests(PREVIEW_REQUESTS);
      setBudgetSettings(PREVIEW_BUDGET_SETTINGS);
      return;
    }

    try {
      const [nextRequests, nextSettings] = await Promise.all([
        getPurchaseRequests(),
        getBudgetSettings(),
      ]);
      setRequests(nextRequests);
      setBudgetSettings(nextSettings);
    } catch (error) {
      logError("Failed to load analytics", error);
    }
  }, [isPreview]);

  useFocusEffect(
    useCallback(() => {
      loadAnalytics();
      if (isPreview) return undefined;

      let unsubscribe: undefined | (() => void);
      let cancelled = false;
      subscribeToPurchaseRequests(
        (data: PurchaseRequest[]) => setRequests(data),
        (error: unknown) => logError("Analytics listener failed", error)
      ).then((stop) => {
        if (cancelled) stop();
        else unsubscribe = stop;
      });

      return () => {
        cancelled = true;
        unsubscribe?.();
      };
    }, [isPreview, loadAnalytics])
  );

  const budgetSummary = useMemo(
    () => buildBudgetSummary(requests, budgetSettings),
    [budgetSettings, requests]
  );
  const healthCopy = HEALTH_COPY[budgetSummary.budgetHealth];
  const topCategorySummaries = [...budgetSummary.categorySummaries]
    .sort(
      (a, b) =>
        b.approvedTotal + b.pendingTotal - (a.approvedTotal + a.pendingTotal)
    )
    .slice(0, 3);

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <Header />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.intro}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>
            Analytics
          </Text>
          <Text style={[styles.title, { color: palette.chromeText }]}>
            Budget signal
          </Text>
          <Text style={[styles.subtitle, { color: palette.chromeMutedText }]}>
            A shared view of safe-to-spend, category room, and decision history.
          </Text>
        </View>

        <View
          style={[
            styles.panel,
            { backgroundColor: palette.card, borderColor: palette.border },
          ]}
        >
          <Pressable
            style={styles.panelHeader}
            onPress={() => setShowDetails((value) => !value)}
          >
            <View>
              <Text style={[styles.panelEyebrow, { color: palette.accent }]}>
                Can we safely buy?
              </Text>
              <Text style={[styles.panelTitle, { color: palette.text }]}>
                Safe to spend
              </Text>
            </View>
            <View style={styles.headerAction}>
              <Text
                style={[
                  styles.healthPill,
                  {
                    backgroundColor: palette.input,
                    borderColor: palette.border,
                    color: healthCopy.color,
                  },
                ]}
              >
                {healthCopy.label}
              </Text>
              <Ionicons
                name={showDetails ? "chevron-up" : "chevron-down"}
                size={20}
                color={palette.primary}
              />
            </View>
          </Pressable>

          <Text style={[styles.safeValue, { color: palette.text }]}>
            {formatSafeToSpend(budgetSummary.safeToSpend)}
          </Text>
          <Text style={[styles.helpText, { color: palette.mutedText }]}>
            {healthCopy.message}
          </Text>
          <View style={[styles.track, { backgroundColor: palette.input }]}>
            <View
              style={[
                styles.fill,
                { width: clampProgress(budgetSummary.spendingProgress) },
                budgetSummary.budgetHealth === "over_budget" && styles.fillWarning,
              ]}
            />
          </View>
          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: palette.mutedText }]}>
              Approved + pending{" "}
              {formatInr(budgetSummary.approvedTotal + budgetSummary.pendingTotal)}
            </Text>
            <Text style={[styles.metaText, { color: palette.mutedText }]}>
              Decision budget {formatInr(budgetSummary.decisionBudget)}
            </Text>
          </View>

          <View
            style={[
              styles.compactRow,
              { backgroundColor: palette.input, borderColor: palette.border },
            ]}
          >
            {[
              ["Approved", budgetSummary.approvedTotal],
              ["Pending", budgetSummary.pendingTotal],
              ["Remaining", budgetSummary.remainingBudget],
            ].map(([label, value], index) => (
              <View key={label} style={styles.compactItem}>
                {index > 0 ? (
                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: palette.border },
                    ]}
                  />
                ) : null}
                <Text style={[styles.statLabel, { color: palette.mutedText }]}>
                  {label}
                </Text>
                <Text style={[styles.statValue, { color: palette.text }]}>
                  {formatInr(Number(value))}
                </Text>
              </View>
            ))}
          </View>

          {topCategorySummaries.map((item) => {
            const categoryProgress =
              item.budget > 0
                ? (item.approvedTotal + item.pendingTotal) / item.budget
                : 0;

            return (
              <View key={item.category} style={styles.categoryRow}>
                <View style={styles.categoryTop}>
                  <Text style={[styles.categoryName, { color: palette.text }]}>
                    {item.category}
                  </Text>
                  <Text
                    style={[styles.categoryAmount, { color: palette.mutedText }]}
                  >
                    {formatInr(item.remaining)} left
                  </Text>
                </View>
                <View style={[styles.categoryTrack, { backgroundColor: palette.input }]}>
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

          {showDetails ? (
            <View style={styles.statsGrid}>
              {[
                ["Monthly budget", budgetSummary.monthlyBudget],
                ["Monthly income", budgetSummary.monthlyIncome],
                ["Committed expenses", budgetSummary.committedExpenses],
                ["Emergency buffer", budgetSummary.savingsReserve],
                ["Decision budget", budgetSummary.decisionBudget],
                ["Approved spend", budgetSummary.approvedTotal],
                ["Pending decisions", budgetSummary.pendingTotal],
                ["Remaining before pending", budgetSummary.remainingBudget],
              ].map(([label, value]) => (
                <View
                  key={label}
                  style={[
                    styles.statCard,
                    { backgroundColor: palette.input, borderColor: palette.border },
                  ]}
                >
                  <Text style={[styles.statLabel, { color: palette.mutedText }]}>
                    {label}
                  </Text>
                  <Text style={[styles.statValue, { color: palette.text }]}>
                    {formatInr(Number(value))}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View
          style={[
            styles.panel,
            { backgroundColor: palette.card, borderColor: palette.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: palette.primary }]}>
            Finance insights
          </Text>
          <View style={styles.decisionGrid}>
            {[
              ["Approved", budgetSummary.decisionSummary.approvedCount],
              ["Purchased", budgetSummary.decisionSummary.purchasedCount],
              ["Declined", budgetSummary.decisionSummary.declinedCount],
              ["Buy later / info", budgetSummary.decisionSummary.postponedCount],
            ].map(([label, value]) => (
              <View
                key={label}
                style={[
                  styles.decisionTile,
                  { backgroundColor: palette.input, borderColor: palette.border },
                ]}
              >
                <Text style={[styles.statLabel, { color: palette.mutedText }]}>
                  {label}
                </Text>
                <Text style={[styles.decisionValue, { color: palette.text }]}>
                  {value}
                </Text>
              </View>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: palette.primary }]}>
            Current-month category spend
          </Text>
          {budgetSummary.currentMonthCategorySpend.length === 0 ? (
            <Text style={[styles.emptyText, { color: palette.mutedText }]}>
              No approved or purchased decisions this month yet.
            </Text>
          ) : (
            budgetSummary.currentMonthCategorySpend.slice(0, 5).map((item) => (
              <View key={item.category} style={styles.summaryRow}>
                <View style={styles.insightTop}>
                  <Text style={[styles.summaryCategory, { color: palette.text }]}>
                    {item.category}
                  </Text>
                  <Text style={[styles.insightAmount, { color: palette.text }]}>
                    {formatInr(item.total)}
                  </Text>
                </View>
                <Text style={[styles.summaryText, { color: palette.mutedText }]}>
                  {formatInr(item.purchasedTotal)} purchased /{" "}
                  {formatInr(item.approvedTotal - item.purchasedTotal)} approved
                  but not purchased
                </Text>
              </View>
            ))
          )}

          <Text style={[styles.sectionTitle, { color: palette.primary }]}>
            Monthly purchase history
          </Text>
          {budgetSummary.monthlyHistory.length === 0 ? (
            <Text style={[styles.emptyText, { color: palette.mutedText }]}>
              Monthly history starts after the first purchase decision.
            </Text>
          ) : (
            budgetSummary.monthlyHistory.slice(0, 5).map((item) => (
              <View key={item.monthKey} style={styles.summaryRow}>
                <View style={styles.insightTop}>
                  <Text style={[styles.summaryCategory, { color: palette.text }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.insightAmount, { color: palette.text }]}>
                    {formatInr(item.approvedTotal)}
                  </Text>
                </View>
                <Text style={[styles.summaryText, { color: palette.mutedText }]}>
                  {formatInr(item.purchasedTotal)} purchased /{" "}
                  {formatInr(item.pendingTotal)} still pending
                </Text>
                <Text style={[styles.summaryText, { color: palette.mutedText }]}>
                  {formatCount(item.declinedCount, "decline")} /{" "}
                  {formatCount(item.postponedCount, "postponed decision")}
                </Text>
              </View>
            ))
          )}

          <Text style={[styles.sectionTitle, { color: palette.primary }]}>
            Month-over-month
          </Text>
          <Text style={[styles.summaryCategory, { color: palette.text }]}>
            {budgetSummary.monthOverMonth.previousMonthKey
              ? formatMonthComparison(budgetSummary.monthOverMonth.difference)
              : "Add another month of decisions to compare spending confidence."}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    padding: 18,
    paddingBottom: 32,
  },
  intro: {
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 6,
  },
  panel: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
  },
  panelHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  panelEyebrow: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  panelTitle: {
    fontSize: 26,
    fontWeight: "900",
    marginTop: 2,
  },
  headerAction: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  healthPill: {
    borderRadius: 999,
    borderWidth: 1,
    fontSize: 11,
    fontWeight: "900",
    paddingHorizontal: 9,
    paddingVertical: 6,
    textTransform: "uppercase",
  },
  safeValue: {
    fontSize: 34,
    fontWeight: "900",
    marginTop: 16,
  },
  helpText: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  track: {
    borderRadius: 999,
    height: 9,
    marginTop: 12,
    overflow: "hidden",
  },
  fill: {
    backgroundColor: "#7A8C6E",
    borderRadius: 999,
    height: "100%",
  },
  fillWarning: {
    backgroundColor: "#A85C44",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8,
  },
  metaText: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: "800",
  },
  compactRow: {
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 14,
    paddingVertical: 10,
  },
  compactItem: {
    flex: 1,
    paddingHorizontal: 12,
  },
  divider: {
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
    width: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 23,
    marginTop: 3,
  },
  categoryRow: {
    gap: 6,
    marginTop: 12,
  },
  categoryTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  categoryName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "900",
  },
  categoryAmount: {
    fontSize: 12,
    fontWeight: "800",
  },
  categoryTrack: {
    borderRadius: 999,
    height: 6,
    overflow: "hidden",
  },
  categoryFill: {
    backgroundColor: "#C4943A",
    borderRadius: 999,
    height: "100%",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  statCard: {
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: "48%",
    flexGrow: 1,
    padding: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 10,
    marginTop: 12,
  },
  decisionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  decisionTile: {
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: "48%",
    flexGrow: 1,
    padding: 10,
  },
  decisionValue: {
    fontSize: 24,
    fontWeight: "900",
    marginTop: 3,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
  },
  summaryRow: {
    borderTopColor: "rgba(143, 134, 122, 0.18)",
    borderTopWidth: 1,
    paddingVertical: 10,
  },
  insightTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  summaryCategory: {
    flex: 1,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 20,
  },
  insightAmount: {
    fontSize: 13,
    fontWeight: "900",
    textAlign: "right",
  },
  summaryText: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 3,
  },
});
