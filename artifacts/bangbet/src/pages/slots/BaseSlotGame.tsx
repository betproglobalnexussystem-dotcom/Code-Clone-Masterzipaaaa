import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, Star } from "lucide-react";
import { spin, randomGrid, PAYTABLE } from "../../lib/slotEngine";
import type { Grid, WinLine } from "../../lib/slotEngine";
import { getSymbolSVG } from "./SymbolRenderer";
import type { ThemeId } from "./SymbolRenderer";

export interface SlotTheme {
  name: string;
  subtitle: string;
  bgGradient: string;
  bgImage: string;
  accentColor: string;
  secondaryColor: string;
  reelBg: string;
  spinBtnGradient: string;
  symbols: Record<string, { label: string; border: string; glow: string }>;
  reelStrips: string[][];
  themeId: ThemeId;
}

interface Props {
  theme: SlotTheme;
  onBack: () => void;
}

const BETS = [100, 200, 500, 1000, 2000, 5000];
const INITIAL_BALANCE = 50000;

function SymbolCell({
  symbol,
  themeId,
  highlighted,
  spinning,
  accentColor,
}: {
  symbol: string;
  themeId: ThemeId;
  highlighted: boolean;
  spinning: boolean;
  accentColor: string;
}) {
  return (
    <div
      style={{
        width: 54,
        height: 54,
        borderRadius: 10,
        background: highlighted
          ? `rgba(255,215,0,0.12)`
          : "rgba(0,0,0,0.55)",
        border: `2px solid ${highlighted ? "#FFD700" : "rgba(255,255,255,0.08)"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        boxShadow: highlighted
          ? `0 0 18px ${accentColor}, 0 0 32px rgba(255,215,0,0.4), inset 0 0 12px rgba(255,215,0,0.15)`
          : "0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
        transition: "all 0.25s ease",
        filter: spinning ? "blur(3px) brightness(1.4)" : "none",
        transform: spinning ? "scaleY(0.92)" : "scaleY(1)",
        flexShrink: 0,
      }}
    >
      {highlighted && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,215,0,0.08)",
            borderRadius: 8,
            animation: "winPulse 0.5s ease-in-out infinite alternate",
          }}
        />
      )}
      <div style={{ opacity: spinning ? 0.4 : 1, transition: "opacity 0.15s" }}>
        {getSymbolSVG(symbol, themeId, 48)}
      </div>
    </div>
  );
}

function SpinButton({
  spinning,
  disabled,
  isFree,
  accentColor,
  secondaryColor,
  onClick,
}: {
  spinning: boolean;
  disabled: boolean;
  isFree: boolean;
  accentColor: string;
  secondaryColor: string;
  onClick: () => void;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: 80,
        height: 80,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Outer rotating ring */}
      <svg
        width={80}
        height={80}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          animation: spinning ? "ringSpinFast 0.5s linear infinite" : "ringSpin 4s linear infinite",
          opacity: disabled ? 0.35 : 1,
        }}
      >
        <circle
          cx="40"
          cy="40"
          r="37"
          fill="none"
          stroke={accentColor}
          strokeWidth="3"
          strokeDasharray="12 6"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
      {/* Middle glow ring */}
      <svg
        width={80}
        height={80}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          animation: spinning ? "ringSpinFast 0.8s linear infinite reverse" : "ringSpin 7s linear infinite reverse",
          opacity: disabled ? 0.25 : 0.5,
        }}
      >
        <circle
          cx="40"
          cy="40"
          r="33"
          fill="none"
          stroke={secondaryColor}
          strokeWidth="2"
          strokeDasharray="6 10"
          strokeLinecap="round"
        />
      </svg>
      {/* Main button */}
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: isFree
            ? "linear-gradient(135deg, #7B1FA2, #9C27B0, #6A1B9A)"
            : `conic-gradient(from 0deg, ${accentColor}, ${secondaryColor}, ${accentColor})`,
          border: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: disabled
            ? "none"
            : spinning
            ? `0 0 20px ${accentColor}80`
            : `0 0 24px ${accentColor}, 0 0 50px ${accentColor}50, 0 4px 16px rgba(0,0,0,0.5)`,
          transition: "box-shadow 0.3s ease, transform 0.1s ease",
          transform: disabled ? "scale(0.94)" : spinning ? "scale(0.97)" : "scale(1)",
          animation: !disabled && !spinning ? "btnPulse 2s ease-in-out infinite" : "none",
          position: "relative",
          zIndex: 2,
          overflow: "hidden",
        }}
      >
        {/* Button inner shine */}
        <div
          style={{
            position: "absolute",
            top: 4,
            left: 8,
            width: 48,
            height: 20,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.25)",
            pointerEvents: "none",
          }}
        />
        <span
          style={{
            color: "#000",
            fontSize: spinning ? 8 : 11,
            fontWeight: 900,
            letterSpacing: spinning ? 0 : 1.5,
            fontFamily: "Oswald, Arial, sans-serif",
            lineHeight: 1,
            textShadow: "0 1px 2px rgba(255,255,255,0.3)",
          }}
        >
          {isFree ? "✨" : spinning ? "⏳" : "SPIN"}
        </span>
        {isFree && (
          <span style={{ color: "#fff", fontSize: 7, fontWeight: 700, marginTop: 2 }}>FREE</span>
        )}
      </button>
    </div>
  );
}

export default function BaseSlotGame({ theme, onBack }: Props) {
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [betIndex, setBetIndex] = useState(0);
  const [freeSpins, setFreeSpins] = useState(0);
  const [nonce, setNonce] = useState(1);
  const [spinning, setSpinning] = useState(false);
  const [reelSpinning, setReelSpinning] = useState([false, false, false, false, false]);
  const [displayGrid, setDisplayGrid] = useState<Grid>(() => randomGrid(theme.reelStrips));
  const [wins, setWins] = useState<WinLine[]>([]);
  const [totalWin, setTotalWin] = useState(0);
  const [showWinBanner, setShowWinBanner] = useState(false);
  const [winBannerText, setWinBannerText] = useState("");
  const [freeSpinMsg, setFreeSpinMsg] = useState("");
  const [autoSpin, setAutoSpin] = useState(false);
  const [autoSpinCount, setAutoSpinCount] = useState(0);
  const intervalRefs = useRef<ReturnType<typeof setInterval>[]>([]);
  const autoRef = useRef(false);

  const bet = BETS[betIndex];
  const totalBet = bet * 25;

  const highlightedCells = new Set<string>();
  for (const w of wins) for (const [r, row] of w.cells) highlightedCells.add(`${r}-${row}`);

  const allSymbols = Object.keys(theme.symbols);

  const doSpin = useCallback(() => {
    if (spinning) return;
    const isFree = freeSpins > 0;
    if (!isFree && balance < totalBet) return;

    if (!isFree) setBalance((b) => b - totalBet);
    if (isFree) setFreeSpins((f) => f - 1);

    setWins([]);
    setTotalWin(0);
    setShowWinBanner(false);
    setFreeSpinMsg("");

    const currentNonce = nonce;
    setNonce((n) => n + 1);
    setSpinning(true);
    setReelSpinning([true, true, true, true, true]);

    const result = spin(theme.reelStrips, bet, currentNonce + Math.floor(Math.random() * 9999));

    for (const ref of intervalRefs.current) clearInterval(ref);
    intervalRefs.current = [];

    for (let r = 0; r < 5; r++) {
      const ivl = setInterval(() => {
        setDisplayGrid((prev) => {
          const next = prev.map((col) => [...col]) as Grid;
          next[r] = [
            allSymbols[Math.floor(Math.random() * allSymbols.length)],
            allSymbols[Math.floor(Math.random() * allSymbols.length)],
            allSymbols[Math.floor(Math.random() * allSymbols.length)],
          ];
          return next;
        });
      }, 80);
      intervalRefs.current.push(ivl);

      const stopDelay = 800 + r * 400;
      setTimeout(() => {
        clearInterval(intervalRefs.current[r]);
        setDisplayGrid((prev) => {
          const next = prev.map((col) => [...col]) as Grid;
          next[r] = result.grid[r];
          return next;
        });
        setReelSpinning((prev) => {
          const next = [...prev];
          next[r] = false;
          return next;
        });

        if (r === 4) {
          setWins(result.wins);
          setTotalWin(result.totalWin);
          setSpinning(false);

          if (result.totalWin > 0) {
            setBalance((b) => b + result.totalWin);
            const ratio = result.totalWin / totalBet;
            let banner = "🎉 WIN!";
            if (ratio >= 50) banner = "🔥🔥 MEGA WIN!! 🔥🔥";
            else if (ratio >= 20) banner = "💰 BIG WIN! 💰";
            else if (ratio >= 5) banner = "⭐ SUPER WIN! ⭐";
            setWinBannerText(banner);
            setShowWinBanner(true);
            setTimeout(() => setShowWinBanner(false), 3000);
          }

          if (result.freeSpinsAwarded > 0) {
            setFreeSpins((f) => f + result.freeSpinsAwarded);
            setFreeSpinMsg(`🎁 +${result.freeSpinsAwarded} FREE SPINS UNLOCKED!`);
            setTimeout(() => setFreeSpinMsg(""), 4000);
          }
        }
      }, stopDelay);
    }
  }, [spinning, freeSpins, balance, totalBet, bet, nonce, theme, allSymbols]);

  useEffect(() => { autoRef.current = autoSpin; }, [autoSpin]);

  useEffect(() => {
    if (!spinning && autoSpin && autoSpinCount > 0) {
      const t = setTimeout(() => {
        if (autoRef.current) { setAutoSpinCount((c) => c - 1); doSpin(); }
      }, 500);
      return () => clearTimeout(t);
    }
    if (autoSpinCount === 0 && autoSpin) setAutoSpin(false);
    return undefined;
  }, [spinning, autoSpin, autoSpinCount, doSpin]);

  const formatUGX = (n: number) => `UGX ${n.toLocaleString()}`;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.bgImage
          ? `url(${theme.bgImage}) center/cover no-repeat`
          : theme.bgGradient,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Oswald', 'Arial', sans-serif",
        userSelect: "none",
      }}
    >
      <style>{`
        @keyframes winPulse { 0%{opacity:0.6} 100%{opacity:1} }
        @keyframes winPop { 0%{transform:scale(0.4) translateY(10px);opacity:0} 70%{transform:scale(1.12)} 100%{transform:scale(1);opacity:1} }
        @keyframes ringSpin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes ringSpinFast { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes btnPulse { 0%,100%{box-shadow:0 0 24px ${theme.accentColor},0 0 50px ${theme.accentColor}50,0 4px 16px rgba(0,0,0,0.5)} 50%{box-shadow:0 0 40px ${theme.accentColor},0 0 80px ${theme.accentColor}80,0 4px 20px rgba(0,0,0,0.6)} }
        @keyframes freeBadge { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
        @keyframes bannerIn { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
        @keyframes reelStop { 0%{transform:scaleY(1.06)} 100%{transform:scaleY(1)} }
      `}</style>

      {/* Darkening overlay */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.72)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", flex: 1 }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", padding: "10px 14px",
          borderBottom: `1px solid ${theme.accentColor}30`,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)",
        }}>
          <button
            onClick={onBack}
            style={{
              background: "rgba(255,255,255,0.07)", border: `1px solid ${theme.accentColor}40`,
              color: theme.accentColor, borderRadius: 8, padding: "6px 10px",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
              fontSize: 12, fontWeight: 700,
            }}
          >
            <ChevronLeft size={15} /> BACK
          </button>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ color: theme.accentColor, fontSize: 15, fontWeight: 700, letterSpacing: 1.5, textShadow: `0 0 12px ${theme.accentColor}80` }}>
              {theme.name}
            </div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, letterSpacing: 0.5 }}>{theme.subtitle}</div>
          </div>
          <div style={{ textAlign: "right", minWidth: 72 }}>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9 }}>BALANCE</div>
            <div style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>
              {balance >= 1000 ? `${(balance / 1000).toFixed(1)}K` : balance}
            </div>
          </div>
        </div>

        {/* Balance + free spins bar */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "5px 14px", background: "rgba(0,0,0,0.45)", fontSize: 11,
        }}>
          <div style={{ color: "rgba(255,255,255,0.55)" }}>
            BAL: <span style={{ color: "#fff", fontWeight: 700 }}>{formatUGX(balance)}</span>
          </div>
          {freeSpins > 0 && (
            <div style={{
              background: `linear-gradient(135deg, ${theme.accentColor}, ${theme.secondaryColor})`,
              color: "#000", padding: "3px 12px", borderRadius: 20, fontWeight: 800, fontSize: 11,
              animation: "freeBadge 1s ease infinite",
              boxShadow: `0 0 12px ${theme.accentColor}80`,
            }}>
              ✨ {freeSpins} FREE SPINS
            </div>
          )}
          <div style={{ color: "rgba(255,255,255,0.55)" }}>
            BET: <span style={{ color: theme.accentColor, fontWeight: 700 }}>{formatUGX(totalBet)}</span>
          </div>
        </div>

        {/* Free spin message */}
        {freeSpinMsg && (
          <div style={{
            textAlign: "center", padding: "10px 14px",
            background: `linear-gradient(90deg, transparent, ${theme.accentColor}25, transparent)`,
            color: theme.accentColor, fontWeight: 800, fontSize: 14,
            animation: "bannerIn 0.4s ease", borderBottom: `1px solid ${theme.accentColor}30`,
          }}>
            {freeSpinMsg}
          </div>
        )}

        {/* Main content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px 10px" }}>

          {/* Reel machine */}
          <div style={{
            background: "rgba(0,0,0,0.75)",
            border: `2px solid ${theme.accentColor}50`,
            borderRadius: 18,
            padding: "10px 8px",
            boxShadow: `0 0 40px ${theme.accentColor}20, 0 0 80px ${theme.accentColor}10, inset 0 0 30px rgba(0,0,0,0.6)`,
            position: "relative",
          }}>
            {/* Top glow line */}
            <div style={{
              position: "absolute", top: -1, left: "10%", right: "10%", height: 2,
              background: `linear-gradient(90deg, transparent, ${theme.accentColor}, transparent)`,
              borderRadius: 1,
            }} />
            {/* Bottom glow line */}
            <div style={{
              position: "absolute", bottom: -1, left: "10%", right: "10%", height: 2,
              background: `linear-gradient(90deg, transparent, ${theme.accentColor}, transparent)`,
              borderRadius: 1,
            }} />
            {/* Payline center indicator */}
            <div style={{
              position: "absolute", left: -8, top: "50%", width: 6, height: 6, borderRadius: 3,
              background: theme.accentColor, transform: "translateY(-50%)",
              boxShadow: `0 0 6px ${theme.accentColor}`,
            }} />
            <div style={{
              position: "absolute", right: -8, top: "50%", width: 6, height: 6, borderRadius: 3,
              background: theme.accentColor, transform: "translateY(-50%)",
              boxShadow: `0 0 6px ${theme.accentColor}`,
            }} />

            {/* Reels grid */}
            <div style={{ display: "flex", gap: 4 }}>
              {[0, 1, 2, 3, 4].map((reelIdx) => (
                <div
                  key={reelIdx}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    padding: "2px",
                    borderRadius: 8,
                    background: reelSpinning[reelIdx] ? "rgba(255,255,255,0.04)" : "transparent",
                    transition: "background 0.3s",
                    animation: !reelSpinning[reelIdx] && spinning ? "reelStop 0.2s ease" : "none",
                  }}
                >
                  {[0, 1, 2].map((row) => (
                    <SymbolCell
                      key={row}
                      symbol={displayGrid[reelIdx]?.[row] ?? "9"}
                      themeId={theme.themeId}
                      highlighted={!spinning && highlightedCells.has(`${reelIdx}-${row}`)}
                      spinning={reelSpinning[reelIdx]}
                      accentColor={theme.accentColor}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Win banner */}
          <div style={{ minHeight: 44, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: 8 }}>
            {showWinBanner && (
              <div style={{
                color: theme.accentColor, fontSize: 20, fontWeight: 900, letterSpacing: 2,
                animation: "bannerIn 0.35s ease",
                textShadow: `0 0 20px ${theme.accentColor}, 0 0 40px ${theme.accentColor}80`,
                textAlign: "center",
              }}>
                {winBannerText}
                <div style={{ fontSize: 13, color: "#fff", fontWeight: 700, marginTop: 2 }}>
                  {formatUGX(totalWin)}
                </div>
              </div>
            )}
            {!showWinBanner && totalWin > 0 && (
              <div style={{ color: "#FFD700", fontSize: 12, fontWeight: 700 }}>
                Last Win: {formatUGX(totalWin)} · {wins.length} line{wins.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          {/* Controls panel */}
          <div style={{
            width: "100%", maxWidth: 310,
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(12px)",
            borderRadius: 18, border: `1px solid ${theme.accentColor}25`,
            padding: "12px 14px 14px",
            boxShadow: `0 4px 24px rgba(0,0,0,0.5)`,
          }}>
            {/* Bet row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, letterSpacing: 0.5 }}>BET / LINE</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => setBetIndex((i) => Math.max(0, i - 1))}
                  disabled={spinning || betIndex === 0}
                  style={{
                    background: `${theme.accentColor}15`, border: `1px solid ${theme.accentColor}35`,
                    color: theme.accentColor, borderRadius: 6, width: 30, height: 30,
                    cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
                    opacity: betIndex === 0 ? 0.35 : 1,
                  }}
                >−</button>
                <div style={{
                  color: theme.accentColor, fontSize: 15, fontWeight: 800, minWidth: 60, textAlign: "center",
                  textShadow: `0 0 8px ${theme.accentColor}60`,
                }}>
                  {formatUGX(bet)}
                </div>
                <button
                  onClick={() => setBetIndex((i) => Math.min(BETS.length - 1, i + 1))}
                  disabled={spinning || betIndex === BETS.length - 1}
                  style={{
                    background: `${theme.accentColor}15`, border: `1px solid ${theme.accentColor}35`,
                    color: theme.accentColor, borderRadius: 6, width: 30, height: 30,
                    cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
                    opacity: betIndex === BETS.length - 1 ? 0.35 : 1,
                  }}
                >+</button>
              </div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, textAlign: "right" }}>
                25 LINES<br />
                <span style={{ color: theme.secondaryColor, fontWeight: 700, fontSize: 10 }}>{formatUGX(totalBet)}</span>
              </div>
            </div>

            {/* Spin row */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
              {/* Auto spin */}
              {autoSpin ? (
                <button
                  onClick={() => { setAutoSpin(false); setAutoSpinCount(0); }}
                  style={{
                    flex: 1, height: 42, background: "rgba(255,60,60,0.12)",
                    border: "1px solid rgba(255,60,60,0.4)", color: "#ff4444",
                    borderRadius: 12, fontWeight: 700, fontSize: 10, cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: 14 }}>⏹</span>
                  <span style={{ fontSize: 9, marginTop: 1 }}>STOP ({autoSpinCount})</span>
                </button>
              ) : (
                <button
                  onClick={() => { setAutoSpin(true); setAutoSpinCount(10); }}
                  disabled={spinning || balance < totalBet}
                  style={{
                    flex: 1, height: 42, background: `${theme.accentColor}10`,
                    border: `1px solid ${theme.accentColor}30`, color: theme.accentColor,
                    borderRadius: 12, fontWeight: 700, fontSize: 10, cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    opacity: balance < totalBet ? 0.35 : 1,
                  }}
                >
                  <span style={{ fontSize: 14 }}>🔄</span>
                  <span style={{ fontSize: 9, marginTop: 1 }}>AUTO×10</span>
                </button>
              )}

              {/* SPIN button */}
              <SpinButton
                spinning={spinning}
                disabled={spinning || (balance < totalBet && freeSpins === 0)}
                isFree={freeSpins > 0}
                accentColor={freeSpins > 0 ? "#CE93D8" : theme.accentColor}
                secondaryColor={freeSpins > 0 ? "#9C27B0" : theme.secondaryColor}
                onClick={doSpin}
              />

              {/* Max bet */}
              <button
                onClick={() => setBetIndex(BETS.length - 1)}
                disabled={spinning}
                style={{
                  flex: 1, height: 42, background: `${theme.secondaryColor}10`,
                  border: `1px solid ${theme.secondaryColor}30`, color: theme.secondaryColor,
                  borderRadius: 12, fontWeight: 700, fontSize: 10, cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                }}
              >
                <Star size={14} />
                <span style={{ fontSize: 9, marginTop: 1 }}>MAX BET</span>
              </button>
            </div>
          </div>
        </div>

        {/* Paytable strip */}
        <div style={{
          padding: "8px 10px 14px",
          background: "rgba(0,0,0,0.55)", borderTop: `1px solid ${theme.accentColor}15`,
        }}>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
            {Object.entries(PAYTABLE)
              .filter(([sym]) => theme.symbols[sym])
              .map(([sym, pays]) => {
                const def = theme.symbols[sym];
                if (!def) return null;
                return (
                  <div key={sym} style={{
                    flexShrink: 0, background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${theme.accentColor}15`,
                    borderRadius: 8, padding: "5px 8px", textAlign: "center", minWidth: 60,
                  }}>
                    <div style={{ width: 28, height: 28, margin: "0 auto 3px" }}>
                      {getSymbolSVG(sym, theme.themeId, 28)}
                    </div>
                    <div style={{ color: theme.accentColor, fontSize: 8, fontWeight: 700 }}>3✕ {pays[3]}x</div>
                    <div style={{ color: theme.secondaryColor, fontSize: 8, fontWeight: 700 }}>5✕ {pays[5]}x</div>
                  </div>
                );
              })}
          </div>
          <div style={{
            display: "flex", gap: 12, marginTop: 6, justifyContent: "center",
            color: "rgba(255,255,255,0.28)", fontSize: 8,
          }}>
            <span>🃏 WILD = any</span>
            <span>💠 3+ SCATTER = Free Spins</span>
            <span>🎯 25 Paylines</span>
            <span>96% RTP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
