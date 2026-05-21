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

- [ ] 🔴 Initialize single-repo Next.js project with TypeScript, Tailwind CSS, and App Router
- [ ] 🔴 Configure TypeScript `tsconfig.json` with strict mode
- [ ] 🔴 Set up ESLint + Prettier with shared configs
- [ ] 🟡 Set up Husky pre-commit hooks (lint + typecheck on staged files)
- [ ] 🟡 Configure VS Code workspace settings and recommended extensions
- [ ] 🟢 Add `.editorconfig` for consistent formatting across editors

### Version Control

- [ ] 🔴 Initialize Git repository
- [ ] 🔴 Set up `.gitignore` (node_modules, .env.local, .next, transcoded audio, etc.)
- [ ] 🟡 Define branching strategy: `main` (production), `dev` (staging), `feat/*`, `fix/*`
- [ ] 🟡 Set up branch protection rules on `main` (require PR + passing CI)
- [ ] 🟢 Create PR template with checklist

### Local Infrastructure (Supabase CLI)

- [ ] 🔴 Initialize and start Supabase local environment via CLI (`supabase init` & `supabase start` using Docker)
- [ ] 🔴 Write setup script: `scripts/setup.sh` (install deps, copy .env.example, start local Supabase, run migrations)
- [ ] 🟡 Configure local Supabase storage buckets (`tracks`, `covers`, `avatars`, `streams`)
- [ ] 🟡 Document local setup steps in README

### CI/CD Foundation

- [ ] 🔴 Create GitHub Actions workflow: lint + typecheck on all PRs
- [ ] 🟡 Create GitHub Actions workflow: run tests on all PRs
- [ ] 🟡 Set up Supabase Cloud project for hosting Database, Auth, and Storage
- [ ] 🟡 Set up Vercel project for Next.js application deployment
- [ ] 🟢 Set up staging environment (auto-deploy `dev` branch)

### Environment & Secrets

- [ ] 🔴 Create `.env.example` with all required variables documented (Next.js, Supabase, Stripe)
- [ ] 🔴 Configure Supabase Cloud project settings and keys
- [ ] 🔴 Configure Vercel environment variables for production
- [ ] 🟡 Configure Supabase Storage bucket access and CORS policies

---

## Phase 1 — Core MVP: Auth, Upload, Stream, Download

> Goal: A user can register, an artist can upload a track, and a listener can stream and download it.
> **Target timeline: 6–8 weeks**

### 1.1 Database & ORM Setup

- [ ] 🔴 Install and configure Prisma with Supabase PostgreSQL connection
- [ ] 🔴 Write initial schema migration: `users` (linked to `auth.users`), `tracks`, `albums`, `play_events`
- [ ] 🔴 Write Prisma seed script with sample users and tracks for development
- [ ] 🟡 Set up database connection pooling (using Supabase built-in PgBouncer/Supavisor)
- [ ] 🟡 Create SQL triggers to sync Supabase Auth metadata to `public.users` table

### 1.2 Backend — Next.js Foundation

- [ ] 🔴 Set up Next.js App Router API route structure (`src/app/api/...`) with TypeScript
- [ ] 🔴 Set up global error and exception handlers with consistent JSON error responses
- [ ] 🔴 Set up API route request validation helper using Zod
- [ ] 🔴 Set up API rate limiting (e.g. Next.js Edge middleware + Upstash or simple cache)
- [ ] 🟡 Set up structured logging for Next.js server actions and API routes
- [ ] 🟡 Set up `/api/health` endpoint
- [ ] 🟢 Set up standard Route Handler prefix `/api`

### 1.3 Authentication

- [ ] 🔴 Integrate Supabase Auth Client (`@supabase/ssr`) in Next.js
- [ ] 🔴 Implement sign-up flow calling `supabase.auth.signUp()` with validation
- [ ] 🔴 Implement login flow calling `supabase.auth.signInWithPassword()` with cookies sync
- [ ] 🔴 Implement sign-out flow calling `supabase.auth.signOut()`
- [ ] 🔴 Set up Next.js middleware for reading and syncing Supabase session cookies
- [ ] 🔴 Set up Role-based auth guards in Server Components & Server Actions (checking user role)
- [ ] 🟡 Implement password reset flow: request reset link and handle callback
- [ ] 🟡 Configure password reset routes on client and server
- [ ] 🟡 Handle email verification redirects via Supabase Auth configuration
- [ ] 🟢 Configure Google OAuth provider in Supabase Auth
- [ ] 🟢 Configure Apple OAuth provider in Supabase Auth

### 1.4 File Storage (Supabase Storage)

- [ ] 🔴 Configure Supabase Storage client in Next.js (`@supabase/supabase-js`)
- [ ] 🔴 Utility function: `uploadToStorage(bucket, key, file)` → uploads track assets
- [ ] 🔴 Utility function: Generate pre-signed URL via `supabase.storage.from().createSignedUrl()`
- [ ] 🔴 Utility function: `deleteFromStorage(bucket, key)`
- [ ] 🟡 Set up CDN caching headers for assets stored in public buckets
- [ ] 🟡 Configure CORS rules on Supabase Storage buckets

