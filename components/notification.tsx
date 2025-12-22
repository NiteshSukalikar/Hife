import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";

type Props = {
  message: string;
  visible: boolean;
  type?: "error" | "success";
};

export default function Notification({
  message,
  visible,
  type = "error",
}: Props) {
  const slideAnim = useRef(new Animated.Value(-80)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 20,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -80,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          backgroundColor: type === "error" ? "#fee2e2" : "#dcfce7",
          borderColor: type === "error" ? "#ef4444" : "#22c55e",
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: type === "error" ? "#991b1b" : "#166534" },
        ]}
      >
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    right: 12, // 👈 LEFT SIDE
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 1000,
    minWidth: "70%",
  },
  text: {
    fontSize: 14,
    fontWeight: "500",
  },
});
