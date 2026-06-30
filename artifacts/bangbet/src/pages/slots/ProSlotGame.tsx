import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Info, X, Loader } from "lucide-react";
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";

/* ─────────────────────────────── TYPES ──────────────────────────────── */
export interface SlotTheme {
  id: string;
  name: string;
  tagline: string;
  bg: string;
  accent: string;
  accentAlt: string;
  reelBg: string;
  symbols: SymbolDef[];
}

interface SymbolDef {
  key: string;
  label: string;
  display: string;          // emoji or text
  color: string;
  bgGrad: string;
  payout3: number;          // multiplier × bet
  payout4: number;
  payout5: number;
  isWild?: boolean;
  isScatter?: boolean;
}

interface WinResult {
  line: number;
  symbol: string;
  count: number;
  cells: [number, number][];  // [reel, row]
  payout: number;
}

type Grid = string[][];      // [reel 0-4][row 0-2]

/* ─────────────────────────────── CONSTANTS ──────────────────────────── */
const ROWS = 3;
const REELS = 5;
const BETS = [100, 500, 1_000, 2_000, 5_000, 10_000, 25_000, 50_000];
const FREE_SPIN_SCATTERS = 3;
const FREE_SPINS_AWARD = 10;

// 10 paylines on a 5×3 grid  (reel→row per position)
const PAYLINES: [number, number][][] = [
  [[0,1],[1,1],[2,1],[3,1],[4,1]],   // 1 middle row
  [[0,0],[1,0],[2,0],[3,0],[4,0]],   // 2 top row
  [[0,2],[1,2],[2,2],[3,2],[4,2]],   // 3 bottom row
  [[0,0],[1,1],[2,2],[3,1],[4,0]],   // 4 V-top
  [[0,2],[1,1],[2,0],[3,1],[4,2]],   // 5 V-bottom
  [[0,0],[1,0],[2,1],[3,2],[4,2]],   // 6 diagonal down
  [[0,2],[1,2],[2,1],[3,0],[4,0]],   // 7 diagonal up
  [[0,1],[1,0],[2,0],[3,0],[4,1]],   // 8 arch top
  [[0,1],[1,2],[2,2],[3,2],[4,1]],   // 9 arch bottom
  [[0,0],[1,1],[2,0],[3,1],[4,0]],   // 10 zigzag
];

