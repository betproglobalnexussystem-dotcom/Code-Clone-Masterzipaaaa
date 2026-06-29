import { useState } from "react";
import { LogIn, UserPlus, User, Wallet, FileText, ArrowLeftRight, Settings, Gift, Zap, TrendingUp, Crown, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import WalletTab from "./account/WalletTab";
import MyBetsTab from "./account/MyBetsTab";
import TransactionsTab from "./account/TransactionsTab";
import AccountTab from "./account/AccountTab";

const ADMIN_PHONE = "0760734679";

interface ProfilePageProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenAdmin?: () => void;
}

const TABS = [
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "bets", label: "My Bets", icon: FileText },
  { id: "txns", label: "Transactions", icon: ArrowLeftRight },
  { id: "account", label: "Account", icon: Settings },
] as const;

type TabId = typeof TABS[number]["id"];

export default function ProfilePage({ onOpenLogin, onOpenRegister, onOpenAdmin }: ProfilePageProps) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("wallet");

  if (!user) {
    return (
      <div>
        <div style={{ background: "linear-gradient(135deg, #1a6e3d, #2DA962)", padding: "28px 16px 24px", textAlign: "center", borderBottom: "3px solid var(--green)" }}>
          <div style={{ width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <User size={34} color="#fff" />
          </div>
          <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 6, letterSpacing: "0.5px" }}>
            LOGIN TO YOUR ACCOUNT
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 22 }}>
            Access balance, bet history, bonuses &amp; more
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ flex: 1, background: "#fff", color: "var(--green-dark)", fontSize: 14, fontWeight: 700, padding: "12px", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontFamily: "Oswald, sans-serif", letterSpacing: "0.5px", boxShadow: "0 3px 10px rgba(0,0,0,0.15)", cursor: "pointer" }} onClick={onOpenLogin}>
              <LogIn size={17} /> LOGIN
            </button>
            <button style={{ flex: 1, background: "transparent", color: "#fff", fontSize: 14, fontWeight: 700, padding: "12px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontFamily: "Oswald, sans-serif", letterSpacing: "0.5px", cursor: "pointer" }} onClick={onOpenRegister}>
              <UserPlus size={17} /> REGISTER
            </button>
          </div>
        </div>

        <div style={{ padding: "16px 14px" }}>
          <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 14, fontWeight: 700, color: "var(--dark)", marginBottom: 12, letterSpacing: "0.3px" }}>WHY JOIN US?</div>
          {[
            { icon: Gift, label: "100% Welcome Bonus", desc: "Up to UGX 370,000 on first deposit", bg: "#2DA962" },
            { icon: Zap, label: "Instant Mobile Money Payouts", desc: "Withdraw in under 5 minutes", bg: "#1565c0" },
            { icon: TrendingUp, label: "Live Betting", desc: "Real-time odds on live matches", bg: "#b71c1c" },
            { icon: Crown, label: "UGX 37,000,000 Jackpot", desc: "Win big every week", bg: "#e65100" },
          ].map(({ icon: Icon, label, desc, bg }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", borderRadius: 12, padding: 13, marginBottom: 8, border: "1px solid var(--border)" }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={20} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--dark)", marginBottom: 1 }}>{label}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Profile Header */}
      <div style={{ background: "linear-gradient(135deg, #1a2e1a, #2a3d2a)", padding: "16px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 50, height: 50, borderRadius: "50%", background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 700, fontFamily: "Oswald, sans-serif", flexShrink: 0, border: "2px solid rgba(255,255,255,0.3)" }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", fontFamily: "Oswald, sans-serif", letterSpacing: 0.5 }}>{user.name.toUpperCase()}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{user.phone}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>Balance</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--green)", fontFamily: "Oswald, sans-serif" }}>UGX {(user.balance + (user.bonus ?? 0)).toLocaleString()}</div>
            </div>
            {user.phone.replace(/\s+/g, "") === ADMIN_PHONE && onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(45,169,98,0.25)", border: "1px solid rgba(45,169,98,0.5)", color: "#fff", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "Oswald, sans-serif", letterSpacing: 0.4 }}
              >
                <Shield size={13} color="#2DA962" /> ADMIN PANEL
              </button>
            )}
          </div>
        </div>

        {/* Sub-navigation tabs */}
        <div style={{ display: "flex" }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                borderBottom: `3px solid ${activeTab === id ? "var(--green)" : "transparent"}`,
                padding: "10px 4px 10px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                transition: "all 0.2s",
              }}
            >
              <Icon size={18} color={activeTab === id ? "var(--green)" : "rgba(255,255,255,0.45)"} />
              <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "Oswald, sans-serif", letterSpacing: 0.3, color: activeTab === id ? "var(--green)" : "rgba(255,255,255,0.45)", whiteSpace: "nowrap" }}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "wallet" && <WalletTab />}
        {activeTab === "bets" && <MyBetsTab />}
        {activeTab === "txns" && <TransactionsTab />}
        {activeTab === "account" && <AccountTab onLogout={logout} />}
      </div>
    </div>
  );
}
