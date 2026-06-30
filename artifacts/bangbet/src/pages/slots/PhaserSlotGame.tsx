/**
 * PhaserSlotGame.tsx
 * Real slot game built on Phaser 3 (industry-standard HTML5 game engine).
 * Reel strips physically scroll via tweens (same technique as commercial casino slots).
 * Bets deducted & wins credited directly to BetMali Firestore balance.
 */
import Phaser from "phaser";
import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Info, X } from "lucide-react";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";

/* ─────────────── LAYOUT ─────────────── */
const SW    = 80;                  // symbol width
const SH    = 80;                  // symbol height
const SGAP  = 5;                   // gap between cells
const STEP  = SH + SGAP;          // 85 px per slot
const NR    = 5;                   // reels
const NROW  = 3;                   // visible rows
const PAD   = 14;                  // canvas padding
const CW    = NR * SW + (NR-1)*SGAP + PAD*2;   // 444
const CH    = NROW*SH + (NROW-1)*SGAP + PAD*2; // 270
const RY    = PAD;
const RX    = (r: number) => PAD + r*(SW+SGAP);

/* Strip dimensions: 3 full "laps" before stopping */
const LOOPS = 3;
const STRIP = 14;   // symbols per lap

/* ─────────────── TYPES ─────────────── */
interface SymbolDef {
  key:  string;
  display: string;   // emoji or char
  bg:   number;      // Phaser hex int
  edge: number;
  payout3: number;
  payout4: number;
  payout5: number;
  isWild?:    boolean;
  isScatter?: boolean;
}

type Grid = string[][];   // [reel 0-4][row 0-2]

interface WinLine {
  cells:  [number,number][];
  sym:    string;
  count:  number;
  payout: number;
}

export interface GameTheme {
  id:      string;
  name:    string;
  tagline: string;
  symbols: SymbolDef[];
  bg:      string;    // CSS gradient for React UI
  accent:  string;
}

