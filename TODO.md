# Ekoro — Build Roadmap & TODO

> A phased plan from zero to production-ready music platform.
> Each phase builds on the last. Phases 1–2 are the MVP. Phases 3–5 take it to production quality.

**Legend:**

- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete
- `🔴` Blocker / critical path
- `🟡` Important but not blocking
- `🟢` Nice to have / polish

---

## Phase 0 — Project Setup & Infrastructure

> Goal: Development environment fully working. All services running locally. Team can commit and deploy.

### Project & Tooling

- [x] 🔴 Initialize single-repo Next.js project with TypeScript, Tailwind CSS, and App Router
- [x] 🔴 Configure TypeScript `tsconfig.json` with strict mode
- [x] 🔴 Set up ESLint + Prettier with shared configs
- [ ] 🟡 Set up Husky pre-commit hooks (lint + typecheck on staged files)
- [x] 🟡 Configure VS Code workspace settings and recommended extensions
- [x] 🟢 Add `.editorconfig` for consistent formatting across editors

### Version Control

- [x] 🔴 Initialize Git repository
- [x] 🔴 Set up `.gitignore` (node_modules, .env.local, .next, transcoded audio, etc.)
- [x] 🟡 Define branching strategy: `main` (production), `dev` (staging), `feat/*`, `fix/*`
- [x] 🟡 Set up branch protection rules on `main` (require PR + passing CI)
- [x] 🟢 Create PR template with checklist

### Local Infrastructure (Supabase CLI)

- [x] 🔴 Initialize and start Supabase local environment via CLI (`supabase init` & `supabase start` using Docker)
- [x] 🔴 Write setup script: `scripts/setup.sh` (install deps, copy .env.example, start local Supabase, run migrations)
- [x] 🟡 Configure local Supabase storage buckets (`tracks`, `covers`, `avatars`, `streams`)
- [x] 🟡 Document local setup steps in README

### CI/CD Foundation

- [x] 🔴 Create GitHub Actions workflow: lint + typecheck on all PRs
- [x] 🟡 Create GitHub Actions workflow: run tests on all PRs
- [x] 🟡 Set up Supabase Cloud project for hosting Database, Auth, and Storage
- [x] 🟡 Set up Vercel project for Next.js application deployment
- [x] 🟢 Set up staging environment (auto-deploy `dev` branch)

### Environment & Secrets

- [x] 🔴 Create `.env.example` with all required variables documented (Next.js, Supabase, Stripe)
- [x] 🔴 Configure Supabase Cloud project settings and keys
- [x] 🔴 Configure Vercel environment variables for production
- [x] 🟡 Configure Supabase Storage bucket access and CORS policies

---

## Phase 1 — Core MVP: Auth, Upload, Stream, Download

> Goal: A user can register, an artist can upload a track, and a listener can stream and download it.
> **Target timeline: 6–8 weeks**

### 1.1 Database & ORM Setup

- [x] 🔴 Install and configure Prisma with Supabase PostgreSQL connection
- [x] 🔴 Write initial schema migration: `users` (linked to `auth.users`), `tracks`, `albums`, `play_events`
- [x] 🔴 Write Prisma seed script with sample users and tracks for development
- [x] 🟡 Set up database connection pooling (using Supabase built-in PgBouncer/Supavisor)
- [x] 🟡 Create SQL triggers to sync Supabase Auth metadata to `public.users` table

### 1.2 Backend — Next.js Foundation

- [x] 🔴 Set up Next.js App Router API route structure (`src/app/api/...`) with TypeScript
- [x] 🔴 Set up global error and exception handlers with consistent JSON error responses
- [x] 🔴 Set up API route request validation helper using Zod
- [x] 🔴 Set up API rate limiting (e.g. Next.js Edge middleware + Upstash or simple cache)
- [x] 🟡 Set up structured logging for Next.js server actions and API routes
- [x] 🟡 Set up `/api/health` endpoint
- [x] 🟢 Set up standard Route Handler prefix `/api`

### 1.3 Authentication

