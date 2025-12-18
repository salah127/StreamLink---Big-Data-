import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../theme';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outline';
  padding?: 'none' | 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'medium',
  style
}) => {
  const cardStyle = [
    styles.base,
    styles[variant],
    styles[`${padding}Padding`],
    style
  ];

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden'
  },
  
  // Variants
  default: {
    backgroundColor: theme.colors.surface
  },
  elevated: {
    backgroundColor: theme.colors.surfaceElevated,
    ...theme.shadows.medium
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  
  // Padding
  nonePadding: {
    padding: 0
  },
  smallPadding: {
    padding: theme.spacing.sm
  },
  mediumPadding: {
    padding: theme.spacing.md
  },
  largePadding: {
    padding: theme.spacing.lg
  }
});