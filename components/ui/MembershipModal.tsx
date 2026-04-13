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
import { MEMBERSHIP, PLANS, EARLY_ACCESS_END, MONETIZATION_ENABLED } from '@/constants/membership';
import { membershipService } from '@/services/membership.service';

const LIFETIME_COLOR = '#FFD700';
const EARLY_COLOR   = '#9C27B0';

function getTimeLeft(): { days: number; hours: number; expired: boolean } {
  const diff = EARLY_ACCESS_END.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, expired: true };
  const totalHours = Math.floor(diff / 3_600_000);
  return { days: Math.floor(totalHours / 24), hours: totalHours % 24, expired: false };
}

const DISPLAY_PLANS = [
  {
    id: 'monthly' as const,
    icon: 'shield-checkmark' as const,
    label: PLANS.monthly.label,
    color: GZW.accent,
    price: PLANS.monthly.price,
    priceNote: PLANS.monthly.note,
    badge: PLANS.monthly.badge,
    perks: [
      `${MEMBERSHIP.PREMIUM_LIMIT} active listings`,
      '72-hour listing duration',
      'Priority ranking in browse',
      'Unlimited messages',
      'Member badge on profile',
    ],
    earlyAdopterDiscount: PLANS.monthly.earlyAdopterDiscount,
  },
  {
    id: 'yearly' as const,
    icon: 'shield-checkmark' as const,
    label: PLANS.yearly.label,
    color: GZW.accent,
    price: PLANS.yearly.price,
    priceNote: PLANS.yearly.note,
    badge: PLANS.yearly.badge,
    perks: [
      `${MEMBERSHIP.PREMIUM_LIMIT} active listings`,
      '72-hour listing duration',
      'Priority ranking in browse',
      'Unlimited messages',
      'Member badge on profile',
    ],
    earlyAdopterDiscount: PLANS.yearly.earlyAdopterDiscount,
  },
  {
    id: 'lifetime_discounted' as const,
    icon: 'infinite' as const,
    label: PLANS.lifetime_discounted.label,
    color: LIFETIME_COLOR,
    price: PLANS.lifetime_discounted.price,
    priceNote: PLANS.lifetime_discounted.note,
    badge: PLANS.lifetime_discounted.badge,
    perks: [
      `${MEMBERSHIP.LIFETIME_LIMIT} active listings`,
      '14-day listing duration',
      'Highest priority in browse',
      'Unlimited messages',
      'Exclusive gold Lifetime badge',
      'Pay once — never again',
    ],
    earlyAdopterDiscount: undefined,
  },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  isMember: boolean;
  isEarlyAdopter: boolean;
  earlyAccessClaimed: boolean;
  currentCount: number;
  onClaimed: () => void;
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
  const limit = isMember ? MEMBERSHIP.PREMIUM_LIMIT : MEMBERSHIP.FREE_LIMIT;
  const timeLeft = getTimeLeft();
  const showEarlyAccess = !earlyAccessClaimed && !timeLeft.expired;

  const handleClaim = async () => {
    setClaiming(true);
    const { success, error } = await membershipService.claimEarlyAccess();
    setClaiming(false);
    if (success) {
      onClaimed();
      Alert.alert(
        'Welcome, Founder!',
        "You've claimed 30 days of Premium access and earned your permanent Early Adopter badge. Thank you for believing in us from the start.",
        [{ text: "Let's go!", onPress: onClose }]
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

          <Text style={styles.title}>GZW Market Premium</Text>

          {!isMember && (
            <Text style={styles.limitMsg}>
              You've used {currentCount} of your {limit} free listings.
            </Text>
          )}

          <Text style={styles.subtitle}>
            Unlock more listings and support the marketplace.
          </Text>

          {/* ── Early Access Banner ───────────────────────────────────────── */}
          {showEarlyAccess && (
            <View style={styles.earlyCard}>
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

              <View style={styles.earlyPerks}>
                {[
                  { icon: 'checkmark-circle' as const, text: '30 days of Premium access — completely free' },
                  { icon: 'ribbon' as const,           text: 'Permanent Early Adopter badge on your profile & listings' },
                  { icon: 'pricetag' as const,         text: '15% off your first paid subscription when we launch' },
                  { icon: 'people' as const,           text: 'Recognition as a founding member of GZW Market' },
                ].map(({ icon, text }) => (
                  <View key={text} style={styles.earlyPerkRow}>
                    <Ionicons name={icon} size={15} color={EARLY_COLOR} />
                    <Text style={styles.earlyPerkText}>{text}</Text>
                  </View>
                ))}
              </View>

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
                            (20 * 24 * 3_600_000)) * 100
                        )}%` as any,
                      },
                    ]}
                  />
                </View>
              </View>

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
                    <Text style={styles.claimBtnText}>Claim 30 Days Free</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Already an early adopter */}
          {isEarlyAdopter && (
            <View style={styles.founderCard}>
              <Ionicons name="rocket" size={18} color={EARLY_COLOR} />
              <View style={styles.founderText}>
                <Text style={styles.founderTitle}>Early Adopter — Founding Member</Text>
                <Text style={styles.founderSub}>
                  Your badge is permanent. You'll get 15% off your first subscription at launch. Thanks for being here from day one.
                </Text>
              </View>
            </View>
          )}

          {/* ── Plan cards ─────────────────────────────────────────────────── */}
          {DISPLAY_PLANS.map((plan) => (
            <View key={plan.id} style={[styles.planCard, { borderColor: plan.color + '44' }]}>
              <View style={styles.planHeader}>
                <View style={[styles.planIconWrap, { backgroundColor: plan.color + '18' }]}>
                  <Ionicons name={plan.icon} size={18} color={plan.color} />
                </View>
                <View style={styles.planTitleWrap}>
                  <Text style={[styles.planLabel, { color: plan.color }]}>{plan.label}</Text>
                  {plan.badge && (
                    <View style={[styles.planBadge, { backgroundColor: plan.color + '22' }]}>
                      <Text style={[styles.planBadgeText, { color: plan.color }]}>{plan.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.planPrice, { color: plan.color }]}>{plan.price}</Text>
              </View>

              <Text style={styles.planPriceNote}>{plan.priceNote}</Text>

              <View style={styles.planPerks}>
                {plan.perks.map((perk) => (
                  <View key={perk} style={styles.perkRow}>
                    <Ionicons name="checkmark" size={14} color={plan.color} />
                    <Text style={styles.perkText}>{perk}</Text>
                  </View>
                ))}
              </View>

              {plan.earlyAdopterDiscount !== undefined && isEarlyAdopter && (
                <View style={styles.discountNote}>
                  <Ionicons name="pricetag" size={13} color={EARLY_COLOR} />
                  <Text style={styles.discountNoteText}>{plan.earlyAdopterDiscount} at launch</Text>
                </View>
              )}

              {MONETIZATION_ENABLED ? (
                <TouchableOpacity style={[styles.purchaseBtn, { borderColor: plan.color }]}>
                  <Text style={[styles.purchaseBtnText, { color: plan.color }]}>Subscribe</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.comingSoonBtn}>
                  <Ionicons name="time-outline" size={14} color={GZW.textMuted} />
                  <Text style={styles.comingSoonBtnText}>Coming Soon</Text>
                </View>
              )}
            </View>
          ))}

          {/* ── Launch notice ───────────────────────────────────────────────── */}
          <View style={styles.launchNotice}>
            <Ionicons name="information-circle-outline" size={20} color={GZW.accent} />
            <View style={styles.launchNoticeText}>
              <Text style={styles.launchNoticeTitle}>Subscriptions Launching Soon</Text>
              <Text style={styles.launchNoticeSub}>
                In-app purchases are being configured. Claim Early Adopter access above to get 30 days of Premium free and lock in a 15% launch discount.
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
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.lg },
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

  // ── Early Access ──────────────────────────────────────────────────────────
  earlyCard: {
    backgroundColor: EARLY_COLOR + '0F',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: EARLY_COLOR + '55',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  earlyHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
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
  earlyTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: EARLY_COLOR },
  earlyTagline: { fontSize: Typography.sizes.sm, color: GZW.textSecondary, fontStyle: 'italic' },
  earlyPerks: { gap: Spacing.sm },
  earlyPerkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  earlyPerkText: { fontSize: Typography.sizes.sm, color: GZW.text, flex: 1, lineHeight: 20 },
  countdownRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  countdownText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: EARLY_COLOR,
    width: 70,
  },
  countdownBar: { flex: 1, height: 4, backgroundColor: EARLY_COLOR + '22', borderRadius: 2, overflow: 'hidden' },
  countdownFill: { height: '100%', backgroundColor: EARLY_COLOR, borderRadius: 2 },
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
  claimBtnText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: '#fff' },

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
  founderTitle: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: EARLY_COLOR },
  founderSub: { fontSize: Typography.sizes.xs, color: GZW.textSecondary, lineHeight: 18 },

  // ── Plan cards ────────────────────────────────────────────────────────────
  planCard: {
    backgroundColor: GZW.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  planIconWrap: { width: 32, height: 32, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  planTitleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  planLabel: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold },
  planBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.sm },
  planBadgeText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold },
  planPrice: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold },
  planPriceNote: { fontSize: Typography.sizes.xs, color: GZW.textMuted, marginTop: -Spacing.xs },
  planPerks: { gap: Spacing.sm },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  perkText: { fontSize: Typography.sizes.sm, color: GZW.textSecondary, flex: 1 },
  discountNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: EARLY_COLOR + '0F',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  discountNoteText: { fontSize: Typography.sizes.xs, color: EARLY_COLOR },
  purchaseBtn: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  purchaseBtnText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  comingSoonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: GZW.surfaceBorder,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  comingSoonBtnText: { fontSize: Typography.sizes.sm, color: GZW.textMuted },

  // ── Launch notice ─────────────────────────────────────────────────────────
  launchNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: GZW.accent + '10',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: GZW.accent + '33',
    padding: Spacing.md,
  },
  launchNoticeText: { flex: 1, gap: Spacing.xs },
  launchNoticeTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: GZW.accent },
  launchNoticeSub: { fontSize: Typography.sizes.sm, color: GZW.textSecondary, lineHeight: 20 },

  closeTextBtn: { alignItems: 'center', padding: Spacing.sm },
  closeText: { fontSize: Typography.sizes.md, color: GZW.textMuted },
});
