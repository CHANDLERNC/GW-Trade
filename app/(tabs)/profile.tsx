import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { FactionBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ListingCard } from '@/components/listings/ListingCard';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useListings } from '@/hooks/useListings';
import { authService } from '@/services/auth.service';
import { MembershipModal } from '@/components/ui/MembershipModal';
import { MemberIcon } from '@/components/ui/MemberIcon';
import { FACTION_LIST } from '@/constants/factions';
import { MEMBERSHIP } from '@/constants/membership';
import { NAME_COLORS, resolveNameColor } from '@/constants/nameColors';
import { FactionSlug } from '@/types';

export default function ProfileScreen() {
  const { user, refreshProfile } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile, saving, updateProfile } = useProfile();
  const { listings, refetch } = useListings({ userId: user?.id, activeOnly: false });

  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [membershipModalVisible, setMembershipModalVisible] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editFaction, setEditFaction] = useState<FactionSlug | null>(null);
  const [editNameColor, setEditNameColor] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const openEditModal = () => {
    if (!profile) return;
    setEditUsername(profile.username);
    setEditDisplayName(profile.display_name ?? '');
    setEditBio(profile.bio ?? '');
    setEditFaction(profile.faction_preference ?? null);
    setEditNameColor(profile.display_name_color ?? null);
    setEditError(null);
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    setEditError(null);
    const { error } = await updateProfile({
      username: editUsername.trim(),
      display_name: editDisplayName.trim() || null,
      bio: editBio.trim() || null,
      faction_preference: editFaction,
      display_name_color: editNameColor,
    });
    if (error) {
      setEditError(error.message);
    } else {
      setEditModalVisible(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await authService.signOut(); } },
    ]);
  };

  const displayName = profile?.display_name ?? profile?.username ?? '—';
  const initial = displayName[0]?.toUpperCase() ?? '?';

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
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <TouchableOpacity style={styles.editBtn} onPress={openEditModal} activeOpacity={0.75}>
              <Ionicons name="pencil" size={16} color={colors.textSecondary} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.displayNameRow}>
            <Text style={[styles.displayName, { color: resolveNameColor(profile?.display_name_color) }]}>
              {displayName}
            </Text>
            <MemberIcon
              isLifetime={profile?.is_lifetime_member}
              isMember={profile?.is_member}
              isEarlyAdopter={profile?.is_early_adopter}
              size={20}
            />
          </View>
          <Text style={styles.username}>@{profile?.username}</Text>

          {profile?.faction_preference && (
            <FactionBadge faction={profile.faction_preference} size="md" style={styles.factionBadge} />
          )}
          {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
          <Text style={styles.memberSince}>
            Member since{' '}
            {profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              : '—'}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{listings.length}</Text>
            <Text style={styles.statLabel}>Listings</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{listings.filter((l) => l.is_active).length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>

        {/* Membership */}
        {profile?.is_lifetime_member ? (
          <View style={[styles.membershipCard, styles.lifetimeCard]}>
            <View style={styles.memberRow}>
              <View style={styles.memberBadge}>
                <Ionicons name="infinite" size={16} color="#FFD700" />
                <Text style={[styles.memberBadgeText, styles.lifetimeBadgeText]}>Lifetime Member</Text>
              </View>
              <Text style={styles.memberLimit}>
                {listings.filter((l) => l.is_active).length} / {MEMBERSHIP.LIFETIME_LIMIT} listings
              </Text>
            </View>
            <Text style={styles.lifetimeNote}>2-week post duration · never expires</Text>
          </View>
        ) : profile?.is_member ? (
          <View style={styles.membershipCard}>
            <View style={styles.memberRow}>
              <View style={styles.memberBadge}>
                <Ionicons name="shield-checkmark" size={16} color={colors.accent} />
                <Text style={styles.memberBadgeText}>GZW Member</Text>
              </View>
              <Text style={styles.memberLimit}>
                {listings.filter((l) => l.is_active).length} / {MEMBERSHIP.MEMBER_LIMIT} listings
              </Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.membershipCard} onPress={() => setMembershipModalVisible(true)} activeOpacity={0.8}>
            <View style={styles.upgradeRow}>
              <View style={styles.upgradeLeft}>
                <Ionicons name="shield-outline" size={18} color={colors.accent} />
                <View>
                  <Text style={styles.upgradeTitle}>Upgrade to Member</Text>
                  <Text style={styles.upgradeSubtitle}>
                    {listings.filter((l) => l.is_active).length} / {MEMBERSHIP.FREE_LIMIT} listings used · from $1.99/mo
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        )}

        {/* Early Adopter */}
        {profile?.is_early_adopter && (
          <View style={styles.founderCard}>
            <Ionicons name="rocket" size={20} color="#9C27B0" />
            <View style={styles.founderTextWrap}>
              <Text style={styles.founderTitle}>Founding Member</Text>
              <Text style={styles.founderSub}>
                One of the first operators on GZW Market. This badge is permanent.
              </Text>
            </View>
          </View>
        )}

        {/* My Listings */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MY LISTINGS</Text>
          {listings.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyListings}
              onPress={() => router.push('/(tabs)/create')}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyListingsTitle}>No listings yet</Text>
              <Text style={styles.emptyListingsText}>Tap to post your first trade</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.listingList}>
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </View>
          )}
        </View>

        <View style={styles.signOutSection}>
          <Button title="Sign Out" variant="danger" onPress={handleSignOut} fullWidth />
        </View>
      </ScrollView>

      <MembershipModal
        visible={membershipModalVisible}
        onClose={() => setMembershipModalVisible(false)}
        currentCount={listings.filter((l) => l.is_active).length}
        isMember={profile?.is_member ?? false}
        isEarlyAdopter={profile?.is_early_adopter ?? false}
        earlyAccessClaimed={profile?.early_access_claimed ?? false}
        onClaimed={refreshProfile}
      />

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <SafeAreaView style={styles.modal}>
          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
              contentContainerStyle={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <Text style={styles.modalClose}>Cancel</Text>
                </TouchableOpacity>
              </View>

              {editError && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{editError}</Text>
                </View>
              )}

              <Input label="Username" value={editUsername} onChangeText={setEditUsername} autoCapitalize="none" autoCorrect={false} />
              <Input label="Display Name" value={editDisplayName} onChangeText={setEditDisplayName} placeholder="Optional display name" />
              <Input label="Bio" value={editBio} onChangeText={setEditBio} placeholder="A few words about yourself..." multiline numberOfLines={3} style={styles.multiline} />

              <View>
                <Text style={styles.factionSectionLabel}>NAME COLOR</Text>
                {(profile?.is_member || profile?.is_lifetime_member) ? (
                  <View style={styles.colorPickerRow}>
                    {NAME_COLORS.map((c) => {
                      const active = (editNameColor ?? '#E8EAF0') === c.hex;
                      return (
                        <TouchableOpacity
                          key={c.id}
                          style={[styles.colorSwatch, { backgroundColor: c.hex }, active && styles.colorSwatchActive]}
                          onPress={() => setEditNameColor(c.id === 'default' ? null : c.hex)}
                          activeOpacity={0.8}
                        >
                          {active && <Ionicons name="checkmark" size={14} color={colors.background} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <TouchableOpacity style={styles.colorLockedRow} onPress={() => setMembershipModalVisible(true)} activeOpacity={0.8}>
                    <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
                    <Text style={styles.colorLockedText}>Member exclusive — tap to upgrade</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.factionSectionLabel}>FACTION</Text>
              <View style={styles.factionOptions}>
                {[...FACTION_LIST, { id: null, shortName: 'None', color: colors.textMuted, name: 'No preference' }].map((f) => (
                  <TouchableOpacity
                    key={f.id ?? 'none'}
                    style={[
                      styles.factionOption,
                      { borderColor: (f.color) + '44' },
                      editFaction === f.id && { borderColor: f.color, backgroundColor: f.color + '18' },
                    ]}
                    onPress={() => setEditFaction(f.id as FactionSlug | null)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.factionDot, { backgroundColor: f.color }]} />
                    <Text style={[styles.factionOptionText, editFaction === f.id && { color: f.color }]}>
                      {f.shortName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button title="Save Changes" onPress={handleSaveProfile} loading={saving} fullWidth size="lg" style={styles.saveBtn} />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },
    scroll: { paddingBottom: Spacing.xxl },
    profileCard: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: c.surfaceBorder,
    },
    avatarRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
    avatar: {
      width: 72, height: 72, borderRadius: 36,
      backgroundColor: c.surfaceElevated, borderWidth: 2, borderColor: c.surfaceBorder,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: c.text },
    editBtn: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
      backgroundColor: c.surface, borderRadius: BorderRadius.full,
      borderWidth: 1, borderColor: c.surfaceBorder,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, marginTop: Spacing.xs,
    },
    editBtnText: { fontSize: Typography.sizes.sm, color: c.textSecondary, fontWeight: Typography.weights.medium },
    displayNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    displayName: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: c.text },
    username: { fontSize: Typography.sizes.md, color: c.textSecondary, marginTop: 2 },
    factionBadge: { marginTop: Spacing.sm },
    bio: { fontSize: Typography.sizes.md, color: c.textSecondary, lineHeight: 22, marginTop: Spacing.md },
    memberSince: { fontSize: Typography.sizes.xs, color: c.textMuted, marginTop: Spacing.md },
    statsRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: c.surfaceBorder },
    statBox: { flex: 1, alignItems: 'center', paddingVertical: Spacing.lg, gap: Spacing.xs },
    statValue: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: c.text },
    statLabel: { fontSize: Typography.sizes.xs, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },

    section: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, gap: Spacing.md },
    sectionLabel: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: c.textMuted, letterSpacing: 1.5 },
    listingList: { gap: Spacing.sm },
    membershipCard: {
      marginHorizontal: Spacing.lg, marginTop: Spacing.lg,
      backgroundColor: c.surface, borderRadius: BorderRadius.md,
      borderWidth: 1, borderColor: c.surfaceBorder, padding: Spacing.md,
    },
    lifetimeCard: { borderColor: '#FFD700' + '55', backgroundColor: '#FFD700' + '08', gap: Spacing.xs },
    lifetimeBadgeText: { color: '#FFD700' },
    lifetimeNote: { fontSize: Typography.sizes.xs, color: '#FFD700' + 'AA', marginLeft: Spacing.xs },
    memberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    memberBadge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    memberBadgeText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: c.accent },
    memberLimit: { fontSize: Typography.sizes.sm, color: c.textMuted },
    upgradeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    upgradeLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
    upgradeTitle: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: c.accent },
    upgradeSubtitle: { fontSize: Typography.sizes.xs, color: c.textMuted, marginTop: 2 },
    founderCard: {
      marginHorizontal: Spacing.lg, marginTop: Spacing.md,
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      backgroundColor: '#9C27B0' + '10', borderRadius: BorderRadius.md,
      borderWidth: 1, borderColor: '#9C27B0' + '44', padding: Spacing.md,
    },
    founderTextWrap: { flex: 1, gap: 2 },
    founderTitle: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: '#9C27B0' },
    founderSub: { fontSize: Typography.sizes.xs, color: c.textSecondary, lineHeight: 18 },
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
    emptyListingsTitle: {
      fontSize: Typography.sizes.md,
      fontWeight: Typography.weights.semibold,
      color: c.textSecondary,
    },
    emptyListingsText: {
      fontSize: Typography.sizes.sm,
      color: c.accent,
      fontWeight: Typography.weights.medium,
    },
    signOutSection: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl },
    // Modal
    modal: { flex: 1, backgroundColor: c.background },
    modalScroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.md },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.md, paddingBottom: Spacing.lg },
    modalTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: c.text },
    modalClose: { fontSize: Typography.sizes.md, color: c.textSecondary },
    errorBox: { backgroundColor: c.danger + '22', borderRadius: BorderRadius.md, borderWidth: 1, borderColor: c.danger + '55', padding: Spacing.md },
    errorText: { fontSize: Typography.sizes.sm, color: c.danger },
    multiline: { height: 80, textAlignVertical: 'top', paddingTop: Spacing.sm },
    factionSectionLabel: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: c.textMuted, letterSpacing: 1.5, marginTop: Spacing.xs, marginBottom: Spacing.sm },
    colorPickerRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
    colorSwatch: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
    colorSwatchActive: { borderColor: c.text },
    colorLockedRow: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: c.surfaceElevated, borderRadius: BorderRadius.md,
      borderWidth: 1, borderColor: c.surfaceBorder, borderStyle: 'dashed', padding: Spacing.md,
    },
    colorLockedText: { fontSize: Typography.sizes.sm, color: c.textMuted },
    factionOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    factionOption: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: c.surface, borderRadius: BorderRadius.md,
      borderWidth: 1, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    },
    factionDot: { width: 8, height: 8, borderRadius: 4 },
    factionOptionText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: c.text },
    saveBtn: { marginTop: Spacing.sm },
  });
}
