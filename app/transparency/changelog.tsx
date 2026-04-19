import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

const ENTRIES = [
  {
    version: 'v1.3.2',
    date: 'April 16, 2026',
    type: 'fix',
    changes: [
      'Fixed back button behavior on player profile screen',
      'Optimistic message send — messages appear instantly instead of waiting for server',
      'Fixed duplicate conversation creation when messaging from the same listing twice',
      'Added "You:" prefix to inbox preview for outgoing messages',
    ],
  },
  {
    version: 'v1.3.1',
    date: 'April 2026',
    type: 'release',
    changes: ['App Store global launch'],
  },
  {
    version: 'v1.3.0',
    date: 'April 2026',
    type: 'feat',
    changes: [
      'Trust strip on home screen: No RMT. No Data Selling. No Pay-to-Win Reputation.',
      'First-login disclosure modal — un-dismissable, requires checkbox acknowledgment',
      'Supporter rebrand — removed BEST VALUE / POPULAR badges',
      'Terms of Service page',
      'Privacy Policy page',
      'Mad Finger Games non-affiliation disclaimer on home screen',
      'Free message limit raised from 5 to 50 per day',
      'Verified Trader clause added to Supporter modal',
      'Removed priority search ranking perks from Supporter tiers',
    ],
  },
  {
    version: 'v1.2.0',
    date: 'March 2026',
    type: 'feat',
    changes: [
      'LFG post duration changed to flat 24h for all tiers',
      'Per-tier active post limits: Free=2 · Supporter=5 · Lifetime=10',
      'Live countdown timer on each LFG card',
      'Post button shows used/limit count',
      'New posts blocked (not auto-deactivated) when at tier limit',
    ],
  },
  {
    version: 'v1.1.0',
    date: 'February 2026',
    type: 'feat',
    changes: [
      'Completed trades feed on Home screen',
      'Price history screens per item and per category',
      'Listing confirmation dialog before posting',
      '"Want in return" field is now required on listings',
    ],
  },
  {
    version: 'v1.0.0-beta',
    date: 'January 2026',
    type: 'release',
    changes: [
      'Core trading: listings, browse, inbox, conversations',
      'Saved listings',
      'LFG posts',
      'Profile, reputation, Verified Trader system',
      'Admin support ticket queue',
      'Push notifications',
    ],
  },
];

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  fix: { label: 'Fix', color: '#ef4444' },
  feat: { label: 'Feature', color: '#22c55e' },
  release: { label: 'Release', color: '#C8A84B' },
};

export default function ChangelogScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Changelog</Text>
        <Text style={styles.intro}>Every update to GZW Market, documented.</Text>

        {ENTRIES.map((entry) => {
          const type = TYPE_CONFIG[entry.type];
          return (
            <View key={entry.version} style={styles.entry}>
              <View style={styles.entryHeader}>
                <Text style={styles.version}>{entry.version}</Text>
                <View style={[styles.badge, { backgroundColor: type.color + '22' }]}>
                  <Text style={[styles.badgeText, { color: type.color }]}>{type.label}</Text>
                </View>
                <Text style={styles.date}>{entry.date}</Text>
              </View>
              {entry.changes.map((change, i) => (
                <View key={i} style={styles.changeRow}>
                  <Text style={styles.changeBullet}>•</Text>
                  <Text style={styles.changeText}>{change}</Text>
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.md },
    pageTitle: {
      fontSize: Typography.sizes.xxl,
      fontWeight: Typography.weights.bold,
      color: c.text,
      marginTop: Spacing.lg,
    },
    intro: { fontSize: Typography.sizes.md, color: c.textSecondary },
    entry: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: Spacing.md,
      gap: Spacing.xs,
    },
    entryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.xs,
      flexWrap: 'wrap',
    },
    version: {
      fontSize: Typography.sizes.md,
      fontWeight: Typography.weights.bold,
      color: c.text,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
    },
    badgeText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },
    date: { fontSize: Typography.sizes.sm, color: c.textMuted, marginLeft: 'auto' },
    changeRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
    changeBullet: { fontSize: Typography.sizes.sm, color: c.textMuted, width: 12 },
    changeText: { flex: 1, fontSize: Typography.sizes.sm, color: c.textSecondary, lineHeight: 20 },
  });
}
