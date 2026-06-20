"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useAnimation, useInView } from "framer-motion";

const AnimatedBeam = ({ d, delay = 0, duration = 3 }: { d: string, delay?: number, duration?: number }) => {
  return (
    <>
      <path
        d={d}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="2"
        fill="transparent"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <motion.path
        d={d}
        stroke="url(#glowGradient)"
        strokeWidth="3"
        fill="transparent"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
          pathLength: [0, 1, 1],
          opacity: [0, 1, 0],
          pathOffset: [0, 0, 1]
        }}
        transition={{
          duration: duration,
          delay: delay,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </>
  );
};

export function AnimatedFeatures() {
  return (
    <div className="relative w-full max-w-5xl mx-auto py-20">
      
      {/* Desktop Animated Diagram */}
      <div className="hidden md:block relative w-full h-[600px]">
        {/* SVG Connections */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 1000 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0" />
              <stop offset="50%" stopColor="#818cf8" stopOpacity="1" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Left Path */}
          <AnimatedBeam d="M 500 120 C 500 300, 180 250, 180 400" delay={0} />
          {/* Center Path */}
          <AnimatedBeam d="M 500 120 C 500 300, 500 300, 500 400" delay={1} />
          {/* Right Path */}
          <AnimatedBeam d="M 500 120 C 500 300, 820 250, 820 400" delay={2} />
        </svg>

        {/* Central Top Node */}
        <div className="absolute left-1/2 top-[50px] -translate-x-1/2 z-10">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex flex-col items-center justify-center bg-black border border-white/20 rounded-xl px-8 py-6 shadow-2xl backdrop-blur-xl">
              <div className="flex gap-2 items-center mb-2">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">Powered By</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">CausalFunnel AI</h2>
            </div>
          </div>
        </div>

        {/* Bottom Nodes Container */}
        <div className="absolute top-[400px] left-0 w-full flex justify-between px-4 z-10">
          
          {/* Node 1 */}
          <div className="w-[300px] bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-white/30 transition-all shadow-xl group">
            <div className="w-10 h-10 rounded-lg border border-white/10 bg-black/50 flex items-center justify-center mb-4 group-hover:border-indigo-500/50 transition-colors">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h3 className="font-semibold text-white mb-2 tracking-tight">Intent Prediction</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">ML models trained per store predict purchase probability in real time.</p>
          </div>

          {/* Node 2 */}
          <div className="w-[300px] bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-white/30 transition-all shadow-xl group">
            <div className="w-10 h-10 rounded-lg border border-white/10 bg-black/50 flex items-center justify-center mb-4 group-hover:border-purple-500/50 transition-colors">
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <h3 className="font-semibold text-white mb-2 tracking-tight">Visitor Personas</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">Segment anonymous traffic without cookies or PII.</p>
          </div>

          {/* Node 3 */}
          <div className="w-[300px] bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-white/30 transition-all shadow-xl group">
            <div className="w-10 h-10 rounded-lg border border-white/10 bg-black/50 flex items-center justify-center mb-4 group-hover:border-pink-500/50 transition-colors">
              <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
            </div>
            <h3 className="font-semibold text-white mb-2 tracking-tight">Dynamic CTAs</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">Serve the right call-to-action at exactly the right moment.</p>
          </div>

        </div>
      </div>

      {/* Mobile Fallback */}
      <div className="md:hidden flex flex-col gap-6 px-6">
        <div className="relative group mx-auto mb-8">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl blur opacity-30"></div>
            <div className="relative flex flex-col items-center justify-center bg-black border border-white/20 rounded-xl px-8 py-6 shadow-2xl backdrop-blur-xl">
              <div className="flex gap-2 items-center mb-2">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">Powered By</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">CausalFunnel AI</h2>
            </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 shadow-xl">
          <div className="w-10 h-10 rounded-lg border border-white/10 bg-black/50 flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h3 className="font-semibold text-white mb-2">Intent Prediction</h3>
          <p className="text-sm text-zinc-400">ML models trained per store predict purchase probability in real time.</p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 shadow-xl">
          <div className="w-10 h-10 rounded-lg border border-white/10 bg-black/50 flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <h3 className="font-semibold text-white mb-2">Visitor Personas</h3>
          <p className="text-sm text-zinc-400">Segment anonymous traffic without cookies or PII.</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 shadow-xl">
          <div className="w-10 h-10 rounded-lg border border-white/10 bg-black/50 flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
          </div>
          <h3 className="font-semibold text-white mb-2">Dynamic CTAs</h3>
          <p className="text-sm text-zinc-400">Serve the right call-to-action at exactly the right moment.</p>
        </div>
      </div>
    </div>
  );
}