/* ─────────────────────────────── THEMES ─────────────────────────────── */
export const SLOT_THEMES: SlotTheme[] = [
  {
    id: "lucky7",
    name: "Lucky Sevens",
    tagline: "Classic Fruit Machine",
    bg: "linear-gradient(160deg, #0d0500 0%, #1a0d00 60%, #0a0300 100%)",
    accent: "#FFD700",
    accentAlt: "#FF6B00",
    reelBg: "rgba(30,15,0,0.85)",
    symbols: [
      { key:"cherry",  label:"Cherry",  display:"🍒", color:"#FF4444", bgGrad:"linear-gradient(135deg,#3d0000,#1a0000)", payout3:2,  payout4:5,   payout5:12  },
      { key:"lemon",   label:"Lemon",   display:"🍋", color:"#FFD700", bgGrad:"linear-gradient(135deg,#3d3200,#1a1500)", payout3:3,  payout4:8,   payout5:20  },
      { key:"orange",  label:"Orange",  display:"🍊", color:"#FF6B00", bgGrad:"linear-gradient(135deg,#3d1800,#1a0a00)", payout3:5,  payout4:12,  payout5:30  },
      { key:"grape",   label:"Grape",   display:"🍇", color:"#CE93D8", bgGrad:"linear-gradient(135deg,#1a003d,#0d001a)", payout3:8,  payout4:20,  payout5:60  },
      { key:"bell",    label:"Bell",    display:"🔔", color:"#FFC107", bgGrad:"linear-gradient(135deg,#3d2d00,#1a1300)", payout3:15, payout4:40,  payout5:120 },
      { key:"star",    label:"Star",    display:"⭐", color:"#FFD700", bgGrad:"linear-gradient(135deg,#3d3000,#1a1500)", payout3:25, payout4:80,  payout5:250 },
      { key:"seven",   label:"SEVEN",   display:"7",  color:"#FF1744", bgGrad:"linear-gradient(135deg,#3d0010,#1a0005)", payout3:50, payout4:200, payout5:777 },
      { key:"wild",    label:"WILD",    display:"W",  color:"#E040FB", bgGrad:"linear-gradient(135deg,#2d003d,#12001a)", payout3:0,  payout4:0,   payout5:0,   isWild:true   },
      { key:"scatter", label:"BONUS",   display:"💰", color:"#FFD700", bgGrad:"linear-gradient(135deg,#3d3000,#1a1500)", payout3:10, payout4:25,  payout5:100, isScatter:true},
    ],
  },
  {
    id: "egypt",
    name: "Egyptian Gold",
    tagline: "Pharaoh's Secret Fortune",
    bg: "linear-gradient(160deg, #0d0800 0%, #1a1000 60%, #080500 100%)",
    accent: "#FFB300",
    accentAlt: "#FF8F00",
    reelBg: "rgba(20,12,0,0.88)",
    symbols: [
      { key:"scarab",  label:"Scarab",  display:"🪲", color:"#66BB6A", bgGrad:"linear-gradient(135deg,#003d00,#001a00)", payout3:2,  payout4:5,   payout5:12  },
      { key:"eye",     label:"Eye",     display:"👁", color:"#29B6F6", bgGrad:"linear-gradient(135deg,#003d5a,#001a2d)", payout3:3,  payout4:8,   payout5:20  },
      { key:"cat",     label:"Cat",     display:"🐱", color:"#FFA726", bgGrad:"linear-gradient(135deg,#3d2000,#1a0e00)", payout3:5,  payout4:12,  payout5:30  },
      { key:"ankh",    label:"Ankh",    display:"☥", color:"#FFD700", bgGrad:"linear-gradient(135deg,#3d3000,#1a1500)", payout3:8,  payout4:20,  payout5:60  },
      { key:"pyramid", label:"Pyramid", display:"🔺", color:"#FF8F00", bgGrad:"linear-gradient(135deg,#3d2000,#1a0e00)", payout3:15, payout4:40,  payout5:120 },
      { key:"pharaoh", label:"Pharaoh", display:"👑", color:"#FFD700", bgGrad:"linear-gradient(135deg,#3d3000,#1a1500)", payout3:25, payout4:80,  payout5:250 },
      { key:"godra",   label:"Ra",      display:"☀", color:"#FF6D00", bgGrad:"linear-gradient(135deg,#3d1800,#1a0a00)", payout3:50, payout4:200, payout5:777 },
      { key:"wild",    label:"WILD",    display:"W",  color:"#FFD700", bgGrad:"linear-gradient(135deg,#3d3000,#1a1500)", payout3:0,  payout4:0,   payout5:0,   isWild:true   },
      { key:"scatter", label:"BONUS",   display:"🏺", color:"#FFB300", bgGrad:"linear-gradient(135deg,#3d2d00,#1a1300)", payout3:10, payout4:25,  payout5:100, isScatter:true},
    ],
  },
  {
    id: "safari",
    name: "Wild Safari",
    tagline: "African Riches Await",
    bg: "linear-gradient(160deg, #0d0800 0%, #1c1000 60%, #080500 100%)",
    accent: "#FF8F00",
    accentAlt: "#FFD54F",
    reelBg: "rgba(25,14,0,0.88)",
    symbols: [
      { key:"zebra",   label:"Zebra",   display:"🦓", color:"#9E9E9E", bgGrad:"linear-gradient(135deg,#1a1a1a,#0d0d0d)", payout3:2,  payout4:5,   payout5:12  },
      { key:"giraffe", label:"Giraffe", display:"🦒", color:"#FF8F00", bgGrad:"linear-gradient(135deg,#3d2000,#1a0e00)", payout3:3,  payout4:8,   payout5:20  },
      { key:"hippo",   label:"Hippo",   display:"🦛", color:"#78909C", bgGrad:"linear-gradient(135deg,#1a2030,#0d1018)", payout3:5,  payout4:12,  payout5:30  },
      { key:"elephant",label:"Elephant",display:"🐘", color:"#B0BEC5", bgGrad:"linear-gradient(135deg,#1a2028,#0d1014)", payout3:8,  payout4:20,  payout5:60  },
      { key:"rhino",   label:"Rhino",   display:"🦏", color:"#8D6E63", bgGrad:"linear-gradient(135deg,#1a1008,#0d0804)", payout3:15, payout4:40,  payout5:120 },
      { key:"lion",    label:"Lion",    display:"🦁", color:"#FFB300", bgGrad:"linear-gradient(135deg,#3d2800,#1a1200)", payout3:25, payout4:80,  payout5:250 },
      { key:"cheetah", label:"Cheetah", display:"🐆", color:"#FF8F00", bgGrad:"linear-gradient(135deg,#3d2000,#1a0e00)", payout3:50, payout4:200, payout5:777 },
      { key:"wild",    label:"WILD",    display:"W",  color:"#FF8F00", bgGrad:"linear-gradient(135deg,#3d2000,#1a0e00)", payout3:0,  payout4:0,   payout5:0,   isWild:true   },
      { key:"scatter", label:"BONUS",   display:"🌅", color:"#FFD54F", bgGrad:"linear-gradient(135deg,#3d3000,#1a1500)", payout3:10, payout4:25,  payout5:100, isScatter:true},
    ],
  },
  {
    id: "dragon",
    name: "Dragon Riches",
    tagline: "Legendary Fortune of the East",
    bg: "linear-gradient(160deg, #0d0000 0%, #1a0000 60%, #080000 100%)",
    accent: "#FF1744",
    accentAlt: "#FF6D00",
    reelBg: "rgba(25,0,0,0.88)",
    symbols: [
      { key:"blossom", label:"Blossom", display:"🌸", color:"#F48FB1", bgGrad:"linear-gradient(135deg,#3d001a,#1a000d)", payout3:2,  payout4:5,   payout5:12  },
      { key:"lantern", label:"Lantern", display:"🏮", color:"#FF1744", bgGrad:"linear-gradient(135deg,#3d0000,#1a0000)", payout3:3,  payout4:8,   payout5:20  },
      { key:"coin",    label:"Coin",    display:"🪙", color:"#FFD700", bgGrad:"linear-gradient(135deg,#3d3000,#1a1500)", payout3:5,  payout4:12,  payout5:30  },
      { key:"tiger",   label:"Tiger",   display:"🐯", color:"#FF6D00", bgGrad:"linear-gradient(135deg,#3d1800,#1a0a00)", payout3:8,  payout4:20,  payout5:60  },
      { key:"jade",    label:"Jade",    display:"💚", color:"#66BB6A", bgGrad:"linear-gradient(135deg,#003d00,#001a00)", payout3:15, payout4:40,  payout5:120 },
      { key:"phoenix", label:"Phoenix", display:"🦅", color:"#FF8F00", bgGrad:"linear-gradient(135deg,#3d2000,#1a0e00)", payout3:25, payout4:80,  payout5:250 },
      { key:"dragon",  label:"Dragon",  display:"🐉", color:"#FF1744", bgGrad:"linear-gradient(135deg,#3d0000,#1a0000)", payout3:50, payout4:200, payout5:777 },
      { key:"wild",    label:"WILD",    display:"W",  color:"#FF1744", bgGrad:"linear-gradient(135deg,#3d0000,#1a0000)", payout3:0,  payout4:0,   payout5:0,   isWild:true   },
      { key:"scatter", label:"BONUS",   display:"🎋", color:"#66BB6A", bgGrad:"linear-gradient(135deg,#003d00,#001a00)", payout3:10, payout4:25,  payout5:100, isScatter:true},
    ],
  },
  {
    id: "gems",
    name: "Crystal Mines",
    tagline: "Unearth Gemstone Riches",
    bg: "linear-gradient(160deg, #00050d 0%, #000d1a 60%, #000508 100%)",
    accent: "#00E5FF",
    accentAlt: "#7C4DFF",
    reelBg: "rgba(0,8,20,0.88)",
    symbols: [
      { key:"amethyst",label:"Amethyst",display:"🔮", color:"#CE93D8", bgGrad:"linear-gradient(135deg,#1a003d,#0d001a)", payout3:2,  payout4:5,   payout5:12  },
      { key:"ruby",    label:"Ruby",    display:"♦",  color:"#FF1744", bgGrad:"linear-gradient(135deg,#3d0000,#1a0000)", payout3:3,  payout4:8,   payout5:20  },
      { key:"emerald", label:"Emerald", display:"💚", color:"#66BB6A", bgGrad:"linear-gradient(135deg,#003d00,#001a00)", payout3:5,  payout4:12,  payout5:30  },
      { key:"topaz",   label:"Topaz",   display:"🟡", color:"#FFD700", bgGrad:"linear-gradient(135deg,#3d3000,#1a1500)", payout3:8,  payout4:20,  payout5:60  },
      { key:"sapphire",label:"Sapphire",display:"💙", color:"#29B6F6", bgGrad:"linear-gradient(135deg,#003d5a,#001a2d)", payout3:15, payout4:40,  payout5:120 },
      { key:"crystal", label:"Crystal", display:"🔷", color:"#00E5FF", bgGrad:"linear-gradient(135deg,#00302d,#001814)", payout3:25, payout4:80,  payout5:250 },
      { key:"diamond", label:"Diamond", display:"💎", color:"#E0F7FA", bgGrad:"linear-gradient(135deg,#003040,#001820)", payout3:50, payout4:200, payout5:777 },
      { key:"wild",    label:"WILD",    display:"W",  color:"#00E5FF", bgGrad:"linear-gradient(135deg,#003040,#001820)", payout3:0,  payout4:0,   payout5:0,   isWild:true   },
      { key:"scatter", label:"BONUS",   display:"⚡", color:"#7C4DFF", bgGrad:"linear-gradient(135deg,#12003d,#08001a)", payout3:10, payout4:25,  payout5:100, isScatter:true},
    ],
  },
];

