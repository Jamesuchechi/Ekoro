import React from "react";

export default function TrackPage({ params }: { params: { slug: string } }) {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-white">Track</h1>
        <p className="text-sm text-white/60">Viewing track info for: {params.slug}</p>
      </div>
    </div>
  );
}
