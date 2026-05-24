-- Enable Row Level Security (idempotent — safe to run multiple times)
ALTER TABLE "playlists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "playlist_tracks" ENABLE ROW LEVEL SECURITY;

-- Policies for playlists (drop first so re-runs never crash)
DROP POLICY IF EXISTS "Public playlists are viewable by everyone" ON "playlists";
CREATE POLICY "Public playlists are viewable by everyone" ON "playlists"
  FOR SELECT USING ("is_public" = true);

DROP POLICY IF EXISTS "Users can view their own playlists" ON "playlists";
CREATE POLICY "Users can view their own playlists" ON "playlists"
  FOR SELECT USING (auth.uid() = "user_id");

DROP POLICY IF EXISTS "Users can create their own playlists" ON "playlists";
CREATE POLICY "Users can create their own playlists" ON "playlists"
  FOR INSERT WITH CHECK (auth.uid() = "user_id");

DROP POLICY IF EXISTS "Users can update their own playlists" ON "playlists";
CREATE POLICY "Users can update their own playlists" ON "playlists"
  FOR UPDATE USING (auth.uid() = "user_id") WITH CHECK (auth.uid() = "user_id");

DROP POLICY IF EXISTS "Users can delete their own playlists" ON "playlists";
CREATE POLICY "Users can delete their own playlists" ON "playlists"
  FOR DELETE USING (auth.uid() = "user_id");

-- Policies for playlist_tracks
DROP POLICY IF EXISTS "Tracks in public playlists are viewable by everyone" ON "playlist_tracks";
CREATE POLICY "Tracks in public playlists are viewable by everyone" ON "playlist_tracks"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "playlists"
      WHERE "playlists"."id" = "playlist_tracks"."playlist_id" AND "playlists"."is_public" = true
    )
  );

DROP POLICY IF EXISTS "Users can view tracks in their own playlists" ON "playlist_tracks";
CREATE POLICY "Users can view tracks in their own playlists" ON "playlist_tracks"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "playlists"
      WHERE "playlists"."id" = "playlist_tracks"."playlist_id" AND "playlists"."user_id" = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can add tracks to their own playlists" ON "playlist_tracks";
CREATE POLICY "Users can add tracks to their own playlists" ON "playlist_tracks"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "playlists"
      WHERE "playlists"."id" = "playlist_tracks"."playlist_id" AND "playlists"."user_id" = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update tracks in their own playlists" ON "playlist_tracks";
CREATE POLICY "Users can update tracks in their own playlists" ON "playlist_tracks"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "playlists"
      WHERE "playlists"."id" = "playlist_tracks"."playlist_id" AND "playlists"."user_id" = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM "playlists"
      WHERE "playlists"."id" = "playlist_tracks"."playlist_id" AND "playlists"."user_id" = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete tracks from their own playlists" ON "playlist_tracks";
CREATE POLICY "Users can delete tracks from their own playlists" ON "playlist_tracks"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "playlists"
      WHERE "playlists"."id" = "playlist_tracks"."playlist_id" AND "playlists"."user_id" = auth.uid()
    )
  );
