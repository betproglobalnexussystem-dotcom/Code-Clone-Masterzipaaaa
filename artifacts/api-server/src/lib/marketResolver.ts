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

  if (["home", "draw", "away"].includes(last)) return { marketKey: last, tt: null, sv: null };

  const tt = parseInt(secondLast, 10);
  if (!isNaN(tt)) return { marketKey: null, tt, sv: last };

  return { marketKey: null, tt: null, sv: null };
}

/**
 * Extract a numeric threshold from sv strings like "total=2.5", "2.5", "NULL", etc.
 * The topbet.ug API encodes over/under thresholds as e.g. "total=2.5".
 */
function parseThr(sv: string | null | undefined): number {
  if (!sv) return NaN;
  const m = sv.match(/(\d+\.?\d*)/);
  return m ? parseFloat(m[1]) : NaN;
}

type Side = "H" | "D" | "A";

function side(score: { home: number; away: number }): Side {
  return score.home > score.away ? "H" : score.home < score.away ? "A" : "D";
}

const HTFT: Record<number, { ht: Side; ft: Side }> = {
  608: { ht: "H", ft: "H" }, 609: { ht: "H", ft: "D" }, 610: { ht: "H", ft: "A" },
  611: { ht: "D", ft: "H" }, 612: { ht: "D", ft: "D" }, 613: { ht: "D", ft: "A" },
  614: { ht: "A", ft: "H" }, 615: { ht: "A", ft: "D" }, 616: { ht: "A", ft: "A" },
};

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

  // ── marketKey-based 1X2 (MatchCard & main odds on detail page) ──────────
  if (effectiveKey === "home") return ftScore.home > ftScore.away ? "won" : "lost";
  if (effectiveKey === "draw") return ftScore.home === ftScore.away ? "won" : "lost";
  if (effectiveKey === "away") return ftScore.away > ftScore.home ? "won" : "lost";

  if (tt === null) return resolveByText(p, ftScore, htScore, total);

  // ── Full Time Result (1X2) ──────────────────────────────────────────────
  if (tt === 1) return ftScore.home > ftScore.away ? "won" : "lost";
  if (tt === 2) return ftScore.home === ftScore.away ? "won" : "lost";
  if (tt === 3) return ftScore.away > ftScore.home ? "won" : "lost";

  // ── Double Chance (Full Time) ──────────────────────────────────────────
  if (tt === 4) return ftScore.home >= ftScore.away ? "won" : "lost";   // 1X
  if (tt === 5) return ftScore.away >= ftScore.home ? "won" : "lost";   // X2
  if (tt === 6) return ftScore.home !== ftScore.away ? "won" : "lost";  // 12

  // ── Both Teams to Score ────────────────────────────────────────────────
  if (tt === 264) return (ftScore.home > 0 && ftScore.away > 0) ? "won" : "lost";
  if (tt === 265) return (ftScore.home === 0 || ftScore.away === 0) ? "won" : "lost";

  // ── Draw No Bet (Full Time) ────────────────────────────────────────────
  if (tt === 235) {
    if (ftScore.home === ftScore.away) return "pending";
    return ftScore.home > ftScore.away ? "won" : "lost";
  }
  if (tt === 237) {
    if (ftScore.home === ftScore.away) return "pending";
    return ftScore.away > ftScore.home ? "won" : "lost";
  }

  // ── Total Goals Over/Under (sv = "total=X.X") ──────────────────────────
  if (tt === 227) { const t = parseThr(sv); return isNaN(t) ? "pending" : total > t ? "won" : "lost"; }
  if (tt === 228) { const t = parseThr(sv); return isNaN(t) ? "pending" : total < t ? "won" : "lost"; }

  // ── Home Team Goals Over/Under ─────────────────────────────────────────
  if (tt === 229) { const t = parseThr(sv); return isNaN(t) ? "pending" : ftScore.home > t ? "won" : "lost"; }
  if (tt === 230) { const t = parseThr(sv); return isNaN(t) ? "pending" : ftScore.home < t ? "won" : "lost"; }

  // ── Away Team Goals Over/Under ─────────────────────────────────────────
  if (tt === 390) { const t = parseThr(sv); return isNaN(t) ? "pending" : ftScore.away > t ? "won" : "lost"; }
  if (tt === 392) { const t = parseThr(sv); return isNaN(t) ? "pending" : ftScore.away < t ? "won" : "lost"; }

  // ── Clean Sheet ────────────────────────────────────────────────────────
  if (tt === 291) return ftScore.away === 0 ? "won" : "lost"; // Home clean sheet
  if (tt === 292) return ftScore.home === 0 ? "won" : "lost"; // Away clean sheet

  // ── Win to Nil ─────────────────────────────────────────────────────────
  if (tt === 299) return (ftScore.home > ftScore.away && ftScore.away === 0) ? "won" : "lost";
  if (tt === 300) return (ftScore.away > ftScore.home && ftScore.home === 0) ? "won" : "lost";

  // ── Handicap Result ────────────────────────────────────────────────────
  if (tt === 526) return ftScore.home > ftScore.away ? "won" : "lost";
  if (tt === 528) return ftScore.home === ftScore.away ? "won" : "lost";
  if (tt === 529 || tt === 531) return ftScore.away > ftScore.home ? "won" : "lost";

  // ── BTTS + Result combinations ─────────────────────────────────────────
  {
    const btts = ftScore.home > 0 && ftScore.away > 0;
    const noBtts = !btts;
    if (tt === 23)  return (ftScore.home > ftScore.away && btts) ? "won" : "lost";
    if (tt === 26)  return (ftScore.away > ftScore.home && btts) ? "won" : "lost";
    if (tt === 220) return (ftScore.home === ftScore.away && btts) ? "won" : "lost";
    if (tt === 243) return (ftScore.home > ftScore.away && noBtts) ? "won" : "lost";
    if (tt === 244) return (ftScore.away > ftScore.home && noBtts) ? "won" : "lost";
    if (tt === 278) return (ftScore.home > ftScore.away && btts) ? "won" : "lost";
    if (tt === 279) return (ftScore.home === ftScore.away && btts) ? "won" : "lost";
    if (tt === 280) return (ftScore.away > ftScore.home && btts) ? "won" : "lost";
    if (tt === 379) return (ftScore.home > ftScore.away && noBtts) ? "won" : "lost";
    if (tt === 380) return (ftScore.home === ftScore.away && noBtts) ? "won" : "lost";
    if (tt === 381) return (ftScore.away > ftScore.home && noBtts) ? "won" : "lost";
    if (tt === 402) return (btts && ftScore.home > ftScore.away) ? "won" : "lost";
    if (tt === 403) return (btts && ftScore.away > ftScore.home) ? "won" : "lost";
    if (tt === 532) return (btts && ftScore.home === ftScore.away) ? "won" : "lost";
    if (tt === 533) return noBtts ? "won" : "lost";
  }

  // ── Half-time dependent markets ────────────────────────────────────────
  if (htScore) {
    const htTotal = htScore.home + htScore.away;
    const sh = { home: ftScore.home - htScore.home, away: ftScore.away - htScore.away };
    const shTotal = sh.home + sh.away;

    // 1st Half Result
    if (tt === 7  || tt === 284) return htScore.home > htScore.away ? "won" : "lost";
    if (tt === 8  || tt === 285) return htScore.home === htScore.away ? "won" : "lost";
    if (tt === 9  || tt === 286) return htScore.away > htScore.home ? "won" : "lost";

    // 1st Half Double Chance
    if (tt === 323) return htScore.home >= htScore.away ? "won" : "lost";
    if (tt === 324) return htScore.away >= htScore.home ? "won" : "lost";
    if (tt === 484) return htScore.home !== htScore.away ? "won" : "lost";

    // 1st Half Over/Under (sv = "total=X.X")
    if (tt === 355) { const t = parseThr(sv); return isNaN(t) ? "pending" : htTotal > t ? "won" : "lost"; }
    if (tt === 356) { const t = parseThr(sv); return isNaN(t) ? "pending" : htTotal < t ? "won" : "lost"; }

    // 2nd Half Result
    if (tt === 325 || tt === 481) return sh.home > sh.away ? "won" : "lost";
    if (tt === 326 || tt === 482) return sh.home === sh.away ? "won" : "lost";
    if (tt === 485 || tt === 483) return sh.away > sh.home ? "won" : "lost";

    // 2nd Half Over/Under
    if (tt === 357) { const t = parseThr(sv); return isNaN(t) ? "pending" : shTotal > t ? "won" : "lost"; }
    if (tt === 358) { const t = parseThr(sv); return isNaN(t) ? "pending" : shTotal < t ? "won" : "lost"; }

    // HT/FT Result
    const htft = HTFT[tt];
    if (htft) {
      return (side(htScore) === htft.ht && side(ftScore) === htft.ft) ? "won" : "lost";
    }

    // HT BTTS
    if (tt === 611) return (htScore.home > 0 && htScore.away > 0) ? "won" : "lost";
    if (tt === 612) return (htScore.home === 0 || htScore.away === 0) ? "won" : "lost";
    // 2nd Half BTTS
    if (tt === 613) return (sh.home > 0 && sh.away > 0) ? "won" : "lost";
    if (tt === 614) return (sh.home === 0 || sh.away === 0) ? "won" : "lost";
  } else {
    // HT score not yet available — can't resolve HT-dependent markets
    if ([7, 8, 9, 284, 285, 286, 323, 324, 325, 326, 355, 356, 357, 358,
         481, 482, 483, 484, 485, 608, 609, 610, 611, 612, 613, 614, 615, 616].includes(tt)) {
      return "pending";
    }
  }

  // ── Correct Score (spot-check most common) ─────────────────────────────
  const csMap: Record<number, [number, number]> = {
    10: [1, 0], 11: [2, 0], 12: [3, 0],
    13: [2, 1], 14: [3, 1], 15: [0, 0],
    16: [0, 1], 17: [0, 2], 18: [1, 1],
    379: [0, 0], 380: [0, 1], 381: [1, 0], 382: [1, 1],
  };
  if (csMap[tt]) {
    const [h, a] = csMap[tt];
    return (ftScore.home === h && ftScore.away === a) ? "won" : "lost";
  }

  // ── Corners / Cards Over/Under ─────────────────────────────────────────
  // These need dedicated score types from the results API (FULLTIME_CORNERS, FULLTIME_YC, etc.)
  // For now we can't resolve them without that data, so return pending.
  const cornerCardTT = new Set([268, 270, 282, 283, 287, 288, 315, 341, 343, 345, 347,
    400, 401, 557, 559, 570, 572, 575, 577, 776, 777, 778, 779, 781, 782, 783, 784,
    50232, 50233]);
  if (cornerCardTT.has(tt)) return "pending";

  // ── Text fallback ───────────────────────────────────────────────────────
  return resolveByText(p, ftScore, htScore, total);
}

