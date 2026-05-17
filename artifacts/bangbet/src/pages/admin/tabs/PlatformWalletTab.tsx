import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, TrendingDown, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { AdminUser, AdminBet, AdminTransaction } from "../adminData";

export default function PlatformWalletTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [bets, setBets] = useState<AdminBet[]>([]);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [usersSnap, betsSnap, txnsSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "bets")),
        getDocs(collection(db, "transactions")),
      ]);
      setUsers(usersSnap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<AdminUser, "id">) })));
      setBets(betsSnap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<AdminBet, "id">) })));
      setTransactions(txnsSnap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<AdminTransaction, "id">) })));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading wallet data...</div>;

  const completedDeposits = transactions.filter(t => t.type === "deposit" && t.status === "completed").reduce((s, t) => s + t.amount, 0);
  const completedWithdrawals = transactions.filter(t => (t.type === "withdrawal" || t.type === "withdraw") && t.status === "completed").reduce((s, t) => s + t.amount, 0);
  const pendingWithdrawals = transactions.filter(t => (t.type === "withdrawal" || t.type === "withdraw") && t.status === "pending").reduce((s, t) => s + t.amount, 0);
  const totalPaidWinnings = transactions.filter(t => t.type === "win" && t.status === "completed").reduce((s, t) => s + t.amount, 0);
  const pendingLiability = bets.filter(b => b.status === "pending").reduce((s, b) => s + b.potentialWin, 0);
  const totalUserBalances = users.reduce((s, u) => s + (u.balance ?? 0), 0);
  const pendingBetStakes = users.reduce((s, u) => s + (u.pendingBetAmount ?? 0), 0);
  const realPlatformBalance = completedDeposits - completedWithdrawals - totalPaidWinnings;

  const walletBreakdown = [
    { label: "Total User Deposits", val: completedDeposits, color: "#2DA962", icon: TrendingUp, note: "All successful deposits" },
    { label: "Total Withdrawals Paid", val: completedWithdrawals, color: "#ef4444", icon: TrendingDown, note: "Processed withdrawals" },
    { label: "Total Winnings Paid", val: totalPaidWinnings, color: "#f59e0b", icon: DollarSign, note: "Player winnings credited" },
    { label: "Platform Net Balance", val: realPlatformBalance, color: "#1565c0", icon: CheckCircle, note: "Deposits - Withdrawals - Winnings" },
    { label: "Pending Withdrawals", val: pendingWithdrawals, color: "#f59e0b", icon: Clock, note: "Awaiting processing" },
    { label: "Pending Bet Liability", val: pendingLiability, color: "#ef4444", icon: AlertTriangle, note: "Max potential payout on open bets" },
    { label: "Total User Balances", val: totalUserBalances, color: "#7c3aed", icon: DollarSign, note: "Sum of all user wallet balances" },
    { label: "Staked in Pending Bets", val: pendingBetStakes, color: "#0891b2", icon: Clock, note: "Locked in active bets" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", fontFamily: "Oswald, sans-serif" }}>Platform Wallet</div>
        <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>Real-time financial overview of the platform</div>
      </div>

      <div style={{ background: "linear-gradient(135deg,#0f172a,#1e3a5f)", borderRadius: 18, padding: "24px 28px", marginBottom: 24, color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -30, width: 160, height: 160, background: "rgba(255,255,255,0.04)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: -60, left: 40, width: 140, height: 140, background: "rgba(45,169,98,0.08)", borderRadius: "50%" }} />
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Platform Net Balance</div>
        <div style={{ fontSize: 42, fontWeight: 900, fontFamily: "Oswald, sans-serif", letterSpacing: 1, color: "#fff" }}>UGX {realPlatformBalance.toLocaleString()}</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>Total deposits minus all payouts and winnings</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginTop: 22 }}>
          {[
            { label: "Gross Deposits", val: completedDeposits, color: "#4ade80" },
            { label: "Total Paid Out", val: completedWithdrawals + totalPaidWinnings, color: "#f87171" },
            { label: "Pending Liability", val: pendingLiability, color: "#fbbf24" },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 900, fontFamily: "Oswald, sans-serif", color: s.color }}>UGX {(s.val/1000000).toFixed(2)}M</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: 14, marginBottom: 24 }}>
        {walletBreakdown.map(item => (
          <div key={item.label} style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${item.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <item.icon size={18} color={item.color} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>{item.label}</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "Oswald, sans-serif", color: item.color }}>UGX {item.val.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{item.note}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Per-User Wallet Balances ({users.length} users)</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "10px 18px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
          {["User", "Balance", "Pending Bets", "Winnings", "Real Balance"].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</div>
          ))}
        </div>
        {users.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No users yet</div>
        ) : users.map(u => (
          <div key={u.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "12px 18px", borderBottom: "1px solid #f8fafc", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{u.name}</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>{u.phone}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, fontFamily: "Oswald, sans-serif", color: "#0f172a" }}>UGX {(u.balance ?? 0).toLocaleString()}</div>
            <div style={{ fontSize: 13, fontWeight: 800, fontFamily: "Oswald, sans-serif", color: "#f59e0b" }}>UGX {(u.pendingBetAmount ?? 0).toLocaleString()}</div>
            <div style={{ fontSize: 13, fontWeight: 800, fontFamily: "Oswald, sans-serif", color: "#2DA962" }}>UGX {(u.winnings ?? 0).toLocaleString()}</div>
            <div style={{ fontSize: 13, fontWeight: 800, fontFamily: "Oswald, sans-serif", color: "#1565c0" }}>UGX {((u.balance ?? 0) - (u.pendingBetAmount ?? 0)).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