- [x] 🔴 Integrate Supabase Auth Client (`@supabase/ssr`) in Next.js
- [x] 🔴 Implement sign-up flow calling `supabase.auth.signUp()` with validation
- [x] 🔴 Implement login flow calling `supabase.auth.signInWithPassword()` with cookies sync
- [x] 🔴 Implement sign-out flow calling `supabase.auth.signOut()`
- [x] 🔴 Set up Next.js middleware for reading and syncing Supabase session cookies
- [x] 🔴 Set up Role-based auth guards in Server Components & Server Actions (checking user role)
- [x] 🟡 Implement password reset flow: request reset link and handle callback
- [x] 🟡 Configure password reset routes on client and server
- [x] 🟡 Handle email verification redirects via Supabase Auth configuration
- [x] 🟢 Configure Google OAuth provider in Supabase Auth
- [x] 🟢 Configure Apple OAuth provider in Supabase Auth

### 1.4 File Storage (Supabase Storage)

- [x] 🔴 Configure Supabase Storage client in Next.js (`@supabase/supabase-js`)
- [x] 🔴 Utility function: `uploadToStorage(bucket, key, file)` → uploads track assets
- [x] 🔴 Utility function: Generate pre-signed URL via `supabase.storage.from().createSignedUrl()`
- [x] 🔴 Utility function: `deleteFromStorage(bucket, key)`
- [x] 🟡 Set up CDN caching headers for assets stored in public buckets
- [x] 🟡 Configure CORS rules on Supabase Storage buckets

### 1.5 Audio Transcoding Pipeline

- [x] 🔴 Install and verify FFmpeg availability in the execution environment
- [x] 🔴 Set up dynamic audio processing runner (Serverless background execution or server task)
- [x] 🔴 Write audio transcoder:
  - [x] Download raw audio from private Supabase Storage bucket
  - [x] Transcode to 128kbps MP3
  - [x] Transcode to 320kbps MP3
  - [x] Transcode to FLAC
  - [x] Segment into HLS (`.m3u8` + `.ts` chunks)
  - [x] Upload transcoded files to public `streams` storage bucket
  - [x] Update track record in DB: `status → published`, populate `audio_files` JSON
- [x] 🔴 Handle transcoding failures: catch errors, set track status to `failed`, cleanup files
- [x] 🟡 Resize cover art to 500x500 and 1500x1500 (Sharp.js)
- [x] 🟡 Extract audio metadata automatically (duration, BPM via music-metadata)
- [x] 🟡 Notify artist via email / Supabase Realtime when track processing completes/fails
- [x] 🟢 Progress updates via Supabase Realtime while track is processing

### 1.6 Track API

- [x] 🔴 `POST /api/tracks` — multipart upload (audio + cover art + metadata), artist only
  - [x] File type validation (accept mp3, wav, flac, aac only)
  - [x] File size validation (max 200MB)
  - [x] Upload raw file to Supabase Storage private bucket
  - [x] Create track record in database (status: processing)
  - [x] Trigger audio transcoding process
- [x] 🔴 Query published tracks — paginated list of published tracks with filters (genre, mood, sort)
- [x] 🔴 Query track details — single track details from database
- [x] 🔴 `PATCH /api/tracks/:id` or Server Action — update track metadata (artist only, own tracks)
- [x] 🔴 `DELETE /api/tracks/:id` or Server Action — soft delete (artist or admin)
- [x] 🔴 HLS playlist URL retrieval with quality tier validation (using Supabase Storage signed paths)
- [x] 🔴 `GET /api/tracks/:id/dl` — validate permissions, return signed download URL from Supabase Storage
- [x] 🔴 `POST /api/tracks/:id/play` or Server Action — record play event (called after 30s of playback)
- [x] 🟡 Database trending query — top tracks by trending score (with cache headers or pg cache)
- [x] 🟡 Database new-releases query — newest published tracks
- [x] 🟢 Database related-tracks query — related tracks by genre/artist

### 1.7 User API

- [x] 🔴 Fetch current user's full profile from public.users table
- [x] 🔴 Server Action: Update profile display name, bio, avatar URL
- [x] 🔴 Query public artist/user profile by username
- [x] 🟡 Fetch user library (liked tracks, playlists, downloads)
- [x] 🟡 Avatar image upload to Supabase Storage with Sharp.js resize

### 1.8 Frontend — App Foundation

- [x] 🔴 Scaffold Next.js app with TypeScript and Tailwind CSS
- [x] 🔴 Set up Tailwind CSS with custom color tokens
- [x] 🔴 Configure Supabase JS Client options and auto-attaching auth token to headers
- [x] 🔴 Set up TanStack Query provider with sensible default stale time
- [x] 🔴 Set up Zustand stores: `playerStore`, `authStore`
- [x] 🟡 Set up Next.js middleware for protected routes (redirect to login if no token)

