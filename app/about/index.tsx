import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

const LINKS = [
  { label: 'The Team', description: 'Who builds and runs GZW Market', route: '/about/team' },
  { label: 'Moderation Team', description: 'Who reviews reports and issues strikes', route: '/about/moderators' },
  { label: 'FAQ', description: 'Common questions answered plainly', route: '/about/faq' },
  { label: 'Keep The Lights On', description: 'Monthly cost transparency', route: '/transparency/costs' },
  { label: 'Roadmap', description: 'What we\'re planning — vote on features', route: '/transparency/roadmap' },
  { label: 'Changelog', description: 'Every update, documented', route: '/transparency/changelog' },
  { label: 'Community Rules', description: 'Rules, strikes, and ban policy', route: '/legal/community-rules' },
  { label: 'Terms of Service', description: 'Usage terms and legal', route: '/legal/terms' },
  { label: 'Privacy Policy', description: 'What data we collect and why', route: '/legal/privacy' },
];

export default function AboutScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>About GZW Market</Text>

        <View style={styles.hero}>
          <Text style={styles.heroHeading}>A fan-made trading platform for Gray Zone Warfare.</Text>
          <Text style={styles.heroBody}>
            GZW Market is an unofficial community tool built by players, for players. We are not
            affiliated with, endorsed by, or sponsored by Mad Finger Games. Gray Zone Warfare is
            a trademark of Mad Finger Games.
          </Text>
        </View>

        <View style={styles.commitmentCard}>
          <Text style={styles.commitmentTitle}>Our Commitments</Text>
          {[
            'Your data is never sold or shared with advertisers.',
            'The free tier is fully functional — listing, trading, reputation, LFG.',
            'Verified Trader status cannot be purchased. Ever.',
            'Real money trading is permanently banned.',
            'We publish what this app costs to run every month.',
          ].map((item, i) => (
            <View key={i} style={styles.commitRow}>
              <Text style={styles.commitCheck}>✓</Text>
              <Text style={styles.commitText}>{item}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Links</Text>
        <View style={styles.linkList}>
          {LINKS.map((link) => (
            <TouchableOpacity
              key={link.route}
              style={styles.linkRow}
              onPress={() => router.push(link.route as any)}
              activeOpacity={0.7}
            >
              <View style={styles.linkContent}>
                <Text style={styles.linkLabel}>{link.label}</Text>
                <Text style={styles.linkDesc}>{link.description}</Text>
              </View>
              <Text style={styles.linkArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.version}>GZW Market v1.3.2 · Not affiliated with Mad Finger Games</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.lg },
    pageTitle: {
      fontSize: Typography.sizes.xxl,
      fontWeight: Typography.weights.bold,
      color: c.text,
      marginTop: Spacing.lg,
    },
    hero: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: Spacing.lg,
      gap: Spacing.sm,
    },
    heroHeading: {
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.weights.semibold,
      color: c.text,
      lineHeight: 26,
    },
    heroBody: { fontSize: Typography.sizes.md, color: c.textSecondary, lineHeight: 24 },
    commitmentCard: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: Spacing.lg,
      gap: Spacing.sm,
    },
    commitmentTitle: {
      fontSize: Typography.sizes.md,
      fontWeight: Typography.weights.semibold,
      color: c.text,
      marginBottom: Spacing.xs,
    },
    commitRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
    commitCheck: { fontSize: Typography.sizes.sm, color: c.accent, width: 18, marginTop: 2 },
    commitText: { flex: 1, fontSize: Typography.sizes.sm, color: c.textSecondary, lineHeight: 20 },
    sectionTitle: {
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.weights.semibold,
      color: c.text,
    },
    linkList: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      overflow: 'hidden',
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.surfaceBorder,
    },
    linkContent: { flex: 1, gap: 2 },
    linkLabel: { fontSize: Typography.sizes.md, color: c.text, fontWeight: Typography.weights.medium },
    linkDesc: { fontSize: Typography.sizes.sm, color: c.textMuted },
    linkArrow: { fontSize: 20, color: c.textMuted },
    version: {
      fontSize: Typography.sizes.xs,
      color: c.textMuted,
      textAlign: 'center',
      paddingBottom: Spacing.md,
    },
  });
}
