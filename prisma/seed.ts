import { PrismaClient, UserRole, SubscriptionPlan, DownloadType, TrackStatus } from "@prisma/client";

// Connect directly via DIRECT_URL to support DDL commands (functions, triggers) during seeding/setup
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log("Seeding database...");

  // 1. Setup Supabase Auth triggers (Requires Direct/Session Connection)
  console.log("Setting up Supabase Auth triggers...");
  
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    DECLARE
      username_val TEXT;
      display_name_val TEXT;
      avatar_url_val TEXT;
      role_val public."UserRole";
    BEGIN
      username_val := COALESCE(
        new.raw_user_meta_data->>'username',
        split_part(new.email, '@', 1) || '_' || substring(gen_random_uuid()::text, 1, 8)
      );
      
      display_name_val := COALESCE(
        new.raw_user_meta_data->>'display_name',
        new.raw_user_meta_data->>'full_name',
        split_part(new.email, '@', 1)
      );
      
      avatar_url_val := new.raw_user_meta_data->>'avatar_url';
      
      role_val := CASE
        WHEN new.raw_user_meta_data->>'role' = 'artist' THEN 'artist'::public."UserRole"
        WHEN new.raw_user_meta_data->>'role' = 'admin' THEN 'admin'::public."UserRole"
        ELSE 'listener'::public."UserRole"
      END;

      WHILE EXISTS (SELECT 1 FROM public.users WHERE username = username_val) LOOP
        username_val := username_val || '_' || substring(gen_random_uuid()::text, 1, 4);
      END LOOP;

      INSERT INTO public.users (
        id,
        email,
        username,
        display_name,
        avatar_url,
        role,
        plan,
        is_verified,
        created_at,
        updated_at
      )
      VALUES (
        new.id,
        new.email,
        username_val,
        display_name_val,
        avatar_url_val,
        role_val,
        'free'::public."SubscriptionPlan",
        false,
        NOW(),
        NOW()
      );
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `);

  await prisma.$executeRawUnsafe(`
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  `);

  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION public.handle_user_delete()
    RETURNS TRIGGER AS $$
    BEGIN
      DELETE FROM public.users WHERE id = old.id;
      RETURN OLD;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `);

  await prisma.$executeRawUnsafe(`
    DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER on_auth_user_deleted
      AFTER DELETE ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();
  `);

  console.log("Supabase Auth triggers set up successfully.");

  // 2. Clean existing public data
  await prisma.playEvent.deleteMany({});
  await prisma.tip.deleteMany({});
  await prisma.purchase.deleteMany({});
  await prisma.like.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.playlistTrack.deleteMany({});
  await prisma.playlist.deleteMany({});
  await prisma.albumTrack.deleteMany({});
  await prisma.album.deleteMany({});
  await prisma.track.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Cleaned old records.");

  // 3. Create users (Artists & Listeners)
  const artist1 = await prisma.user.create({
    data: {
      id: "d6b490f2-fb40-410a-b333-e91b1d1bc029",
      email: "wizkid@ekoro.app",
      username: "wizkid",
      displayName: "Wizkid",
      avatarUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60",
      bio: "Starboy. Afrobeats pioneer and global music icon.",
      role: UserRole.artist,
      plan: SubscriptionPlan.artist_pro,
      isVerified: true,
    },
  });

  const artist2 = await prisma.user.create({
    data: {
      id: "e7c490f2-fb40-410a-b333-e91b1d1bc030",
      email: "davido@ekoro.app",
      username: "davido",
      displayName: "Davido",
      avatarUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&auto=format&fit=crop&q=60",
      bio: "We rise by lifting others. CEO DMW.",
      role: UserRole.artist,
      plan: SubscriptionPlan.artist_pro,
      isVerified: true,
    },
  });

  const listener = await prisma.user.create({
    data: {
      id: "f8d490f2-fb40-410a-b333-e91b1d1bc031",
      email: "james@ekoro.app",
      username: "james",
      displayName: "James Uchechi",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500&auto=format&fit=crop&q=60",
      bio: "Music lover, independent artist supporter.",
      role: UserRole.listener,
      plan: SubscriptionPlan.pro,
      isVerified: false,
    },
  });

  console.log("Created users:", { artist1: artist1.username, artist2: artist2.username, listener: listener.username });

  // 4. Create Tracks
  const track1 = await prisma.track.create({
    data: {
      artistId: artist1.id,
      title: "Essence",
      slug: "essence",
      description: "Sensual Afrobeats vibe featuring Tems.",
      coverArtUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60",
      durationMs: 218000,
      genre: "Afrobeats",
      mood: "Smooth",
      bpm: 102,
      key: "Fm",
      isDownloadable: true,
      downloadType: DownloadType.free,
      status: TrackStatus.published,
      playCount: 154320,
    },
  });

  const track2 = await prisma.track.create({
    data: {
      artistId: artist2.id,
      title: "Unavailable",
      slug: "unavailable",
      description: "Hit single featuring Musa Keys from the Timeless album.",
      coverArtUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=60",
      durationMs: 170000,
      genre: "Afrobeats",
      mood: "Energetic",
      bpm: 110,
      key: "G#m",
      isDownloadable: true,
      downloadType: DownloadType.paid,
      downloadPrice: 1.99,
      status: TrackStatus.published,
      playCount: 98740,
    },
  });

  const track3 = await prisma.track.create({
    data: {
      artistId: artist1.id,
      title: "Ojuelegba",
      slug: "ojuelegba",
      description: "Classics of Wizkid describing his early journey.",
      coverArtUrl: "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=500&auto=format&fit=crop&q=60",
      durationMs: 216000,
      genre: "Afrobeats",
      mood: "Nostalgic",
      bpm: 98,
      key: "Am",
      isDownloadable: true,
      downloadType: DownloadType.free,
      status: TrackStatus.published,
      playCount: 220100,
    },
  });

  console.log("Created tracks:", [track1.title, track2.title, track3.title]);

  // 5. Create some activity (likes, comments)
  await prisma.like.create({
    data: {
      userId: listener.id,
      trackId: track1.id,
    },
  });

  await prisma.comment.create({
    data: {
      userId: listener.id,
      trackId: track1.id,
      body: "This is a masterpiece!",
      timestampMs: 25000,
    },
  });

  console.log("Seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
