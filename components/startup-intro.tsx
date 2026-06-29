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
    outputRange: [18, 0],
  });
  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
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
              styles.halo,
              {
                transform: [{ scale: pulseScale }],
              },
            ]}
          />
          <Animated.View
            style={{
              alignItems: "center",
              transform: [{ translateY: logoTranslate }, { scale: logoScale }],
            }}
          >
            <Image
              source={require("@/assets/images/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.brand}>Hife</Text>
            <Text style={styles.subtitle}>Create a room. Set a budget. Decide together.</Text>
          </Animated.View>
        </View>

        <Pressable style={styles.getStartedButton} onPress={hide}>
          <Text style={styles.getStartedText}>Get started</Text>
          <Ionicons name="arrow-forward" size={18} color={BrandColors.appBlack} />
        </Pressable>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BrandColors.appBlack,
    zIndex: 1000,
  },
  safe: {
    flex: 1,
    justifyContent: "space-between",
    padding: 24,
  },
  center: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  halo: {
    backgroundColor: "rgba(57, 255, 20, 0.08)",
    borderColor: "rgba(57, 255, 20, 0.24)",
    borderRadius: 120,
    borderWidth: 1,
    height: 210,
    position: "absolute",
    width: 210,
  },
  logo: {
    height: 112,
    width: 112,
  },
  brand: {
    color: BrandColors.neonGreen,
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: 0,
    marginTop: 18,
  },
  subtitle: {
    color: BrandColors.mutedText,
    fontSize: 16,
    lineHeight: 22,
    marginTop: 8,
    maxWidth: 280,
    textAlign: "center",
  },
  getStartedButton: {
    alignItems: "center",
    backgroundColor: BrandColors.neonGreen,
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 54,
  },
  getStartedText: {
    color: BrandColors.appBlack,
    fontSize: 16,
    fontWeight: "900",
  },
});
