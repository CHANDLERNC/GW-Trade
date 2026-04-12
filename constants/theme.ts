import { Platform } from 'react-native';

// ── Shared type ────────────────────────────────────────────────────────────────
export type ThemeColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceBorder: string;
  accent: string;
  accentDim: string;
  lri: string;
  mss: string;
  csi: string;
  success: string;
  danger: string;
  warning: string;
  text: string;
  textSecondary: string;
  textMuted: string;
};

// ── Dark theme (GZW military PMC aesthetic) ─────────────────────────────────
export const GZW: ThemeColors = {
  background: '#09090B',
  surface: '#1C1E22',
  surfaceElevated: '#262A2F',
  surfaceBorder: '#303336',
  accent: '#C8A84B',
  accentDim: '#8A7032',
  lri: '#4E7A60',
  mss: '#3D5E8F',
  csi: '#A03434',
  success: '#4E7A60',
  danger: '#C43C3C',
  warning: '#D4823A',
  text: '#DDD9D0',
  textSecondary: '#A89F94',
  textMuted: '#756F69',
};

// ── Light theme ─────────────────────────────────────────────────────────────
export const GZW_LIGHT: ThemeColors = {
  background: '#F0F2F7',
  surface: '#FFFFFF',
  surfaceElevated: '#F8F9FC',
  surfaceBorder: '#D9DCE8',
  accent: '#C8960A',
  accentDim: '#8A6612',
  lri: '#3A6B4F',
  mss: '#2C5090',
  csi: '#962A2A',
  success: '#3A6B4F',
  danger: '#C0392B',
  warning: '#C77A20',
  text: '#0F1420',
  textSecondary: '#3D4A5E',
  textMuted: '#8090A4',
};

// Legacy aliases kept for any static usage
const tintColorLight = GZW.accent;
const tintColorDark = GZW.accent;

export const Colors = {
  light: {
    text: '#1A1F2E',
    background: '#F0F2F5',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: GZW.text,
    background: GZW.background,
    tint: tintColorDark,
    icon: GZW.textSecondary,
    tabIconDefault: GZW.textSecondary,
    tabIconSelected: tintColorDark,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 10,
  xl: 16,
  full: 9999,
} as const;

export const Typography = {
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 30,
  },
  weights: {
    regular: '500' as const,
    medium: '600' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
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
