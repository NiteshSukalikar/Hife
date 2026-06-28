import { BrandColors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type StartupIntroProps = {
  durationMs?: number;
};

const INSIGHTS = [
  {
    icon: "create-outline",
    label: "Create requests",
    text: "Capture price, reason, budget, priority, links, and images.",
  },
  {
    icon: "people-outline",
    label: "Decide together",
    text: "Approve, decline, buy later, or ask for more information.",
  },
  {
    icon: "wallet-outline",
    label: "Protect budget",
    text: "See impact before a household purchase becomes spending.",
  },
] as const;

export default function StartupIntro({ durationMs = 3600 }: StartupIntroProps) {
  const { height, width } = useWindowDimensions();
  const [visible, setVisible] = useState(true);
  const fade = useRef(new Animated.Value(1)).current;
  const content = useRef(new Animated.Value(0)).current;
  const bridge = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const scan = useRef(new Animated.Value(0)).current;

  const bridgeWidth = bridge.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 142],
  });
  const logoScale = content.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });
  const contentTranslate = content.interpolate({
    inputRange: [0, 1],
    outputRange: [22, 0],
  });
  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });
  const scanTranslate = scan.interpolate({
    inputRange: [0, 1],
    outputRange: [-240, 240],
  });
  const isWide = width >= 760;
  const isCompact = height < 780;

  const cards = useMemo(
    () =>
      INSIGHTS.map((item) => ({
        ...item,
        key: item.label,
      })),
    []
  );

  const hide = useCallback(() => {
    Animated.timing(fade, {
      toValue: 0,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setVisible(false);
    });
  }, [fade]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(content, {
        toValue: 1,
        duration: 850,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(bridge, {
        toValue: 1,
        duration: 950,
        easing: Easing.out(Easing.exp),
        useNativeDriver: false,
      }),
    ]).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1150,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1150,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    const scanLoop = Animated.loop(
      Animated.timing(scan, {
        toValue: 1,
        duration: 2600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    pulseLoop.start();
    scanLoop.start();

    const timer = setTimeout(() => hide(), durationMs);

    return () => {
      clearTimeout(timer);
      pulseLoop.stop();
      scanLoop.stop();
    };
  }, [bridge, content, durationMs, hide, pulse, scan]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: fade }]}>
      <SafeAreaView style={styles.safe}>
        <Animated.View
          style={[
            styles.content,
            isCompact && styles.contentCompact,
            {
              opacity: content,
              transform: [{ translateY: contentTranslate }],
            },
          ]}
        >
          <View style={[styles.hero, isCompact && styles.heroCompact]}>
            <Animated.View
              style={[
                styles.logoHalo,
                {
                  transform: [{ scale: pulseScale }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.logo,
                {
                  transform: [{ scale: logoScale }],
                },
              ]}
              accessibilityLabel="Hife partner logo"
            >
              <Animated.View
                style={[
                  styles.bridge,
                  {
                    width: bridgeWidth,
                  },
                ]}
              />
              <View style={styles.partnerGroup}>
                <PartnerPillar />
                <PartnerPillar />
              </View>
            </Animated.View>

            <View style={styles.brandLockup}>
              <Text style={[styles.brand, isCompact && styles.brandCompact]}>
                Hife
              </Text>
              <Text style={styles.title}>Partners</Text>
              <Text style={styles.subtitle}>Two, deciding together</Text>
            </View>
          </View>

          <View style={styles.statement}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.scanLine,
                { transform: [{ translateX: scanTranslate }, { rotate: "15deg" }] },
              ]}
            />
            <Text style={styles.statementLabel}>Household clarity</Text>
            <Text style={styles.statementText}>
              Turn purchase ideas into calm decisions with context, budget
              visibility, partner discussion, and clear next steps.
            </Text>
          </View>

          <View style={[styles.cardGrid, isWide && styles.cardGridWide]}>
            {cards.map((item) => (
              <View key={item.key} style={[styles.card, isWide && styles.cardWide]}>
                <View style={styles.cardIcon}>
                  <Ionicons name={item.icon} size={18} color={BrandColors.appBlack} />
                </View>
                <View style={styles.cardTextWrap}>
                  <Text style={styles.cardLabel}>{item.label}</Text>
                  <Text style={styles.cardText}>{item.text}</Text>
                </View>
              </View>
            ))}
          </View>

          <Pressable style={styles.enterButton} onPress={hide}>
            <Text style={styles.enterText}>Enter Hife</Text>
            <Ionicons name="arrow-forward" size={18} color={BrandColors.appBlack} />
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
}