### 1.5 Audio Transcoding Pipeline

- [ ] 🔴 Install and verify FFmpeg availability in the execution environment
- [ ] 🔴 Set up dynamic audio processing runner (Serverless background execution or server task)
- [ ] 🔴 Write audio transcoder:
  - [ ] Download raw audio from private Supabase Storage bucket
  - [ ] Transcode to 128kbps MP3
  - [ ] Transcode to 320kbps MP3
  - [ ] Transcode to FLAC
  - [ ] Segment into HLS (`.m3u8` + `.ts` chunks)
  - [ ] Upload transcoded files to public `streams` storage bucket
  - [ ] Update track record in DB: `status → published`, populate `audio_files` JSON
- [ ] 🔴 Handle transcoding failures: catch errors, set track status to `failed`, cleanup files
- [ ] 🟡 Resize cover art to 500x500 and 1500x1500 (Sharp.js)
- [ ] 🟡 Extract audio metadata automatically (duration, BPM via music-metadata)
- [ ] 🟡 Notify artist via email / Supabase Realtime when track processing completes/fails
- [ ] 🟢 Progress updates via Supabase Realtime while track is processing

### 1.6 Track API

- [ ] 🔴 `POST /api/tracks` — multipart upload (audio + cover art + metadata), artist only
  - [ ] File type validation (accept mp3, wav, flac, aac only)
  - [ ] File size validation (max 200MB)
  - [ ] Upload raw file to Supabase Storage private bucket
  - [ ] Create track record in database (status: processing)
  - [ ] Trigger audio transcoding process
- [ ] 🔴 Query published tracks — paginated list of published tracks with filters (genre, mood, sort)
- [ ] 🔴 Query track details — single track details from database
- [ ] 🔴 `PATCH /api/tracks/:id` or Server Action — update track metadata (artist only, own tracks)
- [ ] 🔴 `DELETE /api/tracks/:id` or Server Action — soft delete (artist or admin)
- [ ] 🔴 HLS playlist URL retrieval with quality tier validation (using Supabase Storage signed paths)
- [ ] 🔴 `GET /api/tracks/:id/dl` — validate permissions, return signed download URL from Supabase Storage
- [ ] 🔴 `POST /api/tracks/:id/play` or Server Action — record play event (called after 30s of playback)
- [ ] 🟡 Database trending query — top tracks by trending score (with cache headers or pg cache)
- [ ] 🟡 Database new-releases query — newest published tracks
- [ ] 🟢 Database related-tracks query — related tracks by genre/artist

### 1.7 User API

- [ ] 🔴 Fetch current user's full profile from public.users table
- [ ] 🔴 Server Action: Update profile display name, bio, avatar URL
- [ ] 🔴 Query public artist/user profile by username
- [ ] 🟡 Fetch user library (liked tracks, playlists, downloads)
- [ ] 🟡 Avatar image upload to Supabase Storage with Sharp.js resize

### 1.8 Frontend — App Foundation

- [ ] 🔴 Scaffold Next.js app with TypeScript and Tailwind CSS
- [ ] 🔴 Set up Tailwind CSS with custom color tokens (Green, Gold, Royal Blue)
- [ ] 🔴 Configure Supabase JS Client options and auto-attaching auth token to headers
- [ ] 🔴 Set up TanStack Query provider with sensible default stale time
- [ ] 🔴 Set up Zustand stores: `playerStore`, `authStore`
- [ ] 🟡 Set up Next.js middleware for protected routes (redirect to login if no token)
- [ ] 🟡 Set up Sentry for frontend error tracking

### 1.9 Frontend — Auth Pages

- [ ] 🔴 `/register` page — form with validation (React Hook Form + Zod)
- [ ] 🔴 `/login` page — form with validation
- [ ] 🟡 `/forgot-password` page
- [ ] 🟡 `/reset-password` page
- [ ] 🟢 OAuth buttons (Google, Apple) on login/register pages

### 1.10 Frontend — Core Layout

- [ ] 🔴 Persistent sidebar navigation component
- [ ] 🔴 Persistent bottom player bar (powered by Zustand `playerStore`)
- [ ] 🔴 Integrate Howler.js or hls.js for HLS audio playback
- [ ] 🔴 Player: play/pause, skip, seek, volume control
- [ ] 🔴 Player: show current track title, artist, cover art
- [ ] 🔴 Responsive layout (sidebar collapses to bottom nav on mobile)
- [ ] 🟡 Mini player on mobile (expandable)
- [ ] 🟡 Page transitions

### 1.11 Frontend — Home Page

