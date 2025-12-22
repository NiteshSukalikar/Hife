import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

export default function TaskDetailsScreen() {
  const router = useRouter();
  const { title, image, info, priority, budget } = useLocalSearchParams();

  return (
    <>
      <Stack.Screen
        options={{
          title: title as string, // 👈 dynamic header title
          headerTitleAlign: "center",
        }}
      />
      <View style={styles.container}>
        {/* Image at top center */}
        <Image source={{ uri: image as string }} style={styles.image} />

        {/* Details */}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.info}>{info}</Text>

        <View style={styles.meta}>
          <Text style={styles.metaText}>Priority: {priority}</Text>
          <Text style={styles.metaText}>Budget: ${budget}</Text>
        </View>

        {/* Cancel Button */}
        <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  info: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 16,
    textAlign: "center",
  },
  meta: {
    width: "100%",
    marginBottom: 24,
  },
  metaText: {
    fontSize: 16,
    marginBottom: 6,
  },
  cancelBtn: {
    marginTop: "auto",
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  cancelText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
