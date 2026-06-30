import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// ---------------------------------------------------------------------------
// Firebase Admin — initialised once per cold start
// ---------------------------------------------------------------------------
function getDb() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_ADMIN_CREDENTIALS;
    if (!raw) throw new Error("FIREBASE_ADMIN_CREDENTIALS env var not set");
    initializeApp({ credential: cert(JSON.parse(raw)) });
  }
  return getFirestore();
}

// ---------------------------------------------------------------------------
// In-memory results cache (reused across invocations in the same container)
// ---------------------------------------------------------------------------
const _cache = new Map<string, { byId: Map<number, any>; fetchedAt: number }>();
const CACHE_TTL = 30_000;

function dateKey(ts: number): string {
  const d = new Date(ts);
  return (
    String(d.getDate()).padStart(2, "0") +
    "_" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "_" +
    d.getFullYear()
  );
}

async function dayResults(dk: string): Promise<Map<number, any>> {
  const now = Date.now();
  const hit = _cache.get(dk);
  if (hit && now - hit.fetchedAt < CACHE_TTL) return hit.byId;
  try {
    const url = `https://www.topbet.ug/restapi/results/en/day/${dk}?desktopVersion=1.45.4.37&locale=en`;
    const res = await fetch(url, {
      headers: { Accept: "application/json", "x-requested-with": "XMLHttpRequest" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return hit?.byId ?? new Map();
    const json = (await res.json()) as { resultsMap?: Record<string, any[]> };
    const byId = new Map<number, any>();
    for (const arr of Object.values(json.resultsMap ?? {})) {
      for (const m of arr) {
        byId.set(m.id, m);
        if (m.matchCode) byId.set(m.matchCode, m);
      }
    }
    _cache.set(dk, { byId, fetchedAt: now });
    return byId;
  } catch {
    return hit?.byId ?? new Map();
  }
}

// ---------------------------------------------------------------------------
// Score helpers
// ---------------------------------------------------------------------------
function numOrNull(v: unknown): number | null {
  const n = Number(v);
  return isNaN(n) ? null : n;
}
function scoreFrom(m: any, keys: string[]): { home: number; away: number } | null {
  const hs = m.matchResult?.hs ?? {};
  const as_ = m.matchResult?.as ?? {};
  for (const k of keys) {
    const h = numOrNull(hs[k]);
    const a = numOrNull(as_[k]);
    if (h !== null && a !== null) return { home: h, away: a };
  }
  return null;
}

const FT_KEYS = ["FULLTIME", "FULLTIME_SETS", "FULLTIME_PERIODS", "CURRENT_SCORE"];
const PLAYING = new Set([
  "FIRST_HALF","SECOND_HALF","PAUSE","FIRST_QUARTER","SECOND_QUARTER",
  "THIRD_QUARTER","FOURTH_QUARTER","FIRST_PERIOD","SECOND_PERIOD","THIRD_PERIOD",
  "FIRST_SET","SECOND_SET","THIRD_SET","FOURTH_SET","FIFTH_SET","IN_PROGRESS",
]);

const isEnded      = (m: any) => (m.status === 1 || m.status === 6) && m.matchResult?.p === "END";
const isLive       = (m: any) => m.status === 6 && PLAYING.has(m.matchResult?.p ?? "");
const isPostponed  = (m: any) => m.status === 3;
const isAbandoned  = (m: any) => m.status === 7;

// ---------------------------------------------------------------------------
// Selection resolver (mirrors marketResolver.ts)
// ---------------------------------------------------------------------------
function parseThr(sv: string | null | undefined): number {
  const mt = sv?.match(/(\d+\.?\d*)/);
  return mt ? parseFloat(mt[1]) : NaN;
}
function parseId(id: string) {
  const parts = id.split("-");
  const last = parts[parts.length - 1];
  const secondLast = parts[parts.length - 2];
  if (["home","draw","away"].includes(last)) return { mk: last, tt: null, sv: null };
  const tt = parseInt(secondLast, 10);
  if (!isNaN(tt)) return { mk: null, tt, sv: last };
  return { mk: null, tt: null, sv: null };
}
function side(s: { home: number; away: number }) {
  return s.home > s.away ? "H" : s.home < s.away ? "A" : "D";
}
const HTFT: Record<number,{ht:string;ft:string}> = {
  608:{ht:"H",ft:"H"},609:{ht:"H",ft:"D"},610:{ht:"H",ft:"A"},
  611:{ht:"D",ft:"H"},612:{ht:"D",ft:"D"},613:{ht:"D",ft:"A"},
  614:{ht:"A",ft:"H"},615:{ht:"A",ft:"D"},616:{ht:"A",ft:"A"},
};

function resolveByText(
  p: string,
  ft: {home:number;away:number},
  ht: {home:number;away:number}|null,
  total: number,
): string {
  if (ht && (p.includes("1st half") || p.includes("halftime") || (p.includes("half") && !p.includes("half time score")))) {
    if (p.includes(": 1") || (p.includes("home") && !p.includes("away"))) return ht.home > ht.away ? "won" : "lost";
    if (p.includes(": x") || (p.includes("draw") && p.includes("half")))   return ht.home === ht.away ? "won" : "lost";
    if (p.includes(": 2") || (p.includes("away") && !p.includes("home")))  return ht.away > ht.home ? "won" : "lost";
  }
  if (p.includes("both teams") || p.includes("btts")) {
    if (p.includes("yes")) return ft.home > 0 && ft.away > 0 ? "won" : "lost";
    if (p.includes("no"))  return ft.home === 0 || ft.away === 0 ? "won" : "lost";
  }
  const overM  = p.match(/over[: ]+(\d+\.?\d*)/);  if (overM)  return total > parseFloat(overM[1])  ? "won" : "lost";
  const underM = p.match(/under[: ]+(\d+\.?\d*)/); if (underM) return total < parseFloat(underM[1]) ? "won" : "lost";
  if (p.includes("1x") || p.includes("home or draw"))  return ft.home >= ft.away ? "won" : "lost";
  if (p.includes("x2") || p.includes("away or draw"))  return ft.away >= ft.home ? "won" : "lost";
  if (p.includes(": 12") || p.includes("home or away")) return ft.home !== ft.away ? "won" : "lost";
  if (p.includes("match result: 1")) return ft.home > ft.away ? "won" : "lost";
  if (p.includes("match result: x")) return ft.home === ft.away ? "won" : "lost";
  if (p.includes("match result: 2")) return ft.away > ft.home ? "won" : "lost";
  return "pending";
}

function resolveSelection(
  sel: any,
  ft: {home:number;away:number},
  ht: {home:number;away:number}|null,
): string {
  const { mk, tt, sv } = parseId(sel.id);
  const ek = sel.marketKey ?? mk;
  const p = sel.pick.toLowerCase();
  const total = ft.home + ft.away;

  if (ek === "home")  return ft.home > ft.away  ? "won" : "lost";
  if (ek === "draw")  return ft.home === ft.away ? "won" : "lost";
  if (ek === "away")  return ft.away > ft.home   ? "won" : "lost";
  if (ek === "1x")    return ft.home >= ft.away  ? "won" : "lost";
  if (ek === "x2")    return ft.away >= ft.home  ? "won" : "lost";
  if (ek === "12")    return ft.home !== ft.away  ? "won" : "lost";

  if (tt === null) return resolveByText(p, ft, ht, total);

  if (tt===1)   return ft.home > ft.away  ? "won":"lost";
  if (tt===2)   return ft.home === ft.away ? "won":"lost";
  if (tt===3)   return ft.away > ft.home  ? "won":"lost";
  if (tt===4)   return ft.home >= ft.away  ? "won":"lost";
  if (tt===5)   return ft.away >= ft.home  ? "won":"lost";
  if (tt===6)   return ft.home !== ft.away  ? "won":"lost";
  if (tt===264) return (ft.home>0 && ft.away>0)  ? "won":"lost";
  if (tt===265) return (ft.home===0||ft.away===0) ? "won":"lost";
  if (tt===235) { if(ft.home===ft.away)return"pending"; return ft.home>ft.away?"won":"lost"; }
  if (tt===237) { if(ft.home===ft.away)return"pending"; return ft.away>ft.home?"won":"lost"; }
  if (tt===227){const t=parseThr(sv);return isNaN(t)?"pending":total>t?"won":"lost";}
  if (tt===228){const t=parseThr(sv);return isNaN(t)?"pending":total<t?"won":"lost";}
  if (tt===229){const t=parseThr(sv);return isNaN(t)?"pending":ft.home>t?"won":"lost";}
  if (tt===230){const t=parseThr(sv);return isNaN(t)?"pending":ft.home<t?"won":"lost";}
  if (tt===390){const t=parseThr(sv);return isNaN(t)?"pending":ft.away>t?"won":"lost";}
  if (tt===392){const t=parseThr(sv);return isNaN(t)?"pending":ft.away<t?"won":"lost";}
  if (tt===291) return ft.away===0?"won":"lost";
  if (tt===292) return ft.home===0?"won":"lost";
  if (tt===299) return (ft.home>ft.away&&ft.away===0)?"won":"lost";
  if (tt===300) return (ft.away>ft.home&&ft.home===0)?"won":"lost";

  const btts=ft.home>0&&ft.away>0;
  if (tt===23)  return (ft.home>ft.away&&btts)?"won":"lost";
  if (tt===26)  return (ft.away>ft.home&&btts)?"won":"lost";
  if (tt===220) return (ft.home===ft.away&&btts)?"won":"lost";
  if (tt===243) return (ft.home>ft.away&&!btts)?"won":"lost";
  if (tt===244) return (ft.away>ft.home&&!btts)?"won":"lost";
  if (tt===402) return (btts&&ft.home>ft.away)?"won":"lost";
  if (tt===403) return (btts&&ft.away>ft.home)?"won":"lost";
  if (tt===532) return (btts&&ft.home===ft.away)?"won":"lost";
  if (tt===533) return !btts?"won":"lost";

  if (ht) {
    const htT=ht.home+ht.away;
    const sh={home:ft.home-ht.home,away:ft.away-ht.away};
    if (tt===7 ||tt===284) return ht.home>ht.away?"won":"lost";
    if (tt===8 ||tt===285) return ht.home===ht.away?"won":"lost";
    if (tt===9 ||tt===286) return ht.away>ht.home?"won":"lost";
    if (tt===323) return ht.home>=ht.away?"won":"lost";
    if (tt===324) return ht.away>=ht.home?"won":"lost";
    if (tt===484) return ht.home!==ht.away?"won":"lost";
    if (tt===355){const t=parseThr(sv);return isNaN(t)?"pending":htT>t?"won":"lost";}
    if (tt===356){const t=parseThr(sv);return isNaN(t)?"pending":htT<t?"won":"lost";}
    if (tt===325||tt===481) return sh.home>sh.away?"won":"lost";
    if (tt===326||tt===482) return sh.home===sh.away?"won":"lost";
    if (tt===485||tt===483) return sh.away>sh.home?"won":"lost";
    if (tt===357){const t=parseThr(sv);return isNaN(t)?"pending":(sh.home+sh.away)>t?"won":"lost";}
    if (tt===358){const t=parseThr(sv);return isNaN(t)?"pending":(sh.home+sh.away)<t?"won":"lost";}
    const htft=HTFT[tt];
    if (htft) return (side(ht)===htft.ht&&side(ft)===htft.ft)?"won":"lost";
    if (tt===611) return (ht.home>0&&ht.away>0)?"won":"lost";
    if (tt===612) return (ht.home===0||ht.away===0)?"won":"lost";
    if (tt===613) return (sh.home>0&&sh.away>0)?"won":"lost";
    if (tt===614) return (sh.home===0||sh.away===0)?"won":"lost";
  } else {
    if ([7,8,9,284,285,286,323,324,325,326,355,356,357,358,
         481,482,483,484,485,608,609,610,611,612,613,614,615,616].includes(tt))
      return "pending";
  }

  return resolveByText(p, ft, ht, total);
}

// ---------------------------------------------------------------------------
// Process one bet document
// ---------------------------------------------------------------------------
function nowStr() {
  return new Date().toLocaleString("en-GB", {
    day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"
  });
}

async function processBet(
  db: FirebaseFirestore.Firestore,
  docSnap: FirebaseFirestore.QueryDocumentSnapshot,
  isCashedOut: boolean,
): Promise<"settled"|"updated"|"noop"> {
  const bet = { id: docSnap.id, ...docSnap.data() } as any;
  const selections: any[] = bet.selections.map((s: any) => ({ ...s }));
  let anyUpdated = false;

  for (let i = 0; i < selections.length; i++) {
    const sel = selections[i];
    if (sel.status !== "pending") continue;
    if (!sel.matchId || !sel.kickOffTime) continue;

    const dk = dateKey(sel.kickOffTime);
    const results = await dayResults(dk);
    const rm = results.get(sel.matchId) ?? null;
    if (!rm) continue;

    if (isPostponed(rm)) {
      if (sel.time !== "POSTPONED") { selections[i] = { ...sel, time: "POSTPONED" }; anyUpdated = true; }
      continue;
    }
    if (isAbandoned(rm)) {
      if (sel.time !== "CANCELLED") { selections[i] = { ...sel, time: "CANCELLED" }; anyUpdated = true; }
      continue;
    }

    if (isLive(rm)) {
      const ft = scoreFrom(rm, ["FULLTIME","CURRENT_SCORE"]);
      if (ft) {
        const period = rm.matchResult?.p ?? "";
        const newTime = period==="SECOND_HALF"?"2nd Half":period==="FIRST_HALF"?"1st Half":period==="PAUSE"?"HT":"LIVE";
        const newScore = `${ft.home} - ${ft.away}`;
        if (sel.score !== newScore || sel.time !== newTime) {
          selections[i] = { ...sel, score: newScore, time: newTime };
          anyUpdated = true;
        }
        // Early BTTS-Yes resolution
        const p = sel.pick.toLowerCase();
        const { tt } = parseId(sel.id);
        const isBttsYes = ((p.includes("both teams")||p.includes("btts"))&&p.includes("yes"))||tt===264;
        if (isBttsYes && ft.home > 0 && ft.away > 0) {
          selections[i] = { ...selections[i], status: "won" };
          anyUpdated = true;
        }
      }
      continue;
    }

    if (isEnded(rm)) {
      const ft = scoreFrom(rm, FT_KEYS);
      if (!ft) continue;
      const htH = numOrNull(rm.matchResult?.hs?.["FIRST_HALF"]);
      const htA = numOrNull(rm.matchResult?.as?.["FIRST_HALF"]);
      const ht  = htH !== null && htA !== null ? { home: htH, away: htA } : null;
      const r   = resolveSelection(sel, ft, ht);
      if (r === "pending") continue;
      selections[i] = { ...sel, status: r, score: `${ft.home} - ${ft.away}`, time: "FT" };
      anyUpdated = true;
    }
  }

  if (!anyUpdated) return "noop";

  const update: Record<string, any> = { selections };

  if (!isCashedOut) {
    const pending = selections.filter((s:any) => s.status==="pending" && s.time!=="POSTPONED" && s.time!=="CANCELLED");
    const lost    = selections.filter((s:any) => s.status==="lost");
    const won     = selections.filter((s:any) => s.status==="won");

    if (lost.length > 0) {
      Object.assign(update, { status:"lost", cashout:0, settledAt: FieldValue.serverTimestamp() });
      await db.collection("users").doc(bet.userId).update({
        lostBets:         FieldValue.increment(1),
        pendingBets:      FieldValue.increment(-1),
        pendingBetAmount: FieldValue.increment(-bet.stake),
      }).catch(() => {});

    } else if (pending.length === 0 && lost.length === 0 && won.length > 0) {
      const payout = bet.potentialWin;
      Object.assign(update, { status:"won", payout, cashout:0, settledAt: FieldValue.serverTimestamp() });
      await db.collection("users").doc(bet.userId).update({
        balance:          FieldValue.increment(payout),
        winnings:         FieldValue.increment(payout),
        wonBets:          FieldValue.increment(1),
        pendingBets:      FieldValue.increment(-1),
        pendingBetAmount: FieldValue.increment(-bet.stake),
      }).catch(() => {});
      await db.collection("transactions").add({
        userId:      bet.userId,
        userName:    bet.userName ?? "",
        type:        "win",
        amount:      payout,
        description: `Bet won — ${bet.selections.length} selection(s) — UGX ${payout.toLocaleString()}`,
        method:      "Platform",
        ref:         "WIN-" + bet.id.slice(-10),
        status:      "completed",
        date:        nowStr(),
        createdAt:   FieldValue.serverTimestamp(),
      }).catch(() => {});
      await db.collection("bets").doc(bet.id).update(update).catch(() => {});
      return "settled";
    }
  }

  await db.collection("bets").doc(bet.id).update(update).catch(() => {});
  return update.status === "lost" ? "settled" : "updated";
}

// ---------------------------------------------------------------------------
// Vercel handler
// ---------------------------------------------------------------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  let db: FirebaseFirestore.Firestore;
  try {
    db = getDb();
  } catch (err: any) {
    return res.status(503).json({ ok: false, error: err.message, hint: "Set FIREBASE_ADMIN_CREDENTIALS env var in Vercel project settings" });
  }

  try {
    const [pendingSnap, cashedSnap] = await Promise.all([
      db.collection("bets").where("status", "==", "pending").get(),
      db.collection("bets").where("status", "==", "cashed_out").get(),
    ]);

    const results = await Promise.allSettled([
      ...pendingSnap.docs.map((d) => processBet(db, d, false)),
      ...cashedSnap.docs.map((d)  => processBet(db, d, true)),
    ]);

    let settled = 0, updated = 0, noop = 0;
    for (const r of results) {
      if (r.status === "fulfilled") {
        if (r.value === "settled") settled++;
        else if (r.value === "updated") updated++;
        else noop++;
      }
    }

    return res.json({
      ok: true,
      processed: pendingSnap.size + cashedSnap.size,
      settled,
      updated,
      noop,
    });
  } catch (err: any) {
    console.error("Settlement error:", err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
