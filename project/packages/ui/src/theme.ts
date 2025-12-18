import { Platform, ViewStyle } from 'react-native';

const pixelFontFamily =
  Platform.select({
    web: '"Press Start 2P", "PressStart2P", monospace',
    default: 'PressStart2P_400Regular'
  }) ?? 'PressStart2P_400Regular';

export const colors = {
  // Dark theme base with improved contrast
  background: '#05060A',
  surface: '#111827',
  surfaceElevated: '#1F2937',

  // Primary palette (sky blue)
  primary: '#38BDF8',
  primaryDark: '#0EA5E9',
  primaryLight: '#BAE6FD',
  primaryForeground: '#031625',

  // Secondary palette (slate)
  secondary: '#1E293B',
  secondaryDark: '#0F172A',
  secondaryLight: '#334155',

  // Accent colors
  accent: '#818CF8',
  accentDark: '#6366F1',
  accentLight: '#C7D2FE',

  // Status colors
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#38BDF8',

  // Text colors with accessible contrast
  textPrimary: '#F8FAFC',
  textSecondary: '#E2E8F0',
  textMuted: '#94A3B8',
  textDisabled: '#64748B',

  // Border colors
  border: '#1E293B',
  borderLight: '#334155',
  borderFocus: '#38BDF8',

  // Transparent overlays
  overlay: 'rgba(7, 11, 23, 0.85)',
  overlayLight: 'rgba(15, 23, 42, 0.6)',

  // Platform colors
  twitch: '#9146ff',
  youtube: '#ff0000',
  kick: '#53fc18',
  instagram: '#e4405f',
  tiktok: '#fe2c55',
  x: '#000000'
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999
};

export const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24
} as const;

export const fonts = {
  regular: {
    fontFamily: 'System',
    fontWeight: '400' as const
  },
  medium: {
    fontFamily: 'System',
    fontWeight: '500' as const
  },
  semiBold: {
    fontFamily: 'System',
    fontWeight: '600' as const
  },
  bold: {
    fontFamily: 'System',
    fontWeight: '700' as const
  },
  pixel: {
    fontFamily: pixelFontFamily,
    fontWeight: '400' as const
  }
};

export const typography = {
  h1: {
    ...fonts.pixel,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 2,
    color: colors.textPrimary
  },
  h2: {
    ...fonts.pixel,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: 1.6,
    color: colors.textPrimary
  },
  h3: {
    ...fonts.pixel,
    fontSize: 18,
    lineHeight: 26,
    letterSpacing: 1.2,
    color: colors.textPrimary
  },
  h4: {
    ...fonts.pixel,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 1,
    color: colors.textPrimary
  },
  body: {
    ...fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textPrimary
  },
  bodySmall: {
    ...fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary
  },
  caption: {
    ...fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted
  },
  button: {
    ...fonts.pixel,
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 1.5,
    color: colors.textPrimary,
    textTransform: 'uppercase' as const
  },
  badge: {
    ...fonts.pixel,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.3,
    color: colors.textPrimary,
    textTransform: 'uppercase' as const
  }
};

const createShadow = ({
  offsetY,
  radius,
  opacity,
  elevation,
  webShadow
}: {
  offsetY: number;
  radius: number;
  opacity: number;
  elevation: number;
  webShadow: string;
}): ViewStyle => {
  return (
    Platform.select<ViewStyle>({
      web: {
        boxShadow: webShadow
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: offsetY },
        shadowOpacity: opacity,
        shadowRadius: radius,
        elevation
      }
    }) ?? {}
  );
};

export const shadows = {
  small: createShadow({
    offsetY: 2,
    radius: 4,
    opacity: 0.25,
    elevation: 2,
    webShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)'
  }),
  medium: createShadow({
    offsetY: 4,
    radius: 8,
    opacity: 0.3,
    elevation: 4,
    webShadow: '0px 6px 12px rgba(0, 0, 0, 0.3)'
  }),
  large: createShadow({
    offsetY: 8,
    radius: 16,
    opacity: 0.35,
    elevation: 8,
    webShadow: '0px 12px 24px rgba(0, 0, 0, 0.35)'
  })
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  iconSizes,
  fonts,
  typography,
  shadows
};

export type Theme = typeof theme;