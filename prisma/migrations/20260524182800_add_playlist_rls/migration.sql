-- Enable Row Level Security (RLS)
ALTER TABLE "playlists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "playlist_tracks" ENABLE ROW LEVEL SECURITY;

-- Policies for playlists
CREATE POLICY "Public playlists are viewable by everyone" ON "playlists"
  FOR SELECT USING ("is_public" = true);

CREATE POLICY "Users can view their own playlists" ON "playlists"
  FOR SELECT USING (auth.uid() = "user_id");

CREATE POLICY "Users can create their own playlists" ON "playlists"
  FOR INSERT WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "Users can update their own playlists" ON "playlists"
  FOR UPDATE USING (auth.uid() = "user_id") WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "Users can delete their own playlists" ON "playlists"
  FOR DELETE USING (auth.uid() = "user_id");

-- Policies for playlist_tracks
CREATE POLICY "Tracks in public playlists are viewable by everyone" ON "playlist_tracks"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "playlists"
      WHERE "playlists"."id" = "playlist_tracks"."playlist_id" AND "playlists"."is_public" = true
    )
  );

CREATE POLICY "Users can view tracks in their own playlists" ON "playlist_tracks"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "playlists"
      WHERE "playlists"."id" = "playlist_tracks"."playlist_id" AND "playlists"."user_id" = auth.uid()
    )
  );

CREATE POLICY "Users can add tracks to their own playlists" ON "playlist_tracks"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "playlists"
      WHERE "playlists"."id" = "playlist_tracks"."playlist_id" AND "playlists"."user_id" = auth.uid()
    )
  );

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

CREATE POLICY "Users can delete tracks from their own playlists" ON "playlist_tracks"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "playlists"
      WHERE "playlists"."id" = "playlist_tracks"."playlist_id" AND "playlists"."user_id" = auth.uid()
    )
  );
