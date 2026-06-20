"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const SessionsView = dynamic(() => import("@/components/SessionsView"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center py-16">
      <div className="animate-spin w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full" />
    </div>
  ),
});

const HeatmapView = dynamic(() => import("@/components/HeatmapView"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center py-16">
      <div className="animate-spin w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full" />
    </div>
  ),
});

type Tab = "sessions" | "heatmap";

interface Stats {
  total_sessions: number;
  total_events: number;
  total_clicks: number;
}

const STAT_CARDS = [
  { key: "total_sessions" as const, label: "Total Sessions", icon: (
    <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
  ) },
  { key: "total_events" as const, label: "Total Events", icon: (
    <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
  ) },
  { key: "total_clicks" as const, label: "Total Clicks", icon: (
    <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
  ) },
];

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("sessions");
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (res.ok) {
        window.location.reload();
      } else {
        alert("Failed to load sample data.");
      }
    } catch (e) {
      console.error(e);
      alert("Error loading sample data.");
    } finally {
      setIsSeeding(false);
    }
  };

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        const s = (d.data as Array<{ total_events: number; clicks: number }>).reduce(
          (acc, sess) => ({
            total_sessions: acc.total_sessions + 1,
            total_events: acc.total_events + sess.total_events,
            total_clicks: acc.total_clicks + sess.clicks,
          }),
          { total_sessions: 0, total_events: 0, total_clicks: 0 }
        );
        setStats(s);
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100 selection:bg-white/10 relative">
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-zinc-800 sticky top-0 z-20 shadow-sm relative">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-white/20 bg-white/5 flex items-center justify-center select-none shadow-sm">
              <span className="text-white text-xs font-bold tracking-tighter">CF</span>
            </div>
            <div className="leading-tight flex items-baseline gap-2">
              <span className="font-semibold text-white tracking-tight">CausalFunnel</span>
              <span className="text-zinc-500 text-sm font-medium">Analytics</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className={`text-xs px-3 py-1.5 rounded-md transition-all font-medium border ${
                isSeeding
                  ? "bg-zinc-900 text-zinc-500 border-zinc-800 cursor-not-allowed"
                  : "bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10 hover:border-white/20 shadow-sm"
              }`}
            >
              {isSeeding ? "Loading..." : "Load Sample Data"}
            </button>
            <a
              href="/demo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-white text-black px-3 py-1.5 rounded-md hover:bg-zinc-200 transition-all font-medium shadow-[0_0_10px_rgba(255,255,255,0.2)] flex items-center gap-1"
            >
              Open Demo <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {STAT_CARDS.map((card) => (
            <div
              key={card.key}
              className="bg-black/50 backdrop-blur-md rounded-lg border border-zinc-800 p-6 shadow-sm flex flex-col"
            >
              <div className="flex items-center gap-2 mb-4">
                {card.icon}
                <div className="text-sm font-medium text-zinc-400">{card.label}</div>
              </div>
              {statsLoading ? (
                <div className="h-8 w-24 bg-zinc-800 rounded-md animate-pulse" />
              ) : (
                <div className="text-3xl font-bold text-white tabular-nums tracking-tight">
                  {(stats?.[card.key] ?? 0).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Tab switcher */}
        <div className="flex bg-zinc-900/50 backdrop-blur-md p-1 rounded-lg w-fit border border-zinc-800 relative z-10">
          {(
            [
              { key: "sessions" as Tab, label: "Sessions" },
              { key: "heatmap" as Tab, label: "Heatmap" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                tab === t.key
                  ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* View */}
        <div className="relative z-10">
          {tab === "sessions" && <SessionsView />}
          {tab === "heatmap" && <HeatmapView />}
        </div>
      </div>
    </div>
  );
}
