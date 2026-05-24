import React from "react";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth-helpers";
import { PlaylistService } from "@/services/PlaylistService";
import LibraryPlaylistsClient from "@/components/Playlist/LibraryPlaylistsClient";

export default async function LibraryPlaylistsPage() {
  const currentUser = await getSessionProfile();
  
  if (!currentUser) {
    redirect("/login");
  }

  // Fetch playlists owned by user
  const userPlaylists = await PlaylistService.getUserPlaylists(currentUser.id);

  // Fetch followed playlists
  const followedPlaylists = await PlaylistService.getFollowedPlaylists(currentUser.id);

  return (
    <LibraryPlaylistsClient
      userPlaylists={userPlaylists}
      followedPlaylists={followedPlaylists}
    />
  );
}
