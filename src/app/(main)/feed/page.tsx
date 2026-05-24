import React from "react";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth-helpers";
import { SocialService } from "@/services/SocialService";
import SocialFeedClient from "@/components/Social/SocialFeedClient";

export default async function FeedPage() {
  const currentUser = await getSessionProfile();

  if (!currentUser) {
    redirect("/login");
  }

  // Fetch first page of social feed server-side
  const feedResult = await SocialService.getSocialFeed(currentUser.id, 1, 10);

  // Serialize Prisma Date objects to strings so they can cross the server→client boundary
  const serializedFeed = {
    ...feedResult,
    tracks: feedResult.tracks.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      playCount: t.playCount.toString(),
    })),
  };

  return (
    <SocialFeedClient
      initialFeed={serializedFeed}
      currentUserId={currentUser.id}
    />
  );
}
