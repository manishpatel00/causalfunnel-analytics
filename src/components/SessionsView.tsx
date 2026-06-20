"use client";

import { useState, useEffect, useCallback } from "react";
import { SessionSummary, EventRecord } from "@/types";
import { motion } from "framer-motion";

// ── Formatters ───────────────────────────────────────────────────────────────
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ── Main component ────────────────────────────────────────────────────────────
type LoadState = "idle" | "loading" | "success" | "error" | "db_unavailable";

export default function SessionsView() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [sessionsState, setSessionsState] = useState<LoadState>("loading");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [eventsState, setEventsState] = useState<LoadState>("idle");
  const [search, setSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) {
          setErrorMsg(d.error ?? "Failed to load sessions");
          setSessionsState(
            d.error?.includes("Database") ? "db_unavailable" : "error"
          );
          return;
        }
        setSessions(d.data);
        setSessionsState("success");
      })
      .catch(() => {
        setErrorMsg("Network error — is the dev server running?");
        setSessionsState("error");
      });
  }, []);

  const loadEvents = useCallback(
    (sessionId: string) => {
      // Toggle off
      if (selectedId === sessionId) {
        setSelectedId(null);
        setEvents([]);
        setEventsState("idle");
        return;
      }

      setSelectedId(sessionId);
      setEventsState("loading");

      fetch(`/api/sessions/${encodeURIComponent(sessionId)}`)
        .then((r) => r.json())
        .then((d) => {
          if (!d.success) {
            setEventsState(
              d.error?.includes("Database") ? "db_unavailable" : "error"
            );
            return;
          }
          setEvents(d.data);
          setEventsState("success");
        })
        .catch(() => setEventsState("error"));
    },
    [selectedId]
  );

  const filtered = sessions.filter((s) =>
    s.session_id.toLowerCase().includes(search.toLowerCase().trim())
  );

  const showDbBanner =
    sessionsState === "db_unavailable" || eventsState === "db_unavailable";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex gap-6 h-full text-sm">
      
      {/* ── Left panel: Telemetry List ── */}
      <div className="w-[320px] flex-shrink-0 flex flex-col gap-4">
        {showDbBanner && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-amber-400">
            <h4 className="font-bold mb-1">Database Disconnected</h4>
            <p className="text-xs">Set MONGODB_URI in .env.local and restart.</p>
          </div>
        )}

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 shadow-xl flex flex-col h-[700px] backdrop-blur-md">
           
           <div className="mb-4">
              <input
                type="search"
                placeholder="Query session ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-sm px-4 py-2.5 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-black/50 text-white placeholder-zinc-600 font-mono"
              />
           </div>

           {/* States */}
           {sessionsState === "loading" && (
             <div className="flex justify-center py-12">
               <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
             </div>
           )}

           {sessionsState === "success" && filtered.length > 0 && (
             <div className="overflow-y-auto pr-2 space-y-2 pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
               {filtered.map((s, i) => (
                 <motion.button
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.05 }}
                   key={s.session_id}
                   onClick={() => loadEvents(s.session_id)}
                   className={`w-full text-left rounded-xl p-4 transition-all relative overflow-hidden group ${
                     selectedId === s.session_id
                       ? "bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)] border"
                       : "bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/5 border"
                   }`}
                 >
                   <div className="flex justify-between items-start mb-3 relative z-10">
                     <span className={`font-mono text-xs font-bold tracking-tight ${selectedId === s.session_id ? 'text-indigo-400' : 'text-zinc-300'}`}>
                       {s.session_id.slice(0, 12)}...
                     </span>
                     <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-600 bg-black px-2 py-0.5 rounded-full border border-white/5">
                       {timeAgo(s.last_seen)}
                     </span>
                   </div>

                   <div className="grid grid-cols-3 gap-2 text-center mb-2 relative z-10">
                     <div className="bg-black/50 rounded-lg p-1.5 border border-white/5">
                        <div className="text-zinc-500 text-[9px] uppercase tracking-wider mb-0.5">Events</div>
                        <div className="text-white font-bold">{s.total_events}</div>
                     </div>
                     <div className="bg-black/50 rounded-lg p-1.5 border border-white/5">
                        <div className="text-zinc-500 text-[9px] uppercase tracking-wider mb-0.5">Views</div>
                        <div className="text-white font-bold">{s.page_views}</div>
                     </div>
                     <div className="bg-black/50 rounded-lg p-1.5 border border-white/5">
                        <div className="text-zinc-500 text-[9px] uppercase tracking-wider mb-0.5">Clicks</div>
                        <div className="text-white font-bold">{s.clicks}</div>
                     </div>
                   </div>

                   <div className="flex justify-between text-[11px] text-zinc-500 font-medium relative z-10 px-1">
                      <span>Duration: {formatDuration(s.duration_seconds)}</span>
                      <span>{s.pages_visited.length} unique pages</span>
                   </div>
                 </motion.button>
               ))}
             </div>
           )}
        </div>
      </div>

      {/* ── Right panel: SVG Timeline ── */}
      <div className="flex-1 relative rounded-2xl border border-white/5 overflow-hidden bg-white/[0.01] shadow-2xl flex flex-col h-[700px] backdrop-blur-md group p-6">
        
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] mix-blend-screen pointer-events-none" />
        
        {eventsState === "idle" && (
          <div className="flex flex-col items-center justify-center flex-1 text-zinc-500 relative z-10">
            <div className="text-5xl mb-6 opacity-20">📈</div>
            <p className="text-sm font-bold tracking-widest uppercase text-zinc-400">Select a session</p>
            <p className="text-xs text-zinc-600 mt-2">To view detailed event telemetry</p>
          </div>
        )}

        {eventsState === "loading" && (
          <div className="flex items-center justify-center flex-1 relative z-10">
            <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
          </div>
        )}

        {eventsState === "success" && (
          <div className="flex flex-col h-full relative z-10">
            
            {/* Header */}
            <div className="flex items-end justify-between mb-8 pb-4 border-b border-white/10">
              <div>
                <h3 className="font-black text-white text-xl tracking-tight mb-1">Event Telemetry</h3>
                <p className="font-mono text-xs text-indigo-400 truncate max-w-sm">
                  ID: {selectedId}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 flex items-baseline gap-1.5">
                  <span className="font-bold text-white">{events.length}</span>
                  <span className="text-xs text-zinc-500 uppercase tracking-widest">events recorded</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="overflow-y-auto flex-1 pr-4 pl-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <div className="relative border-l-2 border-white/5 ml-3 space-y-8 py-4">
                
                {events.map((e, idx) => {
                  const isView = e.event_type === "page_view";
                  return (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={e._id}
                      className="relative pl-8 group/item"
                    >
                      {/* Timeline Node */}
                      <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-black flex items-center justify-center transition-transform group-hover/item:scale-125 shadow-[0_0_10px_rgba(0,0,0,0.5)] ${isView ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.5)]'}`}>
                      </div>

                      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:border-white/20 hover:bg-white/5 transition-all">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md ${isView ? 'bg-indigo-500/20 text-indigo-300' : 'bg-pink-500/20 text-pink-300'}`}>
                            {isView ? 'Page View' : 'Click'}
                          </span>
                          <span className="font-mono text-xs text-zinc-500">
                            {formatTime(e.timestamp)}
                          </span>
                        </div>
                        
                        <p className="text-sm font-medium text-white mb-1 truncate">{e.page_url}</p>
                        
                        {!isView && e.x !== undefined && (
                          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
                            <div className="flex flex-col">
                              <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold mb-0.5">Coordinates</span>
                              <span className="font-mono text-xs text-zinc-300">X: {e.x}, Y: {e.y}</span>
                            </div>
                            {e.viewport_width && (
                               <div className="flex flex-col border-l border-white/5 pl-4">
                                  <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold mb-0.5">Viewport</span>
                                  <span className="font-mono text-xs text-zinc-300">{e.viewport_width} × {e.viewport_height}</span>
                               </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
