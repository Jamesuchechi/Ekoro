import type { Metadata } from "next";
import "./globals.css";
import AppLayout from "@/components/AppLayout";

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
      <body className="antialiased selection:bg-ekoro-gold selection:text-ekoro-blue-dark bg-ekoro-dark text-white min-h-screen">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
