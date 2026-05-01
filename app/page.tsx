"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "./theme-context";

// ── Background floating prediction cards (5 max, evenly framing the title) ────
const CARD_EVENTS = [
  {
    id: "btc",      cf: "cf1",
    cat: "Crypto",  icon: "₿", accent: "#f7931a",
    title: "Will BTC hit $100K in 2026?",
    yes: 42, no: 58,
    spark: "0,26 10,22 20,24 30,16 40,18 50,10 60,14 70,8 80,11",
    pos: { left: "4%", top: "12%" },
  },
  {
    id: "election", cf: "cf2",
    cat: "Politics", icon: "⬡", accent: "#f472b6",
    title: "Trump wins 2028 US election?",
    yes: 71, no: 29,
    spark: "0,20 10,16 20,18 30,12 40,10 50,14 60,8 70,6 80,5",
    pos: { right: "4%", top: "14%" },
  },
  {
    id: "apple",    cf: "cf3",
    cat: "Stocks",  icon: "◬", accent: "#10b981",
    title: "AAPL closes above $250 this week?",
    yes: 55, no: 45,
    spark: "0,16 10,18 20,14 30,20 40,15 50,11 60,14 70,18 80,13",
    pos: { left: "2%", top: "54%" },
  },
  {
    id: "spacex",   cf: "cf4",
    cat: "Tech",    icon: "◇", accent: "#a78bfa",
    title: "SpaceX IPO before end of 2026?",
    yes: 38, no: 62,
    spark: "0,18 10,22 20,20 30,25 40,21 50,17 60,22 70,18 80,22",
    pos: { right: "2%", top: "50%" },
  },
  {
    id: "fed",      cf: "cf5",
    cat: "Macro",   icon: "◎", accent: "#22d3ee",
    title: "Fed rate cut at June 2026?",
    yes: 63, no: 37,
    spark: "0,18 10,14 20,16 30,10 40,12 50,7 60,10 70,5 80,7",
    pos: { left: "32%", bottom: "13%" },
  },
];

// ── Bottom ticker ─────────────────────────────────────────────────────────────
const TICKER_BASE = [
  { q: "BTC > $100K by Dec 2026?",      yes: 42, no: 58, cat: "Crypto",      icon: "₿"  },
  { q: "Fed rate cut at Jun meeting?",   yes: 63, no: 37, cat: "Macro",       icon: "◎"  },
  { q: "AI achieves AGI by 2030?",       yes: 38, no: 62, cat: "Tech",        icon: "◈"  },
  { q: "Trump wins 2028 election?",      yes: 71, no: 29, cat: "Politics",    icon: "⬡"  },
  { q: "SOL ETF approved in 2026?",      yes: 34, no: 66, cat: "Crypto",      icon: "◇"  },
  { q: "Inflation < 2% by year end?",    yes: 29, no: 71, cat: "Macro",       icon: "▷"  },
  { q: "AAPL closes > $250 this week?",  yes: 55, no: 45, cat: "Stocks",      icon: "◬"  },
  { q: "Gold > $3,500 by Dec 2026?",     yes: 44, no: 56, cat: "Commodities", icon: "⊞"  },
  { q: "Champions League: Real Madrid?", yes: 33, no: 67, cat: "Sports",      icon: "◉"  },
  { q: "USD/EUR parity by Q3 2026?",     yes: 18, no: 82, cat: "Forex",       icon: "◐"  },
];

const CAT_COLOR: Record<string, string> = {
  Crypto: "#f7931a", Macro: "#22d3ee", Tech: "#a78bfa",
  Politics: "#f472b6", Stocks: "#10b981", Commodities: "#fbbf24",
  Sports: "#fb923c", Forex: "#60a5fa",
};

const NAV = ["Markets", "Portfolio", "Analytics", "Docs"];

