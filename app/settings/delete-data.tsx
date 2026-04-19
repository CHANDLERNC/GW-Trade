import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

const REASONS = [
  "I no longer play Gray Zone Warfare",
  "I have privacy concerns",
  "I want to start fresh with a new account",
  "I was banned and want my data removed",
  "Other",
];

export default function DeleteDataScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user, profile } = useAuth();

  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = selectedReason !== null && confirmed;

  const handleSubmit = async () => {
    if (!canSubmit || !user) return;

    Alert.alert(
      'Request Account Deletion',
      'Your account will be scheduled for deletion in 7 days. You will receive a confirmation email. You can cancel within 7 days by signing back in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Delete My Account',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const { error } = await supabase
              .from('profiles')
              .update({
                deletion_requested_at: new Date().toISOString(),
                deletion_reason: selectedReason,
              })
              .eq('id', user.id);

            if (error) {
              Alert.alert('Error', 'Could not submit your request. Please try again or email support@gzwmarket.com.');
            } else {
              setSubmitted(true);
            }
            setLoading(false);
          },
        },
      ]
    );
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successTitle}>Request Submitted</Text>
          <Text style={styles.successBody}>
            Your account is scheduled for deletion in 7 days. A confirmation email has been
            sent to your address.
          </Text>
          <Text style={styles.successBody}>
            If you change your mind, sign back in within 7 days to cancel the request.
          </Text>
          <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Delete My Data</Text>

        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>What gets deleted</Text>
          {[
            'Your account and login credentials',
            'Your listings (active and archived)',
            'Your messages and conversations',
            'Your LFG posts',
            'Your saved listings',
          ].map((item, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.deleteBullet}>✕</Text>
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <Text style={styles.warningNote}>
            Anonymized trade records tied to other users' completed trade history are retained
            to preserve the integrity of their reputation. Your identity is fully removed from
            those records.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Reason for leaving</Text>
        <View style={styles.reasonList}>
          {REASONS.map((reason) => (
            <TouchableOpacity
              key={reason}
              style={[styles.reasonRow, selectedReason === reason && styles.reasonRowSelected]}
              onPress={() => setSelectedReason(reason)}
              activeOpacity={0.7}
            >
              <View style={[styles.radio, selectedReason === reason && styles.radioSelected]}>
                {selectedReason === reason && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.reasonText}>{reason}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.confirmRow}
          onPress={() => setConfirmed(!confirmed)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>
            {confirmed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.confirmText}>
            I understand this action cannot be undone after the 7-day grace period.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, (!canSubmit || loading) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || loading}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Submitting...' : 'Request Account Deletion'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.alternativeText}>
          Changed your mind? Just close this page. No action has been taken.
        </Text>

        <View style={styles.supportCard}>
          <Text style={styles.supportText}>
            Need help with something else?{' '}
            <Text style={styles.supportLink}>support@gzwmarket.com</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.lg },
    pageTitle: {
      fontSize: Typography.sizes.xxl,
      fontWeight: Typography.weights.bold,
      color: c.text,
      marginTop: Spacing.lg,
    },
    warningCard: {
      backgroundColor: '#7f1d1d22',
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: '#7f1d1d55',
      padding: Spacing.md,
      gap: Spacing.xs,
    },
    warningTitle: {
      fontSize: Typography.sizes.md,
      fontWeight: Typography.weights.semibold,
      color: '#ef4444',
      marginBottom: Spacing.xs,
    },
    bulletRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
    deleteBullet: { fontSize: Typography.sizes.sm, color: '#ef4444', width: 16 },
    bulletText: { flex: 1, fontSize: Typography.sizes.sm, color: c.textSecondary, lineHeight: 20 },
    divider: { height: 1, backgroundColor: '#7f1d1d44', marginVertical: Spacing.xs },
    warningNote: { fontSize: Typography.sizes.xs, color: c.textMuted, lineHeight: 18 },
    sectionTitle: {
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.weights.semibold,
      color: c.text,
    },
    reasonList: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      overflow: 'hidden',
    },
    reasonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.surfaceBorder,
    },
    reasonRowSelected: { backgroundColor: c.surfaceElevated },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: c.surfaceBorder,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    radioSelected: { borderColor: c.accent },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.accent },
    reasonText: { flex: 1, fontSize: Typography.sizes.md, color: c.text },
    confirmRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.sm,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: BorderRadius.sm,
      borderWidth: 2,
      borderColor: c.surfaceBorder,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginTop: 1,
    },
    checkboxChecked: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
    checkmark: {
      fontSize: 13,
      color: '#ffffff',
      fontWeight: Typography.weights.bold,
    },
    confirmText: {
      flex: 1,
      fontSize: Typography.sizes.sm,
      color: c.textSecondary,
      lineHeight: 20,
    },
    submitButton: {
      backgroundColor: '#ef4444',
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.md,
      alignItems: 'center',
    },
    submitButtonDisabled: { opacity: 0.4 },
    submitButtonText: {
      fontSize: Typography.sizes.md,
      fontWeight: Typography.weights.semibold,
      color: '#ffffff',
    },
    alternativeText: {
      fontSize: Typography.sizes.sm,
      color: c.textMuted,
      textAlign: 'center',
    },
    supportCard: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: Spacing.md,
    },
    supportText: {
      fontSize: Typography.sizes.sm,
      color: c.textMuted,
      textAlign: 'center',
    },
    supportLink: { color: c.accent },
    successContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.xl,
      gap: Spacing.md,
    },
    successIcon: { fontSize: 56, color: '#22c55e' },
    successTitle: {
      fontSize: Typography.sizes.xxl,
      fontWeight: Typography.weights.bold,
      color: c.text,
      textAlign: 'center',
    },
    successBody: {
      fontSize: Typography.sizes.md,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    doneButton: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      marginTop: Spacing.md,
    },
    doneButtonText: { fontSize: Typography.sizes.md, color: c.text, fontWeight: Typography.weights.semibold },
  });
}
