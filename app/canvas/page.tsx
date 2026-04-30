"use client";
import { useState, useRef } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────
type AiPhase = "idle" | "analyzing" | "markets";
type ConfigField = { label: string; type: "text"|"select"|"range"; value: string; options?: string[] };
type DroppedNode  = { uid: number; label: string; sub: string; accent: string; icon: string; x: number; y: number; config: ConfigField[] };
type Market       = { id: number; title: string; category: string; yes: number; no: number; volume: number; liquidity: number; matchScore: number; closes: string; closesHours: number };

// ── Static data ───────────────────────────────────────────────────────────────
const leftModules = [
  { id: "sentiment", label: "Sentiment Detection", sub: "NLP · Real-time",    accent: "#22d3ee", icon: "◎" },
  { id: "social",    label: "Social Intelligence",  sub: "Twitter / Reddit",   accent: "#fbbf24", icon: "⬡" },
  { id: "market",    label: "Market Selection",     sub: "Asset filtering",    accent: "#10b981", icon: "◈" },
  { id: "strategy",  label: "Strategy Engine",      sub: "Signal generation",  accent: "#a78bfa", icon: "◇" },
  { id: "execution", label: "Execution Module",     sub: "Order routing",      accent: "#f472b6", icon: "▷" },
  { id: "risk",      label: "Risk Management",      sub: "Stop-loss · Sizing", accent: "#fb923c", icon: "◬" },
  { id: "datafeed",  label: "Data Feed",            sub: "OHLCV · On-chain",   accent: "#60a5fa", icon: "⊞" },
];

const defaultConfigs: Record<string, ConfigField[]> = {
  "Sentiment Detection": [
    { label: "Data Source", type: "select", value: "Twitter / X", options: ["Twitter / X", "Reddit", "Both"] },
    { label: "Timeframe",   type: "select", value: "Last 24h",    options: ["Last 1h", "Last 6h", "Last 24h", "Last 7d"] },
    { label: "Sensitivity", type: "range",  value: "0.75" },
  ],
  "Social Intelligence": [
    { label: "Source",           type: "select", value: "X + Reddit", options: ["X + Reddit", "X only", "Reddit only"] },
    { label: "Influence Weight", type: "range",  value: "0.65" },
    { label: "Noise Filter",     type: "select", value: "High",       options: ["Low", "Medium", "High"] },
  ],
  "Market Selection": [
    { label: "Category",              type: "select", value: "Crypto",  options: ["Crypto", "Stocks", "Macro", "Sports"] },
    { label: "Min Liquidity",         type: "text",   value: "10000" },
    { label: "Match Score Threshold", type: "range",  value: "0.80" },
  ],
  "Strategy Engine": [
    { label: "Strategy Type",        type: "select", value: "Momentum",  options: ["Momentum", "Mean Reversion", "Trend Follow"] },
    { label: "Confidence Threshold", type: "range",  value: "0.70" },
    { label: "Bias",                 type: "select", value: "Auto",      options: ["Auto", "Long", "Short", "Neutral"] },
  ],
  "Execution Module": [
    { label: "Order Type",    type: "select", value: "Market",    options: ["Market", "Limit", "Stop"] },
    { label: "Max Slippage",  type: "text",   value: "1%" },
    { label: "Position Size", type: "text",   value: "100 USDC" },
  ],
  "Risk Management": [
    { label: "Max Loss",       type: "text",   value: "20 USDC" },
    { label: "Stop Loss",      type: "select", value: "Enabled",  options: ["Enabled", "Disabled"] },
    { label: "Exposure Limit", type: "select", value: "Medium",   options: ["Low", "Medium", "High"] },
  ],
  "Data Feed": [
    { label: "Provider",     type: "select", value: "Mock Feed", options: ["Mock Feed", "Chainlink", "Pyth"] },
    { label: "Refresh Rate", type: "select", value: "2s",        options: ["1s", "2s", "5s", "10s"] },
    { label: "Status",       type: "select", value: "Active",    options: ["Active", "Paused"] },
  ],
};

