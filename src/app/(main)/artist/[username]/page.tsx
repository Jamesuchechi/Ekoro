import React from "react";

export default function ArtistProfilePage({ params }: { params: { username: string } }) {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-6 py-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-ekoro-blue to-purple-600 flex items-center justify-center text-2xl font-extrabold text-white">
          {params.username.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            @{params.username}
          </h1>
          <p className="text-sm text-white/60">Artist Profile</p>
        </div>
      </div>
    </div>
  );
}
