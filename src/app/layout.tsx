import type { Metadata } from "next";
import "./globals.css";
import AppLayout from "@/components/AppLayout";
import AuthInitializer from "@/components/AuthInitializer";
import QueryProvider from "@/components/QueryProvider";

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
        <QueryProvider>
          <AuthInitializer>
            <AppLayout>{children}</AppLayout>
          </AuthInitializer>
        </QueryProvider>
      </body>
    </html>
  );
}
