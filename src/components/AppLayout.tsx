"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Player from "@/components/Player/Player";

// Auth-only routes that render without chrome
const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.includes(pathname ?? "");

  if (isAuthPage) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--ek-void)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        background: "var(--ek-void)",
      }}
    >
      {/* Sticky top nav */}
      <Navbar />

      {/* Body: sidebar + scrollable main */}
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          // Reserve space at bottom for fixed player
          paddingBottom: 0,
        }}
      >
        {/* Sidebar — hidden on mobile via CSS */}
        <div
          className="sidebar-container"
          style={{
            display: "flex",
            flexShrink: 0,
          }}
        >
          <Sidebar />
        </div>

        {/* Main scrollable content */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            // extra bottom padding so last content is never hidden behind player
            paddingBottom: 80,
            scrollbarWidth: "thin",
            scrollbarColor: "var(--ek-border-mid) transparent",
          }}
        >
          {children}
        </main>
      </div>

      {/* Fixed bottom audio player */}
      <Player />
    </div>
  );
}
