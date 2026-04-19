import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

const SECTIONS = [
  {
    heading: 'Who We Are',
    body: 'GZW Market is an unofficial, fan-made community trading tool for Gray Zone Warfare. We are not affiliated with, endorsed by, or sponsored by Mad Finger Games. Gray Zone Warfare and all related names, logos, and imagery are trademarks of Mad Finger Games.',
  },
  {
    heading: 'Who Can Use This',
    body: 'You must be 13 or older to create an account. You must be 18 or older to make supporter purchases. You may only hold one account per person. Accounts are non-transferable.',
  },
  {
    heading: 'Acceptable Use',
    body: 'You agree to post listings honestly, communicate with other users in good faith, and rate trades accurately based on your genuine experience.',
  },
  {
    heading: 'Prohibited Conduct',
    items: [
      'Real money trading (RMT) of any kind — trading in-game items for real money, gift cards, cryptocurrency, or any goods or services of monetary value',
      'Scamming, bait-and-switch trades, or intentional misrepresentation of items',
      'Harassment, hate speech, doxxing, or threats directed at any user',
      'Account sharing, multi-accounting, or reputation farming',
      'Automated scraping, bots, or unauthorized API use',
      'Impersonation of other users, moderators, or Mad Finger Games staff',
    ],
  },
  {
    heading: 'Account Termination',
    body: 'Violations of these terms may result in a written warning, temporary suspension, or permanent ban depending on severity. Real money trading and threats of violence are grounds for immediate permanent ban with no appeal. We retain the right to terminate any account that violates these terms. On termination, your listings and messages are removed; anonymized trade history used by other users\' records is retained.',
  },
  {
    heading: 'Liability Limitations',
    body: 'GZW Market does not guarantee the outcome of any trade. Trade disputes are moderated on a best-effort basis. We provide the platform "as is" without warranty of any kind, including uptime guarantees. We are not liable for any in-game or real-world loss arising from trades conducted on this platform.',
  },
  {
    heading: 'Governing Law',
    body: 'These terms are governed by the laws of the jurisdiction in which GZW Market operates. Any disputes not resolved through our moderation process shall be subject to binding arbitration under those laws.',
  },
  {
    heading: 'Changes to These Terms',
    body: 'We will provide at least 14 days\' notice via an in-app banner before any material change to these terms takes effect. Continued use of the app after that date constitutes acceptance of the updated terms.',
  },
];

export default function TermsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.meta}>Last updated: April 2026</Text>

        {SECTIONS.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            {section.body ? (
              <Text style={styles.body}>{section.body}</Text>
            ) : null}
            {section.items ? (
              <View style={styles.list}>
                {section.items.map((item) => (
                  <View key={item} style={styles.listRow}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.listItem}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ))}

        <View style={styles.rmt}>
          <Text style={styles.rmtText}>
            Real money trading is a permanent ban with no appeal. This is the one rule we don't negotiate on.
          </Text>
        </View>

        <Text style={styles.footer}>
          Questions? Contact us at support@gzwmarket.com
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scroll: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.xxl,
      gap: Spacing.lg,
    },
    title: {
      fontSize: Typography.sizes.xxl,
      fontWeight: Typography.weights.bold,
      color: c.text,
    },
    meta: {
      fontSize: Typography.sizes.sm,
      color: c.textMuted,
      marginTop: -Spacing.sm,
    },
    section: {
      gap: Spacing.sm,
      paddingBottom: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.surfaceBorder,
    },
    sectionHeading: {
      fontSize: Typography.sizes.md,
      fontWeight: Typography.weights.bold,
      color: c.accent,
    },
    body: {
      fontSize: Typography.sizes.sm,
      color: c.textSecondary,
      lineHeight: 22,
    },
    list: { gap: Spacing.sm },
    listRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
    bullet: { fontSize: Typography.sizes.sm, color: c.textMuted, lineHeight: 22 },
    listItem: { flex: 1, fontSize: Typography.sizes.sm, color: c.textSecondary, lineHeight: 22 },
    rmt: {
      backgroundColor: c.danger + '18',
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.danger + '44',
      padding: Spacing.md,
    },
    rmtText: {
      fontSize: Typography.sizes.sm,
      color: c.danger,
      lineHeight: 22,
      fontWeight: Typography.weights.semibold,
    },
    footer: {
      fontSize: Typography.sizes.xs,
      color: c.textMuted,
      textAlign: 'center',
      paddingTop: Spacing.sm,
    },
  });
}
