import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { FactionBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MemberIcon } from '@/components/ui/MemberIcon';
import { ListingCard } from '@/components/listings/ListingCard';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/hooks/useListings';
import { profileService } from '@/services/profile.service';
import { messagesService } from '@/services/messages.service';
import { resolveNameColor } from '@/constants/nameColors';
import { Profile } from '@/types';

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messaging, setMessaging] = useState(false);

  const { listings, refetch: refetchListings } = useListings({ userId: id, activeOnly: true });

  const isOwnProfile = user?.id === id;

  const loadProfile = useCallback(async () => {
    if (!id) return;
    const { data } = await profileService.getProfile(id);
    setProfile(data as Profile ?? null);
    setLoading(false);
  }, [id]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadProfile(), refetchListings()]);
    setRefreshing(false);
  }, [loadProfile, refetchListings]);

  useLayoutEffect(() => {
    if (!profile) return;
    navigation.setOptions({
      headerTitle: profile.display_name ?? profile.username,
    });
  }, [profile, navigation]);

  const handleMessage = async () => {
    if (!user || !id || isOwnProfile) return;
    setMessaging(true);
    const { data, error } = await messagesService.getOrCreateConversation(user.id, id);
    setMessaging(false);
    if (!error && data) {
      router.push(`/conversation/${data.id}`);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.center}>
          <Ionicons name="person-outline" size={40} color={colors.textMuted} />
          <Text style={styles.notFoundText}>Operator not found</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="secondary" />
        </View>
      </SafeAreaView>
    );
  }

  const displayName = profile.display_name ?? profile.username;
  const totalRatings = (profile.ratings_positive ?? 0) + (profile.ratings_negative ?? 0);
  const positivePct = totalRatings > 0
    ? Math.round((profile.ratings_positive / totalRatings) * 100)
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />
        }
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.nameRow}>
            <View style={styles.nameBlock}>
              <View style={styles.displayNameRow}>
                <Text
                  style={[styles.displayName, { color: resolveNameColor(profile.display_name_color) }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.65}
                >
                  {displayName}
                </Text>
                <MemberIcon
                  isLifetime={profile.is_lifetime_member}
                  isMember={profile.is_member}
                  isEarlyAdopter={profile.is_early_adopter}
                  size={26}
                />
              </View>
              <Text style={styles.username} numberOfLines={1}>@{profile.username}</Text>
            </View>

            {!isOwnProfile && (
              <TouchableOpacity
                style={styles.messageBtn}
                onPress={handleMessage}
                activeOpacity={0.75}
                disabled={messaging}
              >
                {messaging ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <>
                    <Ionicons name="chatbubble-ellipses" size={15} color={colors.accent} />
                    <Text style={styles.messageBtnText}>Message</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {isOwnProfile && (
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => router.push('/(tabs)/profile')}
                activeOpacity={0.75}
              >
                <Ionicons name="pencil" size={15} color={colors.textSecondary} />
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>

          {profile.faction_preference && (
            <FactionBadge faction={profile.faction_preference} size="md" style={styles.factionBadge} />
          )}

          {!!profile.bio && (
            <Text style={styles.bio}>{profile.bio}</Text>
          )}

          <Text style={styles.memberSince}>
            Operator since{' '}
            {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{listings.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{profile.trades_completed ?? 0}</Text>
            <Text style={styles.statLabel}>Trades</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {profile.ratings_positive ?? 0}
            </Text>
            <Text style={styles.statLabel}>Positive</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, positivePct !== null && { color: positivePct >= 80 ? colors.success : positivePct >= 60 ? colors.warning : colors.danger }]}>
              {positivePct !== null ? `${positivePct}%` : '—'}
            </Text>
            <Text style={styles.statLabel}>Rep</Text>
          </View>
        </View>

        {/* Trader Reputation */}
        {totalRatings > 0 && (
          <View style={styles.ratingCard}>
            <View style={styles.ratingHeader}>
              <Ionicons name="shield-checkmark" size={14} color={colors.accent} />
              <Text style={styles.ratingTitle}>TRADER REPUTATION</Text>
            </View>
            <View style={styles.ratingRow}>
              <View style={styles.ratingItem}>
                <Ionicons name="thumbs-up" size={20} color={colors.success} />
                <Text style={[styles.ratingCount, { color: colors.success }]}>
                  {profile.ratings_positive ?? 0}
                </Text>
              </View>
              <View style={styles.ratingDivider} />
              <View style={styles.ratingItem}>
                <Ionicons name="thumbs-down" size={20} color={colors.danger} />
                <Text style={[styles.ratingCount, { color: colors.danger }]}>
                  {profile.ratings_negative ?? 0}
                </Text>
              </View>
              <View style={styles.ratingDivider} />
              <View style={styles.ratingItem}>
                <Text style={[styles.ratingPct, {
                  color: positivePct! >= 80 ? colors.success : positivePct! >= 60 ? colors.warning : colors.danger,
                }]}>
                  {positivePct}%
                </Text>
                <Text style={styles.ratingPctLabel}>positive</Text>
              </View>
            </View>
          </View>
        )}

        {/* No ratings yet */}
        {totalRatings === 0 && (
          <View style={styles.noRatingsCard}>
            <Ionicons name="shield-outline" size={16} color={colors.textMuted} />
            <Text style={styles.noRatingsText}>No trade ratings yet</Text>
          </View>
        )}

        {/* Membership badges */}
        {profile.is_lifetime_member && (
          <View style={styles.lifetimeCard}>
            <Ionicons name="infinite" size={16} color="#FFD700" />
            <Text style={styles.lifetimeBadgeText}>Lifetime Member</Text>
          </View>
        )}
        {!profile.is_lifetime_member && profile.is_member && (
          <View style={styles.memberCard}>
            <Ionicons name="shield-checkmark" size={16} color={colors.accent} />
            <Text style={styles.memberBadgeText}>GZW Member</Text>
          </View>
        )}
        {profile.is_early_adopter && (
          <View style={styles.founderCard}>
            <Ionicons name="rocket" size={16} color="#9C27B0" />
            <Text style={styles.founderText}>Founding Member</Text>
          </View>
        )}

        {/* Active Listings */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACTIVE LISTINGS</Text>
          {listings.length === 0 ? (
            <View style={styles.emptyListings}>
              <Ionicons name="cube-outline" size={28} color={colors.textMuted} />
              <Text style={styles.emptyText}>No active listings</Text>
            </View>
          ) : (
            <View style={styles.listingList}>
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scroll: { paddingBottom: Spacing.xxl },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
    notFoundText: { fontSize: Typography.sizes.md, color: c.textSecondary },

    // Profile card
    profileCard: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: c.surfaceBorder,
    },
    nameRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.md,
    },
    nameBlock: { flex: 1, gap: 4, marginRight: Spacing.md },
    messageBtn: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
      backgroundColor: c.accent + '18',
      borderRadius: BorderRadius.full,
      borderWidth: 1, borderColor: c.accent + '55',
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
      marginTop: Spacing.xs,
      minWidth: 100, justifyContent: 'center',
    },
    messageBtnText: {
      fontSize: Typography.sizes.sm,
      color: c.accent,
      fontWeight: Typography.weights.semibold,
    },
    editBtn: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
      backgroundColor: c.surface,
      borderRadius: BorderRadius.full,
      borderWidth: 1, borderColor: c.surfaceBorder,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
      marginTop: Spacing.xs,
    },
    editBtnText: {
      fontSize: Typography.sizes.sm,
      color: c.textSecondary,
      fontWeight: Typography.weights.medium,
    },
    displayNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
    displayName: {
      fontSize: Typography.sizes.xxxl,
      fontWeight: Typography.weights.bold,
      color: c.text,
    },
    username: { fontSize: Typography.sizes.lg, color: c.textSecondary },
    factionBadge: { marginTop: Spacing.sm },
    bio: {
      fontSize: Typography.sizes.md,
      color: c.textSecondary,
      lineHeight: 22,
      marginTop: Spacing.md,
    },
    memberSince: { fontSize: Typography.sizes.xs, color: c.textMuted, marginTop: Spacing.md },

    // Stats
    statsRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: c.surfaceBorder,
    },
    statBox: {
      flex: 1, alignItems: 'center',
      paddingVertical: Spacing.lg, gap: Spacing.xs,
    },
    statDivider: {
      width: 1,
      height: 32,
      backgroundColor: c.surfaceBorder,
      alignSelf: 'center',
    },
    statValue: {
      fontSize: Typography.sizes.xxl,
      fontWeight: Typography.weights.bold,
      color: c.text,
    },
    statLabel: {
      fontSize: Typography.sizes.xs,
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    // Rating card
    ratingCard: {
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.lg,
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      borderLeftWidth: 3,
      borderLeftColor: c.accent,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    ratingHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    ratingTitle: {
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.weights.bold,
      color: c.accent,
      letterSpacing: 1.5,
    },
    ratingRow: { flexDirection: 'row', alignItems: 'center' },
    ratingItem: {
      flex: 1, flexDirection: 'row',
      alignItems: 'center', justifyContent: 'center',
      gap: Spacing.sm,
    },
    ratingCount: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
    ratingDivider: { width: 1, height: 28, backgroundColor: c.surfaceBorder },
    ratingPct: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
    ratingPctLabel: { fontSize: Typography.sizes.xs, color: c.textMuted, alignSelf: 'flex-end', paddingBottom: 2 },

    noRatingsCard: {
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      borderStyle: 'dashed',
      padding: Spacing.md,
    },
    noRatingsText: { fontSize: Typography.sizes.sm, color: c.textMuted },

    // Membership badges
    lifetimeCard: {
      marginHorizontal: Spacing.lg, marginTop: Spacing.sm,
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: '#FFD700' + '08',
      borderRadius: BorderRadius.md,
      borderWidth: 1, borderColor: '#FFD700' + '44',
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    },
    lifetimeBadgeText: {
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.weights.bold,
      color: '#FFD700',
    },
    memberCard: {
      marginHorizontal: Spacing.lg, marginTop: Spacing.sm,
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1, borderColor: c.surfaceBorder,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    },
    memberBadgeText: {
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.weights.bold,
      color: c.accent,
    },
    founderCard: {
      marginHorizontal: Spacing.lg, marginTop: Spacing.sm,
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: '#9C27B0' + '10',
      borderRadius: BorderRadius.md,
      borderWidth: 1, borderColor: '#9C27B0' + '44',
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    },
    founderText: {
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.weights.bold,
      color: '#9C27B0',
    },

    // Listings section
    section: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, gap: Spacing.md },
    sectionLabel: {
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.weights.bold,
      color: c.textMuted,
      letterSpacing: 1.5,
    },
    listingList: { gap: Spacing.sm },
    emptyListings: {
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.xl,
      backgroundColor: c.surface,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      borderStyle: 'dashed',
    },
    emptyText: {
      fontSize: Typography.sizes.sm,
      color: c.textMuted,
    },
  });
}
