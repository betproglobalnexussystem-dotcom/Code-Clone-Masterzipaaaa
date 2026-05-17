import { useState } from "react";
import { FileText, X, CheckCircle, Zap, Gift, ChevronRight, AlertCircle, Loader } from "lucide-react";
import { addDoc, collection, serverTimestamp, updateDoc, doc, increment } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import type { BetSelection } from "../App";

interface BetSlipProps {
  selections: BetSelection[];
  onRemove: (id: string) => void;
  onClose: () => void;
  onBetPlaced: () => void;
}

const BONUS_TIERS = [
  { at: 2, pct: 3 }, { at: 3, pct: 5 }, { at: 4, pct: 8 }, { at: 5, pct: 12 },
  { at: 6, pct: 18 }, { at: 7, pct: 25 }, { at: 8, pct: 35 }, { at: 9, pct: 50 },
  { at: 10, pct: 75 }, { at: 11, pct: 100 }, { at: 12, pct: 150 },
  { at: 13, pct: 200 }, { at: 14, pct: 300 }, { at: 15, pct: 500 },
];

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

export default function BetSlip({ selections, onRemove, onClose, onBetPlaced }: BetSlipProps) {
  const { user } = useAuth();
  const [stake, setStake] = useState("3700");
  const [placing, setPlacing] = useState(false);
  const [betError, setBetError] = useState("");
  const [betSuccess, setBetSuccess] = useState(false);

  const totalOdds = selections.reduce((acc, s) => acc * s.odd, 1);
  const stakeNum = parseFloat(stake) || 0;
  const tax = stakeNum * 0.15;
  const rawProfit = stakeNum * totalOdds - stakeNum - tax;
  const bonus = currentBonus(selections.length);
  const bonusAmount = rawProfit * (bonus / 100);
  const potential = stakeNum + rawProfit + bonusAmount;
  const next = nextBonusInfo(selections.length);

  const handlePlaceBet = async () => {
    setBetError("");
    if (!user) { setBetError("Please log in to place a bet."); return; }
    if (stakeNum < 500) { setBetError("Minimum stake is UGX 500."); return; }
    if (stakeNum > user.balance) { setBetError("Insufficient balance."); return; }
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
        stake: stakeNum,
        totalOdds: parseFloat(totalOdds.toFixed(2)),
        potentialWin: Math.round(potential),
        status: "pending",
        date: now,
        selectionsCount: selections.length,
        type: betType,
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
        balance: increment(-stakeNum),
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

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 140, backdropFilter: "blur(2px)" }} onClick={onClose} />
      <div className="betslip-panel">

        <div className="betslip-header">
          <div className="betslip-title">
            <FileText size={17} />
            BET SLIP
            {selections.length > 0 && (
              <span style={{
                background: "var(--green)", color: "#fff",
                fontSize: 13, fontWeight: 800, padding: "2px 10px",
                borderRadius: 12, fontFamily: "Oswald, sans-serif",
                letterSpacing: 0.3, boxShadow: "0 2px 8px rgba(45,169,98,0.4)",
              }}>
                {selections.length}
              </span>
            )}
          </div>
          <div className="betslip-close" onClick={onClose}><X size={14} /></div>
        </div>

        <div className="betslip-body">
          {selections.length === 0 ? (
            <div className="betslip-empty">
              <FileText size={44} />
              <div>Your bet slip is empty</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>Tap any odds to add selections</div>
            </div>
          ) : betSuccess ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", gap: 14 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(45,169,98,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle size={34} color="#2DA962" />
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", fontFamily: "Oswald, sans-serif" }}>BET PLACED!</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", textAlign: "center" }}>
                Your bet of UGX {stakeNum.toLocaleString()} has been placed successfully.
              </div>
              <div style={{ fontSize: 12, color: "#2DA962", fontWeight: 700 }}>Potential Win: UGX {Math.round(potential).toLocaleString()}</div>
            </div>
          ) : (
            <>
              {next && (
                <div style={{ background: "linear-gradient(90deg, #1a6e3d, #2DA962)", borderRadius: 12, padding: "9px 14px", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                  <Zap size={14} color="#ffe60f" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>
                      Add <span style={{ color: "#ffe60f", fontSize: 13 }}>{next.needed}</span> more to unlock{" "}
                      <span style={{ color: "#ffe60f", fontWeight: 800 }}>{next.pct}% Win Bonus!</span>
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>Bonus up to 500% on your winnings</div>
                  </div>
                  <ChevronRight size={14} color="rgba(255,255,255,0.5)" />
                </div>
              )}

              {selections.map((sel) => (
                <div key={sel.id} className="betslip-selection">
                  <div className="betslip-sel-match">{sel.match}</div>
                  <div className="betslip-sel-pick">{sel.pick}</div>
                  <div className="betslip-sel-odd">{sel.odd.toFixed(2)}</div>
                  <div className="betslip-remove" onClick={() => onRemove(sel.id)}><X size={11} /></div>
                </div>
              ))}

              <div style={{ background: "#1c1e24", borderRadius: 12, padding: "10px 14px", margin: "10px 0", display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 600, letterSpacing: 0.4 }}>TOTAL ODDS</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#ffe60f", fontFamily: "Oswald, sans-serif", lineHeight: 1.1 }}>{totalOdds.toFixed(2)}</div>
                </div>
                {bonus > 0 && (
                  <div style={{ background: "rgba(45,169,98,0.2)", border: "1px solid rgba(45,169,98,0.4)", borderRadius: 10, padding: "6px 12px", textAlign: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Gift size={12} color="#2DA962" />
                      <span style={{ fontSize: 10, color: "#2DA962", fontWeight: 700, letterSpacing: 0.3 }}>WIN BONUS</span>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#2DA962", fontFamily: "Oswald, sans-serif", lineHeight: 1.1 }}>{bonus}%</div>
                    <div style={{ fontSize: 9, color: "rgba(45,169,98,0.7)", fontWeight: 600 }}>of 500%</div>
                  </div>
                )}
              </div>

              <div className="betslip-stake">
                <div className="stake-label">STAKE (UGX)</div>
                <input className="stake-input" type="number" value={stake} onChange={(e) => setStake(e.target.value)} placeholder="0" />
                <div className="stake-quick-btns">
                  {["1000", "2000", "5000", "10000"].map((amt) => (
                    <button key={amt} className="stake-quick-btn" onClick={() => setStake(p => String(parseFloat(p || "0") + parseFloat(amt)))}>
                      +{Number(amt).toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {user && (
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6, textAlign: "right" }}>
                  Balance: UGX {(user.balance ?? 0).toLocaleString()}
                </div>
              )}

              <div className="betslip-summary">
                <span>Excise Tax (15%)</span>
                <span className="betslip-summary-value">UGX {Math.round(tax).toLocaleString()}</span>
              </div>
              {bonus > 0 && (
                <div className="betslip-summary">
                  <span style={{ color: "#2DA962" }}>Win Bonus ({bonus}%)</span>
                  <span style={{ color: "#2DA962", fontWeight: 700 }}>+ UGX {Math.round(bonusAmount).toLocaleString()}</span>
                </div>
              )}

              <div className="betslip-potential">
                <span>POSSIBLE WIN</span>
                <span className="betslip-potential-value">UGX {Math.round(potential).toLocaleString()}</span>
              </div>

              {betError && (
                <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "9px 12px", marginBottom: 10, color: "#ef4444", fontSize: 12, fontWeight: 600 }}>
                  <AlertCircle size={14} /> {betError}
                </div>
              )}

              <button
                className="btn-place-bet"
                onClick={handlePlaceBet}
                disabled={placing}
                style={{ opacity: placing ? 0.75 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                {placing ? <><Loader size={16} style={{ animation: "spin 1s linear infinite" }} /> PLACING BET...</> : <><CheckCircle size={18} /> PLACE BET</>}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
