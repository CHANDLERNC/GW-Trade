import React from 'react';
import { View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GZW } from '@/constants/theme';

const LIFETIME_COLOR = '#FFD700';
export const EARLY_ADOPTER_COLOR = '#9C27B0'; // permanent purple

interface Props {
  isLifetime?: boolean;
  isMember?: boolean;
  isEarlyAdopter?: boolean;
  size?: number;
}

/**
 * Inline tier icon shown next to a username.
 * Priority: Lifetime > Member > Early Adopter
 * Early adopter icon persists even when shown alongside a paid tier.
 */
export function MemberIcon({ isLifetime, isMember, isEarlyAdopter, size = 14 }: Props) {
  return (
    <View style={styles.row}>
      {isLifetime && (
        <Ionicons name="infinite" size={size} color={LIFETIME_COLOR} />
      )}
      {!isLifetime && isMember && (
        <Ionicons name="shield-checkmark" size={size} color={GZW.accent} />
      )}
      {isEarlyAdopter && (
        <Ionicons name="rocket" size={size} color={EARLY_ADOPTER_COLOR} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
});
