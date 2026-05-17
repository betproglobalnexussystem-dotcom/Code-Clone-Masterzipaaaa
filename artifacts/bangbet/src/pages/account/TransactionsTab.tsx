import { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Gift, Ticket, Trophy, Users, Filter } from "lucide-react";
import { useAuth, type Transaction } from "../../context/AuthContext";

const TYPE_CONFIG: Record<Transaction["type"], { icon: typeof ArrowDownCircle; color: string; label: string }> = {
  deposit: { icon: ArrowDownCircle, color: "#2DA962", label: "Deposit" },
  withdraw: { icon: ArrowUpCircle, color: "#1565c0", label: "Withdrawal" },
  bonus: { icon: Gift, color: "#e65100", label: "Bonus" },
  bet: { icon: Ticket, color: "#37474f", label: "Bet Placed" },
  win: { icon: Trophy, color: "#2DA962", label: "Win" },
  referral: { icon: Users, color: "#7b1fa2", label: "Referral" },
};

function TxnCard({ txn }: { txn: Transaction }) {
  const cfg = TYPE_CONFIG[txn.type];
  const Icon = cfg.icon;
  const isCredit = ["deposit", "bonus", "win", "referral"].includes(txn.type);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", borderRadius: 13, padding: "12px 14px", marginBottom: 8, border: "1px solid var(--border)" }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: cfg.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1.5px solid ${cfg.color}33` }}>
        <Icon size={20} color={cfg.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--dark)", marginBottom: 2 }}>{cfg.label}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{txn.description}</div>
        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>{txn.date}</div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "Oswald, sans-serif", color: isCredit ? "var(--green)" : "var(--red)" }}>
          {isCredit ? "+" : "-"}UGX {txn.amount.toLocaleString()}
        </div>
        <div style={{ fontSize: 10, marginTop: 3, fontWeight: 600, color: txn.status === "completed" ? "var(--green)" : txn.status === "pending" ? "#f57c00" : "var(--red)", background: txn.status === "completed" ? "#e8f5e9" : txn.status === "pending" ? "#fff3e0" : "#ffeaea", padding: "1px 7px", borderRadius: 5 }}>
          {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
        </div>
      </div>
    </div>
  );
}

const FILTERS = ["All", "Deposits", "Withdrawals", "Bonuses"] as const;

export default function TransactionsTab() {
  const { transactions } = useAuth();
  const [filter, setFilter] = useState<typeof FILTERS[number]>("All");

  const filtered = transactions.filter((t) => {
    if (filter === "Deposits") return t.type === "deposit";
    if (filter === "Withdrawals") return t.type === "withdraw";
    if (filter === "Bonuses") return t.type === "bonus" || t.type === "referral";
    return true;
  });

  const totalIn = transactions.filter((t) => ["deposit", "bonus", "win", "referral"].includes(t.type)).reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter((t) => ["withdraw", "bet"].includes(t.type)).reduce((s, t) => s + t.amount, 0);

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* Summary */}
      <div style={{ padding: "12px 14px 0" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1, background: "#e8f5e9", borderRadius: 12, padding: "10px 12px", border: "1px solid #a5d6a7", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#4caf50", fontWeight: 600, marginBottom: 3 }}>Total In</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--green)", fontFamily: "Oswald, sans-serif" }}>UGX {totalIn.toLocaleString()}</div>
          </div>
          <div style={{ flex: 1, background: "#ffeaea", borderRadius: 12, padding: "10px 12px", border: "1px solid #ffb3b3", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "var(--red)", fontWeight: 600, marginBottom: 3 }}>Total Out</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--red)", fontFamily: "Oswald, sans-serif" }}>UGX {totalOut.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 6, padding: "0 14px", marginBottom: 12, alignItems: "center" }}>
        <Filter size={13} color="var(--text-muted)" />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{ fontSize: 11, fontWeight: 700, padding: "5px 11px", borderRadius: 20, border: `1.5px solid ${filter === f ? "var(--green)" : "var(--border)"}`, background: filter === f ? "var(--green)" : "#fff", color: filter === f ? "#fff" : "var(--text-muted)", cursor: "pointer" }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 14px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
            <ArrowDownCircle size={40} style={{ marginBottom: 12, opacity: 0.25 }} />
            <div style={{ fontSize: 14, fontWeight: 600 }}>No transactions yet</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>Make your first deposit to get started</div>
          </div>
        ) : filtered.map((txn) => <TxnCard key={txn.id} txn={txn} />)}
      </div>
    </div>
  );
}
