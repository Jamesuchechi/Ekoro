"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Player from "@/components/Player/Player";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Paths that should not display the dashboard chrome
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  if (isAuthPage) {
    return <div className="min-h-screen bg-slate-950">{children}</div>;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Header Navigation */}
      <Navbar />

      {/* Core Page Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar />

        {/* Main content scroll pane */}
        <main className="flex-1 overflow-y-auto pb-24">
          {children}
        </main>
      </div>

      {/* Bottom Persistent Audio Player */}
      <Player />
    </div>
  );
}