### 1.9 Frontend — Auth Pages

- [x] 🔴 `/register` page — form with validation (React Hook Form + Zod)
- [x] 🔴 `/login` page — form with validation
- [x] 🟡 `/forgot-password` page
- [x] 🟡 `/reset-password` page
- [x] 🟢 OAuth buttons (Google, Apple) on login/register pages

### 1.10 Frontend — Core Layout

- [x] 🔴 Persistent sidebar navigation component
- [x] 🔴 Persistent bottom player bar (powered by Zustand `playerStore`)
- [x] 🔴 Integrate Howler.js or hls.js for HLS audio playback
- [x] 🔴 Player: play/pause, skip, seek, volume control
- [x] 🔴 Player: show current track title, artist, cover art
- [x] 🔴 Responsive layout (sidebar collapses to bottom nav on mobile)
- [x] 🟡 Mini player on mobile (expandable)
- [x] 🟡 Page transitions

### 1.11 Frontend — Home Page

- [x] 🔴 Hero banner with personalized greeting
- [x] 🔴 Trending tracks list component (track row with play, like, download)
- [x] 🔴 Featured artists grid
- [x] 🔴 Genre/mood filter tabs
- [x] 🟡 New releases section
- [x] 🟡 Skeleton loading states for all sections

### 1.12 Frontend — Track Detail Page (`/track/[slug]`)

- [x] 🔴 Track header: cover art, title, artist, play/download buttons
- [x] 🟡 Track waveform visualizer (static or animated)
- [x] 🟡 Related tracks list
- [x] 🟢 Track comments section (Phase 4)

### 1.13 Frontend — Upload Flow (`/dashboard/upload`)

- [x] 🔴 Drag-and-drop audio file upload with progress bar
- [x] 🔴 Cover art upload with preview
- [x] 🔴 Metadata form: title, genre, mood, BPM, release date
- [x] 🔴 Download settings: free / paid / premium-only, price input
- [x] 🔴 Processing status screen ("Your track is being processed…")
- [x] 🟡 Track list in artist dashboard showing all uploads and their status

---

## Phase 2 — Discovery: Search, Playlists, Artist Profiles

> Goal: Users can find music they love. Artists have proper profile pages. Social graph exists.
> **Target timeline: 4–5 weeks after Phase 1**

### 2.1 Search

- [x] 🔴 Configure PostgreSQL Full-Text Search (TSVector) for tracks, artists, and playlists in database
- [x] 🔴 Set up pg_trgm extension on Supabase PostgreSQL for fuzzy matching
- [x] 🔴 Write search query in Next.js Server Actions using Prisma or Supabase clients
- [x] 🔴 `GET /api/search?q=&type=&genre=` endpoint (optional, or Server Action search query)
- [x] 🔴 Frontend: search bar with autocomplete suggestions
- [x] 🔴 Frontend: search results page with tabs (Tracks, Artists, Playlists)
- [x] 🟡 Add database indexes on search fields for performance
- [x] 🟡 Genre/mood browse page with grid of tracks
- [x] 🟢 Typo-tolerance matching via pg_trgm similarity thresholds

### 2.2 Playlists

- [x] 🔴 Create playlist table with Supabase Row Level Security (RLS) policies
- [x] 🔴 Fetch playlist details and track lists from database
- [x] 🔴 Server Action / SDK call to update name, description, cover art (with upload to Storage)
- [x] 🔴 Server Action / SDK call to delete playlist
- [x] 🔴 Server Action / SDK call to add track to playlist
- [x] 🔴 Server Action / SDK call to remove track from playlist
- [x] 🔴 Server Action / SDK call to reorder tracks in playlist
- [x] 🔴 Frontend: playlist creation modal
- [x] 🔴 Frontend: playlist detail page
- [x] 🔴 Frontend: "Add to playlist" dropdown on track actions menu
- [x] 🟡 Frontend: playlist cover art auto-generated from first 4 track covers (collage)
- [x] 🟢 Follow a public playlist (creates link record in database)

### 2.3 Artist Profiles

- [x] 🔴 Query full artist data by username: bio, follower count, track count
- [x] 🔴 Query paginated artist discography (published tracks only)
- [x] 🔴 Query artist albums list from database
- [x] 🔴 Frontend: `/artist/[username]` page
  - [x] Artist header: avatar, display name, bio, follower count, verified badge
  - [x] Tabs: Tracks, Albums, Playlists
  - [x] Follow/Unfollow button
