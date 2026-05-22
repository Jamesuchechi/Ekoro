-- Create storage buckets for Ekoro application
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tracks', 'tracks', false) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('covers', 'covers', true) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('streams', 'streams', true) 
ON CONFLICT (id) DO NOTHING;
