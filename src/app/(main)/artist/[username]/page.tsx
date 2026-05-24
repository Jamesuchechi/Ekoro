import React from "react";
import { notFound } from "next/navigation";
import { ArtistService } from "@/services/ArtistService";
import { getSessionProfile } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import ArtistProfileClient from "@/components/Artist/ArtistProfileClient";

export default async function ArtistPage({
  params,
}: {
  params: { username: string };
}) {
  const username = decodeURIComponent(params.username);
  
  // 1. Fetch artist profile data from database
  const artist = await ArtistService.getDbArtistByUsername(username);
  if (!artist) {
    notFound();
  }

  // 2. Fetch popular tracks, current tracks page (discography), and albums
  const [popularTracks, tracksResult, albums, playlists, currentUser] = await Promise.all([
    ArtistService.getArtistPopularTracks(artist.id, 5),
    ArtistService.getArtistTracks(artist.id, 1, 10),
    ArtistService.getArtistAlbums(artist.id),
    
    // Fetch public playlists created by this user
    prisma.playlist.findMany({
      where: {
        userId: artist.id,
        isPublic: true,
      },
      include: {
        playlistTracks: {
          include: {
            track: {
              select: {
                coverArtUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    
    // Get currently logged-in user profile
    getSessionProfile(),
  ]);

  // 3. Determine if current user follows this artist
  let isFollowing = false;
  if (currentUser) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: artist.id,
        },
      },
    });
    isFollowing = !!follow;
  }

  return (
    <ArtistProfileClient
      artist={artist}
      popularTracks={popularTracks}
      tracksResult={tracksResult}
      albums={albums}
      playlists={playlists}
      currentUser={currentUser}
      isFollowing={isFollowing}
    />
  );
}
