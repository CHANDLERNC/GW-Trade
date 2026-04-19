import React, { useMemo } from 'react';
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

const MODERATORS = [
  {
    handle: 'CHANDLERNC',
    role: 'Founder · Head Moderator',
    timezone: 'NA East',
    since: 'April 2026',
    bio: 'Builds and runs GZW Market. Final say on appeals and bans.',
  },
];

const MOD_COMMITMENT = [
  'Every report reviewed within 48 hours.',
  'Every appeal responded to within 72 hours.',
  'No moderator may act on reports involving themselves or close associates.',
  'Bans are permanent for RMT with no exceptions.',
  'All moderation decisions are logged internally for accountability.',
];

export default function ModeratorsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Moderation Team</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          The GZW Market moderation team handles reports, strikes, bans, and appeals. All moderators
          are identified by their in-app username.
        </Text>

        {/* Moderator cards */}
        {MODERATORS.map((mod) => (
          <View key={mod.handle} style={styles.modCard}>
            <View style={styles.modAvatar}>
              <Text style={styles.modAvatarText}>{mod.handle[0]}</Text>
            </View>
            <View style={styles.modInfo}>
              <Text style={styles.modHandle}>@{mod.handle}</Text>
              <Text style={styles.modRole}>{mod.role}</Text>
              <View style={styles.modMeta}>
                <View style={styles.metaChip}>
                  <Ionicons name="globe-outline" size={11} color={colors.textMuted} />
                  <Text style={styles.metaChipText}>{mod.timezone}</Text>
                </View>
                <View style={styles.metaChip}>
                  <Ionicons name="calendar-outline" size={11} color={colors.textMuted} />
                  <Text style={styles.metaChipText}>Since {mod.since}</Text>
                </View>
              </View>
              <Text style={styles.modBio}>{mod.bio}</Text>
            </View>
          </View>
        ))}

        {/* Moderation commitments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Commitments</Text>
          <View style={styles.commitCard}>
            {MOD_COMMITMENT.map((item, i) => (
              <View key={i} style={styles.commitRow}>
                <Ionicons name="checkmark-circle" size={15} color={colors.accent} style={{ marginTop: 1 }} />
                <Text style={styles.commitText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Want to help */}
        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>Want to Join the Team?</Text>
          <Text style={styles.helpBody}>
            We occasionally add moderators from the community. Reach out on Discord or email
            us at support@gzwmarket.com with your GZW Market username and why you'd like to
            help. We look for tenured traders with clean standing.
          </Text>
        </View>

        {/* Report link */}
        <View style={styles.reportNote}>
          <Ionicons name="flag-outline" size={16} color={colors.textMuted} />
          <Text style={styles.reportNoteText}>
            To file a report, tap the ⚐ flag icon on any listing or player profile.
          </Text>
        </View>
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

    scroll: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxl },

    intro: {
      fontSize: Typography.sizes.sm,
      color: c.textSecondary,
      lineHeight: 21,
    },

    modCard: {
      flexDirection: 'row',
      gap: Spacing.md,
      backgroundColor: c.surface,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: Spacing.md,
    },
    modAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.accent + '25',
      borderWidth: 2,
      borderColor: c.accent + '55',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    modAvatarText: {
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.weights.bold,
      color: c.accent,
    },
    modInfo: { flex: 1, gap: 4 },
    modHandle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: c.text },
    modRole: { fontSize: Typography.sizes.xs, color: c.accent, fontWeight: Typography.weights.semibold },
    modMeta: { flexDirection: 'row', gap: Spacing.sm, marginTop: 2 },
    metaChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: c.surfaceElevated,
      borderRadius: BorderRadius.sm,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    metaChipText: { fontSize: Typography.sizes.xs, color: c.textMuted },
    modBio: { fontSize: Typography.sizes.xs, color: c.textSecondary, lineHeight: 18, marginTop: 2 },

    section: { gap: Spacing.sm },
    sectionTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: c.text },
    commitCard: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    commitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
    commitText: { flex: 1, fontSize: Typography.sizes.sm, color: c.textSecondary, lineHeight: 20 },

    helpCard: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      borderLeftWidth: 3,
      borderLeftColor: c.accent + '66',
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    helpTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: c.text },
    helpBody: { fontSize: Typography.sizes.sm, color: c.textSecondary, lineHeight: 20 },

    reportNote: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.sm,
      padding: Spacing.md,
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
    },
    reportNoteText: { flex: 1, fontSize: Typography.sizes.sm, color: c.textMuted, lineHeight: 19 },
  });
}
