import { useEffect, useRef } from "react";
import {
  collection, query, where, getDocs,
  updateDoc, doc, addDoc, increment, serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { resolveSelection, canResolveEarlyBttsYes } from "../lib/marketResolver";
import {
  getMatchResult, isMatchEnded, isMatchLive, isMatchPostponed, isMatchAbandoned,
  getFullTimeScore, getHalfTimeScore, getLiveScore, getLivePeriod,
} from "../lib/resultsApi";

interface StoredSelection {
  id: string;
  match: string;
  pick: string;
  odd: number;
  status: "pending" | "won" | "lost";
  score: string | null;
  time: string;
  matchId?: number;
  kickOffTime?: number;
  sport?: string;
  marketKey?: string;
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
  fromBonus?: boolean;
  selections: StoredSelection[];
}

function nowString(): string {
  return new Date().toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

async function settleBet(bet: StoredBet): Promise<void> {
  const selections = bet.selections.map((s) => ({ ...s }));
  let anyUpdated = false;

  for (let i = 0; i < selections.length; i++) {
    const sel = selections[i];
    if (sel.status !== "pending") continue;
    if (!sel.matchId || !sel.kickOffTime) continue;

    const rm = await getMatchResult(sel.matchId, sel.kickOffTime);
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
        const newScore = `${live.home} - ${live.away}`;
        const newTime = period === "SECOND_HALF" ? "2nd Half"
          : period === "FIRST_HALF" ? "1st Half"
          : period === "PAUSE" ? "HT"
          : "LIVE";

        if (sel.score !== newScore || sel.time !== newTime) {
          selections[i] = { ...sel, score: newScore, time: newTime };
          anyUpdated = true;
        }

        if (canResolveEarlyBttsYes(sel, live)) {
          selections[i] = { ...selections[i], status: "won" };
          anyUpdated = true;
        }
      }
      continue;
    }

    if (isMatchEnded(rm)) {
      const ft = getFullTimeScore(rm);
      if (!ft) continue;
      const ht = getHalfTimeScore(rm);
      const r = resolveSelection(sel, ft, ht);
      if (r === "pending") continue;

      selections[i] = { ...sel, status: r, score: `${ft.home} - ${ft.away}`, time: "FT" };
      anyUpdated = true;
    }
  }

  const pendingSels = selections.filter((s) => s.status === "pending" && s.time !== "POSTPONED" && s.time !== "CANCELLED");
  const lostSels   = selections.filter((s) => s.status === "lost");
  const wonSels    = selections.filter((s) => s.status === "won");
  const isLost = lostSels.length > 0;
  const isWon  = pendingSels.length === 0 && lostSels.length === 0 && wonSels.length > 0;

  const update: Record<string, unknown> = {};
  if (anyUpdated) update["selections"] = selections;

  if (isLost) {
    update["status"]    = "lost";
    update["cashout"]   = 0;
    update["settledAt"] = serverTimestamp();
    await updateDoc(doc(db, "users", bet.userId), {
      lostBets:         increment(1),
      pendingBets:      increment(-1),
      pendingBetAmount: increment(-bet.stake),
    }).catch(() => {});

  } else if (isWon) {
    const payout = bet.potentialWin;
    update["status"]    = "won";
    update["payout"]    = payout;
    update["cashout"]   = 0;
    update["settledAt"] = serverTimestamp();
    await updateDoc(doc(db, "users", bet.userId), {
      balance:          increment(payout),
      winnings:         increment(payout),
      wonBets:          increment(1),
      pendingBets:      increment(-1),
      pendingBetAmount: increment(-bet.stake),
    }).catch(() => {});
    await addDoc(collection(db, "transactions"), {
      userId:      bet.userId,
      userName:    bet.userName ?? "",
      type:        "win",
      amount:      payout,
      description: `Bet won — ${bet.selections.length} selection(s) — UGX ${payout.toLocaleString()}`,
      method:      "Platform",
      ref:         "WIN-" + bet.id.slice(-10),
      status:      "completed",
      date:        nowString(),
      createdAt:   serverTimestamp(),
    }).catch(() => {});
  }

  if (Object.keys(update).length > 0) {
    await updateDoc(doc(db, "bets", bet.id), update).catch(() => {});
  }
}

async function updateCashedOutSelections(bet: StoredBet): Promise<void> {
  const selections = bet.selections.map((s) => ({ ...s }));
  let anyUpdated = false;

  for (let i = 0; i < selections.length; i++) {
    const sel = selections[i];
    if (sel.status !== "pending") continue;
    if (!sel.matchId || !sel.kickOffTime) continue;

    const rm = await getMatchResult(sel.matchId, sel.kickOffTime);
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
        const newScore = `${live.home} - ${live.away}`;
        const newTime = period === "SECOND_HALF" ? "2nd Half"
          : period === "FIRST_HALF" ? "1st Half"
          : period === "PAUSE" ? "HT" : "LIVE";
        if (sel.score !== newScore || sel.time !== newTime) {
          selections[i] = { ...sel, score: newScore, time: newTime };
          anyUpdated = true;
        }
        if (canResolveEarlyBttsYes(sel, live)) {
          selections[i] = { ...selections[i], status: "won" };
          anyUpdated = true;
        }
      }
      continue;
    }

    if (isMatchEnded(rm)) {
      const ft = getFullTimeScore(rm);
      if (!ft) continue;
      const ht = getHalfTimeScore(rm);
      const r = resolveSelection(sel, ft, ht);
      if (r === "pending") continue;
      selections[i] = { ...sel, status: r, score: `${ft.home} - ${ft.away}`, time: "FT" };
      anyUpdated = true;
    }
  }

  if (anyUpdated) {
    await updateDoc(doc(db, "bets", bet.id), { selections }).catch(() => {});
  }
}

// Try the serverless API first; fall back to direct Firestore settlement.
async function callApiSettle(): Promise<boolean> {
  try {
    const res = await fetch("/api/settle", { signal: AbortSignal.timeout(8_000) });
    return res.ok;
  } catch {
    return false;
  }
}

export default function ClientSettlement() {
  const { user } = useAuth();
  const runningRef = useRef(false);

  const runCycle = async (uid: string) => {
    if (runningRef.current) return;
    runningRef.current = true;
    try {
      // Primary: serverless backend handles ALL users' bets with admin access
      const apiOk = await callApiSettle();

      // Fallback: client-side settlement for this user only
      if (!apiOk) {
        const [pendingSnap, cashedSnap] = await Promise.all([
          getDocs(query(collection(db, "bets"), where("userId", "==", uid), where("status", "==", "pending"))),
          getDocs(query(collection(db, "bets"), where("userId", "==", uid), where("status", "==", "cashed_out"))),
        ]);
        const jobs: Promise<void>[] = [
          ...pendingSnap.docs.map((d) => settleBet({ id: d.id, ...(d.data() as Omit<StoredBet, "id">) }).catch(() => {})),
          ...cashedSnap.docs.map((d) => updateCashedOutSelections({ id: d.id, ...(d.data() as Omit<StoredBet, "id">) }).catch(() => {})),
        ];
        if (jobs.length > 0) await Promise.all(jobs);
      }
    } finally {
      runningRef.current = false;
    }
  };

  useEffect(() => {
    if (!user?.uid) return;
    const uid = user.uid;
    runCycle(uid);
    const interval = setInterval(() => runCycle(uid), 2_000);
    return () => { clearInterval(interval); runningRef.current = false; };
  }, [user?.uid]);

  return null;
}
