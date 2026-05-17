import { useState, useEffect } from "react";
import { Search, Download } from "lucide-react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { AdminTransaction } from "../adminData";

export default function TransactionsTab() {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<AdminTransaction, "id">) })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const types = ["All", "Deposit", "Withdrawal", "Win", "Bonus", "Bet", "Referral"];
  const statuses = ["All", "Completed", "Pending", "Failed"];

  const filtered = transactions.filter(t => {
    const uname = t.userName ?? "";
    const ref = t.ref ?? t.description ?? "";
    const matchSearch = uname.toLowerCase().includes(search.toLowerCase()) || ref.toLowerCase().includes(search.toLowerCase());
    const ttype = t.type === "withdraw" ? "withdrawal" : t.type;
    const matchType = typeFilter === "All" || ttype === typeFilter.toLowerCase();
    const matchStatus = statusFilter === "All" || t.status === statusFilter.toLowerCase();
    return matchSearch && matchType && matchStatus;
  });

  const totalIn = filtered.filter(t => ["deposit", "bonus", "win", "referral"].includes(t.type) && t.status === "completed").reduce((s, t) => s + t.amount, 0);
  const totalOut = filtered.filter(t => (t.type === "withdrawal" || t.type === "withdraw") && t.status === "completed").reduce((s, t) => s + t.amount, 0);

  const typeColors: Record<string, { bg: string; color: string }> = {
    deposit:    { bg: "rgba(45,169,98,0.1)",    color: "#2DA962" },
    withdrawal: { bg: "rgba(239,68,68,0.1)",    color: "#ef4444" },
    withdraw:   { bg: "rgba(239,68,68,0.1)",    color: "#ef4444" },
    win:        { bg: "rgba(21,101,192,0.1)",   color: "#1565c0" },
    bonus:      { bg: "rgba(124,58,237,0.1)",   color: "#7c3aed" },
    bet:        { bg: "rgba(245,158,11,0.1)",   color: "#f59e0b" },
    cashout:    { bg: "rgba(8,145,178,0.1)",    color: "#0891b2" },
    referral:   { bg: "rgba(230,81,0,0.1)",     color: "#e65100" },
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading transactions...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", fontFamily: "Oswald, sans-serif" }}>All Transactions</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{transactions.length} transactions total</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 16px" }}>
            <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>TOTAL IN</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#2DA962", fontFamily: "Oswald, sans-serif" }}>UGX {totalIn.toLocaleString()}</div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 16px" }}>
            <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>TOTAL OUT</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#ef4444", fontFamily: "Oswald, sans-serif" }}>UGX {totalOut.toLocaleString()}</div>
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 6, background: "#0f172a", color: "#fff", border: "none", borderRadius: 10, padding: "0 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by user or reference..." style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 12px 10px 36px", fontSize: 13, boxSizing: "border-box", background: "#fff" }} />
        </div>
        <div style={{ display: "flex", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
          {types.map(t => (
            <div key={t} onClick={() => setTypeFilter(t)} style={{ padding: "0 11px", display: "flex", alignItems: "center", fontSize: 11, fontWeight: 700, cursor: "pointer", background: typeFilter === t ? "#0f172a" : "transparent", color: typeFilter === t ? "#fff" : "#64748b", transition: "all 0.15s", whiteSpace: "nowrap", height: 40 }}>{t}</div>
          ))}
        </div>
        <div style={{ display: "flex", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
          {statuses.map(s => (
            <div key={s} onClick={() => setStatusFilter(s)} style={{ padding: "0 11px", display: "flex", alignItems: "center", fontSize: 11, fontWeight: 700, cursor: "pointer", background: statusFilter === s ? "#0f172a" : "transparent", color: statusFilter === s ? "#fff" : "#64748b", transition: "all 0.15s", whiteSpace: "nowrap", height: 40 }}>{s}</div>
          ))}
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr 1fr 1.2fr 1fr 90px", padding: "10px 18px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
          {["User", "Description", "Type", "Amount", "Date", "Status"].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</div>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No transactions found</div>
        ) : filtered.map(t => {
          const displayType = t.type === "withdraw" ? "withdrawal" : t.type;
          const tc = typeColors[t.type] || { bg: "#f1f5f9", color: "#64748b" };
          const isOut = t.type === "withdrawal" || t.type === "withdraw" || t.type === "bet";
          return (
            <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr 1fr 1.2fr 1fr 90px", padding: "12px 18px", borderBottom: "1px solid #f8fafc", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{t.userName ?? "—"}</div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>{t.userId?.slice(0, 8)}…</div>
              </div>
              <div style={{ fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description ?? t.method ?? "—"}</div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 12, background: tc.bg, color: tc.color, textTransform: "capitalize" }}>{displayType}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 900, fontFamily: "Oswald, sans-serif", color: isOut ? "#ef4444" : "#2DA962" }}>
                {isOut ? "-" : "+"}UGX {t.amount.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{t.date}</div>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 12, background: t.status === "completed" ? "rgba(45,169,98,0.1)" : t.status === "pending" ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)", color: t.status === "completed" ? "#2DA962" : t.status === "pending" ? "#f59e0b" : "#ef4444" }}>{t.status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
