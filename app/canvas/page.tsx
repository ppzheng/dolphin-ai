"use client";
import { useState, useRef } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────
type AiPhase = "idle" | "analyzing" | "markets" | "analyzing_events";
type ConfigField = { label: string; type: "text"|"select"|"range"; value: string; options?: string[] };
type DroppedNode = { uid: number; label: string; sub: string; accent: string; icon: string; x: number; y: number; config: ConfigField[] };
type DiscoveryEvent = {
  eventId: string; title: string; category: string;
  volume: number; liquidity: number;
  endTime: string; endTimeDays: number;
  matchScore: number; outcomesCount: number; shortReason: string;
};

// ── Macro Strategy type ───────────────────────────────────────────────────────
type MacroStrategy = {
  id: number;
  name: string;
  createdAt: number;
  options: { label: string; sub: string; accent: string; icon: string; config: { label: string; value: string }[] }[];
  summary: string;
};

// ── Option History type ───────────────────────────────────────────────────────
type OptionHistory = {
  id: number;
  type: string;
  config: { label: string; value: string }[];
  updatedAt: number;
};

// ── Portfolio types ───────────────────────────────────────────────────────────
type PortfolioOrder = {
  id: number; eventTitle: string; outcome: "YES" | "NO";
  amount: number; price: number; timestamp: number;
  type: "Mock Market" | "Close"; status: "Filled";
};
type PortfolioPosition = {
  key: string; eventTitle: string; category: string; outcome: "YES" | "NO";
  size: number; avgPrice: number; currentPrice: number;
  status: "Open" | "Closed";
};

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

const mockEvents: DiscoveryEvent[] = [
  {
    eventId: "btc-100k-2026",
    title: "Will BTC hit $100K in 2026?",
    category: "Crypto", volume: 1840000, liquidity: 620000,
    endTime: "Dec 31, 2026", endTimeDays: 244,
    matchScore: 94, outcomesCount: 2,
    shortReason: "Matches your Sentiment + Market Selection modules",
  },
  {
    eventId: "sol-etf-2026",
    title: "Solana ETF approval in 2026",
    category: "Crypto", volume: 432000, liquidity: 145000,
    endTime: "Dec 31, 2026", endTimeDays: 244,
    matchScore: 88, outcomesCount: 2,
    shortReason: "Matches your Sentiment + Data Feed modules",
  },
  {
    eventId: "fed-rate-decision",
    title: "Fed interest rate decision: next meeting",
    category: "Macro", volume: 521000, liquidity: 180000,
    endTime: "Jun 18, 2026", endTimeDays: 48,
    matchScore: 71, outcomesCount: 4,
    shortReason: "Matches your Data Feed + Strategy Engine modules",
  },
  {
    eventId: "apple-weekly",
    title: "Apple stock weekly close direction",
    category: "Stocks", volume: 67000, liquidity: 22000,
    endTime: "May 8, 2026", endTimeDays: 7,
    matchScore: 79, outcomesCount: 2,
    shortReason: "Matches your Market Selection + Strategy Engine modules",
  },
  {
    eventId: "us-election-2028",
    title: "US Election 2028 nomination market",
    category: "Politics", volume: 892000, liquidity: 310000,
    endTime: "Nov 2028", endTimeDays: 912,
    matchScore: 62, outcomesCount: 8,
    shortReason: "Matches your Social Intelligence module",
  },
  {
    eventId: "champions-league",
    title: "Champions League winner 2025–26",
    category: "Sports", volume: 294000, liquidity: 98000,
    endTime: "May 31, 2026", endTimeDays: 30,
    matchScore: 45, outcomesCount: 8,
    shortReason: "High volume, lower strategy confidence",
  },
];

// ── Category accent colors ─────────────────────────────────────────────────────
const catAccent: Record<string, string> = {
  Crypto: "#f7931a", Macro: "#22d3ee", Stocks: "#10b981",
  Politics: "#f472b6", Sports: "#fbbf24", Other: "#8b5cf6",
};

// ── Market analysis types + mock data ────────────────────────────────────────
type RiskLevel      = "Low" | "Medium" | "High";
type SuggestedAction = "Watch" | "Small Buy" | "Strong Buy" | "Avoid";
type MarketAnalysis = {
  id: string; eventTitle: string; marketTitle: string;
  outcome: "YES" | "NO"; price: number;
  confidence: number; expectedValue: number;
  riskLevel: RiskLevel; suggestedAction: SuggestedAction; reason: string;
  bullCase: string; bearCase: string; riskNotes: string; suggestedExecution: string;
};

const mockMarketAnalyses: MarketAnalysis[] = [
  {
    id: "btc-yes",
    eventTitle: "Will BTC hit $100K in 2026?",
    marketTitle: "BTC above $100K by Dec 31, 2026",
    outcome: "YES", price: 42, confidence: 72, expectedValue: 0.18,
    riskLevel: "Medium", suggestedAction: "Small Buy",
    reason: "Strong halving-cycle momentum. Narrative tailwind from ETF flows. Time decay manageable at 244 days out.",
    bullCase: "Post-halving supply shock historically drives 6–12 month price appreciation. Institutional ETF inflows create sustained demand. Current sentiment score elevated but not euphoric.",
    bearCase: "Macro risk-off scenario (rate surprise, credit event) could suppress risk assets regardless of BTC-specific narrative. $100K is a round-number resistance with potential for sharp rejection.",
    riskNotes: "Position size ≤2% of portfolio. Monitor weekly BTC dominance and ETF net flows. Stop-loss mentally at 35¢.",
    suggestedExecution: "Enter 42¢ in 2 tranches. First 60% now, hold remaining 40% for dip to 38–40¢ range. Max horizon Dec 2026.",
  },
  {
    id: "btc-no",
    eventTitle: "Will BTC hit $100K in 2026?",
    marketTitle: "BTC above $100K by Dec 31, 2026",
    outcome: "NO", price: 58, confidence: 38, expectedValue: -0.12,
    riskLevel: "High", suggestedAction: "Avoid",
    reason: "NO side overpriced relative to bullish macro regime. Asymmetric downside if BTC breaks key resistance.",
    bullCase: "A macro shock or regulatory crackdown could quickly flip consensus bearish, validating the NO position at a steep premium.",
    bearCase: "With 244 days remaining, a single strong rally could permanently reprice this market from 58¢ to 80¢+, inflicting severe losses on NO holders.",
    riskNotes: "Risk-reward unfavorable. Implied probability at 58¢ overestimates bear scenario given current macro regime.",
    suggestedExecution: "No entry recommended. If macro view turns bearish, revisit at 65¢+ for a more attractive entry on the NO side.",
  },
  {
    id: "sol-etf-yes",
    eventTitle: "Solana ETF approval in 2026",
    marketTitle: "SOL ETF approved by SEC in 2026",
    outcome: "YES", price: 34, confidence: 68, expectedValue: 0.31,
    riskLevel: "Medium", suggestedAction: "Strong Buy",
    reason: "BTC + ETH ETF precedent makes SOL approval likely. 34¢ materially underpriced given regulatory momentum.",
    bullCase: "SEC under current administration has signaled crypto-friendly posture. ETF applicants (Grayscale, VanEck) already filed. BTC ETF approved Jan 2024, ETH May 2024 — SOL is next in queue.",
    bearCase: "SEC could cite SOL's historical centralization concerns or validator concentration. A macro bear market could delay approval past 2026.",
    riskNotes: "Binary event risk — if approval rejected, price drops to ~10¢. Position size accordingly. Do not over-allocate.",
    suggestedExecution: "Strong Buy at 34¢. Allocate 3–5% of prediction market budget. Hold to resolution — do not trade around noise.",
  },
  {
    id: "fed-cut-yes",
    eventTitle: "Fed interest rate decision: next meeting",
    marketTitle: "25bps cut at Jun 2026 meeting",
    outcome: "YES", price: 27, confidence: 61, expectedValue: 0.24,
    riskLevel: "Medium", suggestedAction: "Small Buy",
    reason: "CME FedWatch and prediction market diverge. Recent CPI softening supports cut. Entry at 27¢ attractive.",
    bullCase: "April CPI printed below 2.8%. Fed speakers have shifted tone dovish. CME FedWatch pricing 38% cut probability — prediction market at 27¢ implies only 27%. The gap is the edge.",
    bearCase: "A hot jobs report or PCE surprise could push cut expectations to September 2026. If inflation re-accelerates, cut thesis collapses.",
    riskNotes: "Watch May CPI release (June 11) and May PCE (June 27) as key risk events before the June 18 meeting.",
    suggestedExecution: "Enter 27¢ with small position. Increase exposure after May CPI if data confirms disinflation. Target exit at 45–55¢ if consensus shifts.",
  },
  {
    id: "fed-hold-yes",
    eventTitle: "Fed interest rate decision: next meeting",
    marketTitle: "No change at Jun 2026 meeting",
    outcome: "YES", price: 61, confidence: 42, expectedValue: -0.14,
    riskLevel: "High", suggestedAction: "Watch",
    reason: "Hold priced too high relative to data. Await May CPI print before entering this side.",
    bullCase: "If May CPI surprises to the upside (3.2%+), the hold probability surges and 61¢ becomes cheap. Fed historically cautious about cutting prematurely.",
    bearCase: "Disinflation continues, labor market softens — hold probability slides to 40¢ or lower. Current pricing at 61¢ leaves little room for error.",
    riskNotes: "Do not enter until after May CPI data. Entering now is speculating against the data trend without a data catalyst.",
    suggestedExecution: "No entry yet. Set a conditional alert: if May CPI ≥ 3.0%, consider entry at market price. Otherwise sit out.",
  },
  {
    id: "apple-up",
    eventTitle: "Apple stock weekly close direction",
    marketTitle: "AAPL closes higher this week",
    outcome: "YES", price: 48, confidence: 55, expectedValue: 0.06,
    riskLevel: "Low", suggestedAction: "Watch",
    reason: "Near fair value. Sentiment signals muted. No actionable edge detected this week — monitor for catalyst.",
    bullCase: "Any positive services revenue or AI integration news could act as catalyst for a small weekly move higher. Broad market risk-on sentiment supports.",
    bearCase: "Without a specific catalyst, AAPL tends to track the broader market. A risk-off week would drag it lower with no intrinsic support.",
    riskNotes: "Weekly binary with limited edge. This market is best used as a hedge or small diversification play, not a primary position.",
    suggestedExecution: "Watch only. If a product or earnings-adjacent headline appears mid-week, reassess with fresh sentiment data.",
  },
];

const actionColor: Record<SuggestedAction, string> = {
  "Strong Buy": "#22d3ee",
  "Small Buy":  "#10b981",
  "Watch":      "#fbbf24",
  "Avoid":      "#ef4444",
};
const riskColor: Record<RiskLevel, string> = {
  Low: "#10b981", Medium: "#fbbf24", High: "#ef4444",
};

// ── Detail section helper ─────────────────────────────────────────────────────
function Section({ label, color, children }: { label: string; color: string; children: string }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color, marginBottom: 5 }}>
        {label}
      </div>
      <div style={{ fontSize: 11, color: "#c4b8e0", lineHeight: 1.6, background: "#0d0220", border: "1px solid #1a0d30", borderRadius: 6, padding: "8px 10px" }}>
        {children}
      </div>
    </div>
  );
}

