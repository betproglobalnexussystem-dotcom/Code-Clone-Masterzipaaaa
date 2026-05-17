import { useState, useEffect } from "react";
import { Search, CheckCircle, User, Phone, Globe, Monitor, Shield, ArrowLeft, Plus, Minus, Send, Ticket, ArrowLeftRight, Activity, Ban } from "lucide-react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment, addDoc, serverTimestamp, getDocs, where } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { AdminUser, AdminBet, AdminTransaction } from "../adminData";

function nowString() {
  return new Date().toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function RiskBadge({ level }: { level: string }) {
  const c = { low: { bg: "rgba(45,169,98,0.1)", color: "#2DA962" }, medium: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b" }, high: { bg: "rgba(239,68,68,0.1)", color: "#ef4444" } }[level] || { bg: "#eee", color: "#aaa" };
  return <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: c.bg, color: c.color, textTransform: "uppercase" }}>{level} RISK</span>;
}

function StatusBadge({ status }: { status: string }) {
  const c = { active: { bg: "rgba(45,169,98,0.1)", color: "#2DA962" }, suspended: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b" }, banned: { bg: "rgba(239,68,68,0.1)", color: "#ef4444" } }[status] || { bg: "#eee", color: "#aaa" };
  return <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 12, background: c.bg, color: c.color, textTransform: "uppercase" }}>{status}</span>;
}

