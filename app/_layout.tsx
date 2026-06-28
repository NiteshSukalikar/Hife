import { ToastProvider } from "@/components/toast/toastProvider";
import StartupIntro from "@/components/startup-intro";
import {
  DarkTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

const HifeNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: "#39FF14",
    background: "#050505",
    card: "#050505",
    text: "#F8FAFC",
    border: "#263026",
    notification: "#39FF14",
  },
};

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider value={HifeNavigationTheme}>
        <ToastProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="household"
              options={{ title: "Household setup", headerTitleAlign: "center" }}
            />
            <Stack.Screen
              name="modal"
              options={{ presentation: "modal", title: "About Hife" }}
            />
          </Stack>
          <StartupIntro />
        </ToastProvider>

        <StatusBar style="light" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
