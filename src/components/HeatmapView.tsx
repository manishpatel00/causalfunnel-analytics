"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ClickPoint } from "@/types";

const REFERENCE_W = 1440;
const REFERENCE_H = 900;
const MAX_CANVAS_W = 1200;
const MAX_CANVAS_H = 600;

// ── Canvas renderer ──────────────────────────────────────────────────────────
function drawHeatmap(canvas: HTMLCanvasElement, clicks: ClickPoint[]) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#0f0f1a";
  ctx.fillRect(0, 0, W, H);

  if (clicks.length === 0) return;

  // Blob pass — additive compositing for density
  ctx.globalCompositeOperation = "lighter";
  clicks.forEach((pt) => {
    const vw = pt.viewport_width ?? REFERENCE_W;
    const vh = pt.viewport_height ?? REFERENCE_H;
    const x = (pt.x / vw) * W;
    const y = (pt.y / vh) * H;
    const radius = Math.max(24, Math.min(60, W / 30));

    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, "rgba(139, 92, 246, 0.28)");
    grad.addColorStop(0.45, "rgba(99, 102, 241, 0.12)");
    grad.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // Dot pass
  ctx.globalCompositeOperation = "source-over";
  clicks.forEach((pt) => {
    const vw = pt.viewport_width ?? REFERENCE_W;
    const vh = pt.viewport_height ?? REFERENCE_H;
    const x = (pt.x / vw) * W;
    const y = (pt.y / vh) * H;

    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fill();
  });

  // Count label
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.font = `11px ui-monospace, monospace`;
  ctx.fillText(`${clicks.length} clicks`, 10, H - 10);
}

// ── Component ────────────────────────────────────────────────────────────────
type Status = "idle" | "loading" | "success" | "error" | "db_unavailable";

export default function HeatmapView() {
  const [pages, setPages] = useState<string[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>("");
  const [clicks, setClicks] = useState<ClickPoint[]>([]);
  const [pagesStatus, setPagesStatus] = useState<Status>("loading");
  const [heatmapStatus, setHeatmapStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load available pages once
  useEffect(() => {
    fetch("/api/pages")
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) {
          setErrorMsg(d.error ?? "Failed to load pages");
          setPagesStatus(
            d.error?.includes("Database") ? "db_unavailable" : "error"
          );
          return;
        }
        setPages(d.data);
        if (d.data.length > 0) setSelectedPage(d.data[0]);
        setPagesStatus("success");
      })
      .catch(() => {
        setErrorMsg("Network error — is the dev server running?");
        setPagesStatus("error");
      });
  }, []);

  const loadHeatmap = useCallback((pageUrl: string) => {
    if (!pageUrl) return;
    setHeatmapStatus("loading");
    setErrorMsg("");

    fetch(`/api/heatmap?page_url=${encodeURIComponent(pageUrl)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) {
          setErrorMsg(d.error ?? "Failed to load heatmap");
          setHeatmapStatus(
            d.error?.includes("Database") ? "db_unavailable" : "error"
          );
          return;
        }
        setClicks(d.data);
        setHeatmapStatus("success");
      })
      .catch(() => {
        setErrorMsg("Network error");
        setHeatmapStatus("error");
      });
  }, []);

  // Auto-load when selectedPage changes
  useEffect(() => {
    if (selectedPage) loadHeatmap(selectedPage);
  }, [selectedPage, loadHeatmap]);

  // Redraw canvas whenever clicks change
  useEffect(() => {
    if (!canvasRef.current) return;
    drawHeatmap(canvasRef.current, clicks);
  }, [clicks]);

  const isLoading =
    pagesStatus === "loading" || heatmapStatus === "loading";
  const showDbBanner =
    pagesStatus === "db_unavailable" || heatmapStatus === "db_unavailable";

  return (
    <div className="space-y-5">
      {/* DB unavailable banner */}
      {showDbBanner && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
          <span className="text-amber-500 text-lg leading-none">⚠️</span>
          <div>
            <p className="font-medium text-amber-800">MongoDB not connected</p>
            <p className="text-amber-700 mt-0.5">
              Set <code className="bg-amber-100 px-1 rounded text-xs">MONGODB_URI</code> in{" "}
              <code className="bg-amber-100 px-1 rounded text-xs">.env.local</code> and restart{" "}
              <code className="bg-amber-100 px-1 rounded text-xs">npm run dev</code>.
            </p>
          </div>
        </div>
      )}

      {/* Generic error */}
      {errorMsg && !showDbBanner && (
        <div className="bg-red-950/30 border border-red-900/50 rounded-xl px-4 py-3 text-sm text-red-400">
          {errorMsg}
        </div>
      )}

      {/* Controls Container */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="w-full sm:w-1/2 md:w-1/3">
          <label className="block text-xs font-medium text-zinc-400 mb-2">Page URL</label>
          <div className="relative">
            <select
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
              className="w-full appearance-none bg-zinc-900 border border-zinc-800 text-white text-sm rounded-md pl-3 pr-10 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-600 shadow-sm"
            >
              {pages.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-zinc-900 p-1.5 rounded-lg border border-zinc-800 shadow-sm">
          <button
            onClick={() => loadHeatmap(selectedPage)}
            disabled={isLoading || !selectedPage}
            className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700 shadow-sm"
          >
            {isLoading ? "Generating..." : "Load heatmap"}
          </button>
          
          <div className="px-3 py-1 bg-zinc-800/50 rounded-md border border-zinc-700 flex items-baseline gap-1.5">
            <span className="font-bold text-white text-sm">{clicks.length}</span>
            <span className="text-xs text-zinc-400">clicks</span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative w-full aspect-video bg-black rounded-lg border border-zinc-800 overflow-hidden shadow-inner group">
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none mix-blend-screen" />
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="animate-spin w-8 h-8 border-2 border-zinc-600 border-t-transparent rounded-full" />
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={MAX_CANVAS_W}
          height={MAX_CANVAS_H}
          className="w-full h-full object-contain"
        />

        {/* Empty state — only show when not loading and no data */}
        {!isLoading && heatmapStatus !== "idle" && clicks.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500">
            <div className="w-16 h-16 mb-4 opacity-50 grayscale flex items-center justify-center text-3xl select-none">
              🔥
            </div>
            <p className="font-medium text-zinc-400">No clicks recorded for this page</p>
            <p className="text-xs mt-1 text-zinc-600">
              Visit the{" "}
              <a href="/demo" target="_blank" className="text-zinc-300 underline pointer-events-auto">demo page</a> and click around to generate data.
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-zinc-500 font-medium">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-violet-500" />
          High density
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-indigo-400 opacity-60" />
          Medium density
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-white opacity-75" />
          Individual click
        </div>
      </div>
    </div>
  );
}
