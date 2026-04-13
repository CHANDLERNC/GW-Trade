import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { ThemeColors, BorderRadius, Typography, Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { FactionBadge, CategoryBadge } from '@/components/ui/Badge';
import { MemberIcon } from '@/components/ui/MemberIcon';
import { Listing } from '@/types';
import { timeAgo, timeUntilExpiry } from '@/utils/dateFormat';

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/listing/${listing.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.badges}>
          <FactionBadge faction={listing.faction} />
          <CategoryBadge category={listing.category} />
        </View>
        <Text style={styles.time}>{timeAgo(listing.created_at)}</Text>
      </View>

      <View style={styles.titleRow}>
        <Text style={[styles.title, listing.image_url && styles.titleWithImage]} numberOfLines={2}>
          {listing.title}
        </Text>
        {listing.image_url && (
          <Image source={{ uri: listing.image_url }} style={styles.thumbnail} />
        )}
      </View>

      {listing.want_in_return && (
        <View style={styles.wantRow}>
          <Text style={styles.wantLabel}>WANTS</Text>
          <Text style={styles.wantText} numberOfLines={1}>
            {listing.want_in_return}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {(listing.profiles?.username ?? '?')[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.username}>{listing.profiles?.username ?? 'Unknown'}</Text>
        <MemberIcon
          isLifetime={listing.profiles?.is_lifetime_member}
          isMember={listing.profiles?.is_member}
          isEarlyAdopter={listing.profiles?.is_early_adopter}
          size={13}
        />
        {listing.quantity > 1 && (
          <Text style={styles.qty}>x{listing.quantity}</Text>
        )}
        {listing.expires_at && listing.is_active && (() => {
          const label = timeUntilExpiry(listing.expires_at);
          const isUrgent = new Date(listing.expires_at).getTime() - Date.now() < 6 * 3600000;
          return (
            <View style={[styles.expiryPill, isUrgent && styles.expiryPillUrgent]}>
              <Text style={[styles.expiryText, isUrgent && styles.expiryTextUrgent]}>{label}</Text>
            </View>
          );
        })()}
        {!listing.is_active && (
          <View style={styles.inactivePill}>
            <Text style={styles.inactiveText}>INACTIVE</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.sm,
    },
    titleWithImage: { flex: 1 },
    thumbnail: {
      width: 64,
      height: 64,
      borderRadius: BorderRadius.md,
      backgroundColor: c.surfaceElevated,
      flexShrink: 0,
    },
    badges: {
      flexDirection: 'row',
      gap: Spacing.xs,
      flexWrap: 'wrap',
      flex: 1,
    },
    time: {
      fontSize: Typography.sizes.xs,
      color: c.textMuted,
      marginLeft: Spacing.sm,
    },
    title: {
      fontSize: Typography.sizes.md,
      fontWeight: Typography.weights.semibold,
      color: c.text,
      lineHeight: 22,
    },
    wantRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      backgroundColor: c.surfaceElevated,
      borderRadius: BorderRadius.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    wantLabel: {
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.weights.bold,
      color: c.accent,
      letterSpacing: 0.5,
    },
    wantText: {
      fontSize: Typography.sizes.sm,
      color: c.textSecondary,
      flex: 1,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    avatarCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: c.surfaceElevated,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 10,
      fontWeight: Typography.weights.bold,
      color: c.textSecondary,
    },
    username: {
      fontSize: Typography.sizes.sm,
      color: c.textSecondary,
      flex: 1,
    },
    qty: {
      fontSize: Typography.sizes.xs,
      color: c.textMuted,
      fontWeight: Typography.weights.medium,
    },
    expiryPill: {
      backgroundColor: c.surfaceElevated,
      borderRadius: BorderRadius.sm,
      paddingHorizontal: Spacing.xs + 2,
      paddingVertical: 2,
    },
    expiryPillUrgent: { backgroundColor: c.warning + '22' },
    expiryText: {
      fontSize: Typography.sizes.xs,
      color: c.textMuted,
      fontWeight: Typography.weights.medium,
    },
    expiryTextUrgent: {
      color: c.warning,
      fontWeight: Typography.weights.bold,
    },
    inactivePill: {
      backgroundColor: c.danger + '22',
      borderRadius: BorderRadius.sm,
      paddingHorizontal: Spacing.xs + 2,
      paddingVertical: 2,
    },
    inactiveText: {
      fontSize: Typography.sizes.xs,
      color: c.danger,
      fontWeight: Typography.weights.bold,
    },
  });
}