- [x] 🟡 Query artist's most-played tracks (popular tracks section)

### 2.4 Social Graph (Follows)

- [x] 🔴 Follow user action (inserts into public.follows table with RLS)
- [x] 🔴 Unfollow user action (deletes from public.follows table with RLS)
- [x] 🔴 Query paginated list of user followers
- [x] 🔴 Query paginated list of users followed by a user
- [x] 🟡 Query user social feed (tracks published by followed artists, sorted by recency)
- [x] 🟢 Suggested artists section on home page

### 2.5 Likes

- [x] 🔴 Like track action (inserts into public.likes table with RLS)
- [x] 🔴 Unlike track action (deletes from public.likes table with RLS)
- [x] 🔴 Query user liked tracks list from database
- [x] 🔴 Frontend: like button on track row and track detail page
- [x] 🟡 Display liked count on tracks (aggregating likes count)

### 2.6 Albums

- [ ] 🟡 Server Action / API route to create album (artist only)
- [ ] 🟡 Query album metadata and album track list from database
- [ ] 🟡 Server Action / API route to update album metadata (artist only)
- [ ] 🟡 Server Action / API route to add track to album (artist only)
- [ ] 🟡 Frontend: album detail page
- [ ] 🟢 Play full album button (loads all tracks into player queue)

### 2.7 Explore & Browse Pages

- [ ] 🔴 Frontend: `/explore` page with genre/mood grid
- [ ] 🔴 Frontend: `/trending` page with top 50 chart
- [ ] 🟡 Frontend: `/new-releases` page
- [ ] 🟢 Frontend: genre detail page (e.g. `/genre/afrobeats`)

---

## Phase 3 — Monetization: Subscriptions, Purchases, Tips

> Goal: Ekoro makes money. Artists make money. Stripe is fully integrated.
> **Target timeline: 3–4 weeks after Phase 2**

### 3.1 Stripe Setup

- [ ] 🔴 Create Stripe account and configure products/prices for Pro and Artist Pro plans
- [ ] 🔴 Set up Stripe Connect for artist payouts (marketplace model)
- [ ] 🔴 Configure Stripe webhooks endpoint: `POST /api/webhooks/stripe`
- [ ] 🔴 Handle webhook events inside route handler:
  - [ ] `invoice.paid` → activate/renew subscription (updates public.users plan status)
  - [ ] `customer.subscription.deleted` → downgrade user to free
  - [ ] `payment_intent.succeeded` → fulfill purchase or tip
  - [ ] `account.updated` (Stripe Connect) → update artist payout status

### 3.2 Subscription API

- [ ] 🔴 `POST /api/payments/subscribe` — create Stripe subscription, return checkout URL
- [ ] 🔴 Query user subscription status from database
- [ ] 🔴 `DELETE /api/payments/subscribe` or Server Action — cancel subscription (at period end)
- [ ] 🔴 `POST /api/payments/portal` — Stripe billing portal redirect URL (manage card, invoices)
- [ ] 🔴 Enforce plan limits in download and streaming routes/actions (using Supabase role metadata)

### 3.3 Track Purchases

- [ ] 🔴 `POST /api/payments/purchase` — buy a paid-download track (Stripe Payment Intent)
- [ ] 🔴 Query user purchased tracks list from database
- [ ] 🔴 Download endpoint checks `purchases` table for paid tracks before generating signed URLs
- [ ] 🟡 Email receipt after successful purchase (integrate Postmark/SendGrid)

### 3.4 Artist Tips

- [ ] 🔴 `POST /api/payments/tip` — send tip to artist
- [ ] 🔴 Stripe Connect transfer: 95% to artist, 5% platform fee
- [ ] 🔴 Query user tip history (tips sent)
- [ ] 🔴 Query artist's received tips history
- [ ] 🟡 Frontend: tip modal on track detail and artist profile pages

### 3.5 Frontend — Pricing & Upgrade

- [ ] 🔴 `/pricing` page with plan comparison table
- [ ] 🔴 "Go Premium" CTA in player bar and sidebar
- [ ] 🔴 Checkout flow (Stripe-hosted or embedded)
- [ ] 🔴 Post-payment success page
- [ ] 🟡 `/billing` page: current plan, next renewal date, cancel button, Stripe portal link
- [ ] 🟡 Upgrade prompt when free user tries to download a premium track
- [ ] 🟢 "Support this artist" tip button with preset amounts ($2, $5, $10, custom)

