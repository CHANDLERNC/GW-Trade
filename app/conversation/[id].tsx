import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useHeaderHeight } from '@react-navigation/elements';
import { useLayoutEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useMessages } from '@/hooks/useMessages';
import { messagesService } from '@/services/messages.service';
import { tradesService } from '@/services/trades.service';
import { useAuth } from '@/context/AuthContext';
import { TradeRatingModal } from '@/components/ui/TradeRatingModal';
import { Message, Trade } from '@/types';
import { supabase } from '@/lib/supabase';

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createBubbleStyles(colors), [colors]);

  return (
    <View style={[styles.bubbleWrapper, isOwn && styles.bubbleWrapperOwn]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        <Text style={[styles.bubbleText, isOwn && styles.bubbleTextOwn]}>
          {message.content}
        </Text>
        <Text style={[styles.bubbleTime, isOwn && styles.bubbleTimeOwn]}>
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const headerHeight = useHeaderHeight();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation();
  const { messages, loading } = useMessages(id);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Conversation meta
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState('');
  const [listingId, setListingId] = useState<string | null>(null);

  // Trade state
  const [trade, setTrade] = useState<Trade | null>(null);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [myRatingSubmitted, setMyRatingSubmitted] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);

  // Load conversation meta (partner ID + name, listing ID)
  useEffect(() => {
    if (!id || !user) return;
    supabase
      .from('conversations')
      .select(`
        listing_id,
        participant_one,
        participant_two,
        profiles_one:participant_one (id, username, display_name),
        profiles_two:participant_two (id, username, display_name)
      `)
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        const isOne = data.participant_one === user.id;
        const other = isOne ? (data.profiles_two as any) : (data.profiles_one as any);
        const name = other?.display_name ?? other?.username ?? 'Operator';
        setPartnerId(other?.id ?? null);
        setPartnerName(name);
        setListingId(data.listing_id ?? null);
        navigation.setOptions({ headerTitle: name });
      });
  }, [id, user, navigation]);

  // Load trade state
  const loadTrade = useCallback(async () => {
    if (!id) return;
    const t = await tradesService.getTradeForConversation(id);
    setTrade(t);

    // If trade is complete, check if we've already rated
    if (t?.completed_at && user) {
      const myRating = await tradesService.getMyRating(t.id, user.id);
      if (myRating) {
        setMyRatingSubmitted(true);
      } else {
        setRatingModalVisible(true);
      }
    }
  }, [id, user]);

  useEffect(() => { loadTrade(); }, [loadTrade]);

  // Keep trade state live — fires when partner confirms or trade completes
  useEffect(() => {
    if (!id || !user) return;
    const channel = tradesService.subscribeToTrade(id, async (updated) => {
      setTrade(updated);
      if (updated.completed_at) {
        const myRating = await tradesService.getMyRating(updated.id, user.id);
        if (!myRating) setRatingModalVisible(true);
        else setMyRatingSubmitted(true);
      }
    });
    return () => { channel.unsubscribe(); };
  }, [id, user]);

  useEffect(() => {
    if (id && user) messagesService.markAsRead(id, user.id);
  }, [id, user, messages.length]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const content = text.trim();
    if (!content || !user || !id) return;
    setText('');
    setSending(true);
    if (partnerId) await messagesService.sendMessage(id, user.id, content, partnerId);
    setSending(false);
  };

  const handleMarkComplete = async () => {
    if (!user || !id || !partnerId) return;

    // If already confirmed our side, do nothing
    const isPartyOne = trade?.party_one === user.id;
    const alreadyConfirmed = trade
      ? (isPartyOne ? trade.party_one_confirmed : trade.party_two_confirmed)
      : false;
    if (alreadyConfirmed) return;

    Alert.alert(
      'Mark Trade Complete',
      'Confirm that the trade was successfully completed. Both parties must confirm before ratings are unlocked.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setTradeLoading(true);
            const { data, error } = await tradesService.markComplete(id, user.id);
            setTradeLoading(false);
            if (error) {
              Alert.alert('Cannot Confirm Trade', error.message);
            } else {
              setTrade(data);
              if (data?.completed_at) {
                setRatingModalVisible(true);
              }
            }
          },
        },
      ],
    );
  };

  const handleSubmitRating = async (isPositive: boolean | null) => {
    if (!trade || !user || !partnerId) return;
    const { error } = await tradesService.submitRating(trade.id, user.id, partnerId, isPositive);
    if (error) {
      Alert.alert('Error', 'Could not submit rating. Please try again.');
    } else {
      setMyRatingSubmitted(true);
      setRatingModalVisible(false);
      Alert.alert('Rating Submitted', `Your rating for ${partnerName} has been recorded.`);
    }
  };

  // Derive trade banner state
  const tradeBannerState = useMemo(() => {
    if (!trade) return 'none';
    if (trade.completed_at) return 'complete';
    const isPartyOne = trade.party_one === user?.id;
    const myConfirmed = isPartyOne ? trade.party_one_confirmed : trade.party_two_confirmed;
    const theirConfirmed = isPartyOne ? trade.party_two_confirmed : trade.party_one_confirmed;
    if (myConfirmed && !theirConfirmed) return 'waiting';
    if (!myConfirmed && theirConfirmed) return 'partner_confirmed';
    return 'none';
  }, [trade, user]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
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
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble message={item} isOwn={item.sender_id === user?.id} />
          )}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
            </View>
          }
        />

        {/* Trade completion banner */}
        {tradeBannerState === 'complete' ? (
          <View style={[styles.tradeBanner, styles.tradeBannerComplete]}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={[styles.tradeBannerText, { color: colors.success }]}>
              Trade complete
            </Text>
            {!myRatingSubmitted && (
              <TouchableOpacity onPress={() => setRatingModalVisible(true)} activeOpacity={0.75}>
                <Text style={styles.tradeBannerAction}>Rate {partnerName} →</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : tradeBannerState === 'waiting' ? (
          <View style={[styles.tradeBanner, styles.tradeBannerWaiting]}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.tradeBannerText}>
              Waiting for {partnerName} to confirm...
            </Text>
          </View>
        ) : tradeBannerState === 'partner_confirmed' ? (
          <TouchableOpacity
            style={[styles.tradeBanner, styles.tradeBannerPartner]}
            onPress={handleMarkComplete}
            activeOpacity={0.8}
            disabled={tradeLoading}
          >
            <Ionicons name="alert-circle" size={16} color={colors.warning} />
            <Text style={[styles.tradeBannerText, { color: colors.warning }]}>
              {partnerName} confirmed — tap to complete
            </Text>
            {tradeLoading && <ActivityIndicator size="small" color={colors.warning} />}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.tradeBanner}
            onPress={handleMarkComplete}
            activeOpacity={0.8}
            disabled={tradeLoading || !partnerId}
          >
            {tradeLoading ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Ionicons name="checkmark-done-outline" size={16} color={colors.accent} />
            )}
            <Text style={styles.tradeBannerText}>Mark trade as complete</Text>
          </TouchableOpacity>
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={1000}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
            activeOpacity={0.75}
          >
            {sending ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Ionicons name="send" size={18} color={colors.background} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <TradeRatingModal
        visible={ratingModalVisible}
        partnerName={partnerName}
        onSubmit={handleSubmitRating}
        onDismiss={() => setRatingModalVisible(false)}
      />
    </SafeAreaView>
  );
}

function createBubbleStyles(c: ThemeColors) {
  return StyleSheet.create({
    bubbleWrapper: { flexDirection: 'row', marginVertical: 2 },
    bubbleWrapperOwn: { justifyContent: 'flex-end' },
    bubble: {
      maxWidth: '78%',
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      gap: 4,
    },
    bubbleOther: {
      backgroundColor: c.surface,
      borderTopLeftRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
    },
    bubbleOwn: { backgroundColor: c.accent, borderTopRightRadius: BorderRadius.sm },
    bubbleText: { fontSize: Typography.sizes.md, color: c.text, lineHeight: 22 },
    bubbleTextOwn: { color: c.background },
    bubbleTime: { fontSize: Typography.sizes.xs, color: c.textMuted, alignSelf: 'flex-end' },
    bubbleTimeOwn: { color: c.background + 'aa' },
  });
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },
    center: { flex: 1, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center' },
    messageList: {
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
      gap: Spacing.xs,
    },
    empty: { flex: 1, alignItems: 'center', paddingTop: Spacing.xxl },
    emptyText: { fontSize: Typography.sizes.md, color: c.textMuted },
    tradeBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + 2,
      borderTopWidth: 1,
      borderTopColor: c.accent + '44',
      backgroundColor: c.surface,
    },
    tradeBannerComplete: { borderTopColor: c.success + '44' },
    tradeBannerWaiting: { borderTopColor: c.accent + '33' },
    tradeBannerPartner: { borderTopColor: c.warning + '44' },
    tradeBannerText: {
      fontSize: Typography.sizes.sm,
      color: c.accent,
      fontWeight: Typography.weights.semibold,
      flex: 1,
    },
    tradeBannerAction: {
      fontSize: Typography.sizes.sm,
      color: c.accent,
      fontWeight: Typography.weights.bold,
    },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: c.surfaceBorder,
      backgroundColor: c.surface,
      gap: Spacing.sm,
    },
    input: {
      flex: 1,
      backgroundColor: c.surfaceElevated,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.sm + 2,
      paddingBottom: Spacing.sm + 2,
      fontSize: Typography.sizes.md,
      color: c.text,
      maxHeight: 120,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    sendBtnDisabled: { opacity: 0.4 },
  });
}
