import React from "react";

export default function AnalyticsPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-white">Creator Analytics</h1>
        <p className="text-sm text-white/60">
          Analyze play-event metrics, follower retention, and user demographics.
        </p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-64 flex items-center justify-center text-white/40 text-sm">
        [Plays Chart Visualization Placeholder]
      </div>
    </div>
  );
}
