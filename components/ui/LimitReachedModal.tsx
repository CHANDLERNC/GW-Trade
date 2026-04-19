import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GZW, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { MEMBERSHIP } from '@/constants/membership';

export type LimitType = 'listing' | 'lfg' | 'message';

interface Tier {
  label: string;
  icon: 'shield-outline' | 'shield-checkmark' | 'infinite';
  color: string;
  limit: string;
}

const TIERS: Record<LimitType, { title: string; icon: any; tiers: Tier[] }> = {
  listing: {
    title: 'Active Listing Limit Reached',
    icon: 'list-outline',
    tiers: [
      { label: 'Free', icon: 'shield-outline', color: GZW.textMuted, limit: `${MEMBERSHIP.FREE_LIMIT} listings · 12h duration` },
      { label: 'Supporter', icon: 'shield-checkmark', color: GZW.accent, limit: `${MEMBERSHIP.PREMIUM_LIMIT} listings · 24h duration` },
      { label: 'Lifetime', icon: 'infinite', color: '#FFD700', limit: `${MEMBERSHIP.LIFETIME_LIMIT} listings · 48h duration` },
    ],
  },
  lfg: {
    title: 'LFG Post Limit Reached',
    icon: 'people-outline',
    tiers: [
      { label: 'Free', icon: 'shield-outline', color: GZW.textMuted, limit: `${MEMBERSHIP.FREE_LFG_LIMIT} active posts · 12h duration` },
      { label: 'Supporter', icon: 'shield-checkmark', color: GZW.accent, limit: `${MEMBERSHIP.PREMIUM_LFG_LIMIT} active posts · 24h duration` },
      { label: 'Lifetime', icon: 'infinite', color: '#FFD700', limit: `${MEMBERSHIP.LIFETIME_LFG_LIMIT} active posts · 48h duration` },
    ],
  },
  message: {
    title: 'Daily Message Limit Reached',
    icon: 'chatbubble-outline',
    tiers: [
      { label: 'Free', icon: 'shield-outline', color: GZW.textMuted, limit: `${MEMBERSHIP.FREE_MESSAGES_PER_DAY} messages/day` },
      { label: 'Supporter', icon: 'shield-checkmark', color: GZW.accent, limit: `${MEMBERSHIP.PREMIUM_MESSAGES_PER_DAY} messages/day` },
      { label: 'Lifetime', icon: 'infinite', color: '#FFD700', limit: 'Unlimited messages' },
    ],
  },
};

interface Props {
  visible: boolean;
  limitType: LimitType;
  onClose: () => void;
  onViewPlans: () => void;
}

export function LimitReachedModal({ visible, limitType, onClose, onViewPlans }: Props) {
  const config = TIERS[limitType];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={GZW.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.iconWrap}>
            <View style={styles.iconRing}>
              <Ionicons name={config.icon} size={32} color={GZW.danger} />
            </View>
          </View>

          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.subtitle}>
            You've hit the free tier limit. Close an existing post to make room, or support the project for more capacity.
          </Text>

          <View style={styles.tierList}>
            {config.tiers.map((tier, i) => (
              <View
                key={tier.label}
                style={[
                  styles.tierRow,
                  i === 0 && styles.tierRowActive,
                ]}
              >
                <View style={[styles.tierIconWrap, { backgroundColor: tier.color + '1A' }]}>
                  <Ionicons name={tier.icon} size={16} color={tier.color} />
                </View>
                <View style={styles.tierText}>
                  <Text style={[styles.tierLabel, { color: tier.color }]}>{tier.label}</Text>
                  <Text style={styles.tierLimit}>{tier.limit}</Text>
                </View>
                {i === 0 && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>CURRENT</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          <View style={styles.trustNote}>
            <Ionicons name="shield-checkmark-outline" size={14} color={GZW.textMuted} />
            <Text style={styles.trustNoteText}>
              Supporter status never affects your reputation or Verified Trader standing.
            </Text>
          </View>

          <TouchableOpacity style={styles.plansBtn} onPress={onViewPlans} activeOpacity={0.85}>
            <Ionicons name="shield-checkmark" size={16} color={GZW.background} />
            <Text style={styles.plansBtnText}>View Supporter Plans</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dismissBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.dismissText}>Got it, I'll close an existing post</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GZW.background },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.lg },
  header: { alignItems: 'flex-end', paddingTop: Spacing.sm },
  closeBtn: { padding: Spacing.sm },
  iconWrap: { alignItems: 'center', marginTop: Spacing.sm },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: GZW.danger + '18',
    borderWidth: 2,
    borderColor: GZW.danger + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.heavy,
    color: GZW.text,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: GZW.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: -Spacing.xs,
  },
  tierList: {
    backgroundColor: GZW.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: GZW.surfaceBorder,
    overflow: 'hidden',
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: GZW.surfaceBorder,
  },
  tierRowActive: {
    backgroundColor: GZW.danger + '0C',
  },
  tierIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tierText: { flex: 1, gap: 2 },
  tierLabel: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold },
  tierLimit: { fontSize: Typography.sizes.xs, color: GZW.textMuted },
  currentBadge: {
    backgroundColor: GZW.danger + '22',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  currentBadgeText: {
    fontSize: 9,
    fontWeight: Typography.weights.bold,
    color: GZW.danger,
    letterSpacing: 0.8,
  },
  trustNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: GZW.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: GZW.surfaceBorder,
    padding: Spacing.md,
  },
  trustNoteText: {
    fontSize: Typography.sizes.xs,
    color: GZW.textMuted,
    flex: 1,
    lineHeight: 17,
  },
  plansBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: GZW.accent,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
  },
  plansBtnText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: GZW.background,
  },
  dismissBtn: { alignItems: 'center', padding: Spacing.sm },
  dismissText: { fontSize: Typography.sizes.sm, color: GZW.textMuted },
});
