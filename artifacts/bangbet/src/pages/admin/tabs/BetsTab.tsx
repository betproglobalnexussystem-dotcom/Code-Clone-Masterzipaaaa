import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { AdminBet } from "../adminData";

export default function BetsTab() {
  const [bets, setBets] = useState<AdminBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "bets"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setBets(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<AdminBet, "id">) })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const filters = ["All", "Pending", "Won", "Lost", "Cashed Out"];
  const filtered = bets.filter(b => {
    const matchSearch = b.userName?.toLowerCase().includes(search.toLowerCase()) || String(b.ticketId).includes(search);
    const matchFilter = filter === "All" || b.status === filter.toLowerCase().replace(" ", "_");
    return matchSearch && matchFilter;
  });

  const totalStake = filtered.reduce((s, b) => s + b.stake, 0);
  const totalLiability = filtered.filter(b => b.status === "pending").reduce((s, b) => s + b.potentialWin, 0);

  const settleBet = async (bet: AdminBet, newStatus: "won" | "lost") => {
    if (updating) return;
    setUpdating(bet.id);
    try {
      await updateDoc(doc(db, "bets", bet.id), { status: newStatus });
      const userRef = doc(db, "users", bet.userId);
      if (newStatus === "won") {
        const now = new Date().toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
        await updateDoc(userRef, {
          wonBets: increment(1),
          pendingBets: increment(-1),
          pendingBetAmount: increment(-bet.stake),
          winnings: increment(bet.potentialWin),
          balance: increment(bet.potentialWin),
        });
        await addDoc(collection(db, "transactions"), {
          userId: bet.userId,
          userName: bet.userName,
          type: "win",
          amount: bet.potentialWin,
          description: `Bet won — Ticket #${String(bet.ticketId).slice(-8)}`,
          method: "Platform",
          ref: "WIN-" + bet.ticketId,
          status: "completed",
          date: now,
          createdAt: serverTimestamp(),
        });
      } else {
        await updateDoc(userRef, {
          lostBets: increment(1),
          pendingBets: increment(-1),
          pendingBetAmount: increment(-bet.stake),
        });
      }
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading bets...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", fontFamily: "Oswald, sans-serif" }}>Bets & Tickets</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{bets.length} total tickets placed</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>TOTAL STAKE</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#0f172a", fontFamily: "Oswald, sans-serif" }}>UGX {totalStake.toLocaleString()}</div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>PENDING LIABILITY</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#ef4444", fontFamily: "Oswald, sans-serif" }}>UGX {totalLiability.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by user or ticket ID..." style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 12px 10px 36px", fontSize: 13, boxSizing: "border-box", background: "#fff" }} />
        </div>
        <div style={{ display: "flex", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
          {filters.map(f => (
            <div key={f} onClick={() => setFilter(f)} style={{ padding: "0 12px", display: "flex", alignItems: "center", fontSize: 11, fontWeight: 700, cursor: "pointer", background: filter === f ? "#0f172a" : "transparent", color: filter === f ? "#fff" : "#64748b", transition: "all 0.15s", whiteSpace: "nowrap" }}>{f}</div>
          ))}
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.2fr 0.8fr 1fr 1fr 0.8fr 90px 120px", padding: "10px 18px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
          {["Ticket ID", "User", "Type", "Stake", "Potential Win", "Odds", "Status", "Action"].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</div>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No bets found</div>
        ) : filtered.map(b => (
          <div key={b.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 1.2fr 0.8fr 1fr 1fr 0.8fr 90px 120px", padding: "12px 18px", borderBottom: "1px solid #f8fafc", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", fontFamily: "monospace" }}>#{String(b.ticketId).slice(-8)}</div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>{b.date}</div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{b.userName}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{b.type}<br /><span style={{ color: "#94a3b8" }}>{b.selectionsCount} sel</span></div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", fontFamily: "Oswald, sans-serif" }}>UGX {b.stake.toLocaleString()}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#2DA962", fontFamily: "Oswald, sans-serif" }}>UGX {b.potentialWin.toLocaleString()}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#1565c0", fontFamily: "Oswald, sans-serif" }}>{b.totalOdds.toFixed(2)}x</div>
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 12, background: b.status === "won" ? "rgba(45,169,98,0.1)" : b.status === "lost" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)", color: b.status === "won" ? "#2DA962" : b.status === "lost" ? "#ef4444" : "#f59e0b", textTransform: "uppercase" }}>{b.status}</span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {b.status === "pending" && (
                <>
                  <button
                    onClick={() => settleBet(b, "won")}
                    disabled={updating === b.id}
                    style={{ fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 6, background: "rgba(45,169,98,0.1)", color: "#2DA962", border: "1px solid rgba(45,169,98,0.3)", cursor: "pointer" }}
                  >
                    Won
                  </button>
                  <button
                    onClick={() => settleBet(b, "lost")}
                    disabled={updating === b.id}
                    style={{ fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 6, background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer" }}
                  >
                    Lost
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