/* ─────────────────────────────── GAME MATH ──────────────────────────── */
function buildReelStrip(symbols: SymbolDef[]): string[] {
  const strip: string[] = [];
  symbols.forEach((sym, i) => {
    // Higher index = rarer: index 0 appears most, index 6 least
    const count = sym.isWild ? 2 : sym.isScatter ? 3 : Math.max(1, 10 - i * 1.2 | 0);
    for (let j = 0; j < count; j++) strip.push(sym.key);
  });
  // Shuffle
  for (let i = strip.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [strip[i], strip[j]] = [strip[j], strip[i]];
  }
  return strip;
}

function spinGrid(theme: SlotTheme): Grid {
  const grid: Grid = [];
  for (let r = 0; r < REELS; r++) {
    const strip = buildReelStrip(theme.symbols);
    const start = Math.floor(Math.random() * (strip.length - ROWS));
    grid.push([strip[start], strip[start + 1], strip[start + 2]]);
  }
  return grid;
}

function evaluateWins(grid: Grid, bet: number, theme: SlotTheme): WinResult[] {
  const symMap = Object.fromEntries(theme.symbols.map(s => [s.key, s]));
  const wildKey = theme.symbols.find(s => s.isWild)?.key ?? "__none__";
  const scatterKey = theme.symbols.find(s => s.isScatter)?.key ?? "__none__";
  const results: WinResult[] = [];

  // Check scatter first (anywhere on grid)
  const scatterCells: [number, number][] = [];
  for (let r = 0; r < REELS; r++)
    for (let row = 0; row < ROWS; row++)
      if (grid[r][row] === scatterKey) scatterCells.push([r, row]);

  if (scatterCells.length >= 3) {
    const sym = symMap[scatterKey];
    const payout = scatterCells.length === 5 ? sym.payout5
      : scatterCells.length === 4 ? sym.payout4
      : sym.payout3;
    results.push({ line: 0, symbol: scatterKey, count: scatterCells.length, cells: scatterCells, payout: payout * bet });
  }

  // Check each payline
  PAYLINES.forEach((line, lineIdx) => {
    const cells = line as [number, number][];
    const syms = cells.map(([r, row]) => grid[r][row]);

    // Find the first non-wild symbol
    const base = syms.find(s => s !== wildKey && s !== scatterKey) ?? wildKey;
    if (base === wildKey) {
      // All wilds — pay as if highest non-scatter symbol
      const highest = theme.symbols.filter(s => !s.isWild && !s.isScatter).at(-1)!;
      const count = 5;
      const payout = highest.payout5;
      results.push({ line: lineIdx + 1, symbol: highest.key, count, cells, payout: payout * bet });
      return;
    }
    if (base === scatterKey) return;  // scatter handled separately

    // Count matching from left
    let count = 0;
    for (const s of syms) {
      if (s === base || s === wildKey) count++;
      else break;
    }
    if (count < 3) return;

    const sym = symMap[base];
    const payout = count === 5 ? sym.payout5 : count === 4 ? sym.payout4 : sym.payout3;
    if (!payout) return;

    results.push({
      line: lineIdx + 1,
      symbol: base,
      count,
      cells: cells.slice(0, count),
      payout: payout * bet,
    });
  });

  // Deduplicate — same cells contributing to multiple wins just count the best
  return results;
}

