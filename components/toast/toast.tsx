import { useEffect, useRef } from "react";
import {
    Animated,
    PanResponder,
    StyleSheet,
    Text,
} from "react-native";

type Props = {
  message: string;
  type: "error" | "success";
  onHide: () => void;
};

export default function Toast({ message, type, onHide }: Props) {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const pan = useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 20,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();

    const timer = setTimeout(hide, 3000);
    return () => clearTimeout(timer);
  }, []);

  const hide = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -80,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start(onHide);
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
    onPanResponderMove: Animated.event([null, { dx: pan.x }], {
      useNativeDriver: false,
    }),
    onPanResponderRelease: (_, g) => {
      if (g.dx > 100) {
        hide();
      } else {
        Animated.spring(pan.x, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      }
    },
  });

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        {
          backgroundColor: type === "error" ? "#fee2e2" : "#dcfce7",
          borderColor: type === "error" ? "#ef4444" : "#22c55e",
          transform: [
            { translateY },
            { translateX: pan.x },
          ],
          opacity,
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
    top: 12,
    right: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: "70%",
    zIndex: 9999,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
  },
});
