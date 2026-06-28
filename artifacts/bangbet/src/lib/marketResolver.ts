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
): Resolution {
  const { marketKey: mk, tt, sv } = parseId(sel.id);
  const effectiveKey = sel.marketKey ?? mk;
  const p = sel.pick.toLowerCase();
  const total = ftScore.home + ftScore.away;

  if (effectiveKey === "home") return ftScore.home > ftScore.away ? "won" : "lost";
  if (effectiveKey === "draw") return ftScore.home === ftScore.away ? "won" : "lost";
  if (effectiveKey === "away") return ftScore.away > ftScore.home ? "won" : "lost";
  if (effectiveKey === "1x") return ftScore.home >= ftScore.away ? "won" : "lost";
  if (effectiveKey === "x2") return ftScore.away >= ftScore.home ? "won" : "lost";
  if (effectiveKey === "12") return ftScore.home !== ftScore.away ? "won" : "lost";

  if (tt === null) return resolveByText(p, ftScore, htScore, total);

  if (tt === 1) return ftScore.home > ftScore.away ? "won" : "lost";
  if (tt === 2) return ftScore.home === ftScore.away ? "won" : "lost";
  if (tt === 3) return ftScore.away > ftScore.home ? "won" : "lost";

  if (tt === 4) return ftScore.home >= ftScore.away ? "won" : "lost";
  if (tt === 5) return ftScore.away >= ftScore.home ? "won" : "lost";
  if (tt === 6) return ftScore.home !== ftScore.away ? "won" : "lost";

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

  if (tt === 227) { const t = parseThr(sv); return isNaN(t) ? "pending" : total > t ? "won" : "lost"; }
  if (tt === 228) { const t = parseThr(sv); return isNaN(t) ? "pending" : total < t ? "won" : "lost"; }
  if (tt === 229) { const t = parseThr(sv); return isNaN(t) ? "pending" : ftScore.home > t ? "won" : "lost"; }
  if (tt === 230) { const t = parseThr(sv); return isNaN(t) ? "pending" : ftScore.home < t ? "won" : "lost"; }
  if (tt === 390) { const t = parseThr(sv); return isNaN(t) ? "pending" : ftScore.away > t ? "won" : "lost"; }
  if (tt === 392) { const t = parseThr(sv); return isNaN(t) ? "pending" : ftScore.away < t ? "won" : "lost"; }

  if (tt === 291) return ftScore.away === 0 ? "won" : "lost";
  if (tt === 292) return ftScore.home === 0 ? "won" : "lost";
  if (tt === 299) return (ftScore.home > ftScore.away && ftScore.away === 0) ? "won" : "lost";
  if (tt === 300) return (ftScore.away > ftScore.home && ftScore.home === 0) ? "won" : "lost";

  if (tt === 526) return ftScore.home > ftScore.away ? "won" : "lost";
  if (tt === 528) return ftScore.home === ftScore.away ? "won" : "lost";
  if (tt === 529 || tt === 531) return ftScore.away > ftScore.home ? "won" : "lost";

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

  const csMap: Record<number, [number, number]> = {
    10: [1, 0], 11: [2, 0], 12: [3, 0], 13: [2, 1], 14: [3, 1], 15: [0, 0],
    16: [0, 1], 17: [0, 2], 18: [1, 1], 379: [0, 0], 380: [0, 1], 381: [1, 0], 382: [1, 1],
  };
  if (csMap[tt]) {
    const [h, a] = csMap[tt];
    return (ftScore.home === h && ftScore.away === a) ? "won" : "lost";
  }

  if (htScore) {
    const htTotal = htScore.home + htScore.away;
    const sh = { home: ftScore.home - htScore.home, away: ftScore.away - htScore.away };
    const shTotal = sh.home + sh.away;

    if (tt === 7  || tt === 284) return htScore.home > htScore.away ? "won" : "lost";
    if (tt === 8  || tt === 285) return htScore.home === htScore.away ? "won" : "lost";
    if (tt === 9  || tt === 286) return htScore.away > htScore.home ? "won" : "lost";
    if (tt === 323) return htScore.home >= htScore.away ? "won" : "lost";
    if (tt === 324) return htScore.away >= htScore.home ? "won" : "lost";
    if (tt === 484) return htScore.home !== htScore.away ? "won" : "lost";
    if (tt === 355) { const t = parseThr(sv); return isNaN(t) ? "pending" : htTotal > t ? "won" : "lost"; }
    if (tt === 356) { const t = parseThr(sv); return isNaN(t) ? "pending" : htTotal < t ? "won" : "lost"; }
    if (tt === 325 || tt === 481) return sh.home > sh.away ? "won" : "lost";
    if (tt === 326 || tt === 482) return sh.home === sh.away ? "won" : "lost";
    if (tt === 485 || tt === 483) return sh.away > sh.home ? "won" : "lost";
    if (tt === 357) { const t = parseThr(sv); return isNaN(t) ? "pending" : shTotal > t ? "won" : "lost"; }
    if (tt === 358) { const t = parseThr(sv); return isNaN(t) ? "pending" : shTotal < t ? "won" : "lost"; }
    const htft = HTFT[tt];
    if (htft) return (side(htScore) === htft.ht && side(ftScore) === htft.ft) ? "won" : "lost";
    if (tt === 611) return (htScore.home > 0 && htScore.away > 0) ? "won" : "lost";
    if (tt === 612) return (htScore.home === 0 || htScore.away === 0) ? "won" : "lost";
    if (tt === 613) return (sh.home > 0 && sh.away > 0) ? "won" : "lost";
    if (tt === 614) return (sh.home === 0 || sh.away === 0) ? "won" : "lost";
  } else {
    if ([7,8,9,284,285,286,323,324,325,326,355,356,357,358,
         481,482,483,484,485,608,609,610,611,612,613,614,615,616].includes(tt)) return "pending";
  }

  const cornerCardTT = new Set([268,270,282,283,287,288,315,341,343,345,347,
    400,401,557,559,570,572,575,577,776,777,778,779,781,782,783,784,50232,50233]);
  if (cornerCardTT.has(tt)) return "pending";

  return resolveByText(p, ftScore, htScore, total);
}

