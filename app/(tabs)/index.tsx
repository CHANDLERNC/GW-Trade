import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { FactionBadge } from '@/components/ui/Badge';
import { MemberIcon } from '@/components/ui/MemberIcon';
import { useAuth } from '@/context/AuthContext';
import { useListingCounts } from '@/hooks/useListingCounts';
import { FACTION_LIST } from '@/constants/factions';
import { CATEGORY_LIST, CATEGORY_META, TACTICAL_STATUS } from '@/constants/categories';
import { resolveNameColor } from '@/constants/nameColors';
import { listingsService } from '@/services/listings.service';
import { timeAgo } from '@/utils/dateFormat';
import { Category, FactionSlug, Listing } from '@/types';

function getRandomStatus(): string {
  return TACTICAL_STATUS[Math.floor(Math.random() * TACTICAL_STATUS.length)];
}

function getMilitaryDate(): string {
  const now = new Date();
  return now.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).toUpperCase();
}

export default function HomeScreen() {
  const { profile } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { counts, refetch: refetchCounts } = useListingCounts();
  const [refreshing, setRefreshing] = useState(false);
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [statusLine, setStatusLine] = useState(getRandomStatus);
  const [now, setNow] = useState(new Date());
  const [use24hr, setUse24hr] = useState(true);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('@gzw_clock_format').then((val) => {
      if (val === '12') setUse24hr(false);
    });
    clockRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => { if (clockRef.current) clearInterval(clockRef.current); };
  }, []);

  const toggleClockFormat = useCallback(() => {
    setUse24hr((prev) => {
      const next = !prev;
      AsyncStorage.setItem('@gzw_clock_format', next ? '24' : '12');
      return next;
    });
  }, []);

  const displayName = profile?.display_name ?? profile?.username ?? 'Operator';
  const nameColor = resolveNameColor(profile?.display_name_color);
  const totalListings = counts.keys + counts.gear + counts.items;

  const fetchRecent = useCallback(async () => {
    const { data } = await listingsService.getListings({ activeOnly: true });
    setRecentListings(((data as Listing[]) ?? []).slice(0, 8));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setStatusLine(getRandomStatus());
    await Promise.all([refetchCounts(), fetchRecent()]);
    setRefreshing(false);
  }, [refetchCounts, fetchRecent]);

  useEffect(() => { fetchRecent(); }, [fetchRecent]);

  const goToBrowse = (category?: Category, faction?: FactionSlug) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (faction) params.set('faction', faction);
    const query = params.toString();
    router.push(`/(tabs)/browse${query ? '?' + query : ''}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.greeting}>{statusLine}</Text>
            <Text style={styles.headerDate}>{getMilitaryDate()}</Text>
          </View>

          <TouchableOpacity style={styles.clockBlock} onPress={toggleClockFormat} activeOpacity={0.75}>
            <Text style={styles.clockLabel}>LOCAL TIME</Text>
            <View style={styles.clockRow}>
              <Text style={styles.clockDigits}>
                {use24hr
                  ? `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
                  : `${String(now.getHours() % 12 || 12).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
                }
              </Text>
              <View style={styles.clockSuffix}>
                {!use24hr && (
                  <Text style={styles.clockAmPm}>{now.getHours() < 12 ? 'AM' : 'PM'}</Text>
                )}
                <View style={styles.clockFormatBadge}>
                  <Text style={styles.clockFormatText}>{use24hr ? '24H' : '12H'}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.headerNameRow}>
            <Text style={[styles.username, { color: nameColor }]}>{displayName}</Text>
            <MemberIcon
              isLifetime={profile?.is_lifetime_member}
              isMember={profile?.is_member}
              isEarlyAdopter={profile?.is_early_adopter}
              size={18}
            />
            <View style={styles.themeToggleRow}>
              <Ionicons name="moon" size={13} color={isDark ? '#FFFFFF' : '#000000'} />
              <Switch
                value={!isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.surfaceBorder, true: colors.accent + '88' }}
                thumbColor={isDark ? colors.textMuted : colors.accent}
                ios_backgroundColor={colors.surfaceBorder}
                style={styles.switch}
              />
              <Ionicons name="sunny" size={13} color={isDark ? '#FFFFFF' : '#000000'} />
            </View>
          </View>
          <View style={styles.headerMeta}>
            {profile?.faction_preference ? (
              <FactionBadge faction={profile.faction_preference} size="sm" />
            ) : null}
            <View style={styles.marketStatus}>
              <View style={styles.statusDot} />
              <Text style={styles.marketText}>
                {totalListings > 0
                  ? `${totalListings} listing${totalListings !== 1 ? 's' : ''} live`
                  : 'Market open'}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.quickSection}>
          <TouchableOpacity
            style={styles.postButton}
            onPress={() => router.push('/(tabs)/create')}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle" size={20} color={colors.background} />
            <Text style={styles.postButtonText}>Post a Trade</Text>
          </TouchableOpacity>
          <View style={styles.quickPair}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => router.push('/(tabs)/browse')}
              activeOpacity={0.8}
            >
              <Ionicons name="search-outline" size={22} color={colors.accent} />
              <Text style={styles.quickLabel}>Browse All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => router.push('/(tabs)/inbox')}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.accent} />
              <Text style={styles.quickLabel}>Inbox</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CATEGORIES</Text>
          <View style={styles.categoryGrid}>
            {CATEGORY_LIST.map((cat) => {
              const meta = CATEGORY_META[cat.id];
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryCard, { borderTopColor: meta.color }]}
                  onPress={() => goToBrowse(cat.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: meta.color + '18' }]}>
                    <Ionicons name={meta.icon} size={24} color={meta.color} />
                  </View>
                  <Text style={[styles.categoryName, { color: meta.color }]}>{cat.name}</Text>
                  <Text style={styles.categoryDesc} numberOfLines={2}>{cat.description}</Text>
                  {counts[cat.id] > 0 && (
                    <View style={[styles.countBadge, { backgroundColor: meta.color + '20' }]}>
                      <Text style={[styles.countText, { color: meta.color }]}>{counts[cat.id]}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          {totalListings === 0 && !refreshing && (
            <TouchableOpacity
              style={styles.emptyMarket}
              onPress={() => router.push('/(tabs)/create')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyMarketText}>No listings yet — be the first to post a trade</Text>
              <Text style={styles.emptyMarketLink}>Post now →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Latest listings */}
        {recentListings.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.sectionLabel}>LATEST LISTINGS</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/browse')}>
                <Text style={styles.seeAll}>See all →</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={recentListings}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentList}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const meta = CATEGORY_META[item.category];
                const faction = FACTION_LIST.find((f) => f.id === item.faction);
                return (
                  <TouchableOpacity
                    style={styles.recentCard}
                    onPress={() => router.push(`/listing/${item.id}`)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.recentCardAccent, { backgroundColor: meta.color }]} />
                    <View style={styles.recentCardBody}>
                      <Text style={[styles.recentCategory, { color: meta.color }]}>
                        {item.category.toUpperCase()}
                      </Text>
                      <Text style={styles.recentTitle} numberOfLines={2}>{item.title}</Text>
                      <View style={styles.recentMeta}>
                        {faction && (
                          <View style={[styles.recentFactionPill, { backgroundColor: faction.color + '22', borderColor: faction.color + '55' }]}>
                            <Text style={[styles.recentFactionText, { color: faction.color }]}>
                              {faction.shortName}
                            </Text>
                          </View>
                        )}
                        <Text style={styles.recentTime}>{timeAgo(item.created_at)}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        {/* Faction markets */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>FACTION MARKETS</Text>
          <View style={styles.factionList}>
            {FACTION_LIST.map((faction) => (
              <TouchableOpacity
                key={faction.id}
                style={[
                  styles.factionCard,
                  { borderLeftColor: faction.color, backgroundColor: faction.color + '2E' },
                ]}
                onPress={() => goToBrowse(undefined, faction.id)}
                activeOpacity={0.8}
              >
                <View style={styles.factionCardLeft}>
                  <View style={[styles.factionColorBar, { backgroundColor: faction.color }]} />
                  <View style={styles.factionInfo}>
                    <Text style={[styles.factionShort, { color: faction.color }]}>{faction.shortName}</Text>
                    <Text style={styles.factionName} numberOfLines={1}>{faction.name}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scroll: { paddingBottom: Spacing.xl },
    header: {
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.md,
      marginBottom: Spacing.lg,
      backgroundColor: c.surface,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      borderLeftWidth: 3,
      borderLeftColor: c.accent,
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    themeToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
    switch: { transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] },
    greeting: {
      fontSize: Typography.sizes.xs,
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    headerDate: { fontSize: Typography.sizes.xs, color: c.textMuted, letterSpacing: 0.5 },
    clockBlock: {
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: c.surfaceBorder,
      paddingVertical: Spacing.md,
      gap: Spacing.xs,
    },
    clockLabel: {
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.weights.bold,
      color: c.textMuted,
      letterSpacing: 2,
    },
    clockFormatBadge: {
      borderWidth: 1,
      borderColor: c.accent + '66',
      borderRadius: BorderRadius.sm,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    clockFormatText: {
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.weights.bold,
      color: c.accent,
      letterSpacing: 1,
    },
    clockRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: Spacing.sm,
    },
    clockSuffix: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingBottom: 4,
    },
    clockDigits: {
      fontSize: 32,
      fontWeight: Typography.weights.heavy,
      color: c.text,
      letterSpacing: 2,
      fontVariant: ['tabular-nums'],
    },
    clockAmPm: {
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.weights.bold,
      color: c.accent,
      letterSpacing: 1,
      paddingBottom: 6,
    },
    headerNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    username: {
      fontSize: Typography.sizes.xxl,
      fontWeight: Typography.weights.bold,
      lineHeight: 28,
    },
    headerMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginTop: Spacing.xs,
    },
    marketStatus: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.success },
    marketText: { fontSize: Typography.sizes.xs, color: c.textMuted, letterSpacing: 0.3 },
    quickSection: { marginHorizontal: Spacing.lg, marginBottom: Spacing.xl, gap: Spacing.sm },
    postButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      backgroundColor: c.accent,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.md,
    },
    postButtonText: {
      fontSize: Typography.sizes.md,
      fontWeight: Typography.weights.bold,
      color: c.background,
      letterSpacing: 0.3,
    },
    quickPair: { flexDirection: 'row', gap: Spacing.sm },
    quickCard: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      paddingVertical: Spacing.md,
      alignItems: 'center',
      gap: Spacing.xs,
    },
    quickLabel: {
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.weights.semibold,
      color: c.textSecondary,
    },
    section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl, gap: Spacing.md },
    sectionLabel: {
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.weights.bold,
      color: c.textMuted,
      letterSpacing: 1.5,
    },
    categoryGrid: { flexDirection: 'row', gap: Spacing.sm },
    categoryCard: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      borderTopWidth: 2,
      padding: Spacing.md,
      gap: Spacing.xs,
    },
    categoryIcon: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xs,
    },
    categoryName: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold },
    categoryDesc: { fontSize: Typography.sizes.xs, color: c.textMuted, lineHeight: 16 },
    countBadge: {
      marginTop: Spacing.xs,
      alignSelf: 'flex-start',
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
    },
    countText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold },
    emptyMarket: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.accent + '33',
      borderStyle: 'dashed',
      padding: Spacing.md,
      alignItems: 'center',
      gap: Spacing.xs,
    },
    emptyMarketText: { fontSize: Typography.sizes.sm, color: c.textSecondary, textAlign: 'center' },
    emptyMarketLink: { fontSize: Typography.sizes.sm, color: c.accent, fontWeight: Typography.weights.semibold },
    recentSection: { marginBottom: Spacing.xl, gap: Spacing.md },
    recentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
    },
    seeAll: {
      fontSize: Typography.sizes.xs,
      color: c.accent,
      fontWeight: Typography.weights.semibold,
      letterSpacing: 0.3,
    },
    recentList: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
    recentCard: {
      width: 148,
      backgroundColor: c.surface,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      overflow: 'hidden',
    },
    recentCardAccent: { height: 3, width: '100%' },
    recentCardBody: { padding: Spacing.sm, gap: 4 },
    recentCategory: { fontSize: 10, fontWeight: Typography.weights.bold, letterSpacing: 1 },
    recentTitle: {
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.weights.semibold,
      color: c.text,
      lineHeight: 18,
    },
    recentMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 2 },
    recentFactionPill: { borderRadius: BorderRadius.full, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1 },
    recentFactionText: { fontSize: 10, fontWeight: Typography.weights.bold, letterSpacing: 0.5 },
    recentTime: { fontSize: 10, color: c.textMuted },
    factionList: { gap: Spacing.sm },
    factionCard: {
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      borderLeftWidth: 3,
      padding: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    factionCardLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
    factionColorBar: { width: 4, height: 36, borderRadius: 2 },
    factionInfo: { gap: 2 },
    factionShort: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
    factionName: { fontSize: Typography.sizes.md, color: c.textSecondary },
  });
}
