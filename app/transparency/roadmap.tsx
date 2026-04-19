import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { roadmapService } from '@/services/roadmap.service';

type PlannedItem = { slug: string; label: string };

const PLANNED_ITEMS: PlannedItem[] = [
  { slug: 'trade-disputes',        label: 'Trade dispute escalation flow' },
  { slug: 'login-anomaly-alerts',  label: 'Login anomaly email alerts' },
  { slug: 'uptime-page',           label: 'Uptime / status page' },
  { slug: 'rate-limiting',         label: 'Server-side rate limiting' },
  { slug: 'weekly-devlog',         label: 'Weekly dev updates (Discord + in-app)' },
  { slug: 'roadmap-voting',        label: 'Roadmap voting (this one!)' },
  { slug: 'quarterly-report',      label: 'Quarterly transparency report' },
  { slug: 'supporter-tracker',     label: 'Live supporter fund tracker' },
];

const IN_PROGRESS_ITEMS = [
  'Account Standing screen (strikes + appeal)',
  'Onboarding walkthrough',
  'FAQ page',
  'Moderator team page',
  'Admin tools (players, reports, listings, LFG)',
];

const SHIPPED_ITEMS = [
  'Trust strip on home screen',
  'First-login disclosure modal',
  'Supporter rebrand (removed BEST VALUE / POPULAR)',
  'Terms of Service page',
  'Privacy Policy page',
  'MFG non-affiliation disclaimer on home',
  'Age gate + ToS checkboxes at signup',
  'Community Rules + Ban Policy page',
  'Keep The Lights On — cost transparency',
  'About + Team pages',
  'Public changelog',
  'Report button on listings and profiles',
  'Delete My Data request flow',
  'Free message limit raised to 50/day',
  'Verified Trader clause in MembershipModal',
  'LFG post limits per tier',
  'Completed trades feed on home',
  'Price history screens',
  'Push notifications',
];

