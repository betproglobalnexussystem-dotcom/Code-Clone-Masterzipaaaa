import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft } from "lucide-react";
import { spin, randomGrid } from "../../lib/slotEngine";
import type { Grid, WinLine } from "../../lib/slotEngine";

const BASE = "https://www.freeslots.com/images515/";

// Symbol → image file mapping (Treasures of Egypt, game 515)
const SYM_IMG: Record<string, string> = {
  "9":       BASE + "r2.png",
  "10":      BASE + "r3.png",
  "J":       BASE + "r4.png",
  "Q":       BASE + "r5.png",
  "K":       BASE + "r6.png",
  "A":       BASE + "r7.png",
  "EYE":     BASE + "r8.png",
  "SCARAB":  BASE + "r10.png",
  "ANKH":    BASE + "r11.png",
  "SPHINX":  BASE + "r12.png",
  "PHARAOH": BASE + "r13.png",
  "WILD":    BASE + "r15.png",
  "SCATTER": BASE + "r20.png",
};

// Animated frames for Wild & Scatter
const WILD_FRAMES   = Array.from({ length: 10 }, (_, i) => BASE + `r15x${i}.png`);
const SCATTER_FRAMES = Array.from({ length:  6 }, (_, i) => BASE + `r20x${i}.png`);

const SYMBOL_KEYS = Object.keys(SYM_IMG);

// Reel strips – weighted toward lower symbols, specials are rare
const mkStrip = (seed = 0) => {
  const base = ["9","9","10","10","J","J","Q","Q","K","K","A","A",
    "EYE","SCARAB","ANKH","SPHINX","PHARAOH","WILD","SCATTER",
    "9","10","J","Q","K","A","EYE","SCARAB","ANKH","SPHINX"];
  // slight variation per reel
  const out = [...base];
  for (let i = 0; i < seed; i++) {
    const tmp = out[i % out.length];
    out[i % out.length] = out[(i + 3) % out.length];
    out[(i + 3) % out.length] = tmp;
  }
  return out;
};

const REEL_STRIPS = [mkStrip(0), mkStrip(1), mkStrip(2), mkStrip(3), mkStrip(4)];

// Minimal pay table (pay is multiplier × bet × 25 lines)
const PAY: Record<string, Record<number, number>> = {
  WILD:    { 3: 100, 4: 1000, 5: 5000 },
  SCATTER: { 3: 5,   4: 20,   5: 50   },
  PHARAOH: { 3: 50,  4: 200,  5: 1000 },
  SPHINX:  { 3: 30,  4: 100,  5: 500  },
  ANKH:    { 3: 20,  4: 75,   5: 300  },
  SCARAB:  { 3: 15,  4: 50,   5: 200  },
  EYE:     { 3: 10,  4: 30,   5: 100  },
  A:       { 3: 5,   4: 15,   5: 50   },
  K:       { 3: 4,   4: 12,   5: 40   },
  Q:       { 3: 3,   4: 10,   5: 30   },
  J:       { 3: 2,   4: 8,    5: 20   },
  "10":    { 3: 2,   4: 6,    5: 15   },
  "9":     { 3: 1,   4: 4,    5: 10   },
};

const BETS        = [100, 200, 500, 1000, 2000, 5000];
const INITIAL_BAL = 50_000;
const NUM_LINES   = 25;

