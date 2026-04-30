
const markets = [
  {
    id: 1,
    title: "BTC/USD End of Week",
    prediction: "BULLISH",
    confidence: 87,
    target: "$98,400",
    current: "$94,210",
    delta: "+4.4%",
    positive: true,
    volume: "$2.1B",
    closes: "48h",
  },
  {
    id: 2,
    title: "ETH/USD 30-Day Outlook",
    prediction: "NEUTRAL",
    confidence: 61,
    target: "$3,280",
    current: "$3,190",
    delta: "+2.8%",
    positive: true,
    volume: "$890M",
    closes: "28d",
  },
  {
    id: 3,
    title: "SOL/USD Next Session",
    prediction: "BEARISH",
    confidence: 74,
    target: "$138",
    current: "$151",
    delta: "-8.6%",
    positive: false,
    volume: "$420M",
    closes: "12h",
  },
];

function predictionColor(p: string) {
  if (p === "BULLISH") return "text-emerald-400";
  if (p === "BEARISH") return "text-rose-400";
  return "text-amber-400";
}

function predictionBg(p: string) {
  if (p === "BULLISH") return "bg-emerald-400/10 border-emerald-400/30";
  if (p === "BEARISH") return "bg-rose-400/10 border-rose-400/30";
  return "bg-amber-400/10 border-amber-400/30";
}

