import { BrandColors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type StartupIntroProps = {
  durationMs?: number;
};

export default function StartupIntro({ durationMs = 4200 }: StartupIntroProps) {
  const [visible, setVisible] = useState(true);
  const fade = useRef(new Animated.Value(1)).current;
  const logo = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  const logoScale = logo.interpolate({
    inputRange: [0, 1],
    outputRange: [0.82, 1],
  });
  const logoTranslate = logo.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });
  const markOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.34, 0.58],
  });

  const hide = useCallback(() => {
    Animated.timing(fade, {
      toValue: 0,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setVisible(false);
    });
  }, [fade]);

  useEffect(() => {
    Animated.timing(logo, {
      toValue: 1,
      duration: 720,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    const timer = setTimeout(() => hide(), durationMs);

    return () => {
      clearTimeout(timer);
      pulseLoop.stop();
    };
  }, [durationMs, hide, logo, pulse]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: fade }]}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Animated.View
            style={[
              styles.brandStack,
              {
                transform: [{ translateY: logoTranslate }, { scale: logoScale }],
              },
            ]}
          >
            <View style={styles.markWrap}>
              <Animated.View
                style={[styles.markGlow, { opacity: markOpacity }]}
              />
              <Image
                source={require("@/assets/images/android-icon-foreground.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brand}>Hife</Text>
            <Text style={styles.subtitle}>Shared budgets. Clear decisions.</Text>
          </Animated.View>
        </View>

        <Pressable style={styles.getStartedButton} onPress={hide}>
          <Text style={styles.getStartedText}>Get started</Text>
          <Ionicons name="arrow-forward" size={18} color={BrandColors.warmCream} />
        </Pressable>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BrandColors.warmCream,
    zIndex: 1000,
  },
  safe: {
    flex: 1,
    justifyContent: "space-between",
    paddingBottom: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  center: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingBottom: 42,
  },
  brandStack: {
    alignItems: "center",
    marginTop: -28,
  },
  markWrap: {
    alignItems: "center",
    height: 118,
    justifyContent: "center",
    width: 150,
  },
  markGlow: {
    backgroundColor: "#F0DED4",
    borderRadius: 68,
    height: 136,
    position: "absolute",
    width: 136,
  },
  logo: {
    height: 104,
    width: 132,
  },
  brand: {
    color: BrandColors.clay,
    fontSize: 54,
    fontWeight: "800",
    letterSpacing: 0,
    marginTop: 18,
  },
  subtitle: {
    color: BrandColors.mutedText,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 23,
    marginTop: 10,
    maxWidth: 250,
    textAlign: "center",
  },
  getStartedButton: {
    alignItems: "center",
    backgroundColor: BrandColors.clay,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 52,
  },
  getStartedText: {
    color: BrandColors.warmCream,
    fontSize: 16,
    fontWeight: "900",
  },
});
