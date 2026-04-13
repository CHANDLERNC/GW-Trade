import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useSavedListings, useSavedSellers, toggleSavedSeller } from '@/hooks/useSavedListings';
import { useAuth } from '@/context/AuthContext';
import { ListingCard } from '@/components/listings/ListingCard';
import { MemberIcon } from '@/components/ui/MemberIcon';
import { FactionBadge } from '@/components/ui/Badge';
import { Profile } from '@/types';

// ── Seller card ────────────────────────────────────────────────────────────────

interface SellerCardProps {
  seller: Profile;
  onUnsave: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}

function SellerCard({ seller, onUnsave, colors, styles }: SellerCardProps) {
  const total = seller.ratings_positive + seller.ratings_negative;
  const rating = total > 0
    ? Math.round((seller.ratings_positive / total) * 100)
    : null;

  return (
    <View style={styles.sellerCard}>
      <View style={styles.sellerAvatar}>
        <Text style={styles.sellerAvatarText}>
          {(seller.username ?? '?')[0].toUpperCase()}
        </Text>
      </View>

      <View style={styles.sellerInfo}>
        <View style={styles.sellerNameRow}>
          <Text
            style={[
              styles.sellerUsername,
              seller.display_name_color ? { color: seller.display_name_color } : null,
            ]}
            numberOfLines={1}
          >
            {seller.display_name ?? seller.username}
          </Text>
          <MemberIcon
            isLifetime={seller.is_lifetime_member}
            isMember={seller.is_member}
            isEarlyAdopter={seller.is_early_adopter}
            size={13}
          />
        </View>

        <View style={styles.sellerMeta}>
          {seller.faction_preference && (
            <FactionBadge faction={seller.faction_preference} />
          )}
          <Text style={styles.sellerStats}>
            {seller.trades_completed} trade{seller.trades_completed !== 1 ? 's' : ''}
          </Text>
          {rating !== null && (
            <View style={styles.ratingPill}>
              <Ionicons
                name="thumbs-up"
                size={10}
                color={colors.success}
              />
              <Text style={styles.ratingText}>{rating}%</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity onPress={onUnsave} hitSlop={10} style={styles.unsaveBtn}>
        <Ionicons name="person-remove-outline" size={16} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}

function SectionHeader({ title, count, open, onToggle, styles, colors }: SectionHeaderProps) {
  return (
    <TouchableOpacity style={styles.sectionHeader} onPress={onToggle} activeOpacity={0.7}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionRight}>
        {count > 0 && (
          <View style={styles.countPill}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        )}
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textMuted}
        />
      </View>
    </TouchableOpacity>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function SavedScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuth();

  const { listings, loading: listingsLoading, reload: reloadListings } = useSavedListings();
  const { sellers, loading: sellersLoading, reload: reloadSellers } = useSavedSellers();

  const [listingsOpen, setListingsOpen] = useState(true);
  const [sellersOpen, setSellersOpen] = useState(true);

  const loading = listingsLoading || sellersLoading;

  const handleUnsaveSeller = useCallback(async (sellerId: string) => {
    if (!user) return;
    await toggleSavedSeller(user.id, sellerId);
    reloadSellers();
  }, [user, reloadSellers]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* ── Saved Listings ── */}
          <SectionHeader
            title="Saved Listings"
            count={listings.length}
            open={listingsOpen}
            onToggle={() => setListingsOpen((v) => !v)}
            styles={styles}
            colors={colors}
          />
          {listingsOpen && (
            listings.length === 0 ? (
              <View style={styles.emptySection}>
                <Ionicons name="bookmark-outline" size={32} color={colors.textMuted} />
                <Text style={styles.emptyText}>No saved listings yet</Text>
                <Text style={styles.emptyHint}>
                  Tap the bookmark icon on any listing to save it.
                </Text>
              </View>
            ) : (
              <View style={styles.listingsList}>
                {listings.map((item) => (
                  <ListingCard key={item.id} listing={item} />
                ))}
              </View>
            )
          )}

          <View style={styles.divider} />

          {/* ── Saved Sellers ── */}
          <SectionHeader
            title="Saved Sellers"
            count={sellers.length}
            open={sellersOpen}
            onToggle={() => setSellersOpen((v) => !v)}
            styles={styles}
            colors={colors}
          />
          {sellersOpen && (
            sellers.length === 0 ? (
              <View style={styles.emptySection}>
                <Ionicons name="people-outline" size={32} color={colors.textMuted} />
                <Text style={styles.emptyText}>No saved sellers yet</Text>
                <Text style={styles.emptyHint}>
                  Tap the person icon on any listing to save that seller.
                </Text>
              </View>
            ) : (
              <View style={styles.sellersList}>
                {sellers.map((seller) => (
                  <SellerCard
                    key={seller.id}
                    seller={seller}
                    onUnsave={() => handleUnsaveSeller(seller.id)}
                    colors={colors}
                    styles={styles}
                  />
                ))}
              </View>
            )
          )}

          <View style={styles.bottomPad} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    header: {
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
    },
    title: {
      fontSize: Typography.sizes.xxl,
      fontWeight: '700',
      color: c.text,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scroll: {
      paddingBottom: Spacing.xl,
    },

    // Section
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + 2,
    },
    sectionTitle: {
      fontSize: Typography.sizes.sm,
      fontWeight: '700',
      color: c.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    sectionRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    countPill: {
      backgroundColor: c.surfaceElevated,
      borderRadius: BorderRadius.full,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    countText: {
      fontSize: Typography.sizes.xs,
      fontWeight: '700',
      color: c.textSecondary,
    },
    divider: {
      height: 1,
      backgroundColor: c.surfaceBorder,
      marginHorizontal: Spacing.md,
      marginVertical: Spacing.xs,
    },

    // Empty states
    emptySection: {
      alignItems: 'center',
      paddingVertical: Spacing.xl,
      gap: Spacing.xs,
      paddingHorizontal: Spacing.xl,
    },
    emptyText: {
      fontSize: Typography.sizes.sm,
      fontWeight: '600',
      color: c.textSecondary,
      marginTop: Spacing.xs,
    },
    emptyHint: {
      fontSize: Typography.sizes.xs,
      color: c.textMuted,
      textAlign: 'center',
      lineHeight: 18,
    },

    // Listings
    listingsList: {
      paddingHorizontal: Spacing.md,
      gap: Spacing.sm,
    },

    // Seller card
    sellersList: {
      paddingHorizontal: Spacing.md,
      gap: Spacing.sm,
    },
    sellerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: c.surface,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: Spacing.md,
    },
    sellerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.surfaceElevated,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    sellerAvatarText: {
      fontSize: Typography.sizes.md,
      fontWeight: '700',
      color: c.textSecondary,
    },
    sellerInfo: {
      flex: 1,
      gap: 4,
    },
    sellerNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    sellerUsername: {
      fontSize: Typography.sizes.md,
      fontWeight: '600',
      color: c.text,
    },
    sellerMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      flexWrap: 'wrap',
    },
    sellerStats: {
      fontSize: Typography.sizes.xs,
      color: c.textMuted,
    },
    ratingPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: c.success + '18',
      borderRadius: BorderRadius.sm,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    ratingText: {
      fontSize: Typography.sizes.xs,
      fontWeight: '700',
      color: c.success,
    },
    unsaveBtn: {
      padding: Spacing.xs,
    },
    bottomPad: {
      height: Spacing.xl,
    },
  });
}
