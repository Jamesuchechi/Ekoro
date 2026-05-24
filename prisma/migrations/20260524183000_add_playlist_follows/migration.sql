-- CreateTable
CREATE TABLE "playlist_follows" (
    "playlist_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlist_follows_pkey" PRIMARY KEY ("playlist_id","user_id")
);

-- AddForeignKey
ALTER TABLE "playlist_follows" ADD CONSTRAINT "playlist_follows_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "playlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_follows" ADD CONSTRAINT "playlist_follows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable Row Level Security
ALTER TABLE "playlist_follows" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for playlist_follows
CREATE POLICY "Playlist follows are viewable by everyone" ON "playlist_follows"
  FOR SELECT USING (true);

CREATE POLICY "Users can follow playlists" ON "playlist_follows"
  FOR INSERT WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "Users can unfollow playlists" ON "playlist_follows"
  FOR DELETE USING (auth.uid() = "user_id");
