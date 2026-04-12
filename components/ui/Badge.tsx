import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { ThemeColors, BorderRadius, Typography, Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { FACTIONS } from '@/constants/factions';
import { CATEGORIES } from '@/constants/categories';
import { FactionSlug, Category } from '@/types';

interface BadgeProps {
  label: string;
  color: string;
  style?: ViewStyle;
  size?: 'sm' | 'md';
}

export function Badge({ label, color, style, size = 'sm' }: BadgeProps) {
  return (
    <View
      style={[
        badgeStyles.base,
        { backgroundColor: color + '22', borderColor: color + '55' },
        size === 'md' && badgeStyles.md,
        style,
      ]}
    >
      <Text style={[badgeStyles.text, { color }, size === 'md' && badgeStyles.textMd]}>
        {label}
      </Text>
    </View>
  );
}

export function FactionBadge({
  faction,
  style,
  size,
}: {
  faction: FactionSlug;
  style?: ViewStyle;
  size?: 'sm' | 'md';
}) {
  const f = FACTIONS[faction];
  return <Badge label={f.shortName} color={f.color} style={style} size={size} />;
}

export function CategoryBadge({
  category,
  style,
  size,
}: {
  category: Category;
  style?: ViewStyle;
  size?: 'sm' | 'md';
}) {
  const { colors } = useTheme();
  const c = CATEGORIES[category];
  return <Badge label={c.name} color={colors.accent} style={style} size={size} />;
}

// Badge base styles are layout-only (no theme colors) — kept static
const badgeStyles = StyleSheet.create({
  base: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  md: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.md,
  },
  text: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textMd: { fontSize: Typography.sizes.sm },
});
