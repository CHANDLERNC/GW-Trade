import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

const SECTIONS = [
  {
    heading: 'What We Collect',
    items: [
      'Your email address and username',
      'Listings you post and messages you send',
      'Your trade history and ratings',
      'Device information (OS type and version) for bug reporting',
      'IP address, used only for rate limiting and abuse prevention',
    ],
  },
  {
    heading: "What We Don't Collect",
    items: [
      'Your location',
      'Your contacts or address book',
      'Your browsing activity outside the app',
      'Analytics about your in-game behavior',
      'Any information about your real identity beyond your email',
    ],
  },
  {
    heading: 'Why We Collect It',
    body: 'We collect the minimum information needed to operate the platform: to identify your account, deliver messages, record trade history, prevent abuse, and contact you about account issues.',
  },
  {
    heading: 'How Long We Keep It',
    items: [
      'Active accounts: data retained for as long as your account is open',
      'Deleted accounts: personal data hard-deleted within 30 days of deletion request',
      'Support tickets: retained for 1 year for dispute resolution',
      'Anonymized trade history (item names, ratings) retained indefinitely to preserve other users\' records',
    ],
  },
  {
    heading: 'Who Can See Your Data',
    items: [
      'You — all your own data is visible to you',
      'Moderators — can view reported content when investigating a report',
      'Supabase — our database host processes data on our behalf under their Data Processing Agreement',
      'No advertisers. No data brokers. Not Mad Finger Games.',
    ],
  },
  {
    heading: 'We Do Not Sell Your Data',
    body: 'We do not sell, rent, or share your personal data with third parties for any commercial purpose. Not with advertisers. Not with data brokers. Not with Mad Finger Games. Not with anyone.',
  },
  {
    heading: 'Your Rights',
    items: [
      'Access: request a copy of the data we hold about you',
      'Export: download your trade history and profile data',
      'Delete: request deletion of your account and personal data via Profile → Settings → Privacy',
      'Correction: update your profile information at any time',
    ],
  },
  {
    heading: 'Security',
    body: 'All data is encrypted in transit using TLS 1.2+. All data is encrypted at rest using AES-256, provided by our database host Supabase. Passwords are hashed using bcrypt — not even we can see your password.',
  },
  {
    heading: 'No Analytics or Tracking',
    body: 'GZW Market uses no third-party analytics, no tracking cookies, and no advertising SDKs. We do not track you across apps or websites.',
  },
  {
    heading: 'Contact',
    body: 'Privacy questions: privacy@gzwmarket.com\nData deletion requests: Profile → Settings → Privacy → Delete My Data',
  },
];

export default function PrivacyScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.meta}>Last updated: April 2026</Text>

        <View style={styles.highlight}>
          <Text style={styles.highlightText}>
            Short version: We collect only what's needed to run the app. We don't sell your data. Ever.
          </Text>
        </View>

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

        <Text style={styles.footer}>
          Questions? Contact us at privacy@gzwmarket.com
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
    highlight: {
      backgroundColor: c.accent + '18',
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.accent + '44',
      padding: Spacing.md,
    },
    highlightText: {
      fontSize: Typography.sizes.sm,
      color: c.accent,
      lineHeight: 22,
      fontWeight: Typography.weights.semibold,
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
    footer: {
      fontSize: Typography.sizes.xs,
      color: c.textMuted,
      textAlign: 'center',
      paddingTop: Spacing.sm,
    },
  });
}
