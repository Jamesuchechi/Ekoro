# Ekoro — Technical Documentation

> Version 1.0.0 | Last Updated: May 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Database Schema & Row Level Security](#4-database-schema--row-level-security)
5. [API & Data Querying Reference](#5-api--data-querying-reference)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [File Storage & Audio Pipeline](#7-file-storage--audio-pipeline)
8. [Streaming Architecture](#8-streaming-architecture)
9. [Download System](#9-download-system)
10. [Search & Discovery](#10-search--discovery)
11. [Payment & Monetization](#11-payment--monetization)
12. [Frontend & Backend Directory Structure](#12-frontend--backend-directory-structure)
13. [Security Considerations](#13-security-considerations)
14. [Performance & Scalability](#14-performance--scalability)
15. [Environment Variables](#15-environment-variables)
16. [Error Handling](#16-error-handling)
17. [Testing Strategy](#17-testing-strategy)
18. [Deployment](#18-deployment)

---

## 1. Project Overview

Ekoro is a full-stack music streaming and downloading platform that supports three primary user roles: **Listeners**, **Artists**, and **Administrators**. The platform enables users to stream and download music, artists to upload and manage their catalogues, and administrators to moderate content and manage the platform.

### Core Capabilities

- **Streaming** — Adaptive bitrate audio streaming via HLS (HTTP Live Streaming)
- **Downloading** — Gated and free track downloads in multiple quality tiers
- **Uploading** — Artist-facing upload system with metadata management
- **Discovery** — Genre browsing, trending rankings, search, and recommendations
- **Monetization** — Subscription tiers, direct artist tipping, and pay-per-download tracks
- **Social** — Artist following, playlist creation, comments, likes, and reposts

### Design Philosophy

Ekoro is built as a **unified Next.js application** powered by **Supabase**. Client components communicate directly with Supabase for data queries, realtime updates, and authentication, while server-side business logic (like audio transcoding and payment processing) is handled by Next.js Server Actions and Route Handlers.

---

## 2. System Architecture

```
┌────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                      │
│   Next.js App Router (React Components + Zustand)      │
└──────────────┬─────────────────────────────────────────┘
               │ HTTPS / WSS / Realtime
┌──────────────▼─────────────────────────────────────────┐
│                      API LAYER                         │
│   Next.js Route Handlers & Server Actions (Vercel)     │
└──────────────┬─────────────────────────────────────────┘
               │ Supabase SDK & REST API
┌──────────────▼─────────────────────────────────────────┐
│               SUPABASE MANAGED SERVICES                │
│                                                        │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │  Supabase Auth   │      │ Supabase Storage │        │
│  │  (GoTrue Client) │      │ (Audio / Covers) │        │
│  └──────────────────┘      └──────────────────┘        │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │  PostgreSQL 16   │      │Supabase Realtime │        │
│  │ (Tables & Search)│      │(Comments/Likes)  │        │
│  └──────────────────┘      └──────────────────┘        │
└──────────────────────┬─────────────────────────────────┘
                       │ Stripe SDK
               ┌───────▼───────┐
               │  Stripe APIs  │
               └───────────────┘
```

### Core Architecture Responsibilities

- **Next.js Frontend & API Routes**: Serve page content, manage local audio states, run Server Actions for checkout flows, execute FFmpeg transcoding scripts in background serverless/edge environments.
- **Supabase Auth**: Handle sign-up, sign-in, session persistence with HTTP-only cookies, OAuth integrations.
- **Supabase Database (PostgreSQL)**: House relations, maintain relational integrity, query search indexes, store profiles and purchase history.
- **Supabase Storage**: Store cover art, profile avatars, raw uploads, and transcoded HLS stream segments.
- **Supabase Realtime**: Broadcast likes, new comments, social follows, and processing notifications to active clients.

---

## 3. Tech Stack

| Layer | Technology | Reason |
| :--- | :--- | :--- |
| **Framework** | Next.js 14+ (App Router) | Single cohesive codebase for SSR/SSG and serverless backend API routes. |
| **Language** | TypeScript 5.x | Strict compile-time type safety across frontend and server code. |
| **Database** | PostgreSQL 16 (via Supabase) | Robust relational engine; supports JSONB, triggers, and full-text search. |
| **ORM** | Prisma ORM | Developer-friendly, type-safe schema modeling and migrations. |
| **Authentication** | Supabase Auth (GoTrue) | Built-in authentication, JWT validation, and SSR session sync. |
| **File Storage** | Supabase Storage | S3-compatible file storage with built-in CDN distribution. |
| **Search Engine** | PostgreSQL Full-Text Search | Native search utilizing TSVectors and trigram indexes (pg_trgm). |
| **Realtime Engine** | Supabase Realtime | WebSockets for listening to database events (likes, comments, etc.). |
| **Payments** | Stripe | Customer subscriptions, tipping checkouts, and payouts via Stripe Connect. |
| **Audio Processing** | FFmpeg | Audio validation, resampling, and dynamic HLS chunk segmentation. |
| **State & Player** | Zustand + Howler.js | Lightweight state management paired with HLS audio playback libraries. |

---

## 4. Database Schema & Row Level Security

The tables reside in the `public` schema of Supabase. The `public.users` table is automatically synchronized and linked to Supabase Auth's `auth.users` table.

```
                  ┌─────────────────┐
                  │   auth.users    │
                  └────────┬────────┘
                           │ (Trigger syncs profile)
                           ▼
                  ┌─────────────────┐
                  │  public.users   │
                  └────┬───────┬────┘
                       │       │
             ┌─────────┘       └─────────┐
             ▼                           ▼
      ┌─────────────┐             ┌─────────────┐
      │   tracks    │             │  playlists  │
      └──────┬──────┘             └──────┬──────┘
             │                           │
      ┌──────┴──────┐             ┌──────┴──────┐
      │ likes/tips  │             │playlist_trks│
      └─────────────┘             └─────────────┘
```

### 1. Users Profile (Linked to Supabase Auth)

```sql
CREATE TABLE public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         VARCHAR(255) UNIQUE NOT NULL,
  username      VARCHAR(50) UNIQUE NOT NULL,
  display_name  VARCHAR(100),
  avatar_url    TEXT,
  bio           TEXT,
  role          user_role NOT NULL DEFAULT 'listener',  -- listener | artist | admin
  plan          subscription_plan DEFAULT 'free',       -- free | pro | artist_pro
  is_verified   BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE user_role AS ENUM ('listener', 'artist', 'admin');
CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'artist_pro');

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.users 
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profiles" ON public.users 
  FOR UPDATE USING (auth.uid() = id);
```

### 2. Tracks

```sql
CREATE TABLE public.tracks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id       UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title           VARCHAR(255) NOT NULL,
  slug            VARCHAR(300) UNIQUE NOT NULL,
  description     TEXT,
  cover_art_url   TEXT,
  duration_ms     INTEGER NOT NULL,
  genre           VARCHAR(100),
  mood            VARCHAR(100),
  bpm             INTEGER,
  key             VARCHAR(10),
  release_date    DATE,
  is_downloadable BOOLEAN DEFAULT true,
  download_type   download_type DEFAULT 'free',  -- free | paid | premium_only
  download_price  DECIMAL(10,2),
  play_count      BIGINT DEFAULT 0,
  download_count  BIGINT DEFAULT 0,
  status          track_status DEFAULT 'processing',  -- processing | published | unlisted | removed
  hls_playlist_url TEXT,
  audio_files     JSONB,   -- { "128": "url", "320": "url", "flac": "url" }
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE download_type AS ENUM ('free', 'paid', 'premium_only');
CREATE TYPE track_status AS ENUM ('processing', 'published', 'unlisted', 'removed');

ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published tracks" ON public.tracks
  FOR SELECT USING (status = 'published');

CREATE POLICY "Artists can insert their own tracks" ON public.tracks
  FOR INSERT WITH CHECK (auth.uid() = artist_id);

CREATE POLICY "Artists can update their own tracks" ON public.tracks
  FOR UPDATE USING (auth.uid() = artist_id);
```

### 3. Playlists

```sql
CREATE TABLE public.playlists (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  cover_art_url TEXT,
  is_public     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.playlist_tracks (
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE,
  track_id    UUID REFERENCES public.tracks(id) ON DELETE CASCADE,
  added_at    TIMESTAMPTZ DEFAULT now(),
  track_order INTEGER NOT NULL,
  PRIMARY KEY (playlist_id, track_id)
);

ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public playlists" ON public.playlists
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can manage their own playlists" ON public.playlists
  FOR ALL USING (auth.uid() = user_id);
```

### 4. Social Relations (Follows, Likes, Comments)

```sql
CREATE TABLE public.follows (
  follower_id  UUID REFERENCES public.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE public.likes (
  user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE,
  track_id   UUID REFERENCES public.tracks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, track_id)
);

CREATE TABLE public.comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES public.users(id) ON DELETE CASCADE,
  track_id     UUID REFERENCES public.tracks(id) ON DELETE CASCADE,
  body         TEXT NOT NULL,
  timestamp_ms INTEGER,
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Social Selects are generally open
CREATE POLICY "Likes and follows viewable by all" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Comments viewable by all" ON public.comments FOR SELECT USING (true);

-- User-specific mutations protected by auth.uid() checks
CREATE POLICY "Users can like tracks" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove likes" ON public.likes FOR DELETE USING (auth.uid() = user_id);
```

### 5. Payments (Subscriptions, Purchases, Tips)

```sql
CREATE TABLE public.subscriptions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  plan                 subscription_plan NOT NULL,
  status               TEXT NOT NULL,  -- active | cancelled | past_due
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.purchases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.users(id),
  track_id        UUID REFERENCES public.tracks(id),
  amount_cents    INTEGER NOT NULL,
  currency        VARCHAR(3) DEFAULT 'USD',
  stripe_payment_id TEXT UNIQUE,
  purchased_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.tips (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id    UUID REFERENCES public.users(id),
  to_artist_id    UUID REFERENCES public.users(id),
  track_id        UUID REFERENCES public.tracks(id),
  amount_cents    INTEGER NOT NULL,
  currency        VARCHAR(3) DEFAULT 'USD',
  stripe_payment_id TEXT UNIQUE,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

---

## 5. API & Data Querying Reference

In Next.js + Supabase, direct querying via standard REST endpoints is minimized.

### Direct Client Query Example

```typescript
// Querying tracks directly from a Client or Server Component using Supabase Client
const { data: tracks, error } = await supabase
  .from('tracks')
  .select('id, title, genres, users(display_name)')
  .eq('status', 'published')
  .order('play_count', { ascending: false });
```

### Transactional Route Handlers (`/api/...`)

All routes require authentication validation using cookies retrieved by `@supabase/ssr`.

#### 1. POST `/api/tracks` (Artist Upload)
- **Role**: Artist
- **Payload**: Multipart form-data containing audio binary, metadata, and optional cover art.
- **Action**: Validates parameters, writes draft track row to database, uploads original audio to Supabase Storage, and fires off background audio conversion (FFmpeg).
- **Response**: `202 Accepted` with track details.

#### 2. GET `/api/tracks/[id]/dl` (Download Request)
- **Payload**: `track_id` parameter.
- **Action**: Validates client access permissions (checks if track is free, premium-only with Pro user status, or has been purchased), increments download count, and retrieves a signed, temporary file link from Supabase Storage.
- **Response**: `200 OK` with JSON containing `{ downloadUrl: "signed_url" }`.

#### 3. POST `/api/payments/sub` (Start Subscription)
- **Payload**: `{ priceId: string }`.
- **Action**: Initiates a Stripe Checkout Session for subscription plans and returns checkout links.
- **Response**: `200 OK` with `{ url: "stripe_checkout_url" }`.

#### 4. POST `/api/payments/tip` (Tip Artist)
- **Payload**: `{ artistId: string, amount: number, trackId?: string }`.
- **Action**: Creates a Stripe checkout intent for direct tipping.
- **Response**: `200 OK` with checkout session link.

#### 5. POST `/api/webhooks/stripe` (Stripe Event Processing)
- **Payload**: Raw Stripe webhook payloads.
- **Action**: Synchronizes billing events (`invoice.paid`, `customer.subscription.deleted`, and payments) to `public.subscriptions` and `public.purchases` tables.

---

## 6. Authentication & Authorization

Authentication is managed by **Supabase Auth** (GoTrue) under the hood.

```
┌───────────────┐        Credentials        ┌──────────────────┐
│ Next.js Client├──────────────────────────>│  Supabase Auth   │
└───────┬───────┘                           └────────┬─────────┘
        │                                            │ Sets Session
        │ Requests Page / API                        ▼
        │ (Includes HTTP-only Cookie)       ┌──────────────────┐
        └──────────────────────────────────>│Next.js Middleware│
                                            └────────┬─────────┘
                                                     │ Validates Session
                                                     ▼
                                            ┌──────────────────┐
                                            │ Render Component │
                                            └──────────────────┘
```

### SSR Session Management

- Next.js uses `@supabase/ssr` to configure client-side and server-side contexts.
- Access tokens are exchanged and stored in secure cookies, allowing Next.js Server Components to securely read authentications.
- Next.js `middleware.ts` intercepts requests to read these cookies, refresh expired sessions, and enforce route access blocks (e.g. preventing unauthenticated users from seeing `/dashboard`).

### Role Verification

Roles (`listener`, `artist`, `admin`) are stored in `public.users`. When a user requests a protected route (like uploading music):
1. Next.js API or Server Action retrieves the session user ID: `const user = await supabase.auth.getUser()`.
2. Queries user profile: `const profile = await db.users.findUnique({ where: { id: user.id } })`.
3. Validates if `profile.role === 'artist'` before permitting track processing.

---

## 7. File Storage & Audio Pipeline

All files reside inside private or public buckets in **Supabase Storage**.

### Storage Bucket Map

| Bucket Name | Access | Contains |
| :--- | :--- | :--- |
| `tracks` | Private | Original audio uploads & raw assets (`raw/{track_id}/original.wav`). |
| `streams` | Public | Transcoded HLS `.m3u8` playlists and audio segments (`hls/{track_id}/*`). |
| `covers` | Public | Track artworks (`covers/{track_id}/cover_500.jpg`). |
| `avatars` | Public | User profile images (`avatars/{user_id}.jpg`). |

### Upload and Transcoding Pipeline

```
1. Client calls POST /api/tracks
2. Route handler performs file constraints check (max size 200MB, type validation)
3. Raw file is uploaded directly to Supabase Storage private bucket `tracks` at:
   raw/{track_id}/original.{ext}
4. Database record created in public.tracks with status = 'processing'
5. Route Handler runs FFmpeg background transcoding process (Serverless function / async runtime)
6. FFmpeg processes files:
   - Resamples & Segments track into HLS format (.m3u8 playlist file + 10s audio .ts fragments)
   - Transcodes track into discrete MP3 files: 128kbps, 320kbps
   - Compresses art images into 500px and 1500px cover images
7. Transcoded directories are uploaded to Supabase Storage public buckets:
   - streams/hls/{track_id}/playlist.m3u8 & segment_xxx.ts
   - covers/covers/{track_id}/cover_500.jpg
8. Updates public.tracks record: status = 'published', updates hls_playlist_url and audio_files JSON
9. Realtime broadcast notifies the frontend that processing is complete
```

---

## 8. Streaming Architecture

Dynamic audio delivery uses **HTTP Live Streaming (HLS)**.

### HLS Segments & Bitrates

- FFmpeg slices tracks into 10-second `.ts` blocks, minimizing startup delays.
- Next.js uses standard player interfaces (`Howler.js` or `hls.js`) pointing to the `.m3u8` playlist URL.
- Quality tiers:
  - **Free Plan**: Only streams the low-bitrate HLS playlist (limited to 128kbps segments).
  - **Pro Plan**: Access to standard 320kbps HLS playlists.
  - **Artist Pro**: Lossless options available where supported.
- Access verification for premium or paid streams is enforced by issuing signed token validation parameters or utilizing signed URLs from Supabase Storage for the `.m3u8` manifests.

---

## 9. Download System

Unlike streaming, downloads retrieve complete audio files.

```
1. User clicks "Download" button on client
2. Frontend calls API route GET /api/tracks/[id]/dl
3. API Server checks tracks properties (free / paid / premium)
4. Checks listener entitlement:
   - If paid, verifies public.purchases record exists.
   - If premium, verifies public.users.plan is 'pro' or 'artist_pro'.
5. If checks pass, API calls Supabase Storage client:
   supabase.storage.from('tracks').createSignedUrl('audio/{track_id}/320.mp3', 60)
6. Returns signed URL back to client
7. Client triggers browser download prompt from returned URL
```

---

## 10. Search & Discovery

Instead of using external engines, search is managed directly inside PostgreSQL on Supabase.

### PostgreSQL Full-Text Search Configuration

Using Postgres built-in search modules is lightweight, fast, and does not require managing separate external servers.

- **Indices**: Creates a `tsvector` column or triggers on `public.tracks` (combining title, genre, and tags) and `public.users` (for usernames and display names).
- **Querying**: Queries search utilizing the standard PostgreSQL `to_tsquery` matching:
  ```sql
  SELECT * FROM tracks 
  WHERE to_tsvector('english', title || ' ' || genre) @@ to_tsquery('english', 'Afrobeats');
  ```
- **Fuzzy Search**: Enabled via the `pg_trgm` extension for handling typos and autocomplete lookups:
  ```sql
  SELECT * FROM tracks WHERE similarity(title, 'Essense') > 0.3;
  ```

---

## 11. Payment & Monetization

- **Subscriptions**: Powered by Stripe Billing. Webhooks update the `public.users.plan` property.
- **Track Purchases & Artist Tips**: Handled through Stripe Checkout and PaymentIntents.
- **Stripe Connect**: Marketplace payouts. Direct checkout tips splits revenue:
  - **Tips**: 95% transfers to Artist's connected Stripe account, 5% goes to Platform.
  - **Track Purchases**: 80% to Artist, 20% to Platform.

---

## 12. Frontend & Backend Directory Structure

All components, pages, and server APIs reside under `/src`.

```
src/
├── app/
│   ├── (auth)/             # Authentication route layouts (login, signup)
│   ├── (main)/             # Core dashboard pages
│   │   ├── explore/        # Browse genres, search interface
│   │   ├── track/[slug]/   # Track detail and commentary sections
│   │   ├── artist/[name]/  # Artist profiles & albums list
│   │   └── playlist/[id]/  # Playlist layout viewer
│   ├── api/                # API route handlers
│   │   ├── tracks/         # Transcoding, uploads, signed downloads
│   │   ├── payments/       # Subscription checkpoints, Stripe checkouts
│   │   └── webhooks/       # External Stripe webhook sync
│   └── layout.tsx          # Root template with persistent Player bar
├── components/
│   ├── Player/             # Audio container powered by Howler.js
│   ├── Track/              # Track rows, list view adapters
│   └── UI/                 # Buttons, modals, input elements
├── stores/
│   ├── playerStore.ts      # Zustand audio player queue management
│   └── authStore.ts        # Zustand auth details
└── lib/
    ├── supabase.ts         # Server/Client Supabase initializations
    └── stripe.ts           # Stripe SDK helpers
```

---

## 13. Security Considerations

- **Row Level Security (RLS)**: Enforced on all Supabase tables, restricting direct DB mutations to authorized user contexts.
- **Next.js Route Protection**: Middleware filters out unauthorized routes, redirecting guests.
- **Input Validation**: All payloads to Server Actions and API Routes are strictly parsed by `Zod` schemas.
- **File Upload Limits**: Enforced strictly at the API layer, checking Magic Bytes (MIME types) and content size before writing to Storage.

---

## 14. Performance & Scalability

- **Database Performance**: Appropriate indexes on foreign keys, track slugs, and status fields ensure fast queries.
- **HLS Chunk Delivery**: Video/audio chunks are served directly from Supabase Storage's CDN.
- **Optimized Image Loading**: Using `next/image` ensures automatic compression of cover art and avatars.
- **Database Connection Pooling**: Done via Supabase PgBouncer endpoints, preventing connection pool exhaustion.

---

## 15. Environment Variables

```env
# Next.js Settings
NEXT_PUBLIC_SITE_URL=https://Ekoro.io

# Supabase Configurations
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key
SUPABASE_SERVICE_ROLE_KEY=your_secret_service_role_key
DATABASE_URL=postgresql://postgres.your-project:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres

# Stripe Configurations
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ARTIST_PRICE_ID=price_...
```

---

## 16. Error Handling

All backend exceptions follow a standardized format returned to callers:

```json
{
  "error": {
    "code": "TRACK_PROCESSING_FAILED",
    "message": "FFmpeg was unable to parse the audio track.",
    "status": 422
  }
}
```

Standardized Error Codes:
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `VALIDATION_ERROR` (422)
- `RATE_LIMITED` (429)

---

## 17. Testing Strategy

- **Unit Testing**: Vitest and React Testing Library for components and state stores.
- **End-to-End Tests**: Playwright for validating core streams, audio uploads, and purchase paths.
- **Test Database**: Separate Supabase environment is utilized for testing CI/CD runs.

---

## 18. Deployment

### Frontend & API Deployment (Vercel)

Vercel acts as the primary host. The deployment executes via git integrations:
- Every push to the main branch is built and deployed.
- Serverless API routes scale automatically, handling uploads and Stripe integration logic.

### Database & Storage Deployment (Supabase)

- Local schemas are linked to the cloud cluster using the Supabase CLI.
- Database changes are applied via migrations: `supabase db push`.
- Storage Buckets (`tracks`, `covers`, `streams`, `avatars`) are set up on Supabase Cloud, referencing the same bucket policies.

---

_Documentation maintained by the Ekoro team._
