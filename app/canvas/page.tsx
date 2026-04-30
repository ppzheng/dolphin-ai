"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

const canvasNodes = [
  { id: "c-sentiment", label: "Sentiment Detection", accent: "#22d3ee", icon: "◎", x:  90, y: -156, isInput: true  },
  { id: "c-social",    label: "Social Intelligence",  accent: "#fbbf24", icon: "⬡", x: 180, y:    0, isInput: true  },
  { id: "c-market",    label: "Market Selection",     accent: "#10b981", icon: "◈", x:  90, y:  156, isInput: true  },
  { id: "c-strategy",  label: "Strategy Engine",      accent: "#a78bfa", icon: "◇", x: -90, y:  156, isInput: false },
  { id: "c-execution", label: "Execution Module",     accent: "#f472b6", icon: "▷", x: -180, y:   0, isInput: false },
  { id: "c-risk",      label: "Risk Management",      accent: "#fb923c", icon: "◬", x: -90, y: -156, isInput: false },
];

const leftModules = [
  { id: "sentiment-d", label: "Sentiment Detection", sub: "NLP · Real-time",      accent: "#22d3ee", icon: "◎" },
  { id: "sentiment-m", label: "Sentiment Module",    sub: "Aggregated scoring",    accent: "#22d3ee", icon: "◉" },
  { id: "social",      label: "Social Intelligence", sub: "Twitter / Reddit",      accent: "#fbbf24", icon: "⬡" },
  { id: "market",      label: "Market Selection",    sub: "Asset filtering",       accent: "#10b981", icon: "◈" },
  { id: "strategy",    label: "Strategy Engine",     sub: "Signal generation",     accent: "#a78bfa", icon: "◇" },
  { id: "execution",   label: "Execution Module",    sub: "Order routing",         accent: "#f472b6", icon: "▷" },
  { id: "risk",        label: "Risk Management",     sub: "Stop-loss · Sizing",    accent: "#fb923c", icon: "◬" },
  { id: "datafeed",    label: "Data Feed",           sub: "OHLCV · On-chain",      accent: "#60a5fa", icon: "⊞" },
  { id: "custom",      label: "Create Custom Module",sub: "Build your own",        accent: "#4a3060", icon: "+" },
];

