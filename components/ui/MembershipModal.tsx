import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GZW, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { MEMBERSHIP, PLANS, EARLY_ACCESS_END } from '@/constants/membership';
import { membershipService } from '@/services/membership.service';

const LIFETIME_COLOR = '#FFD700';
const EARLY_COLOR = '#9C27B0';

function getTimeLeft(): { days: number; hours: number; expired: boolean } {
  const diff = EARLY_ACCESS_END.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, expired: true };
  const totalHours = Math.floor(diff / 3600000);
  return {
    days: Math.floor(totalHours / 24),
    hours: totalHours % 24,
    expired: false,
  };
}

const TIERS = [
  {
    icon: 'shield-checkmark' as const,
    label: 'Member',
    color: GZW.accent,
    perks: [
      `${MEMBERSHIP.MEMBER_LIMIT} active listings`,
      '7-day listing duration',
      'Member icon next to your name',
    ],
    price: `${PLANS.monthly.price}/mo or ${PLANS.yearly.price}/yr`,
  },
  {
    icon: 'infinite' as const,
    label: 'Lifetime',
    color: LIFETIME_COLOR,
    perks: [
      `${MEMBERSHIP.LIFETIME_LIMIT} active listings`,
      '14-day listing duration',
      'Exclusive gold Lifetime badge',
      'Pay once — never again',
    ],
    price: PLANS.lifetime.price,
  },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  isMember: boolean;
  isEarlyAdopter: boolean;
  earlyAccessClaimed: boolean;
  currentCount: number;
  onClaimed: () => void; // refresh profile after claim
}

