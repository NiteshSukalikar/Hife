import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

export default function RequestDetailsScreen() {
  const router = useRouter();
  const { title, image, info, priority, budget } = useLocalSearchParams();

  return (
    <>
      <Stack.Screen
        options={{
          title: title as string,
          headerTitleAlign: "center",
        }}
      />
      <View style={styles.container}>
        {image ? (
          <Image source={{ uri: image as string }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.imagePlaceholderText}>No image added</Text>
          </View>
        )}

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.info}>{info}</Text>

        <View style={styles.meta}>
          <Text style={styles.metaText}>Priority: {priority}</Text>
          <Text style={styles.metaText}>Budget: INR {budget}</Text>
        </View>

        <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Back</Text>
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
  imagePlaceholder: {
    alignItems: "center",
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
  },
  imagePlaceholderText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
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
    backgroundColor: "#0f172a",
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