function resolveByText(
  p: string,
  ftScore: { home: number; away: number },
  htScore: { home: number; away: number } | null,
  total: number,
): Resolution {
  if (htScore && (p.includes("1st half") || p.includes("halftime") || (p.includes("half") && !p.includes("half time score")))) {
    if (p.includes(": 1") || (p.includes("home") && !p.includes("away"))) return htScore.home > htScore.away ? "won" : "lost";
    if (p.includes(": x") || (p.includes("draw") && p.includes("half"))) return htScore.home === htScore.away ? "won" : "lost";
    if (p.includes(": 2") || (p.includes("away") && !p.includes("home"))) return htScore.away > htScore.home ? "won" : "lost";
  }
  if (p.includes("both teams") || p.includes("btts")) {
    if (p.includes("yes")) return (ftScore.home > 0 && ftScore.away > 0) ? "won" : "lost";
    if (p.includes("no")) return (ftScore.home === 0 || ftScore.away === 0) ? "won" : "lost";
  }
  const homeOverM = p.match(/home team[^:]*over[: ]+(\d+\.?\d*)/);
  if (homeOverM) return ftScore.home > parseFloat(homeOverM[1]) ? "won" : "lost";
  const homeUnderM = p.match(/home team[^:]*under[: ]+(\d+\.?\d*)/);
  if (homeUnderM) return ftScore.home < parseFloat(homeUnderM[1]) ? "won" : "lost";
  const awayOverM = p.match(/away team[^:]*over[: ]+(\d+\.?\d*)/);
  if (awayOverM) return ftScore.away > parseFloat(awayOverM[1]) ? "won" : "lost";
  const awayUnderM = p.match(/away team[^:]*under[: ]+(\d+\.?\d*)/);
  if (awayUnderM) return ftScore.away < parseFloat(awayUnderM[1]) ? "won" : "lost";
  const overM = p.match(/over[: ]+(\d+\.?\d*)/);
  if (overM) return total > parseFloat(overM[1]) ? "won" : "lost";
  const underM = p.match(/under[: ]+(\d+\.?\d*)/);
  if (underM) return total < parseFloat(underM[1]) ? "won" : "lost";
  if (p.includes("draw no bet")) {
    if (ftScore.home === ftScore.away) return "pending";
    if (p.includes("home")) return ftScore.home > ftScore.away ? "won" : "lost";
    if (p.includes("away")) return ftScore.away > ftScore.home ? "won" : "lost";
  }
  if (p.includes("1x") || p.includes("home or draw")) return ftScore.home >= ftScore.away ? "won" : "lost";
  if (p.includes("x2") || p.includes("away or draw")) return ftScore.away >= ftScore.home ? "won" : "lost";
  if (p.includes(": 12") || p.includes("home or away")) return ftScore.home !== ftScore.away ? "won" : "lost";
  if (p.includes("match result: 1")) return ftScore.home > ftScore.away ? "won" : "lost";
  if (p.includes("match result: x")) return ftScore.home === ftScore.away ? "won" : "lost";
  if (p.includes("match result: 2")) return ftScore.away > ftScore.home ? "won" : "lost";
  return "pending";
}

export function canResolveEarlyBttsYes(sel: SelectionData, liveScore: { home: number; away: number }): boolean {
  const p = sel.pick.toLowerCase();
  if ((p.includes("both teams") || p.includes("btts")) && p.includes("yes")) {
    return liveScore.home > 0 && liveScore.away > 0;
  }
  const { tt } = parseId(sel.id);
  return tt === 264 && liveScore.home > 0 && liveScore.away > 0;
}
