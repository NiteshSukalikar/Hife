import Header from "@/components/header";
import { PurchaseRequest, RequestStatus } from "@/constants/types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getPurchaseRequests } from "@/services/purchaseRequests";

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

export default function HomeScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      setError(null);
      const data = await getPurchaseRequests();
      setRequests(data);
    } catch (e) {
      console.error("Failed to fetch requests", e);
      setError("Could not load purchase requests. Pull to try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests])
  );

  const filteredRequests = useMemo(() => {
    if (activeFilter === "all") return requests;
    return requests.filter((item) => item.status === activeFilter);
  }, [activeFilter, requests]);

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
          const statusColor = STATUS_COLORS[item.status];

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
                      {STATUS_LABELS[item.status]}
                    </Text>
                  </View>
                </View>

                <Text style={styles.metaText} numberOfLines={1}>
                  {item.category} - {item.priority}
                </Text>
                <Text style={styles.budget}>
                  INR {item.expectedPrice} expected / INR {item.maxBudget} max
                </Text>
              </View>

              <View style={styles.actions}>
                <Pressable
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
