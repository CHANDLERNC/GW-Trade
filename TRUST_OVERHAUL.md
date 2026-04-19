# GZW Market — Trust, Legitimacy & Credibility Overhaul

**Started:** April 18, 2026  
**Version at start:** v1.3.2

---

## Progress Legend
- ✅ Shipped
- 🔄 In progress
- ⬜ Pending
- 🗄️ Needs Supabase SQL run

---

## Tier 0 — Ship Immediately (24–72 hours)
*No backend work required. These kill the narrative.*

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Public statement post (Discord / Reddit / in-app banner) | ⬜ | Draft in §11 below — copy ready to paste |
| 2 | Homepage trust strip: "No RMT. No Data Selling. No Pay-to-Win Reputation." | ✅ | `app/(tabs)/index.tsx` — above quick actions |
| 3 | First-login disclosure modal (static, logs acceptance to `user_agreements`) | ✅ | `app/(tabs)/_layout.tsx` — un-dismissable, checkbox-gated, AsyncStorage + Supabase write |
| 4 | Rebrand all "Premium / Lifetime" → "Supporter"; remove "POPULAR / BEST VALUE" badges | ✅ | `constants/membership.ts` + `components/ui/MembershipModal.tsx` |
| 5 | Terms of Service + Privacy Policy pages | ✅ | `app/legal/terms.tsx` · `app/legal/privacy.tsx` · routes in `app/_layout.tsx` |
| 6 | Mad Finger Games non-affiliation disclaimer on homepage | ✅ | Footer of home screen ScrollView |
| 7 | Kill any "purchased reputation" language in app | ✅ | MembershipModal trust disclaimer added; search-ranking perks removed |
| — | `user_agreements` SQL table | 🗄️ | Run `supabase/agreements.sql` in Supabase SQL Editor |

---

## Tier 1 — Week 1
*Systems users can see and verify.*

| # | Item | Status | Notes |
|---|------|--------|-------|
| 8 | Mandatory standalone Verified-Trader checkbox at signup | ✅ | `app/(auth)/sign-up.tsx` — two separate unchecked checkboxes before Create Account button; write `tos` + `verified_trader_clause` rows to `user_agreements` |
| 9 | "Keep The Lights On" public cost-transparency page | ✅ | `app/transparency/costs.tsx` — itemized monthly costs, supporter revenue, deficit/surplus |
| 10 | About page + "Built by" team page | ✅ | `app/about/index.tsx` · `app/about/team.tsx` |
| 11 | Public roadmap (Trello/GitHub Projects embed or native screen) | ✅ | `app/transparency/roadmap.tsx` — 3 columns: Planned / In Progress / Shipped |
| 12 | Public changelog screen | ✅ | `app/transparency/changelog.tsx` — all versions documented |
| 13 | Report button on every listing + profile → `reports` table + mod queue | ✅ | `supabase/reports.sql` + ellipsis menu on listing detail (non-owners) + existing profile report flow |
| 14 | Account Settings → "Delete My Data" request form | ✅ | `app/settings/delete-data.tsx` — 7-day grace window, reason selection, confirmation alert |
| 15 | Community Rules, Ban Policy, Appeal Process pages | ✅ | `app/legal/community-rules.tsx` — strike system, instant-ban list, appeal email |
| 16 | Age gate (13+) at signup | ✅ | Checkbox in `app/(auth)/sign-up.tsx`; write `age_gate` row to `user_agreements` |
| 17 | Cookie/analytics consent banner (only if analytics enabled) | ✅ | No analytics — "no analytics" already in Privacy Policy. No banner needed. |

---

## Tier 2 — First 30 Days
*Systems that prove durability.*