function randomGrid(theme: SlotTheme): Grid {
  return Array.from({ length: REELS }, () => {
    const syms = theme.symbols.map(s => s.key);
    return Array.from({ length: ROWS }, () => syms[Math.floor(Math.random() * syms.length)]);
  });
}

/* ─────────────────────────────── SYMBOL CELL ────────────────────────── */
function SymbolCell({
  symbol, theme, highlighted, spinning, size = 68,
}: {
  symbol: string; theme: SlotTheme; highlighted: boolean; spinning: boolean; size?: number;
}) {
  const sym = theme.symbols.find(s => s.key === symbol);
  if (!sym) return <div style={{ width: size, height: size }} />;

  const isSpecial = sym.isWild || sym.isScatter;
  const fontSize = sym.display.length === 1 && !sym.display.match(/\p{Emoji}/u) ? size * 0.48 : size * 0.44;

  return (
    <div style={{
      width: size, height: size,
      borderRadius: 10,
      background: highlighted ? sym.bgGrad.replace("135deg,", "135deg,").replace("1a", "2a") : sym.bgGrad,
      border: `2px solid ${highlighted ? sym.color : "rgba(255,255,255,0.07)"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden", flexShrink: 0,
      boxShadow: highlighted
        ? `0 0 22px ${sym.color}80, 0 0 44px ${sym.color}30, inset 0 0 14px ${sym.color}15`
        : "0 2px 8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
      transition: "box-shadow 0.2s ease, border-color 0.2s ease",
      filter: spinning ? "blur(3px) brightness(1.3)" : "none",
      transform: spinning ? "scaleY(0.93)" : "scaleY(1)",
    }}>
      {highlighted && (
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(circle at center, ${sym.color}20, transparent 70%)`,
          animation: "symGlow 0.5s ease-in-out infinite alternate",
          borderRadius: 8,
        }} />
      )}
      {/* Top shine */}
      <div style={{
        position: "absolute", top: 3, left: 6, right: 6, height: size * 0.28,
        borderRadius: "50%", background: "rgba(255,255,255,0.12)", pointerEvents: "none",
      }} />
      <span style={{
        fontSize, lineHeight: 1, userSelect: "none", position: "relative",
        color: sym.isWild || (!sym.display.match(/\p{Emoji}/u)) ? sym.color : undefined,
        fontWeight: isSpecial || !sym.display.match(/\p{Emoji}/u) ? 900 : undefined,
        fontFamily: "Oswald, Arial, sans-serif",
        textShadow: isSpecial ? `0 0 12px ${sym.color}` : undefined,
        letterSpacing: -1,
      }}>
        {sym.display}
      </span>
      {isSpecial && (
        <div style={{
          position: "absolute", bottom: 2,
          fontSize: 8, fontWeight: 800, color: sym.color,
          fontFamily: "Oswald, sans-serif", letterSpacing: 0.5,
        }}>{sym.label}</div>
      )}
    </div>
  );
}

