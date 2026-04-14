import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useLFG } from '@/hooks/useLFG';
import { LFGCard } from '@/components/lfg/LFGCard';
import { CreateLFGSheet } from '@/components/lfg/CreateLFGSheet';
import { lfgService, lfgPostDurationHours, lfgPostLimit } from '@/services/lfg.service';
import { FACTION_LIST } from '@/constants/factions';
import { FactionSlug, LFGFilters, LFGZone, LFGRegion, LFGPost } from '@/types';

type FactionFilter = FactionSlug | 'all';
type ZoneFilter = LFGZone | 'all';

const ZONE_CHIPS: { id: ZoneFilter; label: string }[] = [
  { id: 'all', label: 'All Zones' },
  { id: 'pha_lang', label: 'Pha Lang' },
  { id: 'nam_thaven', label: 'Nam Thaven' },
  { id: 'kiu_vongsa', label: 'Kiu Vongsa' },
  { id: 'ybl_1', label: 'YBL-1' },
  { id: 'ban_pa', label: 'Ban Pa' },
  { id: 'fort_narith', label: 'Fort Narith' },
  { id: 'midnight_sapphire', label: 'Midnight Sapphire' },
  { id: 'tiger_bay', label: 'Tiger Bay' },
  { id: 'hunters_paradise', label: "Hunter's Paradise" },
  { id: 'falng_airfield', label: 'F.A.L.N.G. Airfield' },
  { id: 'any', label: 'Any Zone' },
];