### 3.6 Artist Payouts

- [ ] 🟡 Artist Stripe Connect onboarding flow in dashboard
- [ ] 🟡 Query artist earnings breakdown (streams, downloads, tips) from database
- [ ] 🟡 Frontend: earnings summary card in artist dashboard
- [ ] 🟢 Monthly earnings statement (PDF via email)

---

## Phase 4 — Social Layer: Comments, Notifications, Reposts

> Goal: Platform feels alive. Users interact with content and each other.
> **Target timeline: 3 weeks after Phase 3**

### 4.1 Comments

- [ ] 🔴 `POST /api/tracks/:id/comments` or Server Action — post a comment (optionally at a timestamp)
- [ ] 🔴 Query paginated comment list for a track from database
- [ ] 🔴 Server Action / SDK call to delete comment (owner or admin)
- [ ] 🟡 Timed comments (show at specific point during playback, like SoundCloud)
- [ ] 🟡 Comment likes (with RLS policies)
- [ ] 🟢 Nested replies on comments

### 4.2 Notifications

- [ ] 🔴 Create notifications DB table: user_id, type, actor_id, entity_id, entity_type, read, created_at
- [ ] 🔴 Database triggers or Server Actions to create notifications on follows, likes, comments, tips, or processing status updates
- [ ] 🔴 Query paginated user notifications
- [ ] 🔴 Server Action / SDK call to mark all notifications as read
- [ ] 🔴 Frontend: notification bell with unread count badge
- [ ] 🟡 Real-time notifications integration via Supabase Realtime channel subscription
- [ ] 🟡 Email digest for notifications (daily or weekly, opt-in)
- [ ] 🟢 Push notifications for PWA

### 4.3 Reposts / Shares

- [ ] 🟡 Server Action / SDK call to repost a track (inserts link record in database)
- [ ] 🟡 Server Action / SDK call to undo repost
- [ ] 🟡 Query follower feeds to include reposted tracks
- [ ] 🟡 Frontend: repost button on track actions menu
- [ ] 🟢 Share to social media (Twitter/X, WhatsApp) with OG meta tags

### 4.4 OG Meta Tags (Social Sharing)

- [ ] 🔴 Track pages: `og:title`, `og:image` (cover art), `og:description`, `og:audio`
- [ ] 🔴 Artist pages: `og:title`, `og:image` (avatar), `og:description`
- [ ] 🟡 Twitter Card meta tags for rich previews

---

## Phase 5 — Polish, Analytics & Scale

> Goal: Production-ready. Performant. Artist tools are complete. Platform is trustworthy.
> **Target timeline: Ongoing / 4–6 weeks after Phase 4**

### 5.1 Artist Analytics Dashboard

- [ ] 🔴 Query plays and downloads over time (7d, 30d, 90d, all time) from database
- [ ] 🔴 Query follower growth metrics over time
- [ ] 🔴 Query earnings breakdown by type from payment tables
- [ ] 🔴 Frontend: `/dashboard/analytics` page with charts (Recharts or Chart.js)
  - [ ] Total plays chart (line)
  - [ ] Top tracks table (by plays)
  - [ ] Downloads by track (bar)
  - [ ] Follower growth chart
  - [ ] Earnings summary cards
- [ ] 🟡 Country/region breakdown of listeners
- [ ] 🟢 Analytics export as CSV

### 5.2 Admin Panel

- [ ] 🔴 `/admin` route group, admin-only access
- [ ] 🔴 User management: list, search, ban/unban users
- [ ] 🔴 Track management: list all tracks, force-remove content
- [ ] 🔴 DMCA takedown workflow: receive report, review, act
- [ ] 🟡 Platform stats: total users, tracks, plays, revenue
- [ ] 🟡 Featured track curation (override trending with editor picks)
- [ ] 🟢 Content report queue (user-flagged tracks)

### 5.3 Copyright & Content Safety

- [ ] 🟡 Integrate AudD API for audio fingerprinting on upload
- [ ] 🟡 Block upload if fingerprint matches a copyrighted track
- [ ] 🟡 DMCA takedown email handler → auto-unlists track, notifies artist
- [ ] 🟡 Terms of service agreement checkbox on upload form
- [ ] 🟢 Artist identity verification (optional)

