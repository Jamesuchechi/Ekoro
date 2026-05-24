import fs from "fs";
import path from "path";
import os from "os";
import net from "net";
import { exec } from "child_process";
import { promisify } from "util";
import sharp from "sharp";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const execAsync = promisify(exec);

/**
 * Dynamically resolves the FFmpeg executable path.
 */
export function getFFmpegPath(): string {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  
  // Local static build from neighboring project (verified working)
  const localPath = "/home/jamesuchechi/Projects/HireSight/node_modules/@ffmpeg-installer/linux-x64/ffmpeg";
  if (fs.existsSync(localPath)) return localPath;

  return "ffmpeg";
}

/**
 * Creates an administrative Supabase client using the service role key to bypass RLS.
 */
function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Sends a real-time progress update to the client via Supabase Realtime broadcast.
 */
export async function broadcastProgress(trackId: string, progress: number, message: string) {
  try {
    const supabase = createAdminClient();
    const channel = supabase.channel(`track_${trackId}`);
    
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.send({
          type: "broadcast",
          event: "progress",
          payload: { trackId, progress, message },
        });
        await channel.unsubscribe();
      }
    });
  } catch (error) {
    logger.warn("Failed to broadcast progress update via Supabase Realtime", { trackId, error });
  }
}

/**
 * Sends a notification email to the artist using the local Mailpit SMTP server (or logs it).
 */
export async function sendEmailNotification(to: string, subject: string, htmlContent: string): Promise<void> {
  logger.info(`Sending email notification to ${to}: ${subject}`);
  
  return new Promise((resolve) => {
    const client = net.createConnection({ host: "localhost", port: 1025 }, () => {
      client.write("HELO localhost\r\n");
      client.write("MAIL FROM: <noreply@ekoro.app>\r\n");
      client.write(`RCPT TO: <${to}>\r\n`);
      client.write("DATA\r\n");
      client.write(`Subject: ${subject}\r\n`);
      client.write("Content-Type: text/html; charset=utf-8\r\n");
      client.write("\r\n");
      client.write(`${htmlContent}\r\n`);
      client.write(".\r\n");
      client.write("QUIT\r\n");
    });
    
    client.on("data", () => {});
    client.on("end", () => resolve());
    client.on("error", (err) => {
      logger.warn("Mailpit SMTP server not reachable. Logged email instead.", { to, subject, error: err.message });
      resolve();
    });
  });
}

/**
 * Parses duration and BPM from FFmpeg stderr output.
 */
function parseMetadataFromStderr(stderr: string): { durationMs: number; bpm: number | null } {
  let durationMs = 0;
  let bpm: number | null = null;

  // Duration parser (Duration: hh:mm:ss.ms)
  const durationMatch = stderr.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
  if (durationMatch) {
    const hours = parseInt(durationMatch[1], 10);
    const minutes = parseInt(durationMatch[2], 10);
    const seconds = parseInt(durationMatch[3], 10);
    const hundredths = parseInt(durationMatch[4], 10);
    durationMs = ((hours * 3600 + minutes * 60 + seconds) * 1000) + (hundredths * 10);
  }

  // BPM parser (looks for custom BPM metadata tags)
  const bpmMatch = stderr.match(/bpm\s*:\s*(\d+)/i);
  if (bpmMatch) {
    bpm = parseInt(bpmMatch[1], 10);
  }

  return { durationMs, bpm };
}

/**
 * Triggers track processing in a non-blocking background runner thread.
 */
export function processTrackBackground(trackId: string): void {
  // Fire and forget
  Promise.resolve()
    .then(() => processTrack(trackId))
    .catch((err) => {
      logger.error(`Critical unhandled error in background transcoder for track ${trackId}`, err);
    });
}

/**
 * Main transcoding and processing pipeline logic.
 */