// ─── Simple grid spin ────────────────────────────────────────────────────────
function doSpin(strips: string[][], bet: number, nonce: number) {
  const grid: Grid = strips.map(strip => {
    const pos = (nonce * (strips.indexOf(strip) + 7) * 6271) % strip.length;
    return [
      strip[pos % strip.length],
      strip[(pos + 1) % strip.length],
      strip[(pos + 2) % strip.length],
    ];
  }) as Grid;

  // Check all 25 paylines (simplified: only check middle row and a few combos)
  const wins: WinLine[] = [];
  let scatterCount = 0;
  let totalWin = 0;

  // Count scatters anywhere on grid
  for (let r = 0; r < 5; r++)
    for (let row = 0; row < 3; row++)
      if (grid[r][row] === "SCATTER") scatterCount++;

  if (scatterCount >= 3) {
    const scatterWin = (PAY.SCATTER[Math.min(scatterCount, 5)] ?? 0) * bet;
    if (scatterWin > 0) {
      totalWin += scatterWin;
      const cells: [number, number][] = [];
      for (let r = 0; r < 5; r++)
        for (let row = 0; row < 3; row++)
          if (grid[r][row] === "SCATTER") cells.push([r, row]);
      wins.push({ cells, symbol: "SCATTER", count: scatterCount, payout: scatterWin, paylineIndex: -1 });
    }
  }

  // Check 3 horizontal rows
  const rows = [0, 1, 2];
  for (const row of rows) {
    const line = grid.map(col => col[row]);
    // Find longest match from left (wilds count as any)
    let sym = line[0] === "WILD" ? null : line[0];
    let len = 1;
    for (let r = 1; r < 5; r++) {
      const s = line[r];
      if (s === "WILD" || s === sym || sym === null) {
        if (sym === null && s !== "WILD") sym = s;
        len++;
      } else break;
    }
    if (sym && len >= 3) {
      const payout = (PAY[sym]?.[len] ?? 0) * bet;
      if (payout > 0) {
        totalWin += payout;
        wins.push({
          cells: Array.from({ length: len }, (_, r) => [r, row] as [number, number]),
          symbol: sym,
          count: len,
          payout,
          paylineIndex: -1,
        });
      }
    }
  }

  // Check 2 diagonal lines
  const diag1 = [[0,0],[1,1],[2,2],[3,1],[4,0]]; // V shape
  const diag2 = [[0,2],[1,1],[2,0],[3,1],[4,2]]; // Λ shape
  for (const path of [diag1, diag2]) {
    const line = path.map(([r, row]) => grid[r][row]);
    let sym = line[0] === "WILD" ? null : line[0];
    let len = 1;
    for (let i = 1; i < 5; i++) {
      const s = line[i];
      if (s === "WILD" || s === sym || sym === null) {
        if (sym === null && s !== "WILD") sym = s;
        len++;
      } else break;
    }
    if (sym && len >= 3) {
      const payout = (PAY[sym]?.[len] ?? 0) * bet;
      if (payout > 0) {
        totalWin += payout;
        wins.push({
          cells: path.slice(0, len) as [number, number][],
          symbol: sym,
          count: len,
          payout,
          paylineIndex: -1,
        });
      }
    }
  }

  return {
    grid,
    wins,
    totalWin,
    freeSpinsAwarded: scatterCount >= 3 ? (scatterCount >= 5 ? 50 : scatterCount >= 4 ? 20 : 10) : 0,
  };
}

// ─── Animated symbol (wild/scatter cycle frames) ─────────────────────────────
function AnimSymbol({ sym, size }: { sym: string; size: number }) {
  const [frame, setFrame] = useState(0);
  const frames = sym === "WILD" ? WILD_FRAMES : sym === "SCATTER" ? SCATTER_FRAMES : null;

  useEffect(() => {
    if (!frames) return;
    const iv = setInterval(() => setFrame(f => (f + 1) % frames.length), 120);
    return () => clearInterval(iv);
  }, [frames]);

  const src = frames ? frames[frame] : SYM_IMG[sym];
  return (
    <img
      src={src}
      alt={sym}
      width={size}
      height={size}
      style={{ objectFit: "contain", imageRendering: "auto" }}
      onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.3"; }}
    />
  );
}

