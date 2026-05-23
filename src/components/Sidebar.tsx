"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  Flame,
  Mic2,
  Radio,
  Heart,
  ListMusic,
  Download,
  Coins,
  Music,
  ChevronRight,
} from "lucide-react";

const PRIMARY_NAV = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/explore?trending=true", label: "Trending", icon: Flame },
  { href: "/explore?artists=true", label: "Artists", icon: Mic2 },
  { href: "/explore?live=true", label: "Live sessions", icon: Radio },
];

const LIBRARY_NAV = [
  { href: "/library/liked", label: "Liked tracks", icon: Heart },
  { href: "/library/playlists", label: "Playlists", icon: ListMusic },
  { href: "/library/downloads", label: "Downloads", icon: Download },
  { href: "/library/supported", label: "Supported artists", icon: Coins },
];

const GENRES = [
  { label: "Afrobeats", emoji: "🌍" },
  { label: "Hip-hop", emoji: "🎤" },
  { label: "R&B / Soul", emoji: "💿" },
  { label: "Highlife", emoji: "🎷" },
  { label: "Dancehall", emoji: "🎶" },
  { label: "Gospel", emoji: "✝️" },
  { label: "Jazz", emoji: "🎹" },
];

const FOLLOWING = [
  { name: "Wizkid", initials: "WZ", isOnline: true, note: "New EP out", color: "#c9a84c" },
  { name: "Davido", initials: "DV", isOnline: false, note: "Timeless", color: "#5b8dee" },
  { name: "Tems", initials: "TM", isOnline: true, note: "3 new tracks", color: "#4caf7d" },
  { name: "Rema", initials: "RM", isOnline: false, note: "Live tonight", color: "#a855f7" },
];

interface SidebarItemProps {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
}

function SidebarItem({ href, label, icon: Icon, isActive }: SidebarItemProps) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: isActive ? 500 : 400,
        color: isActive ? "var(--ek-text-primary)" : "var(--ek-text-secondary)",
        background: isActive ? "var(--ek-surface)" : "transparent",
        border: isActive ? "1px solid var(--ek-border)" : "1px solid transparent",
        textDecoration: "none",
        transition: "all 0.15s ease",
        letterSpacing: "-0.01em",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLAnchorElement).style.color = "var(--ek-text-primary)";
          (e.currentTarget as HTMLAnchorElement).style.background = "var(--ek-surface)22";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLAnchorElement).style.color = "var(--ek-text-secondary)";
          (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
        }
      }}
    >
      <Icon
        size={14}
        style={{
          color: isActive ? "var(--ek-gold)" : "var(--ek-text-muted)",
          flexShrink: 0,
        }}
      />
      {label}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 9,
        fontWeight: 500,
        color: "var(--ek-text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        padding: "0 10px",
        marginTop: 24,
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 220,
        flexShrink: 0,
        height: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        background: "var(--ek-ink)",
        borderRight: "1px solid var(--ek-border)",
        padding: "20px 12px 100px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Primary nav */}
      <SectionLabel>Browse</SectionLabel>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {PRIMARY_NAV.map(({ href, label, icon }) => (
          <SidebarItem
            key={href}
            href={href}
            label={label}
            icon={icon}
            isActive={pathname === href || (href !== "/" && pathname?.startsWith(href.split("?")[0]))}
          />
        ))}
      </nav>

      {/* Library */}
      <SectionLabel>Your library</SectionLabel>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {LIBRARY_NAV.map(({ href, label, icon }) => (
          <SidebarItem
            key={href}
            href={href}
            label={label}
            icon={icon}
            isActive={pathname === href}
          />
        ))}
      </nav>

      {/* Following */}
      <SectionLabel>Following</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {FOLLOWING.map((artist) => (
          <div
            key={artist.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "7px 10px",
              borderRadius: 8,
              cursor: "pointer",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLDivElement).style.background = "var(--ek-surface)22")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLDivElement).style.background = "transparent")
            }
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: artist.color + "22",
                border: `1px solid ${artist.color}44`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                fontWeight: 500,
                color: artist.color,
                flexShrink: 0,
                position: "relative",
              }}
            >
              {artist.initials}
              {artist.isOnline && (
                <span
                  style={{
                    position: "absolute",
                    bottom: -1,
                    right: -1,
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "var(--ek-green)",
                    border: "1.5px solid var(--ek-ink)",
                  }}
                />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--ek-text-secondary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {artist.name}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  color: "var(--ek-text-muted)",
                  letterSpacing: "0.04em",
                }}
              >
                {artist.note}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Genres */}
      <SectionLabel>Genres</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {GENRES.map((genre) => (
          <button
            key={genre.label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "7px 10px",
              borderRadius: 8,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--ek-text-secondary)",
              fontSize: 13,
              fontFamily: "var(--font-body)",
              textAlign: "left",
              transition: "all 0.15s ease",
              letterSpacing: "-0.01em",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--ek-text-primary)";
              (e.currentTarget as HTMLButtonElement).style.background = "var(--ek-surface)22";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--ek-text-secondary)";
              (e.currentTarget as HTMLButtonElement).style.background = "none";
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13 }}>{genre.emoji}</span>
              {genre.label}
            </span>
            <ChevronRight size={11} style={{ color: "var(--ek-text-muted)" }} />
          </button>
        ))}
      </div>

      {/* Upgrade banner */}
      <div
        style={{
          marginTop: 24,
          background: "var(--ek-gold-glow)",
          border: "1px solid var(--ek-gold)22",
          borderRadius: 12,
          padding: "14px 14px",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            color: "var(--ek-gold)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          Ekoro Pro
        </div>
        <p
          style={{
            fontSize: 11,
            color: "var(--ek-text-secondary)",
            lineHeight: 1.5,
            marginBottom: 10,
          }}
        >
          FLAC lossless, offline downloads, no ads.
        </p>
        <Link
          href="/pricing"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            fontWeight: 600,
            color: "var(--ek-gold)",
            textDecoration: "none",
          }}
        >
          Upgrade now <ChevronRight size={11} />
        </Link>
      </div>
    </aside>
  );
}
