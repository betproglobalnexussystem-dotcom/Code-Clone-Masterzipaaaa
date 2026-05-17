export type SlotSymbol = string;
export type Grid = SlotSymbol[][];

export const PAYLINES: [number, number, number, number, number][] = [
  [1,1,1,1,1], [0,0,0,0,0], [2,2,2,2,2],
  [0,1,2,1,0], [2,1,0,1,2], [0,0,1,0,0],
  [2,2,1,2,2], [1,0,0,0,1], [1,2,2,2,1],
  [0,1,1,1,0], [2,1,1,1,2], [1,0,1,0,1],
  [1,2,1,2,1], [0,1,0,1,0], [2,1,2,1,2],
  [0,2,0,2,0], [2,0,2,0,2], [1,1,0,1,1],
  [1,1,2,1,1], [0,1,2,2,2], [2,1,0,0,0],
  [0,0,1,2,2], [2,2,1,0,0], [1,0,2,0,1],
  [1,2,0,2,1],
];

export const PAYTABLE: Record<string, Record<number, number>> = {
  S1:  { 3: 15, 4: 75,  5: 300 },
  S2:  { 3: 10, 4: 50,  5: 200 },
  S3:  { 3: 8,  4: 30,  5: 150 },
  A:   { 3: 5,  4: 20,  5: 100 },
  K:   { 3: 4,  4: 15,  5: 80  },
  Q:   { 3: 3,  4: 10,  5: 50  },
  J:   { 3: 2,  4: 8,   5: 40  },
  '10':{ 3: 1,  4: 5,   5: 20  },
  '9': { 3: 1,  4: 4,   5: 15  },
};

export const FREE_SPIN_TABLE: Record<number, number> = {
  3: 10,
  4: 20,
  5: 50,
};

export interface WinLine {
  paylineIndex: number;
  symbol: SlotSymbol;
  count: number;
  payout: number;
  cells: [number, number][];
}

export interface SpinResult {
  grid: Grid;
  wins: WinLine[];
  totalWin: number;
  scatters: number;
  freeSpinsAwarded: number;
}

function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export function buildGrid(reelStrips: string[][], nonce: number): Grid {
  const rand = seededRand(nonce ^ 0xdeadbeef);
  return reelStrips.map((strip) => {
    const stop = Math.floor(rand() * strip.length);
    return [
      strip[(stop + strip.length - 1) % strip.length],
      strip[stop],
      strip[(stop + 1) % strip.length],
    ];
  });
}

export function countScatters(grid: Grid): number {
  let count = 0;
  for (const reel of grid) for (const sym of reel) if (sym === 'SCATTER') count++;
  return count;
}

function evaluateLine(
  grid: Grid,
  payline: [number, number, number, number, number],
  lineBet: number
): WinLine | null {
  const syms = payline.map((row, reelIdx) => grid[reelIdx][row]);
  let base = syms[0] === 'WILD' ? null : syms[0];
  if (!base) {
    for (const s of syms) if (s !== 'WILD' && s !== 'SCATTER') { base = s; break; }
  }
  if (!base || base === 'SCATTER') return null;

  let count = 0;
  const cells: [number, number][] = [];
  for (let i = 0; i < 5; i++) {
    if (syms[i] === base || syms[i] === 'WILD') {
      count++;
      cells.push([i, payline[i]]);
    } else break;
  }
  if (count < 3) return null;

  const multiplier = PAYTABLE[base]?.[count] ?? 0;
  if (!multiplier) return null;

  return {
    paylineIndex: -1,
    symbol: base,
    count,
    payout: multiplier * lineBet,
    cells,
  };
}

export function spin(reelStrips: string[][], betPerLine: number, nonce: number): SpinResult {
  const grid = buildGrid(reelStrips, nonce);
  const wins: WinLine[] = [];
  let totalWin = 0;

  for (let i = 0; i < PAYLINES.length; i++) {
    const result = evaluateLine(grid, PAYLINES[i], betPerLine);
    if (result) {
      result.paylineIndex = i;
      wins.push(result);
      totalWin += result.payout;
    }
  }

  const scatters = countScatters(grid);
  const freeSpinsAwarded = FREE_SPIN_TABLE[scatters] ?? 0;

  return { grid, wins, totalWin, scatters, freeSpinsAwarded };
}

export function randomGrid(reelStrips: string[][]): Grid {
  return buildGrid(reelStrips, Math.floor(Math.random() * 0x7fffffff));
}
