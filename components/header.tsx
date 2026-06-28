import { Image, StyleSheet, Text, View } from "react-native";

export default function Header() {
  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/favicon.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <View>
        <Text style={styles.title}>Hife</Text>
        <Text style={styles.subtitle}>Household purchase requests</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#050505",
    borderBottomColor: "#263026",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    height: 68,
    paddingHorizontal: 16,
  },
  logo: {
    height: 40,
    width: 40,
  },
  title: {
    color: "#39FF14",
    fontSize: 20,
    fontWeight: "800",
  },
  subtitle: {
    color: "#A1A1AA",
    fontSize: 12,
    marginTop: 2,
  },
});
