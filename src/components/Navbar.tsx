"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Disc3, Bell, Settings, ChevronDown, LogOut, LayoutDashboard, X } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Discover" },
  { href: "/explore", label: "Explore" },
  { href: "/explore?trending=true", label: "Trending" },
];

export default function Navbar() {
  const { user, profile, isLoading } = useAuthStore();
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch search suggestions with debouncing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions(null);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}&limit=3`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error("Suggestions fetch error:", err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
      setSearchOpen(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setProfileOpen(false);
    router.refresh();
    router.push("/");
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        height: 56,
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: 0,
        background: scrolled
          ? "rgba(8, 8, 8, 0.94)"
          : "rgba(8, 8, 8, 0.8)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: scrolled
          ? "1px solid var(--ek-border-mid)"
          : "1px solid var(--ek-border)",
        transition: "background 0.3s ease, border-color 0.3s ease",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          textDecoration: "none",
          marginRight: 36,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "linear-gradient(135deg, var(--ek-gold) 0%, #8B6914 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Disc3 size={16} style={{ color: "#0f0f0f" }} />
        </div>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 20,
            fontWeight: 400,
            letterSpacing: "-0.02em",
            color: "var(--ek-text-primary)",
          }}
        >
          Ek<span style={{ color: "var(--ek-gold)", fontStyle: "italic" }}>oro</span>
        </span>
      </Link>

      {/* Nav links */}
      <nav style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
        {NAV_LINKS.map(({ href, label }) => {
          const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href.split("?")[0]));
          return (
            <Link
              key={href}
              href={href}
              style={{
                padding: "6px 14px",
                borderRadius: 99,
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
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.color = "var(--ek-text-secondary)";
                }
              }}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {/* Search */}
        <div ref={searchRef} style={{ position: "relative" }}>
          <form
            onSubmit={handleSearchSubmit}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: searchOpen ? "var(--ek-surface)" : "transparent",
              border: `1px solid ${searchOpen ? "var(--ek-border-hi)" : "var(--ek-border)"}`,
              borderRadius: 99,
              padding: searchOpen ? "6px 14px 6px 12px" : "6px 10px",
              width: searchOpen ? 220 : 36,
              height: 34,
              overflow: searchOpen ? "visible" : "hidden",
              transition: "all 0.25s var(--ease-out-expo)",
              cursor: searchOpen ? "text" : "pointer",
            }}
            onClick={() => !searchOpen && setSearchOpen(true)}
          >
            <Search
              size={14}
              style={{
                color: searchOpen ? "var(--ek-text-secondary)" : "var(--ek-text-muted)",
                flexShrink: 0,
                cursor: "pointer",
              }}
              onClick={(e) => {
                if (searchOpen) {
                  handleSearchSubmit(e);
                } else {
                  setSearchOpen(true);
                }
              }}
            />
            {searchOpen && (
              <>
                <input
                  autoFocus
                  type="text"
                  placeholder="Search tracks, artists…"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontSize: 13,
                    color: "var(--ek-text-primary)",
                    fontFamily: "var(--font-body)",
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSearchOpen(false); setSearchQuery(""); }}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: "var(--ek-text-muted)",
                    cursor: "pointer",
                    display: "flex",
                    flexShrink: 0,
                  }}
                >
                  <X size={13} />
                </button>
              </>
            )}
          </form>

          {/* Suggestions Dropdown */}
          {searchOpen && showSuggestions && suggestions && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: 320,
                background: "var(--ek-surface)",
                border: "1px solid var(--ek-border-mid)",
                borderRadius: 12,
                padding: "8px 0",
                boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                zIndex: 100,
                maxHeight: 400,
                overflowY: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Tracks suggestions */}
              {suggestions.tracks && suggestions.tracks.length > 0 ? (
                <div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: "var(--ek-text-tertiary)", padding: "4px 12px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Tracks</div>
                  {suggestions.tracks.map((track: any) => (
                    <Link
                      key={track.id}
                      href={`/track/${track.id}`}
                      onClick={() => { setShowSuggestions(false); setSearchOpen(false); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "6px 12px",
                        textDecoration: "none",
                        color: "var(--ek-text-primary)",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ek-raised)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <Image src={track.cover} alt={track.title} width={28} height={28} style={{ borderRadius: 4, objectFit: "cover", flexShrink: 0 }} unoptimized />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</div>
                        <div style={{ fontSize: 10, color: "var(--ek-text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.artist}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null}

              {/* Artists suggestions */}
              {suggestions.artists && suggestions.artists.length > 0 ? (
                <div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: "var(--ek-text-tertiary)", padding: "4px 12px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Artists</div>
                  {suggestions.artists.map((artist: any) => (
                    <Link
                      key={artist.id}
                      href={`/artist/${encodeURIComponent(artist.name)}`}
                      onClick={() => { setShowSuggestions(false); setSearchOpen(false); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "6px 12px",
                        textDecoration: "none",
                        color: "var(--ek-text-primary)",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ek-raised)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <Image src={artist.image} alt={artist.name} width={28} height={28} style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} unoptimized />
                      <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{artist.name}</div>
                    </Link>
                  ))}
                </div>
              ) : null}

              {/* Playlists suggestions */}
              {suggestions.playlists && suggestions.playlists.length > 0 ? (
                <div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: "var(--ek-text-tertiary)", padding: "4px 12px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Playlists</div>
                  {suggestions.playlists.map((playlist: any) => (
                    <Link
                      key={playlist.id}
                      href={`/playlist/${playlist.id}`}
                      onClick={() => { setShowSuggestions(false); setSearchOpen(false); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "6px 12px",
                        textDecoration: "none",
                        color: "var(--ek-text-primary)",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ek-raised)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <Image src={playlist.cover} alt={playlist.title} width={28} height={28} style={{ borderRadius: 4, objectFit: "cover", flexShrink: 0 }} unoptimized />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{playlist.title}</div>
                        <div style={{ fontSize: 10, color: "var(--ek-text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>by {playlist.creator}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null}

              {/* See all trigger */}
              {((suggestions.tracks && suggestions.tracks.length > 0) ||
                (suggestions.artists && suggestions.artists.length > 0) ||
                (suggestions.playlists && suggestions.playlists.length > 0)) && (
                <div style={{ borderTop: "1px solid var(--ek-border)", marginTop: 4, paddingTop: 4 }}>
                  <Link
                    href={`/explore?q=${encodeURIComponent(searchQuery)}`}
                    onClick={() => { setShowSuggestions(false); setSearchOpen(false); }}
                    style={{
                      display: "block",
                      textAlign: "center",
                      fontSize: 11,
                      fontWeight: 500,
                      color: "var(--ek-gold)",
                      padding: "6px 12px",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                  >
                    See all results for &ldquo;{searchQuery}&rdquo;
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bell */}
        <button
          style={{
            width: 34,
            height: 34,
            borderRadius: 99,
            background: "transparent",
            border: "1px solid var(--ek-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--ek-text-muted)",
            cursor: "pointer",
            transition: "all 0.15s ease",
            position: "relative",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--ek-border-mid)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--ek-text-secondary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--ek-border)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--ek-text-muted)";
          }}
        >
          <Bell size={14} />
          {/* Notification dot */}
          <span
            style={{
              position: "absolute",
              top: 7,
              right: 7,
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "var(--ek-red)",
              border: "1.5px solid var(--ek-ink)",
            }}
          />
        </button>

        {/* Auth state */}
        {isLoading ? (
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "var(--ek-surface)",
              animation: "shimmer 1.5s infinite",
            }}
          />
        ) : profile ? (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: profileOpen ? "var(--ek-surface)" : "transparent",
                border: `1px solid ${profileOpen ? "var(--ek-border-mid)" : "var(--ek-border)"}`,
                borderRadius: 99,
                padding: "4px 10px 4px 4px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  overflow: "hidden",
                  background: "linear-gradient(135deg, var(--ek-gold) 0%, #5b8dee 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 500,
                  color: "#0f0f0f",
                  flexShrink: 0,
                  position: "relative",
                }}
              >
                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt={profile.displayName || "User"}
                    fill
                    sizes="26px"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  (profile.displayName || profile.username || "U").slice(0, 2).toUpperCase()
                )}
              </div>

              <div style={{ textAlign: "left" }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--ek-text-primary)",
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                  }}
                >
                  {(profile.displayName || profile.username || "").split(" ")[0]}
                </div>
                {profile.plan && profile.plan !== "free" && (
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 9,
                      color: "var(--ek-gold)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {profile.plan.replace("_", " ")}
                  </div>
                )}
              </div>
              <ChevronDown
                size={12}
                style={{
                  color: "var(--ek-text-muted)",
                  transform: profileOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              />
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  background: "var(--ek-ink)",
                  border: "1px solid var(--ek-border-mid)",
                  borderRadius: 12,
                  padding: "6px",
                  width: 200,
                  boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
                  animation: "fadeUp 0.15s ease",
                  zIndex: 50,
                }}
              >
                <div
                  style={{
                    padding: "8px 12px 10px",
                    borderBottom: "1px solid var(--ek-border)",
                    marginBottom: 4,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ek-text-primary)" }}>
                    {profile.displayName || profile.username}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ek-text-tertiary)", marginTop: 1 }}>
                    {user?.email}
                  </div>
                </div>

                {profile.role === "artist" && (
                  <button
                    onClick={() => { router.push("/dashboard"); setProfileOpen(false); }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "none",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: 8,
                      fontSize: 13,
                      color: "var(--ek-text-secondary)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.1s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "var(--ek-surface)";
                      (e.currentTarget as HTMLButtonElement).style.color = "var(--ek-text-primary)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "none";
                      (e.currentTarget as HTMLButtonElement).style.color = "var(--ek-text-secondary)";
                    }}
                  >
                    <LayoutDashboard size={14} />
                    Creator dashboard
                  </button>
                )}

                <button
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "none",
                    border: "none",
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "var(--ek-text-secondary)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.1s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "var(--ek-surface)";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--ek-text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "none";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--ek-text-secondary)";
                  }}
                >
                  <Settings size={14} />
                  Settings
                </button>

                <div style={{ height: 1, background: "var(--ek-border)", margin: "4px 0" }} />

                <button
                  onClick={handleSignOut}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "none",
                    border: "none",
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "var(--ek-red)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.1s ease",
                    opacity: 0.85,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(224,85,85,0.1)";
                    (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "none";
                    (e.currentTarget as HTMLButtonElement).style.opacity = "0.85";
                  }}
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <Link
              href="/login"
              style={{
                padding: "7px 16px",
                borderRadius: 99,
                fontSize: 13,
                color: "var(--ek-text-secondary)",
                border: "1px solid transparent",
                transition: "color 0.15s ease",
                letterSpacing: "-0.01em",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--ek-text-primary)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--ek-text-secondary)")}
            >
              Sign in
            </Link>
            <Link
              href="/register"
              style={{
                padding: "7px 18px",
                borderRadius: 99,
                fontSize: 13,
                fontWeight: 500,
                color: "#0f0f0f",
                background: "var(--ek-gold)",
                transition: "all 0.15s ease",
                letterSpacing: "-0.01em",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#d4af5a")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "var(--ek-gold)")}
            >
              Get started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