export default function Home() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  // ── Theme palette ─────────────────────────────────────────────────────────
  const C = {
    bg:          isDark ? "#07000f"                                         : "#F7F3FF",
    bg2:         isDark ? "transparent"                                     : "rgba(239,233,255,0.60)",
    navBorder:   isDark ? "#2d1b4e30"                                       : "rgba(124,58,237,0.14)",
    textPrimary: isDark ? "#f0e6ff"                                         : "#171124",
    textMuted:   isDark ? "#9d7fc0"                                         : "#5b3e8a",
    eyebrow:     isDark ? "#7c3aed"                                         : "#7c3aed",
    headlineShadow: isDark
      ? "0 0 16px rgba(168,85,247,.85),0 0 40px rgba(168,85,247,.55),0 0 90px rgba(124,58,237,.35),0 0 180px rgba(124,58,237,.18)"
      : "0 0 10px rgba(124,58,237,0.20),0 0 30px rgba(124,58,237,0.10)",
    headlineColor: isDark ? "#fff"                                          : "#2a0a5e",
    cardBg:      isDark ? "linear-gradient(135deg,rgba(14,4,30,.92) 0%,rgba(18,5,38,.88) 100%)" : "linear-gradient(135deg,rgba(255,255,255,0.82) 0%,rgba(248,244,255,0.76) 100%)",
    cardTitle:   isDark ? "#c4b4e0"                                         : "#2a1a40",
    tickerBg:    isDark ? "linear-gradient(to bottom,transparent 0%,#07000f 28%)"           : "linear-gradient(to bottom,transparent 0%,#F7F3FF 28%)",
    tickerBorder:isDark ? "#2d1b4e55"                                       : "rgba(124,58,237,0.14)",
    tickerFade1: isDark ? "#07000f"                                         : "#F7F3FF",
    tickerSep:   isDark ? "#2d1b4e44"                                       : "rgba(124,58,237,0.12)",
    tickerIcon:  isDark ? "#6b4d90"                                         : "#9b84c0",
    tickerQ:     isDark ? "#8b5cf6"                                         : "#5b21b6",
    tickerSep2:  isDark ? "#2d1b4e"                                         : "rgba(124,58,237,0.18)",
    glowRadial:  isDark ? "radial-gradient(ellipse 70% 58% at 50% 44%, #3d0d6e40 0%, transparent 68%)" : "radial-gradient(ellipse 70% 58% at 50% 44%, rgba(124,58,237,0.08) 0%, transparent 68%)",
    glowLeft:    isDark ? "radial-gradient(ellipse 42% 72% at -4% 55%, #7c3aed1e 0%, transparent 55%)" : "radial-gradient(ellipse 42% 72% at -4% 55%, rgba(124,58,237,0.07) 0%, transparent 55%)",
    glowRight:   isDark ? "radial-gradient(ellipse 42% 72% at 104% 55%, #1d4ed816 0%, transparent 55%)" : "radial-gradient(ellipse 42% 72% at 104% 55%, rgba(99,102,241,0.06) 0%, transparent 55%)",
  };

  const [cardPx, setCardPx] = useState(CARD_EVENTS.map(c => ({ yes: c.yes, no: c.no })));
  const [tickPx, setTickPx] = useState(TICKER_BASE.map(t => ({ yes: t.yes, no: t.no })));

  useEffect(() => {
    const id = setInterval(() => {
      const jitter = (spread: number) => Math.floor(Math.random() * spread) - Math.floor(spread / 2);
      setCardPx(p => p.map(v => {
        const yes = Math.max(5, Math.min(95, v.yes + jitter(5)));
        return { yes, no: 100 - yes };
      }));
      setTickPx(p => p.map(v => {
        const yes = Math.max(5, Math.min(95, v.yes + jitter(3)));
        return { yes, no: 100 - yes };
      }));
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`relative min-h-screen flex flex-col overflow-hidden theme-${theme}`}
      style={{ background: C.bg, color: C.textPrimary }}>

      <style>{`
        /* ── Card float (slow, gentle — rotation baked in) ── */
        @keyframes cf1{0%,100%{transform:rotate(-6deg) translateY(0px)}50%{transform:rotate(-6deg) translateY(-7px)}}
        @keyframes cf2{0%,100%{transform:rotate(5deg) translateY(0px)}50%{transform:rotate(5deg) translateY(-6px)}}
        @keyframes cf3{0%,100%{transform:rotate(-4deg) translateY(0px)}50%{transform:rotate(-4deg) translateY(-7px)}}
        @keyframes cf4{0%,100%{transform:rotate(4deg) translateY(0px)}50%{transform:rotate(4deg) translateY(-6px)}}
        @keyframes cf5{0%,100%{transform:rotate(-3deg) translateY(0px)}50%{transform:rotate(-3deg) translateY(-5px)}}
        .cf1{animation:cf1 7.2s ease-in-out infinite}
        .cf2{animation:cf2 8.4s ease-in-out 1.2s infinite}
        .cf3{animation:cf3 7.8s ease-in-out 2.5s infinite}
        .cf4{animation:cf4 9.0s ease-in-out 0.6s infinite}
        .cf5{animation:cf5 8.0s ease-in-out 3.0s infinite}

        /* ── Card hover ── */
        .pcard{transition:opacity .3s ease}
        .pcard:hover{opacity:0.38!important;cursor:default}

        /* ── Dolphin orb ── */
        @keyframes hero-float{
          0%,100%{transform:translateY(0px) scale(1)}
          50%{transform:translateY(-14px) scale(1.045)}
        }
        .hero-float{
          animation:hero-float 4.8s ease-in-out infinite;
          filter:drop-shadow(0 0 28px rgba(168,85,247,.7)) drop-shadow(0 0 70px rgba(124,58,237,.45)) drop-shadow(0 0 8px rgba(196,132,252,.6));
        }

        /* ── Expanding rings ── */
        @keyframes ring-out{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.9);opacity:0}}
        .ring-a{animation:ring-out 3.4s ease-out infinite}
        .ring-b{animation:ring-out 3.4s ease-out 1.7s infinite}

        /* ── CTA glow pulse ── */
        @keyframes cta-pulse{
          0%,100%{box-shadow:0 0 22px rgba(168,85,247,.5),0 4px 18px rgba(0,0,0,.45)}
          50%{box-shadow:0 0 44px rgba(168,85,247,.85),0 4px 18px rgba(0,0,0,.45)}
        }
        .cta-btn{animation:cta-pulse 3s ease-in-out infinite;transition:transform .2s ease,box-shadow .2s ease}
        .cta-btn:hover{transform:translateY(-3px) scale(1.05);animation-play-state:paused;box-shadow:0 0 60px rgba(168,85,247,1),0 8px 28px rgba(0,0,0,.55)!important}

        /* ── Ticker ── */
        @keyframes ticker-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        .ticker-track{display:flex;white-space:nowrap;animation:ticker-scroll 46s linear infinite;will-change:transform}
        .ticker-track:hover{animation-play-state:paused}

        /* ── Price transition ── */
        .pcell{transition:color .35s ease}

        /* ── Hide cards on small screens ── */
        @media(max-width:900px){.bg-card{display:none!important}}
      `}</style>

      {/* ── Background glows ──────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: C.glowRadial }}/>
      <div className="absolute inset-0 pointer-events-none" style={{ background: C.glowLeft }}/>
      <div className="absolute inset-0 pointer-events-none" style={{ background: C.glowRight }}/>
      {/* scan lines for texture */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(124,58,237,0.012) 3px,rgba(124,58,237,0.012) 4px)",
      }}/>

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <header className="relative z-30 flex items-center justify-between px-8 py-4 flex-shrink-0"
        style={{ borderBottom: `1px solid ${C.navBorder}`, background: C.bg2, backdropFilter: isDark ? "none" : "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Dolphin AI" width={26} height={26}
            className="logo-glow" style={{ mixBlendMode: isDark ? "screen" : "multiply" }}/>
          <span className="font-semibold text-sm tracking-[0.18em] uppercase" style={{ color: "#c084fc" }}>
            Dolphin AI
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          {NAV.map(item => (
            <a key={item} href="#" className="text-sm" style={{ color: "#8b5cf6", transition: "color .15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = isDark ? "#d8b4fe" : "#5b21b6")}
              onMouseLeave={e => (e.currentTarget.style.color = "#8b5cf6")}>
              {item}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono"
            style={{ background: "#10b98112", border: "1px solid #10b98132", color: "#10b981", boxShadow: isDark ? "0 0 14px #10b98120" : "none" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot"/>
            Live
          </div>
          {/* Theme toggle */}
          <button
            onClick={toggle}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: isDark ? "#1a0d30" : "rgba(124,58,237,0.08)",
              border: `1px solid ${isDark ? "#3b1f6e" : "rgba(124,58,237,0.22)"}`,
              color: isDark ? "#c084fc" : "#7c3aed",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, transition: "all 0.2s ease",
            }}
          >{isDark ? "☀" : "☾"}</button>
          <Link href="/canvas"
            className="px-4 py-1.5 rounded-full text-xs font-mono font-medium"
            style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", boxShadow: isDark ? "0 0 14px #7c3aed44" : "0 2px 10px rgba(124,58,237,0.28)" }}>
            Open Canvas
          </Link>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 overflow-hidden"
        style={{paddingBottom:"88px"}}>

        {/* Large background dolphin silhouette */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{zIndex:1,transform:"translateY(-16px)"}}>
          <img src="/logo.png" alt="" style={{
            width:540, height:540,
            opacity:0.16,
            mixBlendMode:"screen",
            filter:"drop-shadow(0 0 100px rgba(168,85,247,1)) drop-shadow(0 0 220px rgba(124,58,237,.8)) drop-shadow(0 0 50px rgba(196,132,252,.9))",
          }}/>
        </div>

        {/* Central energy orb (additional glow layer) */}
        <div className="absolute pointer-events-none" style={{
          zIndex:1,
          top:"50%", left:"50%",
          transform:"translate(-50%,-50%) translateY(-30px)",
          width:480, height:480,
          background:"radial-gradient(circle, #7c3aed2a 0%, #4c1d9514 45%, transparent 72%)",
          filter:"blur(56px)",
        }}/>

        {/* ── Floating background cards ── */}
        {CARD_EVENTS.map((card, i) => {
          const p = cardPx[i];
          return (
            <div key={card.id}
              className={`bg-card ${card.cf} pcard`}
              style={{
                position: "absolute", ...card.pos, zIndex: 5,
                width: 188,
                opacity: 0.2,
                background: C.cardBg,
                border: `1px solid ${card.accent}28`,
                borderRadius: 12,
                padding: "11px 13px",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                boxShadow: isDark ? `0 0 16px ${card.accent}14,0 4px 20px rgba(0,0,0,.4)` : `0 0 12px ${card.accent}18,0 2px 12px rgba(124,58,237,.08)`,
              }}>

              {/* Category */}
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 7 }}>
                <span style={{ fontSize: 10, color: card.accent }}>{card.icon}</span>
                <span style={{ fontSize: 8, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: card.accent + "99" }}>
                  {card.cat}
                </span>
              </div>

              {/* Title */}
              <div style={{ fontSize: 11, color: C.cardTitle, fontWeight: 500, lineHeight: 1.4, marginBottom: 10 }}>
                {card.title}
              </div>

              {/* Sparkline */}
              <svg width="100%" height="22" viewBox="0 0 80 28" preserveAspectRatio="none"
                style={{display:"block",marginBottom:9,opacity:.7}}>
                <polyline points={card.spark} fill="none"
                  stroke={card.accent} strokeWidth="1.4"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>

              {/* YES / NO */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <span style={{fontSize:8,fontFamily:"monospace",color:"#10b98155"}}>YES </span>
                  <span className="pcell" style={{fontSize:13,fontFamily:"monospace",fontWeight:700,color:"#10b981"}}>{p.yes}¢</span>
                </div>
                <div style={{width:1,height:14,background:"#2d1b4e"}}/>
                <div>
                  <span style={{fontSize:8,fontFamily:"monospace",color:"#f8717155"}}>NO </span>
                  <span className="pcell" style={{fontSize:13,fontFamily:"monospace",fontWeight:700,color:"#f87171"}}>{p.no}¢</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* ── Center content ── */}
        <div className="relative flex flex-col items-center" style={{zIndex:20}}>

          {/* Logo orb */}
          <div className="relative flex items-center justify-center mb-8" style={{width:112,height:112}}>
            <div className="ring-a absolute rounded-full" style={{width:86,height:86,border:"1px solid #a855f768"}}/>
            <div className="ring-b absolute rounded-full" style={{width:86,height:86,border:"1px solid #a855f748"}}/>
            <div className="absolute rounded-full" style={{width:92,height:92,border:"1px solid #a855f722"}}/>
            <div className="absolute rounded-full" style={{
              width:64,height:64,
              border:"1px solid #7c3aed44",
              background:"radial-gradient(circle,#7c3aed1c 0%,transparent 70%)",
            }}/>
            <img src="/logo.png" alt="Dolphin AI" width={68} height={68}
              className="hero-float relative z-10" style={{mixBlendMode:"screen"}}/>
          </div>

          {/* Eyebrow */}
          <div className="text-xs tracking-[0.32em] uppercase font-mono mb-5"
            style={{ color: C.eyebrow, textShadow: isDark ? "0 0 12px #7c3aed88" : "none" }}>
            AI-Powered Prediction Markets
          </div>

          {/* Main headline */}
          <h1 className="font-semibold tracking-tight mb-5" style={{
            fontSize: "clamp(3.4rem,10vw,6.8rem)",
            lineHeight: 1.03,
            color: C.headlineColor,
            textShadow: C.headlineShadow,
          }}>
            Trade the future.
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg leading-relaxed mb-10 max-w-sm" style={{ color: C.textMuted }}>
            AI-powered prediction markets.<br/>
            Discover, analyze, and act with confidence.
          </p>

          {/* CTA */}
          <Link href="/canvas"
            className="cta-btn inline-flex items-center gap-2.5 rounded-full font-semibold text-sm"
            style={{padding:"15px 42px",background:"linear-gradient(135deg,#7c3aed,#a855f7)",color:"#fff"}}>
            Enter Canvas
            <span style={{fontSize:18,lineHeight:1}}>→</span>
          </Link>

        </div>
      </main>

      {/* ── Ticker ────────────────────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-20"
        style={{
          borderTop: `1px solid ${C.tickerBorder}`,
          background: C.tickerBg,
          paddingTop: 9, paddingBottom: 11,
          overflow: "hidden",
        }}>
        {/* LIVE MARKETS label */}
        <div className="absolute left-4 top-1/2 z-10 hidden md:flex items-center gap-2"
          style={{ transform: "translateY(-50%)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot"/>
          <span style={{ fontSize: 9, fontFamily: "monospace", color: "#10b981", letterSpacing: "0.14em",
            textShadow: isDark ? "0 0 8px #10b981aa" : "none" }}>LIVE MARKETS</span>
        </div>

        {/* Left fade */}
        <div className="absolute inset-y-0 left-0 z-10 pointer-events-none" style={{
          width: 150,
          background: `linear-gradient(to right,${C.tickerFade1},transparent)`,
        }}/>
        {/* Right fade */}
        <div className="absolute inset-y-0 right-0 z-10 pointer-events-none" style={{
          width: 100,
          background: `linear-gradient(to left,${C.tickerFade1},transparent)`,
        }}/>

        <div style={{ overflow: "hidden" }}>
          <div className="ticker-track">
            {[...TICKER_BASE, ...TICKER_BASE].map((item, i) => {
              const p = tickPx[i % TICKER_BASE.length];
              const ac = CAT_COLOR[item.cat] ?? "#8b5cf6";
              return (
                <div key={i} className="inline-flex items-center gap-2.5 flex-shrink-0"
                  style={{ padding: "0 18px", borderRight: `1px solid ${C.tickerSep}` }}>
                  <span style={{ fontSize: 12, color: C.tickerIcon }}>{item.icon}</span>
                  <span className="text-xs font-mono" style={{ color: C.tickerQ }}>{item.q}</span>
                  <span className="pcell text-xs font-mono font-semibold" style={{ color: "#10b981" }}>YES {p.yes}¢</span>
                  <span style={{ color: C.tickerSep2, fontSize: 10 }}>·</span>
                  <span className="pcell text-xs font-mono font-semibold" style={{ color: "#f87171" }}>NO {p.no}¢</span>
                  <span style={{
                    fontSize: 8, fontFamily: "monospace", letterSpacing: "0.06em",
                    padding: "1px 5px", borderRadius: 3,
                    background: `${ac}14`, border: `1px solid ${ac}33`, color: ac,
                  }}>{item.cat}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