function UserDetail({ user: initialUser, onBack }: { user: AdminUser; onBack: () => void }) {
  const [user, setUser] = useState({ ...initialUser });
  const [activeTab, setActiveTab] = useState("overview");
  const [addAmount, setAddAmount] = useState("");
  const [deductAmount, setDeductAmount] = useState("");
  const [msgText, setMsgText] = useState("");
  const [msgSent, setMsgSent] = useState(false);
  const [actionDone, setActionDone] = useState("");
  const [userBets, setUserBets] = useState<AdminBet[]>([]);
  const [userTxns, setUserTxns] = useState<AdminTransaction[]>([]);

  useEffect(() => {
    async function loadUserData() {
      const [betsSnap, txnsSnap] = await Promise.all([
        getDocs(query(collection(db, "bets"), where("userId", "==", user.id))),
        getDocs(query(collection(db, "transactions"), where("userId", "==", user.id))),
      ]);
      setUserBets(betsSnap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<AdminBet, "id">) })));
      setUserTxns(txnsSnap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<AdminTransaction, "id">) })));
    }
    loadUserData();
  }, [user.id]);

  const realBalance = (user.balance ?? 0) - (user.pendingBetAmount ?? 0);

  const handleAdd = async () => {
    const amt = parseInt(addAmount);
    if (!isNaN(amt) && amt > 0) {
      await updateDoc(doc(db, "users", user.id), { balance: increment(amt), totalDeposited: increment(amt) });
      await addDoc(collection(db, "transactions"), {
        userId: user.id, userName: user.name, type: "deposit", amount: amt,
        description: "Admin credit", method: "Admin", ref: "ADMIN-" + Date.now(),
        status: "completed", date: nowString(), createdAt: serverTimestamp(),
      });
      setUser(u => ({ ...u, balance: (u.balance ?? 0) + amt }));
      setAddAmount("");
      setActionDone(`+UGX ${amt.toLocaleString()} added`);
      setTimeout(() => setActionDone(""), 2500);
    }
  };

  const handleDeduct = async () => {
    const amt = parseInt(deductAmount);
    if (!isNaN(amt) && amt > 0 && amt <= (user.balance ?? 0)) {
      await updateDoc(doc(db, "users", user.id), { balance: increment(-amt) });
      setUser(u => ({ ...u, balance: (u.balance ?? 0) - amt }));
      setDeductAmount("");
      setActionDone(`-UGX ${amt.toLocaleString()} deducted`);
      setTimeout(() => setActionDone(""), 2500);
    }
  };

  const handleSendMsg = () => {
    if (msgText.trim()) { setMsgSent(true); setMsgText(""); setTimeout(() => setMsgSent(false), 2500); }
  };

  const handleToggleStatus = async () => {
    const newStatus = user.status === "active" ? "suspended" : "active";
    await updateDoc(doc(db, "users", user.id), { status: newStatus });
    setUser(u => ({ ...u, status: newStatus as "active" | "suspended" | "banned" }));
  };

  const handleBan = async () => {
    await updateDoc(doc(db, "users", user.id), { status: "banned" });
    setUser(u => ({ ...u, status: "banned" as const }));
  };

  const tabs = ["overview", "wallet", "bets", "transactions", "activity", "security"];

  return (
    <div>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13, fontWeight: 600, marginBottom: 16, padding: 0 }}>
        <ArrowLeft size={16} /> Back to Users
      </button>

      <div style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", borderRadius: 16, padding: "20px 22px", marginBottom: 20, color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -20, width: 120, height: 120, background: "rgba(255,255,255,0.04)", borderRadius: "50%" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(45,169,98,0.2)", border: "2px solid rgba(45,169,98,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: "#2DA962" }}>{user.name[0]}</span>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "Oswald, sans-serif" }}>{user.name}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{user.phone}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <StatusBadge status={user.status} />
                <RiskBadge level={user.riskLevel ?? "low"} />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleToggleStatus} style={{ background: user.status === "active" ? "rgba(245,158,11,0.2)" : "rgba(45,169,98,0.2)", border: `1px solid ${user.status === "active" ? "rgba(245,158,11,0.4)" : "rgba(45,169,98,0.4)"}`, color: user.status === "active" ? "#fbbf24" : "#2DA962", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              {user.status === "active" ? "Suspend" : "Activate"}
            </button>
            <button onClick={handleBan} style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <Ban size={13} /> Ban
            </button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 18 }}>
          {[{ label: "Total Bets", val: user.totalBets ?? 0 }, { label: "Won", val: user.wonBets ?? 0 }, { label: "Lost", val: user.lostBets ?? 0 }, { label: "Pending", val: user.pendingBets ?? 0 }].map(s => (
            <div key={s.label} style={{ textAlign: "center", background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "8px 4px" }}>
              <div style={{ fontSize: 18, fontWeight: 900, fontFamily: "Oswald, sans-serif" }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: "2px solid #e2e8f0", marginBottom: 18, gap: 0, overflowX: "auto" }}>
        {tabs.map(t => (
          <div key={t} onClick={() => setActiveTab(t)} style={{ padding: "9px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", color: activeTab === t ? "#2DA962" : "#94a3b8", borderBottom: `2px solid ${activeTab === t ? "#2DA962" : "transparent"}`, marginBottom: -2, textTransform: "capitalize", transition: "all 0.2s" }}>
            {t}
          </div>
        ))}
      </div>

      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>Account Info</div>
            {[
              { label: "User ID", val: user.id.slice(0, 12) + "…", icon: User },
              { label: "Phone", val: user.phone, icon: Phone },
              { label: "Country", val: user.country ?? "Uganda", icon: Globe },
              { label: "Device", val: user.device ?? "Web", icon: Monitor },
              { label: "Joined", val: user.joinDate ?? user.joinedDate ?? "—", icon: CheckCircle },
              { label: "Last Seen", val: user.lastSeen ?? "—", icon: Activity },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid #f8fafc" }}>
                <row.icon size={14} style={{ color: "#94a3b8", flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "#94a3b8", width: 80, flexShrink: 0 }}>{row.label}</span>
                <span style={{ fontSize: 12, color: "#0f172a", fontWeight: 600, flex: 1 }}>{String(row.val)}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1px solid #e2e8f0", marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>Financials</div>
              {[
                { label: "Total Deposited", val: `UGX ${(user.totalDeposited ?? 0).toLocaleString()}`, color: "#2DA962" },
                { label: "Total Withdrawn", val: `UGX ${(user.totalWithdrawn ?? 0).toLocaleString()}`, color: "#e65100" },
                { label: "Bonus Balance", val: `UGX ${(user.bonus ?? 0).toLocaleString()}`, color: "#7c3aed" },
                { label: "Winnings", val: `UGX ${(user.winnings ?? 0).toLocaleString()}`, color: "#1565c0" },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f8fafc" }}>
                  <span style={{ fontSize: 12, color: "#64748b" }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: row.color, fontFamily: "Oswald, sans-serif" }}>{row.val}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Send Notification</div>
              {msgSent && <div style={{ background: "rgba(45,169,98,0.1)", border: "1px solid rgba(45,169,98,0.3)", borderRadius: 8, padding: "7px 12px", fontSize: 12, color: "#2DA962", fontWeight: 600, marginBottom: 8 }}>✓ Notification sent!</div>}
              <textarea value={msgText} onChange={e => setMsgText(e.target.value)} placeholder="Type a message to send to this user..." style={{ width: "100%", height: 80, borderRadius: 8, border: "1.5px solid #e2e8f0", padding: "8px 10px", fontSize: 12, color: "#0f172a", resize: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
              <button onClick={handleSendMsg} style={{ marginTop: 8, background: "#2DA962", color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "Oswald, sans-serif" }}>
                <Send size={13} /> SEND MESSAGE
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "wallet" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ background: "linear-gradient(135deg,#1a6e3d,#2DA962)", borderRadius: 14, padding: "18px", marginBottom: 14, color: "#fff" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>MAIN BALANCE</div>
              <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "Oswald, sans-serif" }}>UGX {(user.balance ?? 0).toLocaleString()}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Pending Bets", val: user.pendingBetAmount ?? 0, color: "#f59e0b", note: "Locked in bets" },
                { label: "Winnings", val: user.winnings ?? 0, color: "#1565c0", note: "Credited wins" },
                { label: "Bonus", val: user.bonus ?? 0, color: "#7c3aed", note: "Bonus balance" },
                { label: "Real Balance", val: realBalance, color: "#2DA962", note: "Available to withdraw" },
              ].map(s => (
                <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "12px 14px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: s.color, fontFamily: "Oswald, sans-serif" }}>UGX {s.val.toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: "#cbd5e1", marginTop: 2 }}>{s.note}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {actionDone && <div style={{ background: "rgba(45,169,98,0.1)", border: "1px solid rgba(45,169,98,0.3)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#2DA962", fontWeight: 700 }}>✓ {actionDone}</div>}
            <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Plus size={15} style={{ color: "#2DA962" }} /> Add Money
              </div>
              <input type="number" value={addAmount} onChange={e => setAddAmount(e.target.value)} placeholder="Enter amount (UGX)" style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, boxSizing: "border-box", marginBottom: 10 }} />
              <button onClick={handleAdd} style={{ width: "100%", background: "#2DA962", color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Oswald, sans-serif" }}>ADD FUNDS</button>
            </div>
            <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Minus size={15} style={{ color: "#ef4444" }} /> Deduct Money
              </div>
              <input type="number" value={deductAmount} onChange={e => setDeductAmount(e.target.value)} placeholder="Enter amount (UGX)" style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, boxSizing: "border-box", marginBottom: 10 }} />
              <button onClick={handleDeduct} style={{ width: "100%", background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Oswald, sans-serif" }}>DEDUCT FUNDS</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "bets" && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Bet History ({userBets.length})</div>
          </div>
          {userBets.length === 0 ? <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No bets found</div> : userBets.map(b => (
            <div key={b.id} style={{ padding: "12px 18px", borderBottom: "1px solid #f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>#{String(b.ticketId).slice(-8)}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{b.type} · {b.selectionsCount} selections · {b.date}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 800, fontFamily: "Oswald, sans-serif", color: "#0f172a" }}>UGX {b.stake.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>Win: UGX {b.potentialWin.toLocaleString()}</div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10, background: b.status === "won" ? "rgba(45,169,98,0.1)" : b.status === "lost" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)", color: b.status === "won" ? "#2DA962" : b.status === "lost" ? "#ef4444" : "#f59e0b" }}>{b.status.toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "transactions" && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Transactions ({userTxns.length})</div>
          </div>
          {userTxns.length === 0 ? <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No transactions</div> : userTxns.map(t => (
            <div key={t.id} style={{ padding: "12px 18px", borderBottom: "1px solid #f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", textTransform: "capitalize" }}>{t.type === "withdraw" ? "Withdrawal" : t.type}</div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>{t.description ?? t.method ?? "—"} · {t.date}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 800, fontFamily: "Oswald, sans-serif", color: (t.type === "withdrawal" || t.type === "withdraw" || t.type === "bet") ? "#ef4444" : "#2DA962" }}>
                  {(t.type === "withdrawal" || t.type === "withdraw" || t.type === "bet") ? "-" : "+"}UGX {t.amount.toLocaleString()}
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: t.status === "completed" ? "#2DA962" : t.status === "pending" ? "#f59e0b" : "#ef4444" }}>{t.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "activity" && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "18px" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 14 }}>Recent Activity</div>
          {userTxns.slice(0, 10).map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(45,169,98,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ArrowLeftRight size={15} style={{ color: "#2DA962" }} />
              </div>
              <div style={{ flex: 1, borderBottom: "1px solid #f8fafc", paddingBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", textTransform: "capitalize" }}>{t.type === "withdraw" ? "Withdrawal" : t.type}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{t.description ?? t.method} — UGX {t.amount.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{t.date}</div>
              </div>
            </div>
          ))}
          {userTxns.length === 0 && <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No activity yet</div>}
        </div>
      )}

      {activeTab === "security" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "18px" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 14 }}>Security Settings</div>
            {[
              { label: "Account Status", val: user.status, action: "Change Status", actionColor: "#f59e0b" },
              { label: "Risk Level", val: user.riskLevel ?? "low", action: "Update Risk", actionColor: "#1565c0" },
              { label: "KYC Status", val: "Unverified", action: "Verify", actionColor: "#7c3aed" },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f8fafc" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{row.label}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "capitalize" }}>{row.val}</div>
                </div>
                <button style={{ background: "none", border: `1px solid ${row.actionColor}`, color: row.actionColor, borderRadius: 7, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{row.action}</button>
              </div>
            ))}
          </div>
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "18px" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 14 }}>Danger Zone</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleToggleStatus} style={{ flex: 1, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", borderRadius: 8, padding: "10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                {user.status === "active" ? "Suspend Account" : "Activate Account"}
              </button>
              <button onClick={handleBan} style={{ flex: 1, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", borderRadius: 8, padding: "10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Permanently Ban</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        joinDate: d.data().joinedDate ?? d.data().joinDate ?? "—",
        notifications: d.data().notifications ?? [],
      } as AdminUser)));
      setLoading(false);
    });
    return unsub;
  }, []);

  if (selectedUser) return <UserDetail user={selectedUser} onBack={() => setSelectedUser(null)} />;

  const filters = ["All", "Active", "Suspended", "Banned"];
  const filtered = users.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search);
    const matchFilter = filter === "All" || u.status === filter.toLowerCase();
    return matchSearch && matchFilter;
  });

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading users...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", fontFamily: "Oswald, sans-serif" }}>User Management</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{users.length} registered users</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users by name or phone..." style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 12px 10px 36px", fontSize: 13, boxSizing: "border-box", background: "#fff" }} />
        </div>
        <div style={{ display: "flex", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
          {filters.map(f => (
            <div key={f} onClick={() => setFilter(f)} style={{ padding: "0 14px", display: "flex", alignItems: "center", fontSize: 12, fontWeight: 700, cursor: "pointer", background: filter === f ? "#0f172a" : "transparent", color: filter === f ? "#fff" : "#64748b", transition: "all 0.15s" }}>{f}</div>
          ))}
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.2fr 1fr 1fr 80px", padding: "10px 18px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
          {["User", "Status", "Balance", "Total Bets", "Risk", ""].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</div>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No users found</div>
        ) : filtered.map(u => (
          <div key={u.id} onClick={() => setSelectedUser(u)} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.2fr 1fr 1fr 80px", padding: "13px 18px", borderBottom: "1px solid #f8fafc", cursor: "pointer", transition: "background 0.15s" }} onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#2DA962,#1a6e3d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "#fff", flexShrink: 0 }}>{u.name?.[0] ?? "?"}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{u.name}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{u.phone}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}><StatusBadge status={u.status ?? "active"} /></div>
            <div style={{ display: "flex", alignItems: "center", fontSize: 13, fontWeight: 800, fontFamily: "Oswald, sans-serif", color: "#0f172a" }}>UGX {(u.balance ?? 0).toLocaleString()}</div>
            <div style={{ display: "flex", alignItems: "center", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{u.totalBets ?? 0}</div>
            <div style={{ display: "flex", alignItems: "center" }}><RiskBadge level={u.riskLevel ?? "low"} /></div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
              <Shield size={16} color="#94a3b8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
