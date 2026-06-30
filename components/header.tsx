import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useHifeTheme } from "@/hooks/use-hife-theme";

export default function Header() {
  const insets = useSafeAreaInsets();
  const { palette } = useHifeTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: palette.chrome,
          borderBottomColor: palette.border,
          paddingTop: insets.top + 6,
        },
      ]}
    >
      <View style={[styles.orbitOne, { borderColor: palette.hairline }]} />
      <View style={[styles.orbitTwo, { borderColor: palette.hairline }]} />
      <Text style={[styles.watermark, { color: palette.hairline }]}>H</Text>
      <View style={styles.brandRow}>
        <Image
          source={require("@/assets/images/favicon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View>
          <Text style={[styles.title, { color: palette.chromeText }]}>Hife</Text>
          <Text style={[styles.subtitle, { color: palette.chromeMutedText }]}>
            Shared purchase decisions
          </Text>
        </View>
      </View>
      <Pressable
        style={[
          styles.alertButton,
          { backgroundColor: palette.input, borderColor: palette.border },
        ]}
        hitSlop={10}
      >
        <Ionicons name="notifications-outline" size={22} color={palette.primary} />
        <View style={[styles.alertDot, { backgroundColor: palette.accent }]} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
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
    fontFamily: "serif",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 0,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  alertButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
    zIndex: 2,
  },
  alertDot: {
    borderRadius: 999,
    height: 9,
    position: "absolute",
    right: 10,
    top: 9,
    width: 9,
  },
  orbitOne: {
    borderRadius: 180,
    borderWidth: 1,
    height: 220,
    position: "absolute",
    right: 44,
    top: -78,
    width: 220,
  },
  orbitTwo: {
    borderRadius: 210,
    borderWidth: 1,
    height: 280,
    position: "absolute",
    right: -56,
    top: -110,
    width: 280,
  },
  watermark: {
    fontFamily: "serif",
    fontSize: 132,
    fontWeight: "900",
    position: "absolute",
    right: 16,
    top: -10,
  },
});
