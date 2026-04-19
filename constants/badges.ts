import { GZW } from './theme';

export type BadgeCategory = 'rank' | 'community' | 'supporter';

export interface BadgeProfile {
  trades_completed: number;
  ratings_positive: number;
  ratings_negative: number;
  is_early_adopter: boolean;
  is_member: boolean;
  is_lifetime_member: boolean;
}

export interface BadgeDef {
  id: string;
  label: string;
  icon: string;
  color: string;
  category: BadgeCategory;
  unlockHint: string;
  isLocked: (p: BadgeProfile) => boolean;
}

export const BADGES: BadgeDef[] = [
  // ── Trusted Trader rank track (auto-equips to highest earned) ─────────────
  {
    id: 'recruit',
    label: 'Recruit',
    icon: 'person-outline',
    color: '#756F69',
    category: 'rank',
    unlockHint: 'Available to all operators',
    isLocked: () => false,
  },
  {
    id: 'merchant',
    label: 'Merchant',
    icon: 'storefront-outline',
    color: '#A89F94',
    category: 'rank',
    unlockHint: 'Earn 3 positive trade ratings',
    isLocked: (p) => p.ratings_positive < 3,
  },
  {
    id: 'veteran',
    label: 'Veteran Trader',
    icon: 'shield-half-outline',
    color: '#4A90D9',
    category: 'rank',
    unlockHint: 'Earn 10 positive trade ratings',
    isLocked: (p) => p.ratings_positive < 10,
  },
  {
    id: 'trusted',
    label: 'Trusted Trader',
    icon: 'shield-checkmark',
    color: '#52B788',
    category: 'rank',
    unlockHint: 'Earn 25 positive trade ratings',
    isLocked: (p) => p.ratings_positive < 25,
  },
  {
    id: 'elite',
    label: 'Elite Trader',
    icon: 'medal',
    color: GZW.accent,
    category: 'rank',
    unlockHint: 'Earn 50 positive trade ratings',
    isLocked: (p) => p.ratings_positive < 50,
  },
  {
    id: 'legend',
    label: 'Market Legend',
    icon: 'trophy',
    color: '#FFD700',
    category: 'rank',
    unlockHint: 'Earn 100 positive trade ratings',
    isLocked: (p) => p.ratings_positive < 100,
  },

  // ── Community badges (earned, never gated) ────────────────────────────────
  {
    id: 'early_adopter',
    label: 'Early Adopter',
    icon: 'rocket',
    color: '#9C27B0',
    category: 'community',
    unlockHint: 'Claim early adopter access during the launch window',
    isLocked: (p) => !p.is_early_adopter,
  },
  {
    id: 'perfect_record',
    label: 'Perfect Record',
    icon: 'star',
    color: '#52B788',
    category: 'community',
    unlockHint: '10+ trades with zero negative ratings',
    isLocked: (p) =>
      p.ratings_positive + p.ratings_negative < 10 || p.ratings_negative > 0,
  },

  // ── Supporter cosmetic badges (recognition, not advantage) ────────────────
  {
    id: 'supporter',
    label: 'Supporter',
    icon: 'shield',
    color: GZW.accent,
    category: 'supporter',
    unlockHint: 'Active Supporter subscription',
    isLocked: (p) => !p.is_member && !p.is_lifetime_member,
  },
  {
    id: 'lifetime_supporter',
    label: 'Lifetime Supporter',
    icon: 'infinite',
    color: '#FFD700',
    category: 'supporter',
    unlockHint: 'Lifetime Supporter subscription',
    isLocked: (p) => !p.is_lifetime_member,
  },
];

const RANK_IDS = ['recruit', 'merchant', 'veteran', 'trusted', 'elite', 'legend'];

export function getAutoRankBadge(p: BadgeProfile): BadgeDef {
  for (let i = RANK_IDS.length - 1; i >= 0; i--) {
    const badge = BADGES.find((b) => b.id === RANK_IDS[i])!;
    if (!badge.isLocked(p)) return badge;
  }
  return BADGES.find((b) => b.id === 'recruit')!;
}

export function getEquippedBadge(
  p: BadgeProfile & { equipped_badge_id?: string | null }
): BadgeDef {
  if (p.equipped_badge_id) {
    const badge = BADGES.find((b) => b.id === p.equipped_badge_id);
    if (badge && !badge.isLocked(p)) return badge;
  }
  return getAutoRankBadge(p);
}

export const BADGE_CATEGORY_LABELS: Record<BadgeCategory, string> = {
  rank:      'Trader Rank',
  community: 'Community',
  supporter: 'Supporter',
};
