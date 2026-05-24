import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionProfile, requireRole } from "@/lib/auth-helpers";
import { processTrackBackground } from "@/lib/transcoder";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import path from "path";

// Init admin Supabase client to upload raw files to private bucket
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/tracks
 * Query published tracks with pagination, search, and filtering.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const genre = searchParams.get("genre");
    const mood = searchParams.get("mood");
    const sort = searchParams.get("sort") || "newest";
    const search = searchParams.get("search");
    
    // Custom filter presets
    const filter = searchParams.get("filter"); // trending | new-releases | related
    const relatedToId = searchParams.get("relatedToId");

    const offset = (page - 1) * limit;

    // Build query conditions
    const where: any = {
      status: "published",
    };

    if (genre) {
      where.genre = { equals: genre, mode: "insensitive" };
    }

    if (mood) {
      where.mood = { equals: mood, mode: "insensitive" };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        {
          artist: {
            OR: [
              { displayName: { contains: search, mode: "insensitive" } },
              { username: { contains: search, mode: "insensitive" } }
            ]
          }
        }
      ];
    }

    // Handle related tracks query
    if (filter === "related" && relatedToId) {
      const sourceTrack = await prisma.track.findUnique({
        where: { id: relatedToId },
      });

      if (sourceTrack) {
        where.id = { not: relatedToId };
        where.OR = [];
        if (sourceTrack.genre) {
          where.OR.push({ genre: { equals: sourceTrack.genre, mode: "insensitive" } });
        }
        where.OR.push({ artistId: sourceTrack.artistId });
      }
    }

    // Determine sorting
    let orderBy: any = { createdAt: "desc" };
    if (sort === "popular") {
      orderBy = { playCount: "desc" };
    } else if (sort === "trending") {
      // Trending sorting by playCount and recency
      orderBy = [
        { playCount: "desc" },
        { createdAt: "desc" }
      ];
    } else if (sort === "new-releases") {
      orderBy = { createdAt: "desc" };
    }

    // Execute query
    const [tracks, total] = await Promise.all([
      prisma.track.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        include: {
          artist: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.track.count({ where }),
    ]);

    // Format BigInt values for JSON response
    const formattedTracks = tracks.map((track) => ({
      ...track,
      playCount: track.playCount.toString(),
      downloadCount: track.downloadCount.toString(),
    }));

    const response = NextResponse.json({
      tracks: formattedTracks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

    // Add CDN caching for high-traffic trending and new-releases filters (5 mins cache, 1 min stale revalidation)
    if (sort === "trending" || sort === "new-releases" || filter === "trending" || filter === "new-releases") {
      response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=60");
    }

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch tracks" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tracks
 * Multipart upload (audio + cover art + metadata), artist only.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authorize: Only artists or admins can upload tracks
    const profile = await requireRole(["artist", "admin"]);
    
    // 2. Parse Multipart form-data
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const coverFile = formData.get("cover") as File | null;
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;
    const genre = formData.get("genre") as string | null;
    const mood = formData.get("mood") as string | null;
    const bpmStr = formData.get("bpm") as string | null;
    const isDownloadable = formData.get("isDownloadable") === "true";
    const downloadType = (formData.get("downloadType") as string) || "free";
    const downloadPriceStr = formData.get("downloadPrice") as string | null;

    if (!title || !audioFile) {
      return NextResponse.json(
        { error: "Title and audio file are required" },
        { status: 400 }
      );
    }

    // 3. File type validation (accept mp3, wav, flac, aac only)
    const allowedAudioTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/x-wav",
      "audio/wave",
      "audio/flac",
      "audio/x-flac",
      "audio/aac",
      "audio/x-aac",
      "audio/x-m4a",
      "audio/mp4"
    ];
    const audioExt = path.extname(audioFile.name).toLowerCase();
    const allowedExts = [".mp3", ".wav", ".flac", ".aac", ".m4a"];

    if (!allowedAudioTypes.includes(audioFile.type) && !allowedExts.includes(audioExt)) {
      return NextResponse.json(
        { error: "Invalid audio file type. Only MP3, WAV, FLAC, and AAC are supported." },
        { status: 400 }
      );
    }

    // 4. File size validation (max 200MB)
    const maxSizeBytes = 200 * 1024 * 1024;
    if (audioFile.size > maxSizeBytes) {
      return NextResponse.json(
        { error: "Audio file is too large. Maximum size is 200MB." },
        { status: 400 }
      );
    }

    // 5. Upload raw file to private Supabase Storage 'tracks' bucket
    const timestamp = Date.now();
    const sanitizedAudioName = audioFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const audioKey = `${profile.id}/${timestamp}-${sanitizedAudioName}`;
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    const { error: audioUploadError } = await supabaseAdmin.storage
      .from("tracks")
      .upload(audioKey, audioBuffer, {
        contentType: audioFile.type,
        upsert: true,
      });

    if (audioUploadError) {
      throw new Error(`Failed to upload raw audio to storage: ${audioUploadError.message}`);
    }

    // 6. Handle optional cover art file upload to public 'covers' bucket
    let coverUrl: string | null = null;
    if (coverFile) {
      const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (allowedImageTypes.includes(coverFile.type)) {
        const sanitizedCoverName = coverFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const coverKey = `raw/${profile.id}/${timestamp}-${sanitizedCoverName}`;
        const coverBuffer = Buffer.from(await coverFile.arrayBuffer());

        const { error: coverUploadError } = await supabaseAdmin.storage
          .from("covers")
          .upload(coverKey, coverBuffer, {
            contentType: coverFile.type,
            upsert: true,
          });

        if (!coverUploadError) {
          coverUrl = coverKey;
        }
      }
    }

    // 7. Create database record
    const baseSlug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
    const bpm = bpmStr ? parseInt(bpmStr, 10) : null;
    const downloadPrice = downloadPriceStr ? parseFloat(downloadPriceStr) : null;

    const track = await prisma.track.create({
      data: {
        artistId: profile.id,
        title,
        slug,
        description,
        genre,
        mood,
        bpm,
        isDownloadable,
        downloadType: downloadType as any,
        downloadPrice,
        key: audioKey,
        coverArtUrl: coverUrl,
        durationMs: 0, // Will be set by transcoding worker
        status: "processing",
      },
    });

    // 8. Trigger background transcoding process (non-blocking)
    processTrackBackground(track.id);

    return NextResponse.json(
      {
        message: "Track upload successful. Transcoding started in background.",
        trackId: track.id,
        status: track.status,
      },
      { status: 202 }
    );
  } catch (error: any) {
    if (error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized. Artist role required." }, { status: 403 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to upload track" },
      { status: 500 }
    );
  }
}
