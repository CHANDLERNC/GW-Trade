import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useLocalSearchParams, router, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { FactionBadge, CategoryBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MemberIcon } from '@/components/ui/MemberIcon';
import { useListing } from '@/hooks/useListings';
import { useComments } from '@/hooks/useComments';
import { listingsService } from '@/services/listings.service';
import { messagesService } from '@/services/messages.service';
import { useAuth } from '@/context/AuthContext';
import { FACTIONS } from '@/constants/factions';
import { resolveNameColor } from '@/constants/nameColors';
import { Comment } from '@/types';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function CommentBubble({
  comment,
  isOwn,
  isListingOwner,
  onDelete,
}: {
  comment: Comment;
  isOwn: boolean;
  isListingOwner: boolean;
  onDelete: (id: string) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createCommentStyles(colors), [colors]);
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
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="trash-outline" size={14} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function ListingDetailSkeleton() {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.85, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 650, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, gap: Spacing.lg }}
      scrollEnabled={false}
    >
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <Animated.View style={{ width: 68, height: 26, borderRadius: 4, backgroundColor: colors.surface, opacity }} />
        <Animated.View style={{ width: 68, height: 26, borderRadius: 4, backgroundColor: colors.surface, opacity }} />
      </View>
      <Animated.View style={{ height: 200, borderRadius: BorderRadius.lg, backgroundColor: colors.surface, opacity }} />
      <Animated.View style={{ width: '75%', height: 28, borderRadius: 6, backgroundColor: colors.surface, opacity }} />
      <Animated.View style={{ width: '40%', height: 14, borderRadius: 4, backgroundColor: colors.surface, opacity }} />
      <Animated.View style={{ height: 100, borderRadius: BorderRadius.lg, backgroundColor: colors.surface, opacity }} />
      <Animated.View style={{ height: 80, borderRadius: BorderRadius.lg, backgroundColor: colors.surface, opacity }} />
      <Animated.View style={{ height: 110, borderRadius: BorderRadius.lg, backgroundColor: colors.surface, opacity }} />
    </ScrollView>
  );
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { listing, loading } = useListing(id);
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation();
  const scrollRef = useRef<ScrollView>(null);

  const [contacting, setContacting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [ownerConvoCount, setOwnerConvoCount] = useState(0);

  const { comments, posting, addComment, deleteComment } = useComments(id ?? '');

  const isOwner = user?.id === listing?.user_id;

  useEffect(() => {
    if (!isOwner || !id) return;
    messagesService.getConversationCountForListing(id).then(setOwnerConvoCount);
  }, [isOwner, id]);
  const faction = listing ? FACTIONS[listing.faction] : null;

  useLayoutEffect(() => {
    if (!listing) return;
    navigation.setOptions({
      headerTitle: listing.title,
      headerRight: isOwner
        ? () => (
            <TouchableOpacity
              onPress={showOwnerMenu}
              style={styles.headerMenuBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
            </TouchableOpacity>
          )
        : undefined,
    });
  }, [listing, navigation, isOwner, colors]);

  const handleContact = async () => {
    if (!user || !listing) return;
    setContacting(true);
    const { data, error } = await messagesService.getOrCreateConversation(
      user.id,
      listing.user_id,
      listing.id
    );
    setContacting(false);
    if (error || !data) {
      Alert.alert('Error', 'Could not start conversation.');
    } else {
      router.push(`/conversation/${data.id}`);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Listing', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!listing) return;
          setDeleting(true);
          await listingsService.deleteListing(listing.id);
          setDeleting(false);
          router.replace('/(tabs)/profile');
        },
      },
    ]);
  };

  const handleToggleActive = async () => {
    if (!listing) return;
    setToggling(true);
    await listingsService.toggleActive(listing.id, !listing.is_active);
    router.replace(`/listing/${listing.id}`);
    setToggling(false);
  };

  const showOwnerMenu = () => {
    if (!listing) return;
    Alert.alert('Manage Listing', undefined, [
      { text: 'Edit', onPress: () => router.push(`/listing/edit/${listing.id}`) },
      {
        text: listing.is_active ? 'Deactivate' : 'Activate',
        onPress: () => {
          if (listing.is_active) {
            Alert.alert(
              'Deactivate Listing',
              'Your listing will be hidden from Browse. You can reactivate it at any time.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Deactivate', style: 'destructive', onPress: handleToggleActive },
              ]
            );
          } else {
            handleToggleActive();
          }
        },
      },
      { text: 'Delete', style: 'destructive', onPress: handleDelete },
      { text: 'Close', style: 'cancel' },
    ]);
  };

  const handleSubmitComment = async () => {
    const text = commentText.trim();
    if (!text || !user) return;
    setCommentText('');
    const { error } = await addComment(user.id, text);
    if (error) {
      Alert.alert('Error', (error as any)?.message ?? 'Could not post comment.');
      setCommentText(text);
    } else {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ListingDetailSkeleton />
      </SafeAreaView>
    );
  }

  if (!listing) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Listing not found.</Text>
        <Button title="Go Back" onPress={() => router.back()} variant="secondary" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.badgeRow}>
            <FactionBadge faction={listing.faction} size="md" />
            <CategoryBadge category={listing.category} size="md" />
            {!listing.is_active && (
              <View style={styles.inactivePill}>
                <Text style={styles.inactiveText}>INACTIVE</Text>
              </View>
            )}
          </View>

          {isOwner && ownerConvoCount > 0 && (
            <TouchableOpacity
              style={styles.convosBtn}
              onPress={() => router.push('/(tabs)/inbox')}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.accent} />
              <Text style={styles.convosBtnText}>
                {ownerConvoCount} {ownerConvoCount === 1 ? 'inquiry' : 'inquiries'} about this listing
              </Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          )}

          {listing.image_url && (
            <Image source={{ uri: listing.image_url }} style={styles.listingImage} resizeMode="cover" />
          )}

          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.meta}>Posted {timeAgo(listing.created_at)}</Text>

          {faction && (
            <View style={[styles.factionStrip, { borderLeftColor: faction.color }]}>
              <Text style={[styles.factionName, { color: faction.color }]}>{faction.name}</Text>
              <Text style={styles.factionDesc}>{faction.description}</Text>
            </View>
          )}

          <View style={styles.detailsGrid}>
            {listing.want_in_return && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="swap-horizontal" size={18} color={colors.accent} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Wants in return</Text>
                  <Text style={styles.detailValue}>{listing.want_in_return}</Text>
                </View>
              </View>
            )}
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="layers" size={18} color={colors.accent} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Quantity</Text>
                <Text style={styles.detailValue}>x{listing.quantity}</Text>
              </View>
            </View>
          </View>

          {listing.description ? (
            <View style={styles.descriptionBox}>
              <Text style={styles.descLabel}>Description</Text>
              <Text style={styles.descText}>{listing.description}</Text>
            </View>
          ) : null}

          <View style={styles.sellerBox}>
            <Text style={styles.sellerSectionLabel}>SELLER</Text>
            <View style={styles.sellerRow}>
              <View style={styles.sellerAvatar}>
                <Text style={styles.sellerAvatarText}>
                  {(listing.profiles?.username ?? '?')[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.sellerNameWrap}>
                <Text style={styles.sellerUsername}>
                  {listing.profiles?.display_name ?? listing.profiles?.username ?? 'Unknown'}
                </Text>
                <MemberIcon
                  isLifetime={listing.profiles?.is_lifetime_member}
                  isMember={listing.profiles?.is_member}
                  isEarlyAdopter={listing.profiles?.is_early_adopter}
                  size={15}
                />
                {listing.profiles?.faction_preference && (
                  <FactionBadge faction={listing.profiles.faction_preference} />
                )}
              </View>
            </View>
          </View>

          <View style={styles.commentsSection}>
            <Text style={styles.commentsLabel}>NEGOTIATION BOARD</Text>
            <Text style={styles.commentsSubtitle}>Ask questions, make offers, negotiate here</Text>

            {comments.length === 0 ? (
              <View style={styles.emptyComments}>
                <Ionicons name="chatbubbles-outline" size={28} color={colors.textMuted} />
                <Text style={styles.emptyCommentsText}>No offers yet — be the first to negotiate</Text>
              </View>
            ) : (
              <View style={styles.commentsList}>
                {comments.map((c) => (
                  <CommentBubble
                    key={c.id}
                    comment={c}
                    isOwn={user?.id === c.user_id}
                    isListingOwner={isOwner}
                    onDelete={deleteComment}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {user && (
          <View style={styles.commentInputBar}>
            <TextInput
              style={styles.commentTextInput}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Make an offer or ask a question..."
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={500}
              returnKeyType="default"
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!commentText.trim() || posting) && styles.sendBtnDisabled]}
              onPress={handleSubmitComment}
              disabled={!commentText.trim() || posting}
              activeOpacity={0.8}
            >
              {posting ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Ionicons name="send" size={16} color={colors.background} />
              )}
            </TouchableOpacity>
          </View>
        )}

        {!isOwner && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.messageBtn, contacting && styles.messageBtnDisabled]}
              onPress={handleContact}
              disabled={contacting}
              activeOpacity={0.85}
            >
              {contacting ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Ionicons name="chatbubble-ellipses" size={18} color={colors.background} />
              )}
              <Text style={styles.messageBtnText}>
                {contacting ? 'Opening...' : 'Message Seller'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createCommentStyles(c: ThemeColors) {
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

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },
    center: { flex: 1, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
    notFound: { fontSize: Typography.sizes.lg, color: c.textSecondary },
    scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.lg },
    badgeRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
    title: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: c.text, lineHeight: 32 },
    meta: { fontSize: Typography.sizes.sm, color: c.textMuted, marginTop: -Spacing.sm },
    factionStrip: {
      backgroundColor: c.surface, borderRadius: BorderRadius.md,
      borderLeftWidth: 3, padding: Spacing.md, gap: Spacing.xs,
    },
    factionName: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
    factionDesc: { fontSize: Typography.sizes.sm, color: c.textSecondary },
    detailsGrid: {
      backgroundColor: c.surface, borderRadius: BorderRadius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder, overflow: 'hidden',
    },
    detailRow: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: c.surfaceBorder,
    },
    detailIcon: {
      width: 36, height: 36, borderRadius: BorderRadius.sm,
      backgroundColor: c.accent + '15', alignItems: 'center', justifyContent: 'center',
    },
    detailContent: { gap: 2 },
    detailLabel: { fontSize: Typography.sizes.xs, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
    detailValue: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: c.text },
    descriptionBox: {
      backgroundColor: c.surface, borderRadius: BorderRadius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder, padding: Spacing.md, gap: Spacing.sm,
    },
    descLabel: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
    descText: { fontSize: Typography.sizes.md, color: c.textSecondary, lineHeight: 24 },
    sellerBox: {
      backgroundColor: c.surface, borderRadius: BorderRadius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder, padding: Spacing.md, gap: Spacing.md,
    },
    sellerSectionLabel: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: c.textMuted, letterSpacing: 1 },
    sellerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    sellerAvatar: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: c.surfaceElevated, borderWidth: 1, borderColor: c.surfaceBorder,
      alignItems: 'center', justifyContent: 'center',
    },
    sellerAvatarText: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: c.text },
    sellerNameWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
    sellerUsername: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: c.text },
    commentsSection: { gap: Spacing.md },
    commentsLabel: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: c.textMuted, letterSpacing: 1.5 },
    commentsSubtitle: { fontSize: Typography.sizes.sm, color: c.textMuted, marginTop: -Spacing.sm },
    emptyComments: {
      alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl,
      backgroundColor: c.surface, borderRadius: BorderRadius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder,
    },
    emptyCommentsText: { fontSize: Typography.sizes.sm, color: c.textMuted, textAlign: 'center' },
    commentsList: { gap: Spacing.md },
    commentInputBar: {
      flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
      borderTopWidth: 1, borderTopColor: c.surfaceBorder, backgroundColor: c.background,
    },
    commentTextInput: {
      flex: 1, backgroundColor: c.surface, borderRadius: BorderRadius.md,
      borderWidth: 1, borderColor: c.surfaceBorder,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
      fontSize: Typography.sizes.sm, color: c.text, maxHeight: 100,
    },
    sendBtn: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center',
    },
    sendBtnDisabled: { opacity: 0.35 },
    convosBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: c.accent + '15',
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.accent + '33',
      padding: Spacing.md,
    },
    convosBtnText: {
      flex: 1,
      fontSize: Typography.sizes.sm,
      color: c.accent,
      fontWeight: Typography.weights.semibold,
    },
    headerMenuBtn: { marginRight: Spacing.sm },
    actions: {
      paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
      borderTopWidth: 1, borderTopColor: c.surfaceBorder, backgroundColor: c.background,
    },
    messageBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: Spacing.sm, backgroundColor: c.accent, borderRadius: BorderRadius.md, paddingVertical: 14,
    },
    messageBtnDisabled: { opacity: 0.5 },
    messageBtnText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: c.background, letterSpacing: 0.3 },
    inactivePill: {
      backgroundColor: c.danger + '22', borderRadius: BorderRadius.sm,
      paddingHorizontal: Spacing.sm, paddingVertical: 4,
      borderWidth: 1, borderColor: c.danger + '44',
    },
    inactiveText: { fontSize: Typography.sizes.xs, color: c.danger, fontWeight: Typography.weights.bold },
    listingImage: { width: '100%', height: 200, borderRadius: BorderRadius.lg, backgroundColor: c.surface },
  });
}
