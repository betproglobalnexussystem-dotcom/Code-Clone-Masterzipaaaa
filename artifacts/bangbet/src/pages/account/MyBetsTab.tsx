import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, Ticket, Zap, Shield } from "lucide-react";
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, increment, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";

interface BetSelection {
  id: string;
  match: string;
  pick: string;
  odd: number;
  status: "pending" | "won" | "lost";
  score: string | null;
  time: string;
}

interface Ticket {
  id: string;
  ticketId: string;
  date: string;
  type: string;
  stake: number;
  totalOdds: number;
  potentialWin: number;
  status: "pending" | "won" | "lost" | "cashed_out";
  payout?: number;
  cashout?: number;
  selections: BetSelection[];
}

function StatusBadge({ status, size = "sm" }: { status: string; size?: "sm" | "lg" }) {
  const configs: Record<string, { bg: string; color: string; label: string; icon: React.ReactNode }> = {
    won:     { bg: "rgba(45,169,98,0.12)",  color: "#1a8a4c", label: "WON",     icon: <CheckCircle size={size === "lg" ? 15 : 11} /> },
    lost:    { bg: "rgba(229,57,53,0.1)",   color: "#c62828", label: "LOST",    icon: <XCircle size={size === "lg" ? 15 : 11} /> },
    pending: { bg: "rgba(251,140,0,0.12)",  color: "#e65100", label: "PENDING", icon: <Clock size={size === "lg" ? 15 : 11} /> },
    cashed_out: { bg: "rgba(21,101,192,0.1)", color: "#1565c0", label: "CASHED OUT", icon: <CheckCircle size={size === "lg" ? 15 : 11} /> },
  };
  const c = configs[status] ?? configs.pending;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: c.bg, color: c.color, fontSize: size === "lg" ? 11 : 9, fontWeight: 800, padding: size === "lg" ? "4px 10px" : "3px 7px", borderRadius: 20, fontFamily: "Oswald, sans-serif", letterSpacing: 0.8 }}>
      {c.icon} {c.label}
    </span>
  );
}

