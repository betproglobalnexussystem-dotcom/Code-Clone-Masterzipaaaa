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
  onOpenLogin?: () => void;
  inline?: boolean;
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

export default function BetSlip({ selections, onRemove, onClose, onBetPlaced, onOpenLogin, inline = false }: BetSlipProps) {
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
    if (!user) { onOpenLogin?.(); return; }
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

  return (
    <>
      {!inline && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 140, backdropFilter: "blur(2px)" }} onClick={onClose} />}
      <div className={inline ? "betslip-panel betslip-panel--inline" : "betslip-panel"}>

        <div className="betslip-header" style={{ padding: c.headerPad }}>
          <div className="betslip-title" style={{ fontSize: c.titleSize }}>
            <FileText size={c.iconSize} />
            BET SLIP
            {selections.length > 0 && (
              <span style={{
                background: "var(--green)", color: "#fff",
                fontSize: c.badgeSize, fontWeight: 800, padding: c.badgePad,
                borderRadius: 12, fontFamily: "Oswald, sans-serif",
                letterSpacing: 0.3, boxShadow: "0 2px 8px rgba(45,169,98,0.4)",
              }}>
                {selections.length}
              </span>
            )}
          </div>
          <div className="betslip-close" onClick={onClose}><X size={c.closeSize} /></div>
        </div>

        <div className="betslip-body" style={{ padding: c.bodyPad }}>
          {selections.length === 0 ? (
            <div className="betslip-empty" style={{ padding: c.emptyPad, fontSize: c.emptySize }}>
              <FileText size={c.emptyIcon} />
              <div>Your bet slip is empty</div>
              <div style={{ fontSize: c.emptySize - 1, marginTop: 4 }}>Tap any odds to add selections</div>
            </div>
          ) : betSuccess ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: c.successPad, gap: 10 }}>
              <div style={{ width: inline ? 44 : 64, height: inline ? 44 : 64, borderRadius: "50%", background: "rgba(45,169,98,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle size={c.successIcon} color="#2DA962" />
              </div>
              <div style={{ fontSize: c.successSize, fontWeight: 900, color: "var(--dark)", fontFamily: "Oswald, sans-serif" }}>BET PLACED!</div>
              <div style={{ fontSize: c.successMsgSize, color: "var(--text-secondary)", textAlign: "center" }}>
                Your bet of UGX {stakeNum.toLocaleString()} has been placed successfully.
              </div>
              <div style={{ fontSize: c.successMsgSize, color: "#2DA962", fontWeight: 700 }}>Potential Win: UGX {Math.round(potential).toLocaleString()}</div>
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
                <div style={{ fontSize: c.balanceSize, color: "var(--text-muted)", marginBottom: 4, textAlign: "right" }}>
                  Balance: UGX {(user.balance ?? 0).toLocaleString()}
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

              <button
                className="btn-place-bet"
                onClick={handlePlaceBet}
                disabled={placing}
                style={{ opacity: placing ? 0.75 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: c.btnPad, fontSize: c.btnFontSize }}
              >
                {placing ? <><Loader size={inline ? 13 : 16} style={{ animation: "spin 1s linear infinite" }} /> PLACING BET...</> : <><CheckCircle size={inline ? 13 : 18} /> PLACE BET</>}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
