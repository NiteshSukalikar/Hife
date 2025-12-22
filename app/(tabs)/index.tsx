import Header from "@/components/header";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const tickets = [
  {
    id: "1",
    title: "Design landing page",
    priority: "P1",
    budget: 500,
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
    info: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s,",
  },
  {
    id: "2",
    title: "Fix API bug",
    priority: "P0",
    budget: 300,
    image: "https://picsum.photos/200",
    info: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s,",
  },
  {
    id: "3",
    title: "Add comments feature",
    priority: "P2",
    budget: 800,
    image: "https://picsum.photos/300",
    info: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s,",
  },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Header />

      <FlatList
        contentContainerStyle={{ padding: 12 }}
        data={tickets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.card}>
            {/* Left: Image */}
            <Image source={{ uri: item.image }} style={styles.image} />

            {/* Center: Info */}
            <View style={styles.info}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.priority}>Priority: {item.priority}</Text>
              <Text style={styles.budget}>Budget: ₹{item.budget}</Text>
            </View>

            {/* Right: Action Icons */}
            <View style={styles.actions}>
              <Pressable
                hitSlop={10}
                onPress={(e) => {
                  router.push({
                    pathname: "/task/[id]/comments",
                    params: { id: item.id, title: item.title },
                  });
                }}
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
});