// ── Draggable hook ────────────────────────────────────────────────────────────
function useDraggable(initialPos = { x: 200, y: 120 }) {
  const [pos, setPos] = useState(initialPos);
  const dragging      = useRef(false);
  const offset        = useRef({ x: 0, y: 0 });

  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    offset.current   = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    function onMove(ev: MouseEvent) {
      if (!dragging.current) return;
      setPos({ x: ev.clientX - offset.current.x, y: ev.clientY - offset.current.y });
    }
    function onUp() {
      dragging.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  return { pos, onMouseDown };
}

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
  const [selectedEvents, setSelectedEvents]     = useState<string[]>([]);

  // AI Market Analysis window state
  const [showAnalysis, setShowAnalysis]         = useState(false);
  const [selectedMA, setSelectedMA]             = useState<MarketAnalysis | null>(null);
  const [showDetail, setShowDetail]             = useState(false);

  // Analysis Detail — chat + order state
  type ChatMsg = { role: "user" | "ai"; text: string };
  const [chatMessages, setChatMessages]         = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput]               = useState("");
  const [orderSide, setOrderSide]               = useState<"YES" | "NO">("YES");
  const [orderAmount, setOrderAmount]           = useState("100");
  const [orderPlaced, setOrderPlaced]           = useState(false);

  // Portfolio state
  const [showPortfolio, setShowPortfolio]       = useState(false);
  const [portfolioTab, setPortfolioTab]         = useState<"overview"|"positions"|"orders"|"risk">("overview");
  const [balance, setBalance]                   = useState({ total: 1000, available: 1000, used: 0 });
  const [positions, setPositions]               = useState<PortfolioPosition[]>([]);
  const [orders, setOrders]                     = useState<PortfolioOrder[]>([]);
  const orderIdRef                              = useRef(0);

  // AI Discovery window state
  const [showDiscovery, setShowDiscovery]       = useState(false);
  const [discMinimized, setDiscMinimized]       = useState(false);
  const [discPos, setDiscPos]                   = useState<{ x: number; y: number } | null>(null);
  const [discSize, setDiscSize]                 = useState({ width: 420, height: 520 });

  // Draggable window positions (null = use CSS default)
  const [selectedEventsPos, setSelectedEventsPos] = useState<{ x: number; y: number } | null>(null);

  // Analysis Detail window — drag / resize / minimize
  const { pos: detailPos, onMouseDown: detailHeaderMouseDown } = useDraggable({ x: 760, y: 60 });
  const [detailSize, setDetailSize]               = useState({ width: 420, height: 580 });
  const [detailMinimized, setDetailMinimized]     = useState(false);

  // AI Market Analysis window — drag / resize / minimize
  const { pos: analysisPos, onMouseDown: analysisHeaderMouseDown } = useDraggable({ x: 340, y: 80 });
  const [analysisSize, setAnalysisSize]           = useState({ width: 400, height: 520 });
  const [analysisMinimized, setAnalysisMinimized] = useState(false);

  // Portfolio window — drag / resize / minimize
  const { pos: portfolioPos, onMouseDown: portfolioHeaderMouseDown } = useDraggable({ x: 820, y: 16 });
  const [portfolioSize, setPortfolioSize]         = useState({ width: 380, height: 560 });
  const [portfolioMinimized, setPortfolioMinimized] = useState(false);

  // Canvas pan refs
  const isDragging   = useRef(false);
  const lastMouse    = useRef({ x: 0, y: 0 });
  const mainRef      = useRef<HTMLElement | null>(null);
  const phaseTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const msgTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragId       = useRef<string | null>(null);
  const uidRef       = useRef(0);

  // Analyze events timers
  const analyzeTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Discovery window drag/resize refs
  const discWindowRef   = useRef<HTMLDivElement | null>(null);
  const discResizing    = useRef(false);
  const discResizeStart = useRef({ mouseX: 0, mouseY: 0, width: 0, height: 0 });

  // ── Canvas pan ──────────────────────────────────────────────────────────────
  function onMouseDown(e: React.MouseEvent) {
    isDragging.current = true;
    lastMouse.current  = { x: e.clientX, y: e.clientY };
    if (mainRef.current) mainRef.current.style.cursor = "grabbing";
  }

  function onMouseMove(e: React.MouseEvent) {
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
    discResizing.current = false;
    if (mainRef.current) mainRef.current.style.cursor = "grab";
  }

  function changeZoom(delta: number) {
    setZoom(z => Math.max(0.5, Math.min(2.0, Math.round((z + delta) * 10) / 10)));
  }

  // ── Discovery window drag/resize ──────────────────────────────────────────
  function onDiscHeaderMouseDown(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    const winEl  = discWindowRef.current;
    const mainEl = mainRef.current;
    if (!winEl || !mainEl) return;
    const winRect  = winEl.getBoundingClientRect();
    const mainRect = mainEl.getBoundingClientRect();
    const startLeft = winRect.left - mainRect.left;
    const startTop  = winRect.top  - mainRect.top;
    const ox = e.clientX - startLeft;
    const oy = e.clientY - startTop;
    setDiscPos({ x: startLeft, y: startTop });
    function onMove(me: MouseEvent) {
      setDiscPos({ x: me.clientX - ox, y: me.clientY - oy });
    }
    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      if (mainRef.current) mainRef.current.style.cursor = "grab";
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    if (mainRef.current) mainRef.current.style.cursor = "grabbing";
  }

  function onResizeHandleMouseDown(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    discResizing.current = true;
    discResizeStart.current = {
      mouseX: e.clientX, mouseY: e.clientY,
      width: discSize.width, height: discSize.height,
    };
  }

  // ── Left panel module drag ────────────────────────────────────────────────
  function onModuleDragStart(id: string) { dragId.current = id; }

  // ── Dolphin drop zone ─────────────────────────────────────────────────────
  function onDolphinDragOver(e: React.DragEvent)  { e.preventDefault(); e.stopPropagation(); }
  function onDolphinDragEnter(e: React.DragEvent) { e.preventDefault(); setDolphinDragOver(true); }
  function onDolphinDragLeave()                   { setDolphinDragOver(false); }

  function onDolphinDrop(e: React.DragEvent) {
    e.preventDefault(); e.stopPropagation();
    setDolphinDragOver(false);
    const id = dragId.current; dragId.current = null;
    if (!id) return;

    // ── Event card dropped from Discovery window ──
    if (id.startsWith("event:")) {
      const eventId = id.slice(6);
      const ev = mockEvents.find(ev => ev.eventId === eventId);
      if (!ev) return;
      setSelectedEvents(prev => prev.includes(eventId) ? prev : [...prev, eventId]);
      setCenterMsg("Event added for analysis");
      if (msgTimer.current) clearTimeout(msgTimer.current);
      msgTimer.current = setTimeout(() => setCenterMsg(null), 2000);
      return;
    }

    // ── Option history config dragged from Macro Library ──
    if (id.startsWith("optionhist:")) {
      const histId = parseInt(id.slice(11));
      const hist = optionHistory.find(h => h.id === histId);
      if (!hist) return;
      const mod = leftModules.find(m => m.label === hist.type);
      if (!mod) return;
      setDroppedNodes(prev => {
        const idx = prev.findIndex(n => n.label === hist.type);
        const config = hist.config.map(c => {
          const def = (defaultConfigs[hist.type] ?? []).find(f => f.label === c.label);
          return def ? { ...def, value: c.value } : { label: c.label, type: "text" as const, value: c.value };
        });
        if (idx >= 0) {
          return prev.map((n, i) => i === idx ? { ...n, config } : n);
        }
        const angle = (prev.length / 7) * Math.PI * 2 - Math.PI / 2;
        return [...prev, {
          uid: ++uidRef.current, label: hist.type, sub: mod.sub, accent: mod.accent, icon: mod.icon,
          x: Math.round(Math.cos(angle) * 230), y: Math.round(Math.sin(angle) * 230), config,
        }];
      });
      setCenterMsg("Config loaded.");
      if (msgTimer.current) clearTimeout(msgTimer.current);
      msgTimer.current = setTimeout(() => setCenterMsg(null), 2000);
      return;
    }

    // ── Strategy module dropped from left panel ──
    const mod = leftModules.find(m => m.id === id);
    if (!mod) return;

    const isUpdate = droppedNodes.some(n => n.label === mod.label);

    setDroppedNodes(prev => {
      const existsAt = prev.findIndex(n => n.label === mod.label);
      if (existsAt >= 0) {
        return prev.map((n, i) => i === existsAt ? { ...n, sub: mod.sub, accent: mod.accent, icon: mod.icon } : n);
      }
      const idx   = prev.length;
      const angle = (idx / 7) * Math.PI * 2 - Math.PI / 2;
      const x     = Math.round(Math.cos(angle) * 230);
      const y     = Math.round(Math.sin(angle) * 230);
      const config = (defaultConfigs[mod.label] ?? []).map(f => ({ ...f }));
      return [...prev, { uid: ++uidRef.current, label: mod.label, sub: mod.sub, accent: mod.accent, icon: mod.icon, x, y, config }];
    });

    if (isUpdate) {
      setCenterMsg(`${mod.label} updated`);
      if (msgTimer.current) clearTimeout(msgTimer.current);
      msgTimer.current = setTimeout(() => setCenterMsg(null), 2000);
    }
  }

  // ── Analyze events (sequential Dolphin status) ───────────────────────────
  function analyzeEvents() {
    if (selectedEvents.length === 0) {
      setCenterMsg("Select events first");
      if (msgTimer.current) clearTimeout(msgTimer.current);
      msgTimer.current = setTimeout(() => setCenterMsg(null), 2500);
      return;
    }
    analyzeTimers.current.forEach(clearTimeout);
    analyzeTimers.current = [];
    setDolphinPhase("analyzing_events");
    setCenterMsg("Reading selected events…");
    analyzeTimers.current.push(
      setTimeout(() => setCenterMsg("Finding tradable markets…"), 900),
      setTimeout(() => setCenterMsg("Ranking outcomes…"), 1800),
      setTimeout(() => {
        setCenterMsg("Analysis ready");
        setDolphinPhase("markets");
        setShowAnalysis(true);
        analyzeTimers.current.push(
          setTimeout(() => setCenterMsg(null), 1500)
        );
      }, 2700),
    );
  }

  // ── Dolphin click ─────────────────────────────────────────────────────────
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
    if (dolphinPhase === "markets") {
      setShowDiscovery(true); setDiscMinimized(false);
      return;
    }
    triggerDiscovery();
  }

  // ── Analysis Detail resize ────────────────────────────────────────────────
  function onDetailResizeMouseDown(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    const sw = detailSize.width, sh = detailSize.height;
    const sx = e.clientX,        sy = e.clientY;
    function onMove(me: MouseEvent) {
      setDetailSize({
        width:  Math.max(360, sw + me.clientX - sx),
        height: Math.max(420, sh + me.clientY - sy),
      });
    }
    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function makeResizeHandler(
    size: { width: number; height: number },
    setSize: (s: { width: number; height: number }) => void,
    minW: number, minH: number,
  ) {
    return function onResizeMouseDown(e: React.MouseEvent) {
      e.preventDefault(); e.stopPropagation();
      const sw = size.width, sh = size.height, sx = e.clientX, sy = e.clientY;
      function onMove(me: MouseEvent) {
        setSize({ width: Math.max(minW, sw + me.clientX - sx), height: Math.max(minH, sh + me.clientY - sy) });
      }
      function onUp() {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      }
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    };
  }

  // ── AI Chat ───────────────────────────────────────────────────────────────
  function sendChatMessage() {
    const text = chatInput.trim();
    if (!text || !selectedMA) return;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", text }]);
    const lower = text.toLowerCase();
    let aiReply: string;
    let patch: Partial<MarketAnalysis> = {};
    if (/conservative|safer|reduce risk/.test(lower)) {
      patch = {
        confidence: Math.max(0, selectedMA.confidence - 5),
        riskLevel: selectedMA.riskLevel === "High" ? "Medium" : "Low",
        suggestedAction: selectedMA.suggestedAction === "Strong Buy" ? "Small Buy" : "Watch",
      };
      aiReply = "Adjusted to a more conservative view due to volatility and time-to-resolution risk.";
    } else if (/aggressive|higher conviction/.test(lower)) {
      patch = {
        confidence: Math.min(100, selectedMA.confidence + 5),
        suggestedAction: "Strong Buy",
      };
      aiReply = "Adjusted to a higher-conviction view based on stronger directional assumptions.";
    } else {
      aiReply = "I updated the analysis context based on your preference.";
    }
    if (Object.keys(patch).length > 0) setSelectedMA({ ...selectedMA, ...patch });
    setTimeout(() => setChatMessages(prev => [...prev, { role: "ai", text: aiReply }]), 600);
  }

  // ── Portfolio order placement ─────────────────────────────────────────────
  function placeOrder() {
    if (!selectedMA) return;
    const amt = parseFloat(orderAmount);
    if (isNaN(amt) || amt <= 0) return;
    const clampedAmt = Math.min(amt, balance.available);
    if (clampedAmt <= 0) return;

    const newOrder: PortfolioOrder = {
      id: ++orderIdRef.current,
      eventTitle: selectedMA.eventTitle,
      outcome: orderSide,
      amount: clampedAmt,
      price: selectedMA.price,
      timestamp: Date.now(),
      type: "Mock Market",
      status: "Filled",
    };
    setOrders(prev => [newOrder, ...prev]);

    const posKey = `${selectedMA.eventTitle}::${orderSide}`;
    const mockCurrentPrice = Math.max(1, Math.min(99, selectedMA.price + Math.round((Math.random() - 0.5) * 6)));
    const eventCategory = mockEvents.find(e => e.title === selectedMA.eventTitle)?.category ?? "Other";
    setPositions(prev => {
      const existing = prev.find(p => p.key === posKey && p.status === "Open");
      if (existing) {
        return prev.map(p => (p.key !== posKey || p.status !== "Open") ? p : {
          ...p,
          size: p.size + clampedAmt,
          avgPrice: Math.round((p.avgPrice * p.size + selectedMA.price * clampedAmt) / (p.size + clampedAmt)),
          currentPrice: mockCurrentPrice,
        });
      }
      return [...prev, {
        key: posKey, eventTitle: selectedMA.eventTitle, category: eventCategory,
        outcome: orderSide, size: clampedAmt, avgPrice: selectedMA.price,
        currentPrice: mockCurrentPrice, status: "Open",
      }];
    });

    setBalance(b => ({ total: b.total, available: b.available - clampedAmt, used: b.used + clampedAmt }));
    setOrderPlaced(true);
    setShowPortfolio(true);
    setPortfolioTab("overview");
  }

  // ── Close position ────────────────────────────────────────────────────────
  function closePosition(key: string) {
    const pos = positions.find(p => p.key === key && p.status === "Open");
    if (!pos) return;
    setPositions(prev => prev.map(p =>
      p.key === key && p.status === "Open" ? { ...p, status: "Closed" } : p
    ));
    const closeOrder: PortfolioOrder = {
      id: ++orderIdRef.current,
      eventTitle: pos.eventTitle,
      outcome: pos.outcome,
      amount: pos.size,
      price: pos.currentPrice,
      timestamp: Date.now(),
      type: "Close",
      status: "Filled",
    };
    setOrders(prev => [closeOrder, ...prev]);
    setBalance(b => ({ total: b.total, available: b.available + pos.size, used: b.used - pos.size }));
  }

  // Strategy Settings panel refs + saved state
  const blockRefs      = useRef<Record<number, HTMLDivElement | null>>({});
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Macro Strategy popup state
  type MacroPopupStep = "hidden" | "ask" | "name" | "saved";
  const [macroPopup, setMacroPopup]           = useState<MacroPopupStep>("hidden");
  const [macroName, setMacroName]             = useState("");
  const [macroStrategies, setMacroStrategies] = useState<MacroStrategy[]>([]);
  const macroIdRef                            = useRef(0);

  // Macro Library panel state
  const [showMacros, setShowMacros]           = useState(false);
  const [macroLibTab, setMacroLibTab]         = useState("All Macros");
  const [optionHistory, setOptionHistory]     = useState<OptionHistory[]>([]);
  const optionHistIdRef                       = useRef(0);

  function defaultMacroName() {
    const cats = [...new Set(droppedNodes.map(n => {
      if (n.label.includes("Sentiment") || n.label.includes("Social")) return "Sentiment";
      if (n.label.includes("Market") || n.label.includes("Data")) return "Market";
      if (n.label.includes("Strategy") || n.label.includes("Execution")) return "Momentum";
      if (n.label.includes("Risk")) return "Conservative";
      return "Adaptive";
    }))];
    const prefix = cats[0] ?? "Dolphin";
    return `${prefix} Strategy #${macroIdRef.current + 1}`;
  }

  function saveMacro() {
    const name = macroName.trim() || defaultMacroName();
    const snap: MacroStrategy = {
      id: ++macroIdRef.current,
      name,
      createdAt: Date.now(),
      options: droppedNodes.map(n => ({
        label: n.label, sub: n.sub, accent: n.accent, icon: n.icon,
        config: n.config.map(f => ({ label: f.label, value: f.value })),
      })),
      summary: `${droppedNodes.length} module${droppedNodes.length !== 1 ? "s" : ""}: ${droppedNodes.map(n => n.label).join(", ")}`,
    };
    setMacroStrategies(prev => [snap, ...prev]);
    setMacroPopup("saved");
    setTimeout(() => setMacroPopup("hidden"), 2200);
  }

  function saveOptionHistory(nodes: DroppedNode[]) {
    if (nodes.length === 0) return;
    const now = Date.now();
    setOptionHistory(prev => {
      let updated = [...prev];
      for (const n of nodes) {
        const idx = updated.findIndex(h => h.type === n.label);
        const entry: OptionHistory = {
          id: idx >= 0 ? updated[idx].id : ++optionHistIdRef.current,
          type: n.label,
          config: n.config.map(f => ({ label: f.label, value: f.value })),
          updatedAt: now,
        };
        if (idx >= 0) { updated[idx] = entry; }
        else           { updated = [entry, ...updated]; }
      }
      return updated;
    });
  }

  // ── Node interactions ─────────────────────────────────────────────────────
  function onNodeClick(e: React.MouseEvent, uid: number) {
    e.stopPropagation();
    setSelUid(uid);
    setTimeout(() => {
      blockRefs.current[uid]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 0);
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

  // ── Derived ───────────────────────────────────────────────────────────────
  const isAnalyzing = dolphinPhase === "analyzing" || dolphinPhase === "analyzing_events";

  const centerLabel = centerMsg
    ? centerMsg
    : dolphinPhase === "analyzing"        ? "Analyzing strategy…"
    : dolphinPhase === "analyzing_events" ? "Analyzing events…"
    : dolphinPhase === "markets"          ? (selectedEvents.length > 0 ? `${selectedEvents.length} event${selectedEvents.length !== 1 ? "s" : ""} selected` : "Drop events on me")
    : droppedNodes.length === 0           ? "Drop modules here"
    : "Click to discover";

  const centerColor = isAnalyzing            ? "#c084fc"
    : dolphinPhase === "markets"             ? "#10b981"
    : centerMsg                              ? (droppedNodes.length === 0 ? "#fb923c" : "#a855f7")
    : droppedNodes.length > 0               ? "#8b5cf6"
    : "#3b2060";

  const selNode = droppedNodes.find(n => n.uid === selUid) ?? null;

  const filteredEvents = mockEvents
    .filter(ev => filterCat === "All" || ev.category === filterCat)
    .sort((a, b) =>
      sortBy === "volume"      ? b.volume - a.volume :
      sortBy === "closingSoon" ? a.endTimeDays - b.endTimeDays :
      b.matchScore - a.matchScore
    );

  const discWindowStyle: React.CSSProperties = discPos
    ? { left: discPos.x, top: discPos.y }
    : { right: 16, top: 80 };

  // ── Render ────────────────────────────────────────────────────────────────
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
          <button
            onClick={() => setShowPortfolio(p => !p)}
            className="px-3 py-1 text-xs rounded font-mono"
            style={{
              color: showPortfolio ? "#fff" : "#22d3ee",
              background: showPortfolio ? "#0e3a3a" : "transparent",
              border: `1px solid ${showPortfolio ? "#22d3ee66" : "#22d3ee33"}`,
              transition: "all 0.15s ease",
            }}>Portfolio</button>
          <button
            onClick={() => setShowMacros(p => !p)}
            className="px-3 py-1 text-xs rounded font-mono"
            style={{
              position: "relative",
              color: showMacros ? "#fff" : "#c084fc",
              background: showMacros ? "#1e0a3a" : "transparent",
              border: `1px solid ${showMacros ? "#a855f766" : "#a855f733"}`,
              transition: "all 0.15s ease",
            }}>
            Macros
            {macroStrategies.length > 0 && (
              <span style={{ position: "absolute", top: -5, right: -5, background: "#7c3aed", color: "#fff", fontSize: 8, fontFamily: "monospace", fontWeight: 700, borderRadius: 999, width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {macroStrategies.length}
              </span>
            )}
          </button>
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
                    onDragStart={() => onModuleDragStart(m.id)}
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
            opacity: isAnalyzing ? 1 : 0,
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
                background: `radial-gradient(circle, ${isAnalyzing ? "#7c3aed32" : "#7c3aed16"} 0%, transparent 65%)`,
                filter: "blur(28px)", transition: "background 0.7s ease",
              }} />
              <div className="absolute rounded-full orbit-spin" style={{
                inset: -88,
                border: `1px dashed ${isAnalyzing ? "#7c3aed55" : "#7c3aed28"}`,
                transition: "border-color 0.7s ease",
              }} />
              <div className="absolute rounded-full core-pulse" style={{
                inset: -54,
                border: `1px solid ${isAnalyzing ? "#a855f766" : "#7c3aed30"}`,
                transition: "border-color 0.7s ease",
              }} />
              <div className="absolute rounded-full" style={{ inset: -26, border: "1px solid #a855f724" }} />
              <div className="absolute rounded-full" style={{
                inset: -55,
                background: `radial-gradient(circle, ${isAnalyzing ? "#7c3aed44" : "#7c3aed24"} 0%, transparent 70%)`,
                filter: "blur(14px)", transition: "background 0.7s ease",
              }} />
              <img src="/logo.png" alt="Dolphin AI" width={120} height={120}
                className={isAnalyzing ? "logo-breathe-intense" : "logo-breathe"} />
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
                display: "flex", flexDirection: "column",
                background: "#08010e",
                border: "1px solid #2d1b4e",
                borderRadius: 12,
                boxShadow: "0 12px 48px #00000099, 0 0 80px #7c3aed1a, 0 0 1px #a855f733",
                overflow: "hidden",
              }}
            >
              {/* Header (draggable) */}
              <div
                onMouseDown={onDiscHeaderMouseDown}
                style={{
                  padding: "10px 12px 9px",
                  borderBottom: discMinimized ? "none" : "1px solid #160930",
                  flexShrink: 0, cursor: "grab", userSelect: "none",
                  background: "linear-gradient(180deg, #0d0320 0%, #09010f 100%)",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                }}
              >
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
                        · {mockEvents.length} events
                      </span>
                    )}
                  </div>
                  {!discMinimized && (
                    <span style={{ fontSize: 9, color: "#10b981", fontFamily: "monospace", background: "#10b98115", border: "1px solid #10b98133", borderRadius: 3, padding: "1px 6px" }}>
                      {filteredEvents.length} matched
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); setDiscMinimized(m => !m); }}
                    style={{ width: 22, height: 22, borderRadius: 5, border: "1px solid #2d1b4e", color: "#6b4d90", background: "transparent", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >{discMinimized ? "▢" : "−"}</button>
                  <button
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); setShowDiscovery(false); setDolphinPhase("idle"); }}
                    style={{ width: 22, height: 22, borderRadius: 5, border: "1px solid #2d1b4e", color: "#6b4d90", background: "transparent", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >✕</button>
                </div>
              </div>

              {/* Body */}
              {!discMinimized && (
                <>
                  {/* Filters + sort */}
                  <div style={{ padding: "8px 12px", borderBottom: "1px solid #160930", flexShrink: 0 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 7 }}>
                      {["All","Crypto","Macro","Stocks","Politics","Sports"].map(cat => (
                        <button key={cat}
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
                      <select value={sortBy} onChange={e => setSortBy(e.target.value)} onMouseDown={e => e.stopPropagation()}
                        style={{ fontSize: 10, background: "#130828", color: "#c084fc", border: "1px solid #2d1b4e", borderRadius: 4, padding: "2px 6px", fontFamily: "monospace", outline: "none", cursor: "pointer" }}>
                        <option value="matchScore">Match Score</option>
                        <option value="volume">Volume</option>
                        <option value="closingSoon">Closing Soon</option>
                      </select>
                      <span style={{ marginLeft: "auto", fontSize: 9, color: "#3b2060", fontFamily: "monospace" }}>
                        ⊡ drag card → Dolphin
                      </span>
                    </div>
                  </div>

                  {/* Event cards */}
                  <div className="custom-scrollbar" style={{ overflowY: "auto", flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 7 }}>
                    {filteredEvents.map(ev => {
                      const isAdded = selectedEvents.includes(ev.eventId);
                      const accent  = catAccent[ev.category] ?? "#8b5cf6";
                      return (
                        <div
                          key={ev.eventId}
                          draggable={!isAdded}
                          onDragStart={e => {
                            e.stopPropagation();
                            dragId.current = "event:" + ev.eventId;
                          }}
                          style={{
                            background: isAdded ? "#08021a" : "#0c0420",
                            border: `1px solid ${isAdded ? "#10b98133" : "#2d1b4e"}`,
                            borderRadius: 9,
                            padding: "10px 11px",
                            flexShrink: 0,
                            cursor: isAdded ? "default" : "grab",
                            opacity: isAdded ? 0.72 : 1,
                            transition: "border-color 0.2s, opacity 0.2s",
                          }}
                        >
                          {/* Row 1: category chip + match score */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                            <span style={{
                              fontSize: 9, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em",
                              color: accent, background: accent + "18", border: `1px solid ${accent}33`,
                              borderRadius: 3, padding: "1px 6px",
                            }}>{ev.category}</span>
                            <span style={{ fontSize: 9, color: "#a855f7", fontFamily: "monospace", background: "#a855f715", border: "1px solid #a855f733", borderRadius: 3, padding: "1px 5px" }}>
                              ⬥ {ev.matchScore}%
                            </span>
                          </div>

                          {/* Row 2: title */}
                          <div style={{ fontSize: 12, color: "#d4c4f0", lineHeight: 1.45, marginBottom: 4, maxHeight: "2.9em", overflow: "hidden" }}>
                            {ev.title}
                          </div>

                          {/* Row 3: match reason */}
                          <div style={{ fontSize: 9, color: "#4a3060", fontFamily: "monospace", marginBottom: 6, fontStyle: "italic" }}>
                            {ev.shortReason}
                          </div>

                          {/* Row 4: outcomes + end time + volume */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                              <span style={{ fontSize: 9, color: "#8b5cf6", background: "#8b5cf615", border: "1px solid #8b5cf633", borderRadius: 3, padding: "1px 6px", fontFamily: "monospace" }}>
                                {ev.outcomesCount} markets
                              </span>
                              <span style={{ fontSize: 9, color: "#3b2060", fontFamily: "monospace" }}>
                                ends {ev.endTime}
                              </span>
                            </div>
                            <span style={{ fontSize: 9, color: "#3b2060", fontFamily: "monospace" }}>
                              ${(ev.volume / 1000).toFixed(0)}K vol
                            </span>
                          </div>

                          {/* Row 5: drag CTA or added badge */}
                          {isAdded ? (
                            <div style={{ fontSize: 10, color: "#10b981", fontFamily: "monospace", textAlign: "center", padding: "3px 0", background: "#10b98110", borderRadius: 4 }}>
                              ✓ Added for analysis
                            </div>
                          ) : (
                            <div style={{ fontSize: 9, color: "#3b2060", fontFamily: "monospace", textAlign: "center", padding: "3px 0", border: "1px dashed #2d1b4e", borderRadius: 4 }}>
                              ⊡ Drag to Dolphin for analysis
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {filteredEvents.length === 0 && (
                      <div style={{ fontSize: 11, fontFamily: "monospace", textAlign: "center", padding: "40px 0", color: "#3b2060" }}>
                        No events in this category
                      </div>
                    )}
                  </div>

                  {/* Resize handle */}
                  <div
                    onMouseDown={onResizeHandleMouseDown}
                    style={{ position: "absolute", bottom: 0, right: 0, width: 20, height: 20, cursor: "nwse-resize", display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: "4px" }}
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

          {/* ── Selected Events Panel ── */}
          {selectedEvents.length > 0 && (
            <div
              onMouseDown={e => e.stopPropagation()}
              onClick={e => e.stopPropagation()}
              style={{
                position: "absolute", left: 16, bottom: 16,
                width: 272, maxHeight: 300,
                zIndex: 50,
                display: "flex", flexDirection: "column",
                background: "#08010e",
                border: "1px solid #2d1b4e",
                borderRadius: 10,
                boxShadow: "0 8px 32px #00000077, 0 0 40px #7c3aed14",
                overflow: "hidden",
              }}
            >
              {/* Panel header */}
              <div style={{
                padding: "8px 12px", borderBottom: "1px solid #160930", flexShrink: 0,
                background: "#0d0320", display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 10, color: "#c084fc", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.12em" }}>Selected Events</span>
                  <span style={{ fontSize: 9, color: "#fff", background: "#7c3aed", borderRadius: 10, padding: "1px 6px", fontFamily: "monospace" }}>
                    {selectedEvents.length}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedEvents([])}
                  style={{ fontSize: 9, color: "#4a3060", fontFamily: "monospace", background: "transparent", border: "none", cursor: "pointer" }}>
                  Clear all
                </button>
              </div>

              {/* Event list */}
              <div className="custom-scrollbar" style={{ overflowY: "auto", flex: 1 }}>
                {selectedEvents.map(evId => {
                  const ev = mockEvents.find(e => e.eventId === evId);
                  if (!ev) return null;
                  const accent = catAccent[ev.category] ?? "#8b5cf6";
                  return (
                    <div key={evId} style={{
                      padding: "7px 12px", borderBottom: "1px solid #0f0820",
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: accent, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: "#d4c4f0", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                          {ev.title}
                        </div>
                        <div style={{ fontSize: 9, color: "#4a3060", fontFamily: "monospace", marginTop: 1 }}>
                          {ev.category} · {ev.outcomesCount} markets
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedEvents(prev => prev.filter(id => id !== evId))}
                        style={{ flexShrink: 0, color: "#3b2060", background: "transparent", border: "none", cursor: "pointer", fontSize: 13, lineHeight: 1 }}>
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Analyze button */}
              <div style={{ padding: "8px 12px", flexShrink: 0, borderTop: "1px solid #160930" }}>
                <button
                  onClick={analyzeEvents}
                  style={{
                    width: "100%", padding: "6px 0", borderRadius: 6, fontSize: 11, fontFamily: "monospace",
                    background: dolphinPhase === "analyzing_events"
                      ? "#3b1f6e"
                      : "linear-gradient(135deg,#7c3aed,#a855f7)",
                    color: "#fff", border: "none",
                    cursor: dolphinPhase === "analyzing_events" ? "default" : "pointer",
                    opacity: dolphinPhase === "analyzing_events" ? 0.7 : 1,
                    transition: "opacity 0.2s, background 0.2s",
                  }}
                  disabled={dolphinPhase === "analyzing_events"}
                >
                  {dolphinPhase === "analyzing_events" ? "Analyzing…" : `Analyze ${selectedEvents.length} Event${selectedEvents.length !== 1 ? "s" : ""} →`}
                </button>
              </div>
            </div>
          )}

          {/* ── AI Market Analysis floating window ── */}
          {showAnalysis && (
            analysisMinimized ? (
              <div onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); setAnalysisMinimized(false); }}
                style={{ position: "absolute", left: analysisPos.x, top: analysisPos.y, zIndex: 50, cursor: "pointer", userSelect: "none", display: "inline-flex", alignItems: "center", gap: 8, background: "#0d0320", border: "1px solid #2d1b4e", borderRadius: 20, padding: "5px 12px 5px 10px", boxShadow: "0 4px 20px #00000088, 0 0 30px #7c3aed18" }}>
                <span style={{ fontSize: 10, color: "#c084fc", fontFamily: "monospace" }}>▢</span>
                <span style={{ fontSize: 10, color: "#d4c4f0", fontFamily: "monospace" }}>AI Market Analysis</span>
                <button onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); setShowAnalysis(false); }} style={{ marginLeft: 4, color: "#4a3060", background: "transparent", border: "none", cursor: "pointer", fontSize: 12, lineHeight: 1, padding: 0 }}>✕</button>
              </div>
            ) : (
            <div
              onMouseDown={e => e.stopPropagation()}
              onClick={e => e.stopPropagation()}
              style={{
                position: "absolute", left: analysisPos.x, top: analysisPos.y,
                width: analysisSize.width, height: analysisSize.height,
                zIndex: 50,
                display: "flex", flexDirection: "column",
                background: "#08010e",
                border: "1px solid #2d1b4e",
                borderRadius: 12,
                boxShadow: "0 12px 48px #00000099, 0 0 80px #7c3aed1a, 0 0 1px #a855f733",
                overflow: "hidden",
              }}
            >
              {/* Header — drag handle */}
              <div
                onMouseDown={analysisHeaderMouseDown}
                style={{ padding: "12px 14px 10px", borderBottom: "1px solid #160930", flexShrink: 0, cursor: "grab", userSelect: "none", background: "linear-gradient(180deg, #0d0320 0%, #09010f 100%)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}
              >
                <div>
                  <div style={{ fontSize: 11, color: "#c084fc", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600 }}>AI Market Analysis</div>
                  <div style={{ fontSize: 10, color: "#4a3060", fontFamily: "monospace", marginTop: 3 }}>Tradable outcomes generated from selected events</div>
                </div>
                <div onMouseDown={e => e.stopPropagation()} style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button onClick={e => { e.stopPropagation(); setAnalysisMinimized(true); }}
                    style={{ width: 22, height: 22, borderRadius: 5, border: "1px solid #2d1b4e", color: "#6b4d90", background: "transparent", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>_</button>
                  <button onClick={e => { e.stopPropagation(); setShowAnalysis(false); }}
                    style={{ width: 22, height: 22, borderRadius: 5, border: "1px solid #2d1b4e", color: "#6b4d90", background: "transparent", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
              </div>

              {/* Card list */}
              <div className="custom-scrollbar" style={{ overflowY: "auto", flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
                {mockMarketAnalyses.map(ma => {
                  const isSel = selectedMA?.id === ma.id;
                  const evSign = ma.expectedValue >= 0 ? "+" : "";
                  return (
                    <div
                      key={ma.id}
                      onClick={e => { e.stopPropagation(); if (isSel) { setShowDetail(false); setSelectedMA(null); } else { setSelectedMA(ma); setShowDetail(true); setDetailMinimized(false); setChatMessages([]); setChatInput(""); setOrderSide(ma.outcome); setOrderAmount("100"); setOrderPlaced(false); } }}
                      style={{
                        background: isSel ? "#110330" : "#0c0420",
                        border: `1px solid ${isSel ? "#7c3aed88" : "#2d1b4e"}`,
                        borderRadius: 8, padding: "9px 11px", cursor: "pointer", flexShrink: 0,
                        boxShadow: isSel ? "0 0 18px #7c3aed22" : "none",
                        transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
                      }}
                    >
                      <div style={{ fontSize: 9, color: "#4a3060", fontFamily: "monospace", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{ma.eventTitle}</div>
                      <div style={{ fontSize: 11, color: "#d4c4f0", lineHeight: 1.4, marginBottom: 6, maxHeight: "2.8em", overflow: "hidden" }}>{ma.marketTitle}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, fontFamily: "monospace", fontWeight: 600, borderRadius: 3, padding: "1px 6px", color: ma.outcome === "YES" ? "#10b981" : "#fb923c", background: ma.outcome === "YES" ? "#10b98118" : "#fb923c18", border: `1px solid ${ma.outcome === "YES" ? "#10b98133" : "#fb923c33"}` }}>{ma.outcome} {ma.price}¢</span>
                        <span style={{ fontSize: 10, fontFamily: "monospace", fontWeight: 600, borderRadius: 3, padding: "1px 7px", color: actionColor[ma.suggestedAction], background: actionColor[ma.suggestedAction] + "18", border: `1px solid ${actionColor[ma.suggestedAction]}33` }}>{ma.suggestedAction}</span>
                        <span style={{ fontSize: 9, color: "#6b4d90", fontFamily: "monospace", marginLeft: "auto" }}>⬥ {ma.confidence}% conf</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: 9, fontFamily: "monospace", color: ma.expectedValue >= 0 ? "#10b981" : "#ef4444" }}>EV {evSign}{(ma.expectedValue * 100).toFixed(0)}%</span>
                        <span style={{ fontSize: 9, fontFamily: "monospace", color: riskColor[ma.riskLevel] }}>Risk: {ma.riskLevel}</span>
                      </div>
                      <div style={{ fontSize: 10, color: "#4a3060", lineHeight: 1.45, maxHeight: "2.9em", overflow: "hidden" }}>{ma.reason}</div>
                    </div>
                  );
                })}
              </div>

              {/* Resize handle */}
              <div onMouseDown={makeResizeHandler(analysisSize, setAnalysisSize, 360, 300)}
                style={{ position: "absolute", bottom: 0, right: 0, width: 18, height: 18, cursor: "nwse-resize", display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: 4 }}>
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><line x1="8" y1="2" x2="2" y2="8" stroke="#3b2060" strokeWidth="1.5" strokeLinecap="round"/><line x1="8" y1="6" x2="6" y2="8" stroke="#3b2060" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
            </div>
            )
          )}

          {/* ── Analysis Detail Window ── */}
          {showDetail && selectedMA && (
            detailMinimized ? (
              /* Minimized pill */
              <div
                onMouseDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); setDetailMinimized(false); }}
                style={{
                  position: "absolute", left: detailPos.x, top: detailPos.y,
                  zIndex: 60, cursor: "pointer", userSelect: "none",
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "#100228", border: "1px solid #3b1f6e",
                  borderRadius: 20, padding: "5px 12px 5px 10px",
                  boxShadow: "0 4px 20px #00000088, 0 0 30px #7c3aed18",
                }}
              >
                <span style={{ fontSize: 10, color: "#c084fc", fontFamily: "monospace" }}>▢</span>
                <span style={{ fontSize: 10, color: "#d4c4f0", fontFamily: "monospace", maxWidth: 260, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                  Analysis Detail · {selectedMA.marketTitle}
                </span>
                <button
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); setShowDetail(false); setSelectedMA(null); }}
                  style={{ marginLeft: 4, color: "#4a3060", background: "transparent", border: "none", cursor: "pointer", fontSize: 12, lineHeight: 1, padding: 0 }}
                >✕</button>
              </div>
            ) : (
            <div
              onMouseDown={e => e.stopPropagation()}
              onClick={e => e.stopPropagation()}
              style={{
                position: "absolute",
                left: detailPos.x, top: detailPos.y,
                width: detailSize.width, height: detailSize.height,
                zIndex: 60,
                display: "flex", flexDirection: "column",
                background: "#08010e",
                border: "1px solid #3b1f6e",
                borderRadius: 12,
                boxShadow: "0 16px 56px #000000bb, 0 0 100px #7c3aed22, 0 0 1px #c084fc44",
                overflow: "hidden",
              }}
            >
              {/* Header — drag handle */}
              <div
                onMouseDown={detailHeaderMouseDown}
                style={{
                  padding: "11px 14px 9px",
                  borderBottom: "1px solid #1a0d30",
                  flexShrink: 0,
                  cursor: "grab", userSelect: "none",
                  background: "linear-gradient(180deg, #100228 0%, #09010f 100%)",
                  display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8,
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 9, color: "#4a3060", fontFamily: "monospace", textTransform: "uppercase", marginBottom: 3 }}>
                    {selectedMA.eventTitle}
                  </div>
                  <div style={{ fontSize: 12, color: "#d4c4f0", lineHeight: 1.4, fontWeight: 500, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                    {selectedMA.marketTitle}
                  </div>
                  <div style={{ display: "flex", gap: 5, marginTop: 7, flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: 10, fontFamily: "monospace", fontWeight: 600, borderRadius: 3, padding: "2px 8px",
                      color: selectedMA.outcome === "YES" ? "#10b981" : "#fb923c",
                      background: selectedMA.outcome === "YES" ? "#10b98118" : "#fb923c18",
                      border: `1px solid ${selectedMA.outcome === "YES" ? "#10b98133" : "#fb923c33"}`,
                    }}>
                      {selectedMA.outcome} {selectedMA.price}¢
                    </span>
                    <span style={{
                      fontSize: 10, fontFamily: "monospace", fontWeight: 600, borderRadius: 3, padding: "2px 8px",
                      color: actionColor[selectedMA.suggestedAction],
                      background: actionColor[selectedMA.suggestedAction] + "18",
                      border: `1px solid ${actionColor[selectedMA.suggestedAction]}33`,
                    }}>
                      {selectedMA.suggestedAction}
                    </span>
                  </div>
                </div>
                {/* Window controls */}
                <div onMouseDown={e => e.stopPropagation()} style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button
                    onClick={e => { e.stopPropagation(); setDetailMinimized(true); }}
                    style={{ width: 22, height: 22, borderRadius: 5, border: "1px solid #2d1b4e", color: "#6b4d90", background: "transparent", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
                  >_</button>
                  <button
                    onClick={e => { e.stopPropagation(); setShowDetail(false); setSelectedMA(null); }}
                    style={{ width: 22, height: 22, borderRadius: 5, border: "1px solid #2d1b4e", color: "#6b4d90", background: "transparent", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >✕</button>
                </div>
              </div>

              {/* Body */}
              <div className="custom-scrollbar" style={{ overflowY: "auto", flex: 1, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 12 }}>

                {/* Stats row */}
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { label: "Confidence", value: `${selectedMA.confidence}%`, color: "#a855f7" },
                    { label: "Exp. Value",  value: `${selectedMA.expectedValue >= 0 ? "+" : ""}${(selectedMA.expectedValue * 100).toFixed(0)}%`, color: selectedMA.expectedValue >= 0 ? "#10b981" : "#ef4444" },
                    { label: "Risk",        value: selectedMA.riskLevel, color: riskColor[selectedMA.riskLevel] },
                  ].map(s => (
                    <div key={s.label} style={{
                      flex: 1, background: "#0d0220", border: "1px solid #2d1b4e", borderRadius: 7,
                      padding: "7px 10px", textAlign: "center",
                    }}>
                      <div style={{ fontSize: 9, color: "#4a3060", fontFamily: "monospace", marginBottom: 3 }}>{s.label}</div>
                      <div style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 700, color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                <Section label="Key Reasoning" color="#8b5cf6">{selectedMA.reason}</Section>
                <Section label="Bull Case"     color="#10b981">{selectedMA.bullCase}</Section>
                <Section label="Bear Case"     color="#ef4444">{selectedMA.bearCase}</Section>
                <Section label="Risk Notes"    color="#fbbf24">{selectedMA.riskNotes}</Section>

                {/* ── AI Chat ────────────────────────────────────────────── */}
                <div style={{ borderTop: "1px solid #1a0d30", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 9, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#c084fc" }}>
                    AI Chat — adjust analysis
                  </div>

                  {/* Message list */}
                  {chatMessages.length > 0 && (
                    <div className="custom-scrollbar" style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflowY: "auto" }}>
                      {chatMessages.map((msg, i) => (
                        <div key={i} style={{
                          display: "flex",
                          justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                        }}>
                          <div style={{
                            maxWidth: "82%",
                            fontSize: 11, lineHeight: 1.5,
                            padding: "6px 10px",
                            borderRadius: msg.role === "user" ? "8px 8px 2px 8px" : "8px 8px 8px 2px",
                            background: msg.role === "user" ? "#3b1f6e" : "#0d0220",
                            border: `1px solid ${msg.role === "user" ? "#6d28d966" : "#2d1b4e"}`,
                            color: msg.role === "user" ? "#e2d4f0" : "#c4b8e0",
                          }}>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Input row */}
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onMouseDown={e => e.stopPropagation()}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
                      placeholder="e.g. make it more conservative…"
                      style={{
                        flex: 1, background: "#0d0220", border: "1px solid #2d1b4e", borderRadius: 6,
                        padding: "6px 10px", fontSize: 11, color: "#d4c4f0",
                        fontFamily: "var(--font-geist-sans), Arial, sans-serif",
                        outline: "none",
                      }}
                    />
                    <button
                      onMouseDown={e => e.stopPropagation()}
                      onClick={sendChatMessage}
                      style={{
                        flexShrink: 0, padding: "6px 12px", borderRadius: 6, fontSize: 11,
                        background: "linear-gradient(135deg,#7c3aed,#a855f7)",
                        color: "#fff", border: "none", cursor: "pointer", fontFamily: "monospace",
                      }}
                    >Send</button>
                  </div>
                </div>

                {/* ── Mock Order ─────────────────────────────────────────── */}
                <div style={{ borderTop: "1px solid #1a0d30", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 9, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#22d3ee" }}>
                    Mock Order
                  </div>

                  {/* YES / NO toggle */}
                  <div style={{ display: "flex", gap: 4 }}>
                    {(["YES", "NO"] as const).map(side => (
                      <button
                        key={side}
                        onMouseDown={e => e.stopPropagation()}
                        onClick={() => { setOrderSide(side); setOrderPlaced(false); }}
                        style={{
                          flex: 1, padding: "5px 0", borderRadius: 5, fontSize: 11, fontFamily: "monospace", fontWeight: 600,
                          cursor: "pointer",
                          background: orderSide === side
                            ? (side === "YES" ? "#10b98122" : "#fb923c22")
                            : "transparent",
                          border: `1px solid ${orderSide === side
                            ? (side === "YES" ? "#10b98166" : "#fb923c66")
                            : "#2d1b4e"}`,
                          color: orderSide === side
                            ? (side === "YES" ? "#10b981" : "#fb923c")
                            : "#4a3060",
                          transition: "all 0.15s ease",
                        }}
                      >{side}</button>
                    ))}
                  </div>

                  {/* Amount + shares */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, color: "#4a3060", fontFamily: "monospace", marginBottom: 3 }}>Amount (USDC)</div>
                      <input
                        type="number" min="1"
                        value={orderAmount}
                        onChange={e => { setOrderAmount(e.target.value); setOrderPlaced(false); }}
                        onMouseDown={e => e.stopPropagation()}
                        style={{
                          width: "100%", background: "#0d0220", border: "1px solid #2d1b4e", borderRadius: 6,
                          padding: "6px 10px", fontSize: 12, color: "#d4c4f0",
                          fontFamily: "monospace", outline: "none",
                        }}
                      />
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 9, color: "#4a3060", fontFamily: "monospace", marginBottom: 3 }}>Est. shares</div>
                      <div style={{ fontSize: 14, fontFamily: "monospace", fontWeight: 700, color: "#a855f7" }}>
                        {isNaN(parseFloat(orderAmount)) || selectedMA.price === 0
                          ? "—"
                          : (parseFloat(orderAmount) / (selectedMA.price / 100)).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Place Order button */}
                  {orderPlaced ? (
                    <div style={{
                      padding: "8px 12px", borderRadius: 6, textAlign: "center",
                      fontSize: 11, fontFamily: "monospace", color: "#10b981",
                      background: "#10b98112", border: "1px solid #10b98133",
                    }}>
                      ✓ Mock order created.
                    </div>
                  ) : (
                    <button
                      onMouseDown={e => e.stopPropagation()}
                      onClick={placeOrder}
                      style={{
                        width: "100%", padding: "8px 0", borderRadius: 6, fontSize: 11, fontFamily: "monospace",
                        background: "linear-gradient(135deg,#7c3aed,#a855f7)",
                        color: "#fff", border: "none", cursor: "pointer",
                        boxShadow: "0 0 20px #7c3aed33",
                      }}
                    >
                      Place Mock Order — {orderSide} {orderAmount} USDC
                    </button>
                  )}
                </div>

              </div>

              {/* Resize handle */}
              <div
                onMouseDown={onDetailResizeMouseDown}
                style={{
                  position: "absolute", bottom: 0, right: 0,
                  width: 18, height: 18, cursor: "nwse-resize",
                  display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: 4,
                }}
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <line x1="8" y1="2" x2="2" y2="8" stroke="#3b2060" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="8" y1="6" x2="6" y2="8" stroke="#3b2060" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            )
          )}

          {/* ── Portfolio Window ── */}
          {showPortfolio && (() => {
            const openPositions   = positions.filter(p => p.status === "Open");
            const unrealizedPnl   = openPositions.reduce((sum, p) => sum + (p.currentPrice - p.avgPrice) / 100 * p.size, 0);
            const closedPositions = positions.filter(p => p.status === "Closed");
            const winRate         = closedPositions.length === 0 ? null
              : Math.round((closedPositions.filter(p => p.currentPrice >= p.avgPrice).length / closedPositions.length) * 100);
            const pnlColor        = unrealizedPnl >= 0 ? "#10b981" : "#ef4444";

            const catExposure: Record<string, number> = {};
            openPositions.forEach(p => { catExposure[p.category] = (catExposure[p.category] ?? 0) + p.size; });
            const totalExposed = Object.values(catExposure).reduce((a, b) => a + b, 0);
            const largest = openPositions.reduce<PortfolioPosition | null>((a, b) => (!a || b.size > a.size) ? b : a, null);
            const portfolioRisk: RiskLevel = balance.used / balance.total > 0.6 ? "High" : balance.used / balance.total > 0.3 ? "Medium" : "Low";

            if (portfolioMinimized) return (
              <div onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); setPortfolioMinimized(false); }}
                style={{ position: "absolute", left: portfolioPos.x, top: portfolioPos.y, zIndex: 55, cursor: "pointer", userSelect: "none", display: "inline-flex", alignItems: "center", gap: 8, background: "#040f0f", border: "1px solid #163a3a", borderRadius: 20, padding: "5px 12px 5px 10px", boxShadow: "0 4px 20px #00000088, 0 0 30px #22d3ee0e" }}>
                <span style={{ fontSize: 10, color: "#22d3ee", fontFamily: "monospace" }}>▢</span>
                <span style={{ fontSize: 10, color: "#d4c4f0", fontFamily: "monospace" }}>Portfolio</span>
                {openPositions.length > 0 && <span style={{ fontSize: 9, color: "#fff", background: "#22d3ee", borderRadius: 10, padding: "1px 6px", fontFamily: "monospace" }}>{openPositions.length}</span>}
                <button onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); setShowPortfolio(false); }} style={{ marginLeft: 4, color: "#2a5555", background: "transparent", border: "none", cursor: "pointer", fontSize: 12, lineHeight: 1, padding: 0 }}>✕</button>
              </div>
            );

            return (
              <div
                onMouseDown={e => e.stopPropagation()}
                onClick={e => e.stopPropagation()}
                style={{
                  position: "absolute", left: portfolioPos.x, top: portfolioPos.y,
                  width: portfolioSize.width, height: portfolioSize.height,
                  zIndex: 55,
                  display: "flex", flexDirection: "column",
                  background: "#08010e",
                  border: "1px solid #163a3a",
                  borderRadius: 12,
                  boxShadow: "0 12px 48px #00000099, 0 0 60px #22d3ee0e, 0 0 1px #22d3ee22",
                  overflow: "hidden",
                }}
              >
                {/* Header — drag handle */}
                <div
                  onMouseDown={portfolioHeaderMouseDown}
                  style={{ padding: "10px 14px 9px", flexShrink: 0, borderBottom: "1px solid #0e2828", background: "linear-gradient(180deg, #040f0f 0%, #09010f 100%)", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "grab", userSelect: "none" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "#22d3ee", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600 }}>Portfolio</span>
                    {openPositions.length > 0 && (
                      <span style={{ fontSize: 9, color: "#fff", background: "#22d3ee", borderRadius: 10, padding: "1px 6px", fontFamily: "monospace" }}>
                        {openPositions.length} open
                      </span>
                    )}
                  </div>
                  <div onMouseDown={e => e.stopPropagation()} style={{ display: "flex", gap: 4 }}>
                    <button onClick={e => { e.stopPropagation(); setPortfolioMinimized(true); }}
                      style={{ width: 22, height: 22, borderRadius: 5, border: "1px solid #163a3a", color: "#22d3ee66", background: "transparent", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>_</button>
                    <button onClick={e => { e.stopPropagation(); setShowPortfolio(false); }}
                      style={{ width: 22, height: 22, borderRadius: 5, border: "1px solid #163a3a", color: "#22d3ee66", background: "transparent", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                  </div>
                </div>

                {/* Tab bar */}
                <div style={{ display: "flex", borderBottom: "1px solid #0e2828", flexShrink: 0 }}>
                  {(["overview", "positions", "orders", "risk"] as const).map(tab => (
                    <button key={tab}
                      onMouseDown={e => e.stopPropagation()}
                      onClick={() => setPortfolioTab(tab)}
                      style={{
                        flex: 1, padding: "7px 0", fontSize: 10, fontFamily: "monospace",
                        textTransform: "capitalize", cursor: "pointer", border: "none",
                        background: portfolioTab === tab ? "#0d2222" : "transparent",
                        color: portfolioTab === tab ? "#22d3ee" : "#2a5555",
                        borderBottom: portfolioTab === tab ? "2px solid #22d3ee" : "2px solid transparent",
                        transition: "all 0.15s ease",
                      }}
                    >{tab}</button>
                  ))}
                </div>

                {/* Body */}
                <div className="custom-scrollbar" style={{ overflowY: "auto", flex: 1, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>

                  {/* ── Overview ── */}
                  {portfolioTab === "overview" && (
                    <>
                      {/* 2-col stat grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                        {[
                          { label: "Total Equity",     value: `${balance.total.toFixed(2)}`,     unit: "USDC", color: "#22d3ee" },
                          { label: "Available",         value: `${balance.available.toFixed(2)}`, unit: "USDC", color: "#10b981" },
                          { label: "Locked / Margin",   value: `${balance.used.toFixed(2)}`,      unit: "USDC", color: "#fbbf24" },
                          { label: "Unrealized PnL",    value: `${unrealizedPnl >= 0 ? "+" : ""}${unrealizedPnl.toFixed(2)}`, unit: "USDC", color: pnlColor },
                          { label: "Win Rate",          value: winRate !== null ? `${winRate}%` : "—", unit: "", color: "#a855f7" },
                          { label: "Active Positions",  value: `${openPositions.length}`,         unit: "", color: "#22d3ee" },
                        ].map(s => (
                          <div key={s.label} style={{
                            background: "#0d0220", border: "1px solid #163a3a", borderRadius: 7, padding: "8px 10px",
                          }}>
                            <div style={{ fontSize: 9, color: "#2a5555", fontFamily: "monospace", marginBottom: 4 }}>{s.label}</div>
                            <div style={{ fontSize: 14, fontFamily: "monospace", fontWeight: 700, color: s.color }}>
                              {s.value}
                              {s.unit && <span style={{ fontSize: 9, fontWeight: 400, color: "#2a5555", marginLeft: 3 }}>{s.unit}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Allocation bar */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ fontSize: 9, color: "#2a5555", fontFamily: "monospace" }}>ALLOCATION</span>
                          <span style={{ fontSize: 9, color: "#2a5555", fontFamily: "monospace" }}>
                            {balance.total > 0 ? ((balance.used / balance.total) * 100).toFixed(1) : "0.0"}% deployed
                          </span>
                        </div>
                        <div style={{ height: 5, background: "#0d0220", border: "1px solid #163a3a", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{
                            height: "100%", borderRadius: 3,
                            width: `${balance.total > 0 ? Math.min(100, (balance.used / balance.total) * 100) : 0}%`,
                            background: "linear-gradient(90deg,#22d3ee,#0891b2)",
                            transition: "width 0.4s ease",
                          }} />
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── Positions ── */}
                  {portfolioTab === "positions" && (
                    positions.length === 0 ? (
                      <div style={{ fontSize: 11, color: "#2a5555", fontFamily: "monospace", textAlign: "center", padding: "40px 0" }}>
                        No positions yet
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                        {positions.map(pos => {
                          const pnlUsdc = +((pos.currentPrice - pos.avgPrice) / 100 * pos.size).toFixed(2);
                          const pnlPct  = pos.avgPrice > 0 ? +(((pos.currentPrice - pos.avgPrice) / pos.avgPrice) * 100).toFixed(1) : 0;
                          const pc      = pnlUsdc >= 0 ? "#10b981" : "#ef4444";
                          const isOpen  = pos.status === "Open";
                          return (
                            <div key={`${pos.key}-${pos.status}`} style={{
                              background: isOpen ? "#0c0420" : "#080214",
                              border: `1px solid ${isOpen ? "#163a3a" : "#1a0d30"}`,
                              borderRadius: 8, padding: "10px 12px",
                              opacity: isOpen ? 1 : 0.6,
                            }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
                                <div style={{ fontSize: 9, color: "#2a5555", fontFamily: "monospace", flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", marginRight: 8 }}>
                                  {pos.eventTitle}
                                </div>
                                <span style={{
                                  fontSize: 9, fontFamily: "monospace", borderRadius: 3, padding: "1px 5px", flexShrink: 0,
                                  color: isOpen ? "#22d3ee" : "#4a3060",
                                  background: isOpen ? "#22d3ee12" : "#4a306012",
                                  border: `1px solid ${isOpen ? "#22d3ee33" : "#4a306033"}`,
                                }}>{pos.status}</span>
                              </div>
                              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 7 }}>
                                <span style={{
                                  fontSize: 10, fontFamily: "monospace", fontWeight: 600, borderRadius: 3, padding: "1px 7px",
                                  color: pos.outcome === "YES" ? "#10b981" : "#fb923c",
                                  background: pos.outcome === "YES" ? "#10b98118" : "#fb923c18",
                                  border: `1px solid ${pos.outcome === "YES" ? "#10b98133" : "#fb923c33"}`,
                                }}>{pos.outcome}</span>
                                <span style={{ fontSize: 9, color: "#6b4d90", fontFamily: "monospace" }}>{pos.category}</span>
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5, marginBottom: 7 }}>
                                {[
                                  { label: "Size",        value: `${pos.size.toFixed(0)} USDC` },
                                  { label: "Avg Price",   value: `${pos.avgPrice}¢` },
                                  { label: "Cur. Price",  value: `${pos.currentPrice}¢` },
                                ].map(f => (
                                  <div key={f.label} style={{ background: "#0d0220", borderRadius: 5, padding: "4px 6px" }}>
                                    <div style={{ fontSize: 8, color: "#2a5555", fontFamily: "monospace", marginBottom: 2 }}>{f.label}</div>
                                    <div style={{ fontSize: 10, color: "#d4c4f0", fontFamily: "monospace" }}>{f.value}</div>
                                  </div>
                                ))}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div>
                                  <span style={{ fontSize: 9, color: "#2a5555", fontFamily: "monospace", marginRight: 6 }}>Unr. PnL</span>
                                  <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: pc }}>
                                    {pnlUsdc >= 0 ? "+" : ""}{pnlUsdc} USDC
                                  </span>
                                  <span style={{ fontSize: 9, color: pc, fontFamily: "monospace", marginLeft: 4 }}>
                                    ({pnlPct >= 0 ? "+" : ""}{pnlPct}%)
                                  </span>
                                </div>
                                {isOpen && (
                                  <button
                                    onMouseDown={e => e.stopPropagation()}
                                    onClick={() => closePosition(pos.key)}
                                    style={{
                                      fontSize: 9, fontFamily: "monospace", padding: "3px 9px", borderRadius: 4, cursor: "pointer",
                                      background: "transparent", border: "1px solid #ef444444", color: "#ef4444",
                                      transition: "all 0.15s ease",
                                    }}
                                  >Close</button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                  )}

                  {/* ── Orders ── */}
                  {portfolioTab === "orders" && (
                    orders.length === 0 ? (
                      <div style={{ fontSize: 11, color: "#2a5555", fontFamily: "monospace", textAlign: "center", padding: "40px 0" }}>
                        No orders yet
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {orders.map(ord => (
                          <div key={ord.id} style={{
                            background: "#0c0420", border: "1px solid #163a3a", borderRadius: 8, padding: "9px 12px",
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "center" }}>
                              <span style={{ fontSize: 9, color: "#2a5555", fontFamily: "monospace" }}>
                                {new Date(ord.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                              </span>
                              <div style={{ display: "flex", gap: 4 }}>
                                <span style={{
                                  fontSize: 9, fontFamily: "monospace", borderRadius: 3, padding: "1px 5px",
                                  color: "#10b981", background: "#10b98112", border: "1px solid #10b98133",
                                }}>{ord.status}</span>
                                <span style={{
                                  fontSize: 9, fontFamily: "monospace", borderRadius: 3, padding: "1px 5px",
                                  color: ord.type === "Close" ? "#fb923c" : "#a855f7",
                                  background: ord.type === "Close" ? "#fb923c12" : "#a855f712",
                                  border: `1px solid ${ord.type === "Close" ? "#fb923c33" : "#a855f733"}`,
                                }}>{ord.type}</span>
                              </div>
                            </div>
                            <div style={{ fontSize: 10, color: "#c4b8e0", marginBottom: 5, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                              {ord.eventTitle}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{
                                fontSize: 10, fontFamily: "monospace", fontWeight: 600, borderRadius: 3, padding: "1px 7px",
                                color: ord.outcome === "YES" ? "#10b981" : "#fb923c",
                                background: ord.outcome === "YES" ? "#10b98118" : "#fb923c18",
                                border: `1px solid ${ord.outcome === "YES" ? "#10b98133" : "#fb923c33"}`,
                              }}>{ord.outcome}</span>
                              <span style={{ fontSize: 11, color: "#d4c4f0", fontFamily: "monospace", marginLeft: "auto" }}>{ord.amount.toFixed(2)} USDC</span>
                              <span style={{ fontSize: 9, color: "#2a5555", fontFamily: "monospace" }}>@ {ord.price}¢</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  {/* ── Risk ── */}
                  {portfolioTab === "risk" && (
                    <>
                      {/* Exposure by category */}
                      <div>
                        <div style={{ fontSize: 9, color: "#2a5555", fontFamily: "monospace", textTransform: "uppercase", marginBottom: 7, letterSpacing: "0.08em" }}>
                          Exposure by Category
                        </div>
                        {totalExposed === 0 ? (
                          <div style={{ fontSize: 10, color: "#2a5555", fontFamily: "monospace", textAlign: "center", padding: "12px 0" }}>No open exposure</div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                            {Object.entries(catExposure).sort((a,b) => b[1]-a[1]).map(([cat, amt]) => {
                              const pct = totalExposed > 0 ? (amt / totalExposed) * 100 : 0;
                              const ac  = catAccent[cat] ?? "#8b5cf6";
                              return (
                                <div key={cat}>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                    <span style={{ fontSize: 10, color: ac, fontFamily: "monospace" }}>{cat}</span>
                                    <span style={{ fontSize: 10, color: "#d4c4f0", fontFamily: "monospace" }}>{amt.toFixed(0)} USDC <span style={{ color: "#2a5555" }}>({pct.toFixed(0)}%)</span></span>
                                  </div>
                                  <div style={{ height: 4, background: "#0d0220", borderRadius: 2, overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${pct}%`, background: ac, borderRadius: 2, transition: "width 0.4s ease" }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Risk stats */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                        <div style={{ background: "#0d0220", border: "1px solid #163a3a", borderRadius: 7, padding: "8px 12px" }}>
                          <div style={{ fontSize: 9, color: "#2a5555", fontFamily: "monospace", marginBottom: 3 }}>Largest Position</div>
                          {largest ? (
                            <>
                              <div style={{ fontSize: 11, color: "#d4c4f0", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{largest.eventTitle}</div>
                              <div style={{ fontSize: 10, color: "#22d3ee", fontFamily: "monospace", marginTop: 2 }}>{largest.size.toFixed(2)} USDC · {largest.outcome}</div>
                            </>
                          ) : (
                            <div style={{ fontSize: 10, color: "#2a5555", fontFamily: "monospace" }}>—</div>
                          )}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                          <div style={{ background: "#0d0220", border: "1px solid #163a3a", borderRadius: 7, padding: "8px 10px" }}>
                            <div style={{ fontSize: 9, color: "#2a5555", fontFamily: "monospace", marginBottom: 3 }}>Portfolio Risk</div>
                            <div style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 700, color: riskColor[portfolioRisk] }}>{portfolioRisk}</div>
                          </div>
                          <div style={{ background: "#0d0220", border: "1px solid #163a3a", borderRadius: 7, padding: "8px 10px" }}>
                            <div style={{ fontSize: 9, color: "#2a5555", fontFamily: "monospace", marginBottom: 3 }}>Suggested Action</div>
                            <div style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 600, color: portfolioRisk === "High" ? "#ef4444" : portfolioRisk === "Medium" ? "#fbbf24" : "#10b981" }}>
                              {portfolioRisk === "High" ? "Reduce Exposure" : portfolioRisk === "Medium" ? "Monitor Closely" : "Well Balanced"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                </div>

                {/* Resize handle */}
                <div onMouseDown={makeResizeHandler(portfolioSize, setPortfolioSize, 360, 280)}
                  style={{ position: "absolute", bottom: 0, right: 0, width: 18, height: 18, cursor: "nwse-resize", display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: 4 }}>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><line x1="8" y1="2" x2="2" y2="8" stroke="#163a3a" strokeWidth="1.5" strokeLinecap="round"/><line x1="8" y1="6" x2="6" y2="8" stroke="#163a3a" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
              </div>
            );
          })()}

          {/* ── Macro Library Panel ── */}
          {showMacros && (() => {
            const moduleTypes = leftModules.map(m => m.label);
            const tabIsModule = moduleTypes.includes(macroLibTab);
            const visibleMacros = macroLibTab === "All Macros" || macroLibTab === "Strategy Macros" ? macroStrategies : [];
            const visibleHist   = macroLibTab === "All Macros" ? optionHistory
              : tabIsModule ? optionHistory.filter(h => h.type === macroLibTab) : [];

            function loadMacro(macro: MacroStrategy) {
              setDroppedNodes(macro.options.map((o, i) => {
                const mod = leftModules.find(m => m.label === o.label);
                const angle = (i / 7) * Math.PI * 2 - Math.PI / 2;
                const config = o.config.map(c => {
                  const def = (defaultConfigs[o.label] ?? []).find(f => f.label === c.label);
                  return def ? { ...def, value: c.value } : { label: c.label, type: "text" as const, value: c.value };
                });
                return {
                  uid: ++uidRef.current, label: o.label, sub: o.sub, accent: o.accent, icon: o.icon,
                  x: Math.round(Math.cos(angle) * 230), y: Math.round(Math.sin(angle) * 230),
                  config,
                };
              }));
              setCenterMsg("Macro loaded.");
              if (msgTimer.current) clearTimeout(msgTimer.current);
              msgTimer.current = setTimeout(() => setCenterMsg(null), 2000);
            }

            return (
              <div
                style={{
                  position: "absolute", left: 80, top: 80, width: 560, height: 460, zIndex: 50,
                  background: "#09010f", border: "1px solid #2d1b4e", borderRadius: 10,
                  display: "flex", flexDirection: "column",
                  boxShadow: "0 8px 48px #000a, 0 0 0 1px #7c3aed11",
                  overflow: "hidden",
                }}
              >
                {/* Panel header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px 9px", borderBottom: "1px solid #1a0d30", flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#a855f7", fontSize: 14 }}>◈</span>
                    <span style={{ fontSize: 11, color: "#d4c4f0", fontFamily: "monospace", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em" }}>Macro Library</span>
                    <span style={{ fontSize: 10, color: "#4a3060", fontFamily: "monospace" }}>
                      {macroStrategies.length} strateg{macroStrategies.length === 1 ? "y" : "ies"} · {optionHistory.length} config{optionHistory.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <button onClick={() => setShowMacros(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#4a3060", fontSize: 14, padding: 2, lineHeight: 1 }}>✕</button>
                </div>

                {/* Body */}
                <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

                  {/* Left: category tabs */}
                  <div className="custom-scrollbar" style={{ width: 150, flexShrink: 0, borderRight: "1px solid #1a0d30", overflowY: "auto", padding: "8px 0" }}>
                    {["All Macros", "Strategy Macros", ...moduleTypes].map(cat => {
                      const isActive = macroLibTab === cat;
                      const count = cat === "All Macros"
                        ? macroStrategies.length + optionHistory.length
                        : cat === "Strategy Macros"
                        ? macroStrategies.length
                        : optionHistory.filter(h => h.type === cat).length;
                      const isSep = cat === "Strategy Macros" || cat === moduleTypes[0];
                      return (
                        <div key={cat}>
                          {isSep && <div style={{ height: 1, background: "#1a0d30", margin: "5px 10px" }} />}
                          <button
                            onClick={() => setMacroLibTab(cat)}
                            style={{
                              width: "100%", textAlign: "left", padding: "6px 12px", fontSize: 10,
                              fontFamily: "monospace", background: isActive ? "#7c3aed18" : "transparent",
                              color: isActive ? "#c084fc" : "#6b4d90", border: "none",
                              borderLeft: `2px solid ${isActive ? "#7c3aed" : "transparent"}`,
                              cursor: "pointer", display: "flex", justifyContent: "space-between",
                              alignItems: "center", gap: 4, transition: "all 0.12s ease",
                            }}
                          >
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat}</span>
                            {count > 0 && (
                              <span style={{ flexShrink: 0, fontSize: 9, background: isActive ? "#7c3aed33" : "#1a0d30", color: isActive ? "#c084fc" : "#3b2060", borderRadius: 999, padding: "0 5px", height: 15, display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 15 }}>
                                {count}
                              </span>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right: content */}
                  <div className="custom-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>

                    {/* Empty state */}
                    {visibleMacros.length === 0 && visibleHist.length === 0 && (
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "32px 0" }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#7c3aed12", border: "1px solid #7c3aed22", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b2060", fontSize: 14 }}>◈</div>
                        <div style={{ fontSize: 11, color: "#3b2060", fontFamily: "monospace", textAlign: "center", lineHeight: 1.6 }}>
                          {macroLibTab === "Strategy Macros"
                            ? "No macros saved yet.\nClick Done in Strategy Settings."
                            : `No config history for\n${macroLibTab}.`}
                        </div>
                      </div>
                    )}

                    {/* Strategy macro cards */}
                    {visibleMacros.length > 0 && (
                      <>
                        {macroLibTab === "All Macros" && (
                          <div style={{ fontSize: 9, color: "#4a3060", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>Strategy Macros</div>
                        )}
                        {visibleMacros.map(macro => (
                          <div key={macro.id} style={{ background: "#0d0220", border: "1px solid #2d1b4e", borderRadius: 8, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 7 }}>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, color: "#d4c4f0", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{macro.name}</div>
                                <div style={{ fontSize: 10, color: "#6b4d90", fontFamily: "monospace", marginTop: 2 }}>{macro.summary}</div>
                              </div>
                              <div style={{ fontSize: 9, color: "#3b2060", fontFamily: "monospace", flexShrink: 0 }}>
                                {new Date(macro.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            {/* Module chips */}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {macro.options.map(o => {
                                const mod = leftModules.find(m => m.label === o.label);
                                return (
                                  <span key={o.label} style={{ fontSize: 9, fontFamily: "monospace", padding: "1px 7px", borderRadius: 999, background: `${mod?.accent ?? "#8b5cf6"}18`, border: `1px solid ${mod?.accent ?? "#8b5cf6"}33`, color: mod?.accent ?? "#8b5cf6" }}>
                                    {o.icon} {o.label.split(" ")[0]}
                                  </span>
                                );
                              })}
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                onClick={() => loadMacro(macro)}
                                style={{ flex: 1, padding: "5px 0", borderRadius: 5, fontSize: 10, fontFamily: "monospace", background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", border: "none", cursor: "pointer" }}>
                                Load
                              </button>
                              <button
                                onClick={() => setMacroStrategies(prev => prev.filter(m => m.id !== macro.id))}
                                style={{ padding: "5px 10px", borderRadius: 5, fontSize: 10, fontFamily: "monospace", background: "transparent", color: "#6b4d90", border: "1px solid #2d1b4e", cursor: "pointer" }}>
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Option history cards */}
                    {visibleHist.length > 0 && (
                      <>
                        {macroLibTab === "All Macros" && (
                          <div style={{ fontSize: 9, color: "#4a3060", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: visibleMacros.length > 0 ? 6 : 0, marginBottom: 2 }}>Config History</div>
                        )}
                        {visibleHist.map(hist => {
                          const mod = leftModules.find(m => m.label === hist.type);
                          return (
                            <div
                              key={hist.id}
                              draggable
                              onDragStart={() => { dragId.current = `optionhist:${hist.id}`; }}
                              style={{ background: "#0d0220", border: `1px solid ${mod?.accent ?? "#8b5cf6"}22`, borderRadius: 8, padding: "9px 11px", display: "flex", flexDirection: "column", gap: 6, cursor: "grab" }}
                            >
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ color: mod?.accent ?? "#8b5cf6", fontSize: 13 }}>{mod?.icon ?? "◈"}</span>
                                  <div>
                                    <div style={{ fontSize: 11, color: "#d4c4f0", fontWeight: 500 }}>{hist.type}</div>
                                    <div style={{ fontSize: 9, color: "#3b2060", fontFamily: "monospace", marginTop: 1 }}>
                                      Updated {new Date(hist.updatedAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ fontSize: 9, color: "#4a3060", fontFamily: "monospace" }}>drag to load</span>
                                  <button
                                    onClick={() => setOptionHistory(prev => prev.filter(h => h.id !== hist.id))}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "#3b2060", fontSize: 12, padding: 0, lineHeight: 1 }}>✕</button>
                                </div>
                              </div>
                              {/* Config values */}
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {hist.config.map(c => (
                                  <span key={c.label} style={{ fontSize: 9, fontFamily: "monospace", padding: "1px 6px", borderRadius: 4, background: "#1a0d30", border: "1px solid #2d1b4e", color: "#8b5cf6" }}>
                                    {c.label}: <span style={{ color: "#c084fc" }}>{c.value}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}

                  </div>
                </div>
              </div>
            );
          })()}

        </main>

        {/* ── Right Panel — Strategy Settings ── */}
        <aside className="flex-shrink-0 w-64 flex flex-col overflow-hidden"
          style={{ borderLeft: "1px solid #2d1b4e", background: "#09010f" }}>

          {/* Header */}
          <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid #1a0d30", flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: "#c084fc", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600 }}>
              Strategy Settings
            </div>
            <div style={{ fontSize: 10, color: "#4a3060", fontFamily: "monospace", marginTop: 3 }}>
              {droppedNodes.length === 0
                ? "No modules added yet"
                : `${droppedNodes.length} module${droppedNodes.length !== 1 ? "s" : ""} configured`}
            </div>
          </div>

          {/* Empty state */}
          {droppedNodes.length === 0 && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#7c3aed15", border: "1px solid #7c3aed33", display: "flex", alignItems: "center", justifyContent: "center", color: "#a855f7", fontSize: 16 }}>◈</div>
              <div style={{ fontSize: 11, color: "#3b2060", fontFamily: "monospace", textAlign: "center", lineHeight: 1.6 }}>
                Drag modules onto<br />Dolphin AI to build<br />your strategy
              </div>
            </div>
          )}

          {/* Config blocks */}
          {droppedNodes.length > 0 && (
            <div className="custom-scrollbar" style={{ overflowY: "auto", flex: 1, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
              {droppedNodes.map(node => {
                const isSel = node.uid === selUid;
                return (
                  <div
                    key={node.uid}
                    ref={el => { blockRefs.current[node.uid] = el; }}
                    onClick={e => { e.stopPropagation(); onNodeClick(e, node.uid); }}
                    style={{
                      border: `1px solid ${isSel ? node.accent + "66" : node.accent + "22"}`,
                      background: isSel ? node.accent + "0e" : node.accent + "06",
                      borderRadius: 8, padding: "9px 10px",
                      cursor: "pointer",
                      transition: "border-color 0.2s ease, background 0.2s ease",
                      boxShadow: isSel ? `0 0 16px ${node.accent}18` : "none",
                    }}
                  >
                    {/* Block header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                      <span style={{ color: node.accent, fontSize: 14, flexShrink: 0 }}>{node.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: "#d4c4f0", fontWeight: 500, lineHeight: 1.3 }}>{node.label}</div>
                        <div style={{ fontSize: 9, color: node.accent + "88", fontFamily: "monospace", marginTop: 1 }}>{node.sub}</div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); removeNode(node.uid); }}
                        style={{ flexShrink: 0, color: "#3b2060", background: "transparent", border: "none", cursor: "pointer", fontSize: 13, lineHeight: 1, padding: 0 }}
                      >✕</button>
                    </div>

                    {/* Config fields — always visible */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }} onClick={e => e.stopPropagation()}>
                      {node.config.map(f => (
                        <div key={f.label}>
                          {f.type === "range" ? (
                            <>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                <span style={{ fontSize: 10, color: "#6b4d90" }}>{f.label}</span>
                                <span style={{ fontSize: 10, color: "#c084fc", fontFamily: "monospace" }}>{parseFloat(f.value).toFixed(2)}</span>
                              </div>
                              <input type="range" min="0" max="1" step="0.01" value={f.value}
                                onChange={e => { updateConfig(node.uid, f.label, e.target.value); setSettingsSaved(false); }}
                                style={{ width: "100%", accentColor: node.accent, cursor: "pointer" }} />
                            </>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                              <span style={{ fontSize: 10, color: "#6b4d90", flexShrink: 0, maxWidth: 80, lineHeight: 1.3 }}>{f.label}</span>
                              {f.type === "select" ? (
                                <select value={f.value}
                                  onChange={e => { updateConfig(node.uid, f.label, e.target.value); setSettingsSaved(false); }}
                                  style={{ background: "#1a0d30", color: "#c084fc", border: "1px solid #2d1b4e", borderRadius: 4, padding: "2px 4px", fontSize: 10, fontFamily: "monospace", outline: "none", cursor: "pointer", maxWidth: 100 }}>
                                  {f.options?.map(opt => <option key={opt} value={opt} style={{ background: "#1a0d30" }}>{opt}</option>)}
                                </select>
                              ) : (
                                <input type="text" value={f.value}
                                  onChange={e => { updateConfig(node.uid, f.label, e.target.value); setSettingsSaved(false); }}
                                  style={{ background: "#1a0d30", color: "#c084fc", border: "1px solid #2d1b4e", borderRadius: 4, padding: "2px 6px", fontSize: 10, fontFamily: "monospace", width: 76, outline: "none" }} />
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Done button + Macro popup */}
          {droppedNodes.length > 0 && (
            <div style={{ padding: "10px 12px", flexShrink: 0, borderTop: "1px solid #1a0d30", display: "flex", flexDirection: "column", gap: 8 }}>

              {/* Macro popup */}
              {macroPopup !== "hidden" && (
                <div style={{ background: "#0d0220", border: "1px solid #3b1f6e", borderRadius: 8, padding: "12px 12px 10px", display: "flex", flexDirection: "column", gap: 9 }}>

                  {macroPopup === "ask" && (
                    <>
                      <div style={{ fontSize: 11, color: "#d4c4f0", lineHeight: 1.5 }}>
                        Save this setup as a Macro Strategy?
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => { setMacroName(defaultMacroName()); setMacroPopup("name"); }}
                          style={{ flex: 1, padding: "5px 0", borderRadius: 5, fontSize: 10, fontFamily: "monospace", background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", border: "none", cursor: "pointer" }}>
                          Save as Macro
                        </button>
                        <button
                          onClick={() => setMacroPopup("hidden")}
                          style={{ flex: 1, padding: "5px 0", borderRadius: 5, fontSize: 10, fontFamily: "monospace", background: "transparent", color: "#6b4d90", border: "1px solid #2d1b4e", cursor: "pointer" }}>
                          Not now
                        </button>
                      </div>
                    </>
                  )}

                  {macroPopup === "name" && (
                    <>
                      <div style={{ fontSize: 10, color: "#8b5cf6", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>Name this macro</div>
                      <input
                        value={macroName}
                        onChange={e => setMacroName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") saveMacro(); }}
                        placeholder="e.g. Crypto Momentum Macro"
                        style={{ background: "#08010e", border: "1px solid #3b1f6e", borderRadius: 5, padding: "6px 9px", fontSize: 11, color: "#d4c4f0", fontFamily: "monospace", outline: "none", width: "100%", boxSizing: "border-box" }}
                      />
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={saveMacro}
                          style={{ flex: 1, padding: "5px 0", borderRadius: 5, fontSize: 10, fontFamily: "monospace", background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", border: "none", cursor: "pointer" }}>
                          Confirm
                        </button>
                        <button
                          onClick={() => setMacroPopup("hidden")}
                          style={{ flex: 1, padding: "5px 0", borderRadius: 5, fontSize: 10, fontFamily: "monospace", background: "transparent", color: "#6b4d90", border: "1px solid #2d1b4e", cursor: "pointer" }}>
                          Cancel
                        </button>
                      </div>
                    </>
                  )}

                  {macroPopup === "saved" && (
                    <div style={{ fontSize: 11, fontFamily: "monospace", textAlign: "center", padding: "4px 0", color: "#10b981" }}>
                      ✓ Macro strategy saved.
                    </div>
                  )}

                </div>
              )}

              {/* Settings saved / Done */}
              {settingsSaved ? (
                <div style={{ fontSize: 11, fontFamily: "monospace", textAlign: "center", padding: "7px 0", color: "#10b981", background: "#10b98110", border: "1px solid #10b98130", borderRadius: 6 }}>
                  Strategy settings saved.
                </div>
              ) : (
                <button
                  onClick={() => {
                    setSettingsSaved(true);
                    setMacroPopup("ask");
                    saveOptionHistory(droppedNodes);
                    setTimeout(() => setSettingsSaved(false), 2500);
                  }}
                  style={{ width: "100%", padding: "7px 0", borderRadius: 6, fontSize: 11, fontFamily: "monospace", background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", border: "none", cursor: "pointer" }}>
                  Done
                </button>
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
