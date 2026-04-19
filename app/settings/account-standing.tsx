import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { accountStandingService, UserStrike } from '@/services/accountStanding.service';

const STRIKE_LEVELS = [
  {
    max: 0,
    label: 'Good Standing',
    color: '#22C55E',
    icon: 'shield-checkmark' as const,
    description: 'Your account is in good standing. Keep trading fairly.',
  },
  {
    max: 1,
    label: 'First Warning',
    color: '#C8A84B',
    icon: 'warning' as const,
    description: 'You have received one warning. A second strike may result in a temporary suspension.',
  },
  {
    max: 2,
    label: 'Final Warning',
    color: '#D4823A',
    icon: 'warning' as const,
    description: 'You are at two strikes. One more violation will result in account suspension.',
  },
  {
    max: Infinity,
    label: 'Suspended',
    color: '#C43C3C',
    icon: 'ban' as const,
    description: 'Your account has been suspended due to repeated violations. You may appeal below.',
  },
];

function getLevel(strikes: number) {
  return STRIKE_LEVELS.find((l) => strikes <= l.max) ?? STRIKE_LEVELS[STRIKE_LEVELS.length - 1];
}

export default function AccountStandingScreen() {
  const { colors } = useTheme();
  const { profile } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [strikes, setStrikes] = useState<UserStrike[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountStandingService.getMyStrikes().then(({ data }) => {
      setStrikes(data);
      setLoading(false);
    });
  }, []);

  const strikeCount = profile?.strikes ?? 0;
  const level = getLevel(strikeCount);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Standing</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status card */}
        <View style={[styles.statusCard, { borderColor: level.color + '55', backgroundColor: level.color + '12' }]}>
          <Ionicons name={level.icon} size={36} color={level.color} />
          <Text style={[styles.statusLabel, { color: level.color }]}>{level.label}</Text>
          <View style={styles.strikeCountRow}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  styles.strikeDot,
                  { backgroundColor: i < strikeCount ? level.color : colors.surfaceBorder },
                ]}
              />
            ))}
          </View>
          <Text style={styles.strikeCountText}>
            {strikeCount} / 3 strikes
          </Text>
          <Text style={styles.statusDescription}>{level.description}</Text>
        </View>

        {/* How it works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How Strikes Work</Text>
          <View style={styles.infoCard}>
            {[
              { dot: '#22C55E', text: '0 strikes — Good standing, full account access.' },
              { dot: '#C8A84B', text: '1 strike — First warning. Issued for scam attempts, harassment, or rule violations.' },
              { dot: '#D4823A', text: '2 strikes — Final warning. Further violations result in suspension.' },
              { dot: '#C43C3C', text: '3 strikes — Account suspended. Appeal required to restore access.' },
            ].map(({ dot, text }, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={[styles.dot, { backgroundColor: dot }]} />
                <Text style={styles.bulletText}>{text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Expiry note */}
        <View style={styles.infoNote}>
          <Ionicons name="time-outline" size={16} color={colors.textMuted} />
          <Text style={styles.infoNoteText}>
            Strikes expire after 365 days if no further violations occur.
          </Text>
        </View>

        {/* Strike history */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Strike History</Text>
          {loading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: Spacing.md }} />
          ) : strikes.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Ionicons name="checkmark-circle-outline" size={28} color={colors.textMuted} />
              <Text style={styles.emptyHistoryText}>No strikes on record.</Text>
            </View>
          ) : (
            strikes.map((s) => (
              <View key={s.id} style={styles.strikeCard}>
                <View style={styles.strikeCardTop}>
                  <Text style={styles.strikeReason}>{s.reason}</Text>
                  {s.appeal_status !== 'none' && (
                    <View style={[
                      styles.appealPill,
                      { backgroundColor: s.appeal_status === 'overturned' ? '#22C55E20' : colors.accent + '20' },
                    ]}>
                      <Text style={[
                        styles.appealPillText,
                        { color: s.appeal_status === 'overturned' ? '#22C55E' : colors.accent },
                      ]}>
                        Appeal: {s.appeal_status}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.strikeDate}>
                  Issued {new Date(s.issued_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {s.expires_at
                    ? ` · Expires ${new Date(s.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : ''}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Appeal info */}
        <View style={styles.appealSection}>
          <Text style={styles.appealTitle}>Need to Appeal?</Text>
          <Text style={styles.appealBody}>
            If you believe a strike was issued in error, contact us at{' '}
            <Text style={styles.appealEmail}>support@gzwmarket.com</Text> with your username and a
            description of the situation. We review all appeals within 72 hours.
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

    statusCard: {
      alignItems: 'center',
      gap: Spacing.sm,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      padding: Spacing.xl,
    },
    statusLabel: {
      fontSize: Typography.sizes.xl,
      fontWeight: Typography.weights.bold,
    },
    strikeCountRow: { flexDirection: 'row', gap: Spacing.md, marginVertical: Spacing.xs },
    strikeDot: { width: 16, height: 16, borderRadius: 8 },
    strikeCountText: { fontSize: Typography.sizes.sm, color: c.textSecondary, fontWeight: Typography.weights.semibold },
    statusDescription: {
      fontSize: Typography.sizes.sm,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },

    section: { gap: Spacing.sm },
    sectionTitle: {
      fontSize: Typography.sizes.md,
      fontWeight: Typography.weights.bold,
      color: c.text,
    },
    infoCard: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
    dot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
    bulletText: { flex: 1, fontSize: Typography.sizes.sm, color: c.textSecondary, lineHeight: 20 },

    infoNote: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.sm,
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: Spacing.md,
    },
    infoNoteText: { flex: 1, fontSize: Typography.sizes.sm, color: c.textMuted, lineHeight: 19 },

    emptyHistory: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: Spacing.md,
    },
    emptyHistoryText: { fontSize: Typography.sizes.sm, color: c.textMuted },

    strikeCard: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      borderLeftWidth: 3,
      borderLeftColor: '#C43C3C80',
      padding: Spacing.md,
      gap: 4,
    },
    strikeCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
    strikeReason: { flex: 1, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: c.text },
    appealPill: {
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
    },
    appealPillText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold },
    strikeDate: { fontSize: Typography.sizes.xs, color: c.textMuted },

    appealSection: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    appealTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: c.text },
    appealBody: { fontSize: Typography.sizes.sm, color: c.textSecondary, lineHeight: 20 },
    appealEmail: { color: c.accent, fontWeight: Typography.weights.semibold },
  });
}
