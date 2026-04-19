import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Modal,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router, useNavigation } from 'expo-router';
import { useHeaderHeight } from '@react-navigation/elements';
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
import { priceHistoryService } from '@/services/priceHistory.service';
import { safetyService } from '@/services/safety.service';
import { useAuth } from '@/context/AuthContext';
import { FACTIONS } from '@/constants/factions';
import { timeAgo } from '@/utils/dateFormat';
import { PriceHistoryEntry } from '@/types';
import { CommentBubble } from '@/components/listings/CommentBubble';
import { ListingDetailSkeleton } from '@/components/listings/ListingDetailSkeleton';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { listing, loading } = useListing(id);
  const headerHeight = useHeaderHeight();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation();
  const scrollRef = useRef<ScrollView>(null);

  const [contacting, setContacting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [markingSold, setMarkingSold] = useState(false);
  const [soldModalVisible, setSoldModalVisible] = useState(false);
  const [soldPrice, setSoldPrice] = useState('');
  const [commentText, setCommentText] = useState('');
  const [ownerConvoCount, setOwnerConvoCount] = useState(0);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([]);

  const { comments, posting, addComment, deleteComment } = useComments(id ?? '');

  const isOwner = user?.id === listing?.user_id;

  useEffect(() => {
    if (!listing) return;
    if (listing.category === 'keys' && listing.key_name) {
      priceHistoryService.getKeyPriceHistory(listing.key_name).then(setPriceHistory);
    } else {
      setPriceHistory([]);
    }
  }, [listing?.key_name, listing?.category]);

  useEffect(() => {
    if (!isOwner || !id) return;
    messagesService.getConversationCountForListing(id).then(setOwnerConvoCount);
  }, [isOwner, id]);
  const faction = listing ? FACTIONS[listing.faction] : null;

  useLayoutEffect(() => {
    if (!listing) return;
    navigation.setOptions({
      headerTitle: listing.title,
      headerRight: () => (
        <TouchableOpacity
          onPress={isOwner ? showOwnerMenu : showReportMenu}
          style={styles.headerMenuBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
        </TouchableOpacity>
      ),
    });
  }, [listing, navigation, isOwner, colors, showReportMenu]);

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

  const handleMarkSoldConfirm = async () => {
    if (!listing) return;
    setMarkingSold(true);
    setSoldModalVisible(false);
    const { error } = await listingsService.markListingSold(listing.id, soldPrice);
    setMarkingSold(false);
    setSoldPrice('');
    if (error) {
      Alert.alert('Error', (error as any)?.message ?? 'Could not mark as sold.');
    } else {
      Alert.alert('Marked as Sold', 'Your listing has been closed and the sale recorded.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/profile') },
      ]);
    }
  };

  const showReportMenu = useCallback(() => {
    if (!listing) return;
    Alert.alert('Report Listing', 'Why are you reporting this listing?', [
      { text: 'Scam / Fraud', onPress: () => submitListingReport('scam') },
      { text: 'Spam', onPress: () => submitListingReport('spam') },
      { text: 'Inappropriate', onPress: () => submitListingReport('inappropriate') },
      { text: 'Other', onPress: () => submitListingReport('other') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [listing]);

  const submitListingReport = async (reason: 'scam' | 'harassment' | 'spam' | 'inappropriate' | 'other') => {
    if (!listing) return;
    const { error } = await safetyService.reportUser(listing.user_id, reason, undefined, listing.id) as any;
    if (error?.code === '23505') {
      Alert.alert('Already Reported', 'You have already reported this listing.');
    } else if (!error) {
      Alert.alert('Report Submitted', 'Thank you. Our team will review this listing within 48 hours.');
    }
  };

  const showOwnerMenu = () => {
    if (!listing) return;
    const options: any[] = [
      { text: 'Edit', onPress: () => router.push(`/listing/edit/${listing.id}`) },
    ];

    if (listing.is_active) {
      options.push({
        text: 'Deactivate',
        onPress: () =>
          Alert.alert(
            'Deactivate Listing',
            'Your listing will be hidden from Browse. You can reactivate it at any time.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Deactivate', style: 'destructive', onPress: handleToggleActive },
            ]
          ),
      });
    } else {
      options.push({ text: 'Activate', onPress: handleToggleActive });
    }

    options.push({ text: 'Delete', style: 'destructive', onPress: handleDelete });
    options.push({ text: 'Close', style: 'cancel' });

    Alert.alert('Manage Listing', undefined, options);
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
        behavior="padding"
        keyboardVerticalOffset={headerHeight}
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

          {priceHistory.length > 0 && (
            <View style={styles.priceHistoryBox}>
              <View style={styles.priceHistoryHeader}>
                <Ionicons name="trending-up" size={14} color={colors.accent} />
                <Text style={styles.priceHistoryLabel}>RECENT TRADES FOR THIS ITEM</Text>
              </View>
              {priceHistory.map((entry) => (
                <View key={entry.id} style={styles.priceHistoryRow}>
                  <View style={styles.priceHistoryItem}>
                    <Text style={styles.priceHistoryItemName} numberOfLines={1}>{entry.item_name}</Text>
                    {entry.want_in_return ? (
                      <View style={styles.priceHistoryWant}>
                        <Ionicons name="swap-horizontal" size={12} color={colors.textMuted} />
                        <Text style={styles.priceHistoryWantText} numberOfLines={1}>{entry.want_in_return}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.priceHistoryTime}>{timeAgo(entry.completed_at)}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.sellerBox}>
            <Text style={styles.sellerSectionLabel}>SELLER</Text>
            <TouchableOpacity
              style={styles.sellerRow}
              onPress={() => router.push(`/user/${listing.user_id}`)}
              activeOpacity={0.75}
            >
              <View style={styles.sellerAvatar}>
                <Text style={styles.sellerAvatarText}>
                  {(listing.profiles?.username ?? '?')[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.sellerNameWrap}>
                <Text style={styles.sellerUsername} numberOfLines={1}>
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
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
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

        {isOwner && listing.is_active && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.markSoldBtn, markingSold && styles.markSoldBtnDisabled]}
              onPress={() => { setSoldPrice(listing.want_in_return ?? ''); setSoldModalVisible(true); }}
              disabled={markingSold}
              activeOpacity={0.85}
            >
              {markingSold ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Ionicons name="checkmark-circle" size={18} color={colors.background} />
              )}
              <Text style={styles.markSoldBtnText}>
                {markingSold ? 'Saving...' : 'Mark as Sold'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Mark as Sold modal */}
      <Modal
        visible={soldModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSoldModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.soldModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.soldModalSheet}>
            <Text style={styles.soldModalTitle}>Mark as Sold</Text>
            <Text style={styles.soldModalSubtitle}>
              {listing?.category === 'keys'
                ? 'Enter the final price to record in market history.'
                : 'This will close the listing.'}
            </Text>

            {listing?.category === 'keys' && (
              <View style={styles.soldPriceField}>
                <Text style={styles.soldPriceLabel}>FINAL SOLD PRICE</Text>
                <TextInput
                  style={styles.soldPriceInput}
                  value={soldPrice}
                  onChangeText={setSoldPrice}
                  placeholder="e.g. 50,000 Rubles"
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleMarkSoldConfirm}
                />
              </View>
            )}

            <View style={styles.soldModalActions}>
              <TouchableOpacity
                style={styles.soldCancelBtn}
                onPress={() => { setSoldModalVisible(false); setSoldPrice(''); }}
                activeOpacity={0.8}
              >
                <Text style={styles.soldCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.soldConfirmBtn, markingSold && styles.soldConfirmBtnDisabled]}
                onPress={handleMarkSoldConfirm}
                disabled={markingSold}
                activeOpacity={0.8}
              >
                {markingSold ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Text style={styles.soldConfirmText}>Confirm Sold</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
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
    priceHistoryBox: {
      backgroundColor: c.surface, borderRadius: BorderRadius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder, padding: Spacing.md, gap: Spacing.sm,
    },
    priceHistoryHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    priceHistoryLabel: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: c.accent, textTransform: 'uppercase', letterSpacing: 0.5 },
    priceHistoryRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: Spacing.xs, borderTopWidth: 1, borderTopColor: c.surfaceBorder,
    },
    priceHistoryItem: { flex: 1, gap: 2 },
    priceHistoryItemName: { fontSize: Typography.sizes.sm, color: c.text, fontWeight: Typography.weights.medium },
    priceHistoryWant: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    priceHistoryWantText: { fontSize: Typography.sizes.xs, color: c.textMuted, flex: 1 },
    priceHistoryTime: { fontSize: Typography.sizes.xs, color: c.textMuted, marginLeft: Spacing.sm },
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
    sellerNameWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexShrink: 1 },
    sellerUsername: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: c.text, flexShrink: 1 },
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
    soldModalOverlay: {
      flex: 1,
      backgroundColor: '#00000088',
      justifyContent: 'flex-end',
    },
    soldModalSheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      padding: Spacing.xl,
      gap: Spacing.md,
      borderTopWidth: 1,
      borderColor: c.surfaceBorder,
    },
    soldModalTitle: {
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.weights.bold,
      color: c.text,
    },
    soldModalSubtitle: {
      fontSize: Typography.sizes.sm,
      color: c.textSecondary,
      marginTop: -Spacing.xs,
    },
    soldPriceField: { gap: Spacing.xs },
    soldPriceLabel: {
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.weights.bold,
      color: c.textMuted,
      letterSpacing: 1.2,
    },
    soldPriceInput: {
      backgroundColor: c.surfaceElevated,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      fontSize: Typography.sizes.md,
      color: c.text,
      height: 48,
    },
    soldModalActions: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: Spacing.xs,
    },
    soldCancelBtn: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      alignItems: 'center',
    },
    soldCancelText: {
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.weights.semibold,
      color: c.textSecondary,
    },
    soldConfirmBtn: {
      flex: 2,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      backgroundColor: c.accent,
      alignItems: 'center',
    },
    soldConfirmBtnDisabled: { opacity: 0.5 },
    soldConfirmText: {
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.weights.bold,
      color: c.background,
    },
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
    markSoldBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: Spacing.sm, backgroundColor: c.accent, borderRadius: BorderRadius.md, paddingVertical: 14,
    },
    markSoldBtnDisabled: { opacity: 0.5 },
    markSoldBtnText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: c.background, letterSpacing: 0.3 },
    inactivePill: {
      backgroundColor: c.danger + '22', borderRadius: BorderRadius.sm,
      paddingHorizontal: Spacing.sm, paddingVertical: 4,
      borderWidth: 1, borderColor: c.danger + '44',
    },
    inactiveText: { fontSize: Typography.sizes.xs, color: c.danger, fontWeight: Typography.weights.bold },
  });
}
