/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const BrandColors = {
  primaryCharcoal: "#0F0F10",
  espresso: "#1C1510",
  richBrown: "#6A3D27",
  copper: "#B66A3C",
  warmCream: "#F7F2EB",
  softBeige: "#EDE4D6",
  mutedGold: "#C8A15A",
  oliveSage: "#6F7F6A",
  clay: "#A85C44",
  sage: "#6F7F6A",
  amber: "#C8A15A",
  charcoal: "#0F0F10",
  linen: "#EDE4D6",
  card: "#FFFBF5",
  input: "#F4ECE0",
  text: "#1C1510",
  mutedText: "#776E64",
  border: "#DDCDBB",
  hairline: "rgba(200, 161, 90, 0.24)",
  darkSurface: "#171310",
  darkPanel: "#211913",
};

const tintColor = BrandColors.copper;

export const Colors = {
  light: {
    text: BrandColors.text,
    background: BrandColors.warmCream,
    tint: tintColor,
    icon: BrandColors.mutedText,
    tabIconDefault: BrandColors.softBeige,
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
