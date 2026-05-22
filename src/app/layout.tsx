import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Player from "@/components/Player/Player";

export const metadata: Metadata = {
  title: "Ekoro — Music Streaming & Download Platform",
  description: "Stream, upload, discover, and support artists directly on Ekoro.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-ekoro-gold selection:text-ekoro-blue-dark bg-ekoro-dark text-white h-screen flex flex-col overflow-hidden">
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
      </body>
    </html>
  );
}
