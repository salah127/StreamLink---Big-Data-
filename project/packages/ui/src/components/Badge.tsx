import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { theme } from '../theme';

export interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'platform';
  platform?: 'twitch' | 'youtube' | 'kick' | 'instagram' | 'tiktok' | 'x';
  size?: 'small' | 'medium';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  platform,
  size = 'medium',
  style,
  textStyle
}) => {
  const badgeStyle = [
    styles.base,
    styles[variant],
    platform && styles.platform,
    platform && { backgroundColor: theme.colors[platform] },
    styles[`${size}Size`],
    style
  ];

  const badgeTextStyle = [
    styles.text,
    styles[`${size}Text`],
    textStyle
  ];

  return (
    <View style={badgeStyle}>
      <Text style={badgeTextStyle}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start'
  },
  
  // Variants
  primary: {
    backgroundColor: theme.colors.primary
  },
  secondary: {
    backgroundColor: theme.colors.surface
  },
  success: {
    backgroundColor: theme.colors.success
  },
  warning: {
    backgroundColor: theme.colors.warning
  },
  error: {
    backgroundColor: theme.colors.error
  },
  platform: {
    // Dynamic color based on platform prop
  },
  
  // Sizes
  smallSize: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs
  },
  mediumSize: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm
  },
  
  // Text
  text: {
    ...theme.typography.badge,
    textAlign: 'center'
  },
  smallText: {
    fontSize: 9,
    lineHeight: 12
  },
  mediumText: {
    fontSize: 11,
    lineHeight: 14
  }
});