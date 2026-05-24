"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Users, User, ArrowRight } from "lucide-react";

interface Artist {
  id: string;
  displayName: string | null;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
}

export default function FeaturedArtists() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFeaturedArtists() {
      try {
        const res = await fetch("/api/artists?suggested=true&limit=6");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            setArtists(data.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch featured artists:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchFeaturedArtists();
  }, []);

  const getAvatarUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
      return url;
    }
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${url}`;
  };

  return (
    <section style={{ padding: "32px 40px", borderTop: "1px solid var(--ek-border)" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "var(--ek-gold-dim)",
            border: "1px solid var(--ek-gold)33",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Users size={13} style={{ color: "var(--ek-gold)" }} />
        </div>
        <div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--ek-text-tertiary)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            RECOMMENDED
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 20,
              fontWeight: 400,
              letterSpacing: "-0.02em",
              color: "var(--ek-text-primary)",
              lineHeight: 1,
            }}
          >
            Suggested Artists
          </h2>
        </div>
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 16,
        }}
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  background: "var(--ek-raised)",
                  border: "1px solid var(--ek-border)",
                  borderRadius: 16,
                  padding: "24px 16px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div className="skeleton animate-pulse" style={{ width: 72, height: 72, borderRadius: "50%", marginBottom: 14 }} />
                <div className="skeleton animate-pulse" style={{ height: 14, width: "60%", marginBottom: 8 }} />
                <div className="skeleton animate-pulse" style={{ height: 10, width: "40%", marginBottom: 12 }} />
                <div className="skeleton animate-pulse" style={{ height: 8, width: "80%" }} />
              </div>
            ))
          : artists.map((artist) => (
              <Link href={`/artist/${artist.username}`} key={artist.id}>
                <div
                  className="artist-card"
                  style={{
                    background: "var(--ek-raised)",
                    border: "1px solid var(--ek-border)",
                    borderRadius: 16,
                    padding: "24px 16px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.25s var(--ease-out-expo)",
                    position: "relative",
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      overflow: "hidden",
                      background: "var(--ek-surface)",
                      border: "1.5px solid var(--ek-border-mid)",
                      position: "relative",
                      marginBottom: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {getAvatarUrl(artist.avatarUrl) ? (
                      <Image
                        src={getAvatarUrl(artist.avatarUrl)!}
                        alt={artist.displayName || artist.username}
                        fill
                        unoptimized
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <User size={32} style={{ color: "var(--ek-text-secondary)" }} />
                    )}
                  </div>

                  {/* Display Name */}
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--ek-text-primary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      width: "100%",
                    }}
                  >
                    {artist.displayName || artist.username}
                  </div>

                  {/* Username */}
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--ek-text-secondary)",
                      marginTop: 2,
                      marginBottom: 10,
                    }}
                  >
                    @{artist.username}
                  </div>

                  {/* Bio */}
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--ek-text-tertiary)",
                      lineHeight: 1.4,
                      height: 30,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      width: "100%",
                    }}
                  >
                    {artist.bio || "No bio yet."}
                  </div>

                  {/* Arrow indicator on hover */}
                  <div
                    className="view-profile-arrow"
                    style={{
                      position: "absolute",
                      bottom: 12,
                      right: 12,
                      opacity: 0,
                      transform: "translateX(-4px)",
                      transition: "all 0.2s ease",
                      color: "var(--ek-gold)",
                    }}
                  >
                    <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            ))}
      </div>
      <style jsx global>{`
        .artist-card:hover {
          transform: translateY(-4px);
          border-color: var(--ek-gold);
          box-shadow: 0 8px 24px rgba(201,168,76,0.06);
        }
        .artist-card:hover .view-profile-arrow {
          opacity: 1;
          transform: translateX(0);
        }
      `}</style>
    </section>
  );
}
