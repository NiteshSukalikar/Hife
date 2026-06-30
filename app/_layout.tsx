import { ToastProvider } from "@/components/toast/toastProvider";
import StartupIntro from "@/components/startup-intro";
import {
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

const HifeNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#A85C44",
    background: "#FAF6EE",
    card: "#FFFFFF",
    text: "#3A2E28",
    border: "#E8DECE",
    notification: "#C4943A",
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
              options={{ title: "Room setup", headerTitleAlign: "center" }}
            />
            <Stack.Screen
              name="modal"
              options={{ presentation: "modal", title: "About Hife" }}
            />
          </Stack>
          <StartupIntro />
        </ToastProvider>

        <StatusBar style="dark" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
