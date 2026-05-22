import React from "react";

export default function UploadPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-white">Upload New Track</h1>
        <p className="text-sm text-white/60">
          Add audio files to your catalog. Supported formats: MP3, WAV, FLAC.
        </p>
      </div>

      <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center hover:border-ekoro-gold/30 transition-all cursor-pointer">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/60 text-lg mb-4">
          ↑
        </div>
        <h3 className="font-semibold text-sm">Select files to upload</h3>
        <p className="text-xs text-white/40 mt-1">Or drag and drop files here</p>
      </div>
    </div>
  );
}
