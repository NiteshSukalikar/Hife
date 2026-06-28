/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const BrandColors = {
  appBlack: "#050505",
  panelBlack: "#101312",
  elevatedBlack: "#171A18",
  neonGreen: "#39FF14",
  neonGreenSoft: "#B8FFB0",
  text: "#F8FAFC",
  mutedText: "#A1A1AA",
  border: "#263026",
};

const tintColor = BrandColors.neonGreen;

export const Colors = {
  light: {
    text: BrandColors.text,
    background: BrandColors.appBlack,
    tint: tintColor,
    icon: BrandColors.mutedText,
    tabIconDefault: BrandColors.mutedText,
    tabIconSelected: tintColor,
  },
  dark: {
    text: BrandColors.text,
    background: BrandColors.appBlack,
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
