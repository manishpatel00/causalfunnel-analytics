"use client";

import { useState, useEffect, MouseEvent } from "react";
import dynamic from "next/dynamic";
import { motion, useMotionValue, useTransform, animate, useSpring } from "framer-motion";

const SessionsView = dynamic(() => import("@/components/SessionsView"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
    </div>
  ),
});

const HeatmapView = dynamic(() => import("@/components/HeatmapView"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
    </div>
  ),
});

type Tab = "sessions" | "heatmap";

interface Stats {
  total_sessions: number;
  total_events: number;
  total_clicks: number;
}

// ── Animated Counter Component ────────────────────────────────────────────────
function AnimatedCounter({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString());

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.5, ease: "easeOut" });
    return controls.stop;
  }, [value, count]);

  return <motion.span>{rounded}</motion.span>;
}

// ── Icons & Config ─────────────────────────────────────────────────────────────
const STAT_CARDS = [
  { 
    key: "total_sessions" as const, 
    label: "Total Sessions", 
    description: "The complete number of unique user journeys tracked across your application environment.",
    color: "from-indigo-500 to-purple-500", 
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
  },
  { 
    key: "total_events" as const, 
    label: "Total Events", 
    description: "All distinct interactions, including page views, clicks, and custom actions recorded globally.",
    color: "from-blue-500 to-cyan-500", 
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
  },
  { 
    key: "total_clicks" as const, 
    label: "Total Clicks", 
    description: "Precise coordinate-mapped mouse clicks tracked across all pages for heatmap generation.",
    color: "from-pink-500 to-rose-500", 
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
  },
];

// ── Next.js Style Stat Card ───────────────────────────────────────────────────
function StatCard({ card, stats, statsLoading }: { card: typeof STAT_CARDS[0], stats: Stats | null, statsLoading: boolean }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  }

  // Create a raw motion template string so it perfectly follows the cursor
  const background = useTransform(
    [mouseX, mouseY],
    ([x, y]) => `radial-gradient(400px circle at ${x}px ${y}px, rgba(255,255,255,0.06), transparent 40%)`
  );

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="group relative flex flex-col bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors shadow-xl"
    >
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100 rounded-2xl z-20"
        style={{ background }}
      />
      
      {/* Graphic Area (Top 60%) */}
      <div className="h-48 relative border-b border-white/5 bg-black flex flex-col items-center justify-center overflow-hidden">
        {/* Subtle decorative grid/nodes SVG in the background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.15]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
             <defs>
               <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                 <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,1)" strokeWidth="0.5"/>
               </pattern>
             </defs>
             <rect width="100%" height="100%" fill="url(#smallGrid)" />
             {/* Center decorative wireframe lines */}
             <path d="M 0 50 L 500 50" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" strokeDasharray="4 4"/>
             <path d="M 0 150 L 500 150" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" strokeDasharray="4 4"/>
          </svg>
        </div>

        {/* Glow behind the number based on card color */}
        <div className={`absolute w-32 h-32 rounded-full bg-gradient-to-br ${card.color} opacity-10 blur-[40px] group-hover:opacity-30 transition-opacity duration-700`} />
        
        {/* The huge stat number */}
        {statsLoading ? (
          <div className="h-12 w-24 bg-white/5 rounded-md animate-pulse z-10" />
        ) : (
          <div className="text-[4rem] font-black text-transparent bg-clip-text bg-white tabular-nums tracking-tighter z-10 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] leading-none">
            <AnimatedCounter value={stats?.[card.key] ?? 0} />
          </div>
        )}
      </div>

      {/* Text Content Area (Bottom 40%) */}
      <div className="p-6 flex flex-col justify-center bg-[#0a0a0a] z-10">
        <h3 className="font-bold text-white text-[1.1rem] mb-1 tracking-tight flex items-center gap-2">
           <span className="opacity-50">{card.icon}</span> {card.label}
        </h3>
        <p className="text-[#a1a1aa] text-[15px] leading-relaxed">{card.description}</p>
      </div>
    </div>
  );
}

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
    <div className="min-h-screen bg-black font-sans text-zinc-100 selection:bg-indigo-500/30 overflow-x-hidden relative">
      
      {/* Core Background with Next.js specific radial mask to fade out grid edges */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />

      {/* Header */}
      <header className="bg-black/60 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <span className="text-indigo-400 text-xs font-bold tracking-tighter">CF</span>
            </div>
            <div className="leading-tight flex items-baseline gap-2">
              <span className="font-bold text-white tracking-tight text-lg">CausalFunnel</span>
              <span className="text-zinc-500 text-sm font-medium tracking-wide uppercase">Analytics Engine</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className={`text-xs px-4 py-2 rounded-md transition-all font-medium border ${
                isSeeding
                  ? "bg-zinc-900 text-zinc-500 border-zinc-800 cursor-not-allowed"
                  : "bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10 hover:border-white/30"
              }`}
            >
              {isSeeding ? "Loading Data..." : "Seed Database"}
            </button>
            <a
              href="/demo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-white text-black px-4 py-2 rounded-md hover:bg-zinc-200 transition-all font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-1.5"
            >
              Open Live Demo <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6 relative z-10">
        
        {/* Next.js Bento Grid - Standalone Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {STAT_CARDS.map((card) => (
            <StatCard key={card.key} card={card} stats={stats} statsLoading={statsLoading} />
          ))}
        </div>

        {/* Analytical Interface Frame */}
        <div className="border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[800px] bg-black/40 backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)]">
          
          {/* Tab Switcher Bar - Clean Next.js style */}
          <div className="flex border-b border-white/5 bg-white/[0.01] p-3 gap-2">
            {(
              [
                { key: "sessions" as Tab, label: "Session Explorer" },
                { key: "heatmap" as Tab, label: "Heatmap Analytics" },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-6 py-2 rounded-md text-sm font-semibold transition-all relative ${
                  tab === t.key
                    ? "text-white bg-white/10 shadow-sm border border-white/10"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* View Container */}
          <div className="flex-1 overflow-hidden p-6 relative">
             <div className="relative z-10 w-full h-full">
                {tab === "sessions" && <SessionsView />}
                {tab === "heatmap" && <HeatmapView />}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
