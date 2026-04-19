import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

const COSTS = [
  { label: 'Supabase (Pro tier)', amount: '$25.00' },
  { label: 'Supabase compute add-on', amount: '$50.00' },
  { label: 'Database storage (40 GB)', amount: '$10.00' },
  { label: 'Push notifications (Expo)', amount: '$0.00' },
  { label: 'Domain + SSL', amount: '$2.00' },
  { label: 'Error monitoring (Sentry)', amount: '$26.00' },
  { label: 'Email transactional (Resend)', amount: '$20.00' },
  { label: 'Subscription management (RevenueCat)', amount: '$57.00' },
  { label: 'App Store / Play developer (annualized)', amount: '$10.00' },
];

const TOTAL = '$200.00';
const TOTAL_NUM = 200.00;

// Apple takes 30% of every App Store purchase. $1.99 × 0.70 = $1.39 net to us.
const NET_PER_MONTHLY_USER = 1.39;
const BREAKEVEN_SUPPORTERS = Math.ceil(TOTAL_NUM / NET_PER_MONTHLY_USER); // 144

export default function CostsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Keep The Lights On</Text>
        <Text style={styles.updated}>Updated: April 2026</Text>

        <Text style={styles.intro}>
          This page shows exactly what GZW Market costs to run each month and what supporters
          contribute. No black box.
        </Text>

        <Text style={styles.sectionTitle}>Monthly Operating Costs</Text>
        <View style={styles.table}>
          {COSTS.map((row) => (
            <View key={row.label} style={styles.tableRow}>
              <Text style={styles.tableLabel}>{row.label}</Text>
              <Text style={styles.tableAmount}>{row.amount}</Text>
            </View>
          ))}
          <View style={styles.tableDivider} />
          <View style={styles.tableRow}>
            <Text style={styles.totalLabel}>Total monthly cost</Text>
            <Text style={styles.totalAmount}>{TOTAL}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>This Month</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Active supporters</Text>
            <Text style={styles.tablePlaceholder}>—</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Revenue after Apple's 30% fee</Text>
            <Text style={styles.tablePlaceholder}>—</Text>
          </View>
          <View style={styles.tableDivider} />
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Deficit / Surplus</Text>
            <Text style={styles.tablePlaceholder}>—</Text>
          </View>
        </View>

        {/* Funding bar */}
        <View style={styles.fundingCard}>
          <View style={styles.fundingHeader}>
            <Text style={styles.fundingLabel}>Monthly cost covered</Text>
            <Text style={styles.fundingPct}>—%</Text>
          </View>
          <View style={styles.fundingTrack}>
            <View style={[styles.fundingFill, { width: '0%' }]} />
          </View>
          <Text style={styles.fundingNote}>
            Each monthly supporter contributes{' '}
            <Text style={styles.fundingHighlight}>${NET_PER_MONTHLY_USER.toFixed(2)}</Text>
            {' '}after Apple's 30% fee. Break-even at{' '}
            <Text style={styles.fundingHighlight}>{BREAKEVEN_SUPPORTERS} supporters</Text>.
          </Text>
        </View>
        <Text style={styles.note}>Updated manually each month. Live pull coming with RevenueCat.</Text>

        <Text style={styles.sectionTitle}>What Surplus Goes Toward</Text>
        <View style={styles.priorityList}>
          {[
            'Next month\'s infrastructure costs',
            'Infrastructure upgrades (storage, compute)',
            'Future development time',
          ].map((item, i) => (
            <View key={i} style={styles.priorityRow}>
              <Text style={styles.priorityNum}>{i + 1}</Text>
              <Text style={styles.priorityText}>{item}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.body}>
          There is no founder draw. No one is paid from supporter funds. All money goes to
          keeping the platform running.
        </Text>

        <Text style={styles.sectionTitle}>A Note From the Team</Text>
        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            GZW Market started as a weekend project because the in-game trading scene needed a
            better home. We don't run ads, we don't sell data, and we don't have investors.
            If you've found value here, Supporter helps make sure the servers stay on.
            If you haven't, everything stays free — that's the deal.
          </Text>
          <Text style={styles.noteSignature}>— The GZW Market team, April 2026</Text>
        </View>
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
    updated: { fontSize: Typography.sizes.sm, color: c.textMuted },
    intro: { fontSize: Typography.sizes.md, color: c.textSecondary, lineHeight: 24 },
    sectionTitle: {
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.weights.semibold,
      color: c.text,
      marginTop: Spacing.sm,
    },
    body: { fontSize: Typography.sizes.md, color: c.textSecondary, lineHeight: 24 },
    table: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      overflow: 'hidden',
    },
    tableRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.surfaceBorder,
    },
    tableDivider: { height: 1, backgroundColor: c.accent + '44' },
    tableLabel: { fontSize: Typography.sizes.sm, color: c.textSecondary, flex: 1 },
    tableAmount: {
      fontSize: Typography.sizes.sm,
      color: c.text,
      fontWeight: Typography.weights.semibold,
      fontVariant: ['tabular-nums'],
    },
    tablePlaceholder: { fontSize: Typography.sizes.sm, color: c.textMuted },
    totalLabel: {
      fontSize: Typography.sizes.sm,
      color: c.text,
      fontWeight: Typography.weights.semibold,
      flex: 1,
    },
    totalAmount: {
      fontSize: Typography.sizes.md,
      color: c.accent,
      fontWeight: Typography.weights.bold,
    },
    note: { fontSize: Typography.sizes.xs, color: c.textMuted, marginTop: -Spacing.xs },
    fundingCard: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    fundingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    fundingLabel: { fontSize: Typography.sizes.sm, color: c.textSecondary, fontWeight: Typography.weights.semibold },
    fundingPct: { fontSize: Typography.sizes.sm, color: c.accent, fontWeight: Typography.weights.bold },
    fundingTrack: {
      height: 6,
      backgroundColor: c.surfaceBorder,
      borderRadius: 3,
      overflow: 'hidden',
    },
    fundingFill: { height: '100%', backgroundColor: c.accent, borderRadius: 3 },
    fundingNote: { fontSize: Typography.sizes.xs, color: c.textMuted, lineHeight: 18 },
    fundingHighlight: { color: c.accent, fontWeight: Typography.weights.semibold },
    priorityList: { gap: Spacing.xs },
    priorityRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
    priorityNum: {
      fontSize: Typography.sizes.sm,
      color: c.accent,
      fontWeight: Typography.weights.bold,
      width: 20,
    },
    priorityText: { flex: 1, fontSize: Typography.sizes.md, color: c.textSecondary },
    noteCard: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    noteText: { fontSize: Typography.sizes.md, color: c.textSecondary, lineHeight: 24 },
    noteSignature: { fontSize: Typography.sizes.sm, color: c.textMuted, fontStyle: 'italic' },
  });
}
