import React from "react";
import Image from "next/image";
import { Music } from "lucide-react";

interface PlaylistCoverProps {
  coverArtUrl?: string | null;
  tracks?: { track: { coverArtUrl?: string | null } }[];
  size?: number;
  className?: string;
}

export default function PlaylistCover({
  coverArtUrl,
  tracks = [],
  size = 120,
  className = "",
}: PlaylistCoverProps) {
  // 1. If explicit cover art is set, use it
  if (coverArtUrl) {
    return (
      <div
        className={`relative overflow-hidden rounded-lg bg-white/5 border border-white/10 flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={coverArtUrl}
          alt="Playlist Cover"
          fill
          unoptimized
          className="object-cover"
        />
      </div>
    );
  }

  // 2. Filter tracks that have valid cover art URLs
  const trackCovers = tracks
    .map((pt) => pt.track.coverArtUrl)
    .filter((cover): cover is string => !!cover);

  // 3. Fallback: If no tracks have covers, show standard placeholder
  if (trackCovers.length === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/30 flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <Music size={size * 0.35} />
      </div>
    );
  }

  // 4. If there are 1 to 3 covers, display the first one full-size
  if (trackCovers.length < 4) {
    return (
      <div
        className={`relative overflow-hidden rounded-lg bg-white/5 border border-white/10 flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={trackCovers[0]}
          alt="Playlist Cover"
          fill
          unoptimized
          className="object-cover"
        />
      </div>
    );
  }

  // 5. If 4 or more covers are present, generate a 2x2 grid collage
  return (
    <div
      className={`grid grid-cols-2 grid-rows-2 overflow-hidden rounded-lg bg-white/5 border border-white/10 flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {trackCovers.slice(0, 4).map((cover, idx) => (
        <div key={idx} className="relative w-full h-full">
          <Image
            src={cover}
            alt={`Track cover collage ${idx + 1}`}
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
