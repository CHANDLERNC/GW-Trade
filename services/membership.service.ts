import { supabase } from '@/lib/supabase';
import { MEMBERSHIP } from '@/constants/membership';
import type { Profile, AccessLevel, PriorityRank } from '@/types';

// ── Access level ──────────────────────────────────────────────────────────────

/**
 * Derives the effective access level for a profile.
 * Paid flags (is_member / is_lifetime_member) are only ever set by the
 * RevenueCat webhook when MONETIZATION_ENABLED = true.
 * During the pre-launch phase, only early adopters reach temp_premium.
 */
export function getAccessLevel(profile: Profile | null): AccessLevel {
  if (!profile) return 'free';
  if (profile.is_lifetime_member) return 'lifetime';
  if (profile.is_member) return 'premium';
  if (
    profile.is_early_adopter &&
    profile.early_access_expires_at &&
    Date.now() < new Date(profile.early_access_expires_at).getTime()
  ) return 'temp_premium';
  return 'free';
}

export function isPremiumOrAbove(level: AccessLevel): boolean {
  return level === 'lifetime' || level === 'premium' || level === 'temp_premium';
}

// ── Listing limits ────────────────────────────────────────────────────────────

export function getListingLimit(level: AccessLevel): number {
  switch (level) {
    case 'lifetime':     return MEMBERSHIP.LIFETIME_LIMIT;
    case 'premium':
    case 'temp_premium': return MEMBERSHIP.PREMIUM_LIMIT;
    default:             return MEMBERSHIP.FREE_LIMIT;
  }
}

export function getPostDurationMs(level: AccessLevel): number {
  switch (level) {
    case 'lifetime':     return MEMBERSHIP.LIFETIME_POST_DAYS * 86_400_000;
    case 'premium':
    case 'temp_premium': return MEMBERSHIP.PREMIUM_POST_HOURS * 3_600_000;
    default:             return MEMBERSHIP.FREE_POST_HOURS * 3_600_000;
  }
}

export function getPriorityRank(level: AccessLevel): PriorityRank {
  switch (level) {
    case 'lifetime':     return 4;
    case 'premium':      return 3;
    case 'temp_premium': return 2;
    default:             return 1;
  }
}

// ── Early adopter claim ───────────────────────────────────────────────────────

export const membershipService = {
  async claimEarlyAccess(): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await supabase.rpc('claim_early_access');
    if (error) return { success: false, error: error.message };
    if (data?.error) return { success: false, error: data.error };
    return { success: true };
  },
};
