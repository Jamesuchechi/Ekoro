"use server";

import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

/**
 * Follow a user (inserts into public.follows table).
 */
export async function followUser(followingId: string) {
  try {
    const profile = await getSessionProfile();
    if (!profile) {
      return { success: false, error: "Not authenticated" };
    }

    if (profile.id === followingId) {
      return { success: false, error: "You cannot follow yourself" };
    }

    await prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: profile.id,
          followingId,
        },
      },
      create: {
        followerId: profile.id,
        followingId,
      },
      update: {},
    });

    revalidatePath("/artist");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to follow user" };
  }
}

/**
 * Unfollow a user (deletes from public.follows table).
 */
export async function unfollowUser(followingId: string) {
  try {
    const profile = await getSessionProfile();
    if (!profile) {
      return { success: false, error: "Not authenticated" };
    }

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: profile.id,
          followingId,
        },
      },
    });

    revalidatePath("/artist");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to unfollow user" };
  }
}