export function MembershipModal({
  visible,
  onClose,
  isMember,
  isEarlyAdopter,
  earlyAccessClaimed,
  currentCount,
  onClaimed,
}: Props) {
  const [claiming, setClaiming] = useState(false);
  const limit = isMember ? MEMBERSHIP.MEMBER_LIMIT : MEMBERSHIP.FREE_LIMIT;
  const timeLeft = getTimeLeft();
  const showEarlyAccess = !earlyAccessClaimed && !timeLeft.expired;

  const handleClaim = async () => {
    setClaiming(true);
    const { success, error } = await membershipService.claimEarlyAccess();
    setClaiming(false);
    if (success) {
      onClaimed();
      Alert.alert(
        '🚀 Welcome, Founder!',
        "You've claimed 1 month of GZW Member access and earned your permanent Early Adopter badge. Thank you for believing in us from the start.",
        [{ text: 'Let\'s go!', onPress: onClose }]
      );
    } else {
      Alert.alert('Error', error ?? 'Something went wrong. Try again.');
    }
  };

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
          {/* Close */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={GZW.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Icon */}
          <View style={styles.badgeWrap}>
            <View style={styles.badge}>
              <Ionicons name="shield" size={36} color={GZW.accent} />
            </View>
          </View>

          <Text style={styles.title}>GZW Member</Text>

          {!isMember && (
            <Text style={styles.limitMsg}>
              You've reached your {limit}-listing limit.
            </Text>
          )}

          <Text style={styles.subtitle}>
            Unlock more listings and support the marketplace.
          </Text>

          {/* ── Early Access Banner ───────────────────────────────────────── */}
          {showEarlyAccess && (
            <View style={styles.earlyCard}>
              {/* Header row */}
              <View style={styles.earlyHeader}>
                <View style={styles.earlyIconWrap}>
                  <Ionicons name="rocket" size={20} color={EARLY_COLOR} />
                </View>
                <View style={styles.earlyHeaderText}>
                  <Text style={styles.earlyTitle}>Early Adopter Access</Text>
                  <Text style={styles.earlyTagline}>
                    The market is new. The opportunity isn't.
                  </Text>
                </View>
              </View>

              {/* What you get */}
              <View style={styles.earlyPerks}>
                <View style={styles.earlyPerkRow}>
                  <Ionicons name="checkmark-circle" size={15} color={EARLY_COLOR} />
                  <Text style={styles.earlyPerkText}>
                    1 month of Member access — completely free
                  </Text>
                </View>
                <View style={styles.earlyPerkRow}>
                  <Ionicons name="ribbon" size={15} color={EARLY_COLOR} />
                  <Text style={styles.earlyPerkText}>
                    Permanent 🚀 Early Adopter badge on your profile & listings
                  </Text>
                </View>
                <View style={styles.earlyPerkRow}>
                  <Ionicons name="people" size={15} color={EARLY_COLOR} />
                  <Text style={styles.earlyPerkText}>
                    Recognition as a founding member of GZW Market
                  </Text>
                </View>
              </View>

              {/* Countdown */}
              <View style={styles.countdownRow}>
                <Ionicons name="time-outline" size={14} color={EARLY_COLOR} />
                <Text style={styles.countdownText}>
                  {timeLeft.days}d {timeLeft.hours}h remaining
                </Text>
                <View style={styles.countdownBar}>
                  <View
                    style={[
                      styles.countdownFill,
                      {
                        width: `${Math.max(
                          4,
                          ((EARLY_ACCESS_END.getTime() - Date.now()) /
                            (20 * 24 * 3600 * 1000)) *
                            100
                        )}%` as any,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Claim button */}
              <TouchableOpacity
                style={[styles.claimBtn, claiming && styles.claimBtnDisabled]}
                onPress={handleClaim}
                disabled={claiming}
                activeOpacity={0.85}
              >
                {claiming ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="rocket" size={16} color="#fff" />
                    <Text style={styles.claimBtnText}>Claim 1 Month Free</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Early adopter badge — already claimed */}
          {isEarlyAdopter && (
            <View style={styles.founderCard}>
              <Ionicons name="rocket" size={18} color={EARLY_COLOR} />
              <View style={styles.founderText}>
                <Text style={styles.founderTitle}>Early Adopter — Founding Member</Text>
                <Text style={styles.founderSub}>
                  Your badge is permanent. Thanks for being here from day one.
                </Text>
              </View>
            </View>
          )}

          {/* Tier cards */}
          {TIERS.map((tier) => (
            <View
              key={tier.label}
              style={[styles.tierCard, { borderColor: tier.color + '44' }]}
            >
              <View style={styles.tierHeader}>
                <View style={[styles.tierIconWrap, { backgroundColor: tier.color + '18' }]}>
                  <Ionicons name={tier.icon} size={18} color={tier.color} />
                </View>
                <Text style={[styles.tierLabel, { color: tier.color }]}>{tier.label}</Text>
                <Text style={[styles.tierPrice, { color: tier.color }]}>{tier.price}</Text>
              </View>
              <View style={styles.tierPerks}>
                {tier.perks.map((perk) => (
                  <View key={perk} style={styles.perkRow}>
                    <Ionicons name="checkmark" size={14} color={tier.color} />
                    <Text style={styles.perkText}>{perk}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}

          {/* Coming Soon */}
          <View style={styles.comingSoonCard}>
            <Ionicons name="time-outline" size={22} color={GZW.accent} />
            <View style={styles.comingSoonText}>
              <Text style={styles.comingSoonTitle}>Paid Plans Coming Soon</Text>
              <Text style={styles.comingSoonSub}>
                In-app purchases are launching shortly. Contact us to get early member access.
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeTextBtn}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GZW.background },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  header: { alignItems: 'flex-end', paddingTop: Spacing.sm },
  closeBtn: { padding: Spacing.sm },
  badgeWrap: { alignItems: 'center', marginTop: Spacing.sm },
  badge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: GZW.accent + '18',
    borderWidth: 2,
    borderColor: GZW.accent + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.heavy,
    color: GZW.text,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  limitMsg: {
    fontSize: Typography.sizes.sm,
    color: GZW.warning,
    textAlign: 'center',
    fontWeight: Typography.weights.semibold,
    marginTop: -Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.sizes.md,
    color: GZW.textSecondary,
    textAlign: 'center',
    marginTop: -Spacing.sm,
  },

  // ── Early Access ───────────────────────────────────────────────────────────
  earlyCard: {
    backgroundColor: EARLY_COLOR + '0F',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: EARLY_COLOR + '55',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  earlyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  earlyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: EARLY_COLOR + '20',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  earlyHeaderText: { flex: 1, gap: 2 },
  earlyTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: EARLY_COLOR,
  },
  earlyTagline: {
    fontSize: Typography.sizes.sm,
    color: GZW.textSecondary,
    fontStyle: 'italic',
  },
  earlyPerks: { gap: Spacing.sm },
  earlyPerkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  earlyPerkText: {
    fontSize: Typography.sizes.sm,
    color: GZW.text,
    flex: 1,
    lineHeight: 20,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  countdownText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: EARLY_COLOR,
    width: 70,
  },
  countdownBar: {
    flex: 1,
    height: 4,
    backgroundColor: EARLY_COLOR + '22',
    borderRadius: 2,
    overflow: 'hidden',
  },
  countdownFill: {
    height: '100%',
    backgroundColor: EARLY_COLOR,
    borderRadius: 2,
  },
  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: EARLY_COLOR,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
  },
  claimBtnDisabled: { opacity: 0.6 },
  claimBtnText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: '#fff',
  },

  // ── Already a founder ─────────────────────────────────────────────────────
  founderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: EARLY_COLOR + '10',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: EARLY_COLOR + '44',
    padding: Spacing.md,
  },
  founderText: { flex: 1, gap: 2 },
  founderTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: EARLY_COLOR,
  },
  founderSub: {
    fontSize: Typography.sizes.xs,
    color: GZW.textSecondary,
    lineHeight: 18,
  },

  // ── Tier cards ────────────────────────────────────────────────────────────
  tierCard: {
    backgroundColor: GZW.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  tierIconWrap: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    flex: 1,
  },
  tierPrice: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  tierPerks: { gap: Spacing.sm },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  perkText: {
    fontSize: Typography.sizes.sm,
    color: GZW.textSecondary,
    flex: 1,
  },

  // ── Coming Soon ───────────────────────────────────────────────────────────
  comingSoonCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: GZW.accent + '10',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: GZW.accent + '33',
    padding: Spacing.md,
  },
  comingSoonText: { flex: 1, gap: Spacing.xs },
  comingSoonTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: GZW.accent,
  },
  comingSoonSub: {
    fontSize: Typography.sizes.sm,
    color: GZW.textSecondary,
    lineHeight: 20,
  },
  closeTextBtn: { alignItems: 'center', padding: Spacing.sm },
  closeText: { fontSize: Typography.sizes.md, color: GZW.textMuted },
});