export default function RoadmapScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set());
  const [voting, setVoting] = useState<string | null>(null);
  const [votesLoading, setVotesLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const counts = await roadmapService.getVoteCounts();
      setVoteCounts(counts);
      if (user?.id) {
        const mine = await roadmapService.getUserVotes(user.id);
        setMyVotes(new Set(mine));
      }
      setVotesLoading(false);
    }
    load();
  }, [user?.id]);

  const handleVote = useCallback(async (slug: string) => {
    if (!user?.id || voting) return;
    setVoting(slug);
    const voted = myVotes.has(slug);
    if (voted) {
      await roadmapService.unvote(user.id, slug);
      setMyVotes(prev => { const s = new Set(prev); s.delete(slug); return s; });
      setVoteCounts(prev => ({ ...prev, [slug]: Math.max(0, (prev[slug] ?? 1) - 1) }));
    } else {
      await roadmapService.vote(user.id, slug);
      setMyVotes(prev => new Set(prev).add(slug));
      setVoteCounts(prev => ({ ...prev, [slug]: (prev[slug] ?? 0) + 1 }));
    }
    setVoting(null);
  }, [user?.id, myVotes, voting]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Roadmap</Text>
        <Text style={styles.updated}>Last updated: April 2026</Text>
        <Text style={styles.intro}>
          Vote on Planned items to help us prioritise. Items move to In Progress when we start
          them, then Shipped when live.
        </Text>

        {/* Planned — votable */}
        <View style={styles.column}>
          <View style={styles.colHeader}>
            <View style={[styles.colDot, { backgroundColor: '#6b7280' }]} />
            <Text style={styles.colTitle}>Planned</Text>
            <Text style={styles.colCount}>{PLANNED_ITEMS.length}</Text>
          </View>
          {PLANNED_ITEMS
            .sort((a, b) => (voteCounts[b.slug] ?? 0) - (voteCounts[a.slug] ?? 0))
            .map((item) => {
              const voted = myVotes.has(item.slug);
              const count = voteCounts[item.slug] ?? 0;
              const isVoting = voting === item.slug;

              return (
                <View key={item.slug} style={styles.plannedItem}>
                  <View style={[styles.itemDot, { backgroundColor: '#6b728066' }]} />
                  <Text style={styles.itemText}>{item.label}</Text>
                  <TouchableOpacity
                    style={[
                      styles.voteBtn,
                      voted && styles.voteBtnActive,
                      { borderColor: voted ? colors.accent : colors.surfaceBorder },
                    ]}
                    onPress={() => handleVote(item.slug)}
                    disabled={isVoting || votesLoading || !user}
                    activeOpacity={0.75}
                    hitSlop={8}
                  >
                    {isVoting ? (
                      <ActivityIndicator size="small" color={voted ? colors.accent : colors.textMuted} style={{ width: 26 }} />
                    ) : (
                      <>
                        <Ionicons
                          name={voted ? 'arrow-up-circle' : 'arrow-up-circle-outline'}
                          size={14}
                          color={voted ? colors.accent : colors.textMuted}
                        />
                        <Text style={[styles.voteBtnText, voted && styles.voteBtnTextActive]}>
                          {count > 0 ? count : ''}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          {!user && (
            <Text style={styles.loginNote}>Sign in to vote on features.</Text>
          )}
        </View>

        {/* In Progress */}
        <View style={styles.column}>
          <View style={styles.colHeader}>
            <View style={[styles.colDot, { backgroundColor: '#C8A84B' }]} />
            <Text style={styles.colTitle}>In Progress</Text>
            <Text style={styles.colCount}>{IN_PROGRESS_ITEMS.length}</Text>
          </View>
          {IN_PROGRESS_ITEMS.map((item, i) => (
            <View key={i} style={styles.item}>
              <View style={[styles.itemDot, { backgroundColor: '#C8A84B66' }]} />
              <Text style={styles.itemText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Shipped */}
        <View style={styles.column}>
          <View style={styles.colHeader}>
            <View style={[styles.colDot, { backgroundColor: '#22c55e' }]} />
            <Text style={styles.colTitle}>Shipped</Text>
            <Text style={styles.colCount}>{SHIPPED_ITEMS.length}</Text>
          </View>
          {SHIPPED_ITEMS.map((item, i) => (
            <View key={i} style={styles.item}>
              <View style={[styles.itemDot, { backgroundColor: '#22c55e66' }]} />
              <Text style={styles.itemText}>{item}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Have a feature request? Join the Discord and post in #feature-requests.
        </Text>
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
    updated: { fontSize: Typography.sizes.sm, color: c.textMuted, marginTop: -Spacing.sm },
    intro: { fontSize: Typography.sizes.md, color: c.textSecondary, lineHeight: 24 },
    column: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: Spacing.md,
      gap: Spacing.xs,
    },
    colHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    colDot: { width: 10, height: 10, borderRadius: 5 },
    colTitle: {
      fontSize: Typography.sizes.md,
      fontWeight: Typography.weights.semibold,
      color: c.text,
      flex: 1,
    },
    colCount: {
      fontSize: Typography.sizes.sm,
      color: c.textMuted,
      backgroundColor: c.surfaceElevated,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
    },
    item: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start', paddingVertical: 3 },
    itemDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
    itemText: { flex: 1, fontSize: Typography.sizes.sm, color: c.textSecondary, lineHeight: 20 },

    plannedItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: 4,
    },
    voteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      minWidth: 38,
      justifyContent: 'center',
    },
    voteBtnActive: { backgroundColor: c.accent + '18' },
    voteBtnText: {
      fontSize: Typography.sizes.xs,
      color: c.textMuted,
      fontWeight: Typography.weights.semibold,
      minWidth: 12,
      textAlign: 'center',
    },
    voteBtnTextActive: { color: c.accent },

    loginNote: {
      fontSize: Typography.sizes.xs,
      color: c.textMuted,
      textAlign: 'center',
      paddingTop: Spacing.xs,
    },
    footer: {
      fontSize: Typography.sizes.sm,
      color: c.textMuted,
      textAlign: 'center',
      paddingBottom: Spacing.md,
    },
  });
}