| # | Item | Status | Notes |
|---|------|--------|-------|
| 18 | Three-strike warning system + user-facing strike ledger | ⬜ | `user_strikes` table + `app/settings/account-standing.tsx` |
| 19 | Trade dispute escalation flow with SLA | ⬜ | `trade_disputes` table + report flow on trade screen; 7-day resolution SLA |
| 20 | Login anomaly email alerts | ⬜ | `login_events` table + Supabase Edge Function on auth event → Resend email |
| 21 | Server-side rate limiting with user-visible messaging | ⬜ | Supabase Edge Functions or Upstash; user-facing toast explains WHY |
| 22 | Quarterly transparency report (first issue scheduled) | ⬜ | Q2 2026 due June 30 — template in §8.1 below |
| 23 | Supporter fund tracker (monthly auto-update) | ⬜ | Lives inside Keep The Lights On page; pull from RevenueCat webhook |
| 24 | Uptime/status page | ⬜ | Better Stack or UptimeRobot public page at status.gzwmarket.com |
| 25 | Weekly dev update cadence established | ⬜ | Discord + in-app Announcements feed; 4-line minimum template in §5.5 below |
| 26 | Roadmap voting mechanism | ⬜ | One upvote per item per user; sort Planned column by vote count |
| 27 | FAQ + onboarding walkthrough + first-use tooltips | ⬜ | `app/about/faq.tsx` · 4-step walkthrough · coach marks on first visit |
| 28 | Moderator team page | ⬜ | `app/about/moderators.tsx` — handle, avatar, tenure, timezone |

---

## Database: SQL Files to Run

| File | Table(s) | Status |
|------|----------|--------|
| `supabase/fix_profiles_rls.sql` | `is_admin()` function + policies | ✅ Run 2026-04-18 |
| `supabase/agreements.sql` | `user_agreements` | ✅ Run 2026-04-18 |
| `supabase/reports.sql` | `reports` | ✅ Run 2026-04-18 |
| `supabase/deletion.sql` | `profiles.deletion_requested_at` column | ✅ Run 2026-04-18 |
| Tier 2 — strikes | `user_strikes` | ⬜ Pending implementation |
| Tier 2 — disputes | `trade_disputes` | ⬜ Pending implementation |
| Tier 2 — login events | `login_events` | ⬜ Pending implementation |

---

## Detailed Specs

### §1.1 First-Login Disclosure Modal

**Current status:** ✅ Shipped in `app/(tabs)/_layout.tsx`

**Behavior:**
- Fires on first authenticated session (not at signup)
- Cannot be dismissed by back button or swipe (`onRequestClose={() => {}}`)
- Checkbox unchecked by default; "I Understand" button disabled until checked
- Re-fires if `@gzw_disclosure_v1` key not in AsyncStorage
- On accept: writes AsyncStorage key + inserts into `user_agreements` table (best-effort)
- Re-show version: bump AsyncStorage key to `@gzw_disclosure_v2` etc. when wording changes

**Copy (verbatim):**
```
Before you start trading

• We do not sell or share your data. Your account information stays on our servers 
  and is never sold to advertisers or third parties.

• Real money trading (RMT) is prohibited. Trading in-game items for real money, 
  gift cards, or anything of monetary value is strictly forbidden and will result 
  in a permanent ban.

• We are not affiliated with Mad Finger Games. GZW Market is a fan-made community 
  tool. Gray Zone Warfare is a trademark of Mad Finger Games.

• Reputation cannot be purchased. Verified Trader status and all reputation are 
  earned through completed trade history only. They are never for sale.

☐ I have read and understand the above. (required)

[ I Understand ]
```

---

### §1.2 Terms of Service

**Current status:** ✅ Shipped at `app/legal/terms.tsx`

**Sections:** Who We Are · Who Can Use This · Acceptable Use · Prohibited Conduct · Account Termination · Liability Limitations · Governing Law · Changes to These Terms

**Key line:** "Real money trading is a permanent ban with no appeal."

**Linking:**
- ✅ Homepage trust strip → `router.push('/legal/terms')`
- ⬜ Signup screen: "By creating an account you agree to our Terms and Privacy Policy"
- ⬜ Profile → Settings → Legal

---

### §1.3 Privacy Policy

**Current status:** ✅ Shipped at `app/legal/privacy.tsx`

**Sections:** What We Collect · What We Don't Collect · Why We Collect It · How Long We Keep It · Who Can See Your Data · We Do Not Sell Your Data · Your Rights · Security · No Analytics or Tracking · Contact

**Key statement:** "GZW Market uses no third-party analytics, no tracking cookies, and no advertising SDKs."

---

### §1.4 Delete My Data Request Form

**Status:** ⬜ Tier 1

**Route:** `app/settings/delete-data.tsx`

