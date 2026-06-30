import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function Header() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 6 }]}>
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
        <Ionicons name="notifications-outline" size={22} color="#A85C44" />
        <View style={styles.alertDot} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#E8DECE",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 108,
    overflow: "hidden",
    paddingBottom: 16,
    paddingHorizontal: 18,
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    zIndex: 2,
  },
  logo: {
    height: 42,
    width: 42,
  },
  title: {
    color: "#3A2E28",
    fontFamily: "serif",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 0,
  },
  subtitle: {
    color: "#8F867A",
    fontSize: 13,
    marginTop: 2,
  },
  alertButton: {
    alignItems: "center",
    backgroundColor: "#F5F0E8",
    borderColor: "#E8DECE",
    borderRadius: 999,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
    zIndex: 2,
  },
  alertDot: {
    backgroundColor: "#C4943A",
    borderRadius: 999,
    height: 9,
    position: "absolute",
    right: 10,
    top: 9,
    width: 9,
  },
  orbitOne: {
    borderColor: "rgba(168, 92, 68, 0.20)",
    borderRadius: 180,
    borderWidth: 1,
    height: 220,
    position: "absolute",
    right: 44,
    top: -78,
    width: 220,
  },
  orbitTwo: {
    borderColor: "rgba(196, 148, 58, 0.14)",
    borderRadius: 210,
    borderWidth: 1,
    height: 280,
    position: "absolute",
    right: -56,
    top: -110,
    width: 280,
  },
  watermark: {
    color: "rgba(168, 92, 68, 0.07)",
    fontFamily: "serif",
    fontSize: 132,
    fontWeight: "900",
    position: "absolute",
    right: 16,
    top: -10,
  },
});
