"use server";

import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateProfileSchema = z.object({
  displayName: z.string().max(50).nullable().optional(),
  bio: z.string().max(250).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

/**
 * Server Action: Update profile details for the currently logged in user.
 */
export async function updateProfile(data: {
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
}) {
  try {
    const profile = await getSessionProfile();
    if (!profile) {
      throw new Error("UNAUTHENTICATED");
    }

    const parsedData = updateProfileSchema.parse(data);

    const updatedUser = await prisma.user.update({
      where: { id: profile.id },
      data: {
        displayName: parsedData.displayName,
        bio: parsedData.bio,
        avatarUrl: parsedData.avatarUrl,
      },
    });

    // Revalidate relevant pages to reflect changes instantly
    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard/settings");
    revalidatePath(`/artist/${profile.username}`);

    return {
      success: true,
      user: updatedUser,
    };
  } catch (error: any) {
    if (error.message === "UNAUTHENTICATED") {
      return { success: false, error: "Authentication required" };
    }
    return { success: false, error: error.message || "Failed to update profile" };
  }
}
