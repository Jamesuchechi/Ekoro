import React from "react";

export default function DashboardPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-white">Creator Dashboard</h1>
        <p className="text-sm text-white/60">
          Manage your music uploads, view play metrics, and check payouts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">Total Plays</h3>
          <p className="text-2xl font-bold mt-2">124.8K</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">Tracks Uploaded</h3>
          <p className="text-2xl font-bold mt-2">12</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">Monthly Revenue</h3>
          <p className="text-2xl font-bold mt-2 text-ekoro-gold">$412.50</p>
        </div>
      </div>
    </div>
  );
}
