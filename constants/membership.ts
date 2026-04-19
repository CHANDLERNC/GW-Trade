// ── Kill switch — flip to true when App Store payments are fully configured ──
export const MONETIZATION_ENABLED = false;

// ── Listing limits per access level ──────────────────────────────────────────
export const MEMBERSHIP = {
  FREE_LIMIT: 10,
  PREMIUM_LIMIT: 30,
  LIFETIME_LIMIT: 90,

  FREE_POST_HOURS: 12,
  PREMIUM_POST_HOURS: 24,
  LIFETIME_POST_HOURS: 48,

  FREE_MESSAGES_PER_DAY: 50,
  PREMIUM_MESSAGES_PER_DAY: 200,
  LIFETIME_MESSAGES_PER_DAY: 0, // 0 = unlimited

  FREE_LFG_LIMIT: 4,
  PREMIUM_LFG_LIMIT: 15,
  LIFETIME_LFG_LIMIT: 45,

  // First N users qualify for discounted lifetime price
  LAUNCH_DISCOUNT_THRESHOLD: 200,
} as const;

// ── Early adopter window ──────────────────────────────────────────────────────
export const EARLY_ACCESS_END = new Date('2026-06-30T23:59:59Z');
export const EARLY_ACCESS_DURATION_DAYS = 30;

// ── RevenueCat product IDs (not yet active — MONETIZATION_ENABLED = false) ───
export const PRODUCT_IDS = {
  monthly:              'gzw_premium_monthly',
  yearly:               'gzw_premium_yearly',
  lifetime:             'gzw_lifetime',
  lifetime_discounted:  'gzw_lifetime_launch',
} as const;

export type PlanId = keyof typeof PRODUCT_IDS;

export const PLANS: Record<PlanId, {
  id: PlanId;
  label: string;
  price: string;
  note: string;
  badge?: string;
  earlyAdopterDiscount?: string;
}> = {
  monthly: {
    id: 'monthly',
    label: 'Supporter — Monthly',
    price: '$1.99',
    note: 'per month · cancel anytime',
    earlyAdopterDiscount: '15% off your first month',
  },
  yearly: {
    id: 'yearly',
    label: 'Supporter — Yearly',
    price: '$14.99',
    note: 'per year · save 37%',
    earlyAdopterDiscount: '15% off your first year',
  },
  lifetime: {
    id: 'lifetime',
    label: 'Supporter — Lifetime',
    price: '$34.99',
    note: 'one-time contribution · supports the project long-term',
  },
  lifetime_discounted: {
    id: 'lifetime_discounted',
    label: 'Supporter — Lifetime',
    price: '$29.99',
    note: 'launch price · first 200 users only',
    badge: 'LAUNCH PRICE',
  },
};