**DB schema:**
```sql
alter table profiles add column deletion_requested_at timestamptz;
alter table profiles add column deletion_reason text;
-- Scheduled function: daily sweep of profiles where
-- deletion_requested_at < now() - interval '7 days'
```

**Flow:** Form → account enters pending_deletion → user signed out → 7-day grace → hard delete. Email at submission + 7-day completion + if canceled.

---

### §1.5 Age Gate

**Status:** ⬜ Tier 1

**Where:** Signup screen, before email field.

**UI:** Single radio "I am 13 or older" (required). Note: "If you plan to support the app financially, you must be 18+."

**Backend:** Write `user_agreements` row with `agreement_type='age_gate'`.

---

### §2 Mandatory Verified Trader Checkbox at Signup

**Status:** ⬜ Tier 1

**File:** `app/(auth)/sign-up.tsx` — add AFTER password field, BEFORE Create Account button.

**Two separate checkboxes, both unchecked by default:**
```
☐ I agree to the Terms of Service and Privacy Policy.

☐ I understand that Verified Trader status and all reputation on
   this platform are earned through completed trade milestones only
   and cannot be purchased under any circumstances.
```

**Backend:** Write two `user_agreements` rows on submit:
- `agreement_type: 'tos'`, `version: '1'`
- `agreement_type: 'verified_trader_clause'`, `version: '1'`

Button disabled until both checked.

---

### §3 Monetization Reframe

**Status:** ✅ Complete (Tier 0 labels + full limit overhaul 2026-04-18)

**Constant renames done (display labels):**
| Old | New |
|-----|-----|
| "Premium Monthly" | "Supporter — Monthly" |
| "Premium Yearly" | "Supporter — Yearly" |
| "Lifetime Access" | "Supporter — Lifetime" |
| "BEST VALUE" badge | Removed |
| "POPULAR" badge | Removed |
| "unlimited · pay once · never again" | "one-time contribution · supports the project long-term" |
| "GZW Market Premium" (modal title) | "Support GZW Market" |
| "Unlock more listings..." (subtitle) | "Help keep the servers running. 100% of supporter funds go toward hosting costs." |
| "GZW Member" (profile card) | "Supporter" |
| "Lifetime Member" (profile card) | "Lifetime Supporter" |
| "Upgrade to Member" | "Become a Supporter" |
| "Member exclusive" (name color lock) | "Supporter exclusive" |
| "2-week post duration · never expires" | "48-hour posts · never expires" |

**Perks removed (trust-adjacent):**
- "Priority ranking in browse"
- "Highest priority in browse"

**Trust disclaimer added to MembershipModal:**
> "Supporter status does not affect Verified Trader status or reputation in any way."

**Tier limits (finalised 2026-04-18):**
| Metric | Free | Supporter | Lifetime |
|--------|------|-----------|---------|
| Active listings | 10 | 30 | 90 |
| Messages/day | 50 | 200 | unlimited |
| Active LFG posts | 4 | 15 | 45 |
| Post/LFG duration | 12h | 24h | 48h |

**New — LimitReachedModal** (`components/ui/LimitReachedModal.tsx`): dismissible sheet shown when any limit is hit (listing, LFG, message). Shows tier comparison + CTA to MembershipModal. Wired into `create.tsx` and `lfg.tsx`.

