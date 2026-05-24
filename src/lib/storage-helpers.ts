import { createClient } from "@/lib/supabase/server";

/**
 * Uploads a file asset directly to a Supabase Storage bucket.
 */
export async function uploadToStorage(
  bucket: string,
  key: string,
  file: Blob | Buffer | ArrayBuffer,
  contentType?: string,
  cacheControl?: string
) {
  const supabase = createClient();
  
  // Apply a standard 1-year CDN caching policy for public assets (covers, avatars, streams) by default
  const defaultCacheControl = ["covers", "avatars", "streams"].includes(bucket)
    ? "public, max-age=31536000, immutable"
    : undefined;

  const { data, error } = await supabase.storage.from(bucket).upload(key, file, {
    contentType,
    upsert: true,
    cacheControl: cacheControl ?? defaultCacheControl,
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Generates a secure, pre-signed download/streaming URL for a private asset.
 */
export async function getSignedUrl(bucket: string, key: string, expiresIn = 3600) {
  const supabase = createClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(key, expiresIn);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

/**
 * Deletes one or more file assets from a Supabase Storage bucket.
 */
export async function deleteFromStorage(bucket: string, key: string) {
  const supabase = createClient();
  const { data, error } = await supabase.storage.from(bucket).remove([key]);

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Returns a static public URL for assets in public buckets (like user avatars/covers).
 */
export function getPublicUrl(bucket: string, key: string) {
  const supabase = createClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(key);
  return data.publicUrl;
}
