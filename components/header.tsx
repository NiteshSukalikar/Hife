import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function Header() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.orbitOne} />
      <View style={styles.orbitTwo} />
      <Text style={styles.watermark}>H</Text>
      <View style={styles.brandRow}>
        <Image
          source={require("@/assets/images/favicon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View>
          <Text style={styles.title}>Hife</Text>
          <Text style={styles.subtitle}>Shared purchase decisions</Text>
        </View>
      </View>
      <Pressable style={styles.alertButton} hitSlop={10}>
        <Ionicons name="notifications-outline" size={22} color="#EDE4D6" />
        <View style={styles.alertDot} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#0F0F10",
    borderBottomColor: "rgba(200, 161, 90, 0.22)",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 132,
    overflow: "hidden",
    paddingBottom: 22,
    paddingHorizontal: 22,
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    zIndex: 2,
  },
  logo: {
    height: 50,
    width: 50,
  },
  title: {
    color: "#F7F2EB",
    fontFamily: "serif",
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: 0,
  },
  subtitle: {
    color: "rgba(237, 228, 214, 0.72)",
    fontSize: 15,
    marginTop: 2,
  },
  alertButton: {
    alignItems: "center",
    backgroundColor: "rgba(247, 242, 235, 0.08)",
    borderColor: "rgba(237, 228, 214, 0.12)",
    borderRadius: 999,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
    zIndex: 2,
  },
  alertDot: {
    backgroundColor: "#C8A15A",
    borderRadius: 999,
    height: 9,
    position: "absolute",
    right: 12,
    top: 10,
    width: 9,
  },
  orbitOne: {
    borderColor: "rgba(182, 106, 60, 0.58)",
    borderRadius: 180,
    borderWidth: 1,
    height: 260,
    position: "absolute",
    right: 44,
    top: -88,
    width: 260,
  },
  orbitTwo: {
    borderColor: "rgba(200, 161, 90, 0.18)",
    borderRadius: 210,
    borderWidth: 1,
    height: 320,
    position: "absolute",
    right: -56,
    top: -120,
    width: 320,
  },
  watermark: {
    color: "rgba(237, 228, 214, 0.07)",
    fontFamily: "serif",
    fontSize: 160,
    fontWeight: "900",
    position: "absolute",
    right: 16,
    top: -10,
  },
});
