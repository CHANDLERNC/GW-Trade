import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

const STRIKE_OFFENSES = [
  { label: 'Strike 1', items: ['Misleading listing description (first offense)', 'Late or no-show trade (first offense)', 'Rude or hostile communication (first offense)', 'Leaving an inaccurate rating in bad faith'] },
  { label: 'Strike 2', items: ['Repeat offense of any Strike 1 violation', 'Minor scam attempt (caught before completion)', 'Coordinated reputation farming'] },
  { label: 'Strike 3 → Permanent ban', items: ['Third offense of any kind', 'Serious scam attempt or trade fraud', 'Harassment, hate speech, or doxxing', 'Impersonation of another user or moderator'] },
];

const INSTANT_BAN = [
  'Real money trading (RMT) in any form — cash, gift cards, crypto, or goods',
  'Violent threats directed at any person',
  'Posting or distributing private personal information (doxxing)',
  'Child sexual abuse material (CSAM)',
];

export default function CommunityRulesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Community Rules</Text>
        <Text style={styles.updated}>Effective April 18, 2026</Text>

        <Text style={styles.intro}>
          GZW Market is a community platform built on trust. These rules exist to keep trades
          fair, keep conversations civil, and keep real-money trading off the platform permanently.
        </Text>

        <Text style={styles.sectionTitle}>The Core Rules</Text>
        <View style={styles.ruleList}>
          {[
            'Trade honestly. List items accurately. Honor agreements.',
            'Communicate in good faith. No harassment, threats, or hate speech.',
            'No real money trading (RMT). Ever. No exceptions.',
            'One account per person. No multi-accounting or reputation farming.',
            'No bots, scrapers, or unauthorized automated access.',
            'No impersonating other users, moderators, or Mad Finger Games staff.',
          ].map((rule, i) => (
            <View key={i} style={styles.ruleRow}>
              <Text style={styles.ruleBullet}>{i + 1}.</Text>
              <Text style={styles.ruleText}>{rule}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Strike System</Text>
        <Text style={styles.body}>
          Most violations follow a three-strike system. Strikes are tied to your account and
          visible to you in Account Standing (Profile → Settings → Account Standing). Strikes
          expire after 365 days unless otherwise noted.
        </Text>

        {STRIKE_OFFENSES.map((tier) => (
          <View key={tier.label} style={styles.strikeCard}>
            <Text style={styles.strikeLabel}>{tier.label}</Text>
            {tier.items.map((item, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
        ))}

        <Text style={styles.sectionTitle}>Instant Permanent Ban — No Appeal</Text>
        <Text style={styles.body}>
          The following violations result in an immediate permanent ban. No warnings. No appeal.
        </Text>
        <View style={styles.dangerCard}>
          {INSTANT_BAN.map((item, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.dangerBullet}>✕</Text>
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Appeal Process</Text>
        <Text style={styles.body}>
          Strike 1, Strike 2, and temporary suspensions may be appealed within 30 days of
          issuance. Instant-ban offenses are not eligible for appeal.
        </Text>
        <Text style={styles.body}>
          To file an appeal, email{' '}
          <Text style={styles.accent}>appeals@gzwmarket.com</Text> with the subject line
          "Account Appeal — [your username]". Include your account username, the date of the
          action, and your explanation.
        </Text>
        <Text style={styles.body}>
          We commit to reviewing every appeal within 7 days. You will receive a response
          regardless of outcome.
        </Text>

        <Text style={styles.sectionTitle}>Reporting Bad Actors</Text>
        <Text style={styles.body}>
          Use the report button (⚑) on any listing, profile, or message thread. We review every
          report within 48 hours. Reports are anonymous — the reported user is never told who
          reported them.
        </Text>

        <Text style={styles.sectionTitle}>Moderation Team</Text>
        <Text style={styles.body}>
          Moderation decisions are made by human moderators, not automated systems. Moderators
          are listed on the Moderator Team page and are held to the same rules as all users.
          A moderator who violates these rules is subject to the same strike system.
        </Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Questions? Contact us at{' '}
            <Text style={styles.accent}>support@gzwmarket.com</Text>
          </Text>
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
    intro: {
      fontSize: Typography.sizes.md,
      color: c.textSecondary,
      lineHeight: 24,
    },
    sectionTitle: {
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.weights.semibold,
      color: c.text,
      marginTop: Spacing.sm,
    },
    body: {
      fontSize: Typography.sizes.md,
      color: c.textSecondary,
      lineHeight: 24,
    },
    accent: { color: c.accent },
    ruleList: { gap: Spacing.sm },
    ruleRow: { flexDirection: 'row', gap: Spacing.sm },
    ruleBullet: {
      fontSize: Typography.sizes.md,
      color: c.accent,
      fontWeight: Typography.weights.semibold,
      width: 20,
    },
    ruleText: { flex: 1, fontSize: Typography.sizes.md, color: c.text, lineHeight: 22 },
    strikeCard: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: Spacing.md,
      gap: Spacing.xs,
    },
    strikeLabel: {
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.weights.semibold,
      color: c.accent,
      marginBottom: Spacing.xs,
    },
    dangerCard: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: '#7f1d1d55',
      padding: Spacing.md,
      gap: Spacing.xs,
    },
    bulletRow: { flexDirection: 'row', gap: Spacing.sm },
    bullet: { fontSize: Typography.sizes.md, color: c.textMuted, width: 16 },
    dangerBullet: { fontSize: Typography.sizes.sm, color: '#ef4444', width: 16, marginTop: 2 },
    bulletText: { flex: 1, fontSize: Typography.sizes.sm, color: c.textSecondary, lineHeight: 20 },
    footer: {
      paddingTop: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: c.surfaceBorder,
      marginTop: Spacing.md,
    },
    footerText: { fontSize: Typography.sizes.sm, color: c.textMuted, textAlign: 'center' },
  });
}
