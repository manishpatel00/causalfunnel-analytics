"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ClickPoint } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

const REFERENCE_W = 1440;
const REFERENCE_H = 900;
const MAX_CANVAS_W = 1200;
const MAX_CANVAS_H = 600;

type RenderMode = "density" | "scatter";
type Status = "idle" | "loading" | "success" | "error" | "db_unavailable";

// ── Canvas renderer ──────────────────────────────────────────────────────────
function drawHeatmap(canvas: HTMLCanvasElement, clicks: ClickPoint[], mode: RenderMode) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, W, H);

  // --- DRAW BLUEPRINT GRID ---
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  ctx.lineWidth = 1;

  const gridSize = 50;
  
  // Draw vertical lines
  for (let x = 0; x <= W; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
    
    // Add coordinate labels every 4 grid lines
    if (x % (gridSize * 4) === 0 && x > 0) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.font = "9px monospace";
      ctx.fillText(`X:${x}`, x + 5, H - 5);
    }
  }

  // Draw horizontal lines
  for (let y = 0; y <= H; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();

    if (y % (gridSize * 4) === 0 && y > 0) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.font = "9px monospace";
      ctx.fillText(`Y:${y}`, 5, y - 5);
    }
  }
  // ---------------------------
  
  if (clicks.length === 0) return;

  if (mode === "density") {
    // Advanced Density Blob Pass
    ctx.globalCompositeOperation = "lighter";
    clicks.forEach((pt) => {
      const vw = pt.viewport_width ?? REFERENCE_W;
      const vh = pt.viewport_height ?? REFERENCE_H;
      const x = (pt.x / vw) * W;
      const y = (pt.y / vh) * H;
      const radius = Math.max(30, Math.min(80, W / 20)); // Larger blobs for modern look

      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      // High-end Google-style color scale
      grad.addColorStop(0, "rgba(239, 68, 68, 0.4)");    // Red core
      grad.addColorStop(0.3, "rgba(249, 115, 22, 0.2)"); // Orange mid
      grad.addColorStop(0.6, "rgba(59, 130, 246, 0.1)"); // Blue outer
      grad.addColorStop(1, "rgba(0,0,0,0)");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  } else {
    // Precision Scatter Pass
    ctx.globalCompositeOperation = "source-over";
    clicks.forEach((pt) => {
      const vw = pt.viewport_width ?? REFERENCE_W;
      const vh = pt.viewport_height ?? REFERENCE_H;
      const x = (pt.x / vw) * W;
      const y = (pt.y / vh) * H;

      // Draw outer glowing ring
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(167, 139, 250, 0.2)";
      ctx.fill();

      // Draw sharp inner dot
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
    });
  }
}

// ── Component ────────────────────────────────────────────────────────────────
export default function HeatmapView() {
  const [pages, setPages] = useState<string[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>("");
  const [clicks, setClicks] = useState<ClickPoint[]>([]);
  const [pagesStatus, setPagesStatus] = useState<Status>("loading");
  const [heatmapStatus, setHeatmapStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [renderMode, setRenderMode] = useState<RenderMode>("density");
  const [showControls, setShowControls] = useState(true);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load available pages once
  useEffect(() => {
    fetch("/api/pages")
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) {
          setErrorMsg(d.error ?? "Failed to load pages");
          setPagesStatus(d.error?.includes("Database") ? "db_unavailable" : "error");
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
          setHeatmapStatus(d.error?.includes("Database") ? "db_unavailable" : "error");
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

  // Redraw canvas whenever clicks or renderMode changes
  useEffect(() => {
    if (!canvasRef.current) return;
    drawHeatmap(canvasRef.current, clicks, renderMode);
  }, [clicks, renderMode]);

  const isLoading = pagesStatus === "loading" || heatmapStatus === "loading";
  const showDbBanner = pagesStatus === "db_unavailable" || heatmapStatus === "db_unavailable";

  return (
    <div className="flex gap-6 h-full text-sm w-full">
      
      {/* ── Left Sidebar Analytics ── */}
      <div className="w-[320px] flex-shrink-0 flex flex-col gap-4">
        {showDbBanner && (
           <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-amber-400">
             <h4 className="font-bold mb-1">Database Disconnected</h4>
             <p className="text-xs">Set MONGODB_URI in .env.local and restart.</p>
           </div>
        )}
        
        {errorMsg && !showDbBanner && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
            {errorMsg}
          </div>
        )}

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 shadow-xl flex-1 backdrop-blur-md flex flex-col h-[700px]">
          <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Heatmap Analytics</h3>
          
          <div className="space-y-6">
            <div>
              <p className="text-zinc-500 text-xs font-semibold mb-1 uppercase">Total Datapoints</p>
              <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-purple-500">
                {clicks.length.toLocaleString()}
              </div>
            </div>

            <div className="w-full h-px bg-white/10" />

            <div>
              <p className="text-zinc-500 text-xs font-semibold mb-3 uppercase">Active Target Page</p>
              <select
                value={selectedPage}
                onChange={(e) => setSelectedPage(e.target.value)}
                className="w-full appearance-none bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              >
                {pages.length === 0 && <option value="">No pages available</option>}
                {pages.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="w-full h-px bg-white/10" />

            <div>
               <p className="text-zinc-500 text-xs font-semibold mb-3 uppercase">Legend</p>
               <div className="flex items-center gap-3 mb-2">
                 <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                 <span className="text-zinc-300">High Density</span>
               </div>
               <div className="flex items-center gap-3">
                 <div className="w-4 h-4 rounded-full bg-blue-500 opacity-50" />
                 <span className="text-zinc-300">Low Density</span>
               </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Main Canvas Area ── */}
      <div className="flex-1 relative rounded-2xl border border-white/5 overflow-hidden bg-white/[0.01] shadow-2xl group flex flex-col h-[700px] backdrop-blur-md">
        
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10 mix-blend-screen pointer-events-none" />

        {/* Floating Controls Overlay */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
           <button 
             onClick={() => setRenderMode("density")}
             className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all backdrop-blur-md ${renderMode === "density" ? "bg-indigo-500/80 text-white border border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]" : "bg-black/50 text-zinc-400 border border-white/10 hover:bg-white/10"}`}
           >
             Density Map
           </button>
           <button 
             onClick={() => setRenderMode("scatter")}
             className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all backdrop-blur-md ${renderMode === "scatter" ? "bg-purple-500/80 text-white border border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]" : "bg-black/50 text-zinc-400 border border-white/10 hover:bg-white/10"}`}
           >
             Scatter Plot
           </button>
        </div>

        {/* Loading Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
                <span className="text-indigo-400 font-bold uppercase tracking-widest text-xs">Computing Tensor Layers...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={MAX_CANVAS_W}
          height={MAX_CANVAS_H}
          className={`w-full h-full object-contain transition-opacity duration-500 ${isLoading ? 'opacity-30' : 'opacity-100'} ${renderMode === 'scatter' ? 'cursor-crosshair' : ''}`}
        />

        {/* Empty State */}
        {!isLoading && heatmapStatus !== "idle" && clicks.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 pointer-events-none">
            <div className="w-20 h-20 mb-4 opacity-30 grayscale text-6xl">📡</div>
            <p className="font-bold text-white text-lg tracking-tight">Awaiting Telemetry</p>
            <p className="text-sm mt-1 text-zinc-400">
              No click data found for this URL.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
