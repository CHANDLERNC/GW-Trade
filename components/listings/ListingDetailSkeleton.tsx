import React, { useRef, useEffect } from 'react';
import { View, ScrollView, Animated } from 'react-native';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export function ListingDetailSkeleton() {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.85, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 650, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, gap: Spacing.lg }}
      scrollEnabled={false}
    >
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <Animated.View style={{ width: 68, height: 26, borderRadius: 4, backgroundColor: colors.surface, opacity }} />
        <Animated.View style={{ width: 68, height: 26, borderRadius: 4, backgroundColor: colors.surface, opacity }} />
      </View>
      <Animated.View style={{ height: 200, borderRadius: BorderRadius.lg, backgroundColor: colors.surface, opacity }} />
      <Animated.View style={{ width: '75%', height: 28, borderRadius: 6, backgroundColor: colors.surface, opacity }} />
      <Animated.View style={{ width: '40%', height: 14, borderRadius: 4, backgroundColor: colors.surface, opacity }} />
      <Animated.View style={{ height: 100, borderRadius: BorderRadius.lg, backgroundColor: colors.surface, opacity }} />
      <Animated.View style={{ height: 80, borderRadius: BorderRadius.lg, backgroundColor: colors.surface, opacity }} />
      <Animated.View style={{ height: 110, borderRadius: BorderRadius.lg, backgroundColor: colors.surface, opacity }} />
    </ScrollView>
  );
}
