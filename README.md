# 🎵 Ekoro

> A full-stack music streaming and downloading platform — stream, discover, upload, and support artists.

![Version](https://img.shields.io/badge/version-1.0.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-20_LTS-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Supabase](https://img.shields.io/badge/Supabase-Database_--_Auth_--_Storage-emerald)
![Status](https://img.shields.io/badge/status-in_development-gold)

---

## What is Ekoro?

Ekoro is a personal hobby project turned production-grade music platform. Think Spotify's streaming experience, Bandcamp's artist-first philosophy, and SoundCloud's community feel — all in one.

**For Listeners:** Stream millions of tracks, download for offline listening, discover new artists by genre and mood, build playlists, and support artists directly with tips.

**For Artists:** Upload your music, set your own download terms (free, pay-what-you-want, or paid), view play and download analytics, and grow your fanbase.

---

## Features

- 🎧 **Adaptive streaming** — HLS audio at 128kbps / 320kbps / FLAC depending on plan
- ⬇️ **Downloads** — Free, paid, or premium-gated tracks
- 🎤 **Artist uploads** — Upload, tag, and publish tracks with cover art
- 🔍 **Search & discovery** — Full-text search (PostgreSQL TSVector), genre/mood filters, trending charts
- 📋 **Playlists** — Create and share public or private playlists
- 💰 **Monetization** — Subscriptions, per-track purchases, and artist tipping
- 📊 **Artist analytics** — Plays, downloads, follower growth
- 🌍 **Mobile-first** — Responsive web app; native apps planned for v2

---

## Screenshots

> UI mockup built with Green, Gold & Royal Blue color scheme.

_Coming soon: real screenshots from the running app._

---

## Tech Stack

| Layer        | Technology                                                  |
| ------------ | ----------------------------------------------------------- |
| Frontend     | Next.js 14 (TypeScript, Tailwind CSS, App Router)           |
| Backend APIs | Next.js API Routes & Server Actions                         |
| Database     | PostgreSQL 16 (via Supabase) + Prisma ORM                   |
| Storage      | Supabase Storage (for raw/HLS audio & cover art)            |
| Auth         | Supabase Auth (with SSR cookies middleware)                 |
| Search       | Supabase Full-Text Search (pg_trgm & TSVector)              |
| Audio        | HLS streaming via FFmpeg (transcoded in background tasks)   |
| Payments     | Stripe                                                      |
| Realtime     | Supabase Realtime (for comments, likes, notifications)      |
| Hosting      | Vercel (Next.js Application) + Supabase (Backend services)  |

---

## Project Structure

```
Ekoro/
├── prisma/               # Prisma schema and migrations (if using Prisma client)
├── supabase/             # Supabase migrations, seed files, and configurations
├── src/
│   ├── app/              # Next.js App Router (pages & API route handlers)
│   │   ├── (auth)/       # Sign in, register, and reset flows
│   │   ├── (main)/       # Explore, trending, playlist, track detail pages
│   │   ├── api/          # Serverless Route Handlers (Stripe webhooks, transcoding triggers)
│   │   └── dashboard/    # Artist upload and analytics panel
│   ├── components/       # Reusable React components (Player, TrackCard, Sidebar)
│   ├── hooks/            # Custom React hooks (useAudio, usePlayer)
│   ├── lib/              # Client/Server helper utilities (Supabase, Stripe, Prisma)
│   ├── stores/           # Zustand global state stores (playerStore, authStore)
│   └── types/            # TypeScript interface definitions
├── public/               # Static assets
├── docs/
│   ├── DOCUMENTATION.md  # Full technical documentation
│   └── TODO.md           # Build roadmap
├── .env.example          # Template for local environment variables
├── package.json          # Dependency manifest
└── tsconfig.json         # TypeScript configuration
```

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

- **Node.js** v20 LTS
- **Docker + Docker Desktop** (Required to run local Supabase services)
- **Supabase CLI** (`npm install -g supabase` or via brew)
- **FFmpeg** (`brew install ffmpeg` on Mac, or `sudo apt install ffmpeg` on Linux)

---

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/Ekoro.git
cd Ekoro
```

---

### 2. Install dependencies

```bash
npm install
# or
pnpm install
```

---

### 3. Set up environment variables

```bash
# Copy the example file
cp .env.example .env.local
```

Then fill in the values. See [Environment Variables](#environment-variables) below.

---

### 4. Start local Supabase environment

Make sure Docker is running, then initialize and start Supabase:

```bash
supabase init
supabase start
```

This starts the local Supabase stack, including:
- PostgreSQL database (localhost:54322)
- Supabase Studio Dashboard (http://localhost:54323)
- GoTrue Auth server (localhost:54321)
- Storage API (localhost:54321)

---

### 5. Set up the database

Generate types and push schema to your local PostgreSQL:

```bash
# Generate Prisma Client & push schema
npx prisma db push

# Generate Supabase TypeScript types (optional)
supabase gen types typescript local > src/types/supabase.ts
```

---

### 6. Start the development server

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

---

## Environment Variables

Create `.env.local` with the following variables:

```env
# Next.js Site Settings
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase Local (or Cloud credentials)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Stripe (use test keys in development)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App Config
JWT_SECRET=your-internal-jwt-or-api-secret
```

---

## Scripts

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build of Next.js app
npm run start        # Start Next.js production server
npm run lint         # Run ESLint check
npm run typecheck    # TypeScript compilation check
npm run test         # Run testing suites (Vitest + Playwright)
```

---

## API & Serverless Overview

API Route Handlers are located in `src/app/api/`:

| Method | Route                   | Description                            |
| ------ | ----------------------- | -------------------------------------- |
| POST   | `/api/tracks`           | Upload track (accepts audio, transcodes) |
| GET    | `/api/tracks/[id]/dl`   | Get pre-signed download URL            |
| POST   | `/api/payments/sub`     | Create Stripe subscription             |
| POST   | `/api/payments/tip`     | Send tip to artist                     |
| POST   | `/api/payments/buy`     | Purchase paid-download track           |
| POST   | `/api/webhooks/stripe`  | Stripe webhooks endpoint               |

All other queries (fetching tracks, updating profiles, listing playlists) can be performed directly from Next.js Server Components, Server Actions, or Client Components using `@supabase/ssr` client SDKs.

---

## Testing

```bash
# Run unit & component tests
npm run test

# Run E2E tests (Playwright)
npm run test:e2e
```

Tests live in `src/**/__tests__/`.

---

## Deployment

### Next.js (Vercel)

1. Push your repository to GitHub.
2. Import the project on [Vercel](https://vercel.com).
3. Add the environment variables to Vercel project settings.
4. Deploy!

### Database & Services (Supabase Cloud)

1. Create a project in [Supabase Dashboard](https://supabase.com).
2. Connect your local Supabase CLI to the cloud project: `supabase login` and `supabase link`.
3. Apply migrations to the cloud DB: `supabase db push`.
4. Configure Storage buckets (`tracks`, `avatars`, `covers`) in the Supabase Cloud dashboard with appropriate access policies.
5. Enable Stripe webhook forwarding to your production URL.

---

## Roadmap

See [TODO.md](./docs/TODO.md) for the full phased build plan.

- **Phase 1** — Core MVP: Supabase Auth, Storage upload, HLS transcoding, Stream, Download
- **Phase 2** — Discovery: PostgreSQL Full-Text Search, playlists, artist profiles, follows
- **Phase 3** — Monetization: Stripe subscriptions, purchases, artist tipping
- **Phase 4** — Social: Supabase Realtime comments, likes, notifications, reposts
- **Phase 5** — Polish: Analytics dashboard, admin panel, accessibility, internationalization

---

## License

MIT — see [LICENSE](./LICENSE) for details.

---

## Acknowledgements

Built with ❤️ and good music. Inspired by Spotify, Bandcamp, SoundCloud, and Audiomack.

---

_Ekoro — Where music lives._
