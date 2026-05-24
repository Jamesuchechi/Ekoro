import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/lib/auth-helpers";
import sharp from "sharp";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Init admin Supabase client to upload resized avatar
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/users/me/avatar
 * Uploads, validates, resizes, and saves the user avatar image.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const profile = await getSessionProfile();
    if (!profile) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // 2. Parse Multipart form-data
    const formData = await request.formData();
    const avatarFile = formData.get("avatar") as File | null;

    if (!avatarFile) {
      return NextResponse.json({ error: "Avatar image file is required" }, { status: 400 });
    }

    // 3. Image file type validation
    const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedImageTypes.includes(avatarFile.type)) {
      return NextResponse.json(
        { error: "Invalid image type. Only JPEG, PNG, and WEBP are supported." },
        { status: 400 }
      );
    }

    // 4. File size validation (max 10MB)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (avatarFile.size > maxSizeBytes) {
      return NextResponse.json(
        { error: "Avatar image is too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // 5. Convert File to Buffer and resize to standard 250x250 square using sharp
    const fileBuffer = Buffer.from(await avatarFile.arrayBuffer());
    const resizedBuffer = await sharp(fileBuffer)
      .resize(250, 250, { fit: "cover" })
      .jpeg({ quality: 90 })
      .toBuffer();

    // 6. Upload resized image to public 'avatars' bucket
    const timestamp = Date.now();
    const avatarKey = `${profile.id}/avatar-${timestamp}.jpg`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(avatarKey, resizedBuffer, {
        contentType: "image/jpeg",
        upsert: true,
        cacheControl: "public, max-age=31536000, immutable",
      });

    if (uploadError) {
      throw new Error(`Failed to upload avatar to storage: ${uploadError.message}`);
    }

    // 7. Get public URL of avatar
    const { data: publicUrlData } = supabaseAdmin.storage
      .from("avatars")
      .getPublicUrl(avatarKey);

    const publicAvatarUrl = publicUrlData.publicUrl;

    // 8. Update database user record
    const updatedUser = await prisma.user.update({
      where: { id: profile.id },
      data: {
        avatarUrl: publicAvatarUrl,
      },
    });

    return NextResponse.json({
      success: true,
      avatarUrl: updatedUser.avatarUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to upload avatar image" },
      { status: 500 }
    );
  }
}