function resolveByText(
  p: string,
  ftScore: { home: number; away: number },
  htScore: { home: number; away: number } | null,
  total: number,
): Resolution {
  // Half-time based
  if (htScore && (p.includes("1st half") || p.includes("halftime") || (p.includes("half") && !p.includes("half time score")))) {
    if (p.includes(": 1") || (p.includes("home") && !p.includes("away"))) return htScore.home > htScore.away ? "won" : "lost";
    if (p.includes(": x") || (p.includes("draw") && p.includes("half"))) return htScore.home === htScore.away ? "won" : "lost";
    if (p.includes(": 2") || (p.includes("away") && !p.includes("home"))) return htScore.away > htScore.home ? "won" : "lost";
  }

  // BTTS
  if (p.includes("both teams") || p.includes("btts")) {
    if (p.includes("yes")) return (ftScore.home > 0 && ftScore.away > 0) ? "won" : "lost";
    if (p.includes("no"))  return (ftScore.home === 0 || ftScore.away === 0) ? "won" : "lost";
  }

  // Home team goals
  if (p.includes("home team") || p.includes("home team over") || p.includes("home team under")) {
    const overM = p.match(/home team[^:]*over[: ]+(\d+\.?\d*)/);
    if (overM) return ftScore.home > parseFloat(overM[1]) ? "won" : "lost";
    const underM = p.match(/home team[^:]*under[: ]+(\d+\.?\d*)/);
    if (underM) return ftScore.home < parseFloat(underM[1]) ? "won" : "lost";
  }

  // Away team goals
  if (p.includes("away team") || p.includes("away team over") || p.includes("away team under")) {
    const overM = p.match(/away team[^:]*over[: ]+(\d+\.?\d*)/);
    if (overM) return ftScore.away > parseFloat(overM[1]) ? "won" : "lost";
    const underM = p.match(/away team[^:]*under[: ]+(\d+\.?\d*)/);
    if (underM) return ftScore.away < parseFloat(underM[1]) ? "won" : "lost";
  }

  // Total over/under
  const overM = p.match(/over[: ]+(\d+\.?\d*)/);
  if (overM) return total > parseFloat(overM[1]) ? "won" : "lost";
  const underM = p.match(/under[: ]+(\d+\.?\d*)/);
  if (underM) return total < parseFloat(underM[1]) ? "won" : "lost";

  // Draw No Bet text
  if (p.includes("draw no bet")) {
    if (ftScore.home === ftScore.away) return "pending";
    if (p.includes("home")) return ftScore.home > ftScore.away ? "won" : "lost";
    if (p.includes("away")) return ftScore.away > ftScore.home ? "won" : "lost";
  }

  // Double chance text
  if (p.includes("1x") || p.includes("home or draw")) return ftScore.home >= ftScore.away ? "won" : "lost";
  if (p.includes("x2") || p.includes("away or draw")) return ftScore.away >= ftScore.home ? "won" : "lost";
  if (p.includes(": 12") || p.includes("home or away")) return ftScore.home !== ftScore.away ? "won" : "lost";

  // 1X2 text
  if (p.includes("match result: 1")) return ftScore.home > ftScore.away ? "won" : "lost";
  if (p.includes("match result: x")) return ftScore.home === ftScore.away ? "won" : "lost";
  if (p.includes("match result: 2")) return ftScore.away > ftScore.home ? "won" : "lost";

  return "pending";
}

