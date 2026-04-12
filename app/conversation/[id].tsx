import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useMessages } from '@/hooks/useMessages';
import { messagesService } from '@/services/messages.service';
import { useAuth } from '@/context/AuthContext';
import { Message } from '@/types';
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
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation();
  const { messages, loading } = useMessages(id);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!id || !user) return;
    supabase
      .from('conversations')
      .select(`
        profiles_one:participant_one (username, display_name),
        profiles_two:participant_two (username, display_name),
        listings:listing_id (title)
      `)
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        const isOne = (data.profiles_one as any)?.id === user.id;
        const other = isOne ? (data.profiles_two as any) : (data.profiles_one as any);
        const name = other?.display_name ?? other?.username ?? 'Chat';
        navigation.setOptions({ headerTitle: name });
      });
  }, [id, user, navigation]);

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
    await messagesService.sendMessage(id, user.id, content);
    setSending(false);
  };

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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
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