- [ ] 🔴 Hero banner with personalized greeting
- [ ] 🔴 Trending tracks list component (track row with play, like, download)
- [ ] 🔴 Featured artists grid
- [ ] 🔴 Genre/mood filter tabs
- [ ] 🟡 New releases section
- [ ] 🟡 Skeleton loading states for all sections

### 1.12 Frontend — Track Detail Page (`/track/[slug]`)

- [ ] 🔴 Track header: cover art, title, artist, play/download buttons
- [ ] 🟡 Track waveform visualizer (static or animated)
- [ ] 🟡 Related tracks list
- [ ] 🟢 Track comments section (Phase 4)

### 1.13 Frontend — Upload Flow (`/dashboard/upload`)

- [ ] 🔴 Drag-and-drop audio file upload with progress bar
- [ ] 🔴 Cover art upload with preview
- [ ] 🔴 Metadata form: title, genre, mood, BPM, release date
- [ ] 🔴 Download settings: free / paid / premium-only, price input
- [ ] 🔴 Processing status screen ("Your track is being processed…")
- [ ] 🟡 Track list in artist dashboard showing all uploads and their status

---

## Phase 2 — Discovery: Search, Playlists, Artist Profiles

> Goal: Users can find music they love. Artists have proper profile pages. Social graph exists.
> **Target timeline: 4–5 weeks after Phase 1**

### 2.1 Search

- [ ] 🔴 Configure PostgreSQL Full-Text Search (TSVector) for tracks, artists, and playlists in database
- [ ] 🔴 Set up pg_trgm extension on Supabase PostgreSQL for fuzzy matching
- [ ] 🔴 Write search query in Next.js Server Actions using Prisma or Supabase clients
- [ ] 🔴 `GET /api/search?q=&type=&genre=` endpoint (optional, or Server Action search query)
- [ ] 🔴 Frontend: search bar with autocomplete suggestions
- [ ] 🔴 Frontend: search results page with tabs (Tracks, Artists, Playlists)
- [ ] 🟡 Add database indexes on search fields for performance
- [ ] 🟡 Genre/mood browse page with grid of tracks
- [ ] 🟢 Typo-tolerance matching via pg_trgm similarity thresholds

### 2.2 Playlists

- [ ] 🔴 Create playlist table with Supabase Row Level Security (RLS) policies
- [ ] 🔴 Fetch playlist details and track lists from database
- [ ] 🔴 Server Action / SDK call to update name, description, cover art (with upload to Storage)
- [ ] 🔴 Server Action / SDK call to delete playlist
- [ ] 🔴 Server Action / SDK call to add track to playlist
- [ ] 🔴 Server Action / SDK call to remove track from playlist
- [ ] 🔴 Server Action / SDK call to reorder tracks in playlist
- [ ] 🔴 Frontend: playlist creation modal
- [ ] 🔴 Frontend: playlist detail page
- [ ] 🔴 Frontend: "Add to playlist" dropdown on track actions menu
- [ ] 🟡 Frontend: playlist cover art auto-generated from first 4 track covers (collage)
- [ ] 🟢 Follow a public playlist (creates link record in database)

### 2.3 Artist Profiles

- [ ] 🔴 Query full artist data by username: bio, follower count, track count
- [ ] 🔴 Query paginated artist discography (published tracks only)
- [ ] 🔴 Query artist albums list from database
- [ ] 🔴 Frontend: `/artist/[username]` page
  - [ ] Artist header: avatar, display name, bio, follower count, verified badge
  - [ ] Tabs: Tracks, Albums, Playlists
  - [ ] Follow/Unfollow button
- [ ] 🟡 Query artist's most-played tracks (popular tracks section)

### 2.4 Social Graph (Follows)

- [ ] 🔴 Follow user action (inserts into public.follows table with RLS)
- [ ] 🔴 Unfollow user action (deletes from public.follows table with RLS)
- [ ] 🔴 Query paginated list of user followers
- [ ] 🔴 Query paginated list of users followed by a user
- [ ] 🟡 Query user social feed (tracks published by followed artists, sorted by recency)
- [ ] 🟢 Suggested artists section on home page

### 2.5 Likes

- [ ] 🔴 Like track action (inserts into public.likes table with RLS)
- [ ] 🔴 Unlike track action (deletes from public.likes table with RLS)
- [ ] 🔴 Query user liked tracks list from database
- [ ] 🔴 Frontend: like button on track row and track detail page
- [ ] 🟡 Display liked count on tracks (aggregating likes count)

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
| Phase 0 — Setup        | 19      | 0     | 0%       |
| Phase 1 — MVP          | 67      | 0     | 0%       |
| Phase 2 — Discovery    | 41      | 0     | 0%       |
| Phase 3 — Monetization | 32      | 0     | 0%       |
| Phase 4 — Social       | 22      | 0     | 0%       |
| Phase 5 — Polish       | 48      | 0     | 0%       |
| **Total**              | **229** | **0** | **0%**   |

---

_Update this file as items are completed. Track progress in the completion table above._
_Last updated: May 2026_
