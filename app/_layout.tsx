import { ToastProvider } from "@/components/toast/toastProvider";
import StartupIntro from "@/components/startup-intro";
import { HifeThemeProvider, useHifeTheme } from "@/hooks/use-hife-theme";
import {
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

export const unstable_settings = {
  anchor: "(tabs)",
};

function ThemedRootLayout() {
  const { palette } = useHifeTheme();
  const hifeNavigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: palette.primary,
      background: palette.background,
      card: palette.chrome,
      text: palette.chromeText,
      border: palette.border,
      notification: palette.accent,
    },
  };

  return (
    <SafeAreaProvider>
      <ThemeProvider value={hifeNavigationTheme}>
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

        <StatusBar style={palette.statusBar} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <HifeThemeProvider>
      <ThemedRootLayout />
    </HifeThemeProvider>
  );
}