**New — Trust strip animation** (`app/(tabs)/index.tsx`): "No RMT · No Data Selling · No Pay-to-Win" pulses red (#7A2020 → #E53E3E) on a 3.6s breathing loop.

**Free tier audit — Supporter launch ready:**
- ✅ Free users can list trades (10 active, 12h duration)
- ✅ Free users can message (50/day)
- ✅ Free users can complete trades
- ✅ Free users can earn Verified Trader status
- ✅ Free users can rate and be rated
- ✅ Free users can use LFG (4 active posts, 12h duration)

---

### §4 Keep The Lights On — Cost Transparency Page

**Status:** ⬜ Tier 1

**Route:** `app/transparency/costs.tsx`

**Content structure:**
```
Keep The Lights On
Updated: [Month Year]

— Monthly Operating Cost —
Supabase (Pro tier)              $25.00
Database storage (20GB)           $5.00
Push notifications (Expo)         $0.00  (free tier)
Domain + SSL                      $1.50
Error monitoring (Sentry)        $26.00
Email transactional (Resend)     $20.00
App Store / Play developer       $16.67  (annualized)
───────────────────────────────────────
Total monthly cost               $94.17

— This Month —
Supporters this month                [X]
Supporter revenue (after fees)   $[X.XX]
Covered by supporters              [X]%
Deficit / Surplus              $[X.XX]

— What surplus goes toward —
(1) Next month's costs  (2) Infrastructure upgrades
(3) Future development time. No founder draw.

— A note from the team —
[Short paragraph, updated monthly]
```

**Data source:** Manual monthly update for v1. Pull from RevenueCat webhook for actual revenue, netted of 30%/15% platform fees.

---

### §5 Development Transparency

#### §5.5 Weekly Dev Update Template
```
Week of [Date Range]
Shipped: [bullets]
Working on: [bullets]
Blocked / slipped: [honest note or "nothing"]
Supporter count: X / Monthly cost covered: Y%
```
Post to Discord + in-app Announcements. Miss a week → acknowledge next week.

---

### §7 Trust & Safety Systems

#### §7.1 Report Button — DB Schema
```sql
create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id),
  target_type text check (target_type in ('listing','user','message','trade')),
  target_id uuid not null,
  reason text not null,
  details text,
  status text default 'open',  -- 'open','triaged','actioned','dismissed'
  resolved_at timestamptz,
  resolver_id uuid references profiles(id),
  resolution_note text,
  created_at timestamptz default now()
);
```
**Placement:** Every listing detail screen, every user profile, every message thread (overflow menu).

#### §7.2 Moderation SLA
Stated publicly: "We commit to reviewing every report within 48 hours."

#### §7.3 Three-Strike System — DB Schema
```sql
create table user_strikes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  issued_by uuid references profiles(id),
  issued_at timestamptz default now(),
  reason text not null,
  evidence_ref text,
  expires_at timestamptz,  -- typically 365 days
  appeal_status text default 'none'  -- 'none','pending','upheld','overturned'
);
```
**User-facing route:** Profile → Settings → Account Standing.

#### §7.5 Trade Dispute Escalation — DB Schema
```sql
-- trade_disputes table (Tier 2)
-- Linked to trades.id, status machine, audit log
-- User flow: "Report a problem with this trade" → select reason → upload evidence (max 5 images)
-- Counter-party notified, 72h to respond → mod reviews → decision within 7 days
```

#### §7.6 Verified Trader Thresholds (publish these)
| Badge | Trades | Rating | Tenure |
|-------|--------|--------|--------|
| Bronze | 5 completed | ≥95% positive | — |
| Silver | 25 completed | ≥95% positive | ≥90 days since signup |
| Gold | 100 completed | ≥97% positive | ≥180 days since signup |

No purchase path. Badge computed from existing `profiles.trades_completed`, `ratings_positive`, `ratings_negative` counters + profile tenure.

---

### §8.1 Quarterly Transparency Report Template

**Schedule:** Mar 31 · Jun 30 · Sep 30 · Dec 31 (public, no login required)

**First issue due:** June 30, 2026

```
GZW Market — Q[X] [Year] Transparency Report

Users
• Total accounts: [X]
• Active in quarter: [X]
• New signups: [X]
• Accounts deleted: [X]

Trades
• Listings posted: [X]
• Trades completed: [X]
• Average rating: [X.XX]

Moderation
• Reports received: [X]
• Reports actioned: [X]
• Reports dismissed: [X]
• Avg response time: [X hours]
• Strikes issued: [X]
• Accounts banned: [X]  (RMT: [X])

Finances
• Supporters gained: [X]
• Supporters lost: [X]
• Total supporter revenue: $[X]
• Total operating cost: $[X]
• Surplus / deficit: $[X]

What changed this quarter
[short paragraph]

What's coming next quarter
[short paragraph]
```

---

### §9.1 Onboarding Walkthrough (Tier 2)

**Trigger:** First authenticated session, after disclosure modal accepted.

**4 steps (skippable, re-openable from Profile):**
1. "How trading works" — post a listing, get messages, confirm trade, rate each other
2. "How reputation works" — trades + ratings = Verified Trader. Not for sale. Ever.
3. "The rules" — RMT banned. Scamming banned. Three strikes for most offenses.
4. "If someone breaks the rules" — tap ⚐ icon. We respond in 48 hours.

**Backend:** `profiles.onboarding_completed_at` timestamptz column.

---

### §9.2 FAQ Required Entries (Tier 2)

Route: `app/about/faq.tsx`

1. Is this safe to use?
2. Who built and runs this?
3. Is this affiliated with Mad Finger Games?
4. What is Supporter and what do I get?
5. Where does supporter money go?
6. Who pays for development?
7. **Can I buy a Verified Trader badge?** → "No. Never. Not in any form."
8. How do I delete my account?
9. What happens if I get scammed?
10. Is my data sold?
11. What data do you collect?
12. How do I report a bad actor?

---

### §11 Public Statement — Ready to Post

**Channels:** In-app announcement banner · Discord · Reddit r/GrayZoneWarfare · Twitter/X

**Status:** ⬜ Draft ready — needs posting

---

```
On trust, and what we're changing at GZW Market

Over the past weeks we've heard a lot of concerns about how GZW Market is run —
how we handle data, how our paid tier is structured, and whether reputation on the
platform can be bought. Some of those concerns came in good faith from users. Some
came from other parts of the community. Either way, they deserve a direct response,
not a defensive one.

We got some things wrong in how we presented this app. We want to fix that, clearly
and on the record.

Here's what's true — and what's changing.

1. Your data isn't for sale. It never was. We're proving it instead of just saying it.
We're publishing a plain-language privacy policy this week. It lists exactly what we
collect (email, username, your listings and messages), exactly what we don't (location,
contacts, tracking across other apps), and exactly who can see it (you, moderators for
reports, our database host). We don't sell data. We don't share it with advertisers.
We don't share it with Mad Finger Games.

2. Paid tiers are being rebranded as Supporter, and the free tier stays fully functional.
Core trading will always be free — listing, messaging, trading, rating, Verified Trader
status, LFG. Supporter gives you convenience perks only: higher listing limits, a cosmetic
badge, early feature access. That's it. No reputation boost. No trade priority. No locked
core features. If it affects trust or trading fairness, it's free.

3. Reputation cannot be purchased. We're putting that in writing at signup.
Starting this week, every new account requires a separate, standalone checkbox
acknowledging that Verified Trader status and all reputation are earned through
completed trades only — never purchased. It's not buried in the ToS. It stands alone.
Every user, including those of us building this, agrees to it.

4. We're publishing what this app costs to run — every month.
A new Keep The Lights On page will show our actual monthly infrastructure costs,
itemized, alongside what supporters contributed that month and whether we covered the
bill. If there's a surplus, you'll see what it goes toward. If there's a deficit,
you'll see we ate it. No black box.

5. We're publishing who runs this.
A Built By page with names, roles, and tenures. A Moderator Team page with the same.
No hiding behind a logo.

6. RMT is banned. Permanently. No appeals.
Real money trading is a permanent ban with no appeal. We're writing this into the
Terms of Service and saying it out loud here. If you see RMT on the platform, report
it — we review every report within 48 hours.

7. We're publishing a public roadmap and a public changelog.
You'll see what we're working on, what's planned, what shipped, and every bug we've
fixed. Weekly updates going forward. When we slip a deadline, we'll say we slipped
it and why.

8. We're publishing a quarterly transparency report.
Active users, trades completed, reports handled, bans issued, dollars in, dollars
out. Every three months, publicly.

What we're asking of you

Hold us to this. Bookmark the transparency pages. Call out anything that contradicts
what we've written above. The whole point is that these commitments are verifiable —
if we drift, you should be able to see it and say so.

We're a small team building a free tool for a game we love. We're not Mad Finger
Games. We're not trying to be the only trading app in the community — there's room
for Discord-native tools and there's room for ours. But if you're going to use ours,
you deserve to know exactly how it's run.

All of the above will be live within 30 days. The first-login disclosures, the
Supporter rebrand, and the privacy policy go live this week.

Thanks for the pressure. It made the app better.

— The GZW Market team
```

---

## Files Changed / Created — Running Log

| File | Change | Tier | Date |
|------|--------|------|------|
| `constants/membership.ts` | Rebrand labels, remove badges, FREE_MESSAGES 5→50 | 0 | 2026-04-18 |
| `components/ui/MembershipModal.tsx` | Title, subtitle, perks, trust disclaimer, copy | 0 | 2026-04-18 |
| `app/(tabs)/_layout.tsx` | First-login disclosure modal | 0 | 2026-04-18 |
| `app/(tabs)/index.tsx` | Trust strip + MFG non-affiliation footer | 0 | 2026-04-18 |
| `app/legal/terms.tsx` | New — Terms of Service page | 0 | 2026-04-18 |
| `app/legal/privacy.tsx` | New — Privacy Policy page | 0 | 2026-04-18 |
| `app/_layout.tsx` | Stack.Screen routes for legal pages | 0 | 2026-04-18 |
| `supabase/agreements.sql` | New — user_agreements table + RLS | 0 | 2026-04-18 |

---

## Files Changed / Created — Tier 1

| File | Change | Tier | Date |
|------|--------|------|------|
| `app/(auth)/sign-up.tsx` | Age gate checkbox + ToS + Verified Trader clause checkboxes; user_agreements write on signup | 1 | 2026-04-18 |
| `app/legal/community-rules.tsx` | New — Community Rules, Strike System, Instant-Ban list, Appeal Process | 1 | 2026-04-18 |
| `app/transparency/costs.tsx` | New — Keep The Lights On, itemized costs, surplus policy | 1 | 2026-04-18 |
| `app/about/index.tsx` | New — About page with commitments + links hub | 1 | 2026-04-18 |
| `app/about/team.tsx` | New — Built By / Team page | 1 | 2026-04-18 |
| `app/transparency/roadmap.tsx` | New — Public roadmap (Planned/In Progress/Shipped) | 1 | 2026-04-18 |
| `app/transparency/changelog.tsx` | New — Full version changelog | 1 | 2026-04-18 |
| `app/settings/delete-data.tsx` | New — Delete My Data request form (7-day grace) | 1 | 2026-04-18 |
| `app/listing/[id].tsx` | Report menu for non-owners via ellipsis header button | 1 | 2026-04-18 |
| `app/_layout.tsx` | Routes for all Tier 1 new screens | 1 | 2026-04-18 |
| `supabase/reports.sql` | New — reports table + RLS | 1 | 2026-04-18 |
| `supabase/deletion.sql` | New — deletion_requested_at + deletion_reason columns on profiles | 1 | 2026-04-18 |

---

## Files Changed / Created — Supporter Rebrand + Limit Overhaul

| File | Change | Date |
|------|--------|------|
| `constants/membership.ts` | New limits: Free 10/50msg/4LFG/12h · Supporter 30/200msg/15LFG/24h · Lifetime 90/unlimited/45LFG/48h; removed `LIFETIME_POST_DAYS` | 2026-04-18 |
| `services/membership.service.ts` | `getPostDurationMs` uses `LIFETIME_POST_HOURS` | 2026-04-18 |
| `services/lfg.service.ts` | `lfgPostLimit` + `lfgPostDurationHours` tier-based from constants | 2026-04-18 |
| `components/ui/LimitReachedModal.tsx` | New — dismissible limit-hit sheet with tier table + CTA | 2026-04-18 |
| `components/ui/MembershipModal.tsx` | Perks updated for all plan cards; limit message copy tightened | 2026-04-18 |
| `app/(tabs)/profile.tsx` | "Lifetime Member"→"Lifetime Supporter", "GZW Member"→"Supporter", "Upgrade to Member"→"Become a Supporter", fixed `MEMBER_LIMIT`→`PREMIUM_LIMIT` | 2026-04-18 |
| `app/(tabs)/index.tsx` | Trust strip "No RMT…" text pulses red via `Animated.loop` | 2026-04-18 |
| `app/(tabs)/create.tsx` | `LimitReachedModal` wired on listing limit hit; chains to `MembershipModal` | 2026-04-18 |
| `app/(tabs)/lfg.tsx` | `LimitReachedModal` wired on atLimit tap; `MembershipModal` added | 2026-04-18 |
| `supabase/wipe_listings_and_chat.sql` | New — wipes listings/chat/LFG/comments/saved/price_history | 2026-04-18 |
| `supabase/full_test_reset.sql` | New — combined wipe + membership flag reset for test runs | 2026-04-18 |

---

*Last updated: 2026-04-18 — Tier 0 + Tier 1 complete. Supporter rebrand + limit overhaul complete.*