export function canResolveAtHalfTime(sel: SelectionData): boolean {
  const { tt } = parseId(sel.id);
  const p = sel.pick.toLowerCase();
  if (p.includes("1st half") || p.includes("halftime") || (p.includes("half") && !p.includes("half time score"))) return true;
  if (tt !== null && [7, 8, 9, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 284, 285, 286, 323, 324, 355, 356].includes(tt)) return true;
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
  const { marketKey: mk, tt } = parseId(sel.id);
  const effectiveKey = sel.marketKey ?? mk;
  const { home, away, period } = liveScore;
  const isLate = period === "SECOND_HALF";
  const total = home + away;

  let winProb = 0.5;

  if (effectiveKey === "home" || tt === 1) {
    winProb = home > away ? (isLate ? 0.82 : 0.70) : home === away ? (isLate ? 0.38 : 0.45) : (isLate ? 0.15 : 0.25);
  } else if (effectiveKey === "draw" || tt === 2) {
    winProb = home === away ? (isLate ? 0.55 : 0.40) : (isLate ? 0.10 : 0.20);
  } else if (effectiveKey === "away" || tt === 3) {
    winProb = away > home ? (isLate ? 0.82 : 0.70) : home === away ? (isLate ? 0.38 : 0.45) : (isLate ? 0.15 : 0.25);
  } else if (tt === 4) {
    winProb = home >= away ? (isLate ? 0.88 : 0.75) : (isLate ? 0.25 : 0.40);
  } else if (tt === 5) {
    winProb = away >= home ? (isLate ? 0.88 : 0.75) : (isLate ? 0.25 : 0.40);
  } else if (tt === 6) {
    winProb = home !== away ? (isLate ? 0.88 : 0.78) : (isLate ? 0.12 : 0.22);
  } else if (tt === 264) {
    winProb = (home > 0 && away > 0) ? 0.97 : (isLate ? 0.25 : 0.5);
  } else if (tt === 265) {
    winProb = (home === 0 || away === 0) ? (isLate ? 0.80 : 0.55) : 0.03;
  } else {
    const p = sel.pick.toLowerCase();
    const overM = p.match(/over[: ]+(\d+\.?\d*)/);
    const underM = p.match(/under[: ]+(\d+\.?\d*)/);
    if (tt === 227 || tt === 229 || tt === 390 || overM) {
      const thr = tt === 227 || tt === 229 || tt === 390 ? parseThr(parseId(sel.id).sv) : overM ? parseFloat(overM[1]) : 2.5;
      const rem = thr - total;
      if (rem <= 0) winProb = 0.97;
      else winProb = isLate ? (rem <= 1 ? 0.4 : 0.2) : 0.5;
    } else if (tt === 228 || tt === 230 || tt === 392 || underM) {
      const thr = tt === 228 || tt === 230 || tt === 392 ? parseThr(parseId(sel.id).sv) : underM ? parseFloat(underM[1]) : 2.5;
      if (total >= thr) winProb = 0.02;
      else winProb = isLate ? 0.80 : 0.5;
    }
  }

  return Math.max(1.01, 1 / Math.max(0.01, winProb));
}
