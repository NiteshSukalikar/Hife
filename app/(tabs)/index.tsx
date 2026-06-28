import Header from "@/components/header";
import { PurchaseRequest } from "@/constants/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getPurchaseRequests } from "../api/tickets";

export default function HomeScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
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
  };

  return (
    <View style={styles.container}>
      <Header />

      <FlatList
        contentContainerStyle={styles.listContent}
        data={requests}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={loadRequests}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                {error ? "Requests unavailable" : "No purchase requests yet"}
              </Text>
              <Text style={styles.emptyText}>
                {error
                  ? error
                  : "Create the first request to discuss a purchase with your partner."}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]} />
            )}

            <View style={styles.info}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.priority}>Priority: {item.priority}</Text>
              <Text style={styles.budget}>Budget: INR {item.budget}</Text>
            </View>

            <View style={styles.actions}>
              <Pressable
                hitSlop={10}
                onPress={() =>
                  router.push({
                    pathname: "/task/[id]/comments",
                    params: { id: item.id, title: item.title },
                  })
                }
              >
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={22}
                  color="#2563eb"
                />
              </Pressable>

              <Pressable
                hitSlop={10}
                onPress={() =>
                  router.push({
                    pathname: "/task/[id]",
                    params: item,
                  })
                }
              >
                <Ionicons
                  name="information-circle-outline"
                  size={24}
                  color="#0f172a"
                />
              </Pressable>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  listContent: {
    padding: 12,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    marginBottom: 16,
    padding: 14,
    alignItems: "center",
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 6,
    marginRight: 10,
  },
  actions: {
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 8,
    height: 60,
  },
  info: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
  },
  priority: {
    marginTop: 4,
    color: "#d97706",
  },
  budget: {
    marginTop: 2,
    color: "#059669",
  },
  imagePlaceholder: {
    backgroundColor: "#e5e7eb",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 56,
  },
  emptyTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyText: {
    color: "#64748b",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
});
