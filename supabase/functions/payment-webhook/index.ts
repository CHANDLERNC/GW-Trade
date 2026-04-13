/**
 * GZW Market — RevenueCat payment webhook
 *
 * Handles subscription events and automatically upgrades / downgrades users.
 *
 * Set these environment variables in Supabase Dashboard → Edge Functions → Secrets:
 *   REVENUECAT_WEBHOOK_SECRET  — copy from RevenueCat Dashboard → Integrations → Webhooks
 *   MONETIZATION_ENABLED       — set to "true" when App Store payments are live
 *
 * In RevenueCat, set app_user_id to the Supabase user's UUID when calling
 * Purchases.logIn(supabaseUserId) after the user signs in.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Kill switch ───────────────────────────────────────────────────────────────
// When false, all purchase events are logged but NO profile flags are mutated.
// Flip MONETIZATION_ENABLED env var to "true" when App Store payments go live.
const MONETIZATION_ENABLED = Deno.env.get('MONETIZATION_ENABLED') === 'true';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Map RevenueCat product IDs → membership tier
const PRODUCT_TIER: Record<string, 'premium' | 'lifetime'> = {
  gzw_premium_monthly:  'premium',
  gzw_premium_yearly:   'premium',
  gzw_lifetime:         'lifetime',
  gzw_lifetime_launch:  'lifetime',
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

  const userId: string    = event.app_user_id;
  const productId: string = event.product_id;
  const tier = PRODUCT_TIER[productId];
  const expiresAt: string | null = event.expiration_at_ms
    ? new Date(event.expiration_at_ms).toISOString()
    : null;

  console.log(
    `[webhook] MONETIZATION_ENABLED=${MONETIZATION_ENABLED}` +
    ` event=${event.type} userId=${userId} product=${productId} tier=${tier}`
  );

  // ── Pre-launch guard ──────────────────────────────────────────────────────
  if (!MONETIZATION_ENABLED) {
    console.log('[webhook] monetization disabled — event received but no profile changes made');
    return new Response('OK', { status: 200 });
  }

  // ── Live purchase processing ──────────────────────────────────────────────
  switch (event.type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'UNCANCELLATION': {
      if (!tier) break;

      if (tier === 'lifetime') {
        await supabase.from('profiles').update({
          is_member:          true,
          is_lifetime_member: true,
          member_since:       new Date().toISOString(),
          member_expires_at:  null,
        }).eq('id', userId);
      } else {
        await supabase.from('profiles').update({
          is_member:         true,
          member_since:      new Date().toISOString(),
          member_expires_at: expiresAt,
        }).eq('id', userId);
      }
      break;
    }

    case 'PRODUCT_CHANGE': {
      if (!tier) break;
      const newProductId: string = event.new_product_id;
      const newTier = PRODUCT_TIER[newProductId] ?? tier;

      if (newTier === 'lifetime') {
        await supabase.from('profiles').update({
          is_member:          true,
          is_lifetime_member: true,
          member_expires_at:  null,
        }).eq('id', userId);
      } else {
        await supabase.from('profiles').update({
          is_member:          true,
          is_lifetime_member: false,
          member_expires_at:  expiresAt,
        }).eq('id', userId);
      }
      break;
    }

    // Cancelled — stays active until period ends; EXPIRATION handles the downgrade
    case 'CANCELLATION': {
      console.log(`[webhook] cancellation noted for ${userId} — access until ${expiresAt}`);
      break;
    }

    // Expired — downgrade to free (lifetime members are never downgraded)
    case 'EXPIRATION': {
      await supabase.from('profiles').update({
        is_member:         false,
        member_expires_at: null,
      }).eq('id', userId).eq('is_lifetime_member', false);
      break;
    }

    case 'BILLING_ISSUE': {
      console.log(`[webhook] billing issue for ${userId}`);
      break;
    }

    default:
      console.log(`[webhook] unhandled event type: ${event.type}`);
  }

  return new Response('OK', { status: 200 });
});