export default function LFGScreen() {
  const { colors, isDark } = useTheme();
  const { user, profile } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { openCreate } = useLocalSearchParams<{ openCreate?: string }>();

  const [showCreate, setShowCreate] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [factionFilter, setFactionFilter] = useState<FactionFilter>('all');
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>('all');
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (showBanner) {
      bannerTimer.current = setTimeout(() => setShowBanner(false), 5000);
    }
    return () => {
      if (bannerTimer.current) clearTimeout(bannerTimer.current);
    };
  }, [showBanner]);

  useEffect(() => {
    if (openCreate === '1') {
      setShowCreate(true);
      router.setParams({ openCreate: undefined });
    }
  }, [openCreate]);

  const filters: LFGFilters = useMemo(() => ({
    faction: factionFilter === 'all' ? undefined : factionFilter,
    zone: zoneFilter === 'all' ? undefined : zoneFilter,
  }), [factionFilter, zoneFilter]);

  const { posts, loading, refreshing, refetch, removePost, prependPost } = useLFG(filters);

  const handleClose = useCallback(async (postId: string) => {
    removePost(postId);
    await lfgService.deactivatePost(postId);
  }, [removePost]);

  const isLifetime = profile?.is_lifetime_member ?? false;
  const isMember = profile?.is_member ?? false;
  const postDurationHours = lfgPostDurationHours(isLifetime, isMember);
  const postLimit = lfgPostLimit(isLifetime, isMember);

  const handleSubmit = useCallback(async (form: {
    faction: FactionSlug;
    zone: LFGZone;
    region: LFGRegion;
    slots_total: number;
    description?: string;
    mic_required: boolean;
  }) => {
    if (!user) return;
    const { data, error, limitReached } = await lfgService.createPost(user.id, {
      ...form,
      isLifetimeMember: isLifetime,
      isMember,
    });
    if (limitReached) return; // UI already blocks the button; silent guard
    if (!error && data) {
      prependPost(data);
      setShowCreate(false);
      setShowBanner(true);
      refetch();
    }
  }, [user, isLifetime, isMember, prependPost, refetch]);

  const myPosts = posts.filter((p) => p.user_id === user?.id);
  const atLimit = myPosts.length >= postLimit;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>LFG Board</Text>
          <Text style={styles.subtitle}>Find operators in your faction</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.postBtn,
            myPosts.length > 0 && styles.postBtnActive,
            atLimit && styles.postBtnLimit,
          ]}
          onPress={() => !atLimit && setShowCreate(true)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={atLimit ? 'checkmark-circle' : 'add-circle-outline'}
            size={16}
            color={atLimit ? colors.success : myPosts.length > 0 ? colors.success : colors.accent}
          />
          <Text style={[
            styles.postBtnText,
            myPosts.length > 0 && { color: colors.success },
          ]}>
            {atLimit ? `${myPosts.length}/${postLimit}` : myPosts.length > 0 ? `${myPosts.length}/${postLimit}` : 'Post LFG'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* My active post banner */}
      {showBanner && myPosts.length > 0 && (
        <View style={[styles.myPostBanner, { borderColor: colors.success + '55' }]}>
          <Ionicons name="radio-outline" size={14} color={colors.success} />
          <Text style={styles.myPostBannerText}>
            Post live — operators can message you
          </Text>
          <TouchableOpacity onPress={() => setShowBanner(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* Faction filter */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[styles.chip, factionFilter === 'all' && styles.chipActive]}
            onPress={() => setFactionFilter('all')}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, factionFilter === 'all' && styles.chipTextActive]}>
              All Factions
            </Text>
          </TouchableOpacity>
          {FACTION_LIST.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.chip,
                factionFilter === f.id && {
                  borderColor: f.color,
                  backgroundColor: f.color + '18',
                },
              ]}
              onPress={() => setFactionFilter(f.id)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.chipText,
                  factionFilter === f.id && { color: f.color, fontWeight: Typography.weights.bold },
                ]}
              >
                {f.shortName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Zone filter */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {ZONE_CHIPS.map((z) => (
            <TouchableOpacity
              key={z.id}
              style={[styles.chip, zoneFilter === z.id && styles.chipActive]}
              onPress={() => setZoneFilter(z.id)}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, zoneFilter === z.id && styles.chipTextActive]}>
                {z.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LFGCard post={item} onClose={handleClose} />
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          onRefresh={refetch}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No operators looking</Text>
              <Text style={styles.emptySubtitle}>
                Be the first to post — your squad is out there.
              </Text>
              <TouchableOpacity
                style={[styles.emptyBtn, { borderColor: colors.accent }]}
                onPress={() => setShowCreate(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.emptyBtnText, { color: colors.accent }]}>Post LFG</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <CreateLFGSheet
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleSubmit}
        initialFaction={factionFilter !== 'all' ? factionFilter : undefined}
        postDurationHours={postDurationHours}
        activePostCount={myPosts.length}
        postLimit={postLimit}
      />
    </SafeAreaView>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
    },
    title: {
      fontSize: Typography.sizes.xxl,
      fontWeight: Typography.weights.bold,
      color: c.text,
    },
    subtitle: {
      fontSize: Typography.sizes.sm,
      color: c.textMuted,
      marginTop: 1,
    },
    postBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.md,
      paddingVertical: 8,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.accent + '60',
      backgroundColor: c.accent + '10',
    },
    postBtnActive: {
      borderColor: c.success + '60',
      backgroundColor: c.success + '10',
    },
    postBtnLimit: {
      opacity: 0.6,
    },
    postBtnText: {
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.weights.semibold,
      color: c.accent,
    },
    myPostBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      backgroundColor: c.success + '10',
    },
    myPostBannerText: {
      flex: 1,
      fontSize: Typography.sizes.sm,
      color: c.success,
    },
    filterSection: {
      marginBottom: Spacing.xs,
    },
    filterScroll: {
      paddingHorizontal: Spacing.lg,
      gap: Spacing.xs,
    },
    chip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: 7,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      backgroundColor: c.surface,
    },
    chipActive: {
      borderColor: c.accent,
      backgroundColor: c.accent + '15',
    },
    chipText: {
      fontSize: Typography.sizes.sm,
      color: c.textSecondary,
      fontWeight: Typography.weights.medium,
    },
    chipTextActive: {
      color: c.accent,
      fontWeight: Typography.weights.bold,
    },
    list: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.xl,
    },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    empty: {
      alignItems: 'center',
      paddingTop: Spacing.xxl,
      gap: Spacing.md,
      paddingHorizontal: Spacing.xl,
    },
    emptyTitle: {
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.weights.semibold,
      color: c.textSecondary,
    },
    emptySubtitle: {
      fontSize: Typography.sizes.md,
      color: c.textMuted,
      textAlign: 'center',
      lineHeight: 22,
    },
    emptyBtn: {
      marginTop: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
    },
    emptyBtnText: {
      fontSize: Typography.sizes.md,
      fontWeight: Typography.weights.semibold,
    },
  });
}
