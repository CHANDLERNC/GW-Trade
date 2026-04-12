/**
 * GZW Market — RevenueCat payment webhook
 *
 * Handles subscription events and automatically upgrades / downgrades users.
 *
 * Set these environment variables in Supabase Dashboard → Edge Functions → Secrets:
 *   REVENUECAT_WEBHOOK_SECRET  — copy from RevenueCat Dashboard → Integrations → Webhooks
 *
 * In RevenueCat, set app_user_id to the Supabase user's UUID when calling
 * Purchases.logIn(supabaseUserId) after the user signs in.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Map your RevenueCat product IDs → membership tier
// These must match the product IDs you create in App Store Connect / Google Play
const PRODUCT_TIER: Record<string, 'member' | 'lifetime'> = {
  gzw_member_monthly: 'member',
  gzw_member_yearly: 'member',
  gzw_lifetime: 'lifetime',
};

Deno.serve(async (req) => {
  // Verify RevenueCat webhook secret
  const authHeader = req.headers.get('Authorization');
  const secret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  const event = body?.event;
  if (!event) return new Response('OK', { status: 200 });

  const userId: string = event.app_user_id;
  const productId: string = event.product_id;
  const tier = PRODUCT_TIER[productId];
  const expiresAt: string | null = event.expiration_at_ms
    ? new Date(event.expiration_at_ms).toISOString()
    : null;

  console.log(`[webhook] event=${event.type} userId=${userId} product=${productId} tier=${tier}`);

  switch (event.type) {
    // ── New purchase or subscription renewal ──────────────────────────────────
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'UNCANCELLATION': {
      if (!tier) break;

      if (tier === 'lifetime') {
        await supabase.from('profiles').update({
          is_member: true,
          is_lifetime_member: true,
          member_since: new Date().toISOString(),
          member_expires_at: null, // lifetime never expires
        }).eq('id', userId);
      } else {
        await supabase.from('profiles').update({
          is_member: true,
          member_since: new Date().toISOString(),
          member_expires_at: expiresAt,
        }).eq('id', userId);
      }
      break;
    }

    // ── Plan change (e.g. monthly → yearly or → lifetime) ────────────────────
    case 'PRODUCT_CHANGE': {
      if (!tier) break;
      const newProductId: string = event.new_product_id;
      const newTier = PRODUCT_TIER[newProductId] ?? tier;

      if (newTier === 'lifetime') {
        await supabase.from('profiles').update({
          is_member: true,
          is_lifetime_member: true,
          member_expires_at: null,
        }).eq('id', userId);
      } else {
        await supabase.from('profiles').update({
          is_member: true,
          is_lifetime_member: false,
          member_expires_at: expiresAt,
        }).eq('id', userId);
      }
      break;
    }

    // ── Subscription cancelled — stays active until period ends ──────────────
    // RevenueCat fires EXPIRATION when access actually ends, so just log here.
    case 'CANCELLATION': {
      console.log(`[webhook] cancellation noted for ${userId} — access until ${expiresAt}`);
      break;
    }

    // ── Subscription expired — downgrade to free ──────────────────────────────
    case 'EXPIRATION': {
      await supabase.from('profiles').update({
        is_member: false,
        member_expires_at: null,
      }).eq('id', userId).eq('is_lifetime_member', false); // never downgrade lifetime
      break;
    }

    // ── Billing issue — optional: you could notify the user here ─────────────
    case 'BILLING_ISSUE': {
      console.log(`[webhook] billing issue for ${userId}`);
      break;
    }

    default:
      console.log(`[webhook] unhandled event type: ${event.type}`);
  }

  return new Response('OK', { status: 200 });
});
