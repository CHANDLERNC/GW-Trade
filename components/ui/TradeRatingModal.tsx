import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface TradeRatingModalProps {
  visible: boolean;
  partnerName: string;
  onSubmit: (isPositive: boolean) => Promise<void>;
  onDismiss: () => void;
}

export function TradeRatingModal({
  visible,
  partnerName,
  onSubmit,
  onDismiss,
}: TradeRatingModalProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selected, setSelected] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (selected === null) return;
    setSubmitting(true);
    await onSubmit(selected);
    setSubmitting(false);
    setSelected(null);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.headerBar}>
            <View style={styles.headerDot} />
            <Text style={styles.headerLabel}>TRADE COMPLETE</Text>
            <View style={styles.headerDot} />
          </View>

          <Text style={styles.title}>Rate your trade</Text>
          <Text style={styles.subtitle}>
            How was your experience trading with{'\n'}
            <Text style={styles.partnerName}>{partnerName}</Text>?
          </Text>

          <View style={styles.thumbRow}>
            <TouchableOpacity
              style={[styles.thumbBtn, styles.thumbUp, selected === true && styles.thumbUpActive]}
              onPress={() => setSelected(true)}
              activeOpacity={0.75}
            >
              <Ionicons
                name="thumbs-up"
                size={32}
                color={selected === true ? '#fff' : colors.success}
              />
              <Text style={[styles.thumbLabel, selected === true && styles.thumbLabelActive]}>
                Positive
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.thumbBtn, styles.thumbDown, selected === false && styles.thumbDownActive]}
              onPress={() => setSelected(false)}
              activeOpacity={0.75}
            >
              <Ionicons
                name="thumbs-down"
                size={32}
                color={selected === false ? '#fff' : colors.danger}
              />
              <Text style={[styles.thumbLabel, selected === false && styles.thumbLabelActiveDanger]}>
                Negative
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, selected === null && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={selected === null || submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Text style={styles.submitText}>Submit Rating</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={onDismiss} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.75)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      borderTopWidth: 1,
      borderColor: c.accent + '55',
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.xxl,
      paddingTop: Spacing.lg,
      gap: Spacing.md,
    },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    headerDot: {
      width: 4,
      height: 4,
      backgroundColor: c.accent,
    },
    headerLabel: {
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.weights.bold,
      color: c.accent,
      letterSpacing: 2,
    },
    title: {
      fontSize: Typography.sizes.xxl,
      fontWeight: Typography.weights.bold,
      color: c.text,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: Typography.sizes.md,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    partnerName: {
      color: c.text,
      fontWeight: Typography.weights.bold,
    },
    thumbRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginVertical: Spacing.sm,
    },
    thumbBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.md,
      borderWidth: 2,
    },
    thumbUp: {
      borderColor: c.success + '66',
      backgroundColor: c.success + '11',
    },
    thumbUpActive: {
      borderColor: c.success,
      backgroundColor: c.success,
    },
    thumbDown: {
      borderColor: c.danger + '66',
      backgroundColor: c.danger + '11',
    },
    thumbDownActive: {
      borderColor: c.danger,
      backgroundColor: c.danger,
    },
    thumbLabel: {
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.weights.bold,
      color: c.textSecondary,
    },
    thumbLabelActive: { color: '#fff' },
    thumbLabelActiveDanger: { color: '#fff' },
    submitBtn: {
      backgroundColor: c.accent,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.md,
      alignItems: 'center',
    },
    submitBtnDisabled: { opacity: 0.35 },
    submitText: {
      fontSize: Typography.sizes.md,
      fontWeight: Typography.weights.bold,
      color: c.background,
      letterSpacing: 0.5,
    },
    skipBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
    skipText: {
      fontSize: Typography.sizes.sm,
      color: c.textMuted,
    },
  });
}
