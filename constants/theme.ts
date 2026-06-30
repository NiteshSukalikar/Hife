/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export type HifeThemeMode = "warm" | "espresso";

export const BrandColors = {
  primaryCharcoal: "#3A2E28",
  espresso: "#3A2E28",
  richBrown: "#7A4B36",
  copper: "#A85C44",
  warmCream: "#FAF6EE",
  softBeige: "#E8DECE",
  mutedGold: "#C4943A",
  oliveSage: "#7A8C6E",
  clay: "#A85C44",
  sage: "#7A8C6E",
  amber: "#C4943A",
  charcoal: "#3A2E28",
  linen: "#E8DECE",
  card: "#FFFFFF",
  input: "#F5F0E8",
  text: "#3A2E28",
  mutedText: "#8F867A",
  border: "#E8DECE",
  hairline: "rgba(58, 46, 40, 0.12)",
  darkSurface: "#46372F",
  darkPanel: "#5B463B",
};

const tintColor = BrandColors.clay;

export const HifeThemes = {
  warm: {
    mode: "warm",
    name: "Warm light",
    description: "Readable, calm, and trust-first for daily household decisions.",
    background: "#FAF6EE",
    chrome: "#FFFFFF",
    chromeText: "#3A2E28",
    chromeMutedText: "#8F867A",
    card: "#FFFFFF",
    elevatedCard: "#FFFFFF",
    input: "#F5F0E8",
    primary: "#A85C44",
    primaryPressed: "#7A4B36",
    accent: "#C4943A",
    success: "#7A8C6E",
    text: "#3A2E28",
    mutedText: "#8F867A",
    border: "#E8DECE",
    hairline: "rgba(58, 46, 40, 0.12)",
    tabInactive: "#8F867A",
    buttonText: "#FAF6EE",
    statusBar: "dark",
  },
  espresso: {
    mode: "espresso",
    name: "Black espresso",
    description: "Dramatic black, espresso, copper, and muted gold accents.",
    background: "#0F0F10",
    chrome: "#0F0F10",
    chromeText: "#F7F2EB",
    chromeMutedText: "#C7B9A8",
    card: "#FFFBF5",
    elevatedCard: "#211913",
    input: "#F4ECE0",
    primary: "#B66A3C",
    primaryPressed: "#8F4F2D",
    accent: "#C8A15A",
    success: "#6F7F6A",
    text: "#1C1510",
    mutedText: "#776E64",
    border: "rgba(237, 228, 214, 0.16)",
    hairline: "rgba(200, 161, 90, 0.24)",
    tabInactive: "rgba(237, 228, 214, 0.58)",
    buttonText: "#FFF9F0",
    statusBar: "light",
  },
} as const;

export type HifeThemePalette = (typeof HifeThemes)[HifeThemeMode];

export function getHifeTheme(mode: HifeThemeMode) {
  return HifeThemes[mode] || HifeThemes.warm;
}

export function getNextHifeTheme(mode: HifeThemeMode): HifeThemeMode {
  return mode === "espresso" ? "warm" : "espresso";
}

export const Colors = {
  light: {
    text: BrandColors.text,
    background: BrandColors.warmCream,
    tint: tintColor,
    icon: BrandColors.mutedText,
    tabIconDefault: BrandColors.mutedText,
    tabIconSelected: tintColor,
  },
  dark: {
    text: BrandColors.text,
    background: BrandColors.warmCream,
    tint: tintColor,
    icon: BrandColors.mutedText,
    tabIconDefault: BrandColors.softBeige,
    tabIconSelected: tintColor,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