function PartnerPillar() {
  return (
    <View style={styles.partner}>
      <View style={styles.partnerHead} />
      <View style={styles.partnerBody} />
    </View>
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
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 26,
  },
  contentCompact: {
    paddingVertical: 16,
  },
  hero: {
    alignItems: "center",
    marginTop: 18,
  },
  heroCompact: {
    marginTop: 6,
  },
  logoHalo: {
    backgroundColor: "rgba(57, 255, 20, 0.08)",
    borderColor: "rgba(57, 255, 20, 0.25)",
    borderRadius: 120,
    borderWidth: 1,
    height: 214,
    position: "absolute",
    top: -10,
    width: 214,
  },
  logo: {
    alignItems: "center",
    height: 196,
    justifyContent: "center",
    width: 196,
  },
  bridge: {
    borderColor: BrandColors.neonGreen,
    borderRadius: 120,
    borderTopWidth: 8,
    height: 68,
    position: "absolute",
    top: 30,
  },
  partnerGroup: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 54,
    justifyContent: "center",
    marginTop: 38,
  },
  partner: {
    alignItems: "center",
  },
  partnerHead: {
    backgroundColor: BrandColors.text,
    borderRadius: 24,
    height: 48,
    marginBottom: 5,
    shadowColor: BrandColors.neonGreen,
    shadowOpacity: 0.22,
    shadowRadius: 14,
    width: 48,
  },
  partnerBody: {
    backgroundColor: BrandColors.text,
    borderRadius: 18,
    height: 92,
    width: 36,
  },
  brandLockup: {
    alignItems: "center",
    marginTop: 6,
  },
  brand: {
    color: BrandColors.neonGreen,
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: 0,
  },
  brandCompact: {
    fontSize: 42,
  },
  title: {
    color: BrandColors.text,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 4,
  },
  subtitle: {
    color: BrandColors.neonGreen,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 6,
    textAlign: "center",
  },
  statement: {
    backgroundColor: BrandColors.panelBlack,
    borderColor: "rgba(57, 255, 20, 0.26)",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    padding: 16,
  },
  scanLine: {
    backgroundColor: "rgba(184, 255, 176, 0.16)",
    height: 180,
    position: "absolute",
    top: -60,
    width: 38,
  },
  statementLabel: {
    color: BrandColors.neonGreenSoft,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  statementText: {
    color: BrandColors.text,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 25,
    marginTop: 8,
  },
  cardGrid: {
    gap: 10,
  },
  cardGridWide: {
    flexDirection: "row",
  },
  card: {
    alignItems: "center",
    backgroundColor: BrandColors.elevatedBlack,
    borderColor: BrandColors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 76,
    padding: 12,
  },
  cardWide: {
    alignItems: "flex-start",
    flex: 1,
    minHeight: 102,
  },
  cardIcon: {
    alignItems: "center",
    backgroundColor: BrandColors.neonGreen,
    borderRadius: 8,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  cardTextWrap: {
    flex: 1,
  },
  cardLabel: {
    color: BrandColors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  cardText: {
    color: BrandColors.mutedText,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  enterButton: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: BrandColors.neonGreen,
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 52,
    paddingVertical: 14,
  },
  enterText: {
    color: BrandColors.appBlack,
    fontSize: 16,
    fontWeight: "900",
  },
});
