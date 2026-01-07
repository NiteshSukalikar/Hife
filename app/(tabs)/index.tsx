import Header from "@/components/header";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { Ticket } from "@/constants/types";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getTickets } from "../api/tickets";

export default function HomeScreen() {
  const router = useRouter();
 const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const data = await getTickets();
      setTickets(data);
    } catch (e) {
      console.error("Failed to fetch tickets", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header />

      <FlatList
        contentContainerStyle={{ padding: 12 }}
        data={tickets}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={loadTickets}
        renderItem={({ item }) => (
          <Pressable style={styles.card}>
            {/* LEFT: IMAGE */}
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]} />
            )}

            {/* CENTER: INFO */}
            <View style={styles.info}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.priority}>Priority: {item.priority}</Text>
              <Text style={styles.budget}>Budget: ₹{item.budget}</Text>
            </View>

            {/* RIGHT: ACTIONS */}
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
  card: {
    flexDirection: "row",
    backgroundColor: "#f2f2f2",
    borderRadius: 12, // ⬆️ smoother corners
    marginBottom: 16, // ⬆️ more spacing between cards
    padding: 14, // ⬆️ more inner space
    alignItems: "center",
  },
  image: {
    width: 72, // ⬆️ bigger image
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
});