/* ─────────────── GAME THEMES ─────────────── */
export const PHASER_THEMES: GameTheme[] = [
  {
    id: "lucky7", name: "Lucky Sevens", tagline: "Classic Fruit Machine",
    bg: "linear-gradient(160deg,#0d0500,#1a0d00,#0a0300)",
    accent: "#FFD700",
    symbols: [
      { key:"cherry",  display:"🍒", bg:0x2d0000, edge:0xff4444, payout3:2,  payout4:5,   payout5:12  },
      { key:"lemon",   display:"🍋", bg:0x2d2800, edge:0xffd700, payout3:3,  payout4:8,   payout5:20  },
      { key:"orange",  display:"🍊", bg:0x2d1200, edge:0xff6b00, payout3:5,  payout4:12,  payout5:30  },
      { key:"grape",   display:"🍇", bg:0x1a002d, edge:0xce93d8, payout3:8,  payout4:20,  payout5:60  },
      { key:"bell",    display:"🔔", bg:0x2d2000, edge:0xffc107, payout3:15, payout4:40,  payout5:120 },
      { key:"star",    display:"⭐", bg:0x2d2800, edge:0xffd700, payout3:25, payout4:80,  payout5:250 },
      { key:"seven",   display:"7",  bg:0x2d0010, edge:0xff1744, payout3:50, payout4:200, payout5:777 },
      { key:"wild",    display:"W",  bg:0x12002d, edge:0xe040fb, payout3:0,  payout4:0,   payout5:0,   isWild:true    },
      { key:"scatter", display:"💰", bg:0x2d2800, edge:0xffd700, payout3:10, payout4:25,  payout5:100, isScatter:true },
    ],
  },
  {
    id: "egypt", name: "Egyptian Gold", tagline: "Pharaoh's Secret Fortune",
    bg: "linear-gradient(160deg,#0d0800,#1a1000,#080500)",
    accent: "#FFB300",
    symbols: [
      { key:"scarab",  display:"🪲", bg:0x003d00, edge:0x66bb6a, payout3:2,  payout4:5,   payout5:12  },
      { key:"eye",     display:"👁", bg:0x003d5a, edge:0x29b6f6, payout3:3,  payout4:8,   payout5:20  },
      { key:"cat",     display:"🐱", bg:0x2d1500, edge:0xffa726, payout3:5,  payout4:12,  payout5:30  },
      { key:"ankh",    display:"☥",  bg:0x2d2800, edge:0xffd700, payout3:8,  payout4:20,  payout5:60  },
      { key:"pyramid", display:"🔺", bg:0x2d1400, edge:0xff8f00, payout3:15, payout4:40,  payout5:120 },
      { key:"pharaoh", display:"👑", bg:0x2d2800, edge:0xffd700, payout3:25, payout4:80,  payout5:250 },
      { key:"ra",      display:"☀",  bg:0x2d1000, edge:0xff6d00, payout3:50, payout4:200, payout5:777 },
      { key:"wild",    display:"W",  bg:0x2d2800, edge:0xffd700, payout3:0,  payout4:0,   payout5:0,   isWild:true    },
      { key:"scatter", display:"🏺", bg:0x2d2000, edge:0xffb300, payout3:10, payout4:25,  payout5:100, isScatter:true },
    ],
  },
  {
    id: "dragon", name: "Dragon Riches", tagline: "Legendary Fortune of the East",
    bg: "linear-gradient(160deg,#0d0000,#1a0000,#080000)",
    accent: "#FF1744",
    symbols: [
      { key:"blossom", display:"🌸", bg:0x2d001a, edge:0xf48fb1, payout3:2,  payout4:5,   payout5:12  },
      { key:"lantern", display:"🏮", bg:0x2d0000, edge:0xff1744, payout3:3,  payout4:8,   payout5:20  },
      { key:"coin",    display:"🪙", bg:0x2d2800, edge:0xffd700, payout3:5,  payout4:12,  payout5:30  },
      { key:"tiger",   display:"🐯", bg:0x2d1000, edge:0xff6d00, payout3:8,  payout4:20,  payout5:60  },
      { key:"jade",    display:"💚", bg:0x003d00, edge:0x66bb6a, payout3:15, payout4:40,  payout5:120 },
      { key:"phoenix", display:"🦅", bg:0x2d1400, edge:0xff8f00, payout3:25, payout4:80,  payout5:250 },
      { key:"dragon",  display:"🐉", bg:0x2d0000, edge:0xff1744, payout3:50, payout4:200, payout5:777 },
      { key:"wild",    display:"W",  bg:0x2d0000, edge:0xff1744, payout3:0,  payout4:0,   payout5:0,   isWild:true    },
      { key:"scatter", display:"🎋", bg:0x003d00, edge:0x66bb6a, payout3:10, payout4:25,  payout5:100, isScatter:true },
    ],
  },
  {
    id: "gems", name: "Crystal Mines", tagline: "Unearth Gemstone Riches",
    bg: "linear-gradient(160deg,#00050d,#000d1a,#000508)",
    accent: "#00E5FF",
    symbols: [
      { key:"amethyst", display:"🔮", bg:0x1a003d, edge:0xce93d8, payout3:2,  payout4:5,   payout5:12  },
      { key:"ruby",     display:"♦",  bg:0x2d0000, edge:0xff1744, payout3:3,  payout4:8,   payout5:20  },
      { key:"emerald",  display:"💚", bg:0x003d00, edge:0x66bb6a, payout3:5,  payout4:12,  payout5:30  },
      { key:"topaz",    display:"🟡", bg:0x2d2800, edge:0xffd700, payout3:8,  payout4:20,  payout5:60  },
      { key:"sapphire", display:"💙", bg:0x003d5a, edge:0x29b6f6, payout3:15, payout4:40,  payout5:120 },
      { key:"crystal",  display:"🔷", bg:0x003028, edge:0x00e5ff, payout3:25, payout4:80,  payout5:250 },
      { key:"diamond",  display:"💎", bg:0x002030, edge:0xe0f7fa, payout3:50, payout4:200, payout5:777 },
      { key:"wild",     display:"W",  bg:0x003040, edge:0x00e5ff, payout3:0,  payout4:0,   payout5:0,   isWild:true    },
      { key:"scatter",  display:"⚡", bg:0x12003d, edge:0x7c4dff, payout3:10, payout4:25,  payout5:100, isScatter:true },
    ],
  },
  {
    id: "safari", name: "Wild Safari", tagline: "African Riches Await",
    bg: "linear-gradient(160deg,#0d0800,#1c1000,#080500)",
    accent: "#FF8F00",
    symbols: [
      { key:"zebra",    display:"🦓", bg:0x1a1a1a, edge:0x9e9e9e, payout3:2,  payout4:5,   payout5:12  },
      { key:"giraffe",  display:"🦒", bg:0x2d1400, edge:0xff8f00, payout3:3,  payout4:8,   payout5:20  },
      { key:"hippo",    display:"🦛", bg:0x152030, edge:0x78909c, payout3:5,  payout4:12,  payout5:30  },
      { key:"elephant", display:"🐘", bg:0x151820, edge:0xb0bec5, payout3:8,  payout4:20,  payout5:60  },
      { key:"rhino",    display:"🦏", bg:0x1a1008, edge:0x8d6e63, payout3:15, payout4:40,  payout5:120 },
      { key:"lion",     display:"🦁", bg:0x2d1c00, edge:0xffb300, payout3:25, payout4:80,  payout5:250 },
      { key:"cheetah",  display:"🐆", bg:0x2d1400, edge:0xff8f00, payout3:50, payout4:200, payout5:777 },
      { key:"wild",     display:"W",  bg:0x2d1400, edge:0xff8f00, payout3:0,  payout4:0,   payout5:0,   isWild:true    },
      { key:"scatter",  display:"🌅", bg:0x2d2800, edge:0xffd54f, payout3:10, payout4:25,  payout5:100, isScatter:true },
    ],
  },
];

/* ─────────────── PAYLINES (10) ─────────────── */
const PAYLINES: [number,number][][] = [
  [[0,1],[1,1],[2,1],[3,1],[4,1]],
  [[0,0],[1,0],[2,0],[3,0],[4,0]],
  [[0,2],[1,2],[2,2],[3,2],[4,2]],
  [[0,0],[1,1],[2,2],[3,1],[4,0]],
  [[0,2],[1,1],[2,0],[3,1],[4,2]],
  [[0,0],[1,0],[2,1],[3,2],[4,2]],
  [[0,2],[1,2],[2,1],[3,0],[4,0]],
  [[0,1],[1,0],[2,0],[3,0],[4,1]],
  [[0,1],[1,2],[2,2],[3,2],[4,1]],
  [[0,0],[1,1],[2,0],[3,1],[4,0]],
];