### 5.4 Performance Optimizations

- [ ] 🔴 Implement caching (cache-control headers, Next.js page revalidation) for: trending list, artist profiles, track metadata
- [ ] 🔴 Add database indexes on key foreign keys and filter columns to speed up querying
- [ ] 🔴 Optimize N+1 queries in track querying functions (Prisma `include` / database joins tuning)
- [ ] 🟡 Lazy-load images with `next/image` and blur placeholders
- [ ] 🟡 Infinite scroll on track lists (replace pagination)
- [ ] 🟡 Prefetch HLS playlist for next track in queue (reduces gap between tracks)
- [ ] 🟢 Lighthouse score target: 90+ on all pages

### 5.5 Progressive Web App (PWA)

- [ ] 🟡 Add `manifest.json` with app icons and theme color
- [ ] 🟡 Service worker for offline page caching
- [ ] 🟡 Cache recently played tracks for offline playback
- [ ] 🟢 "Install app" banner on mobile

### 5.6 Mobile App (v2 — React Native)

- [ ] 🟢 Set up React Native + Expo project
- [ ] 🟢 Share authentication with web (using Supabase Auth Client SDK)
- [ ] 🟢 Native audio player with background playback
- [ ] 🟢 Offline downloads to device storage
- [ ] 🟢 iOS App Store submission
- [ ] 🟢 Google Play Store submission

### 5.7 Accessibility (a11y)

- [ ] 🟡 Audit all pages with axe DevTools
- [ ] 🟡 Full keyboard navigation support
- [ ] 🟡 ARIA labels on all icon-only buttons
- [ ] 🟡 Screen reader-friendly player controls
- [ ] 🟢 High contrast mode support

### 5.8 Internationalization (i18n)

- [ ] 🟢 Set up `next-intl`
- [ ] 🟢 English (default), French, Portuguese (initial languages)
- [ ] 🟢 Currency localization for pricing (USD, EUR, GBP, NGN)

### 5.9 Monitoring & Observability

- [ ] 🔴 Set up Sentry for Next.js server-side error tracking
- [ ] 🔴 Set up Sentry for frontend error tracking
- [ ] 🟡 Set up Uptime monitoring (Better Uptime or similar)
- [ ] 🟡 Database slow query logging (configured in Supabase console)
- [ ] 🟡 Transcoding process monitoring
- [ ] 🟢 Structured logs for Server Actions and Route Handlers
- [ ] 🟢 Alerting on: high error rates, transcoding backlog, DB slow queries

### 5.10 Security Hardening

- [ ] 🔴 Full security headers audit (Content-Security-Policy, HSTS, etc. configured in Next.js config)
- [ ] 🔴 Security audit of Supabase Row Level Security (RLS) policies
- [ ] 🟡 Automated dependency vulnerability scanning (Dependabot)
- [ ] 🟡 OWASP Top 10 checklist review
- [ ] 🟢 Bug bounty program (responsible disclosure policy)

---

## Backlog — Future Ideas

> Not planned for any specific phase. Revisit after Phase 5.

- [ ] Live streaming / artist events (WebRTC or HLS live)
- [ ] Collaborative playlists (multiple users can add tracks)
- [ ] Artist merch store integration (Printful or similar)
- [ ] Podcast support (separate feed type)
- [ ] AI-powered track recommendations (collaborative filtering)
- [ ] Embeddable player widget (for external websites)
- [ ] Spotify/Apple Music import (transfer your library)
- [ ] B2B licensing marketplace (music for content creators)
- [ ] Lyrics display (Musixmatch API)
- [ ] DJ mix sets support (single file, cue points)

---

## Completion Tracker

| Phase                  | Items   | Done  | Progress |
| ---------------------- | ------- | ----- | -------- |
| Phase 0 — Setup        | 24      | 17    | 71%      |
| Phase 1 — MVP          | 67      | 13    | 19%      |
| Phase 2 — Discovery    | 41      | 0     | 0%       |
| Phase 3 — Monetization | 32      | 0     | 0%       |
| Phase 4 — Social       | 22      | 0     | 0%       |
| Phase 5 — Polish       | 48      | 0     | 0%       |
| **Total**              | **234** | **30**| **13%**  |

---

_Update this file as items are completed. Track progress in the completion table above._
_Last updated: May 2026_
