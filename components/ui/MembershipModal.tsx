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
import type { PlanId } from '@/constants/membership';

const EARLY_COLOR = '#9C27B0';

type TierId = 'free' | 'monthly' | 'yearly' | 'lifetime';

const TIER_COLORS: Record<TierId, string> = {
  free:     '#4A90D9',
  monthly:  GZW.accent,
  yearly:   '#52B788',
  lifetime: '#FFD700',
};

const TABS: { id: TierId; label: string }[] = [
  { id: 'free',     label: 'Community' },
  { id: 'monthly',  label: 'Monthly'   },
  { id: 'yearly',   label: 'Yearly'    },
  { id: 'lifetime', label: 'Lifetime'  },
];

const TIER_DATA: Record<TierId, {
  icon: 'people' | 'shield-checkmark' | 'infinite';
  price: string;
  priceNote: string;
  headline: string;
  subline: string;
  perks: string[];
  badge?: string;
  planId: PlanId | null;
  earlyAdopterDiscount?: string;
}> = {
  free: {
    icon: 'people',
    price: 'Free',
    priceNote: 'always and forever',
    headline: "You're already in.",
    subline:
      "Every feature in GZW Market is fully unlocked for all users — no paywalls, no locked tools, no ads. Supporters simply chip in to help cover hosting costs and get a bit more room in return.",
    perks: [
      `${MEMBERSHIP.FREE_LIMIT} active listings`,
      `${MEMBERSHIP.FREE_POST_HOURS}-hour listing & LFG duration`,
      `${MEMBERSHIP.FREE_MESSAGES_PER_DAY} messages/day`,
      `${MEMBERSHIP.FREE_LFG_LIMIT} active LFG posts`,
      'Full access to trading tools — browse, save, message, LFG',
      'No ads — ever',
    ],
    planId: null,
  },
  monthly: {
    icon: 'shield-checkmark',
    price: PLANS.monthly.price,
    priceNote: PLANS.monthly.note,
    headline: 'Same tools, more headroom.',
    subline:
      'Your contribution goes 100% toward keeping the servers on. In return you get higher limits across the board.',
    perks: [
      `${MEMBERSHIP.PREMIUM_LIMIT} active listings`,
      `${MEMBERSHIP.PREMIUM_POST_HOURS}-hour listing & LFG duration`,
      `${MEMBERSHIP.PREMIUM_MESSAGES_PER_DAY} messages/day`,
      `${MEMBERSHIP.PREMIUM_LFG_LIMIT} active LFG posts`,
      'Supporter badge on your profile',
    ],
    planId: 'monthly',
    earlyAdopterDiscount: PLANS.monthly.earlyAdopterDiscount,
  },
  yearly: {
    icon: 'shield-checkmark',
    price: PLANS.yearly.price,
    priceNote: PLANS.yearly.note,
    badge: 'BEST VALUE',
    headline: 'In it for the long run.',
    subline:
      'Lock in a full year of higher limits at a fraction of the monthly cost. Cancel anytime — no questions asked.',
    perks: [
      `${MEMBERSHIP.PREMIUM_LIMIT} active listings`,
      `${MEMBERSHIP.PREMIUM_POST_HOURS}-hour listing & LFG duration`,
      `${MEMBERSHIP.PREMIUM_MESSAGES_PER_DAY} messages/day`,
      `${MEMBERSHIP.PREMIUM_LFG_LIMIT} active LFG posts`,
      'Supporter badge on your profile',
      'Save 37% vs monthly',
    ],
    planId: 'yearly',
    earlyAdopterDiscount: PLANS.yearly.earlyAdopterDiscount,
  },
  lifetime: {
    icon: 'infinite',
    price: PLANS.lifetime_discounted.price,
    priceNote: PLANS.lifetime_discounted.note,
    badge: 'LAUNCH PRICE',
    headline: 'Pay once. Here forever.',
    subline:
      'One contribution keeps you supported for life — the highest limits available, and you never see another charge.',
    perks: [
      `${MEMBERSHIP.LIFETIME_LIMIT} active listings`,
      `${MEMBERSHIP.LIFETIME_POST_HOURS}-hour listing & LFG duration`,
      'Unlimited messages',
      `${MEMBERSHIP.LIFETIME_LFG_LIMIT} active LFG posts`,
      'Exclusive gold Supporter badge',
      'Pay once — never again',
    ],
    planId: 'lifetime_discounted',
  },
};