export async function processTrack(trackId: string): Promise<void> {
  const ffmpegPath = getFFmpegPath();
  const tempDir = path.join(os.tmpdir(), `track-${trackId}`);
  const supabase = createAdminClient();

  logger.info(`Starting transcoding pipeline for track ${trackId}`);
  await broadcastProgress(trackId, 0, "Starting transcoder...");

  try {
    // 1. Fetch Track & Artist details
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      include: { artist: true },
    });

    if (!track) {
      throw new Error(`Track ${trackId} not found in database`);
    }

    if (!track.key) {
      throw new Error(`Track ${trackId} has no associated storage key`);
    }

    // Ensure status is processing
    await prisma.track.update({
      where: { id: trackId },
      data: { status: "processing" },
    });

    // Create temp directory
    fs.mkdirSync(tempDir, { recursive: true });

    // 2. Download raw audio from private 'tracks' bucket
    await broadcastProgress(trackId, 10, "Downloading raw audio from storage...");
    const { data: audioData, error: downloadError } = await supabase.storage
      .from("tracks")
      .download(track.key);

    if (downloadError || !audioData) {
      throw new Error(`Failed to download raw audio from storage: ${downloadError?.message || "No data"}`);
    }

    const inputExt = path.extname(track.key) || ".wav";
    const inputPath = path.join(tempDir, `input${inputExt}`);
    fs.writeFileSync(inputPath, Buffer.from(await audioData.arrayBuffer()));

    // 3. Extract metadata using FFmpeg info output
    await broadcastProgress(trackId, 20, "Extracting audio metadata...");
    let durationMs = 0;
    let bpm: number | null = null;

    try {
      // FFmpeg outputs info to stderr when running without an output target
      await execAsync(`"${ffmpegPath}" -i "${inputPath}"`);
    } catch (metadataError: any) {
      if (metadataError.stderr) {
        const metadata = parseMetadataFromStderr(metadataError.stderr);
        durationMs = metadata.durationMs;
        bpm = metadata.bpm;
      }
    }

    if (durationMs === 0) {
      // Set a generic 3-minute fallback if extraction failed to prevent crashes
      durationMs = 180000;
    }

    // 4. Transcode to 128kbps MP3
    await broadcastProgress(trackId, 30, "Transcoding to 128kbps MP3...");
    const mp3128Path = path.join(tempDir, "128k.mp3");
    await execAsync(`"${ffmpegPath}" -i "${inputPath}" -b:a 128k -y "${mp3128Path}"`);

    // 5. Transcode to 320kbps MP3
    await broadcastProgress(trackId, 50, "Transcoding to 320kbps MP3...");
    const mp3320Path = path.join(tempDir, "320k.mp3");
    await execAsync(`"${ffmpegPath}" -i "${inputPath}" -b:a 320k -y "${mp3320Path}"`);

    // 6. Transcode to Lossless FLAC
    await broadcastProgress(trackId, 70, "Transcoding to lossless FLAC...");
    const flacPath = path.join(tempDir, "lossless.flac");
    await execAsync(`"${ffmpegPath}" -i "${inputPath}" -y "${flacPath}"`);

    // 7. Segment into HLS (.m3u8 + .ts chunks)
    await broadcastProgress(trackId, 80, "Segmenting audio for HLS streaming...");
    const hlsOutputDir = path.join(tempDir, "hls");
    fs.mkdirSync(hlsOutputDir, { recursive: true });
    const playlistPath = path.join(hlsOutputDir, "playlist.m3u8");
    
    await execAsync(
      `"${ffmpegPath}" -i "${inputPath}" -c:a aac -b:a 192k -vn -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${hlsOutputDir}/segment_%03d.ts" -y "${playlistPath}"`
    );

    // 8. Upload files to public 'streams' bucket
    await broadcastProgress(trackId, 90, "Uploading processed assets to storage...");
    
    // Upload standard tracks
    const uploadFile = async (localPath: string, key: string, contentType: string) => {
      const fileBuffer = fs.readFileSync(localPath);
      const { error } = await supabase.storage.from("streams").upload(key, fileBuffer, {
        contentType,
        upsert: true,
        cacheControl: "public, max-age=31536000, immutable",
      });
      if (error) throw error;
    };

    const mp3128Key = `tracks/${trackId}/128k.mp3`;
    const mp3320Key = `tracks/${trackId}/320k.mp3`;
    const flacKey = `tracks/${trackId}/lossless.flac`;

    await uploadFile(mp3128Path, mp3128Key, "audio/mpeg");
    await uploadFile(mp3320Path, mp3320Key, "audio/mpeg");
    await uploadFile(flacPath, flacKey, "audio/flac");

    // Upload HLS playlist and ts segments
    const hlsFiles = fs.readdirSync(hlsOutputDir);
    for (const filename of hlsFiles) {
      const filePath = path.join(hlsOutputDir, filename);
      const isPlaylist = filename.endsWith(".m3u8");
      const key = `tracks/${trackId}/hls/${filename}`;
      const contentType = isPlaylist ? "application/x-mpegURL" : "video/MP2T";
      
      await uploadFile(filePath, key, contentType);
    }

    const { data: publicPlaylistData } = supabase.storage
      .from("streams")
      .getPublicUrl(`tracks/${trackId}/hls/playlist.m3u8`);
    
    const hlsPlaylistUrl = publicPlaylistData.publicUrl;

    // 9. Resize cover art if present
    if (track.coverArtUrl) {
      await broadcastProgress(trackId, 95, "Resizing cover art...");
      try {
        // coverArtUrl should contain the path inside the covers bucket, or we can check if it is a full URL
        const coverKey = track.coverArtUrl.includes("/covers/")
          ? track.coverArtUrl.split("/covers/")[1]
          : track.coverArtUrl;

        // Download raw cover art
        const { data: coverData, error: coverError } = await supabase.storage
          .from("covers")
          .download(coverKey);

        if (!coverError && coverData) {
          const coverBuffer = Buffer.from(await coverData.arrayBuffer());
          
          // Resize to 500x500 and 1500x1500 px
          const cover500 = await sharp(coverBuffer).resize(500, 500).jpeg({ quality: 90 }).toBuffer();
          const cover1500 = await sharp(coverBuffer).resize(1500, 1500).jpeg({ quality: 95 }).toBuffer();

          // Upload resized covers
          const key500 = `tracks/${trackId}/500x500.jpg`;
          const key1500 = `tracks/${trackId}/1500x1500.jpg`;

          await supabase.storage.from("covers").upload(key500, cover500, {
            contentType: "image/jpeg",
            upsert: true,
            cacheControl: "public, max-age=31536000, immutable",
          });

          await supabase.storage.from("covers").upload(key1500, cover1500, {
            contentType: "image/jpeg",
            upsert: true,
            cacheControl: "public, max-age=31536000, immutable",
          });

          // Update coverArtUrl in DB to point to the standard 500x500 public image
          const { data: publicCoverData } = supabase.storage.from("covers").getPublicUrl(key500);
          await prisma.track.update({
            where: { id: trackId },
            data: { coverArtUrl: publicCoverData.publicUrl },
          });
        }
      } catch (coverArtError) {
        logger.warn("Failed to resize cover art during transcoding, skipping...", { trackId, coverArtError });
      }
    }

    // 10. Update DB record to published
    await prisma.track.update({
      where: { id: trackId },
      data: {
        status: "published",
        durationMs,
        bpm: bpm || track.bpm,
        hlsPlaylistUrl,
        audioFiles: {
          mp3_128: mp3128Key,
          mp3_320: mp3320Key,
          flac: flacKey,
        },
      },
    });

    await broadcastProgress(trackId, 100, "Track published successfully!");
    logger.info(`Transcoding pipeline completed successfully for track ${trackId}`);

    // 11. Send success email notification to artist
    if (track.artist?.email) {
      await sendEmailNotification(
        track.artist.email,
        `Your track "${track.title}" is published!`,
        `
        <div style="background-color: #0b0f19; color: #f3f4f6; font-family: sans-serif; padding: 40px; border-radius: 8px;">
          <h2 style="color: #6366f1; font-weight: bold;">Ekororo Artist Portal</h2>
          <p>Hi ${track.artist.displayName || track.artist.username},</p>
          <p>We are excited to let you know that your track <strong>"${track.title}"</strong> has finished processing and is now published!</p>
          <p>Listeners can now stream your song in high quality HLS audio, or download it in MP3/FLAC formats according to your track settings.</p>
          <hr style="border-color: #1f2937; margin: 30px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} Ekoro. All rights reserved.</p>
        </div>
        `
      );
    }

  } catch (error: any) {
    logger.error(`Failed to process track ${trackId}`, error);
    
    // Set status to failed
    try {
      await prisma.track.update({
        where: { id: trackId },
        data: { status: "failed" },
      });
      await broadcastProgress(trackId, 0, `Transcoding failed: ${error.message}`);
    } catch (dbError) {
      logger.error("Failed to mark track status as failed in database", dbError);
    }

    // Send failure email notification to artist
    try {
      const track = await prisma.track.findUnique({
        where: { id: trackId },
        include: { artist: true },
      });
      if (track?.artist?.email) {
        await sendEmailNotification(
          track.artist.email,
          `Failed to process your track "${track.title}"`,
          `
          <div style="background-color: #0b0f19; color: #f3f4f6; font-family: sans-serif; padding: 40px; border-radius: 8px;">
            <h2 style="color: #ef4444; font-weight: bold;">Ekororo Artist Portal</h2>
            <p>Hi ${track.artist.displayName || track.artist.username},</p>
            <p>We encountered an error while processing your track <strong>"${track.title}"</strong>.</p>
            <p style="color: #fca5a5;">Error details: ${error.message || "Unknown encoding error"}</p>
            <p>Please check that your upload file is a valid audio file (WAV, FLAC, MP3, etc.) and try uploading again.</p>
            <hr style="border-color: #1f2937; margin: 30px 0;" />
            <p style="color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} Ekoro. All rights reserved.</p>
          </div>
          `
        );
      }
    } catch (notifyError) {
      logger.error("Failed to notify artist of transcoding failure", notifyError);
    }

  } finally {
    // Cleanup temporary files
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (cleanupError) {
      logger.warn(`Failed to clean up temp dir ${tempDir}`, cleanupError);
    }
  }
}
