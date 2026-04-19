# CLAUDE.md — GZW Market

AI assistant context for this repo. Read this before touching any code.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK + expo-router v6 (file-based routing) |
| Language | TypeScript |
| UI | React Native |
| Backend | Supabase (Auth · PostgreSQL · Realtime) |
| Dev OS | Windows 11 |

---

## App Structure

**Tabs** (`app/(tabs)/`): `index` (Home) · `browse` · `create` · `lfg` · `saved` · `inbox` · `profile` · `explore`

**Screens**: `app/listing/[id]` · `app/listing/edit/[id]` · `app/conversation/[id]` · `app/user/[id]` · `app/admin/tickets`

**Auth flow**: `app/(auth)/` → welcome · sign-in · sign-up

---

## Strict Patterns

### Theme / Styles — no exceptions
```ts
// Every component must use this pattern
const styles = useMemo(() => createStyles(colors), [colors]);
function createStyles(c: ThemeColors) {
  return StyleSheet.create({ container: { backgroundColor: c.background } });
}
// Inside createStyles → c.token  |  In JSX → colors.token
// ZERO hardcoded hex colors — theme tokens only
```

### Theme Tokens (dark)
| Token | Value |
|-------|-------|
| `background` | `#09090B` |
| `surface` | `#1C1E22` |
| `surfaceElevated` | `#262A2F` |
| `surfaceBorder` | `#303336` |
| `accent` | `#C8A84B` |
| `text` | `#DDD9D0` |
| `textSecondary` | `#A89F94` |
| `textMuted` | `#756F69` |
| `BorderRadius` | sm=4 md=8 lg=10 xl=16 |

Tokens live in `constants/theme.ts` · consumed via `context/ThemeContext.tsx`

---

## Key Files

| Path | Purpose |
|------|---------|
| `types/index.ts` | All shared TypeScript types |
| `constants/theme.ts` | Theme tokens + `GZW` export |
| `constants/factions.ts` | LRI · MSS · CSI faction definitions |
| `constants/membership.ts` | Membership tier config + kill switch |
| `constants/nameColors.ts` | Display name color palette |
| `context/AuthContext.tsx` | user · session · profile state |
| `context/ThemeContext.tsx` | isDark · colors · toggleTheme |
| `lib/supabase.ts` | Supabase client |
| `services/*.service.ts` | All data-fetching/mutation logic (never in components) |
| `hooks/use*.ts` | Data hooks wrapping services |
| `supabase/schema.sql` | Core DB schema (profiles, listings, conversations, messages) |
| `supabase/trades.sql` | Trade system schema |
| `supabase/lfg_schema.sql` | LFG posts schema |
| `supabase/membership_v2.sql` | Membership/monetization schema |

---

## Business Rules

**Factions:** LRI · MSS · CSI — used for trading zones and display

**LFG post duration:** Flat 24h for all tiers (changed in v1.2.0)

**LFG active post limits by tier:** non-member=2 · member=5 · lifetime=10

**LFG post creation:** Blocked (not auto-deactivated) when at the tier limit. Each card shows a live countdown timer and the post button shows `used/limit` count.

**Trade system:** One trade per conversation · both parties confirm → `completed_at` set → ratings unlock · `UNIQUE(trade_id, rater_id)` prevents double-rating

**Push notifications:** `hooks/usePushNotifications.ts` + `services/notifications.service.ts`

---

## DB (Supabase)

Key tables: `profiles` · `listings` · `conversations` · `messages` · `trades` · `trade_ratings` · `lfg_posts` · `saved_listings` · `support_tickets`

`profiles` has trigger-managed counters: `trades_completed` · `ratings_positive` · `ratings_negative`

All tables have RLS. Run SQL files in Supabase SQL Editor in schema order when setting up fresh.

---

## Git

- Remote: `https://github.com/CHANDLERNC/GW-Trade` · branch: `master`
- `master` is the single source of truth
- Tagged: `v1.0.0-beta`

---

## Current Version

`v1.4.0` — 2026-04-18

### Recent Changes
| Version | Change |
|---------|--------|
| 1.4.0 | Trust & Transparency: Supporter rebrand, first-login disclosure modal, ToS/Privacy/Community Rules, report system, data deletion, public roadmap/changelog/costs, admin screens, LimitReachedModal, age gate + verified-trader clause at signup, tier limit overhaul |
| 1.3.2 | Hotfix: back button on player profile, optimistic message send, duplicate conversation fix, "You:" inbox preview prefix |
| 1.3.1 | App Store global launch |
| 1.2.0 | LFG: flat 24h duration, per-tier active limits (2/5/10), countdown timer, slot counter, reject-at-limit |
| 1.1.0 | Completed trades feed on Home, price history screens, listing confirmation dialog, "want in return" required |
| 1.0.0-beta | Core app: listings, browse, inbox, saved, LFG, profile, admin, push notifications |

### Active Services
`auth` · `listings` · `lfg` · `trades` · `messages` · `conversations` · `notifications` · `priceHistory` · `profile` · `membership` · `safety` · `saved` · `support` · `comments`

---

## Session Notes

> **End of session:** Tell Claude "save anything worth keeping" — it will update memory with discoveries, decisions, and constraints found during the session.
>
> **Sensitive data:** Wrap in `<private>...</private>` — Claude will use it for the task but never save it to memory.

---

## AI Assistant Rules

**Do:**
- Read this file + check file structure with Glob before starting any task
- Edit existing files rather than creating new ones
- Keep changes scoped to exactly what was asked
- Follow the `useMemo(createStyles(colors))` pattern in every component

**Do not:**
- Hardcode any color values — use theme tokens only
- Add speculative features, premature abstractions, or "future-proofing"
- Add docstrings/comments/type annotations to code you didn't change
- Create helper utilities for one-time operations

**Ask before:**
- Force pushing, dropping tables, deleting files
- Architectural changes affecting multiple screens
- Anything outside the stated task scope
