import React from "react";
import { notFound } from "next/navigation";
import { PlaylistService } from "@/services/PlaylistService";
import { getSessionProfile } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import PlaylistDetailClient from "@/components/Playlist/PlaylistDetailClient";
import { Lock } from "lucide-react";

export default async function PlaylistPage({ params }: { params: { id: string } }) {
  const playlist = await PlaylistService.getPlaylist(params.id);
  const currentUser = await getSessionProfile();

  if (!playlist) {
    notFound();
  }

  const isOwner = currentUser?.id === playlist.userId;

  // Security check: If playlist is private and user is not the owner
  if (!playlist.isPublic && !isOwner) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-full bg-ek-red/10 border border-ek-red/20 flex items-center justify-center text-ek-red mb-4">
          <Lock size={24} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Private Playlist</h1>
        <p className="text-sm text-ek-text-secondary max-w-sm">
          This playlist is set to private and can only be viewed by its owner.
        </p>
      </div>
    );
  }

  // Check if current user is following the playlist
  let isFollowing = false;
  if (currentUser) {
    const follow = await prisma.playlistFollow.findUnique({
      where: {
        playlistId_userId: {
          playlistId: playlist.id,
          userId: currentUser.id,
        },
      },
    });
    isFollowing = !!follow;
  }

  return (
    <PlaylistDetailClient
      playlist={playlist}
      currentUser={currentUser}
      isFollowing={isFollowing}
    />
  );
}