/* ─────────────── WIN EVALUATION ─────────────── */
function evalWins(grid: Grid, bet: number, defs: SymbolDef[]): WinLine[] {
  const map    = Object.fromEntries(defs.map(s => [s.key, s]));
  const wild   = defs.find(s => s.isWild)?.key    ?? "";
  const scatter= defs.find(s => s.isScatter)?.key ?? "";
  const out: WinLine[] = [];

  // Scatter (anywhere)
  const sc: [number,number][] = [];
  for (let r=0;r<NR;r++) for (let row=0;row<NROW;row++) if (grid[r]?.[row]===scatter) sc.push([r,row]);
  if (sc.length>=3) {
    const d=map[scatter]; const p=sc.length>=5?d.payout5:sc.length>=4?d.payout4:d.payout3;
    out.push({cells:sc,sym:scatter,count:sc.length,payout:p*bet});
  }

  // Paylines
  PAYLINES.forEach(line=>{
    const cells=line as [number,number][];
    const syms=cells.map(([r,row])=>grid[r]?.[row]??"");
    const base=syms.find(s=>s&&s!==wild&&s!==scatter);
    if(!base) return;
    let cnt=0; for(const s of syms){if(s===base||s===wild)cnt++;else break;}
    if(cnt<3) return;
    const d=map[base]; if(!d) return;
    const p=cnt>=5?d.payout5:cnt>=4?d.payout4:d.payout3; if(!p) return;
    out.push({cells:cells.slice(0,cnt),sym:base,count:cnt,payout:p*bet});
  });
  return out;
}

/* ─────────────── SPIN RESULT GENERATOR ─────────────── */
function makeGrid(defs: SymbolDef[]): Grid {
  const eligible = defs.filter(s=>!s.isWild&&!s.isScatter);
  const scatterKey = defs.find(s=>s.isScatter)?.key??"";
  const wildKey    = defs.find(s=>s.isWild)?.key??"";
  const weights    = eligible.map((_,i)=>Math.max(1, 11-i*1.4));
  const total      = weights.reduce((a,b)=>a+b,0);

  const pick=()=>{
    let r=Math.random()*total;
    for(let i=0;i<eligible.length;i++){r-=weights[i];if(r<=0)return eligible[i].key;}
    return eligible.at(-1)!.key;
  };
  // Wild appears rarely (~8%), scatter even less (~6%)
  const pickFull=()=>{
    const r=Math.random();
    if(r<0.06) return scatterKey;
    if(r<0.14) return wildKey;
    return pick();
  };
  return Array.from({length:NR},()=>Array.from({length:NROW},pickFull));
}

/* ─────────────────────────────────────────────────
   PHASER SCENE
────────────────────────────────────────────────── */
interface SpinReq {
  grid:       Grid;
  defs:       SymbolDef[];
  bet:        number;
  onDone:     (wins:WinLine[])=>void;
}

class SlotScene extends Phaser.Scene {
  private reels: Phaser.GameObjects.Container[] = [];
  private highlights: Phaser.GameObjects.Graphics[] = [];
  private maskGfx: Phaser.GameObjects.Graphics[] = [];
  private defs: SymbolDef[] = [];

  constructor() { super({key:"SlotScene"}); }

  create() {
    this.defs = (this.registry.get("defs") as SymbolDef[]) ?? PHASER_THEMES[0].symbols;

    /* Cabinet background */
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a0a, 1);
    bg.fillRoundedRect(0, 0, CW, CH, 12);

    /* Reel slots (dark sunken rects) */
    for (let r=0;r<NR;r++) {
      bg.fillStyle(0x060606, 1);
      bg.fillRoundedRect(RX(r)-1, RY-1, SW+2, NROW*STEP-SGAP+2, 6);
    }

    /* Separator lines */
    const sep=this.add.graphics();
    sep.lineStyle(1, 0x222222, 0.8);
    for(let r=1;r<NR;r++) sep.lineBetween(RX(r)-3, RY, RX(r)-3, RY+NROW*STEP-SGAP);

    /* Build reels */
    this.buildReels();

    /* Cabinet shine */
    const shine=this.add.graphics();
    shine.lineStyle(1, 0x444444, 0.4);
    shine.strokeRoundedRect(1, 1, CW-2, CH-2, 12);

