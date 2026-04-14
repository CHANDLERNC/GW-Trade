# Changelog

All notable changes to GZW Market are documented here.

---

## [1.2.0] — 2026-04-14

### Changed
- **LFG post limits by tier** — non-member: 2 active posts, member: 5, lifetime: 10 (previously 1 for all tiers)
- **LFG post duration** — flat 24h for all tiers (previously 12h / 24h / 48h by tier)
- **LFG post creation** — creating a new post no longer auto-deactivates previous ones; blocked at the tier limit instead

### Added
- **LFG countdown timer** — each card now shows live time remaining (e.g. `23h 47m`) in the action row
- **LFG slot counter** — post button shows `active/limit` count (e.g. `2/5`); dims and disables when limit is reached
- **LFG create sheet** — duration notice now shows `Xh · used/limit slots`

---

## [1.1.0] — 2026-04-13

### Added
- **Completed Trades feed on Home** — horizontal scrollable cards grouped by category, each showing item name, price, and time ago
- **Price history detail screen** (`/price-history/[item]`) — full trade history for a specific item
- **Price history category screen** (`/price-history/category/[cat]`) — all recent completed trades for a category
- **`priceHistoryService`** — three new methods: `getRecentCompletedTrades`, `getRecentByCategory`, `getItemPriceHistory`
- **Listing confirmation dialog** — tapping Post now shows an alert to confirm item name and asking price before submitting

### Changed
- **"Want in Return" is now required** on the create listing form — validation enforced, field marked with `*`, stored as non-nullable
- **Tab bar height** increased from 83 → 95 for better spacing
- **Post button dimensions** derived from `POST_BTN_SIZE` constant instead of hardcoded values

### Fixed
- Removed no-op `marginBottom: 0` from `tabBarIconStyle`
- Removed no-op `marginTop: 0` from create tab label wrapper

---

## [1.0.0-beta] — initial release

- Core trading app: listings, browse, inbox, saved, LFG, profile
- Supabase auth, realtime messaging, push notifications
- Admin: support tickets, price editor
- Trust & safety: report/block, price history
- Faction system: LRI · MSS · CSI
