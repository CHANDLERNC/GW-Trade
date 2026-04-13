# GZW Market

## Identity
Expo Router v6 · React Native · TypeScript · Supabase · Windows 11 dev

## File Map
| Path | Purpose |
|------|---------|
| `constants/theme.ts` | All tokens — ThemeColors, Spacing, Typography, BorderRadius |
| `context/ThemeContext.tsx` | isDark, colors, toggleTheme → persisted `@gzw_theme` |
| `context/AuthContext.tsx` | user, session |
| `app/(tabs)/index.tsx` | Home — clock, status line, faction cards, theme toggle |
| `app/(tabs)/profile.tsx` | Profile — stats, trader reputation card |
| `app/conversation/[id].tsx` | Chat — trade banner (4 states) + rating modal |
| `services/trades.service.ts` | markComplete · submitRating · getMyRating |
| `components/ui/TradeRatingModal.tsx` | Thumbs up/down bottom sheet |
| `types/index.ts` | All shared types |

## Strict Patterns
```ts
// ALL components — no exceptions
const styles = useMemo(() => createStyles(colors), [colors]);
function createStyles(c: ThemeColors) { return StyleSheet.create({ ... }); }
// Inside factory → c.accent | In JSX → colors.accent
// Zero hardcoded colors — theme tokens only
```

## Theme (dark)
| Token | Value |
|-------|-------|
| background | `#09090B` |
| surface | `#1C1E22` |
| surfaceElevated | `#262A2F` |
| surfaceBorder | `#303336` |
| accent | `#C8A84B` |
| text | `#DDD9D0` |
| textSecondary | `#A89F94` |
| textMuted | `#756F69` |
| BorderRadius | sm=4 md=8 lg=10 xl=16 |

## DB Schema (Supabase)
- **profiles** — +`trades_completed` +`ratings_positive` +`ratings_negative` (trigger-managed)
- **trades** — one per conversation · both confirm → `completed_at` set → ratings unlock
- **trade_ratings** — `UNIQUE(trade_id, rater_id)` · triggers auto-increment profile counters

## Pending
- [ ] Map tab — blocked on `assets/images/map.jpg` (user must provide)

## Git
- Remote: `https://github.com/CHANDLERNC/GW-Trade` · branch: `master`
- Tagged: `v1.0.0-beta`
