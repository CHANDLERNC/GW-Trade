import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { FACTIONS } from '@/constants/factions';
import { LFGPost, LFGZone } from '@/types';
import { messagesService } from '@/services/messages.service';
import { useState } from 'react';

const ZONE_LABELS: Record<LFGZone, string> = {
  any: 'Any Zone',
  pha_lang: 'Pha Lang',
  nam_thaven: 'Nam Thaven',
  kiu_vongsa: 'Kiu Vongsa',
  ybl_1: 'YBL-1',
  ban_pa: 'Ban Pa',
  fort_narith: 'Fort Narith',
  midnight_sapphire: 'Midnight Sapphire',
  tiger_bay: 'Tiger Bay',
  hunters_paradise: "Hunter's Paradise",
  falng_airfield: 'F.A.L.N.G. Airfield',
};

const ZONE_ICONS: Record<LFGZone, string> = {
  any: 'map',
  pha_lang: 'home',
  nam_thaven: 'home',
  kiu_vongsa: 'home',
  ybl_1: 'layers',
  ban_pa: 'people',
  fort_narith: 'shield',
  midnight_sapphire: 'diamond',
  tiger_bay: 'warning',
  hunters_paradise: 'compass',
  falng_airfield: 'airplane',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface Props {
  post: LFGPost;
  onClose?: (postId: string) => void;
}

export function LFGCard({ post, onClose }: Props) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [contacting, setContacting] = useState(false);

  const faction = FACTIONS[post.faction];
  const isOwn = user?.id === post.user_id;
  const displayName = post.profiles?.display_name ?? post.profiles?.username ?? 'Operator';
  const nameColor = post.profiles?.display_name_color ?? colors.text;

  async function handleContact() {
    if (!user || isOwn) return;
    setContacting(true);
    const { data, error } = await messagesService.getOrCreateConversation(
      user.id,
      post.user_id
    );
    setContacting(false);
    if (!error && data) {
      router.push(`/conversation/${data.id}`);
    }
  }

  return (
    <View style={styles.card}>
      {/* Faction accent bar */}
      <View style={[styles.factionBar, { backgroundColor: faction.color }]} />

      <View style={styles.body}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.factionBadge}>
            <Text style={[styles.factionBadgeText, { color: faction.color }]}>
              {faction.shortName}
            </Text>
          </View>
          <Text style={styles.displayName} numberOfLines={1}>
            <Text style={{ color: nameColor }}>{displayName}</Text>
          </Text>
          <Text style={styles.time}>{timeAgo(post.created_at)}</Text>
        </View>

        {/* Tags row */}
        <View style={styles.tagsRow}>
          <View style={styles.tag}>
            <Ionicons
              name={ZONE_ICONS[post.zone] as any}
              size={11}
              color={colors.accent}
              style={{ marginRight: 3 }}
            />
            <Text style={styles.tagText}>{ZONE_LABELS[post.zone]}</Text>
          </View>

          <View style={styles.tag}>
            <Ionicons name="globe-outline" size={11} color={colors.textMuted} style={{ marginRight: 3 }} />
            <Text style={[styles.tagText, { color: colors.textMuted }]}>{post.region}</Text>
          </View>

          {post.mic_required && (
            <View style={[styles.tag, styles.tagMic]}>
              <Ionicons name="mic" size={11} color={colors.warning} style={{ marginRight: 3 }} />
              <Text style={[styles.tagText, { color: colors.warning }]}>Mic req.</Text>
            </View>
          )}

          <View style={styles.slotsTag}>
            {Array.from({ length: post.slots_total }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.slotDot,
                  // First dot = poster (filled), rest = open
                  i === 0
                    ? { backgroundColor: faction.color }
                    : { backgroundColor: colors.surfaceBorder },
                ]}
              />
            ))}
            <Text style={styles.slotsLabel}>
              {post.slots_total - 1} open
            </Text>
          </View>
        </View>

        {/* Description */}
        {!!post.description && (
          <Text style={styles.description} numberOfLines={2}>
            {post.description}
          </Text>
        )}

        {/* Action row */}
        <View style={styles.actionRow}>
          {isOwn ? (
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => onClose?.(post.id)}
              activeOpacity={0.75}
            >
              <Ionicons name="close-circle-outline" size={14} color={colors.danger} />
              <Text style={styles.closeBtnText}>Close Post</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.contactBtn, { borderColor: faction.color + '80' }]}
              onPress={handleContact}
              activeOpacity={0.75}
              disabled={contacting}
            >
              {contacting ? (
                <ActivityIndicator size="small" color={faction.color} />
              ) : (
                <>
                  <Ionicons name="chatbubble-ellipses" size={14} color={faction.color} />
                  <Text style={[styles.contactBtnText, { color: faction.color }]}>
                    Message
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      overflow: 'hidden',
    },
    factionBar: {
      width: 3,
    },
    body: {
      flex: 1,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    factionBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
      backgroundColor: c.surfaceElevated,
    },
    factionBadgeText: {
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.weights.bold,
      letterSpacing: 0.5,
    },
    displayName: {
      flex: 1,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.weights.semibold,
      color: c.text,
    },
    time: {
      fontSize: Typography.sizes.xs,
      color: c.textMuted,
    },
    tagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
      alignItems: 'center',
    },
    tag: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: BorderRadius.full,
      backgroundColor: c.surfaceElevated,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
    },
    tagMic: {
      borderColor: c.warning + '60',
      backgroundColor: c.warning + '15',
    },
    tagText: {
      fontSize: Typography.sizes.xs,
      color: c.accent,
      fontWeight: Typography.weights.medium,
    },
    slotsTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      marginLeft: Spacing.xs,
    },
    slotDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    slotsLabel: {
      fontSize: Typography.sizes.xs,
      color: c.textMuted,
      marginLeft: 4,
    },
    description: {
      fontSize: Typography.sizes.sm,
      color: c.textSecondary,
      lineHeight: 18,
    },
    actionRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 2,
    },
    contactBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.md,
      paddingVertical: 7,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      backgroundColor: 'transparent',
      minWidth: 80,
      justifyContent: 'center',
    },
    contactBtnText: {
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.weights.semibold,
    },
    closeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.md,
      paddingVertical: 7,
    },
    closeBtnText: {
      fontSize: Typography.sizes.sm,
      color: c.danger,
      fontWeight: Typography.weights.medium,
    },
  });
}
