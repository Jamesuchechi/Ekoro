import React from "react";
import { Coins, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function SupportedArtistsComingSoon() {
  return (
    <div className="p-6 max-w-4xl mx-auto min-h-[70vh] flex flex-col items-center justify-center space-y-6 text-center animate-page">
      <div className="relative">
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-ekoro-gold to-amber-500 blur opacity-30 animate-pulse" />
        <div className="relative w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-4xl">
          <Coins className="w-10 h-10 text-ekoro-gold" />
        </div>
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="text-3xl font-extrabold text-white font-display tracking-tight">
          Supported Artists
        </h1>
        <p className="text-sm text-white/50 leading-relaxed">
          Keep track of all the independent creators you have supported through subscriptions, direct digital purchases, and tips. This feature will go live as soon as our Stripe integrations are complete in Phase 3.
        </p>
      </div>

      <div className="pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-102 active:scale-98"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
}
