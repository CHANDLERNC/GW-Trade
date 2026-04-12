import React, { useMemo } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ThemeColors, BorderRadius, Typography, Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isDisabled = disabled || loading;

  const containerStyle = [
    styles.base,
    styles[variant],
    sizeStyles[size],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ];

  const textVariantStyle = {
    primary: styles.text_primary,
    secondary: styles.text_secondary,
    ghost: styles.text_ghost,
    danger: styles.text_danger,
  }[variant];

  const labelStyle = [
    styles.text,
    textVariantStyle,
    textSizeStyles[size],
    textStyle,
  ] as TextStyle[];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.background : colors.accent}
        />
      ) : (
        <Text style={labelStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const sizeStyles = StyleSheet.create({
  sm: { paddingHorizontal: Spacing.md, paddingVertical: 7, minHeight: 34 },
  md: { paddingHorizontal: Spacing.lg, paddingVertical: 11, minHeight: 44 },
  lg: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, minHeight: 54 },
});

const textSizeStyles = StyleSheet.create({
  sm: { fontSize: Typography.sizes.sm },
  md: { fontSize: Typography.sizes.md },
  lg: { fontSize: Typography.sizes.lg },
});

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    base: { borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
    fullWidth: { width: '100%' },
    disabled: { opacity: 0.45 },
    primary: { backgroundColor: c.accent },
    secondary: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.surfaceBorder },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: c.danger },
    text: { fontWeight: Typography.weights.semibold },
    text_primary: { color: c.background },
    text_secondary: { color: c.text },
    text_ghost: { color: c.accent },
    text_danger: { color: '#FFFFFF' },
  });
}