const mockMarkets: Market[] = [
  { id: 1, title: "BTC above $100K by end of week?",        category: "Crypto",   yes: 0.42, no: 0.58, volume: 284000, liquidity: 95000,  matchScore: 94, closes: "2d 14h", closesHours: 62   },
  { id: 2, title: "ETH outperform SOL this month?",         category: "Crypto",   yes: 0.61, no: 0.39, volume: 142000, liquidity: 48000,  matchScore: 88, closes: "12d 3h", closesHours: 291  },
  { id: 3, title: "Fed rate cut at next meeting?",          category: "Macro",    yes: 0.27, no: 0.73, volume: 521000, liquidity: 180000, matchScore: 71, closes: "18d",    closesHours: 432  },
  { id: 4, title: "Lakers win next game?",                  category: "Sports",   yes: 0.55, no: 0.45, volume: 38000,  liquidity: 12000,  matchScore: 45, closes: "8h",     closesHours: 8    },
  { id: 5, title: "Trump wins 2028 Republican nomination?", category: "Politics", yes: 0.78, no: 0.22, volume: 892000, liquidity: 310000, matchScore: 62, closes: "180d",   closesHours: 4320 },
  { id: 6, title: "Apple stock close higher this week?",    category: "Stocks",   yes: 0.48, no: 0.52, volume: 67000,  liquidity: 22000,  matchScore: 79, closes: "4d 2h",  closesHours: 98   },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function Canvas() {
  const [zoom, setZoom]                         = useState(1.0);
  const [pan, setPan]                           = useState({ x: 0, y: 0 });
  const [droppedNodes, setDroppedNodes]         = useState<DroppedNode[]>([]);
  const [selUid, setSelUid]                     = useState<number | null>(null);
  const [dolphinPhase, setDolphinPhase]         = useState<AiPhase>("idle");
  const [centerMsg, setCenterMsg]               = useState<string | null>(null);
  const [dolphinHover, setDolphinHover]         = useState(false);
  const [dolphinDragOver, setDolphinDragOver]   = useState(false);
  const [filterCat, setFilterCat]               = useState("All");
  const [sortBy, setSortBy]                     = useState("matchScore");

  // AI Discovery window state
  const [showDiscovery, setShowDiscovery]       = useState(false);
  const [discMinimized, setDiscMinimized]       = useState(false);
  const [discPos, setDiscPos]                   = useState<{ x: number; y: number } | null>(null);
  const [discSize, setDiscSize]                 = useState({ width: 420, height: 480 });

  // Canvas pan refs
  const isDragging    = useRef(false);
  const lastMouse     = useRef({ x: 0, y: 0 });
  const mainRef       = useRef<HTMLElement | null>(null);
  const phaseTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const msgTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragId        = useRef<string | null>(null);
  const uidRef        = useRef(0);

  // Discovery window drag/resize refs
  const discWindowRef    = useRef<HTMLDivElement | null>(null);
  const discDragging     = useRef(false);
  const discDragOffset   = useRef({ x: 0, y: 0 });
  const discResizing     = useRef(false);
  const discResizeStart  = useRef({ mouseX: 0, mouseY: 0, width: 0, height: 0 });

  // ── Canvas pan ──────────────────────────────────────────────────────────────
  function onMouseDown(e: React.MouseEvent) {
    isDragging.current = true;
    lastMouse.current  = { x: e.clientX, y: e.clientY };
    if (mainRef.current) mainRef.current.style.cursor = "grabbing";
  }

  function onMouseMove(e: React.MouseEvent) {
    if (discDragging.current) {
      setDiscPos({
        x: e.clientX - discDragOffset.current.x,
        y: e.clientY - discDragOffset.current.y,
      });
      return;
    }
    if (discResizing.current) {
      const dw = e.clientX - discResizeStart.current.mouseX;
      const dh = e.clientY - discResizeStart.current.mouseY;
      setDiscSize({
        width:  Math.max(320, discResizeStart.current.width  + dw),
        height: Math.max(260, discResizeStart.current.height + dh),
      });
      return;
    }
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
  }

  function onMouseUp() {
    isDragging.current   = false;
    discDragging.current = false;
    discResizing.current = false;
    if (mainRef.current) mainRef.current.style.cursor = "grab";
  }

  function changeZoom(delta: number) {
    setZoom(z => Math.max(0.5, Math.min(2.0, Math.round((z + delta) * 10) / 10)));
  }

  // ── Discovery window drag/resize ─────────────────────────────────────────────
  function onDiscHeaderMouseDown(e: React.MouseEvent) {
    e.stopPropagation();
    const winEl  = discWindowRef.current;
    const mainEl = mainRef.current;
    if (winEl && mainEl) {
      const winRect  = winEl.getBoundingClientRect();
      const mainRect = mainEl.getBoundingClientRect();
      const curLeft  = winRect.left - mainRect.left;
      const curTop   = winRect.top  - mainRect.top;
      setDiscPos({ x: curLeft, y: curTop });
      discDragOffset.current = { x: e.clientX - curLeft, y: e.clientY - curTop };
    }
    discDragging.current = true;
    if (mainRef.current) mainRef.current.style.cursor = "grabbing";
  }

  function onResizeHandleMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    discResizing.current = true;
    discResizeStart.current = {
      mouseX: e.clientX, mouseY: e.clientY,
      width: discSize.width, height: discSize.height,
    };
  }

  // ── Left panel drag ──────────────────────────────────────────────────────────
  function onDragStart(id: string) { dragId.current = id; }

  // ── Dolphin drop zone ────────────────────────────────────────────────────────
  function onDolphinDragOver(e: React.DragEvent)  { e.preventDefault(); e.stopPropagation(); }
  function onDolphinDragEnter(e: React.DragEvent) { e.preventDefault(); setDolphinDragOver(true); }
  function onDolphinDragLeave()                   { setDolphinDragOver(false); }

  function onDolphinDrop(e: React.DragEvent) {
    e.preventDefault(); e.stopPropagation();
    setDolphinDragOver(false);
    const id  = dragId.current; dragId.current = null;
    if (!id) return;
    const mod = leftModules.find(m => m.id === id);
    if (!mod) return;

    const isUpdate = droppedNodes.some(n => n.label === mod.label);

    setDroppedNodes(prev => {
      const existsAt = prev.findIndex(n => n.label === mod.label);
      if (existsAt >= 0) {
        return prev.map((n, i) => i === existsAt ? { ...n, sub: mod.sub, accent: mod.accent, icon: mod.icon } : n);
      }
      const idx    = prev.length;
      const angle  = (idx / 7) * Math.PI * 2 - Math.PI / 2;
      const x      = Math.round(Math.cos(angle) * 230);
      const y      = Math.round(Math.sin(angle) * 230);
      const config = (defaultConfigs[mod.label] ?? []).map(f => ({ ...f }));
      return [...prev, { uid: ++uidRef.current, label: mod.label, sub: mod.sub, accent: mod.accent, icon: mod.icon, x, y, config }];
    });

    if (isUpdate) {
      setCenterMsg(`${mod.label} updated`);
      if (msgTimer.current) clearTimeout(msgTimer.current);
      msgTimer.current = setTimeout(() => setCenterMsg(null), 2000);
    }
  }

  // ── Dolphin click ────────────────────────────────────────────────────────────
  function triggerDiscovery() {
    setSelUid(null);
    setDolphinPhase("analyzing");
    setCenterMsg(null);
    if (phaseTimer.current) clearTimeout(phaseTimer.current);
    phaseTimer.current = setTimeout(() => {
      setDolphinPhase("markets");
      setShowDiscovery(true);
      setDiscMinimized(false);
    }, 1000);
  }

  function onDolphinClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (droppedNodes.length === 0) {
      setCenterMsg("Add strategy modules first");
      if (msgTimer.current) clearTimeout(msgTimer.current);
      msgTimer.current = setTimeout(() => setCenterMsg(null), 2500);
      return;
    }
    // Re-open window if already discovered
    if (dolphinPhase === "markets") {
      setShowDiscovery(true);
      setDiscMinimized(false);
      return;
    }
    triggerDiscovery();
  }

  // ── Node interactions ────────────────────────────────────────────────────────
  function onNodeClick(e: React.MouseEvent, uid: number) {
    e.stopPropagation();
    setSelUid(uid);
    // Discovery window is intentionally NOT closed here
  }

  function updateConfig(uid: number, fieldLabel: string, val: string) {
    setDroppedNodes(prev => prev.map(n =>
      n.uid !== uid ? n : { ...n, config: n.config.map(f => f.label === fieldLabel ? { ...f, value: val } : f) }
    ));
  }

  function removeNode(uid: number) {
    setDroppedNodes(prev => prev.filter(n => n.uid !== uid));
    setSelUid(null);
  }

  // ── Derived ──────────────────────────────────────────────────────────────────
  const centerLabel = dolphinPhase === "analyzing" ? "Analyzing strategy…"
    : dolphinPhase === "markets"   ? "Markets ready"
    : centerMsg                    ? centerMsg
    : droppedNodes.length === 0    ? "Drop modules here"
    : "Click to discover";

  const centerColor = dolphinPhase === "analyzing" ? "#c084fc"
    : dolphinPhase === "markets"   ? "#10b981"
    : centerMsg && droppedNodes.length === 0 ? "#fb923c"
    : droppedNodes.length > 0      ? "#8b5cf6"
    : "#3b2060";

  const selNode = droppedNodes.find(n => n.uid === selUid) ?? null;

  const filteredMarkets = mockMarkets
    .filter(m => filterCat === "All" || m.category === filterCat)
    .sort((a, b) =>
      sortBy === "volume"      ? b.volume - a.volume :
      sortBy === "closingSoon" ? a.closesHours - b.closesHours :
      b.matchScore - a.matchScore
    );

  // ── Window position style ─────────────────────────────────────────────────────
  const discWindowStyle: React.CSSProperties = discPos
    ? { left: discPos.x, top: discPos.y }
    : { right: 16, top: 80 };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "#07000f", color: "#e2d4f0" }}>

      {/* ── Top Nav ── */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 h-12 z-50"
        style={{ borderBottom: "1px solid #2d1b4e", background: "#09010f" }}>
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <img src="/logo.png" alt="Dolphin AI" width={22} height={22} style={{ mixBlendMode: "screen" }} />
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "#c084fc" }}>Canvas</span>
          </Link>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span style={{ color: "#e2d4f0" }}>Untitled Strategy</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4a3060" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          <span className="text-xs font-mono px-2 py-0.5 rounded"
            style={{ color: "#10b981", background: "#10b98115", border: "1px solid #10b98133" }}>Saved</span>
        </div>
        <div className="flex items-center gap-1 min-w-0">
          {["Undo", "Redo"].map(label => (
            <button key={label} className="px-2 py-1 text-xs rounded" style={{ color: "#4a3060" }}>{label}</button>
          ))}
          <div className="w-px h-4 mx-1" style={{ background: "#2d1b4e" }} />
          <button className="px-3 py-1 text-xs rounded" style={{ color: "#c084fc", border: "1px solid #3b1f6e" }}>Share</button>
          <button className="px-3 py-1 text-xs rounded font-medium"
            style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff" }}>Deploy</button>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs ml-1"
            style={{ background: "#1a0d30", border: "1px solid #2d1b4e", color: "#8b5cf6" }}>A</div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left Panel ── */}
        <aside className="flex-shrink-0 w-56 flex flex-col overflow-y-auto"
          style={{ borderRight: "1px solid #2d1b4e", background: "#09010f" }}>
          <div className="px-3 pt-4 pb-2">
            <p className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "#4a3060" }}>Add Modules</p>
            <div className="flex flex-col gap-1.5">
              {leftModules.map(m => {
                const added = droppedNodes.some(n => n.label === m.label);
                return (
                  <div key={m.id}
                    draggable
                    onDragStart={() => onDragStart(m.id)}
                    className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg cursor-grab active:cursor-grabbing"
                    style={{
                      border:     `1px solid ${m.accent}${added ? "55" : "22"}`,
                      background: `${m.accent}${added ? "14" : "08"}`,
                      opacity: added ? 0.6 : 1,
                      transition: "opacity 0.2s ease",
                    }}>
                    <span className="text-base leading-none mt-0.5 flex-shrink-0" style={{ color: m.accent }}>{m.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate" style={{ color: "#d4c4f0" }}>{m.label}</div>
                      <div className="text-xs mt-0.5 truncate" style={{ color: added ? m.accent + "88" : "#4a3060" }}>
                        {added ? "✓ Added" : m.sub}
                      </div>
                    </div>
                  </div>
                );
              })}
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
          onClick={() => setSelUid(null)}
        >
          {/* Background glows */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 55% 65% at 50% 50%, #7c3aed12 0%, transparent 78%)" }} />
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 55%, #07000f88 100%)" }} />
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "radial-gradient(ellipse 40% 40% at 50% 50%, #7c3aed1a 0%, transparent 70%)",
            opacity: dolphinPhase === "analyzing" ? 1 : 0,
            transition: "opacity 0.7s ease",
          }} />

          {/* Empty-state hint */}
          {droppedNodes.length === 0 && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-end pb-32">
              <div className="text-xs font-mono" style={{ color: "#2d1b4e" }}>
                ↑ Drag a module onto Dolphin AI to begin
              </div>
            </div>
          )}

          {/* Zoom + Pan group */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            width: 0, height: 0,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}>

            {/* Connection lines */}
            <svg style={{ position: "absolute", top: 0, left: 0, width: 0, height: 0, overflow: "visible", zIndex: 5, pointerEvents: "none" }}>
              <defs>
                {droppedNodes.map(n => {
                  const len = Math.sqrt(n.x ** 2 + n.y ** 2);
                  const ux = n.x / len, uy = n.y / len;
                  return (
                    <linearGradient key={`g-${n.uid}`} id={`g-${n.uid}`} gradientUnits="userSpaceOnUse"
                      x1={ux * 66} y1={uy * 66} x2={n.x - ux * 52} y2={n.y - uy * 52}>
                      <stop offset="0%"   stopColor="#7c3aed" stopOpacity="0.08" />
                      <stop offset="100%" stopColor={n.accent} stopOpacity="0.45" />
                    </linearGradient>
                  );
                })}
              </defs>
              {droppedNodes.map(n => {
                const len = Math.sqrt(n.x ** 2 + n.y ** 2);
                const ux = n.x / len, uy = n.y / len;
                return (
                  <line key={`l-${n.uid}`}
                    x1={ux * 66} y1={uy * 66}
                    x2={n.x - ux * 52} y2={n.y - uy * 52}
                    stroke={`url(#g-${n.uid})`}
                    strokeWidth={n.uid === selUid ? "2" : "1.5"}
                    strokeDasharray="5 7"
                    style={{
                      filter: `drop-shadow(0 0 ${n.uid === selUid ? "6px" : "3px"} ${n.accent}${n.uid === selUid ? "aa" : "55"})`,
                      transition: "stroke-width 0.3s ease",
                    }}
                  />
                );
              })}
            </svg>

            {/* Dolphin overlay — click + drop zone */}
            <div
              onClick={onDolphinClick}
              onMouseEnter={() => setDolphinHover(true)}
              onMouseLeave={() => setDolphinHover(false)}
              onDragOver={onDolphinDragOver}
              onDragEnter={onDolphinDragEnter}
              onDragLeave={onDolphinDragLeave}
              onDrop={onDolphinDrop}
              style={{
                position: "absolute", width: 120, height: 120, left: -60, top: -60,
                borderRadius: "50%", zIndex: 30, cursor: "pointer",
                border: dolphinDragOver ? "2px solid #c084fcaa" : "2px solid transparent",
                boxShadow: dolphinDragOver
                  ? "0 0 0 8px #c084fc18, 0 0 60px 14px #a855f766"
                  : dolphinHover
                  ? "0 0 40px 8px #a855f755, 0 0 80px 16px #7c3aed33"
                  : "none",
                transition: "box-shadow 0.25s ease, border-color 0.25s ease",
              }}
            />

            {/* Center logo */}
            <div style={{
              position: "absolute", width: 120, height: 120, left: -60, top: -60,
              mixBlendMode: "screen", zIndex: 20, pointerEvents: "none",
            }}>
              <div className="absolute rounded-full" style={{
                inset: -110,
                background: `radial-gradient(circle, ${dolphinPhase === "analyzing" ? "#7c3aed32" : "#7c3aed16"} 0%, transparent 65%)`,
                filter: "blur(28px)", transition: "background 0.7s ease",
              }} />
              <div className="absolute rounded-full orbit-spin" style={{
                inset: -88,
                border: `1px dashed ${dolphinPhase === "analyzing" ? "#7c3aed55" : "#7c3aed28"}`,
                transition: "border-color 0.7s ease",
              }} />
              <div className="absolute rounded-full core-pulse" style={{
                inset: -54,
                border: `1px solid ${dolphinPhase === "analyzing" ? "#a855f766" : "#7c3aed30"}`,
                transition: "border-color 0.7s ease",
              }} />
              <div className="absolute rounded-full" style={{ inset: -26, border: "1px solid #a855f724" }} />
              <div className="absolute rounded-full" style={{
                inset: -55,
                background: `radial-gradient(circle, ${dolphinPhase === "analyzing" ? "#7c3aed44" : "#7c3aed24"} 0%, transparent 70%)`,
                filter: "blur(14px)", transition: "background 0.7s ease",
              }} />
              <img src="/logo.png" alt="Dolphin AI" width={120} height={120}
                className={dolphinPhase === "analyzing" ? "logo-breathe-intense" : "logo-breathe"} />
            </div>

            {/* Center label */}
            <div style={{
              position: "absolute", top: 76, left: 0,
              transform: "translateX(-50%)", textAlign: "center",
              pointerEvents: "none", zIndex: 20, whiteSpace: "nowrap",
            }}>
              <div className="text-xs font-mono uppercase tracking-widest neon-text" style={{ letterSpacing: "0.22em" }}>Dolphin AI</div>
              <div className="text-xs font-mono mt-1" style={{ color: centerColor, transition: "color 0.4s ease" }}>
                {centerLabel}
              </div>
            </div>

            {/* Strategy nodes */}
            {droppedNodes.map(node => {
              const isSel = node.uid === selUid;
              return (
                <div key={node.uid}
                  style={{ position: "absolute", left: node.x, top: node.y, transform: "translate(-50%,-50%)", zIndex: 15, cursor: "pointer" }}
                  onClick={e => onNodeClick(e, node.uid)}>
                  <div style={{
                    width: 140, padding: "8px 10px 7px",
                    background: `linear-gradient(135deg, #0e051c, ${node.accent}${isSel ? "22" : "14"})`,
                    border:      `1px solid ${node.accent}${isSel ? "99" : "44"}`,
                    borderRadius: 8,
                    boxShadow:   isSel ? `0 0 24px ${node.accent}55, 0 0 8px ${node.accent}33` : `0 0 16px ${node.accent}18`,
                    transform:   isSel ? "scale(1.06)" : "scale(1)",
                    transition:  "border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s cubic-bezier(0.22,1,0.36,1)",
                  }}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-base leading-none flex-shrink-0" style={{ color: node.accent }}>{node.icon}</span>
                      <span className="text-xs font-medium leading-tight" style={{ color: "#d4c4f0" }}>{node.label}</span>
                    </div>
                    <div style={{ height: 1, background: `linear-gradient(to right, ${node.accent}44, transparent)` }} />
                    <div className="text-xs mt-1.5 truncate" style={{ color: "#4a3060" }}>{node.sub}</div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className="w-1 h-1 rounded-full flex-shrink-0 node-flicker"
                        style={{ background: node.accent, boxShadow: `0 0 4px ${node.accent}` }} />
                      <span className="text-xs font-mono" style={{ color: `${node.accent}88` }}>
                        {isSel ? "editing" : "active"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

          </div>{/* end zoom+pan group */}

          {/* ── AI Discovery floating window ── */}
          {showDiscovery && (
            <div
              ref={discWindowRef}
              onMouseDown={e => e.stopPropagation()}
              onClick={e => e.stopPropagation()}
              style={{
                position: "absolute",
                ...discWindowStyle,
                width: discSize.width,
                height: discMinimized ? "auto" : discSize.height,
                zIndex: 50,
                display: "flex",
                flexDirection: "column",
                background: "#08010e",
                border: "1px solid #2d1b4e",
                borderRadius: 12,
                boxShadow: "0 12px 48px #00000099, 0 0 80px #7c3aed1a, 0 0 1px #a855f733",
                overflow: "hidden",
              }}
            >
              {/* ── Window header (draggable) ── */}
              <div
                onMouseDown={onDiscHeaderMouseDown}
                style={{
                  padding: "10px 12px 9px",
                  borderBottom: discMinimized ? "none" : "1px solid #160930",
                  flexShrink: 0,
                  cursor: "grab",
                  userSelect: "none",
                  background: "linear-gradient(180deg, #0d0320 0%, #09010f 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                {/* Left: drag handle + title */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="8" height="12" viewBox="0 0 8 12" style={{ flexShrink: 0, opacity: 0.4 }}>
                    <circle cx="2" cy="2"  r="1.2" fill="#a855f7"/>
                    <circle cx="6" cy="2"  r="1.2" fill="#a855f7"/>
                    <circle cx="2" cy="6"  r="1.2" fill="#a855f7"/>
                    <circle cx="6" cy="6"  r="1.2" fill="#a855f7"/>
                    <circle cx="2" cy="10" r="1.2" fill="#a855f7"/>
                    <circle cx="6" cy="10" r="1.2" fill="#a855f7"/>
                  </svg>
                  <div>
                    <span style={{ fontSize: 11, color: "#c084fc", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600 }}>
                      AI Discovery
                    </span>
                    {discMinimized && (
                      <span style={{ fontSize: 10, color: "#4a3060", fontFamily: "monospace", marginLeft: 8 }}>
                        · {mockMarkets.length} markets
                      </span>
                    )}
                  </div>
                  {!discMinimized && (
                    <span style={{
                      fontSize: 9, color: "#10b981", fontFamily: "monospace",
                      background: "#10b98115", border: "1px solid #10b98133",
                      borderRadius: 3, padding: "1px 6px",
                    }}>
                      {filteredMarkets.length} matched
                    </span>
                  )}
                </div>

                {/* Right: minimize + close */}
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); setDiscMinimized(m => !m); }}
                    title={discMinimized ? "Restore" : "Minimize"}
                    style={{
                      width: 22, height: 22, borderRadius: 5,
                      border: "1px solid #2d1b4e", color: "#6b4d90",
                      background: "transparent", cursor: "pointer",
                      fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
                      lineHeight: 1,
                    }}
                  >
                    {discMinimized ? "▢" : "−"}
                  </button>
                  <button
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); setShowDiscovery(false); setDolphinPhase("idle"); }}
                    title="Close"
                    style={{
                      width: 22, height: 22, borderRadius: 5,
                      border: "1px solid #2d1b4e", color: "#6b4d90",
                      background: "transparent", cursor: "pointer",
                      fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center",
                      lineHeight: 1,
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* ── Window body (hidden when minimized) ── */}
              {!discMinimized && (
                <>
                  {/* Filters + sort bar */}
                  <div style={{ padding: "8px 12px", borderBottom: "1px solid #160930", flexShrink: 0 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 7 }}>
                      {["All","Crypto","Macro","Stocks","Politics","Sports"].map(cat => (
                        <button
                          key={cat}
                          onMouseDown={e => e.stopPropagation()}
                          onClick={() => setFilterCat(cat)}
                          style={{
                            fontSize: 10, padding: "2px 9px", borderRadius: 4, cursor: "pointer",
                            fontFamily: "monospace",
                            background: filterCat === cat ? "#7c3aed" : "transparent",
                            color:      filterCat === cat ? "#fff"    : "#4a3060",
                            border:     `1px solid ${filterCat === cat ? "#7c3aed" : "#2d1b4e"}`,
                            transition: "all 0.15s ease",
                          }}
                        >{cat}</button>
                      ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 10, color: "#3b2060", fontFamily: "monospace" }}>Sort by</span>
                      <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        onMouseDown={e => e.stopPropagation()}
                        style={{
                          fontSize: 10, background: "#130828", color: "#c084fc",
                          border: "1px solid #2d1b4e", borderRadius: 4, padding: "2px 6px",
                          fontFamily: "monospace", outline: "none", cursor: "pointer",
                        }}
                      >
                        <option value="matchScore">Match Score</option>
                        <option value="volume">Volume</option>
                        <option value="closingSoon">Closing Soon</option>
                      </select>
                    </div>
                  </div>

                  {/* Market cards */}
                  <div style={{ overflowY: "auto", flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
                    {filteredMarkets.map(m => (
                      <div key={m.id} style={{
                        background: "#0c0420",
                        border: "1px solid #2d1b4e",
                        borderRadius: 8,
                        padding: "9px 11px",
                        flexShrink: 0,
                        transition: "border-color 0.2s ease",
                      }}>
                        {/* Row 1: category + score */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <span style={{ fontSize: 9, color: "#3b2060", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            {m.category}
                          </span>
                          <span style={{
                            fontSize: 9, color: "#a855f7", fontFamily: "monospace",
                            background: "#a855f715", border: "1px solid #a855f733",
                            borderRadius: 3, padding: "1px 5px",
                          }}>
                            ⬥ {m.matchScore}%
                          </span>
                        </div>
                        {/* Row 2: title */}
                        <div style={{
                          fontSize: 12, color: "#d4c4f0", marginBottom: 6, lineHeight: 1.4,
                          maxHeight: "2.8em", overflow: "hidden",
                        }}>
                          {m.title}
                        </div>
                        {/* Row 3: YES/NO + meta */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                          <div style={{ display: "flex", gap: 5 }}>
                            <span style={{ fontSize: 10, fontFamily: "monospace", color: "#10b981", background: "#10b98115", border: "1px solid #10b98133", borderRadius: 3, padding: "1px 6px" }}>
                              YES {Math.round(m.yes * 100)}¢
                            </span>
                            <span style={{ fontSize: 10, fontFamily: "monospace", color: "#fb923c", background: "#fb923c15", border: "1px solid #fb923c33", borderRadius: 3, padding: "1px 6px" }}>
                              NO {Math.round(m.no * 100)}¢
                            </span>
                          </div>
                          <span style={{ fontSize: 9, color: "#3b2060", fontFamily: "monospace" }}>
                            ${(m.volume / 1000).toFixed(0)}K · {m.closes}
                          </span>
                        </div>
                        {/* Row 4: actions */}
                        <div style={{ display: "flex", gap: 7 }}>
                          <button style={{
                            flex: 1, fontSize: 10, padding: "4px 0", borderRadius: 5,
                            border: "1px solid #3b1f6e", color: "#c084fc",
                            background: "transparent", cursor: "pointer", fontFamily: "monospace",
                          }}>
                            View Market
                          </button>
                          <button style={{
                            flex: 1, fontSize: 10, padding: "4px 0", borderRadius: 5,
                            background: "linear-gradient(135deg,#7c3aed,#a855f7)",
                            color: "#fff", border: "none", cursor: "pointer", fontFamily: "monospace",
                          }}>
                            + Strategy
                          </button>
                        </div>
                      </div>
                    ))}
                    {filteredMarkets.length === 0 && (
                      <div style={{ fontSize: 11, fontFamily: "monospace", textAlign: "center", padding: "40px 0", color: "#3b2060" }}>
                        No markets in this category
                      </div>
                    )}
                  </div>

                  {/* Resize handle */}
                  <div
                    onMouseDown={onResizeHandleMouseDown}
                    style={{
                      position: "absolute", bottom: 0, right: 0,
                      width: 20, height: 20, cursor: "nwse-resize",
                      display: "flex", alignItems: "flex-end", justifyContent: "flex-end",
                      padding: "4px",
                    }}
                  >
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <line x1="9" y1="3" x2="3" y2="9" stroke="#3b2060" strokeWidth="1.5" strokeLinecap="round"/>
                      <line x1="9" y1="7" x2="7" y2="9" stroke="#3b2060" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                </>
              )}
            </div>
          )}

        </main>

        {/* ── Right Panel ── */}
        <aside className="flex-shrink-0 w-64 flex flex-col overflow-hidden"
          style={{ borderLeft: "1px solid #2d1b4e", background: "#09010f" }}>

          {/* ── Node editor ── */}
          {selNode && (
            <div className="overflow-y-auto px-4 pt-4 pb-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                  style={{ background: `${selNode.accent}18`, border: `1px solid ${selNode.accent}44`, color: selNode.accent }}>
                  {selNode.icon}
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: "#e2d4f0" }}>{selNode.label}</div>
                  <div className="text-xs" style={{ color: "#4a3060" }}>{selNode.sub}</div>
                </div>
              </div>

              <p className="text-xs font-mono uppercase" style={{ color: "#3b2060" }}>Configuration</p>

              <div className="flex flex-col gap-3">
                {selNode.config.map(f => (
                  <div key={f.label}>
                    {f.type === "range" ? (
                      <>
                        <div className="flex justify-between text-xs mb-1">
                          <span style={{ color: "#6b4d90" }}>{f.label}</span>
                          <span className="font-mono" style={{ color: "#c084fc" }}>{parseFloat(f.value).toFixed(2)}</span>
                        </div>
                        <input type="range" min="0" max="1" step="0.01" value={f.value}
                          onChange={e => updateConfig(selNode.uid, f.label, e.target.value)}
                          style={{ width: "100%", accentColor: selNode.accent, cursor: "pointer" }} />
                      </>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs flex-shrink-0" style={{ color: "#6b4d90" }}>{f.label}</span>
                        {f.type === "select" ? (
                          <select value={f.value}
                            onChange={e => updateConfig(selNode.uid, f.label, e.target.value)}
                            style={{ background: "#1a0d30", color: "#c084fc", border: "1px solid #2d1b4e", borderRadius: 4, padding: "2px 4px", fontSize: 11, fontFamily: "monospace", outline: "none", cursor: "pointer" }}>
                            {f.options?.map(opt => <option key={opt} value={opt} style={{ background: "#1a0d30" }}>{opt}</option>)}
                          </select>
                        ) : (
                          <input type="text" value={f.value}
                            onChange={e => updateConfig(selNode.uid, f.label, e.target.value)}
                            style={{ background: "#1a0d30", color: "#c084fc", border: "1px solid #2d1b4e", borderRadius: 4, padding: "2px 6px", fontSize: 11, fontFamily: "monospace", width: 90, outline: "none" }} />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button className="w-full py-2 rounded-lg text-xs font-medium"
                style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", cursor: "pointer" }}
                onClick={() => setSelUid(null)}>Done</button>
              <button className="w-full py-1.5 rounded-lg text-xs"
                style={{ color: "#6b4d90", border: "1px solid #2d1b4e", cursor: "pointer", background: "transparent" }}
                onClick={() => removeNode(selNode.uid)}>Remove from strategy</button>
            </div>
          )}

          {/* ── Idle state (always visible when no node selected) ── */}
          {!selNode && (
            <div className="overflow-y-auto px-4 pt-4 pb-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                  style={{ background: "#7c3aed15", border: "1px solid #7c3aed33", color: "#a855f7" }}>◈</div>
                <div>
                  <div className="text-sm font-medium" style={{ color: "#e2d4f0" }}>Strategy Builder</div>
                  <div className="text-xs" style={{ color: "#4a3060" }}>
                    {droppedNodes.length} module{droppedNodes.length !== 1 ? "s" : ""} active
                  </div>
                </div>
              </div>

              {droppedNodes.length === 0 ? (
                <div className="text-xs font-mono text-center py-8" style={{ color: "#3b2060" }}>
                  Drag modules onto Dolphin AI<br />to build your strategy
                </div>
              ) : (
                <>
                  <p className="text-xs font-mono uppercase" style={{ color: "#3b2060" }}>Active modules</p>
                  <div className="flex flex-col gap-1.5">
                    {droppedNodes.map(n => (
                      <div key={n.uid}
                        className="flex items-center gap-2 px-2 py-1.5 rounded"
                        style={{ border: `1px solid ${n.accent}22`, background: `${n.accent}08`, cursor: "pointer" }}
                        onClick={e => onNodeClick(e, n.uid)}>
                        <span style={{ color: n.accent, fontSize: 13 }}>{n.icon}</span>
                        <span className="text-xs" style={{ color: "#d4c4f0" }}>{n.label}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    className="w-full py-2 rounded-lg text-xs font-medium"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", cursor: "pointer" }}
                    onClick={dolphinPhase === "markets"
                      ? () => { setShowDiscovery(true); setDiscMinimized(false); }
                      : triggerDiscovery
                    }
                  >
                    {dolphinPhase === "markets" ? "Show Markets →" : "Discover Markets →"}
                  </button>
                </>
              )}
            </div>
          )}

        </aside>
      </div>

      {/* ── Bottom Bar ── */}
      <footer className="flex-shrink-0 flex items-center justify-between px-4 h-9 text-xs font-mono"
        style={{ borderTop: "1px solid #1a0d30", background: "#09010f" }}>
        <div className="w-16 h-5 rounded" style={{ border: "1px solid #2d1b4e", background: "#0f0520" }} />
        <div className="flex items-center gap-1" style={{ color: "#3b2060" }}>
          {["Perceive","Think","Decide","Execute"].map((s, i) => (
            <span key={s} className="flex items-center gap-1">
              <span style={{ color: i <= (droppedNodes.length > 0 ? 1 : 0) ? "#8b5cf6" : "#3b2060" }}>{s}</span>
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
            <button className="px-2 py-0.5" style={{ color: "#6b4d90" }} onClick={() => changeZoom(-0.1)}>−</button>
            <span className="px-2 py-0.5 text-xs font-mono"
              style={{ color: "#8b5cf6", borderLeft: "1px solid #2d1b4e", borderRight: "1px solid #2d1b4e", minWidth: 44, textAlign: "center" }}>
              {Math.round(zoom * 100)}%
            </span>
            <button className="px-2 py-0.5" style={{ color: "#6b4d90" }} onClick={() => changeZoom(0.1)}>+</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
