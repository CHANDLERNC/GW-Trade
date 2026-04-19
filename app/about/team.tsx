import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

const TEAM = [
  {
    handle: 'CHANDLERNC',
    role: 'Founder & Lead Developer',
    tenure: 'Since launch',
    note: 'Builds and maintains the app, manages infrastructure, handles moderation.',
  },
];

export default function TeamScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>The Team</Text>

        <Text style={styles.intro}>
          GZW Market is a solo-built and community-maintained project. This page lists everyone
          who has a role in building or moderating the platform.
        </Text>

        <Text style={styles.sectionTitle}>Builders</Text>
        {TEAM.map((member) => (
          <View key={member.handle} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{member.handle[0]}</Text>
              </View>
              <View style={styles.cardMeta}>
                <Text style={styles.handle}>{member.handle}</Text>
                <Text style={styles.role}>{member.role}</Text>
                <Text style={styles.tenure}>{member.tenure}</Text>
              </View>
            </View>
            <Text style={styles.note}>{member.note}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Moderators</Text>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            The moderation team page is coming soon. Moderators are currently listed in our
            Discord server.
          </Text>
        </View>

        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerText}>
            GZW Market is an unofficial fan project. We are not affiliated with, endorsed by,
            or sponsored by Mad Finger Games. No one on this team is a Mad Finger Games employee.
          </Text>
        </View>
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
    intro: { fontSize: Typography.sizes.md, color: c.textSecondary, lineHeight: 24 },
    sectionTitle: {
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.weights.semibold,
      color: c.text,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    cardHeader: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.accent + '33',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    avatarText: {
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.weights.bold,
      color: c.accent,
    },
    cardMeta: { flex: 1, gap: 2 },
    handle: {
      fontSize: Typography.sizes.md,
      fontWeight: Typography.weights.semibold,
      color: c.text,
    },
    role: { fontSize: Typography.sizes.sm, color: c.textSecondary },
    tenure: { fontSize: Typography.sizes.xs, color: c.textMuted },
    note: { fontSize: Typography.sizes.sm, color: c.textSecondary, lineHeight: 20 },
    emptyCard: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: Spacing.md,
    },
    emptyText: { fontSize: Typography.sizes.sm, color: c.textMuted },
    disclaimerCard: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: Spacing.md,
    },
    disclaimerText: {
      fontSize: Typography.sizes.xs,
      color: c.textMuted,
      lineHeight: 18,
      textAlign: 'center',
    },
  });
}