    /* Signal React */
    const ready = this.registry.get("onReady") as ((s:SlotScene)=>void)|null;
    if(ready) ready(this);
  }

  /* Build reel containers with initial symbols */
  private buildReels() {
    const init = makeGrid(this.defs);
    for(let r=0;r<NR;r++) {
      /* Geometry mask — clips to the reel viewport */
      const mg = this.add.graphics();
      mg.fillStyle(0xffffff);
      mg.fillRect(RX(r), RY, SW, NROW*STEP-SGAP);
      this.maskGfx.push(mg);
      const mask = mg.createGeometryMask();

      const con = this.add.container(0, 0);
      con.setMask(mask);

      init[r].forEach((key,row) => {
        const s = this.makeSymbol(key);
        s.setPosition(RX(r), RY + row*STEP);
        con.add(s);
      });
      this.reels.push(con);
    }
  }

  /* Create one symbol as a Phaser Container */
  private makeSymbol(key: string): Phaser.GameObjects.Container {
    const def = this.defs.find(d=>d.key===key) ?? this.defs[0];
    const g   = this.add.graphics();

    // BG fill
    g.fillStyle(def.bg, 1);
    g.fillRoundedRect(0, 0, SW-2, SH-2, 9);

    // Border glow
    g.lineStyle(2, def.edge, 0.9);
    g.strokeRoundedRect(0, 0, SW-2, SH-2, 9);

    // Top shine
    g.fillStyle(0xffffff, 0.10);
    g.fillEllipse((SW-2)/2, (SH-2)*0.27, (SW-2)*0.68, (SH-2)*0.30);

    // Label
    const isChar = /^[a-zA-Z0-9☥☀♦⚡⭐]$/.test(def.display);
    const label  = this.add.text(
      (SW-2)/2, (SH-2)/2, def.display,
      {
        fontSize: isChar ? `${SW*0.46}px` : `${SW*0.40}px`,
        fontFamily: isChar ? "Oswald,Arial Black,sans-serif" : "Arial",
        color: isChar ? `#${def.edge.toString(16).padStart(6,"0")}` : "#ffffff",
        fontStyle: isChar ? "bold" : "normal",
      }
    ).setOrigin(0.5);

    const con = this.add.container(0, 0, [g, label]);
    con.setSize(SW-2, SH-2);
    return con;
  }

  /* ── PUBLIC: start a spin ── */
  public spin(req: SpinReq) {
    this.defs = req.defs;
    this.clearHighlights();

    const promises = this.reels.map((reel, r) =>
      this.animateReel(reel, r, req.grid[r])
    );

    Promise.all(promises).then(() => {
      const wins = evalWins(req.grid, req.bet, req.defs);
      if (wins.length) this.drawHighlights(wins);
      req.onDone(wins);
    });
  }

  /* Animate one reel: build a tall strip, tween it into view */
  private animateReel(
    reel: Phaser.GameObjects.Container,
    r: number,
    resultSyms: string[]
  ): Promise<void> {
    return new Promise(resolve => {
      // Build strip: LOOPS*STRIP random symbols → result → 2 extra
      const strip: string[] = [];
      const eligible = this.defs.filter(d=>!d.isWild&&!d.isScatter);
      const pickRand = () => eligible[Math.floor(Math.random()*eligible.length)].key;

      for(let i=0;i<LOOPS*STRIP;i++) strip.push(pickRand());
      resultSyms.forEach(s=>strip.push(s));      // result at index LOOPS*STRIP
      for(let i=0;i<2;i++) strip.push(pickRand()); // padding below

      // Remove old children, reset
      reel.removeAll(true);

      // Build new children — positioned absolutely in scene space
      strip.forEach((key,i)=>{
        const sym = this.makeSymbol(key);
        // symbol i sits at row i in the strip, starting above viewport
        sym.setPosition(RX(r), RY - LOOPS*STRIP*STEP + i*STEP);
        reel.add(sym);
      });

      // Tween: move reel DOWN so result symbols land in the viewport
      // At strip start, reel children start at RY - LOOPS*STRIP*STEP
      // After tween offsetY = LOOPS*STRIP*STEP, they're at RY → visible
      const target = { y: reel.y + LOOPS*STRIP*STEP };
      const delay  = r * 370;

      this.time.delayedCall(delay, ()=>{
        this.tweens.add({
          targets: reel,
          y: target.y,
          duration: 1100 + r*200,
          ease: "Cubic.easeOut",
          onComplete: ()=>resolve(),
        });
      });
    });
  }

  /* Draw glowing highlight borders on winning cells */
  private drawHighlights(wins: WinLine[]) {
    const g = this.add.graphics();
    wins.forEach(win=>{
      const def = this.defs.find(d=>d.key===win.sym);
      if(!def) return;
      win.cells.forEach(([r,row])=>{
        const x = RX(r); const y = RY + row*STEP;
        g.lineStyle(4, def.edge, 1.0);
        g.strokeRoundedRect(x, y, SW-2, SH-2, 9);
        g.lineStyle(10, def.edge, 0.18);
        g.strokeRoundedRect(x-2, y-2, SW+2, SH+2, 10);
      });
    });
    this.highlights.push(g);
    this.tweens.add({
      targets: g, alpha:{from:1,to:0.35},
      duration:450, yoyo:true, repeat:6,
    });
  }

  private clearHighlights() {
    this.highlights.forEach(g=>g.destroy());
    this.highlights=[];
  }

  /* Reset reel offsets between spins */
  update() {
    // Keep reel containers anchored (only y changes via tween)
  }
}

/* ─────────────────────────────────────────────────
   REACT WRAPPER
────────────────────────────────────────────────── */
const BETS = [100, 500, 1_000, 2_000, 5_000, 10_000, 25_000, 50_000];

