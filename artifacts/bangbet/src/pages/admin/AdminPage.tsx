import { useState, useEffect } from "react";
import { LayoutDashboard, Users, Ticket, Wallet, ArrowLeftRight, Image, Shield, Settings, LogOut, Eye, EyeOff, X, Menu, ChevronRight, Bell } from "lucide-react";
import { ADMIN_CREDENTIALS } from "./adminData";
import DashboardTab from "./tabs/DashboardTab";
import UsersTab from "./tabs/UsersTab";
import BetsTab from "./tabs/BetsTab";
import PlatformWalletTab from "./tabs/PlatformWalletTab";
import TransactionsTab from "./tabs/TransactionsTab";
import CarouselTab from "./tabs/CarouselTab";
import SecurityTab from "./tabs/SecurityTab";
import SettingsTab from "./tabs/SettingsTab";
import NotificationsAdminTab from "./tabs/NotificationsAdminTab";

type AdminTab = "dashboard" | "users" | "bets" | "wallet" | "transactions" | "carousel" | "security" | "settings" | "notifications";

const NAV_ITEMS: { id: AdminTab; label: string; icon: any; badge?: number }[] = [
  { id: "dashboard",     label: "Dashboard",         icon: LayoutDashboard },
  { id: "users",         label: "Users",              icon: Users },
  { id: "bets",          label: "Bets & Tickets",     icon: Ticket },
  { id: "wallet",        label: "Platform Wallet",    icon: Wallet },
  { id: "transactions",  label: "Transactions",       icon: ArrowLeftRight },
  { id: "carousel",      label: "Carousel Manager",   icon: Image },
  { id: "notifications", label: "Notifications",      icon: Bell },
  { id: "security",      label: "Security",           icon: Shield },
  { id: "settings",      label: "Settings",           icon: Settings },
];

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setError("");
    setLoading(true);
    setTimeout(() => {
      if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        onLogin();
      } else {
        setError("Invalid credentials. Try admin / Admin@2024");
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: 18, background: "rgba(45,169,98,0.15)", border: "2px solid rgba(45,169,98,0.3)", marginBottom: 16 }}>
            <Shield size={30} color="#2DA962" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", fontFamily: "Oswald, sans-serif", letterSpacing: 1 }}>
            <span style={{ color: "#2DA962" }}>BETMALI</span> ADMIN
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>Secure Administration Portal</div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "32px 28px" }}>
          {error && (
            <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 18, color: "#ef4444", fontSize: 13, fontWeight: 600 }}>
              {error}
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 14px", fontSize: 14, color: "#fff", boxSizing: "border-box" }} onKeyDown={e => e.key === "Enter" && handleLogin()} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Password</label>
            <div style={{ position: "relative" }}>
              <input value={password} onChange={e => setPassword(e.target.value)} type={showPw ? "text" : "password"} placeholder="••••••••" style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 44px 12px 14px", fontSize: 14, color: "#fff", boxSizing: "border-box" }} onKeyDown={e => e.key === "Enter" && handleLogin()} />
              <button onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button onClick={handleLogin} disabled={loading} style={{ width: "100%", background: loading ? "rgba(45,169,98,0.6)" : "#2DA962", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 900, cursor: loading ? "default" : "pointer", fontFamily: "Oswald, sans-serif", letterSpacing: 1 }}>
            {loading ? "SIGNING IN..." : "SIGN IN TO ADMIN"}
          </button>
          <div style={{ textAlign: "center", marginTop: 18, fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
            Hint: admin / Admin@2024
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage({ onExit }: { onExit: () => void }) {
  const [authed, setAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const root = document.getElementById("root");
    if (root) { root.style.maxWidth = "none"; root.style.width = "100%"; }
    return () => {
      if (root) { root.style.maxWidth = ""; root.style.width = ""; }
    };
  }, []);

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard":     return <DashboardTab />;
      case "users":         return <UsersTab />;
      case "bets":          return <BetsTab />;
      case "wallet":        return <PlatformWalletTab />;
      case "transactions":  return <TransactionsTab />;
      case "carousel":      return <CarouselTab />;
      case "notifications": return <NotificationsAdminTab />;
      case "security":      return <SecurityTab />;
      case "settings":      return <SettingsTab />;
      default:              return <DashboardTab />;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ width: sidebarOpen ? 240 : 64, background: "#0f172a", flexShrink: 0, display: "flex", flexDirection: "column", transition: "width 0.2s", overflow: "hidden", position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(45,169,98,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Shield size={18} color="#2DA962" />
          </div>
          {sidebarOpen && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", fontFamily: "Oswald, sans-serif", letterSpacing: 0.5 }}>BETMALI</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Admin Panel</div>
            </div>
          )}
        </div>

        <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          {NAV_ITEMS.map(item => {
            const active = activeTab === item.id;
            return (
              <div key={item.id} onClick={() => setActiveTab(item.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", borderRadius: 10, marginBottom: 2, cursor: "pointer", background: active ? "rgba(45,169,98,0.15)" : "transparent", border: active ? "1px solid rgba(45,169,98,0.25)" : "1px solid transparent", transition: "all 0.15s", position: "relative" }}
                onMouseEnter={e => !active && (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                onMouseLeave={e => !active && (e.currentTarget.style.background = "transparent")}>
                <item.icon size={18} color={active ? "#2DA962" : "rgba(255,255,255,0.45)"} style={{ flexShrink: 0 }} />
                {sidebarOpen && (
                  <span style={{ fontSize: 13, fontWeight: 600, color: active ? "#fff" : "rgba(255,255,255,0.55)", whiteSpace: "nowrap", flex: 1 }}>{item.label}</span>
                )}
                {sidebarOpen && item.badge && (
                  <span style={{ background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10 }}>{item.badge}</span>
                )}
                {!sidebarOpen && item.badge && (
                  <div style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
                )}
              </div>
            );
          })}
        </nav>

        <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div onClick={() => setSidebarOpen(!sidebarOpen)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px", borderRadius: 10, cursor: "pointer", marginBottom: 4 }} onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <Menu size={18} color="rgba(255,255,255,0.45)" />
            {sidebarOpen && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>Collapse</span>}
          </div>
          <div onClick={onExit} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px", borderRadius: 10, cursor: "pointer" }} onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <LogOut size={18} color="#ef4444" />
            {sidebarOpen && <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>Exit Admin</span>}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflowX: "auto" }}>
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#94a3b8" }}>
            <span>Admin</span>
            <ChevronRight size={14} />
            <span style={{ color: "#0f172a", fontWeight: 700, textTransform: "capitalize" }}>{NAV_ITEMS.find(n => n.id === activeTab)?.label}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div onClick={() => setActiveTab("notifications")} style={{ position: "relative", cursor: "pointer", padding: 4 }}>
              <Bell size={20} color="#64748b" />
              <div style={{ position: "absolute", top: 0, right: 0, width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "6px 12px" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#0f172a,#2DA962)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "#fff" }}>A</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>Admin</div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>Super Admin</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
          {renderTab()}
        </div>
      </div>
    </div>
  );
}
