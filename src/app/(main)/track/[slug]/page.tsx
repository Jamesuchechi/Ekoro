import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TrackDetailsClient from "@/components/track/TrackDetailsClient";

interface PageProps {
  params: {
    slug: string;
  };
}

/**
 * Generate dynamic SEO Metadata
 */
export async function generateMetadata({ params }: PageProps) {
  try {
    const track = await prisma.track.findUnique({
      where: { slug: params.slug },
      include: {
        artist: {
          select: {
            displayName: true,
            username: true,
          },
        },
      },
    });

    if (!track) {
      return {
        title: "Track Not Found | Ekoro",
        description: "The requested track could not be found on Ekoro.",
      };
    }

    const artistName = track.artist.displayName || track.artist.username;
    return {
      title: `${track.title} by ${artistName} | Ekoro`,
      description: `Listen to and support ${artistName}'s track "${track.title}" on Ekoro. Direct fan-to-artist connection and lossless streams.`,
    };
  } catch (error) {
    return {
      title: "Ekoro Music",
    };
  }
}

export default async function TrackPage({ params }: PageProps) {
  const { slug } = params;

  // 1. Fetch Track details from DB
  const track = await prisma.track.findUnique({
    where: { slug },
    include: {
      artist: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
        },
      },
    },
  });

  if (!track || track.status === "removed") {
    notFound();
  }

  // 2. Fetch related tracks (same genre, exclude current track)
  const relatedTracks = await prisma.track.findMany({
    where: {
      status: "published",
      genre: track.genre,
      id: { not: track.id },
    },
    take: 5,
    include: {
      artist: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  });

  // 3. Fetch likes count for the track
  const likesCount = await prisma.like.count({
    where: { trackId: track.id },
  });

  // Convert BigInt values to string representation for serialization
  const serializedTrack = {
    ...track,
    playCount: track.playCount.toString(),
    downloadCount: track.downloadCount.toString(),
  };

  const serializedRelatedTracks = relatedTracks.map((relTrack) => ({
    ...relTrack,
    playCount: relTrack.playCount.toString(),
    downloadCount: relTrack.downloadCount.toString(),
  }));

  return (
    <TrackDetailsClient
      track={serializedTrack}
      relatedTracks={serializedRelatedTracks}
      initialLikesCount={likesCount}
    />
  );
}
