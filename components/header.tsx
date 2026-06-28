import { StyleSheet, Text, View } from "react-native";

export default function Header() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hife</Text>
      <Text style={styles.subtitle}>Household purchase requests</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 64,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  title: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    color: "#cbd5e1",
    fontSize: 12,
    marginTop: 2,
  },
});
