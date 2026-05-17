export interface SelectionData {
  id: string;
  pick: string;
  odd: number;
  marketKey?: string;
}

export type Resolution = "won" | "lost" | "pending";

function parseId(id: string): { marketKey: string | null; tt: number | null; sv: string | null } {
  const parts = id.split("-");
  if (parts.length < 2) return { marketKey: null, tt: null, sv: null };

  const last = parts[parts.length - 1];
  const secondLast = parts[parts.length - 2];

  if (["home","draw","away"].includes(last)) return { marketKey: last, tt: null, sv: null };

  const tt = parseInt(secondLast, 10);
  if (!isNaN(tt)) return { marketKey: null, tt, sv: last };

  return { marketKey: null, tt: null, sv: null };
}

const OVER_TT:  Record<number,number> = { 17:1.5, 29:2.5, 37:3.5, 47:4.5, 57:5.5, 67:6.5, 227:-1 };
const UNDER_TT: Record<number,number> = { 18:1.5, 30:2.5, 38:3.5, 48:4.5, 58:5.5, 68:6.5, 228:-1 };

export function resolveSelection(
  sel: SelectionData,
  ftScore: { home: number; away: number },
  htScore: { home: number; away: number } | null,
  _sport: string,
): Resolution {
  const { marketKey: mk, tt, sv } = parseId(sel.id);
  const effectiveKey = sel.marketKey ?? mk;
  const p = sel.pick.toLowerCase();
  const total = ftScore.home + ftScore.away;

  if (effectiveKey === "home") return ftScore.home > ftScore.away ? "won" : "lost";
  if (effectiveKey === "draw") return ftScore.home === ftScore.away ? "won" : "lost";
  if (effectiveKey === "away") return ftScore.away > ftScore.home ? "won" : "lost";

  if (tt === 1) return ftScore.home > ftScore.away ? "won" : "lost";
  if (tt === 2) return ftScore.home === ftScore.away ? "won" : "lost";
  if (tt === 3) return ftScore.away > ftScore.home ? "won" : "lost";

  if (tt === 4) return ftScore.home >= ftScore.away ? "won" : "lost";
  if (tt === 5) return ftScore.away >= ftScore.home ? "won" : "lost";
  if (tt === 6) return ftScore.home !== ftScore.away ? "won" : "lost";

  if (tt !== null && OVER_TT[tt] !== undefined) {
    const thr = tt === 227 ? parseFloat(sv ?? "2.5") : OVER_TT[tt];
    return total > thr ? "won" : "lost";
  }
  if (tt !== null && UNDER_TT[tt] !== undefined) {
    const thr = tt === 228 ? parseFloat(sv ?? "2.5") : UNDER_TT[tt];
    return total < thr ? "won" : "lost";
  }

  if (tt === 264) return (ftScore.home > 0 && ftScore.away > 0) ? "won" : "lost";
  if (tt === 265) return (ftScore.home === 0 || ftScore.away === 0) ? "won" : "lost";

  if (tt === 235) {
    if (ftScore.home === ftScore.away) return "pending";
    return ftScore.home > ftScore.away ? "won" : "lost";
  }
  if (tt === 237) {
    if (ftScore.home === ftScore.away) return "pending";
    return ftScore.away > ftScore.home ? "won" : "lost";
  }

  if ((p.includes("half") || p.includes("1st half") || p.includes("halftime")) && htScore) {
    if (p.includes(": 1") || (p.includes("home") && !p.includes("away"))) {
      return htScore.home > htScore.away ? "won" : "lost";
    }
    if (p.includes(": x") || (p.includes("draw") && p.includes("half"))) {
      return htScore.home === htScore.away ? "won" : "lost";
    }
    if (p.includes(": 2") || (p.includes("away") && !p.includes("home"))) {
      return htScore.away > htScore.home ? "won" : "lost";
    }
  }

  if (p.includes("both teams") || p.includes("btts")) {
    if (p.includes("yes")) return (ftScore.home > 0 && ftScore.away > 0) ? "won" : "lost";
    if (p.includes("no"))  return (ftScore.home === 0 || ftScore.away === 0) ? "won" : "lost";
  }

  const overM = p.match(/over[: ]+(\d+\.?\d*)/);
  if (overM) return total > parseFloat(overM[1]) ? "won" : "lost";
  const underM = p.match(/under[: ]+(\d+\.?\d*)/);
  if (underM) return total < parseFloat(underM[1]) ? "won" : "lost";

  if (p.includes("draw no bet")) {
    if (ftScore.home === ftScore.away) return "pending";
    if (p.includes("home")) return ftScore.home > ftScore.away ? "won" : "lost";
    if (p.includes("away")) return ftScore.away > ftScore.home ? "won" : "lost";
  }

  if (p.includes("1x") || p.includes("home or draw")) return (ftScore.home >= ftScore.away) ? "won" : "lost";
  if (p.includes("x2") || p.includes("away or draw")) return (ftScore.away >= ftScore.home) ? "won" : "lost";
  if (p.includes(": 12")  || p.includes("home or away")) return ftScore.home !== ftScore.away ? "won" : "lost";

  if (p.includes("match result: 1")) return ftScore.home > ftScore.away ? "won" : "lost";
  if (p.includes("match result: x")) return ftScore.home === ftScore.away ? "won" : "lost";
  if (p.includes("match result: 2")) return ftScore.away > ftScore.home ? "won" : "lost";

  return "pending";
}