/* ─────────────────────────────── PAYTABLE MODAL ─────────────────────── */
function PaytableModal({ theme, bet, onClose }: { theme: SlotTheme; bet: number; onClose: () => void }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: "#111", border: `1px solid ${theme.accent}30`,
        borderRadius: 18, padding: 18, maxWidth: 380, width: "100%",
        maxHeight: "80vh", overflowY: "auto",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ color: theme.accent, fontSize: 15, fontWeight: 800, fontFamily: "Oswald, sans-serif" }}>
            PAYTABLE — {theme.name}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {theme.symbols.filter(s => !s.isWild && !s.isScatter).map(sym => (
            <div key={sym.key} style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "7px 10px",
            }}>
              <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{sym.display}</span>
              <div style={{ flex: 1, fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
                {sym.label}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {[sym.payout3, sym.payout4, sym.payout5].map((p, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div style={{ color: sym.color, fontSize: 10, fontWeight: 700 }}>{(p * bet).toLocaleString()}</div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 8 }}>{i + 3}×</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div style={{ marginTop: 8, padding: "8px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 8 }}>
            <div style={{ color: theme.accent, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>SPECIAL SYMBOLS</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, lineHeight: 1.6 }}>
              🃏 <strong>WILD</strong> — substitutes for any symbol except BONUS<br />
              {theme.symbols.find(s => s.isScatter)?.display} <strong>BONUS</strong> — 3+ anywhere pays {theme.symbols.find(s => s.isScatter)?.payout3}× bet + {FREE_SPINS_AWARD} FREE SPINS
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────── MAIN COMPONENT ─────────────────────── */
interface ProSlotGameProps {
  theme: SlotTheme;
  onBack: () => void;
}

export default function ProSlotGame({ theme, onBack }: ProSlotGameProps) {
  const { user } = useAuth();
  const [betIdx, setBetIdx] = useState(2);                   // UGX 1,000 default
  const [freeSpins, setFreeSpins] = useState(0);
  const [grid, setGrid] = useState<Grid>(() => randomGrid(theme));
  const [spinning, setSpinning] = useState(false);
  const [reelSpinning, setReelSpinning] = useState([false, false, false, false, false]);
  const [wins, setWins] = useState<WinResult[]>([]);
  const [totalWin, setTotalWin] = useState(0);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerText, setBannerText] = useState("");
  const [showPaytable, setShowPaytable] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);
  const [autoCount, setAutoCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [freeSpinMsg, setFreeSpinMsg] = useState("");

  const autoRef = useRef(false);
  const intervalRefs = useRef<ReturnType<typeof setInterval>[]>([]);

  const bet = BETS[betIdx];
  const balance = (user?.balance ?? 0) + (user?.bonus ?? 0);

  const allSymbolKeys = theme.symbols.map(s => s.key);
  const highlightedCells = new Set<string>();
  for (const w of wins) for (const [r, row] of w.cells) highlightedCells.add(`${r}-${row}`);

  const doSpin = useCallback(async () => {
    if (spinning || placing) return;
    const isFree = freeSpins > 0;

    if (!isFree) {
      if (!user) { setError("Please log in to play."); return; }
      if ((user.balance) < bet) { setError("Insufficient balance. Please deposit funds."); return; }
    }

    setError(null);
    setPlacing(true);

    try {
      if (!isFree && user) {
        await updateDoc(doc(db, "users", user.uid), {
          balance: increment(-bet),
        });
      }
      if (isFree) setFreeSpins(f => f - 1);
    } catch {
      setError("Could not process bet. Check your connection.");
      setPlacing(false);
      return;
    }

    setPlacing(false);
    setSpinning(true);
    setWins([]);
    setTotalWin(0);
    setShowBanner(false);
    setFreeSpinMsg("");
    setReelSpinning([true, true, true, true, true]);

    // Pre-calculate result
    const result = spinGrid(theme);

    // Clear previous intervals
    for (const iv of intervalRefs.current) clearInterval(iv);
    intervalRefs.current = [];

    // Spin each reel — animate random symbols, stop staggered
    for (let r = 0; r < REELS; r++) {
      const iv = setInterval(() => {
        setGrid(prev => {
          const next = prev.map(col => [...col]) as Grid;
          next[r] = Array.from({ length: ROWS }, () =>
            allSymbolKeys[Math.floor(Math.random() * allSymbolKeys.length)]
          );
          return next;
        });
      }, 60);
      intervalRefs.current.push(iv);

      const stopDelay = 700 + r * 380;
      setTimeout(() => {
        clearInterval(intervalRefs.current[r]);
        setGrid(prev => {
          const next = prev.map(col => [...col]) as Grid;
          next[r] = result[r];
          return next;
        });
        setReelSpinning(prev => { const n = [...prev]; n[r] = false; return n; });

        if (r === REELS - 1) {
          // All reels stopped
          const wins = evaluateWins(result, bet, theme);
          const totalWin = wins.reduce((s, w) => s + w.payout, 0);
          setWins(wins);
          setTotalWin(totalWin);
          setSpinning(false);

          if (totalWin > 0 && user) {
            updateDoc(doc(db, "users", user.uid), {
              balance: increment(totalWin),
              winnings: increment(totalWin),
            }).catch(console.error);

            // Log win transaction
            addDoc(collection(db, "transactions"), {
              userId: user.uid,
              type: "win",
              amount: totalWin,
              description: `${theme.name} slot win`,
              status: "completed",
              createdAt: serverTimestamp(),
            }).catch(console.error);

            const ratio = totalWin / bet;
            let banner = `🎉 WIN!`;
            if (ratio >= 500) banner = "🔥🔥🔥 LEGENDARY WIN!!! 🔥🔥🔥";
            else if (ratio >= 100) banner = "💎💎 MEGA WIN!! 💎💎";
            else if (ratio >= 30) banner = "💰 BIG WIN! 💰";
            else if (ratio >= 10) banner = "⭐ SUPER WIN! ⭐";
            setBannerText(banner);
            setShowBanner(true);
            setTimeout(() => setShowBanner(false), 3500);
          }

          // Free spins?
          const scatterWin = wins.find(w => w.symbol === theme.symbols.find(s => s.isScatter)?.key);
          if (scatterWin && scatterWin.count >= FREE_SPIN_SCATTERS) {
            setFreeSpins(f => f + FREE_SPINS_AWARD);
            setFreeSpinMsg(`🎁 ${FREE_SPINS_AWARD} FREE SPINS UNLOCKED!`);
            setTimeout(() => setFreeSpinMsg(""), 5000);
          }
        }
      }, stopDelay);
    }
  }, [spinning, placing, freeSpins, user, bet, theme, allSymbolKeys]);

  useEffect(() => { autoRef.current = autoSpin; }, [autoSpin]);

  useEffect(() => {
    if (!spinning && autoSpin && autoCount > 0) {
      const t = setTimeout(() => {
        if (autoRef.current) { setAutoCount(c => c - 1); doSpin(); }
      }, 600);
      return () => clearTimeout(t);
    }
    if (autoCount === 0 && autoSpin) setAutoSpin(false);
    return undefined;
  }, [spinning, autoSpin, autoCount, doSpin]);

  const isFree = freeSpins > 0;
  const canSpin = !spinning && !placing && (isFree || ((user?.balance ?? 0) >= bet));

  return (
    <div style={{
      minHeight: "100vh", background: theme.bg, position: "relative",
      display: "flex", flexDirection: "column", fontFamily: "Oswald, Arial, sans-serif",
      userSelect: "none",
    }}>
      <style>{`
        @keyframes symGlow { 0%{opacity:0.6} 100%{opacity:1} }
        @keyframes winPop  { 0%{transform:scale(0.4);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes winPulse{ 0%,100%{opacity:0.8} 50%{opacity:1} }
        @keyframes freeBadge{0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        @keyframes ringSpin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes ringSpinR{ 0%{transform:rotate(360deg)} 100%{transform:rotate(0deg)} }
        @keyframes btnPulse { 0%,100%{box-shadow:0 0 24px ${theme.accent},0 4px 16px rgba(0,0,0,0.5)} 50%{box-shadow:0 0 40px ${theme.accent},0 0 80px ${theme.accent}50,0 4px 20px rgba(0,0,0,0.6)} }
        @keyframes coinRain { 0%{transform:translateY(-20px);opacity:0} 20%{opacity:1} 100%{transform:translateY(60px);opacity:0} }
        @keyframes msgSlide { 0%{transform:translateY(-12px);opacity:0} 100%{transform:translateY(0);opacity:1} }
      `}</style>

      {/* Overlay for depth */}
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.68)", pointerEvents:"none" }} />

      <div style={{ position:"relative", zIndex:1, display:"flex", flexDirection:"column", flex:1 }}>
        {/* ── HEADER ── */}
        <div style={{
          display:"flex", alignItems:"center", padding:"10px 14px",
          borderBottom:`1px solid ${theme.accent}25`,
          background:"rgba(0,0,0,0.55)", backdropFilter:"blur(12px)",
          gap: 10,
        }}>
          <button onClick={onBack} style={{
            background:`rgba(255,255,255,0.07)`, border:`1px solid ${theme.accent}35`,
            color:theme.accent, borderRadius:8, padding:"7px 12px",
            cursor:"pointer", display:"flex", alignItems:"center", gap:5,
            fontSize:12, fontWeight:700,
          }}>
            <ChevronLeft size={15} /> BACK
          </button>

          <div style={{ flex:1, textAlign:"center" }}>
            <div style={{ color:theme.accent, fontSize:15, fontWeight:700, letterSpacing:1.5,
              textShadow:`0 0 16px ${theme.accent}80` }}>
              {theme.name.toUpperCase()}
            </div>
            <div style={{ color:"rgba(255,255,255,0.4)", fontSize:9, letterSpacing:0.5 }}>
              {theme.tagline}
            </div>
          </div>

          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <button onClick={() => setShowPaytable(true)} style={{
              background:"rgba(255,255,255,0.07)", border:`1px solid rgba(255,255,255,0.15)`,
              color:"rgba(255,255,255,0.5)", borderRadius:8, padding:"7px 10px",
              cursor:"pointer", display:"flex", alignItems:"center",
            }}>
              <Info size={14} />
            </button>
            <div style={{ textAlign:"right" }}>
              <div style={{ color:"rgba(255,255,255,0.35)", fontSize:9 }}>BALANCE</div>
              <div style={{ color:"#fff", fontSize:13, fontWeight:800 }}>
                {balance >= 1000 ? `${(balance/1000).toFixed(1)}K` : balance.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* ── STATUS BAR ── */}
        <div style={{
          display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"5px 14px", background:"rgba(0,0,0,0.4)", fontSize:11,
          flexWrap:"wrap", gap:4,
        }}>
          <div style={{ color:"rgba(255,255,255,0.5)" }}>
            BAL: <span style={{ color:"#fff", fontWeight:700 }}>UGX {balance.toLocaleString()}</span>
          </div>
          {isFree ? (
            <div style={{
              background:`linear-gradient(135deg,${theme.accent},${theme.accentAlt})`,
              color:"#000", padding:"3px 12px", borderRadius:20, fontWeight:800, fontSize:11,
              animation:"freeBadge 1s ease infinite",
              boxShadow:`0 0 12px ${theme.accent}80`,
            }}>
              ✨ {freeSpins} FREE SPINS REMAINING
            </div>
          ) : (
            <div style={{ color:"rgba(255,255,255,0.35)", fontSize:10 }}>
              10 PAYLINES · {theme.symbols.length - 2} SYMBOLS
            </div>
          )}
          <div style={{ color:"rgba(255,255,255,0.5)" }}>
            BET: <span style={{ color:theme.accent, fontWeight:700 }}>UGX {bet.toLocaleString()}</span>
          </div>
        </div>

        {/* Free spin announcement */}
        {freeSpinMsg && (
          <div style={{
            textAlign:"center", padding:"9px 14px",
            background:`linear-gradient(90deg,transparent,${theme.accent}25,transparent)`,
            color:theme.accent, fontWeight:800, fontSize:14,
            animation:"msgSlide 0.4s ease",
            borderBottom:`1px solid ${theme.accent}25`,
          }}>{freeSpinMsg}</div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background:"rgba(255,30,30,0.12)", border:"1px solid rgba(255,30,30,0.3)",
            color:"#FF5252", padding:"8px 14px", fontSize:11, textAlign:"center",
          }}>{error}</div>
        )}

        {/* ── REEL AREA ── */}
        <div style={{
          flex:1, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", padding:"12px 10px",
          gap:10,
        }}>
          {/* Reel machine cabinet */}
          <div style={{
            background:theme.reelBg, border:`2px solid ${theme.accent}45`,
            borderRadius:20, padding:"12px 10px",
            boxShadow:`0 0 50px ${theme.accent}18, 0 0 100px ${theme.accent}08, inset 0 0 40px rgba(0,0,0,0.7)`,
            position:"relative",
          }}>
            {/* Top glow strip */}
            <div style={{
              position:"absolute", top:-1, left:"8%", right:"8%", height:2,
              background:`linear-gradient(90deg,transparent,${theme.accent},transparent)`,
            }} />
            {/* Bottom glow strip */}
            <div style={{
              position:"absolute", bottom:-1, left:"8%", right:"8%", height:2,
              background:`linear-gradient(90deg,transparent,${theme.accent},transparent)`,
            }} />
            {/* Payline markers */}
            <div style={{ position:"absolute", left:-8, top:"50%", transform:"translateY(-50%)",
              width:6, height:6, borderRadius:3, background:theme.accent,
              boxShadow:`0 0 6px ${theme.accent}` }} />
            <div style={{ position:"absolute", right:-8, top:"50%", transform:"translateY(-50%)",
              width:6, height:6, borderRadius:3, background:theme.accent,
              boxShadow:`0 0 6px ${theme.accent}` }} />

            {/* 5×3 Grid */}
            <div style={{ display:"flex", gap:5 }}>
              {Array.from({ length: REELS }, (_, reel) => (
                <div key={reel} style={{
                  display:"flex", flexDirection:"column", gap:5, padding:"2px",
                  borderRadius:8,
                  background:reelSpinning[reel] ? "rgba(255,255,255,0.03)" : "transparent",
                  transition:"background 0.3s",
                }}>
                  {Array.from({ length: ROWS }, (_, row) => (
                    <SymbolCell
                      key={row}
                      symbol={grid[reel]?.[row] ?? theme.symbols[0].key}
                      theme={theme}
                      highlighted={!spinning && highlightedCells.has(`${reel}-${row}`)}
                      spinning={reelSpinning[reel]}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Win banner */}
          <div style={{ minHeight:48, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center" }}>
            {showBanner && (
              <div style={{
                color:theme.accent, fontSize:22, fontWeight:900, letterSpacing:2,
                animation:"winPop 0.4s ease",
                textShadow:`0 0 24px ${theme.accent},0 0 48px ${theme.accent}60`,
                textAlign:"center",
              }}>
                {bannerText}
                <div style={{ fontSize:14, color:"#fff", fontWeight:700, marginTop:3 }}>
                  UGX {totalWin.toLocaleString()}
                </div>
              </div>
            )}
            {!showBanner && totalWin > 0 && (
              <div style={{ color:"#FFD700", fontSize:12, fontWeight:700 }}>
                Last Win: UGX {totalWin.toLocaleString()} · {wins.length} line{wins.length !== 1 ? "s" : ""}
              </div>
            )}
            {placing && (
              <div style={{ display:"flex", alignItems:"center", gap:7, color:"rgba(255,255,255,0.5)", fontSize:11 }}>
                <Loader size={13} style={{ animation:"ringSpin 1s linear infinite" }} />
                Processing bet…
              </div>
            )}
          </div>

          {/* ── CONTROLS ── */}
          <div style={{
            width:"100%", maxWidth:380,
            background:"rgba(0,0,0,0.65)", backdropFilter:"blur(12px)",
            borderRadius:18, border:`1px solid ${theme.accent}20`,
            padding:"12px 14px 14px",
            boxShadow:"0 4px 24px rgba(0,0,0,0.5)",
          }}>
            {/* Bet selector */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <div style={{ color:"rgba(255,255,255,0.4)", fontSize:9, letterSpacing:0.5 }}>BET AMOUNT</div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <button
                  onClick={() => setBetIdx(i => Math.max(0, i - 1))}
                  disabled={spinning || betIdx === 0}
                  style={{
                    background:`${theme.accent}15`, border:`1px solid ${theme.accent}35`,
                    color:theme.accent, borderRadius:6, width:30, height:30,
                    cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center",
                    opacity:betIdx === 0 ? 0.3 : 1,
                  }}
                >
                  <ChevronLeft size={14} />
                </button>
                <div style={{
                  color:theme.accent, fontSize:15, fontWeight:800, minWidth:90, textAlign:"center",
                  textShadow:`0 0 8px ${theme.accent}60`,
                }}>
                  UGX {bet.toLocaleString()}
                </div>
                <button
                  onClick={() => setBetIdx(i => Math.min(BETS.length - 1, i + 1))}
                  disabled={spinning || betIdx === BETS.length - 1}
                  style={{
                    background:`${theme.accent}15`, border:`1px solid ${theme.accent}35`,
                    color:theme.accent, borderRadius:6, width:30, height:30,
                    cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center",
                    opacity:betIdx === BETS.length - 1 ? 0.3 : 1,
                  }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
              <div style={{ color:"rgba(255,255,255,0.3)", fontSize:9, textAlign:"right" }}>
                10 LINES
              </div>
            </div>

            {/* Spin row */}
            <div style={{ display:"flex", gap:10, alignItems:"center", justifyContent:"space-between" }}>
              {/* Auto-spin controls */}
              {autoSpin ? (
                <button
                  onClick={() => { setAutoSpin(false); setAutoCount(0); }}
                  style={{
                    flex:1, height:44, background:"rgba(255,60,60,0.1)",
                    border:"1px solid rgba(255,60,60,0.4)", color:"#ff4444",
                    borderRadius:12, fontWeight:700, fontSize:10, cursor:"pointer",
                    display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                  }}
                >
                  <span style={{ fontSize:16 }}>⏹</span>
                  <span style={{ fontSize:8, marginTop:1 }}>STOP ({autoCount})</span>
                </button>
              ) : (
                <button
                  onClick={() => { setAutoSpin(true); setAutoCount(10); }}
                  disabled={spinning || !canSpin}
                  style={{
                    flex:1, height:44, background:`${theme.accent}10`,
                    border:`1px solid ${theme.accent}30`, color:theme.accent,
                    borderRadius:12, fontWeight:700, fontSize:10, cursor:"pointer",
                    display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                    opacity:!canSpin ? 0.4 : 1,
                  }}
                >
                  <span style={{ fontSize:14 }}>🔁</span>
                  <span style={{ fontSize:8, marginTop:1 }}>AUTO ×10</span>
                </button>
              )}

              {/* Main SPIN button */}
              <div style={{ position:"relative", width:84, height:84, flexShrink:0,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                {/* Rotating rings */}
                <svg width={84} height={84} style={{
                  position:"absolute", inset:0,
                  animation: spinning ? "ringSpin 0.45s linear infinite" : "ringSpin 4s linear infinite",
                  opacity: canSpin ? 1 : 0.3,
                }}>
                  <circle cx={42} cy={42} r={40} fill="none" stroke={theme.accent}
                    strokeWidth={3} strokeDasharray="14 6" strokeLinecap="round" opacity={0.7} />
                </svg>
                <svg width={84} height={84} style={{
                  position:"absolute", inset:0,
                  animation: spinning ? "ringSpinR 0.7s linear infinite" : "ringSpinR 7s linear infinite",
                  opacity: canSpin ? 0.5 : 0.2,
                }}>
                  <circle cx={42} cy={42} r={35} fill="none" stroke={theme.accentAlt}
                    strokeWidth={2} strokeDasharray="7 10" strokeLinecap="round" />
                </svg>
                <button
                  onClick={doSpin}
                  disabled={!canSpin || placing}
                  style={{
                    width:68, height:68, borderRadius:"50%", border:"none",
                    background: isFree
                      ? "linear-gradient(135deg,#7B1FA2,#9C27B0,#6A1B9A)"
                      : `conic-gradient(from 0deg,${theme.accent},${theme.accentAlt},${theme.accent})`,
                    cursor: !canSpin || placing ? "not-allowed" : "pointer",
                    display:"flex", flexDirection:"column",
                    alignItems:"center", justifyContent:"center",
                    boxShadow: !canSpin
                      ? "none"
                      : spinning
                      ? `0 0 18px ${theme.accent}60`
                      : undefined,
                    transition:"box-shadow 0.3s, transform 0.1s",
                    transform: !canSpin ? "scale(0.94)" : spinning ? "scale(0.97)" : "scale(1)",
                    animation: canSpin && !spinning ? "btnPulse 2s ease-in-out infinite" : "none",
                    position:"relative", zIndex:2, overflow:"hidden",
                  }}
                >
                  <div style={{
                    position:"absolute", top:5, left:10, width:48, height:22,
                    borderRadius:"50%", background:"rgba(255,255,255,0.25)", pointerEvents:"none",
                  }} />
                  <span style={{ color:"#000", fontSize:spinning ? 9 : 12, fontWeight:900, letterSpacing:1.5 }}>
                    {placing ? <Loader size={14} style={{ animation:"ringSpin 0.8s linear infinite" }} />
                      : spinning ? "⏳"
                      : isFree ? "✨"
                      : "SPIN"}
                  </span>
                  {isFree && !spinning && (
                    <span style={{ color:"#fff", fontSize:7, fontWeight:700, marginTop:1 }}>FREE</span>
                  )}
                </button>
              </div>

              {/* Bet max button */}
              <button
                onClick={() => setBetIdx(BETS.length - 1)}
                disabled={spinning}
                style={{
                  flex:1, height:44, background:`${theme.accentAlt}10`,
                  border:`1px solid ${theme.accentAlt}30`, color:theme.accentAlt,
                  borderRadius:12, fontWeight:700, fontSize:10, cursor:"pointer",
                  display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                  opacity:spinning ? 0.4 : 1,
                }}
              >
                <span style={{ fontSize:14 }}>⚡</span>
                <span style={{ fontSize:8, marginTop:1 }}>MAX BET</span>
              </button>
            </div>

            {/* Win lines indicator */}
            {wins.length > 0 && (
              <div style={{
                marginTop:10, padding:"6px 10px", borderRadius:8,
                background:`${theme.accent}10`, border:`1px solid ${theme.accent}20`,
                display:"flex", flexWrap:"wrap", gap:5,
              }}>
                {wins.map((w, i) => {
                  const sym = theme.symbols.find(s => s.key === w.symbol);
                  return (
                    <div key={i} style={{
                      fontSize:10, color:sym?.color ?? theme.accent, fontWeight:700,
                      background:"rgba(0,0,0,0.3)", padding:"2px 7px", borderRadius:10,
                    }}>
                      {sym?.display} ×{w.count} = UGX {w.payout.toLocaleString()}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick-bet chips */}
          <div style={{ display:"flex", gap:5, flexWrap:"wrap", justifyContent:"center", maxWidth:380 }}>
            {BETS.slice(0, 6).map((b, i) => (
              <button
                key={i}
                onClick={() => setBetIdx(i)}
                disabled={spinning}
                style={{
                  background: betIdx === i ? `${theme.accent}20` : "rgba(255,255,255,0.05)",
                  border: `1px solid ${betIdx === i ? theme.accent : "rgba(255,255,255,0.1)"}`,
                  color: betIdx === i ? theme.accent : "rgba(255,255,255,0.5)",
                  borderRadius:20, padding:"4px 10px", fontSize:9, fontWeight:700,
                  cursor:"pointer", fontFamily:"Oswald, sans-serif",
                }}
              >
                {b >= 1000 ? `${b / 1000}K` : b}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showPaytable && <PaytableModal theme={theme} bet={bet} onClose={() => setShowPaytable(false)} />}
    </div>
  );
}
