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
    return await prisma.user.findUnique({
      where: { id: user.id },
    });
  } catch (error) {
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
