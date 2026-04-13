# GZW Market

A player-to-player trading marketplace for Gray Zone Warfare.

## Stack

- **Expo** (React Native + expo-router v6) · TypeScript
- **Supabase** — Auth, PostgreSQL, Realtime

## Features

- Browse and post item listings by faction (LRI · MSS · CSI)
- Real-time messaging between buyers and sellers
- Two-party trade confirmation + reputation ratings
- LFG (Looking for Group) tab with membership-tiered post duration
- Public player profiles with faction badge and trade stats
- Saved listings and sellers
- Push notifications
- Membership tiers (free · member · lifetime)

## Getting Started

```bash
npm install
npx expo start
```

Requires a `.env` with your Supabase URL and anon key:

```
EXPO_PUBLIC_SUPABASE_URL=your_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Run the SQL files in `supabase/` against your Supabase project via the SQL Editor.

## Project Structure

```
app/          # Expo Router screens (tabs, auth, modals)
components/   # Reusable UI components
constants/    # Theme, factions, membership config
context/      # Auth and Theme context providers
hooks/        # Data hooks
services/     # Supabase data layer
supabase/     # SQL schema files
types/        # Shared TypeScript types
```

See [CLAUDE.md](./CLAUDE.md) for AI assistant context and code conventions.
