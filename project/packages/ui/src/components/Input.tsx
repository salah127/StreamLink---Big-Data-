import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TextStyle,
    View,
    ViewStyle
} from 'react-native';
import { theme } from '../theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'outline';
  size?: 'medium' | 'large';
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  variant = 'default',
  size = 'medium',
  containerStyle,
  labelStyle,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const inputStyle = [
    styles.input,
    styles[variant],
    styles[`${size}Size`],
    isFocused ? styles.focused : undefined,
    error ? styles.error : undefined,
    style
  ];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>{label}</Text>
      )}
      <TextInput
        style={inputStyle}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholderTextColor={theme.colors.textMuted}
        {...props}
      />
      {(error || helperText) && (
        <Text style={[styles.helperText, error ? styles.errorText : undefined]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md
  },
  
  label: {
    ...theme.typography.bodySmall,
    marginBottom: theme.spacing.xs,
    color: theme.colors.textSecondary
  },
  
  input: {
    borderRadius: theme.borderRadius.md,
    color: theme.colors.textPrimary,
    fontSize: 16
  },
  
  // Variants
  default: {
    backgroundColor: theme.colors.surface,
    borderWidth: 0
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  
  // Sizes
  mediumSize: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    minHeight: 48
  },
  largeSize: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    minHeight: 56
  },
  
  // States
  focused: {
    borderColor: theme.colors.primary,
    borderWidth: 1
  },
  error: {
    borderColor: theme.colors.error,
    borderWidth: 1
  },
  
  helperText: {
    ...theme.typography.caption,
    marginTop: theme.spacing.xs,
    color: theme.colors.textMuted
  },
  errorText: {
    color: theme.colors.error
  }
});