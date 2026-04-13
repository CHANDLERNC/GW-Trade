import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { MemberIcon } from '@/components/ui/MemberIcon';
import { resolveNameColor } from '@/constants/nameColors';
import { timeAgo } from '@/utils/dateFormat';
import { Comment } from '@/types';

interface CommentBubbleProps {
  comment: Comment;
  isOwn: boolean;
  isListingOwner: boolean;
  onDelete: (id: string) => void;
}

export function CommentBubble({ comment, isOwn, isListingOwner, onDelete }: CommentBubbleProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const canDelete = isOwn || isListingOwner;
  const name = comment.profiles?.display_name ?? comment.profiles?.username ?? 'Unknown';
  const initial = name[0].toUpperCase();
  const nameColor = resolveNameColor(comment.profiles?.display_name_color);

  const handleDelete = () => {
    Alert.alert('Delete Comment', 'Remove this comment?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(comment.id) },
    ]);
  };

  return (
    <View style={styles.commentRow}>
      <View style={styles.commentAvatar}>
        <Text style={styles.commentAvatarText}>{initial}</Text>
      </View>
      <View style={styles.commentBody}>
        <View style={styles.commentMeta}>
          <View style={styles.commentNameRow}>
            <Text style={[styles.commentUsername, { color: nameColor }]}>{name}</Text>
            <MemberIcon
              isLifetime={comment.profiles?.is_lifetime_member}
              isMember={comment.profiles?.is_member}
              isEarlyAdopter={comment.profiles?.is_early_adopter}
              size={12}
            />
          </View>
          <Text style={styles.commentTime}>{timeAgo(comment.created_at)}</Text>
        </View>
        <Text style={styles.commentContent}>{comment.content}</Text>
      </View>
      {canDelete && (
        <TouchableOpacity
          onPress={handleDelete}
          style={styles.deleteBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={14} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    commentRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
    commentAvatar: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: c.surfaceElevated,
      borderWidth: 1, borderColor: c.surfaceBorder,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    commentAvatarText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: c.textSecondary },
    commentBody: {
      flex: 1, backgroundColor: c.surface,
      borderRadius: BorderRadius.md, borderWidth: 1, borderColor: c.surfaceBorder,
      padding: Spacing.sm, gap: Spacing.xs,
    },
    commentMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    commentNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    commentUsername: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold },
    commentTime: { fontSize: Typography.sizes.xs, color: c.textMuted },
    commentContent: { fontSize: Typography.sizes.sm, color: c.text, lineHeight: 20 },
    deleteBtn: { paddingTop: Spacing.xs, flexShrink: 0 },
  });
}
