import { useState } from "react";
import { FileText, X, CheckCircle, Zap, Gift, ChevronRight, AlertCircle, Loader, Ticket, Ban, Search, Clock, CircleDot } from "lucide-react";
import { addDoc, collection, serverTimestamp, updateDoc, doc, increment, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import type { BetSelection } from "../App";

interface BetSlipProps {
  selections: BetSelection[];
  onRemove: (id: string) => void;
  onClose: () => void;
  onBetPlaced: () => void;
  onOpenLogin?: () => void;
  inline?: boolean;
}

const BONUS_TIERS = [
  { at: 2, pct: 3 }, { at: 3, pct: 5 }, { at: 4, pct: 8 }, { at: 5, pct: 12 },
  { at: 6, pct: 18 }, { at: 7, pct: 25 }, { at: 8, pct: 35 }, { at: 9, pct: 50 },
  { at: 10, pct: 75 }, { at: 11, pct: 100 }, { at: 12, pct: 150 },
  { at: 13, pct: 200 }, { at: 14, pct: 300 }, { at: 15, pct: 500 },
];

const FREE_BET_AMOUNT = 1000;

function currentBonus(count: number) {
  return [...BONUS_TIERS].reverse().find(t => count >= t.at)?.pct ?? 0;
}
function nextBonusInfo(count: number): { needed: number; pct: number } | null {
  const next = BONUS_TIERS.find(t => t.at > count);
  return next ? { needed: next.at - count, pct: next.pct } : null;
}

function nowString(): string {
  return new Date().toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/** Returns a unique key per Friday, e.g. "fri-2026-06-26" */
function getFridayKey(): string {
  const d = new Date();
  return `fri-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface TicketResult {
  ticketId: string;
  status: string;
  stake: number;
  totalOdds: number;
  potentialWin: number;
  date: string;
  selectionsCount: number;
  type: string;
  selections: { match: string; pick: string; odd: number; status: string }[];
}

export default function BetSlip({ selections, onRemove, onClose, onBetPlaced, onOpenLogin, inline = false }: BetSlipProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"slip" | "check">("slip");
  const [ticketInput, setTicketInput] = useState("");
  const [ticketResult, setTicketResult] = useState<TicketResult | null>(null);
  const [ticketError, setTicketError] = useState("");
  const [ticketLoading, setTicketLoading] = useState(false);
  const [stake, setStake] = useState("3700");
  const [placing, setPlacing] = useState(false);
  const [betError, setBetError] = useState("");
  const [betSuccess, setBetSuccess] = useState(false);
  const [freeBetSuccess, setFreeBetSuccess] = useState(false);

  const checkTicket = async () => {
    let id = ticketInput.trim();
    if (!id) return;
    // Strip common prefixes users might copy from receipts
    id = id.replace(/^(BET-|FB-)/i, "");
    setTicketError("");
    setTicketResult(null);
    setTicketLoading(true);
    try {
      // Try exact ticketId match first
      const q = query(collection(db, "bets"), where("ticketId", "==", id));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0].data() as TicketResult;
        setTicketResult({ ...d, ticketId: id });
      } else {
        // Also try with string conversion (in case stored as number)
        const q2 = query(collection(db, "bets"), where("ticketId", "==", Number(id)));
        const snap2 = await getDocs(q2);
        if (!snap2.empty) {
          const d = snap2.docs[0].data() as TicketResult;
          setTicketResult({ ...d, ticketId: id });
        } else {
          setTicketError("No ticket found with that ID. Your ticket ID can be found in My Account → My Bets.");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("permission") || msg.includes("Missing or insufficient")) {
        setTicketError("Please log in to check your ticket.");
      } else {
        setTicketError("Failed to check ticket. Please try again.");
      }
    } finally {
      setTicketLoading(false);
    }
  };

  const totalOdds = selections.reduce((acc, s) => acc * s.odd, 1);
  const stakeNum = parseFloat(stake) || 0;
  const tax = stakeNum * 0.15;
  const rawProfit = stakeNum * totalOdds - stakeNum - tax;
  const bonus = currentBonus(selections.length);
  const bonusAmount = rawProfit * (bonus / 100);
  const potential = stakeNum + rawProfit + bonusAmount;
  const next = nextBonusInfo(selections.length);

  // Friday free bet availability
  const isFriday = new Date().getDay() === 5;
  const fridayKey = getFridayKey();
  const freeBetAvailable = isFriday && !!user && (user.fridayFreeBetWeek ?? "") !== fridayKey;
  const freeBetPotential = Math.round(FREE_BET_AMOUNT * totalOdds);

  const handlePlaceBet = async () => {
    setBetError("");
    if (!user) { onOpenLogin?.(); return; }
    if (stakeNum < 500) { setBetError("Minimum stake is UGX 500."); return; }
    const realBalance = user.balance ?? 0;
    const bonusBalance = user.bonus ?? 0;
    const totalAvailable = realBalance + bonusBalance;
    if (stakeNum > totalAvailable) { setBetError("Insufficient balance."); return; }
    if (selections.length === 0) return;

    const useBonus = stakeNum > realBalance;

    setPlacing(true);
    try {
      const ticketId = Date.now().toString() + Math.floor(Math.random() * 10000);
      const betType = selections.length === 1 ? "Single" : "Accumulator";
      const now = nowString();

      await addDoc(collection(db, "bets"), {
        userId: user.uid,
        userName: user.name,
        userPhone: user.phone,
        ticketId,
        stake: stakeNum,
        totalOdds: parseFloat(totalOdds.toFixed(2)),
        potentialWin: Math.round(potential),
        status: "pending",
        date: now,
        selectionsCount: selections.length,
        type: betType,
        fromBonus: useBonus,
        isFreebet: false,
        selections: selections.map(s => ({
          id: s.id,
          match: s.match,
          pick: s.pick,
          odd: s.odd,
          status: "pending",
          score: null,
          time: "TBD",
          matchId: s.matchId ?? null,
          kickOffTime: s.kickOffTime ?? null,
          sport: s.sport ?? null,
          marketKey: s.marketKey ?? null,
        })),
        tax: Math.round(tax),
        bonusPct: bonus,
        bonusAmount: Math.round(bonusAmount),
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "users", user.uid), {
        ...(useBonus ? { bonus: increment(-stakeNum) } : { balance: increment(-stakeNum) }),
        totalBets: increment(1),
        pendingBets: increment(1),
        pendingBetAmount: increment(stakeNum),
        lastSeen: now,
      });

      await addDoc(collection(db, "transactions"), {
        userId: user.uid,
        userName: user.name,
        type: "bet",
        amount: stakeNum,
        description: `Bet placed — ${betType} (${selections.length} sel, ${totalOdds.toFixed(2)}x)`,
        method: "Platform",
        ref: "BET-" + ticketId,
        status: "completed",
        date: now,
        createdAt: serverTimestamp(),
      });

      setBetSuccess(true);
      setTimeout(() => {
        setBetSuccess(false);
        onBetPlaced();
      }, 1600);
    } catch {
      setBetError("Failed to place bet. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  const handleFreeBet = async () => {
    setBetError("");
    if (!user) { onOpenLogin?.(); return; }
    if (!isFriday) { setBetError("Friday Free Bet is only available on Fridays."); return; }
    if (!freeBetAvailable) { setBetError("You have already used your Friday Free Bet this week."); return; }
    if (selections.length === 0) return;

    setPlacing(true);
    try {
      const ticketId = Date.now().toString() + Math.floor(Math.random() * 10000);
      const betType = selections.length === 1 ? "Single" : "Accumulator";
      const now = nowString();

      await addDoc(collection(db, "bets"), {
        userId: user.uid,
        userName: user.name,
        userPhone: user.phone,
        ticketId,
        stake: FREE_BET_AMOUNT,
        totalOdds: parseFloat(totalOdds.toFixed(2)),
        potentialWin: freeBetPotential,
        status: "pending",
        date: now,
        selectionsCount: selections.length,
        type: betType,
        fromBonus: false,
        isFreebet: true,
        selections: selections.map(s => ({
          id: s.id,
          match: s.match,
          pick: s.pick,
          odd: s.odd,
          status: "pending",
          score: null,
          time: "TBD",
          matchId: s.matchId ?? null,
          kickOffTime: s.kickOffTime ?? null,
          sport: s.sport ?? null,
          marketKey: s.marketKey ?? null,
        })),
        tax: 0,
        bonusPct: 0,
        bonusAmount: 0,
        createdAt: serverTimestamp(),
      });

      // Mark free bet used, update bet counters — no balance deduction
      await updateDoc(doc(db, "users", user.uid), {
        fridayFreeBetWeek: fridayKey,
        totalBets: increment(1),
        pendingBets: increment(1),
        pendingBetAmount: increment(FREE_BET_AMOUNT),
        lastSeen: now,
      });

      await addDoc(collection(db, "transactions"), {
        userId: user.uid,
        userName: user.name,
        type: "bet",
        amount: FREE_BET_AMOUNT,
        description: `Friday Free Bet — ${betType} (${selections.length} sel, ${totalOdds.toFixed(2)}x)`,
        method: "Free Bet",
        ref: "FB-" + ticketId,
        status: "completed",
        date: now,
        createdAt: serverTimestamp(),
      });

      setFreeBetSuccess(true);
      setTimeout(() => {
        setFreeBetSuccess(false);
        onBetPlaced();
      }, 1800);
    } catch {
      setBetError("Failed to place free bet. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  const c = inline ? {
    headerPad: "9px 12px 8px", titleSize: 12, iconSize: 13 as const, closeSize: 12 as const,
    badgePad: "1px 7px", badgeSize: 11,
    bodyPad: "8px 10px", emptyPad: "24px 0", emptyIcon: 32 as const, emptySize: 11,
    successPad: "24px 14px", successIcon: 28 as const, successSize: 16, successMsgSize: 11,
    bannerPad: "6px 10px", bannerGap: 6, zapSize: 11 as const, bannerFontSize: 10, bannerNumSize: 11, bannerSubSize: 9,
    selPad: "7px 9px", selMatchSize: 9, selPickSize: 11, selOddSize: 11, removeSize: 9 as const,
    oddsPad: "7px 10px", oddsLabelSize: 9, oddsFontSize: 18, bonusPad: "4px 8px", bonusBadgeSize: 10, bonusPctSize: 13, bonusSubSize: 8,
    stakePad: "8px 10px", stakeLabel: 10, stakeInputSize: 14, quickBtnSize: 10, quickBtnPad: "4px 2px",
    balanceSize: 10,
    summarySize: 11, potentialSize: 13, potentialPad: "6px 0 10px",
    btnPad: "9px", btnFontSize: 12,
  } : {
    headerPad: "15px 16px 12px", titleSize: 15, iconSize: 17 as const, closeSize: 14 as const,
    badgePad: "2px 10px", badgeSize: 13,
    bodyPad: "12px 14px", emptyPad: "36px 0", emptyIcon: 44 as const, emptySize: 13,
    successPad: "40px 20px", successIcon: 34 as const, successSize: 20, successMsgSize: 13,
    bannerPad: "9px 14px", bannerGap: 8, zapSize: 14 as const, bannerFontSize: 11, bannerNumSize: 13, bannerSubSize: 10,
    selPad: "11px 12px", selMatchSize: 11, selPickSize: 13, selOddSize: 13, removeSize: 11 as const,
    oddsPad: "10px 14px", oddsLabelSize: 10, oddsFontSize: 26, bonusPad: "6px 12px", bonusBadgeSize: 12, bonusPctSize: 18, bonusSubSize: 9,
    stakePad: "11px 12px", stakeLabel: 12, stakeInputSize: 18, quickBtnSize: 12, quickBtnPad: "6px 4px",
    balanceSize: 11,
    summarySize: 12, potentialSize: 15, potentialPad: "8px 0 14px",
    btnPad: "13px", btnFontSize: 15,
  };

  const isSuccess = betSuccess || freeBetSuccess;

  return (
    <>
      {!inline && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 140, backdropFilter: "blur(2px)" }} onClick={onClose} />}
      <div className={inline ? "betslip-panel betslip-panel--inline" : "betslip-panel"}>

        <div className="betslip-header" style={{ padding: c.headerPad }}>
          <div style={{ display: "flex", flex: 1, gap: 4 }}>
            <button
              onClick={() => setActiveTab("slip")}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                background: activeTab === "slip" ? "var(--green)" : "rgba(45,169,98,0.08)",
                color: activeTab === "slip" ? "#fff" : "var(--green)",
                border: `1.5px solid ${activeTab === "slip" ? "var(--green)" : "rgba(45,169,98,0.25)"}`,
                borderRadius: 8, padding: "5px 10px", fontSize: c.titleSize - 1,
                fontWeight: 800, cursor: "pointer", fontFamily: "Oswald, sans-serif",
                transition: "all 0.15s",
              }}
            >
              <FileText size={c.iconSize - 2} />
              BET SLIP
              {selections.length > 0 && (
                <span style={{ background: activeTab === "slip" ? "rgba(255,255,255,0.25)" : "var(--green)", color: "#fff", fontSize: c.badgeSize - 1, fontWeight: 800, padding: "0px 5px", borderRadius: 10 }}>
                  {selections.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("check")}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                background: activeTab === "check" ? "#6d28d9" : "rgba(109,40,217,0.08)",
                color: activeTab === "check" ? "#fff" : "#6d28d9",
                border: `1.5px solid ${activeTab === "check" ? "#6d28d9" : "rgba(109,40,217,0.25)"}`,
                borderRadius: 8, padding: "5px 10px", fontSize: c.titleSize - 1,
                fontWeight: 800, cursor: "pointer", fontFamily: "Oswald, sans-serif",
                transition: "all 0.15s",
              }}
            >
              <Search size={c.iconSize - 2} />
              CHECK TICKET
            </button>
          </div>
          <div className="betslip-close" onClick={onClose}><X size={c.closeSize} /></div>
        </div>

        {/* Ticket Checker Panel */}
        {activeTab === "check" && (
          <div style={{ padding: c.bodyPad, display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={{ fontSize: c.stakeLabel, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, letterSpacing: 0.4 }}>ENTER TICKET / BET ID</div>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  value={ticketInput}
                  onChange={e => { setTicketInput(e.target.value); setTicketResult(null); setTicketError(""); }}
                  onKeyDown={e => e.key === "Enter" && checkTicket()}
                  placeholder="e.g. 1751305200123"
                  style={{
                    flex: 1, border: "1.5px solid rgba(109,40,217,0.25)", borderRadius: 10,
                    padding: inline ? "8px 10px" : "10px 13px", fontSize: c.stakeInputSize - 4,
                    background: "#faf9ff", color: "#111", outline: "none",
                    fontFamily: "monospace",
                  }}
                />
                <button
                  onClick={checkTicket}
                  disabled={!ticketInput.trim() || ticketLoading}
                  style={{
                    background: ticketInput.trim() ? "#6d28d9" : "#e0e0e0",
                    color: "#fff", border: "none", borderRadius: 10,
                    padding: inline ? "8px 12px" : "10px 14px",
                    fontSize: c.stakeLabel, fontWeight: 800,
                    cursor: ticketInput.trim() ? "pointer" : "default",
                    display: "flex", alignItems: "center", gap: 4,
                    fontFamily: "Oswald, sans-serif",
                    transition: "background 0.15s", flexShrink: 0,
                  }}
                >
                  {ticketLoading ? <Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Search size={13} />}
                  {inline ? "" : "CHECK"}
                </button>
              </div>
            </div>

            {ticketError && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 12px", color: "#ef4444", fontSize: c.summarySize, fontWeight: 600 }}>
                <AlertCircle size={14} /> {ticketError}
              </div>
            )}

            {ticketResult && (() => {
              const st = ticketResult.status;
              const statusColor = st === "won" ? "#2DA962" : st === "lost" ? "#ef4444" : st === "cashout" ? "#f59e0b" : "#888";
              const statusBg = st === "won" ? "rgba(45,169,98,0.1)" : st === "lost" ? "rgba(239,68,68,0.08)" : st === "cashout" ? "rgba(245,158,11,0.1)" : "rgba(0,0,0,0.04)";
              const StatusIcon = st === "won" ? CheckCircle : st === "lost" ? X : Clock;
              return (
                <div style={{ border: `1.5px solid ${statusColor}30`, borderRadius: 12, overflow: "hidden" }}>
                  {/* Status header */}
                  <div style={{ background: statusBg, padding: "10px 13px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <StatusIcon size={16} color={statusColor} />
                      <span style={{ fontWeight: 800, fontSize: c.titleSize, color: statusColor, fontFamily: "Oswald, sans-serif", letterSpacing: 0.5 }}>
                        {st.toUpperCase()}
                      </span>
                    </div>
                    <span style={{ fontSize: c.summarySize - 1, color: "var(--text-muted)" }}>{ticketResult.type} · {ticketResult.selectionsCount} sel</span>
                  </div>
                  {/* Details */}
                  <div style={{ padding: "10px 13px", display: "flex", flexDirection: "column", gap: 5 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: c.summarySize }}>
                      <span style={{ color: "var(--text-muted)" }}>Ticket ID</span>
                      <span style={{ fontWeight: 700, fontFamily: "monospace", fontSize: c.summarySize - 1 }}>{ticketResult.ticketId}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: c.summarySize }}>
                      <span style={{ color: "var(--text-muted)" }}>Stake</span>
                      <span style={{ fontWeight: 700 }}>UGX {(ticketResult.stake || 0).toLocaleString()}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: c.summarySize }}>
                      <span style={{ color: "var(--text-muted)" }}>Total Odds</span>
                      <span style={{ fontWeight: 700, color: "var(--green)" }}>{(ticketResult.totalOdds || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: c.summarySize }}>
                      <span style={{ color: "var(--text-muted)" }}>Possible Win</span>
                      <span style={{ fontWeight: 800, color: statusColor }}>UGX {(ticketResult.potentialWin || 0).toLocaleString()}</span>
                    </div>
                    {ticketResult.date && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: c.summarySize }}>
                        <span style={{ color: "var(--text-muted)" }}>Placed</span>
                        <span>{ticketResult.date}</span>
                      </div>
                    )}
                    {/* Selections */}
                    {ticketResult.selections && ticketResult.selections.length > 0 && (
                      <div style={{ marginTop: 6, borderTop: "1px solid var(--border)", paddingTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>
                        {ticketResult.selections.map((sel, i) => {
                          const sc = sel.status === "won" ? "#2DA962" : sel.status === "lost" ? "#ef4444" : "#888";
                          return (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: i < ticketResult.selections.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                              <CircleDot size={9} color={sc} style={{ flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: c.summarySize - 1, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sel.match}</div>
                                <div style={{ fontSize: c.summarySize, fontWeight: 700, color: "#111" }}>{sel.pick}</div>
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                                <span style={{ fontSize: c.summarySize, fontWeight: 700, color: "var(--green)" }}>{sel.odd?.toFixed(2)}</span>
                                <span style={{ fontSize: c.summarySize - 2, fontWeight: 700, color: sc }}>{sel.status}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        <div className="betslip-body" style={{ padding: c.bodyPad, display: activeTab === "check" ? "none" : undefined }}>
          {selections.length === 0 ? (
            <div className="betslip-empty" style={{ padding: c.emptyPad, fontSize: c.emptySize }}>
              <FileText size={c.emptyIcon} />
              <div>Your bet slip is empty</div>
              <div style={{ fontSize: c.emptySize - 1, marginTop: 4 }}>Tap any odds to add selections</div>
            </div>
          ) : isSuccess ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: c.successPad, gap: 10 }}>
              <div style={{ width: inline ? 44 : 64, height: inline ? 44 : 64, borderRadius: "50%", background: freeBetSuccess ? "rgba(245,158,11,0.15)" : "rgba(45,169,98,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle size={c.successIcon} color={freeBetSuccess ? "#f59e0b" : "#2DA962"} />
              </div>
              <div style={{ fontSize: c.successSize, fontWeight: 900, color: "var(--dark)", fontFamily: "Oswald, sans-serif" }}>
                {freeBetSuccess ? "FREE BET PLACED!" : "BET PLACED!"}
              </div>
              <div style={{ fontSize: c.successMsgSize, color: "var(--text-secondary)", textAlign: "center" }}>
                {freeBetSuccess
                  ? `Your Friday Free Bet of UGX ${FREE_BET_AMOUNT.toLocaleString()} has been placed!`
                  : `Your bet of UGX ${stakeNum.toLocaleString()} has been placed successfully.`}
              </div>
              <div style={{ fontSize: c.successMsgSize, color: freeBetSuccess ? "#f59e0b" : "#2DA962", fontWeight: 700 }}>
                Potential Win: UGX {(freeBetSuccess ? freeBetPotential : Math.round(potential)).toLocaleString()}
              </div>
            </div>
          ) : (
            <>
              {next && (
                <div style={{ background: "linear-gradient(90deg, #1a6e3d, #2DA962)", borderRadius: 10, padding: c.bannerPad, marginBottom: 8, display: "flex", alignItems: "center", gap: c.bannerGap }}>
                  <Zap size={c.zapSize} color="#ffe60f" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: c.bannerFontSize, color: "#fff", fontWeight: 700, lineHeight: 1.3 }}>
                      Add <span style={{ color: "#ffe60f", fontSize: c.bannerNumSize }}>{next.needed}</span> more to unlock{" "}
                      <span style={{ color: "#ffe60f", fontWeight: 800 }}>{next.pct}% Win Bonus!</span>
                    </div>
                    <div style={{ fontSize: c.bannerSubSize, color: "rgba(255,255,255,0.65)", marginTop: 1 }}>Bonus up to 500% on your winnings</div>
                  </div>
                  <ChevronRight size={c.zapSize} color="rgba(255,255,255,0.5)" />
                </div>
              )}

              {/* Friday Free Bet banner */}
              {isFriday && user && (
                <div style={{
                  background: freeBetAvailable
                    ? "linear-gradient(90deg, #92400e, #f59e0b)"
                    : "rgba(156,163,175,0.15)",
                  borderRadius: 10, padding: c.bannerPad, marginBottom: 8,
                  display: "flex", alignItems: "center", gap: c.bannerGap,
                  border: freeBetAvailable ? "none" : "1px solid var(--border)",
                }}>
                  <Ticket size={c.zapSize} color={freeBetAvailable ? "#fff" : "var(--text-muted)"} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: c.bannerFontSize, color: freeBetAvailable ? "#fff" : "var(--text-muted)", fontWeight: 700, lineHeight: 1.3 }}>
                      🎁 Friday Free Bet — UGX 1,000
                    </div>
                    <div style={{ fontSize: c.bannerSubSize, color: freeBetAvailable ? "rgba(255,255,255,0.8)" : "var(--text-muted)", marginTop: 1 }}>
                      {freeBetAvailable ? "Place 1 free bet today, no balance needed!" : "Already used this week"}
                    </div>
                  </div>
                </div>
              )}

              {selections.map((sel) => (
                <div key={sel.id} className="betslip-selection" style={{ padding: c.selPad }}>
                  <div className="betslip-sel-match" style={{ fontSize: c.selMatchSize }}>{sel.match}</div>
                  <div className="betslip-sel-pick" style={{ fontSize: c.selPickSize }}>{sel.pick}</div>
                  <div className="betslip-sel-odd" style={{ fontSize: c.selOddSize }}>{sel.odd.toFixed(2)}</div>
                  <div className="betslip-remove" onClick={() => onRemove(sel.id)}><X size={c.removeSize} /></div>
                </div>
              ))}

              <div style={{ background: "var(--bg-light)", border: "1px solid var(--border)", borderRadius: 10, padding: c.oddsPad, margin: "8px 0", display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: c.oddsLabelSize, color: "var(--text-muted)", fontWeight: 600, letterSpacing: 0.4 }}>TOTAL ODDS</div>
                  <div style={{ fontSize: c.oddsFontSize, fontWeight: 800, color: "var(--green)", fontFamily: "Oswald, sans-serif", lineHeight: 1.1 }}>{totalOdds.toFixed(2)}</div>
                </div>
                {bonus > 0 && (
                  <div style={{ background: "rgba(45,169,98,0.1)", border: "1px solid rgba(45,169,98,0.3)", borderRadius: 8, padding: c.bonusPad, textAlign: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <Gift size={c.bonusBadgeSize} color="#2DA962" />
                      <span style={{ fontSize: c.oddsLabelSize, color: "#2DA962", fontWeight: 700, letterSpacing: 0.3 }}>WIN BONUS</span>
                    </div>
                    <div style={{ fontSize: c.bonusPctSize, fontWeight: 800, color: "#2DA962", fontFamily: "Oswald, sans-serif", lineHeight: 1.1 }}>{bonus}%</div>
                    <div style={{ fontSize: c.bonusSubSize, color: "rgba(45,169,98,0.7)", fontWeight: 600 }}>of 500%</div>
                  </div>
                )}
              </div>

              <div className="betslip-stake" style={{ padding: c.stakePad }}>
                <div className="stake-label" style={{ fontSize: c.stakeLabel }}>STAKE (UGX)</div>
                <input className="stake-input" type="number" value={stake} onChange={(e) => setStake(e.target.value)} placeholder="0" style={{ fontSize: c.stakeInputSize }} />
                <div className="stake-quick-btns">
                  {["1000", "2000", "5000", "10000"].map((amt) => (
                    <button key={amt} className="stake-quick-btn" onClick={() => setStake(p => String(parseFloat(p || "0") + parseFloat(amt)))} style={{ fontSize: c.quickBtnSize, padding: c.quickBtnPad }}>
                      +{Number(amt).toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {user && (
                <div style={{ fontSize: c.balanceSize, color: "var(--text-muted)", marginBottom: 4, textAlign: "right", display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <span>Balance: UGX {(user.balance ?? 0).toLocaleString()}</span>
                  {(user.bonus ?? 0) > 0 && (
                    <span style={{ color: "#2DA962", fontWeight: 700 }}>
                      Bonus: UGX {(user.bonus ?? 0).toLocaleString()}
                    </span>
                  )}
                </div>
              )}

              <div className="betslip-summary" style={{ fontSize: c.summarySize }}>
                <span>Excise Tax (15%)</span>
                <span className="betslip-summary-value">UGX {Math.round(tax).toLocaleString()}</span>
              </div>
              {bonus > 0 && (
                <div className="betslip-summary" style={{ fontSize: c.summarySize }}>
                  <span style={{ color: "#2DA962" }}>Win Bonus ({bonus}%)</span>
                  <span style={{ color: "#2DA962", fontWeight: 700 }}>+ UGX {Math.round(bonusAmount).toLocaleString()}</span>
                </div>
              )}

              <div className="betslip-potential" style={{ fontSize: c.potentialSize, padding: c.potentialPad }}>
                <span>POSSIBLE WIN</span>
                <span className="betslip-potential-value">UGX {Math.round(potential).toLocaleString()}</span>
              </div>

              {betError && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: inline ? "6px 9px" : "9px 12px", marginBottom: 8, color: "#ef4444", fontSize: c.summarySize, fontWeight: 600 }}>
                  <AlertCircle size={inline ? 11 : 14} /> {betError}
                </div>
              )}

              {/* Place Bet + Friday Free Bet buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <button
                  className="btn-place-bet"
                  onClick={handlePlaceBet}
                  disabled={placing}
                  style={{ opacity: placing ? 0.75 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: c.btnPad, fontSize: c.btnFontSize }}
                >
                  {placing ? <><Loader size={inline ? 13 : 16} style={{ animation: "spin 1s linear infinite" }} /> PLACING BET...</> : <><CheckCircle size={inline ? 13 : 18} /> PLACE BET</>}
                </button>

                {isFriday && user && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <button
                      onClick={handleFreeBet}
                      disabled={placing || !freeBetAvailable}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        padding: c.btnPad, fontSize: c.btnFontSize,
                        background: freeBetAvailable
                          ? "linear-gradient(90deg, #92400e, #f59e0b)"
                          : "rgba(156,163,175,0.15)",
                        color: freeBetAvailable ? "#fff" : "var(--text-muted)",
                        border: freeBetAvailable ? "none" : "1.5px solid rgba(156,163,175,0.4)",
                        borderRadius: 10, fontWeight: 800,
                        fontFamily: "Oswald, sans-serif", letterSpacing: 0.5,
                        cursor: freeBetAvailable && !placing ? "pointer" : "not-allowed",
                        opacity: freeBetAvailable ? 1 : 0.7,
                        transition: "opacity 0.2s",
                        textDecoration: freeBetAvailable ? "none" : "line-through",
                      }}
                    >
                      {freeBetAvailable
                        ? <><Ticket size={inline ? 13 : 18} /> USE FREE BET — UGX {FREE_BET_AMOUNT.toLocaleString()}</>
                        : <><Ban size={inline ? 13 : 18} /> FREE BET ALREADY USED</>}
                    </button>
                    {!freeBetAvailable && (
                      <div style={{
                        fontSize: c.balanceSize, color: "var(--text-muted)",
                        textAlign: "center", fontStyle: "italic",
                      }}>
                        ✓ You used your free bet this Friday. Come back next Friday!
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