// ─── Spin button ──────────────────────────────────────────────────────────────
function SpinBtn({ spinning, disabled, freeSpins, onClick }: {
  spinning: boolean; disabled: boolean; freeSpins: number; onClick: () => void;
}) {
  return (
    <div style={{ position: "relative", width: 84, height: 84, flexShrink: 0 }}>
      {/* outer ring 1 */}
      <svg width={84} height={84} style={{ position: "absolute", inset: 0,
        animation: spinning ? "ringSpin 0.4s linear infinite" : "ringSpin 3s linear infinite",
        opacity: disabled ? 0.4 : 1 }}>
        <circle cx={42} cy={42} r={39} fill="none" stroke="#FFD700"
          strokeWidth="3.5" strokeDasharray="14 7" strokeLinecap="round" />
      </svg>
      {/* outer ring 2 */}
      <svg width={84} height={84} style={{ position: "absolute", inset: 0,
        animation: spinning ? "ringSpin 0.6s linear infinite reverse" : "ringSpin 5s linear infinite reverse",
        opacity: disabled ? 0.25 : 0.55 }}>
        <circle cx={42} cy={42} r={34} fill="none" stroke="#FF8C00"
          strokeWidth="2" strokeDasharray="7 11" strokeLinecap="round" />
      </svg>
      {/* main button */}
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          position: "absolute", top: 8, left: 8, width: 68, height: 68,
          borderRadius: "50%",
          background: freeSpins > 0
            ? "conic-gradient(from 0deg,#9C27B0,#CE93D8,#9C27B0)"
            : spinning
            ? "conic-gradient(from 0deg,#CC4400,#FF8C00,#CC4400)"
            : "conic-gradient(from 0deg,#B8600A,#FFD700,#FF8C00,#FFD700,#B8600A)",
          border: "3px solid rgba(255,255,255,0.25)",
          cursor: disabled ? "not-allowed" : "pointer",
          boxShadow: disabled ? "none"
            : `0 0 28px #FFD700, 0 0 56px rgba(255,180,0,0.45), 0 4px 16px rgba(0,0,0,0.7)`,
          animation: !disabled && !spinning ? "btnGlow 2.2s ease-in-out infinite" : "none",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 2, overflow: "hidden",
        }}
      >
        {/* shine */}
        <div style={{ position: "absolute", top: 6, left: 10, width: 48, height: 22,
          borderRadius: "50%", background: "rgba(255,255,255,0.22)", pointerEvents: "none" }} />
        <span style={{ color: "#1a0a00", fontWeight: 900, fontSize: spinning ? 9 : 13,
          letterSpacing: spinning ? 0 : 2, fontFamily: "Georgia, serif",
          textShadow: "0 1px 2px rgba(255,200,0,0.5)", lineHeight: 1 }}>
          {freeSpins > 0 ? "✨" : spinning ? "⏳" : "SPIN"}
        </span>
        {freeSpins > 0 && (
          <span style={{ color: "#fff", fontSize: 8, fontWeight: 800 }}>FREE</span>
        )}
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function GoldenPharaohSlot({ onBack }: { onBack: () => void }) {
  const [balance,    setBalance]    = useState(INITIAL_BAL);
  const [betIdx,     setBetIdx]     = useState(0);
  const [freeSpins,  setFreeSpins]  = useState(0);
  const [nonce,      setNonce]      = useState(1);
  const [spinning,   setSpinning]   = useState(false);
  const [reelSpin,   setReelSpin]   = useState([false,false,false,false,false]);
  const [grid,       setGrid]       = useState<Grid>(() => [
    ["PHARAOH","ANKH","EYE"],["SPHINX","WILD","Q"],["SCARAB","K","A"],["EYE","J","9"],["SCATTER","10","K"]
  ] as unknown as Grid);
  const [wins,       setWins]       = useState<WinLine[]>([]);
  const [totalWin,   setTotalWin]   = useState(0);
  const [winBanner,  setWinBanner]  = useState("");
  const [freeMsg,    setFreeMsg]    = useState("");
  const [autoSpin,   setAutoSpin]   = useState(false);
  const [autoCount,  setAutoCount]  = useState(0);
  const [winFlash,   setWinFlash]   = useState(false);
  const autoRef = useRef(false);
  const ivRefs  = useRef<ReturnType<typeof setInterval>[]>([]);

  const bet      = BETS[betIdx];
  const totalBet = bet * NUM_LINES;
  const canSpin  = !spinning && (freeSpins > 0 || balance >= totalBet);

  const highlighted = new Set<string>();
  for (const w of wins) for (const [r, row] of w.cells) highlighted.add(`${r}-${row}`);

  const handleSpin = useCallback(() => {
    if (spinning) return;
    const isFree = freeSpins > 0;
    if (!isFree && balance < totalBet) return;
    if (!isFree) setBalance(b => b - totalBet);
    else         setFreeSpins(f => f - 1);

    setWins([]);
    setTotalWin(0);
    setWinBanner("");
    setFreeMsg("");
    setWinFlash(false);
    const nc = nonce + Math.floor(Math.random() * 9999);
    setNonce(nc);
    setSpinning(true);
    setReelSpin([true,true,true,true,true]);

    const result = doSpin(REEL_STRIPS, bet, nc);

    // clear old intervals
    for (const iv of ivRefs.current) clearInterval(iv);
    ivRefs.current = [];

    for (let r = 0; r < 5; r++) {
      const delay = 900 + r * 450;
      // blur animation during spin
      const iv = setInterval(() => {
        setGrid(prev => {
          const next = prev.map(c => [...c]) as Grid;
          const strip = REEL_STRIPS[r];
          const pos   = Math.floor(Math.random() * strip.length);
          next[r] = [strip[pos % strip.length], strip[(pos+1) % strip.length], strip[(pos+2) % strip.length]];
          return next;
        });
      }, 70);
      ivRefs.current.push(iv);

      setTimeout(() => {
        clearInterval(ivRefs.current[r]);
        setGrid(prev => {
          const next = prev.map(c => [...c]) as Grid;
          next[r] = result.grid[r];
          return next;
        });
        setReelSpin(prev => { const n=[...prev]; n[r]=false; return n; });

        if (r === 4) {
          setSpinning(false);
          setWins(result.wins);
          setTotalWin(result.totalWin);
          if (result.totalWin > 0) {
            setBalance(b => b + result.totalWin);
            setWinFlash(true);
            const ratio = result.totalWin / totalBet;
            let banner = "WIN!";
            if (ratio >= 50)  banner = "🔥 MEGA WIN!! 🔥";
            else if (ratio >= 20) banner = "💰 BIG WIN! 💰";
            else if (ratio >= 5)  banner = "⭐ SUPER WIN! ⭐";
            setWinBanner(banner);
            setTimeout(() => { setWinBanner(""); setWinFlash(false); }, 3500);
          }
          if (result.freeSpinsAwarded > 0) {
            setFreeSpins(f => f + result.freeSpinsAwarded);
            setFreeMsg(`✨ ${result.freeSpinsAwarded} FREE SPINS UNLOCKED!`);
            setTimeout(() => setFreeMsg(""), 4500);
          }
        }
      }, delay);
    }
  }, [spinning, freeSpins, balance, totalBet, bet, nonce]);

  useEffect(() => { autoRef.current = autoSpin; }, [autoSpin]);
  useEffect(() => {
    if (!spinning && autoSpin && autoCount > 0) {
      const t = setTimeout(() => {
        if (autoRef.current) { setAutoCount(c => c - 1); handleSpin(); }
      }, 600);
      return () => clearTimeout(t);
    }
    if (autoCount === 0 && autoSpin) setAutoSpin(false);
    return undefined;
  }, [spinning, autoSpin, autoCount, handleSpin]);

  const fmt = (n: number) => n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M`
    : n >= 1_000 ? `${(n/1_000).toFixed(1)}K` : String(n);

  const CELL_W = 56;
  const CELL_H = 58;
  const REEL_GAP = 2;

  return (
    <div style={{
      minHeight: "100vh",
      background: `url('${BASE}bonusbackground.png') center/cover no-repeat, linear-gradient(160deg,#0a0500,#1a0e00,#0a0500)`,
      display: "flex", flexDirection: "column",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      position: "relative",
      userSelect: "none",
    }}>
      <style>{`
        @keyframes ringSpin    { to { transform: rotate(360deg); } }
        @keyframes btnGlow     { 0%,100%{box-shadow:0 0 28px #FFD700,0 0 56px rgba(255,180,0,0.45),0 4px 16px rgba(0,0,0,0.7)} 50%{box-shadow:0 0 48px #FFD700,0 0 90px rgba(255,180,0,0.7),0 4px 20px rgba(0,0,0,0.8)} }
        @keyframes winGlow     { 0%,100%{box-shadow:0 0 14px #FFD700,inset 0 0 10px rgba(255,215,0,0.2)} 50%{box-shadow:0 0 28px #FFD700,inset 0 0 18px rgba(255,215,0,0.35)} }
        @keyframes bannerPop   { 0%{transform:scale(0.5);opacity:0} 65%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes freeBounce  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.07)} }
        @keyframes reelBlur    { 0%{filter:blur(4px) brightness(1.3)} 100%{filter:blur(0) brightness(1)} }
        @keyframes reelStop    { 0%{transform:scaleY(1.04)} 100%{transform:scaleY(1)} }
        @keyframes bgOverlay   { 0%,100%{opacity:0.6} 50%{opacity:0.75} }
      `}</style>

      {/* Dark overlay */}
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.68)", pointerEvents: "none", animation: "bgOverlay 4s ease infinite" }} />

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", flex: 1 }}>

        {/* ── Header ── */}
        <div style={{
          display: "flex", alignItems: "center", padding: "9px 14px",
          background: "linear-gradient(90deg,#0d0600,#2a1500,#0d0600)",
          borderBottom: "2px solid #8B5A00",
          boxShadow: "0 2px 16px rgba(200,140,0,0.3)",
        }}>
          <button onClick={onBack} style={{
            background: "rgba(139,90,0,0.3)", border: "1px solid #8B5A00",
            color: "#FFD700", borderRadius: 8, padding: "6px 10px",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
            fontSize: 12, fontWeight: 700,
          }}>
            <ChevronLeft size={15} /> BACK
          </button>
          <div style={{ flex: 1, textAlign: "center" }}>
            {/* Title using real freeslots image */}
            <img src={BASE + "bonustitle.png"} alt="Treasures of Egypt"
              style={{ maxHeight: 38, maxWidth: 220, objectFit: "contain" }}
              onError={(e) => {
                const el = e.currentTarget as HTMLImageElement;
                el.style.display = "none";
                const span = document.createElement("span");
                span.textContent = "GOLDEN PHARAOH";
                span.style.cssText = "color:#FFD700;font-size:16px;font-weight:900;letter-spacing:2px;text-shadow:0 0 12px #FFD700";
                el.parentElement?.appendChild(span);
              }}
            />
          </div>
          <div style={{ textAlign: "right", minWidth: 70 }}>
            <div style={{ color: "#8B5A00", fontSize: 9, letterSpacing: 0.5 }}>BALANCE</div>
            <div style={{ color: "#FFD700", fontSize: 14, fontWeight: 900, textShadow: "0 0 8px #FFD700" }}>
              {fmt(balance)}
            </div>
          </div>
        </div>

        {/* Free spin / win message strip */}
        {(freeSpins > 0 || freeMsg || winBanner) && (
          <div style={{
            textAlign: "center", padding: "7px 10px",
            background: "linear-gradient(90deg,transparent,rgba(200,140,0,0.2),transparent)",
            borderBottom: "1px solid #8B5A00",
          }}>
            {freeSpins > 0 && (
              <span style={{
                display: "inline-block",
                background: "linear-gradient(135deg,#7B1FA2,#CE93D8,#7B1FA2)",
                color: "#fff", padding: "3px 14px", borderRadius: 20, fontWeight: 800, fontSize: 12,
                boxShadow: "0 0 14px rgba(156,39,176,0.7)",
                animation: "freeBounce 1s ease infinite", marginRight: 8,
              }}>
                ✨ {freeSpins} FREE SPINS
              </span>
            )}
            {freeMsg && (
              <span style={{ color: "#FFD700", fontWeight: 800, fontSize: 13, animation: "bannerPop 0.4s ease" }}>
                {freeMsg}
              </span>
            )}
            {winBanner && (
              <span style={{ color: "#FFD700", fontWeight: 900, fontSize: 18,
                textShadow: "0 0 20px #FFD700, 0 0 40px rgba(255,200,0,0.6)",
                animation: "bannerPop 0.35s ease", display: "block" }}>
                {winBanner}
              </span>
            )}
          </div>
        )}

        {/* ── Machine body ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px 6px" }}>

          {/* Frame shell with real images */}
          <div style={{ position: "relative", display: "inline-block" }}>

            {/* REELS container */}
            <div style={{
              display: "flex", gap: REEL_GAP,
              padding: "10px 8px",
              background: "linear-gradient(180deg,#0d0600,#1a0e00,#0d0600)",
              border: "3px solid #8B5A00",
              borderRadius: 10,
              boxShadow: "0 0 30px rgba(200,140,0,0.25), inset 0 0 30px rgba(0,0,0,0.8)",
              position: "relative",
            }}>
              {/* Top gold bar */}
              <div style={{ position: "absolute", top: 0, left: "5%", right: "5%", height: 2,
                background: "linear-gradient(90deg,transparent,#FFD700,transparent)", borderRadius: 1 }} />
              {/* Bottom gold bar */}
              <div style={{ position: "absolute", bottom: 0, left: "5%", right: "5%", height: 2,
                background: "linear-gradient(90deg,transparent,#FFD700,transparent)", borderRadius: 1 }} />
              {/* Payline dots */}
              <div style={{ position: "absolute", left: -8, top: "50%", transform: "translateY(-50%)",
                width: 7, height: 7, borderRadius: "50%", background: "#FFD700",
                boxShadow: "0 0 6px #FFD700" }} />
              <div style={{ position: "absolute", right: -8, top: "50%", transform: "translateY(-50%)",
                width: 7, height: 7, borderRadius: "50%", background: "#FFD700",
                boxShadow: "0 0 6px #FFD700" }} />

              {/* 5 Reels */}
              {[0,1,2,3,4].map(r => (
                <div key={r} style={{
                  display: "flex", flexDirection: "column", gap: 2,
                  borderRadius: 6,
                  overflow: "hidden",
                  background: "rgba(0,0,0,0.5)",
                  boxShadow: "inset 0 0 12px rgba(0,0,0,0.8)",
                }}>
                  {[0,1,2].map(row => {
                    const sym   = grid[r]?.[row] ?? "9";
                    const isHit = !spinning && highlighted.has(`${r}-${row}`);
                    const isSpinning = reelSpin[r];
                    return (
                      <div key={row} style={{
                        width: CELL_W, height: CELL_H,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: isHit
                          ? "radial-gradient(circle,rgba(255,215,0,0.22) 0%,rgba(0,0,0,0.8) 100%)"
                          : "rgba(10,6,0,0.75)",
                        border: isHit ? "2px solid #FFD700" : "1px solid rgba(139,90,0,0.2)",
                        borderRadius: 4,
                        boxShadow: isHit
                          ? "0 0 16px #FFD700, inset 0 0 12px rgba(255,215,0,0.15)"
                          : "inset 0 1px 0 rgba(255,255,255,0.04)",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                        animation: isHit ? "winGlow 0.55s ease-in-out infinite" : undefined,
                        filter: isSpinning ? "blur(3px) brightness(1.4)" : "none",
                        transform: isSpinning ? "scaleY(0.94)" : "scaleY(1)",
                        position: "relative",
                        overflow: "hidden",
                      }}>
                        {isHit && (
                          <div style={{
                            position: "absolute", inset: 0,
                            background: "rgba(255,215,0,0.08)",
                            borderRadius: 3,
                          }} />
                        )}
                        {isSpinning ? (
                          <img src={SYM_IMG[sym] ?? SYM_IMG["9"]} alt={sym}
                            width={CELL_W - 4} height={CELL_H - 4}
                            style={{ objectFit: "contain", opacity: 0.35 }} />
                        ) : (
                          <AnimSymbol sym={sym} size={Math.min(CELL_W, CELL_H) - 4} />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Faceplate overlay – real PNG from freeslots */}
            <img
              src={BASE + "faceplate.png"}
              alt=""
              style={{
                position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                objectFit: "fill", pointerEvents: "none", borderRadius: 10,
                opacity: 0.9,
              }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>

          {/* Win amount display */}
          <div style={{ minHeight: 36, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 6 }}>
            {winFlash && totalWin > 0 && (
              <div style={{
                color: "#FFD700", fontSize: 15, fontWeight: 900, letterSpacing: 1,
                textShadow: "0 0 16px #FFD700, 0 0 32px rgba(255,215,0,0.6)",
                animation: "bannerPop 0.3s ease",
              }}>
                WIN: UGX {totalWin.toLocaleString()} · {wins.length} line{wins.length !== 1 ? "s" : ""}
              </div>
            )}
            {!winFlash && totalWin > 0 && (
              <div style={{ color: "rgba(255,215,0,0.55)", fontSize: 11 }}>
                Last: UGX {totalWin.toLocaleString()}
              </div>
            )}
          </div>

          {/* ── Controls panel ── */}
          <div style={{
            width: "100%", maxWidth: 320,
            background: "linear-gradient(180deg,#1a0a00,#0d0600)",
            border: "2px solid #8B5A00",
            borderRadius: 14,
            padding: "10px 12px 12px",
            boxShadow: "0 -4px 20px rgba(200,140,0,0.2), 0 4px 20px rgba(0,0,0,0.6)",
          }}>
            {/* Bet row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div>
                <div style={{ color: "#8B5A00", fontSize: 8, letterSpacing: 0.5 }}>BET / LINE</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                  <button onClick={() => setBetIdx(i => Math.max(0,i-1))} disabled={spinning || betIdx===0}
                    style={{ background:"rgba(139,90,0,0.25)", border:"1px solid #8B5A00", color:"#FFD700",
                      borderRadius:6, width:26, height:26, cursor:"pointer", fontSize:16,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      opacity: betIdx===0 ? 0.35 : 1 }}>−</button>
                  <span style={{ color:"#FFD700", fontSize:14, fontWeight:900, minWidth:52, textAlign:"center",
                    textShadow:"0 0 6px rgba(255,215,0,0.5)" }}>
                    {bet.toLocaleString()}
                  </span>
                  <button onClick={() => setBetIdx(i => Math.min(BETS.length-1,i+1))} disabled={spinning || betIdx===BETS.length-1}
                    style={{ background:"rgba(139,90,0,0.25)", border:"1px solid #8B5A00", color:"#FFD700",
                      borderRadius:6, width:26, height:26, cursor:"pointer", fontSize:16,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      opacity: betIdx===BETS.length-1 ? 0.35 : 1 }}>+</button>
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ color:"#8B5A00", fontSize:8 }}>LINES</div>
                <div style={{ color:"#FFD700", fontSize:18, fontWeight:900 }}>{NUM_LINES}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color:"#8B5A00", fontSize:8 }}>TOTAL BET</div>
                <div style={{ color:"#FF8C00", fontSize:13, fontWeight:800 }}>
                  {totalBet.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Action row */}
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              {/* Auto */}
              {autoSpin ? (
                <button onClick={() => { setAutoSpin(false); setAutoCount(0); }}
                  style={{ flex:1, height:40, background:"rgba(180,30,30,0.15)",
                    border:"1px solid rgba(200,50,50,0.5)", color:"#ff5555",
                    borderRadius:10, fontWeight:700, fontSize:10, cursor:"pointer",
                    display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
                  <span style={{fontSize:14}}>⏹</span>
                  <span style={{fontSize:8,marginTop:1}}>STOP ({autoCount})</span>
                </button>
              ) : (
                <button onClick={() => { setAutoSpin(true); setAutoCount(10); }}
                  disabled={!canSpin}
                  style={{ flex:1, height:40, background:"rgba(139,90,0,0.2)",
                    border:"1px solid #8B5A00", color:"#FFD700",
                    borderRadius:10, fontWeight:700, fontSize:10, cursor:"pointer",
                    display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                    opacity: !canSpin ? 0.4 : 1 }}>
                  <span style={{fontSize:14}}>🔄</span>
                  <span style={{fontSize:8,marginTop:1}}>AUTO×10</span>
                </button>
              )}

              {/* SPIN */}
              <SpinBtn
                spinning={spinning}
                disabled={!canSpin}
                freeSpins={freeSpins}
                onClick={handleSpin}
              />

              {/* Max bet */}
              <button onClick={() => setBetIdx(BETS.length-1)} disabled={spinning}
                style={{ flex:1, height:40, background:"rgba(139,90,0,0.2)",
                  border:"1px solid #8B5A00", color:"#FF8C00",
                  borderRadius:10, fontWeight:700, fontSize:10, cursor:"pointer",
                  display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
                <span style={{fontSize:14}}>★</span>
                <span style={{fontSize:8,marginTop:1}}>MAX BET</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Paytable strip ── */}
        <div style={{
          padding: "8px 10px 12px",
          background: "linear-gradient(0deg,#0d0600,#1a0a00)",
          borderTop: "1px solid #8B5A00",
        }}>
          <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:2 }}>
            {Object.entries(PAY).map(([sym, pays]) => (
              <div key={sym} style={{
                flexShrink:0, background:"rgba(139,90,0,0.1)", border:"1px solid rgba(139,90,0,0.3)",
                borderRadius:8, padding:"5px 7px", textAlign:"center", minWidth:54,
              }}>
                <div style={{ width:32, height:32, margin:"0 auto 3px", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <img src={SYM_IMG[sym]} alt={sym} width={30} height={30}
                    style={{ objectFit:"contain" }}
                    onError={(e) => { (e.target as HTMLImageElement).style.opacity="0.2"; }} />
                </div>
                <div style={{ color:"#FFD700", fontSize:8, fontWeight:700 }}>×{pays[5]}  5✕</div>
                <div style={{ color:"#FF8C00", fontSize:8 }}>×{pays[3]}  3✕</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:12, marginTop:5, justifyContent:"center",
            color:"rgba(255,215,0,0.3)", fontSize:8 }}>
            <span>🃏 WILD substitutes</span>
            <span>💠 3+ SCATTER = Free Spins</span>
            <span>25 paylines · 96% RTP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
