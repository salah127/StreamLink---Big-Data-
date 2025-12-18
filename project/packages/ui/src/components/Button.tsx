import React, { ReactNode } from 'react';
import {
    ActivityIndicator,
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';
import { theme } from '../theme';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  contentStyle,
  children
}) => {
  const buttonStyle = [
    styles.base,
    styles.shadow,
    styles[variant],
    styles[`${size}Size`],
    disabled && styles.disabled,
    style
  ];

  const buttonTextStyle = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle
  ];

  const hasCustomContent = React.Children.count(children) > 0;

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? theme.colors.primaryForeground : theme.colors.primary} 
          size="small" 
        />
      ) : hasCustomContent ? (
        <View style={[styles.content, contentStyle]}>{children}</View>
      ) : (
        <Text style={buttonTextStyle} allowFontScaling>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  shadow: {
    ...theme.shadows.small
  },
  content: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  // Variants
  primary: {
    backgroundColor: theme.colors.primary
  },
  secondary: {
    backgroundColor: theme.colors.surface
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary
  },
  ghost: {
    backgroundColor: 'transparent'
  },
  
  // Sizes
  smallSize: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 36
  },
  mediumSize: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minHeight: 48
  },
  largeSize: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    minHeight: 56
  },
  
  // Text styles
  text: {
    ...theme.typography.button,
    textAlign: 'center',
    flexShrink: 1,
    flexWrap: 'wrap'
  },
  primaryText: {
    color: theme.colors.primaryForeground
  },
  secondaryText: {
    color: theme.colors.textPrimary
  },
  outlineText: {
    color: theme.colors.primary
  },
  ghostText: {
    color: theme.colors.primary
  },
  
  // Size text
  smallText: {
    fontSize: 12,
    lineHeight: 18
  },
  mediumText: {
    fontSize: 14,
    lineHeight: 20
  },
  largeText: {
    fontSize: 16,
    lineHeight: 22
  },
  
  // Disabled states
  disabled: {
    backgroundColor: theme.colors.surfaceElevated,
    opacity: 0.6
  },
  disabledText: {
    color: theme.colors.textDisabled
  }
});