function TicketModal({ ticket, onClose, onCashout }: { ticket: Ticket; onClose: () => void; onCashout: (t: Ticket) => Promise<void> }) {
  const [cashingOut, setCashingOut] = useState(false);
  const statusColor = ticket.status === "won" ? "#1a8a4c" : ticket.status === "lost" ? "#c62828" : "#e65100";
  const statusBg = ticket.status === "won" ? "linear-gradient(135deg,#1a8a4c,#2DA962)" : ticket.status === "lost" ? "linear-gradient(135deg,#b71c1c,#e53935)" : "linear-gradient(135deg,#e65100,#fb8c00)";

  const handleCashoutClick = async () => {
    setCashingOut(true);
    try {
      await onCashout(ticket);
      onClose();
    } catch {
      setCashingOut(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "#f5f6fa", borderRadius: "24px 24px 0 0", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ background: statusBg, borderRadius: "20px 20px 0 0", padding: "14px 14px 12px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -25, right: -15, width: 90, height: 90, background: "rgba(255,255,255,0.08)", borderRadius: "50%" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                <Shield size={11} style={{ color: "rgba(255,255,255,0.8)" }} />
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.75)", fontWeight: 700, letterSpacing: 1.5, fontFamily: "Oswald, sans-serif" }}>BET TICKET</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#fff", fontFamily: "Oswald, sans-serif", letterSpacing: 0.5 }}>#{ticket.ticketId.slice(-10)}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{ticket.date} · {ticket.type}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 20, padding: "3px 10px", marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: "#fff", fontWeight: 800, fontFamily: "Oswald, sans-serif" }}>{ticket.selections.length} {ticket.selections.length === 1 ? "SEL" : "SELS"}</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", fontFamily: "Oswald, sans-serif" }}>{ticket.totalOdds.toFixed(2)}x</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.65)" }}>TOTAL ODDS</div>
            </div>
          </div>
          {ticket.status === "won" && (
            <div style={{ marginTop: 8, background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "6px 10px", display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle size={13} style={{ color: "#fff" }} />
              <div style={{ fontSize: 11, color: "#fff", fontWeight: 800, fontFamily: "Oswald, sans-serif" }}>WON UGX {(ticket.payout || ticket.potentialWin).toLocaleString()}</div>
            </div>
          )}
          {ticket.status === "lost" && (
            <div style={{ marginTop: 8, background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: "6px 10px", display: "flex", alignItems: "center", gap: 6 }}>
              <XCircle size={13} style={{ color: "rgba(255,255,255,0.8)" }} />
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>Better luck next time.</div>
            </div>
          )}
        </div>

        <div style={{ background: "#1a1a2e", padding: "4px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 1 }}>
            {Array.from({ length: 42 }, (_, i) => (
              <div key={i} style={{ width: i % 3 === 0 ? 2 : 1, height: 16, background: i % 4 === 0 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)", borderRadius: 1 }} />
            ))}
          </div>
          <span style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", marginLeft: 6, whiteSpace: "nowrap" }}>{ticket.ticketId.slice(-10)}</span>
        </div>

        <div style={{ padding: "8px 10px" }}>
          <div style={{ fontSize: 9, color: "#999", fontWeight: 700, letterSpacing: 1, marginBottom: 6, fontFamily: "Oswald, sans-serif" }}>SELECTIONS</div>
          {ticket.selections.map((sel, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 8, marginBottom: 6, border: "1px solid #eee", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "stretch" }}>
                <div style={{ width: 3, background: sel.status === "won" ? "#2DA962" : sel.status === "lost" ? "#e53935" : "#fb8c00", flexShrink: 0 }} />
                <div style={{ flex: 1, padding: "7px 10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#1a1a2e", marginBottom: 3 }}>{sel.match}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontSize: 10, color: "#555", background: "#f0f0f0", borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>{sel.pick}</span>
                        <span style={{ fontSize: 10, color: "#2DA962", fontWeight: 800, fontFamily: "Oswald, sans-serif" }}>@ {sel.odd}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", marginLeft: 8, flexShrink: 0 }}>
                      <StatusBadge status={sel.status} />
                      {sel.score && <div style={{ fontSize: 12, fontWeight: 900, color: "#1a1a2e", marginTop: 3, fontFamily: "Oswald, sans-serif" }}>{sel.score}</div>}
                      <div style={{ fontSize: 9, color: "#aaa", marginTop: 1 }}>{sel.time}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ margin: "0 10px", display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ flex: 1, borderTop: "2px dashed #ddd" }} />
          <span style={{ fontSize: 13, transform: "rotate(-90deg)" }}>✂</span>
          <div style={{ flex: 1, borderTop: "2px dashed #ddd" }} />
        </div>

        <div style={{ margin: "8px 10px", background: "#fff", borderRadius: 10, overflow: "hidden", border: "1px solid #eee" }}>
          <div style={{ display: "flex", borderBottom: "1px solid #f0f0f0" }}>
            <div style={{ flex: 1, padding: "8px 12px", borderRight: "1px solid #f0f0f0" }}>
              <div style={{ fontSize: 9, color: "#aaa", fontWeight: 700, marginBottom: 2 }}>STAKE</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#1a1a2e", fontFamily: "Oswald, sans-serif" }}>UGX {ticket.stake.toLocaleString()}</div>
            </div>
            <div style={{ flex: 1, padding: "8px 12px" }}>
              <div style={{ fontSize: 9, color: "#aaa", fontWeight: 700, marginBottom: 2 }}>TOTAL ODDS</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#2DA962", fontFamily: "Oswald, sans-serif" }}>{ticket.totalOdds.toFixed(2)}x</div>
            </div>
          </div>
          <div style={{ padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 9, color: "#aaa", fontWeight: 700, marginBottom: 2 }}>
                {ticket.status === "pending" ? "POTENTIAL WIN" : ticket.status === "won" ? "PAYOUT" : "POTENTIAL WIN"}
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, fontFamily: "Oswald, sans-serif", color: ticket.status === "won" ? "#1a8a4c" : ticket.status === "lost" ? "#c62828" : "#e65100" }}>
                UGX {ticket.potentialWin.toLocaleString()}
              </div>
            </div>
            <StatusBadge status={ticket.status} size="lg" />
          </div>
        </div>

        {ticket.status === "pending" && ticket.cashout && ticket.cashout > 0 && (
          <div style={{ margin: "0 10px 10px", background: "linear-gradient(135deg, #1a1a2e, #2d2d50)", borderRadius: 10, padding: "10px 12px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", fontWeight: 700, letterSpacing: 0.5, marginBottom: 2 }}>CASHOUT AVAILABLE</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#ffe60f", fontFamily: "Oswald, sans-serif" }}>UGX {ticket.cashout.toLocaleString()}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>Lock in your winnings now</div>
              </div>
              <div style={{ width: 36, height: 36, background: "rgba(255,230,15,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap size={16} style={{ color: "#ffe60f" }} />
              </div>
            </div>
            <button
              onClick={handleCashoutClick}
              disabled={cashingOut}
              style={{ width: "100%", background: cashingOut ? "rgba(255,230,15,0.3)" : "#ffe60f", color: "#1a1a2e", fontFamily: "Oswald, sans-serif", fontWeight: 900, fontSize: 13, padding: "10px 0", borderRadius: 8, border: "none", cursor: cashingOut ? "default" : "pointer", letterSpacing: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <Zap size={14} />
              {cashingOut ? "PROCESSING..." : `CASH OUT UGX ${ticket.cashout.toLocaleString()}`}
            </button>
          </div>
        )}

        <div style={{ padding: "0 10px 20px" }}>
          <button onClick={onClose} style={{ width: "100%", background: "#f0f0f0", color: "#555", fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: 12, padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer", letterSpacing: 0.5 }}>
            CLOSE TICKET
          </button>
        </div>
      </div>
    </div>
  );
}

function TicketCard({ ticket, onClick }: { ticket: Ticket; onClick: () => void }) {
  const statusColor = { won: "#1a8a4c", lost: "#c62828", pending: "#e65100", cashed_out: "#1565c0" }[ticket.status] ?? "#e65100";
  const statusBg = { won: "rgba(45,169,98,0.06)", lost: "rgba(229,57,53,0.05)", pending: "rgba(251,140,0,0.06)", cashed_out: "rgba(21,101,192,0.06)" }[ticket.status] ?? "rgba(251,140,0,0.06)";
  const statusBorder = { won: "rgba(45,169,98,0.2)", lost: "rgba(229,57,53,0.2)", pending: "rgba(251,140,0,0.2)", cashed_out: "rgba(21,101,192,0.2)" }[ticket.status] ?? "rgba(251,140,0,0.2)";

  return (
    <div onClick={onClick} style={{ background: statusBg, borderRadius: 14, marginBottom: 10, border: `1px solid ${statusBorder}`, overflow: "hidden", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", transition: "transform 0.15s" } as React.CSSProperties}>
      <div style={{ height: 3, background: statusColor, width: "100%" }} />
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
              <Ticket size={11} style={{ color: "#aaa" }} />
              <span style={{ fontSize: 10, color: "#888", fontWeight: 700, fontFamily: "monospace", letterSpacing: 0.5 }}>{ticket.ticketId.slice(-10)}</span>
            </div>
            <div style={{ fontSize: 11, color: "#555", marginBottom: 2 }}>{ticket.type} · {ticket.selections.length} {ticket.selections.length === 1 ? "selection" : "selections"}</div>
            <div style={{ fontSize: 10, color: "#bbb" }}>{ticket.date}</div>
          </div>
          <StatusBadge status={ticket.status} size="lg" />
        </div>

        <div style={{ display: "flex", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 8, gap: 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: "#aaa", fontWeight: 700, marginBottom: 1 }}>STAKE</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#1a1a2e", fontFamily: "Oswald, sans-serif" }}>UGX {ticket.stake.toLocaleString()}</div>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#aaa", fontWeight: 700, marginBottom: 1 }}>ODDS</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#2DA962", fontFamily: "Oswald, sans-serif" }}>{ticket.totalOdds.toFixed(2)}x</div>
          </div>
          <div style={{ flex: 1, textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "#aaa", fontWeight: 700, marginBottom: 1 }}>{ticket.status === "won" ? "PAYOUT" : "POTENTIAL"}</div>
            <div style={{ fontSize: 13, fontWeight: 800, fontFamily: "Oswald, sans-serif", color: statusColor }}>UGX {ticket.potentialWin.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyBetsTab() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingBets, setLoadingBets] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [openTicket, setOpenTicket] = useState<Ticket | null>(null);
  const tabs = ["Open", "Settled", "All"];

  const handleCashout = async (ticket: Ticket) => {
    if (!user?.uid || !ticket.cashout || ticket.cashout <= 0) return;
    const amount = ticket.cashout;
    const now = new Date().toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

    await updateDoc(doc(db, "bets", ticket.id), {
      status: "cashed_out",
      payout: amount,
      cashout: 0,
      settledAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "users", user.uid), {
      balance: increment(amount),
      winnings: increment(amount),
      pendingBets: increment(-1),
      pendingBetAmount: increment(-ticket.stake),
    });

    await addDoc(collection(db, "transactions"), {
      userId: user.uid,
      userName: user.name ?? user.phone ?? "",
      type: "cashout",
      amount,
      description: `Cashout — ${ticket.selections.length} selection(s) — UGX ${amount.toLocaleString()}`,
      method: "Platform",
      ref: "CASH-" + ticket.id.slice(-10),
      status: "completed",
      date: now,
      createdAt: serverTimestamp(),
    });
  };

  useEffect(() => {
    if (!user?.uid) { setLoadingBets(false); return; }
    const q = query(
      collection(db, "bets"),
      where("userId", "==", user.uid),
    );
    const unsub = onSnapshot(q, (snap) => {
      const bets = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Ticket, "id">) }));
      bets.sort((a, b) => {
        const aMs = (a as any).createdAt?.toMillis?.() ?? 0;
        const bMs = (b as any).createdAt?.toMillis?.() ?? 0;
        return bMs - aMs;
      });
      setTickets(bets);
      setLoadingBets(false);
    });
    return unsub;
  }, [user?.uid]);

  const filtered = tickets.filter((t) => {
    if (activeTab === "Open") return t.status === "pending";
    if (activeTab === "Settled") return t.status !== "pending";
    return true;
  });

  const totalStaked = filtered.reduce((s, t) => s + t.stake, 0);
  const totalWon = filtered.filter((t) => t.status === "won").reduce((s, t) => s + (t.payout || t.potentialWin), 0);

  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{ padding: "12px 14px 0" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1, background: "#fff", borderRadius: 12, padding: "10px 12px", border: "1px solid var(--border)", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 3 }}>Total Staked</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--dark)", fontFamily: "Oswald, sans-serif" }}>UGX {totalStaked.toLocaleString()}</div>
          </div>
          <div style={{ flex: 1, background: "#fff", borderRadius: 12, padding: "10px 12px", border: "1px solid var(--border)", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 3 }}>Total Won</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--green)", fontFamily: "Oswald, sans-serif" }}>UGX {totalWon.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: "2px solid var(--border)", margin: "0 14px" }}>
        {tabs.map((tab) => (
          <div key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, textAlign: "center", padding: "10px 0", fontSize: 13, fontWeight: 700, fontFamily: "Oswald, sans-serif", letterSpacing: 0.3, cursor: "pointer", color: activeTab === tab ? "var(--green)" : "var(--text-muted)", borderBottom: `2px solid ${activeTab === tab ? "var(--green)" : "transparent"}`, marginBottom: -2, transition: "all 0.2s" }}>
            {tab}
            <span style={{ background: activeTab === tab ? "var(--green)" : "var(--border)", color: activeTab === tab ? "#fff" : "var(--text-muted)", fontSize: 10, fontWeight: 700, borderRadius: 8, padding: "1px 6px", marginLeft: 5 }}>
              {tickets.filter((t) => tab === "All" ? true : tab === "Open" ? t.status === "pending" : t.status !== "pending").length}
            </span>
          </div>
        ))}
      </div>

      <div style={{ padding: "12px 14px 0" }}>
        {loadingBets ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Loading bets...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
            <Ticket size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
            <div style={{ fontSize: 14, fontWeight: 600 }}>No bets found</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>Place your first bet to see it here</div>
          </div>
        ) : filtered.map((t) => <TicketCard key={t.id} ticket={t} onClick={() => setOpenTicket(t)} />)}
      </div>

      {openTicket && <TicketModal ticket={openTicket} onClose={() => setOpenTicket(null)} onCashout={handleCashout} />}
    </div>
  );
}
