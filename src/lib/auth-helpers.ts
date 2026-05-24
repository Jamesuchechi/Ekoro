import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

/**
 * Retrieves the current authenticated Supabase user session on the server.
 */
export async function getSessionUser() {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch (error) {
    return null;
  }
}

/**
 * Retrieves the current user's profile from the public database.
 */
export async function getSessionProfile() {
  const user = await getSessionUser();
  if (!user) return null;

  try {
    let profile = await prisma.user.findUnique({
      where: { id: user.id },
    });

    // Auto-create/sync profile if it's missing in public.users
    if (!profile) {
      const email = user.email || "";
      const baseUsername = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      let username = `${baseUsername}_${randomSuffix}`;

      // Check if username already exists, loop until unique
      let exists = await prisma.user.findUnique({ where: { username } });
      while (exists) {
        const extraSuffix = Math.floor(1000 + Math.random() * 9000);
        username = `${baseUsername}_${extraSuffix}`;
        exists = await prisma.user.findUnique({ where: { username } });
      }

      let roleVal: UserRole = UserRole.listener;
      if (user.user_metadata?.role === "artist") roleVal = UserRole.artist;
      if (user.user_metadata?.role === "admin") roleVal = UserRole.admin;

      profile = await prisma.user.create({
        data: {
          id: user.id,
          email: email,
          username: username,
          displayName: user.user_metadata?.display_name || user.user_metadata?.full_name || baseUsername,
          avatarUrl: user.user_metadata?.avatar_url || null,
          role: roleVal,
          plan: "free",
          isVerified: false,
        },
      });
    }

    return profile;
  } catch (error) {
    console.error("Failed to fetch or self-heal user profile:", error);
    return null;
  }
}

/**
 * Validates that the active session matches one of the specified roles.
 * Throws an authentication or authorization error if validation fails.
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const profile = await getSessionProfile();
  
  if (!profile) {
    throw new Error("UNAUTHENTICATED");
  }

  if (!allowedRoles.includes(profile.role)) {
    throw new Error("UNAUTHORIZED");
  }

  return profile;
}