export function canResolveAtHalfTime(sel: SelectionData): boolean {
  const { tt } = parseId(sel.id);
  const p = sel.pick.toLowerCase();
  if (p.includes("1st half") || p.includes("halftime") || (p.includes("half") && !p.includes("half time score"))) return true;
  if (tt !== null && [101,102,103,104,105,106,107,108,109,110].includes(tt)) return true;
  return false;
}

export function canResolveEarlyBttsYes(sel: SelectionData, liveScore: { home: number; away: number }): boolean {
  const p = sel.pick.toLowerCase();
  if ((p.includes("both teams") || p.includes("btts")) && p.includes("yes")) {
    return liveScore.home > 0 && liveScore.away > 0;
  }
  const { tt } = parseId(sel.id);
  if (tt === 264) return liveScore.home > 0 && liveScore.away > 0;
  return false;
}

export function estimateCurrentOdds(
  sel: SelectionData,
  liveScore: { home: number; away: number; period: string },
): number {
  const { marketKey: mk } = parseId(sel.id);
  const effectiveKey = sel.marketKey ?? mk;
  const { home, away, period } = liveScore;
  const isLate = period === "SECOND_HALF";

  let winProb = 0.5;

  if (effectiveKey === "home") {
    if (home > away)       winProb = isLate ? 0.82 : 0.70;
    else if (home === away) winProb = isLate ? 0.38 : 0.45;
    else                   winProb = isLate ? 0.15 : 0.25;
  } else if (effectiveKey === "draw") {
    winProb = home === away ? (isLate ? 0.55 : 0.40) : (isLate ? 0.10 : 0.20);
  } else if (effectiveKey === "away") {
    if (away > home)       winProb = isLate ? 0.82 : 0.70;
    else if (home === away) winProb = isLate ? 0.38 : 0.45;
    else                   winProb = isLate ? 0.15 : 0.25;
  } else {
    const p = sel.pick.toLowerCase();
    const total = home + away;
    const overM = p.match(/over[: ]+(\d+\.?\d*)/);
    const underM = p.match(/under[: ]+(\d+\.?\d*)/);
    if (overM) {
      const thr = parseFloat(overM[1]);
      const rem = thr - total;
      if (rem <= 0) winProb = 0.97;
      else winProb = isLate ? (rem <= 1 ? 0.4 : 0.2) : 0.5;
    } else if (underM) {
      const thr = parseFloat(underM[1]);
      if (total >= thr) winProb = 0.02;
      else winProb = isLate ? 0.80 : 0.5;
    } else if (p.includes("both teams") && p.includes("yes")) {
      if (home > 0 && away > 0) winProb = 0.97;
      else winProb = isLate ? 0.25 : 0.5;
    } else if (p.includes("both teams") && p.includes("no")) {
      if (home > 0 && away > 0) winProb = 0.02;
      else winProb = isLate ? 0.75 : 0.5;
    }
  }

  return Math.max(1.01, 1 / Math.max(0.01, winProb));
}
