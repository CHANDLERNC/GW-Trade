import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

const FAQ_ITEMS = [
  {
    q: 'Is this app safe to use?',
    a: 'Yes. GZW Market uses Supabase for secure data storage with row-level security. We do not collect location data, contacts, or anything beyond what is needed to run the platform. We publish exactly what we collect in the Privacy Policy.',
  },
  {
    q: 'Who built and runs GZW Market?',
    a: 'GZW Market is built and maintained by a small team of Gray Zone Warfare players. See the Team page for names and roles. There is no company, no investors, and no monetization beyond optional supporter tiers that cover hosting costs.',
  },
  {
    q: 'Is this affiliated with Mad Finger Games?',
    a: 'No. GZW Market is an unofficial fan-made community tool. We are not affiliated with, endorsed by, or sponsored by Mad Finger Games. Gray Zone Warfare is a trademark of Mad Finger Games.',
  },
  {
    q: 'What is Supporter and what does it give me?',
    a: 'Supporter is an optional contribution that helps cover server costs. It gives convenience perks only: higher listing limits, a cosmetic badge, and longer post durations. It does not affect your reputation, trade visibility, or standing in any way.',
  },
  {
    q: 'Where does supporter money go?',
    a: "100% goes toward infrastructure costs — Supabase hosting, push notifications, domain, and error monitoring. Any surplus rolls over to cover future months. We publish a monthly breakdown on the Keep The Lights On page. No founder draws.",
  },
  {
    q: 'Who pays for development time?',
    a: "The development team contributes their time voluntarily. No supporter funds pay for developer time. If that ever changes, we'll announce it publicly.",
  },
  {
    q: 'Can I buy a Verified Trader badge?',
    a: 'No. Never. Not in any form. Verified Trader status is computed entirely from your completed trade history and account tenure. There is no purchase path, shortcut, or exception.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Go to Profile → scroll to bottom → Delete My Data. This starts a 7-day grace period. During those 7 days you can cancel by signing back in. After 7 days, your account and all associated data are permanently deleted.',
  },
  {
    q: 'What happens if I get scammed?',
    a: 'Tap the ⚐ flag icon on the listing or the scammer\'s profile and file a report. Select "Scam" as the reason and include as much detail as possible. We review every report within 48 hours. Verified scam attempts result in a permanent ban.',
  },
  {
    q: 'Is my data sold to third parties?',
    a: 'No. We do not sell, rent, or share your data with advertisers, data brokers, or third parties. The only external service that touches your data is Supabase, our hosting provider, which is covered in the Privacy Policy.',
  },
  {
    q: 'What data do you collect?',
    a: 'Email address, username, your listings, messages, trades, and ratings. No location, no contacts, no device identifiers beyond push notification tokens (optional). Full list in the Privacy Policy.',
  },
  {
    q: 'How do I report a bad actor?',
    a: 'Tap the ⚐ flag icon on any listing or player profile. Choose the reason that best describes the situation — scam, harassment, spam, or inappropriate. Add details if you can. Reports are reviewed by the moderation team within 48 hours.',
  },
];

export default function FAQScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FAQ</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Frequently asked questions about GZW Market, how it works, and what we do with your data.
        </Text>

        {FAQ_ITEMS.map((item, i) => {
          const isOpen = expanded === i;
          return (
            <TouchableOpacity
              key={i}
              style={[styles.item, isOpen && styles.itemOpen]}
              onPress={() => setExpanded(isOpen ? null : i)}
              activeOpacity={0.8}
            >
              <View style={styles.itemTop}>
                <Text style={[styles.question, isOpen && styles.questionOpen]}>{item.q}</Text>
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={isOpen ? colors.accent : colors.textMuted}
                />
              </View>
              {isOpen && (
                <Text style={styles.answer}>{item.a}</Text>
              )}
            </TouchableOpacity>
          );
        })}

        <Text style={styles.footer}>
          Still have questions? Contact us at support@gzwmarket.com or ask in the Discord.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.surfaceBorder,
    },
    headerTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: c.text },

    scroll: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.xxl },

    intro: {
      fontSize: Typography.sizes.sm,
      color: c.textSecondary,
      lineHeight: 21,
      marginBottom: Spacing.sm,
    },

    item: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    itemOpen: {
      borderColor: c.accent + '55',
      backgroundColor: c.accent + '08',
    },
    itemTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: Spacing.sm,
    },
    question: {
      flex: 1,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.weights.semibold,
      color: c.text,
      lineHeight: 20,
    },
    questionOpen: { color: c.accent },
    answer: {
      fontSize: Typography.sizes.sm,
      color: c.textSecondary,
      lineHeight: 21,
    },

    footer: {
      fontSize: Typography.sizes.sm,
      color: c.textMuted,
      textAlign: 'center',
      marginTop: Spacing.md,
      lineHeight: 20,
    },
  });
}
