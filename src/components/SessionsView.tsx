"use client";

import { useState, useEffect, useCallback } from "react";
import { SessionSummary, EventRecord } from "@/types";

// ── Formatters ───────────────────────────────────────────────────────────────
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

// ── Sub-components ────────────────────────────────────────────────────────────
function EventTypeBadge({ type }: { type: "page_view" | "click" }) {
  if (type === "page_view") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-sm bg-zinc-100 text-zinc-600 border border-zinc-200">
        👁 page_view
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-sm bg-zinc-100 text-zinc-600 border border-zinc-200">
      🖱 click
    </span>
  );
}

function DbBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
      <span className="text-amber-500 text-lg leading-none">⚠️</span>
      <div>
        <p className="font-medium text-amber-800">MongoDB not connected</p>
        <p className="text-amber-700 mt-0.5">{message}</p>
      </div>
    </div>
  );
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
    <div className="space-y-4">
      {showDbBanner && (
        <DbBanner message='Set MONGODB_URI in .env.local and restart the server.' />
      )}

      {sessionsState === "error" && !showDbBanner && (
        <div className="bg-red-950/30 border border-red-900/50 rounded-xl px-4 py-3 text-sm text-red-200">
          {errorMsg}
        </div>
      )}

      <div className="flex gap-6 h-full">
        {/* ── Left panel: session list ── */}
        <div className="w-96 flex-shrink-0 flex flex-col gap-3">
          {/* Search */}
          <input
            type="search"
            placeholder="Filter by session ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-zinc-950 placeholder-zinc-500 text-zinc-100 shadow-sm"
          />

          {/* States */}
          {sessionsState === "loading" && (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-zinc-500 border-t-transparent rounded-full" />
            </div>
          )}

          {sessionsState === "success" && filtered.length === 0 && (
            <div className="text-center py-16 text-zinc-500">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-sm font-medium">
                {search ? "No sessions match your filter" : "No sessions yet"}
              </p>
              {!search && (
                <p className="text-xs mt-1">
                  Visit the{" "}
                  <a href="/demo" target="_blank" className="text-zinc-100 underline font-medium">
                    demo page
                  </a>{" "}
                  to generate events.
                </p>
              )}
            </div>
          )}

          {sessionsState === "success" && filtered.length > 0 && (
            <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-320px)] pr-1">
              {filtered.map((s) => (
                <button
                  key={s.session_id}
                  onClick={() => loadEvents(s.session_id)}
                  className={`w-full text-left rounded-md p-4 border transition-all ${
                    selectedId === s.session_id
                      ? "border-zinc-500 bg-zinc-800 shadow-sm"
                      : "border-zinc-700 bg-zinc-900 hover:border-zinc-600 hover:shadow-sm"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-[11px] text-zinc-400 truncate max-w-[170px]">
                      {s.session_id}
                    </span>
                    <span className="text-[11px] text-zinc-500 ml-2 flex-shrink-0">
                      {timeAgo(s.last_seen)}
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs text-zinc-400">
                    <span>
                      <span className="font-medium text-zinc-100">{s.total_events}</span>{" "}
                      events
                    </span>
                    <span>
                      <span className="font-medium text-zinc-100">{s.page_views}</span>{" "}
                      views
                    </span>
                    <span>
                      <span className="font-medium text-zinc-100">{s.clicks}</span>{" "}
                      clicks
                    </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[11px] text-zinc-500">
                      {formatDuration(s.duration_seconds)}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      {s.pages_visited.length} page{s.pages_visited.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right panel: event journey ── */}
        <div className="flex-1 bg-zinc-900 rounded-lg border border-zinc-700 p-6 overflow-hidden flex flex-col shadow-sm">
          {eventsState === "idle" && (
            <div className="flex flex-col items-center justify-center flex-1 text-zinc-500">
              <div className="text-5xl mb-4 grayscale opacity-50">🗺️</div>
              <p className="text-sm font-medium">Select a session to view the user journey</p>
            </div>
          )}

          {eventsState === "loading" && (
            <div className="flex items-center justify-center flex-1">
              <div className="animate-spin w-6 h-6 border-2 border-zinc-500 border-t-transparent rounded-full" />
            </div>
          )}

          {(eventsState === "error" || eventsState === "db_unavailable") && (
            <div className="flex flex-col items-center justify-center flex-1 text-zinc-500">
              <div className="text-5xl mb-4">⚠️</div>
              <p className="text-sm">Failed to load events for this session.</p>
            </div>
          )}

          {eventsState === "success" && (
            <>
              {/* Journey header */}
              <div className="flex items-center justify-between mb-5 pb-5 border-b border-zinc-800">
                <div>
                  <h3 className="font-medium text-zinc-100">User Journey</h3>
                  <p className="font-mono text-[11px] text-zinc-500 mt-0.5 truncate max-w-xs">
                    {selectedId}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-zinc-800 text-zinc-300 px-3 py-1 rounded-md border border-zinc-700">
                    {events.length} events
                  </span>
                </div>
              </div>

              {/* Timeline */}
              <div className="overflow-y-auto flex-1 space-y-0.5 -mx-1 px-1">
                {events.map((e, idx) => (
                  <div
                    key={e._id}
                    className="flex items-start gap-3 py-2.5 border-b border-zinc-800 last:border-0 group hover:bg-zinc-800 rounded-md px-2 transition-colors"
                  >
                    {/* Step number */}
                    <div className="flex-shrink-0 w-5 h-5 rounded-sm bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center text-[10px] font-mono text-zinc-500 mt-0.5 transition-colors">
                      {idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <EventTypeBadge type={e.event_type} />
                        <span className="text-[11px] text-zinc-500">
                          {formatTime(e.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 truncate font-medium">{e.page_url}</p>
                      {e.event_type === "click" && e.x !== undefined && (
                        <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">
                          ({e.x}, {e.y})
                          {e.viewport_width
                            ? ` · ${e.viewport_width}×${e.viewport_height}`
                            : ""}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
