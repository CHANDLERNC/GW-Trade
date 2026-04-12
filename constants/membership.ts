export const MEMBERSHIP = {
  FREE_LIMIT: 5,
  MEMBER_LIMIT: 35,
  LIFETIME_LIMIT: 99,
  FREE_POST_HOURS: 48,
  MEMBER_POST_DAYS: 7,
  LIFETIME_POST_DAYS: 14,
} as const;

// 20 days from project launch — May 2 2026 at midnight UTC
export const EARLY_ACCESS_END = new Date('2026-05-02T23:59:59Z');

// RevenueCat product IDs — must match what you set in App Store / Play Store
export const PRODUCT_IDS = {
  monthly: 'gzw_member_monthly',
  yearly: 'gzw_member_yearly',
  lifetime: 'gzw_lifetime',
} as const;

export type PlanId = 'monthly' | 'yearly' | 'lifetime';

export const PLANS: Record<PlanId, { id: PlanId; label: string; price: string; note: string; badge?: string }> = {
  monthly: {
    id: 'monthly',
    label: 'Monthly',
    price: '$1.99',
    note: 'per month · cancel anytime',
  },
  yearly: {
    id: 'yearly',
    label: 'Yearly',
    price: '$14.99',
    note: 'per year · save 37%',
    badge: 'BEST VALUE',
  },
  lifetime: {
    id: 'lifetime',
    label: 'Lifetime',
    price: '$25.00',
    note: '99 listings · 2-week posts · one-time',
    badge: 'POPULAR',
  },
};
