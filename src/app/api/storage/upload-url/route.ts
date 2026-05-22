import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase/server";
import { withApiRoute, ApiError } from "@/lib/api-helpers";
import * as z from "zod";

const uploadUrlSchema = z.object({
  bucket: z.enum(["audio", "images"]),
  filename: z.string().min(1),
  contentType: z.string().min(1),
});

export const POST = withApiRoute(async (req: Request) => {
  // 1. Authenticate user
  const user = await getSessionUser();
  if (!user) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required to upload files");
  }

  // 2. Validate request body
  const body = await req.json().catch(() => ({}));
  const { bucket, filename, contentType } = uploadUrlSchema.parse(body);

  // 3. Perform file type validation
  if (bucket === "images") {
    const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedImageTypes.includes(contentType)) {
      throw new ApiError(
        400,
        "INVALID_FILE_TYPE",
        "Only JPEG, PNG, WEBP, and GIF images are allowed"
      );
    }
  } else if (bucket === "audio") {
    const allowedAudioTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/x-wav",
      "audio/ogg",
      "audio/flac",
      "audio/aac",
      "audio/mp4",
      "audio/x-m4a"
    ];
    if (!allowedAudioTypes.includes(contentType)) {
      throw new ApiError(
        400,
        "INVALID_FILE_TYPE",
        "Only MP3, WAV, OGG, FLAC, and M4A audio files are allowed"
      );
    }
  }

  // 4. Generate unique key / path: users/{userId}/{uuid}-{filename}
  const fileExtension = filename.split(".").pop() || "";
  const uniqueId = crypto.randomUUID();
  const filePath = `${user.id}/${uniqueId}.${fileExtension}`;

  // 5. Connect to Supabase Storage client
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(filePath);

  if (error) {
    throw new ApiError(
      500,
      "STORAGE_ERROR",
      `Failed to generate upload URL: ${error.message}`
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      signedUrl: data.signedUrl,
      path: filePath,
      token: data.token,
    },
  });
});
