/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const BrandColors = {
  warmCream: "#FAF6EE",
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
};

const tintColor = BrandColors.clay;

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
    tabIconDefault: BrandColors.mutedText,
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
