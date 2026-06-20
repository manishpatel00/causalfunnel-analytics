import { AnimatedFeatures } from "@/components/AnimatedFeatures";

export default function DemoPage() {
  return (
    <>
      {/* Tracker script — injected via next/script below */}
      <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-white/10 relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-dot-pattern opacity-50 pointer-events-none" />

        {/* Nav */}
        <nav className="sticky top-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-white/20 bg-white/5 flex items-center justify-center shadow-sm">
              <span className="text-white text-xs font-bold tracking-tighter">CF</span>
            </div>
            <span className="font-semibold text-white tracking-tight">CausalFunnel</span>
          </div>
          <div className="hidden md:flex gap-6 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="/dashboard" className="hover:text-white transition-colors">Docs</a>
            <a href="/dashboard" className="hover:text-white transition-colors">Blog</a>
          </div>
          <a
            href="#signup"
            className="bg-white text-black text-sm font-medium px-4 py-2 rounded-md hover:bg-zinc-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)]"
          >
            Deploy Now
          </a>
        </nav>

        {/* Hero */}
        <section className="relative max-w-6xl mx-auto px-6 pt-32 pb-24 text-center z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />
          <span className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-zinc-300 text-xs font-medium px-3 py-1 rounded-full mb-8 shadow-sm backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
            Tracking demo · Clicks &amp; page views are being recorded
          </span>
          <h1 className="text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 mb-8 tracking-tighter leading-tight drop-shadow-sm">
            Turn anonymous visitors<br />into revenue
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 mb-12 max-w-2xl mx-auto font-medium">
            Cookie-agnostic AI that predicts intent and personalizes CTAs — proven
            across 300M+ sessions annually.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="#signup"
              id="cta-primary"
              className="bg-white text-black px-8 py-3 rounded-md text-sm font-medium hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center"
            >
              Start For Free
            </a>
            <a
              href="#demo"
              id="cta-secondary"
              className="bg-white/5 text-white px-8 py-3 rounded-md text-sm font-medium border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all shadow-sm flex items-center justify-center backdrop-blur-sm"
            >
              Read Docs
            </a>
          </div>
        </section>

        {/* Feature cards */}
        <section id="features" className="relative max-w-6xl mx-auto px-6 pb-32 z-10">
          <AnimatedFeatures />
        </section>

        {/* Pricing section */}
        <section id="pricing" className="relative bg-zinc-950 border-t border-white/10 py-32 z-10">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">Predictable pricing</h2>
            <p className="text-zinc-400 mb-16 text-lg">Start free. Scale securely.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { name: "Hobby", price: "$0", events: "10K events/mo", id: "plan-starter" },
                { name: "Pro", price: "$20", events: "500K events/mo", id: "plan-growth", highlight: true },
                { name: "Enterprise", price: "Custom", events: "Unlimited", id: "plan-enterprise" },
              ].map((p) => (
                <div
                  key={p.id}
                  id={p.id}
                  className={`rounded-lg p-8 border text-left backdrop-blur-md ${p.highlight
                      ? "border-white bg-white/5 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                      : "border-white/10 bg-black shadow-sm"
                    }`}
                >
                  <div className="text-sm font-semibold text-zinc-300 mb-2">{p.name}</div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-bold text-white tracking-tight">{p.price}</span>
                    {p.name !== "Enterprise" && <span className="text-zinc-500 text-sm">/ mo</span>}
                  </div>
                  <div className="text-sm text-zinc-400 mb-8 pb-8 border-b border-white/10">{p.events}</div>
                  <a
                    href="/dashboard"
                    className={`block w-full py-2.5 rounded-md text-center text-sm font-medium transition-all ${p.highlight
                        ? "bg-white text-black hover:bg-zinc-200 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                        : "bg-white/5 border border-white/10 text-white hover:border-white/20 hover:bg-white/10"
                      }`}
                  >
                    {p.name === "Enterprise" ? "Contact Sales" : "Get Started"}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer id="signup" className="relative bg-black border-t border-white/10 text-zinc-500 py-12 px-6 text-center text-sm z-10">
          <p>© 2026 CausalFunnel Inc.</p>
          <p className="mt-2 text-xs text-zinc-600">
            This page is instrumented with the CausalFunnel tracker.{" "}
            <a href="/dashboard" className="text-white hover:text-indigo-400 transition-colors font-medium">
              View Analytics →
            </a>
          </p>
        </footer>
      </div>

      {/* Inject tracker */}
      <script src="/tracker.js" async></script>
    </>
  );
}
