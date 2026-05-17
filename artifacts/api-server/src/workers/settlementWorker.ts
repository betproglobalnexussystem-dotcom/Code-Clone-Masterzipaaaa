import { getAdmin, getDb } from "../lib/firebaseAdmin.js";
import {
  getMatchResult,
  isMatchEnded, isMatchLive, isMatchPostponed, isMatchAbandoned,
  getFullTimeScore, getHalfTimeScore, getLiveScore, getLivePeriod,
  type ApiResultMatch,
} from "../lib/resultsApiCache.js";
import {
  resolveSelection, canResolveAtHalfTime, canResolveEarlyBttsYes,
  estimateCurrentOdds, type SelectionData,
} from "../lib/marketResolver.js";

interface StoredSelection extends SelectionData {
  status: "pending" | "won" | "lost";
  score: string | null;
  time: string;
  match: string;
  matchId?: number;
  matchCode?: number;
  kickOffTime?: number;
  sport?: string;
}

interface StoredBet {
  id: string;
  userId: string;
  userName?: string;
  stake: number;
  totalOdds: number;
  potentialWin: number;
  status: "pending" | "won" | "lost" | "cashed_out";
  date: string;
  selections: StoredSelection[];
  cashout?: number;
  payout?: number;
}

function nowString(): string {
  return new Date().toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function calcCashout(
  bet: StoredBet,
  sels: StoredSelection[],
  liveScores: Map<string, { home: number; away: number; period: string }>,
): number {
  const MARGIN = 0.85;
  if (sels.some(s => s.status === "lost")) return 0;

  let ratio = 1.0;
  for (const sel of sels) {
    if (sel.status === "won") continue;
    if (sel.time === "POSTPONED" || sel.time === "CANCELLED") continue;

    const live = sel.matchId ? liveScores.get(String(sel.matchId)) : null;
    if (!live) continue;

    const curOdds = estimateCurrentOdds(sel, live);
    ratio *= curOdds / sel.odd;
  }

  const raw = bet.stake * ratio * MARGIN;
  return Math.max(
    Math.round(bet.stake * 0.02),
    Math.min(Math.round(raw), Math.round(bet.potentialWin * 0.95)),
  );
}

async function settleBet(bet: StoredBet): Promise<void> {
  const admin       = getAdmin();
  const db          = getDb();
  const selections  = bet.selections.map(s => ({ ...s }));
  let anyUpdated    = false;
  const liveScores  = new Map<string, { home: number; away: number; period: string }>();

  for (let i = 0; i < selections.length; i++) {
    const sel = selections[i];
    if (sel.status !== "pending") continue;
    if (!sel.matchId || !sel.kickOffTime) continue;

    const rm: ApiResultMatch | null = await getMatchResult(sel.matchId, sel.kickOffTime);
    if (!rm) continue;

    if (isMatchPostponed(rm)) {
      if (sel.time !== "POSTPONED") { selections[i] = { ...sel, time: "POSTPONED" }; anyUpdated = true; }
      continue;
    }
    if (isMatchAbandoned(rm)) {
      if (sel.time !== "CANCELLED") { selections[i] = { ...sel, time: "CANCELLED" }; anyUpdated = true; }
      continue;
    }

    if (isMatchLive(rm)) {
      const live = getLiveScore(rm);
      if (live) {
        const period = getLivePeriod(rm);
        liveScores.set(String(sel.matchId), { home: live.home, away: live.away, period });

        const newScore = `${live.home} - ${live.away}`;
        const newTime  = period === "SECOND_HALF" ? "2nd Half"
                       : period === "FIRST_HALF"  ? "1st Half"
                       : period === "PAUSE"       ? "HT"
                       : "LIVE";

        if (sel.score !== newScore || sel.time !== newTime) {
          selections[i] = { ...sel, score: newScore, time: newTime };
          anyUpdated = true;
        }

        if (canResolveEarlyBttsYes(sel, live)) {
          selections[i] = { ...selections[i], status: "won" };
          anyUpdated = true;
          continue;
        }

        const htScore = getHalfTimeScore(rm);
        if (htScore && canResolveAtHalfTime(sel)) {
          const r = resolveSelection(sel, htScore, null, sel.sport ?? "S");
          if (r !== "pending") { selections[i] = { ...selections[i], status: r }; anyUpdated = true; }
        }
      }
      continue;
    }

    if (isMatchEnded(rm)) {
      const ft = getFullTimeScore(rm);
      if (!ft) continue;
      const ht = getHalfTimeScore(rm);
      const r  = resolveSelection(sel, ft, ht, sel.sport ?? rm.sport ?? "S");
      if (r === "pending") continue;

      selections[i] = {
        ...sel, status: r,
        score: `${ft.home} - ${ft.away}`,
        time: "FT",
      };
      anyUpdated = true;
    }
  }

  const pendingSels  = selections.filter(s => s.status === "pending" && s.time !== "POSTPONED" && s.time !== "CANCELLED");
  const lostSels     = selections.filter(s => s.status === "lost");
  const wonSels      = selections.filter(s => s.status === "won");
  const isLost       = lostSels.length > 0;
  const isWon        = pendingSels.length === 0 && lostSels.length === 0 && wonSels.length > 0;
  const cashout      = calcCashout(bet, selections, liveScores);

  const update: Record<string, unknown> = {};
  if (anyUpdated) update["selections"] = selections;

  if (isLost) {
    update["status"]     = "lost";
    update["cashout"]    = 0;
    update["settledAt"]  = admin.firestore.FieldValue.serverTimestamp();

    await db.collection("users").doc(bet.userId).update({
      lostBets:         admin.firestore.FieldValue.increment(1),
      pendingBets:      admin.firestore.FieldValue.increment(-1),
      pendingBetAmount: admin.firestore.FieldValue.increment(-bet.stake),
    }).catch(() => {});

  } else if (isWon) {
    const payout = bet.potentialWin;
    update["status"]    = "won";
    update["payout"]    = payout;
    update["cashout"]   = 0;
    update["settledAt"] = admin.firestore.FieldValue.serverTimestamp();

    await db.collection("users").doc(bet.userId).update({
      balance:          admin.firestore.FieldValue.increment(payout),
      winnings:         admin.firestore.FieldValue.increment(payout),
      wonBets:          admin.firestore.FieldValue.increment(1),
      pendingBets:      admin.firestore.FieldValue.increment(-1),
      pendingBetAmount: admin.firestore.FieldValue.increment(-bet.stake),
      lastSeen:         nowString(),
    }).catch(() => {});

    await db.collection("transactions").add({
      userId:     bet.userId,
      userName:   bet.userName ?? "",
      type:       "win",
      amount:     payout,
      description:`Bet won — ${bet.selections.length} selection(s) — UGX ${payout.toLocaleString()}`,
      method:     "Platform",
      ref:        "WIN-" + bet.id.slice(-10),
      status:     "completed",
      date:       nowString(),
      createdAt:  admin.firestore.FieldValue.serverTimestamp(),
    }).catch(() => {});

  } else {
    if (cashout !== bet.cashout) update["cashout"] = cashout;
  }

  if (Object.keys(update).length > 0) {
    await db.collection("bets").doc(bet.id).update(update).catch((e: Error) =>
      console.error(`[Settlement] bet ${bet.id} update error:`, e.message),
    );
  }
}

async function runCycle(): Promise<void> {
  const db = getDb();
  try {
    const snap = await db.collection("bets")
      .where("status", "==", "pending")
      .limit(100)
      .get();

    if (snap.empty) return;
    console.log(`[Settlement] Processing ${snap.size} pending bets`);

    const tasks = snap.docs.map(doc => {
      const bet: StoredBet = { id: doc.id, ...(doc.data() as Omit<StoredBet, "id">) };
      return settleBet(bet).catch(e =>
        console.error(`[Settlement] Error on bet ${bet.id}:`, e instanceof Error ? e.message : e),
      );
    });
    await Promise.all(tasks);
  } catch (e) {
    console.error("[Settlement] Cycle error:", e instanceof Error ? e.message : e);
  }
}

let _interval: ReturnType<typeof setInterval> | null = null;

export function startSettlementWorker(): void {
  if (_interval) return;
  console.log("[Settlement] Worker starting — 10 s interval");
  runCycle().catch(console.error);
  _interval = setInterval(() => runCycle().catch(console.error), 10_000);
}

export function stopSettlementWorker(): void {
  if (_interval) { clearInterval(_interval); _interval = null; }
}
