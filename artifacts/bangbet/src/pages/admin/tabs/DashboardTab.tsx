import { useState, useEffect } from "react";
import { Users, Ticket, TrendingUp, DollarSign, ArrowDownLeft, ArrowUpRight, CheckCircle, Activity } from "lucide-react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { AdminUser, AdminBet, AdminTransaction } from "../adminData";

function StatCard({ icon: Icon, label, value, sub, color, bg }: { icon: any; label: string; value: string; sub?: string; color: string; bg: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1px solid #e2e8f0", display: "flex", alignItems: "flex-start", gap: 14 }}>
      <div style={{ width: 46, height: 46, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={22} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", fontFamily: "Oswald, sans-serif", letterSpacing: 0.5 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function DashboardTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [bets, setBets] = useState<AdminBet[]>([]);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [usersSnap, betsSnap, txnsSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(query(collection(db, "bets"), orderBy("createdAt", "desc"), limit(100))),
        getDocs(query(collection(db, "transactions"), orderBy("createdAt", "desc"), limit(200))),
      ]);
      setUsers(usersSnap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<AdminUser, "id">) })));
      setBets(betsSnap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<AdminBet, "id">) })));
      setTransactions(txnsSnap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<AdminTransaction, "id">) })));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Loading dashboard data...</div>;
  }

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === "active").length;
  const totalDeposited = transactions.filter(t => (t.type === "deposit") && t.status === "completed").reduce((s, t) => s + t.amount, 0);
  const totalWithdrawn = transactions.filter(t => (t.type === "withdrawal" || t.type === "withdraw") && t.status === "completed").reduce((s, t) => s + t.amount, 0);
  const pendingBets = bets.filter(b => b.status === "pending").length;
  const wonBets = bets.filter(b => b.status === "won").length;
  const pendingPayouts = bets.filter(b => b.status === "pending").reduce((s, b) => s + b.potentialWin, 0);
  const platformBalance = totalDeposited - totalWithdrawn;
  const pendingWithdrawals = transactions.filter(t => (t.type === "withdrawal" || t.type === "withdraw") && t.status === "pending").length;

  const recentTxns = transactions.slice(0, 6);
  const recentBets = bets.slice(0, 5);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", fontFamily: "Oswald, sans-serif" }}>Dashboard Overview</div>
        <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>Welcome back, Admin. Here's what's happening today.</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard icon={Users} label="Total Users" value={totalUsers.toString()} sub={`${activeUsers} active`} color="#2DA962" bg="rgba(45,169,98,0.1)" />
        <StatCard icon={DollarSign} label="Total Deposits" value={`UGX ${(totalDeposited/1000000).toFixed(2)}M`} sub="All time" color="#1565c0" bg="rgba(21,101,192,0.1)" />
        <StatCard icon={ArrowUpRight} label="Total Withdrawals" value={`UGX ${(totalWithdrawn/1000000).toFixed(2)}M`} sub="All time" color="#e65100" bg="rgba(230,81,0,0.1)" />
        <StatCard icon={TrendingUp} label="Platform Balance" value={`UGX ${(platformBalance/1000000).toFixed(2)}M`} sub="Net position" color="#7c3aed" bg="rgba(124,58,237,0.1)" />
        <StatCard icon={Ticket} label="Pending Bets" value={pendingBets.toString()} sub={`UGX ${(pendingPayouts/1000000).toFixed(2)}M liability`} color="#f59e0b" bg="rgba(245,158,11,0.1)" />
        <StatCard icon={CheckCircle} label="Won Bets" value={wonBets.toString()} sub={`${bets.filter(b => b.status === "lost").length} lost`} color="#2DA962" bg="rgba(45,169,98,0.1)" />
        <StatCard icon={Activity} label="Total Tickets" value={bets.length.toString()} sub="All time" color="#0f172a" bg="rgba(15,23,42,0.07)" />
        <StatCard icon={ArrowDownLeft} label="Pending Withdrawals" value={pendingWithdrawals.toString()} sub="Awaiting processing" color="#ef4444" bg="rgba(239,68,68,0.1)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Recent Transactions</div>
          </div>
          {recentTxns.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No transactions yet</div>
          ) : recentTxns.map((t) => (
            <div key={t.id} style={{ padding: "10px 18px", borderBottom: "1px solid #f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{t.userName}</div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>{t.type} · {t.date}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: (t.type === "withdrawal" || t.type === "withdraw" || t.type === "bet") ? "#ef4444" : "#2DA962", fontFamily: "Oswald, sans-serif" }}>
                  {(t.type === "withdrawal" || t.type === "withdraw" || t.type === "bet") ? "-" : "+"}UGX {t.amount.toLocaleString()}
                </div>
                <div style={{ fontSize: 10, color: t.status === "completed" ? "#2DA962" : t.status === "pending" ? "#f59e0b" : "#ef4444", fontWeight: 600 }}>{t.status}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Recent Bets</div>
          </div>
          {recentBets.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No bets yet</div>
          ) : recentBets.map((b) => (
            <div key={b.id} style={{ padding: "10px 18px", borderBottom: "1px solid #f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{b.userName}</div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>#{String(b.ticketId).slice(-6)} · {b.type} · {b.selectionsCount} sel</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", fontFamily: "Oswald, sans-serif" }}>UGX {b.stake.toLocaleString()}</div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10, background: b.status === "won" ? "rgba(45,169,98,0.1)" : b.status === "lost" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)", color: b.status === "won" ? "#2DA962" : b.status === "lost" ? "#ef4444" : "#f59e0b" }}>{b.status.toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