interface Props { theme: GameTheme; onBack: ()=>void; }

export default function PhaserSlotGame({ theme, onBack }: Props) {
  const { user } = useAuth();
  const mountRef   = useRef<HTMLDivElement>(null);
  const gameRef    = useRef<Phaser.Game|null>(null);
  const sceneRef   = useRef<SlotScene|null>(null);
  const resolveRef = useRef<((wins:WinLine[])=>void)|null>(null);

  const [betIdx, setBetIdx]    = useState(2);
  const [spinning, setSpin]    = useState(false);
  const [wins, setWins]        = useState<WinLine[]>([]);
  const [totalWin, setTotal]   = useState(0);
  const [banner, setBanner]    = useState("");
  const [error, setError]      = useState<string|null>(null);
  const [freeSpins, setFree]   = useState(0);
  const [freeBanner, setFreeB] = useState("");
  const [showPay, setShowPay]  = useState(false);
  const [autoLeft, setAuto]    = useState(0);
  const autoRef = useRef(false);

  const bet = BETS[betIdx];
  const balance = (user?.balance??0)+(user?.bonus??0);
  const isFree  = freeSpins>0;
  const scatterKey = theme.symbols.find(s=>s.isScatter)?.key??"";

  /* Mount Phaser once */
  useEffect(()=>{
    if(!mountRef.current || gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: CW, height: CH,
      transparent: true,
      parent: mountRef.current,
      scene: SlotScene,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: CW, height: CH,
      },
      callbacks: {
        preBoot: (game)=>{
          game.registry.set("defs", theme.symbols);
          game.registry.set("onReady", (s:SlotScene)=>{ sceneRef.current=s; });
        },
      },
    };
    gameRef.current = new Phaser.Game(config);

    return ()=>{
      gameRef.current?.destroy(true);
      gameRef.current=null;
      sceneRef.current=null;
    };
  }, []);   // eslint-disable-line

  /* Update defs when theme changes */
  useEffect(()=>{
    gameRef.current?.registry.set("defs", theme.symbols);
  }, [theme.id]);

  const doSpin = useCallback(async ()=>{
    if(spinning) return;
    if(!sceneRef.current){ setError("Game not ready — wait a moment."); return; }

    if(!isFree){
      if(!user){ setError("Please log in to play."); return; }
      if((user.balance??0)<bet){ setError("Insufficient balance. Please deposit."); return; }
    }
    setError(null);
    setSpin(true);
    setWins([]); setTotal(0); setBanner(""); setFreeB("");

    // Deduct bet
    if(!isFree && user){
      try {
        await updateDoc(doc(db,"users",user.uid),{balance:increment(-bet)});
      } catch {
        setError("Bet failed — check connection."); setSpin(false); return;
      }
    }
    if(isFree) setFree(f=>f-1);

    // Generate result
    const grid = makeGrid(theme.symbols);

    // Tell Phaser to spin
    resolveRef.current = async (wins: WinLine[])=>{
      const total = wins.reduce((a,w)=>a+w.payout, 0);
      setWins(wins); setTotal(total);

      // Credit wins
      if(total>0 && user){
        await updateDoc(doc(db,"users",user.uid),{
          balance:increment(total), winnings:increment(total),
        }).catch(console.error);

        const x=total/bet;
        setBanner(
          x>=500?"🔥🔥🔥 LEGENDARY WIN!!! 🔥🔥🔥":
          x>=100?"💎💎 MEGA WIN!! 💎💎":
          x>=30 ?"💰 BIG WIN! 💰":
          x>=10 ?"⭐ SUPER WIN! ⭐":
          "🎉 WIN!"
        );
        setTimeout(()=>setBanner(""),3500);
      }

      // Check scatter for free spins
      const sc=wins.find(w=>w.sym===scatterKey);
      if(sc&&sc.count>=3){
        setFree(f=>f+10); setFreeB(`🎁 10 FREE SPINS UNLOCKED!`);
        setTimeout(()=>setFreeB(""),5000);
      }

      setSpin(false);
    };

    sceneRef.current.spin({
      grid, defs: theme.symbols, bet,
      onDone: (w)=>resolveRef.current?.(w),
    });
  }, [spinning, user, bet, theme, isFree, scatterKey]);

  /* Auto-spin */
  useEffect(()=>{ autoRef.current=autoLeft>0; },[autoLeft]);
  useEffect(()=>{
    if(!spinning && autoLeft>0){
      const t=setTimeout(()=>{
        if(autoRef.current){ setAuto(a=>a-1); doSpin(); }
      },600);
      return ()=>clearTimeout(t);
    }
    return undefined;
  },[spinning, autoLeft, doSpin]);

  const canSpin = !spinning && !!(sceneRef.current) && (isFree||(user?.balance??0)>=bet);

  return (
    <div style={{
      minHeight:"100vh", background:theme.bg,
      display:"flex", flexDirection:"column",
      fontFamily:"Oswald,Arial,sans-serif", userSelect:"none",
    }}>
      <style>{`
        @keyframes phaserpulse{0%,100%{box-shadow:0 0 22px ${theme.accent},0 4px 14px #0008}50%{box-shadow:0 0 44px ${theme.accent},0 0 70px ${theme.accent}50,0 4px 18px #0009}}
        @keyframes winpop{0%{transform:scale(0.5);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
        @keyframes ringg{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
        @keyframes ringr{0%{transform:rotate(360deg)}100%{transform:rotate(0deg)}}
        @keyframes slideup{0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:translateY(0)}}
      `}</style>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.70)",pointerEvents:"none"}}/>

      <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",flex:1}}>
        {/* HEADER */}
        <div style={{
          display:"flex",alignItems:"center",gap:10,padding:"10px 14px",
          background:"rgba(0,0,0,0.6)",backdropFilter:"blur(12px)",
          borderBottom:`1px solid ${theme.accent}25`,
        }}>
          <button onClick={onBack} style={{
            background:`rgba(255,255,255,0.07)`,border:`1px solid ${theme.accent}35`,
            color:theme.accent,borderRadius:8,padding:"7px 12px",
            cursor:"pointer",display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:700,
          }}>
            <ChevronLeft size={15}/> BACK
          </button>
          <div style={{flex:1,textAlign:"center"}}>
            <div style={{color:theme.accent,fontSize:15,fontWeight:700,letterSpacing:1.5,
              textShadow:`0 0 14px ${theme.accent}80`}}>
              {theme.name.toUpperCase()}
            </div>
            <div style={{color:"rgba(255,255,255,0.35)",fontSize:9}}>{theme.tagline}</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={()=>setShowPay(true)} style={{
              background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",
              color:"rgba(255,255,255,0.4)",borderRadius:8,padding:"7px 9px",cursor:"pointer",display:"flex",alignItems:"center",
            }}><Info size={13}/></button>
            <div style={{textAlign:"right"}}>
              <div style={{color:"rgba(255,255,255,0.3)",fontSize:8}}>BALANCE</div>
              <div style={{color:"#fff",fontSize:13,fontWeight:800}}>
                {balance>=1000?`${(balance/1000).toFixed(1)}K UGX`:`UGX ${balance.toLocaleString()}`}
              </div>
            </div>
          </div>
        </div>

        {/* STATUS BAR */}
        <div style={{display:"flex",justifyContent:"space-between",padding:"5px 14px",
          background:"rgba(0,0,0,0.4)",fontSize:10,gap:6,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{color:"rgba(255,255,255,0.4)"}}>
            BAL: <span style={{color:"#fff",fontWeight:700}}>UGX {balance.toLocaleString()}</span>
          </div>
          {isFree?(
            <div style={{background:`linear-gradient(135deg,${theme.accent},#fff3)`,
              color:"#000",padding:"3px 12px",borderRadius:20,fontWeight:800,fontSize:10,
              boxShadow:`0 0 10px ${theme.accent}80`}}>
              ✨ {freeSpins} FREE SPINS
            </div>
          ):(
            <div style={{color:"rgba(255,255,255,0.3)",fontSize:9}}>10 PAYLINES · PHASER ENGINE</div>
          )}
          <div style={{color:"rgba(255,255,255,0.4)"}}>
            BET: <span style={{color:theme.accent,fontWeight:700}}>UGX {bet.toLocaleString()}</span>
          </div>
        </div>

        {freeBanner&&<div style={{textAlign:"center",padding:"8px",color:theme.accent,
          fontWeight:800,fontSize:13,animation:"slideup 0.4s ease",
          borderBottom:`1px solid ${theme.accent}20`,
          background:`linear-gradient(90deg,transparent,${theme.accent}18,transparent)`}}>{freeBanner}</div>}
        {error&&<div style={{background:"rgba(255,30,30,0.12)",border:"1px solid rgba(255,30,30,0.3)",
          color:"#FF5252",padding:"7px 14px",fontSize:11,textAlign:"center"}}>{error}</div>}

        {/* PHASER CANVAS */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1,padding:"10px 10px 0"}}>
          <div style={{
            borderRadius:16,overflow:"hidden",
            border:`2px solid ${theme.accent}35`,
            boxShadow:`0 0 40px ${theme.accent}18, 0 0 80px ${theme.accent}08, 0 8px 32px rgba(0,0,0,0.6)`,
            background:"#080808",
            width:"100%",maxWidth:CW+4,
            position:"relative",
          }}>
            {/* Top glow bar */}
            <div style={{position:"absolute",top:0,left:"10%",right:"10%",height:2,
              background:`linear-gradient(90deg,transparent,${theme.accent},transparent)`,zIndex:2}}/>
            <div ref={mountRef} style={{width:"100%",aspectRatio:`${CW}/${CH}`,display:"block"}}/>
            {/* Bottom glow bar */}
            <div style={{position:"absolute",bottom:0,left:"10%",right:"10%",height:2,
              background:`linear-gradient(90deg,transparent,${theme.accent},transparent)`,zIndex:2}}/>
          </div>

          {/* WIN BANNER */}
          <div style={{minHeight:50,display:"flex",flexDirection:"column",
            alignItems:"center",justifyContent:"center",padding:"6px 0"}}>
            {banner&&(
              <div style={{color:theme.accent,fontSize:20,fontWeight:900,letterSpacing:2,
                animation:"winpop 0.35s ease",textAlign:"center",
                textShadow:`0 0 22px ${theme.accent},0 0 44px ${theme.accent}50`}}>
                {banner}
                <div style={{fontSize:14,color:"#fff",marginTop:2,fontWeight:700}}>
                  UGX {totalWin.toLocaleString()}
                </div>
              </div>
            )}
            {!banner&&totalWin>0&&(
              <div style={{color:"#FFD700",fontSize:11,fontWeight:700}}>
                Last win: UGX {totalWin.toLocaleString()} · {wins.length} line{wins.length!==1?"s":""}
              </div>
            )}
          </div>

          {/* CONTROLS */}
          <div style={{
            width:"100%",maxWidth:CW+4,
            background:"rgba(0,0,0,0.7)",backdropFilter:"blur(12px)",
            border:`1px solid ${theme.accent}18`,borderRadius:18,
            padding:"12px 14px 14px",marginBottom:8,
          }}>
            {/* Bet */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <div style={{color:"rgba(255,255,255,0.35)",fontSize:9,letterSpacing:0.5}}>BET AMOUNT</div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <button onClick={()=>setBetIdx(i=>Math.max(0,i-1))} disabled={spinning||betIdx===0}
                  style={{background:`${theme.accent}15`,border:`1px solid ${theme.accent}30`,
                    color:theme.accent,borderRadius:6,width:28,height:28,cursor:"pointer",
                    opacity:betIdx===0?0.3:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <ChevronLeft size={13}/>
                </button>
                <div style={{color:theme.accent,fontSize:16,fontWeight:800,minWidth:100,
                  textAlign:"center",textShadow:`0 0 8px ${theme.accent}60`}}>
                  UGX {bet.toLocaleString()}
                </div>
                <button onClick={()=>setBetIdx(i=>Math.min(BETS.length-1,i+1))} disabled={spinning||betIdx===BETS.length-1}
                  style={{background:`${theme.accent}15`,border:`1px solid ${theme.accent}30`,
                    color:theme.accent,borderRadius:6,width:28,height:28,cursor:"pointer",
                    opacity:betIdx===BETS.length-1?0.3:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <ChevronRight size={13}/>
                </button>
              </div>
              <div style={{color:"rgba(255,255,255,0.3)",fontSize:9}}>10 LINES</div>
            </div>

            {/* Spin row */}
            <div style={{display:"flex",gap:10,alignItems:"center",justifyContent:"space-between"}}>
              {/* Auto */}
              {autoLeft>0?(
                <button onClick={()=>setAuto(0)}
                  style={{flex:1,height:46,background:"rgba(255,60,60,0.1)",
                    border:"1px solid rgba(255,60,60,0.35)",color:"#ff4444",
                    borderRadius:12,fontWeight:700,fontSize:10,cursor:"pointer",
                    display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:16}}>⏹</span>
                  <span style={{fontSize:8,marginTop:1}}>STOP ({autoLeft})</span>
                </button>
              ):(
                <button onClick={()=>{setAuto(10);doSpin();}} disabled={!canSpin}
                  style={{flex:1,height:46,background:`${theme.accent}10`,
                    border:`1px solid ${theme.accent}28`,color:theme.accent,
                    borderRadius:12,fontWeight:700,fontSize:10,cursor:"pointer",
                    display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                    opacity:!canSpin?0.4:1}}>
                  <span style={{fontSize:15}}>🔁</span>
                  <span style={{fontSize:8,marginTop:1}}>AUTO ×10</span>
                </button>
              )}

              {/* Main SPIN */}
              <div style={{position:"relative",width:82,height:82,flexShrink:0,
                display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width={82} height={82} style={{position:"absolute",inset:0,
                  animation:spinning?"ringg 0.4s linear infinite":"ringg 3.5s linear infinite",
                  opacity:canSpin?1:0.3}}>
                  <circle cx={41} cy={41} r={39} fill="none" stroke={theme.accent}
                    strokeWidth={3} strokeDasharray="12 6" strokeLinecap="round" opacity={0.8}/>
                </svg>
                <svg width={82} height={82} style={{position:"absolute",inset:0,
                  animation:spinning?"ringr 0.65s linear infinite":"ringr 7s linear infinite",
                  opacity:canSpin?0.45:0.18}}>
                  <circle cx={41} cy={41} r={33} fill="none" stroke={theme.accent}
                    strokeWidth={2} strokeDasharray="6 9" strokeLinecap="round"/>
                </svg>
                <button onClick={doSpin} disabled={!canSpin}
                  style={{
                    width:66,height:66,borderRadius:"50%",border:"none",
                    background:isFree
                      ?"linear-gradient(135deg,#7B1FA2,#9C27B0,#6A1B9A)"
                      :`conic-gradient(from 0deg,${theme.accent},${theme.accent}80,${theme.accent})`,
                    cursor:!canSpin?"not-allowed":"pointer",
                    display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                    position:"relative",zIndex:2,overflow:"hidden",
                    animation:canSpin&&!spinning?"phaserpulse 2s ease-in-out infinite":"none",
                    transform:!canSpin?"scale(0.93)":spinning?"scale(0.97)":"scale(1)",
                    transition:"transform 0.1s",
                  }}>
                  <div style={{position:"absolute",top:6,left:10,width:46,height:20,
                    borderRadius:"50%",background:"rgba(255,255,255,0.25)",pointerEvents:"none"}}/>
                  <span style={{color:"#000",fontSize:spinning?10:11,fontWeight:900,letterSpacing:1.5,position:"relative"}}>
                    {spinning?"⏳":isFree?"✨":"SPIN"}
                  </span>
                  {isFree&&!spinning&&<span style={{color:"#fff",fontSize:7,fontWeight:700,marginTop:1}}>FREE</span>}
                </button>
              </div>

              {/* Max bet */}
              <button onClick={()=>setBetIdx(BETS.length-1)} disabled={spinning}
                style={{flex:1,height:46,background:"rgba(255,255,255,0.05)",
                  border:"1px solid rgba(255,255,255,0.12)",color:"rgba(255,255,255,0.5)",
                  borderRadius:12,fontWeight:700,fontSize:10,cursor:"pointer",
                  display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                  opacity:spinning?0.4:1}}>
                <span style={{fontSize:15}}>⚡</span>
                <span style={{fontSize:8,marginTop:1}}>MAX BET</span>
              </button>
            </div>

            {/* Win details */}
            {wins.length>0&&(
              <div style={{marginTop:10,padding:"6px 10px",borderRadius:8,
                background:`${theme.accent}0f`,border:`1px solid ${theme.accent}18`,
                display:"flex",flexWrap:"wrap",gap:5}}>
                {wins.map((w,i)=>{
                  const d=theme.symbols.find(s=>s.key===w.sym);
                  return(
                    <div key={i} style={{fontSize:10,color:`#${d?.edge.toString(16).padStart(6,"0")??"fff"}`,
                      fontWeight:700,background:"rgba(0,0,0,0.3)",padding:"2px 8px",borderRadius:10}}>
                      {d?.display} ×{w.count} = UGX {w.payout.toLocaleString()}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick chips */}
          <div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"center",maxWidth:CW+4,marginBottom:8}}>
            {BETS.slice(0,6).map((b,i)=>(
              <button key={i} onClick={()=>setBetIdx(i)} disabled={spinning}
                style={{
                  background:betIdx===i?`${theme.accent}1a`:"rgba(255,255,255,0.05)",
                  border:`1px solid ${betIdx===i?theme.accent:"rgba(255,255,255,0.09)"}`,
                  color:betIdx===i?theme.accent:"rgba(255,255,255,0.45)",
                  borderRadius:20,padding:"4px 11px",fontSize:9,fontWeight:700,
                  cursor:"pointer",fontFamily:"Oswald,sans-serif",
                }}>
                {b>=1000?`${b/1000}K`:b}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PAYTABLE MODAL */}
      {showPay&&(
        <div onClick={()=>setShowPay(false)} style={{
          position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",
          zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div onClick={e=>e.stopPropagation()} style={{
            background:"#111",border:`1px solid ${theme.accent}28`,
            borderRadius:18,padding:18,maxWidth:360,width:"100%",
            maxHeight:"80vh",overflowY:"auto"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{color:theme.accent,fontSize:14,fontWeight:800,letterSpacing:1}}>
                PAYTABLE — {theme.name.toUpperCase()}
              </div>
              <button onClick={()=>setShowPay(false)} style={{background:"none",border:"none",
                color:"rgba(255,255,255,0.4)",cursor:"pointer"}}><X size={17}/></button>
            </div>
            {theme.symbols.filter(s=>!s.isWild&&!s.isScatter).map(sym=>(
              <div key={sym.key} style={{display:"flex",alignItems:"center",gap:10,
                background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"7px 10px",marginBottom:5}}>
                <span style={{fontSize:20,width:26,textAlign:"center"}}>{sym.display}</span>
                <div style={{flex:1,fontSize:11,color:"rgba(255,255,255,0.65)"}}>{sym.key}</div>
                {[sym.payout3,sym.payout4,sym.payout5].map((p,i)=>(
                  <div key={i} style={{textAlign:"center"}}>
                    <div style={{color:`#${sym.edge.toString(16).padStart(6,"0")}`,fontSize:10,fontWeight:700}}>
                      {(p*bet).toLocaleString()}
                    </div>
                    <div style={{color:"rgba(255,255,255,0.28)",fontSize:8}}>{i+3}×</div>
                  </div>
                ))}
              </div>
            ))}
            <div style={{marginTop:10,padding:"8px 10px",background:"rgba(255,255,255,0.04)",borderRadius:8}}>
              <div style={{color:theme.accent,fontSize:11,fontWeight:700,marginBottom:4}}>SPECIALS</div>
              <div style={{color:"rgba(255,255,255,0.55)",fontSize:10,lineHeight:1.7}}>
                W = WILD — substitutes for all symbols except BONUS<br/>
                {theme.symbols.find(s=>s.isScatter)?.display} = BONUS — 3+ anywhere → 10 FREE SPINS
              </div>
            </div>
          </div>
        </div>
      )}
      <div style={{height:80}}/>
    </div>
  );
}
