import React from "react";

export default function PlaylistPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-white">Playlist</h1>
        <p className="text-sm text-white/60">Viewing playlist details for ID: {params.id}</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-white/40 text-sm">
        This playlist is empty or currently private.
      </div>
    </div>
  );
}