export default function Canvas() {
  const [zoom, setZoom] = useState(1.3);
  const [pan, setPan]   = useState({ x: 0, y: 0 });
  const isDragging  = useRef(false);
  const lastMouse   = useRef({ x: 0, y: 0 });
  const mainRef     = useRef<HTMLElement | null>(null);

  function onMouseDown(e: React.MouseEvent) {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    if (mainRef.current) mainRef.current.style.cursor = "grabbing";
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
  }
  function onMouseUp() {
    isDragging.current = false;
    if (mainRef.current) mainRef.current.style.cursor = "grab";
  }
  function changeZoom(delta: number) {
    setZoom(z => Math.max(0.6, Math.min(1.8, Math.round((z + delta) * 10) / 10)));
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "#07000f", color: "#e2d4f0" }}>

      {/* ── Top Nav ── */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 h-12 z-50" style={{ borderBottom: "1px solid #2d1b4e", background: "#09010f" }}>
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Image src="/logo.png" alt="Dolphin AI" width={22} height={22} style={{ mixBlendMode: "screen" }} />
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "#c084fc" }}>Canvas</span>
          </Link>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span style={{ color: "#e2d4f0" }}>Untitled Strategy</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4a3060" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ color: "#10b981", background: "#10b98115", border: "1px solid #10b98133" }}>Saved</span>
        </div>
        <div className="flex items-center gap-1 min-w-0">
          {["Undo", "Redo"].map(label => (
            <button key={label} className="px-2 py-1 text-xs rounded" style={{ color: "#4a3060" }}>{label}</button>
          ))}
          <div className="w-px h-4 mx-1" style={{ background: "#2d1b4e" }} />
          <button className="px-3 py-1 text-xs rounded" style={{ color: "#c084fc", border: "1px solid #3b1f6e" }}>Share</button>
          <button className="px-3 py-1 text-xs rounded font-medium" style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff" }}>Deploy</button>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs ml-1" style={{ background: "#1a0d30", border: "1px solid #2d1b4e", color: "#8b5cf6" }}>A</div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left Panel ── */}
        <aside className="flex-shrink-0 w-56 flex flex-col overflow-y-auto" style={{ borderRight: "1px solid #2d1b4e", background: "#09010f" }}>
          <div className="px-3 pt-4 pb-2">
            <p className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "#4a3060" }}>Add Modules</p>
            <div className="flex flex-col gap-1.5">
              {leftModules.map(m => (
                <div key={m.id} className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer"
                  style={{ border: `1px solid ${m.accent}22`, background: `${m.accent}08` }}>
                  <span className="text-base leading-none mt-0.5 flex-shrink-0" style={{ color: m.accent }}>{m.icon}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate" style={{ color: "#d4c4f0" }}>{m.label}</div>
                    <div className="text-xs mt-0.5 truncate" style={{ color: "#4a3060" }}>{m.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Canvas ── */}
        <main
          ref={mainRef}
          className="flex-1 relative overflow-hidden dot-grid"
          style={{ background: "#07000f", cursor: "grab" }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          {/* Static background glows (not zoomed) */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 55% 65% at 50% 50%, #7c3aed12 0%, #4c1d9506 50%, transparent 78%)" }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 55%, #07000f88 100%)" }} />

          {/* ── Zoom + Pan group ── */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 0,
              height: 0,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
            }}
          >
            {/* SVG connection lines */}
            <svg style={{ position: "absolute", top: 0, left: 0, width: 0, height: 0, overflow: "visible", zIndex: 5 }}>
              <defs>
                {canvasNodes.map(node => {
                  const len = Math.sqrt(node.x ** 2 + node.y ** 2);
                  const ux = node.x / len, uy = node.y / len;
                  const x1 = ux * 66, y1 = uy * 66;
                  const x2 = node.x - ux * 52, y2 = node.y - uy * 52;
                  return (
                    <linearGradient key={node.id + "-g"} id={node.id + "-g"} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
                      {node.isInput ? (
                        <><stop offset="0%" stopColor="#7c3aed" stopOpacity="0.06" /><stop offset="100%" stopColor={node.accent} stopOpacity="0.55" /></>
                      ) : (
                        <><stop offset="0%" stopColor="#a855f7" stopOpacity="0.55" /><stop offset="100%" stopColor={node.accent} stopOpacity="0.06" /></>
                      )}
                    </linearGradient>
                  );
                })}
              </defs>
              {canvasNodes.map(node => {
                const len = Math.sqrt(node.x ** 2 + node.y ** 2);
                const ux = node.x / len, uy = node.y / len;
                return (
                  <line
                    key={node.id + "-l"}
                    x1={ux * 66} y1={uy * 66}
                    x2={node.x - ux * 52} y2={node.y - uy * 52}
                    stroke={`url(#${node.id}-g)`}
                    strokeWidth="1.5"
                    strokeDasharray="5 8"
                    className={node.isInput ? "line-flow-in" : "line-flow-out"}
                    style={{ filter: `drop-shadow(0 0 3px ${node.accent}99)` }}
                  />
                );
              })}
            </svg>

            {/* Center logo — mixBlendMode on the CONTAINER eliminates dark PNG background */}
            <div
              style={{
                position: "absolute",
                width: 120,
                height: 120,
                left: -60,
                top: -60,
                mixBlendMode: "screen",
                zIndex: 20,
              }}
            >
              {/* Far glow blob */}
              <div className="absolute rounded-full pointer-events-none" style={{ inset: -110, background: "radial-gradient(circle, #7c3aed16 0%, transparent 65%)", filter: "blur(28px)" }} />
              {/* Rotating outer ring */}
              <div className="absolute rounded-full pointer-events-none orbit-spin" style={{ inset: -88, border: "1px dashed #7c3aed28" }} />
              {/* Pulsing mid ring */}
              <div className="absolute rounded-full pointer-events-none core-pulse" style={{ inset: -54, border: "1px solid #7c3aed30" }} />
              {/* Inner ring */}
              <div className="absolute rounded-full pointer-events-none" style={{ inset: -26, border: "1px solid #a855f724" }} />
              {/* Close glow */}
              <div className="absolute rounded-full pointer-events-none" style={{ inset: -55, background: "radial-gradient(circle, #7c3aed24 0%, transparent 70%)", filter: "blur(14px)" }} />
              <Image
                src="/logo.png"
                alt="Dolphin AI"
                width={120}
                height={120}
                className="logo-breathe"
                priority
              />
            </div>

            {/* Label */}
            <div
              style={{
                position: "absolute",
                top: 76,
                left: 0,
                transform: "translateX(-50%)",
                textAlign: "center",
                pointerEvents: "none",
                zIndex: 20,
                whiteSpace: "nowrap",
              }}
            >
              <div className="text-xs font-mono uppercase tracking-widest neon-text" style={{ letterSpacing: "0.22em" }}>Dolphin AI</div>
              <div className="text-xs font-mono mt-1 pulse-dot" style={{ color: "#4a3060" }}>Thinking…</div>
            </div>

            {/* Module nodes */}
            {canvasNodes.map(node => (
              <div
                key={node.id}
                className="node-card"
                style={{ position: "absolute", left: node.x, top: node.y, transform: "translate(-50%, -50%)", zIndex: 10 }}
              >
                <div
                  className="rounded-lg cursor-pointer"
                  style={{
                    width: 136,
                    padding: "7px 10px 6px",
                    background: `linear-gradient(135deg, #0c041888, ${node.accent}10)`,
                    border: `1px solid ${node.accent}30`,
                    boxShadow: `0 0 14px ${node.accent}14`,
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-base leading-none flex-shrink-0" style={{ color: node.accent }}>{node.icon}</span>
                    <span className="text-xs font-medium leading-tight" style={{ color: "#d4c4f0" }}>{node.label}</span>
                  </div>
                  <div style={{ height: 1, background: `linear-gradient(to right, ${node.accent}55, transparent)` }} />
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="w-1 h-1 rounded-full flex-shrink-0 node-flicker" style={{ background: node.accent, boxShadow: `0 0 5px ${node.accent}` }} />
                    <span className="text-xs font-mono node-flicker" style={{ color: `${node.accent}77`, animationDelay: "0.4s" }}>active</span>
                  </div>
                </div>
              </div>
            ))}
          </div>{/* end canvas group */}
        </main>

        {/* ── Right Panel ── */}
        <aside className="flex-shrink-0 w-64 flex flex-col overflow-y-auto" style={{ borderLeft: "1px solid #2d1b4e", background: "#09010f" }}>
          <div className="px-4 pt-4 pb-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm" style={{ background: "#22d3ee15", border: "1px solid #22d3ee33", color: "#22d3ee" }}>◎</div>
              <div>
                <div className="text-sm font-medium" style={{ color: "#e2d4f0" }}>Sentiment Detection</div>
                <div className="text-xs" style={{ color: "#4a3060" }}>NLP · Real-time</div>
              </div>
            </div>
            <div className="flex gap-1 text-xs font-mono">
              {["Settings", "Metrics"].map((t, i) => (
                <div key={t} className="px-3 py-1 rounded" style={i === 0 ? { background: "#1a0d30", color: "#c084fc", border: "1px solid #3b1f6e" } : { color: "#4a3060" }}>{t}</div>
              ))}
            </div>
            <div>
              <p className="text-xs font-mono uppercase mb-2" style={{ color: "#3b2060" }}>Configuration</p>
              <div className="flex flex-col gap-2">
                {[{ label: "Data Source", value: "Twitter / X" }, { label: "Timeframe", value: "Last 24h" }, { label: "Analysis Depth", value: "High" }].map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "#6b4d90" }}>{row.label}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: "#1a0d30", color: "#c084fc", border: "1px solid #2d1b4e" }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-mono uppercase mb-2" style={{ color: "#3b2060" }}>Parameters</p>
              <div className="flex flex-col gap-3">
                <div>
                  <div className="flex justify-between text-xs mb-1.5"><span style={{ color: "#6b4d90" }}>Sensitivity</span><span className="font-mono" style={{ color: "#c084fc" }}>0.75</span></div>
                  <div className="h-1 rounded-full" style={{ background: "#1a0d30" }}><div className="h-1 rounded-full" style={{ width: "75%", background: "linear-gradient(90deg,#7c3aed,#c084fc)" }} /></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "#6b4d90" }}>Update Frequency</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: "#1a0d30", color: "#c084fc", border: "1px solid #2d1b4e" }}>Real-time</span>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5"><span style={{ color: "#6b4d90" }}>Confidence Threshold</span><span className="font-mono" style={{ color: "#c084fc" }}>0.65</span></div>
                  <div className="h-1 rounded-full" style={{ background: "#1a0d30" }}><div className="h-1 rounded-full" style={{ width: "65%", background: "linear-gradient(90deg,#7c3aed,#c084fc)" }} /></div>
                </div>
              </div>
            </div>
            <button className="w-full py-2 rounded-lg text-xs font-medium" style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff" }}>
              Save Changes
            </button>
          </div>
        </aside>
      </div>

      {/* ── Bottom Bar ── */}
      <footer className="flex-shrink-0 flex items-center justify-between px-4 h-9 text-xs font-mono" style={{ borderTop: "1px solid #1a0d30", background: "#09010f" }}>
        <div className="w-16 h-5 rounded" style={{ border: "1px solid #2d1b4e", background: "#0f0520" }} />
        <div className="flex items-center gap-1" style={{ color: "#3b2060" }}>
          {["Perceive", "Think", "Decide", "Execute"].map((s, i) => (
            <span key={s} className="flex items-center gap-1">
              <span style={{ color: i <= 1 ? "#8b5cf6" : "#3b2060" }}>{s}</span>
              {i < 3 && <span style={{ color: "#2d1b4e" }}>›</span>}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5" style={{ color: "#4a3060" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
            All systems operational
          </div>
          <div className="flex items-center" style={{ border: "1px solid #2d1b4e", borderRadius: 4 }}>
            <button
              className="px-2 py-0.5"
              style={{ color: "#6b4d90" }}
              onClick={() => changeZoom(-0.1)}
            >−</button>
            <span className="px-2 py-0.5 text-xs font-mono" style={{ color: "#8b5cf6", borderLeft: "1px solid #2d1b4e", borderRight: "1px solid #2d1b4e", minWidth: 44, textAlign: "center" }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              className="px-2 py-0.5"
              style={{ color: "#6b4d90" }}
              onClick={() => changeZoom(0.1)}
            >+</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