const agentSteps = ["Perceive", "Think", "Decide", "Execute"];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#07000f" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-8 py-4"
        style={{ background: "#07000f", borderBottom: "1px solid #2d1b4e" }}
      >
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Dolphin AI"
            width={32}
            height={32}
            className="logo-glow"
            style={{ mixBlendMode: "screen" }}
          />
          <span
            className="font-semibold text-sm uppercase"
            style={{ color: "#c084fc", letterSpacing: "0.18em" }}
          >
            Dolphin AI
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          {["Markets", "Portfolio", "Analytics", "Docs"].map((item) => (
            <a
              key={item}
              href="#"
              className="text-sm transition-colors"
              style={{ color: "#8b5cf6" }}
            >
              {item}
            </a>
          ))}
        </nav>
        <button
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
          style={{
            background: "linear-gradient(135deg, #7c3aed22, #c084fc11)",
            border: "1px solid #7c3aed66",
            color: "#c084fc",
          }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
          Live
        </button>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero */}
        <section className="relative flex flex-col items-center justify-center text-center px-8 pt-24 pb-20 overflow-hidden">
          {/* Background radial glows */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 40%, #4c1d9522 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              top: "20%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "400px",
              height: "400px",
              background:
                "radial-gradient(circle, #7c3aed18 0%, transparent 65%)",
              filter: "blur(24px)",
            }}
          />

          {/* Hero logo core */}
          <div className="relative flex items-center justify-center mb-10">
            {/* Outer pulse ring — circular */}
            <div
              className="absolute rounded-full agent-ring"
              style={{ width: 172, height: 172, border: "1px solid #a855f733" }}
            />
            {/* Inner ambient glow */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 200,
                height: 200,
                background: "radial-gradient(circle, #7c3aed20 0%, transparent 70%)",
                filter: "blur(20px)",
              }}
            />
            <img
              src="/logo.png"
              alt="Dolphin AI"
              width={136}
              height={136}
              className="logo-breathe relative z-10"
              style={{ mixBlendMode: "screen" }}
            />
          </div>

          <div
            className="relative text-xs tracking-[0.3em] uppercase mb-5 font-mono"
            style={{ color: "#8b5cf6" }}
          >
            AI-Powered Prediction Markets
          </div>
          <h1
            className="relative text-6xl md:text-8xl font-bold tracking-tight mb-6 neon-text"
            style={{ lineHeight: 1.05 }}
          >
            Dolphin AI
          </h1>
          <p
            className="relative text-lg md:text-xl max-w-md"
            style={{ color: "#9d7fc0", letterSpacing: "0.02em" }}
          >
            Trade with instinct.
            <br />
            Execute with intelligence.
          </p>
          <div className="relative flex items-center gap-4 mt-10">
            <button className="btn-primary px-8 py-3 rounded-full text-sm font-semibold">
              Start Trading
            </button>
            <button
              className="btn-secondary px-8 py-3 rounded-full text-sm font-medium"
              style={{ border: "1px solid #2d1b4e", color: "#8b5cf6" }}
            >
              View Markets
            </button>
          </div>
        </section>

        {/* Market Cards */}
        <section className="px-6 md:px-12 pb-12 max-w-6xl w-full mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-xs tracking-[0.25em] uppercase font-mono"
              style={{ color: "#7c3aed" }}
            >
              Active Predictions
            </h2>
            <span className="text-xs font-mono" style={{ color: "#4a3060" }}>
              3 markets live
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {markets.map((m) => (
              <div key={m.id} className="card-surface rounded-2xl p-6 cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-xs font-mono mb-1.5" style={{ color: "#3b2060" }}>
                      PRED · {m.closes} left
                    </div>
                    <div className="font-semibold text-sm" style={{ color: "#e2d4f0" }}>
                      {m.title}
                    </div>
                  </div>
                  <span
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border ${predictionBg(m.prediction)} ${predictionColor(m.prediction)}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      m.prediction === "BULLISH" ? "bg-emerald-400" :
                      m.prediction === "BEARISH" ? "bg-rose-400" : "bg-amber-400"
                    }`} />
                    {m.prediction.charAt(0) + m.prediction.slice(1).toLowerCase()}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1" style={{ color: "#6b4d90" }}>
                    <span>Confidence</span>
                    <span className="font-mono" style={{ color: "#c084fc" }}>
                      {m.confidence}%
                    </span>
                  </div>
                  <div className="h-1 rounded-full" style={{ background: "#1a0d30" }}>
                    <div
                      className="h-1 rounded-full"
                      style={{
                        width: `${m.confidence}%`,
                        background: "linear-gradient(90deg, #7c3aed, #c084fc)",
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {[
                    { label: "Current", value: m.current, highlight: false },
                    { label: "Target", value: m.target, highlight: true, positive: m.positive },
                    { label: "Delta", value: m.delta, highlight: true, positive: m.positive },
                    { label: "Closes in", value: m.closes, highlight: false },
                  ].map((cell) => (
                    <div key={cell.label}>
                      <div style={{ color: "#4a3060" }}>{cell.label}</div>
                      <div
                        className={`font-mono font-medium mt-0.5 ${
                          cell.highlight
                            ? cell.positive
                              ? "text-emerald-400"
                              : "text-rose-400"
                            : ""
                        }`}
                        style={!cell.highlight ? { color: "#e2d4f0" } : undefined}
                      >
                        {cell.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4" style={{ borderTop: "1px solid #1a0d30" }}>
                  <div className="text-xs font-mono" style={{ color: "#4a3060" }}>
                    Volume:{" "}
                    <span style={{ color: "#6b4d90" }}>{m.volume}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI Recommendation */}
        <section className="px-6 md:px-12 pb-16 max-w-6xl w-full mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-xs tracking-[0.25em] uppercase font-mono"
              style={{ color: "#c084fc" }}
            >
              AI Recommendation
            </h2>
            <div
              className="flex items-center gap-2 text-xs font-mono"
              style={{ color: "#4a3060" }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
              Updated 43s ago
            </div>
          </div>
          <div
            className="rounded-2xl p-10 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, #0f0520 0%, #130828 60%, #1c0d44 100%)",
              border: "1px solid #5b21b6",
              boxShadow:
                "0 0 80px #7c3aed33, 0 0 160px #7c3aed11, 0 0 0 1px #7c3aed22",
            }}
          >
            {/* Top-right ambient glow */}
            <div
              className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, #7c3aed22 0%, transparent 65%)",
                transform: "translate(35%, -35%)",
              }}
            />
            {/* Bottom-left ambient glow */}
            <div
              className="absolute bottom-0 left-0 w-64 h-64 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, #4c1d9514 0%, transparent 70%)",
                transform: "translate(-30%, 30%)",
              }}
            />

            <div className="flex flex-col md:flex-row md:items-start gap-8 relative">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-5">
                  {/* Agent logo core with pulse ring */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="agent-ring absolute inset-0 rounded-full"
                      style={{ background: "transparent", border: "1px solid #a855f733" }}
                    />
                    <img
                      src="/logo.png"
                      alt="Dolphin AI"
                      width={44}
                      height={44}
                      className="logo-breathe relative z-10"
                      style={{ mixBlendMode: "screen" }}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-mono mb-0.5" style={{ color: "#a855f7" }}>
                      Agent Signal
                    </div>
                    <div className="font-semibold text-base" style={{ color: "#f0e6ff" }}>
                      Long BTC / USD
                    </div>
                  </div>
                  <span className="ml-auto text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-400">
                    LONG ↑
                  </span>
                </div>

                <p
                  className="text-sm leading-relaxed mb-6"
                  style={{ color: "#9d7fc0" }}
                >
                  On-chain accumulation patterns suggest institutional inflows over the
                  past 72h, with whale wallet activity up 34%. Macro sentiment has
                  shifted bullish following Fed commentary. Order book depth at $93K
                  shows strong support. Risk/reward ratio estimated at 1:3.2.
                </p>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Entry Zone", value: "$93,800–$94,500" },
                    { label: "Take Profit", value: "$98,400" },
                    { label: "Stop Loss", value: "$91,200" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl p-3"
                      style={{ background: "#07000f66", border: "1px solid #1a0d30" }}
                    >
                      <div className="text-xs mb-1" style={{ color: "#4a3060" }}>
                        {item.label}
                      </div>
                      <div
                        className="text-sm font-mono font-medium"
                        style={{ color: "#c084fc" }}
                      >
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:w-52 flex flex-col gap-5">
                {[
                  { label: "Model Confidence", value: "91%", bar: 91 },
                  { label: "Sentiment Score", value: "0.74", bar: 74 },
                  { label: "Signal Strength", value: "High", bar: 88 },
                ].map((item) => (
                  <div key={item.label}>
                    <div
                      className="flex justify-between text-xs mb-2"
                      style={{ color: "#7c5fa0" }}
                    >
                      <span>{item.label}</span>
                      <span className="font-mono font-medium" style={{ color: "#c084fc" }}>
                        {item.value}
                      </span>
                    </div>
                    <div className="h-1 rounded-full" style={{ background: "#1f0d35" }}>
                      <div
                        className="h-1 rounded-full"
                        style={{
                          width: `${item.bar}%`,
                          background: "linear-gradient(90deg, #7c3aed, #d8b4fe)",
                          boxShadow: "0 0 6px #a855f766",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Status Bar */}
      <footer style={{ borderTop: "1px solid #2d1b4e", background: "#07000f" }}>
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center">
            {agentSteps.map((step, i) => (
              <div key={step} className="flex items-center">
                <div className="flex items-center gap-2 px-3 md:px-4 py-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      i === 2
                        ? "bg-purple-400 pulse-dot"
                        : i < 2
                          ? "bg-emerald-400"
                          : "bg-gray-700"
                    }`}
                  />
                  <span
                    className="text-xs font-mono hidden sm:block"
                    style={{ color: i <= 2 ? "#8b5cf6" : "#2d1b4e" }}
                  >
                    {step}
                  </span>
                </div>
                {i < agentSteps.length - 1 && (
                  <span className="text-xs" style={{ color: "#2d1b4e" }}>
                    ›
                  </span>
                )}
              </div>
            ))}
          </div>
          <div
            className="flex items-center gap-3 text-xs font-mono"
            style={{ color: "#4a3060" }}
          >
            <span>v0.1.0-alpha</span>
            <span style={{ color: "#2d1b4e" }}>·</span>
            <span>Dolphin AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
