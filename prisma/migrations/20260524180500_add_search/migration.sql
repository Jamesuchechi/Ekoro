-- Enable pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN index for fuzzy matching on tracks (title, genre, mood)
CREATE INDEX IF NOT EXISTS tracks_title_trgm_idx ON public.tracks USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS tracks_genre_trgm_idx ON public.tracks USING gin (genre gin_trgm_ops);
CREATE INDEX IF NOT EXISTS tracks_mood_trgm_idx ON public.tracks USING gin (mood gin_trgm_ops);

-- Create GIN index for fuzzy matching on users (display_name, username)
CREATE INDEX IF NOT EXISTS users_display_name_trgm_idx ON public.users USING gin (display_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS users_username_trgm_idx ON public.users USING gin (username gin_trgm_ops);

-- Create GIN index for fuzzy matching on playlists (title)
CREATE INDEX IF NOT EXISTS playlists_title_trgm_idx ON public.playlists USING gin (title gin_trgm_ops);

-- Create FTS GIN indexes using expression to_tsvector on tracks, users, and playlists
CREATE INDEX IF NOT EXISTS tracks_fts_idx ON public.tracks USING gin (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(genre, '') || ' ' || coalesce(mood, ''))
);

CREATE INDEX IF NOT EXISTS users_fts_idx ON public.users USING gin (
  to_tsvector('english', coalesce(display_name, '') || ' ' || coalesce(username, '') || ' ' || coalesce(bio, ''))
);

CREATE INDEX IF NOT EXISTS playlists_fts_idx ON public.playlists USING gin (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
);
