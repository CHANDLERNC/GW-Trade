import React, { useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { FACTION_LIST } from '@/constants/factions';

export default function WelcomeScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <View style={styles.classifiedBar}>
        <View style={styles.classifiedDot} />
        <Text style={styles.classifiedText}>CLASSIFIED — OPERATOR ACCESS ONLY</Text>
        <View style={styles.classifiedDot} />
      </View>

      <View style={styles.heroSection}>
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />

        <Text style={styles.tagline}>GRAY ZONE</Text>
        <Text style={styles.title}>MARKET</Text>
        <View style={styles.titleRule} />
        <Text style={styles.subtitle}>
          Player-to-player trading for{'\n'}Gray Zone Warfare
        </Text>
      </View>

      <View style={styles.factionsSection}>
        <Text style={styles.sectionLabel}>ACTIVE FACTIONS</Text>
        <View style={styles.factionRow}>
          {FACTION_LIST.map((f) => (
            <View key={f.id} style={[styles.factionPill, { borderColor: f.color + '66' }]}>
              <View style={[styles.factionDot, { backgroundColor: f.color }]} />
              <Text style={[styles.factionLabel, { color: f.color }]}>{f.shortName}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.features}>
        <View style={styles.briefingHeader}>
          <View style={styles.briefingLine} />
          <Text style={styles.briefingLabel}>MISSION BRIEFING</Text>
          <View style={styles.briefingLine} />
        </View>
        {['Trade Keys, Gear & Items', 'Browse by faction', 'Direct messaging'].map((f) => (
          <View key={f} style={styles.featureRow}>
            <Text style={styles.featureBullet}>▸</Text>
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          title="Create Account"
          onPress={() => router.push('/(auth)/sign-up')}
          fullWidth
          size="lg"
        />
        <Button
          title="Sign In"
          onPress={() => router.push('/(auth)/sign-in')}
          variant="secondary"
          fullWidth
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
      paddingHorizontal: Spacing.lg,
      justifyContent: 'space-between',
      paddingBottom: Spacing.xl,
    },
    classifiedBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.xs + 2,
      borderBottomWidth: 1,
      borderBottomColor: c.accent + '40',
      marginHorizontal: -Spacing.lg,
      paddingHorizontal: Spacing.lg,
    },
    classifiedDot: {
      width: 5,
      height: 5,
      backgroundColor: c.accent,
    },
    classifiedText: {
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.weights.bold,
      color: c.accent,
      letterSpacing: 2,
    },
    heroSection: {
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.lg,
      paddingHorizontal: Spacing.md,
      gap: Spacing.xs,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      position: 'relative',
    },
    corner: {
      position: 'absolute',
      width: 14,
      height: 14,
      borderColor: c.accent,
    },
    cornerTL: { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2 },
    cornerTR: { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2 },
    cornerBL: { bottom: -1, left: -1, borderBottomWidth: 2, borderLeftWidth: 2 },
    cornerBR: { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2 },
    tagline: {
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.weights.bold,
      color: c.accent,
      letterSpacing: 4,
    },
    title: {
      fontSize: 52,
      fontWeight: Typography.weights.heavy,
      color: c.text,
      letterSpacing: -1,
      lineHeight: 56,
    },
    titleRule: {
      height: 1,
      backgroundColor: c.accent + '50',
      marginVertical: Spacing.sm,
    },
    subtitle: {
      fontSize: Typography.sizes.lg,
      color: c.textSecondary,
      lineHeight: 26,
    },
    factionsSection: {
      gap: Spacing.sm,
    },
    sectionLabel: {
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.weights.bold,
      color: c.textMuted,
      letterSpacing: 2,
    },
    factionRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    factionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      borderWidth: 1,
      borderRadius: BorderRadius.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs + 2,
    },
    factionDot: {
      width: 6,
      height: 6,
      borderRadius: 0,
    },
    factionLabel: {
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.weights.bold,
      letterSpacing: 0.5,
    },
    features: {
      gap: Spacing.md,
    },
    briefingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    briefingLine: {
      flex: 1,
      height: 1,
      backgroundColor: c.surfaceBorder,
    },
    briefingLabel: {
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.weights.bold,
      color: c.textMuted,
      letterSpacing: 2,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    featureBullet: {
      fontSize: Typography.sizes.sm,
      color: c.accent,
      fontWeight: Typography.weights.bold,
      width: 14,
    },
    featureText: {
      fontSize: Typography.sizes.md,
      color: c.textSecondary,
    },
    actions: {
      gap: Spacing.sm,
    },
  });
}