function getTimeLeft(): { days: number; hours: number; expired: boolean } {
  const diff = EARLY_ACCESS_END.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, expired: true };
  const totalHours = Math.floor(diff / 3_600_000);
  return { days: Math.floor(totalHours / 24), hours: totalHours % 24, expired: false };
}

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
  const [selectedTier, setSelectedTier] = useState<TierId>('free');

  const limit = isMember ? MEMBERSHIP.PREMIUM_LIMIT : MEMBERSHIP.FREE_LIMIT;
  const timeLeft = getTimeLeft();
  const showEarlyAccess = !earlyAccessClaimed && !timeLeft.expired;

  const tier = TIER_DATA[selectedTier];
  const color = TIER_COLORS[selectedTier];

  const handleClaim = async () => {
    setClaiming(true);
    const { success, error } = await membershipService.claimEarlyAccess();
    setClaiming(false);
    if (success) {
      onClaimed();
      Alert.alert(
        'Welcome, Founder!',
        "You've claimed 30 days of Supporter access and earned your permanent Early Adopter badge. Thank you for believing in us from the start.",
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

          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name="shield" size={36} color={GZW.accent} />
            </View>
            <Text style={styles.title}>Support GZW Market</Text>
            {!isMember && (
              <Text style={styles.limitMsg}>
                {currentCount} of {limit} free listings used
              </Text>
            )}
            <Text style={styles.subtitle}>
              Help keep the servers running. 100% of supporter funds go toward hosting costs.
            </Text>
          </View>

          {/* Trust note */}
          <View style={styles.trustNote}>
            <Ionicons name="checkmark-circle" size={15} color={GZW.accent} />
            <Text style={styles.trustNoteText}>
              All features are free for every user. Supporters get higher limits — nothing is locked behind a paywall.
            </Text>
          </View>

          {/* ── Early Access Banner ─────────────────────────────────────────── */}
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
                  { icon: 'checkmark-circle' as const, text: '30 days of Supporter access — completely free' },
                  { icon: 'ribbon' as const,           text: 'Permanent Early Adopter badge on your profile & listings' },
                  { icon: 'pricetag' as const,         text: '15% off your first paid subscription at launch' },
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

          {/* ── Tier tabs ────────────────────────────────────────────────────── */}
          <View style={styles.tabRow}>
            {TABS.map((tab) => {
              const isActive = selectedTier === tab.id;
              const tabColor = TIER_COLORS[tab.id];
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tab, isActive && { borderBottomColor: tabColor, borderBottomWidth: 2 }]}
                  onPress={() => setSelectedTier(tab.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabLabel, { color: isActive ? tabColor : GZW.textMuted }]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Plan card ────────────────────────────────────────────────────── */}
          <View style={[styles.planCard, { borderColor: color + '55' }]}>
            <View style={styles.planHeader}>
              <View style={[styles.planIconWrap, { backgroundColor: color + '18' }]}>
                <Ionicons name={tier.icon} size={20} color={color} />
              </View>
              <View style={styles.planTitleWrap}>
                <Text style={[styles.planPrice, { color }]}>{tier.price}</Text>
                {tier.badge && (
                  <View style={[styles.planBadge, { backgroundColor: color + '22' }]}>
                    <Text style={[styles.planBadgeText, { color }]}>{tier.badge}</Text>
                  </View>
                )}
              </View>
            </View>

            <Text style={[styles.planHeadline, { color }]}>{tier.headline}</Text>
            <Text style={styles.planSubline}>{tier.subline}</Text>
            <Text style={styles.planPriceNote}>{tier.priceNote}</Text>

            <View style={styles.divider} />

            <View style={styles.planPerks}>
              {tier.perks.map((perk) => (
                <View key={perk} style={styles.perkRow}>
                  <Ionicons name="checkmark-circle" size={15} color={color} />
                  <Text style={styles.perkText}>{perk}</Text>
                </View>
              ))}
            </View>

            {tier.earlyAdopterDiscount !== undefined && isEarlyAdopter && (
              <View style={styles.discountNote}>
                <Ionicons name="pricetag" size={13} color={EARLY_COLOR} />
                <Text style={styles.discountNoteText}>{tier.earlyAdopterDiscount} at launch</Text>
              </View>
            )}

            {tier.planId && (
              MONETIZATION_ENABLED ? (
                <TouchableOpacity style={[styles.purchaseBtn, { borderColor: color, backgroundColor: color + '18' }]}>
                  <Text style={[styles.purchaseBtnText, { color }]}>Subscribe</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.comingSoonBtn}>
                  <Ionicons name="time-outline" size={14} color={GZW.textMuted} />
                  <Text style={styles.comingSoonBtnText}>Coming Soon</Text>
                </View>
              )
            )}
          </View>

          {/* ── Launch notice ─────────────────────────────────────────────────── */}
          <View style={styles.launchNotice}>
            <Ionicons name="information-circle-outline" size={20} color={GZW.accent} />
            <View style={styles.launchNoticeText}>
              <Text style={styles.launchNoticeTitle}>Subscriptions Launching Soon</Text>
              <Text style={styles.launchNoticeSub}>
                In-app purchases are being configured. Claim Early Adopter access above to get 30 days of Supporter access free and lock in a 15% launch discount.
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

  hero: { alignItems: 'center', gap: Spacing.sm },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: GZW.accent + '18',
    borderWidth: 2,
    borderColor: GZW.accent + '44',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
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
  },
  subtitle: {
    fontSize: Typography.sizes.md,
    color: GZW.textSecondary,
    textAlign: 'center',
  },

  trustNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: GZW.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: GZW.surfaceBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  trustNoteText: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    color: GZW.textMuted,
    lineHeight: 18,
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

  // ── Tabs ──────────────────────────────────────────────────────────────────
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: GZW.surfaceBorder,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },

  // ── Plan card ─────────────────────────────────────────────────────────────
  planCard: {
    backgroundColor: GZW.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  planIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planTitleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  planPrice: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.heavy },
  planBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.sm },
  planBadgeText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold },
  planHeadline: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
  planSubline: { fontSize: Typography.sizes.sm, color: GZW.textSecondary, lineHeight: 20 },
  planPriceNote: { fontSize: Typography.sizes.xs, color: GZW.textMuted },
  divider: { height: 1, backgroundColor: GZW.surfaceBorder },
  planPerks: { gap: Spacing.sm },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  perkText: { fontSize: Typography.sizes.sm, color: GZW.text, flex: 1 },
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
