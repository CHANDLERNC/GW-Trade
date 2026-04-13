import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { supportService, SupportCategory } from '@/services/support.service';
import { useAuth } from '@/context/AuthContext';

const CATEGORIES: { id: SupportCategory; label: string; icon: string; description: string }[] = [
  { id: 'bug',     label: 'Bug Report',       icon: 'bug-outline',         description: 'Something is broken or not working' },
  { id: 'feature', label: 'Feature Request',  icon: 'bulb-outline',        description: 'I have an idea or suggestion' },
  { id: 'content', label: 'Report Content',   icon: 'flag-outline',        description: 'Inappropriate listing or user' },
  { id: 'other',   label: 'Other',            icon: 'chatbox-outline',     description: 'General feedback or questions' },
];

interface SupportModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SupportModal({ visible, onClose }: SupportModalProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [category, setCategory] = useState<SupportCategory | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = category !== null && message.trim().length >= 10 && !submitting;

  const handleClose = () => {
    setCategory(null);
    setMessage('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!canSubmit || !user) return;
    setSubmitting(true);
    const { error } = await supportService.submitTicket(user.id, category!, message);
    setSubmitting(false);
    if (error) {
      Alert.alert('Error', 'Could not send your report. Please try again.');
    } else {
      handleClose();
      Alert.alert('Received', 'Thanks for the report — we\'ll look into it.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Ionicons name="headset-outline" size={20} color={colors.accent} />
                <Text style={styles.title}>Contact Support</Text>
              </View>
              <TouchableOpacity onPress={handleClose} hitSlop={12}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.subtitle}>
              What can we help you with?
            </Text>

            {/* Category picker */}
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const active = category === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryCard, active && styles.categoryCardActive]}
                    onPress={() => setCategory(cat.id)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={22}
                      color={active ? colors.accent : colors.textSecondary}
                    />
                    <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>
                      {cat.label}
                    </Text>
                    <Text style={styles.categoryDesc}>{cat.description}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Message */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>DETAILS</Text>
              <TextInput
                style={styles.textArea}
                value={message}
                onChangeText={setMessage}
                placeholder="Describe the issue or your idea in detail..."
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={2000}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{message.length} / 2000</Text>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <>
                  <Ionicons name="send" size={16} color={colors.background} />
                  <Text style={styles.submitText}>Send Report</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },
    scroll: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xxl,
      gap: Spacing.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: Spacing.md,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    title: {
      fontSize: Typography.sizes.xl,
      fontWeight: Typography.weights.bold,
      color: c.text,
    },
    cancelText: {
      fontSize: Typography.sizes.md,
      color: c.textSecondary,
    },
    subtitle: {
      fontSize: Typography.sizes.md,
      color: c.textSecondary,
      marginTop: -Spacing.sm,
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    categoryCard: {
      width: '48%',
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: Spacing.md,
      gap: Spacing.xs,
    },
    categoryCardActive: {
      borderColor: c.accent,
      backgroundColor: c.accent + '10',
    },
    categoryLabel: {
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.weights.bold,
      color: c.text,
    },
    categoryLabelActive: { color: c.accent },
    categoryDesc: {
      fontSize: Typography.sizes.xs,
      color: c.textMuted,
      lineHeight: 16,
    },
    inputGroup: { gap: Spacing.sm },
    inputLabel: {
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.weights.bold,
      color: c.textMuted,
      letterSpacing: 1.5,
    },
    textArea: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: Spacing.md,
      fontSize: Typography.sizes.md,
      color: c.text,
      minHeight: 140,
    },
    charCount: {
      fontSize: Typography.sizes.xs,
      color: c.textMuted,
      alignSelf: 'flex-end',
    },
    submitBtn: {
      backgroundColor: c.accent,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
    },
    submitBtnDisabled: { opacity: 0.35 },
    submitText: {
      fontSize: Typography.sizes.md,
      fontWeight: Typography.weights.bold,
      color: c.background,
    },
  });
}
