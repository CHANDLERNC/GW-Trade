import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ThemeColors, BorderRadius, Typography, Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { Conversation } from '@/types';
import { timeAgoShort } from '@/utils/dateFormat';

interface ConversationRowProps {
  conversation: Conversation;
  currentUserId: string;
}

export function ConversationRow({ conversation, currentUserId }: ConversationRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const isParticipantOne = conversation.participant_one === currentUserId;
  const other = isParticipantOne ? conversation.profiles_two : conversation.profiles_one;
  const displayName = other?.display_name ?? other?.username ?? 'Unknown';
  const initial = displayName[0].toUpperCase();
  const hasUnread = (conversation.unread_count ?? 0) > 0;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/conversation/${conversation.id}`)}
      activeOpacity={0.75}
    >
      <View style={[styles.avatar, hasUnread && styles.avatarUnread]}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, hasUnread && styles.nameUnread]} numberOfLines={1}>
              {displayName}
            </Text>
            {hasUnread && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.time}>{timeAgoShort(conversation.last_message_at)}</Text>
        </View>

        {conversation.listings && (
          <Text style={styles.listingRef} numberOfLines={1}>
            Re: {conversation.listings.title}
          </Text>
        )}

        <Text style={[styles.preview, hasUnread && styles.previewUnread]} numberOfLines={1}>
          {conversation.last_message_preview
            ? `${conversation.last_message_sender_id === currentUserId ? 'You: ' : ''}${conversation.last_message_preview}`
            : 'No messages yet'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      gap: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.surfaceBorder,
    },
    avatar: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: c.surfaceElevated,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    avatarUnread: {
      borderColor: c.accent,
      backgroundColor: c.accent + '18',
    },
    avatarText: {
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.weights.bold,
      color: c.textSecondary,
    },
    content: { flex: 1, gap: 3 },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      flex: 1,
      marginRight: Spacing.xs,
    },
    name: {
      fontSize: Typography.sizes.md,
      fontWeight: Typography.weights.semibold,
      color: c.textSecondary,
      flexShrink: 1,
    },
    nameUnread: {
      color: c.text,
      fontWeight: Typography.weights.bold,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.accent,
      flexShrink: 0,
    },
    time: {
      fontSize: Typography.sizes.xs,
      color: c.textMuted,
    },
    listingRef: {
      fontSize: Typography.sizes.xs,
      color: c.accent,
      fontWeight: Typography.weights.medium,
    },
    preview: {
      fontSize: Typography.sizes.sm,
      color: c.textMuted,
    },
    previewUnread: {
      color: c.textSecondary,
      fontWeight: Typography.weights.medium,
    },
  });
}
