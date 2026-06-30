import { useState, useEffect, useRef } from "react";
import { LogIn, Clock, Download, Mail, MessageCircle, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface HeaderProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onHomeClick: () => void;
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const h = time.getHours().toString().padStart(2, "0");
  const m = time.getMinutes().toString().padStart(2, "0");
  const s = time.getSeconds().toString().padStart(2, "0");
  return <span style={{ fontFamily: "Oswald, monospace", letterSpacing: 1, fontWeight: 700, fontSize: 13 }}>{h}:{m}:{s}</span>;
}

let deferredPrompt: any = null;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredPrompt = e; });

function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(false);
  useEffect(() => {
    setCanInstall(!!deferredPrompt);
    const handler = (e: Event) => { deferredPrompt = e; setCanInstall(true); };
    window.addEventListener("beforeinstallprompt", handler as EventListener);
    return () => window.removeEventListener("beforeinstallprompt", handler as EventListener);
  }, []);
  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") { deferredPrompt = null; setCanInstall(false); }
  };
  return { canInstall, install };
}

const PURPLE = "#6d28d9";
const PURPLE_DARK = "#5b21b6";
const PURPLE_LIGHT = "rgba(109,40,217,0.10)";

function PurpleBtn({ icon: Icon, label, onClick, active }: { icon: any; label: string; onClick?: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 4,
        background: active ? PURPLE : PURPLE_LIGHT,
        color: active ? "#fff" : PURPLE,
        border: `1.5px solid ${active ? PURPLE_DARK : "rgba(109,40,217,0.3)"}`,
        borderRadius: 8, padding: "5px 10px",
        fontSize: 11, fontWeight: 700, cursor: "pointer",
        fontFamily: "Oswald, sans-serif", letterSpacing: 0.5,
        transition: "all 0.15s", whiteSpace: "nowrap",
        boxShadow: active ? "0 2px 8px rgba(109,40,217,0.35)" : "none",
      }}
      onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background = PURPLE; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; } }}
      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background = PURPLE_LIGHT; (e.currentTarget as HTMLButtonElement).style.color = PURPLE; } }}
    >
      <Icon size={12} />
      {label}
    </button>
  );
}

function ContactFloat({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    setTimeout(() => document.addEventListener("mousedown", handler), 10);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} style={{
      position: "absolute", top: "calc(100% + 6px)", right: 0,
      background: "#fff", borderRadius: 14, minWidth: 235,
      boxShadow: "0 8px 32px rgba(109,40,217,0.18)",
      border: `1px solid rgba(109,40,217,0.15)`,
      overflow: "hidden", zIndex: 300,
    }}>
      <div style={{ padding: "10px 14px 8px", borderBottom: `1px solid rgba(109,40,217,0.1)`, background: "linear-gradient(90deg, #f5f3ff, #ede9fe)" }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: PURPLE, fontFamily: "Oswald, sans-serif", letterSpacing: 0.5 }}>CONTACT US</div>
        <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>We reply within minutes</div>
      </div>
      <a href="mailto:support@betmali.site"
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", textDecoration: "none", borderBottom: "1px solid #f5f5f5", transition: "background 0.12s" }}
        onMouseEnter={e => (e.currentTarget.style.background = "#f5f3ff")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: PURPLE_LIGHT, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Mail size={15} color={PURPLE} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>Email Support</div>
          <div style={{ fontSize: 11, color: PURPLE }}>support@betmali.site</div>
        </div>
      </a>
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer", transition: "background 0.12s" }}
        onClick={() => {
          onClose();
          setTimeout(() => {
            const el = document.querySelector<HTMLButtonElement>("[data-livechat-trigger]");
            if (el) el.click();
          }, 100);
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "#f5f3ff")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: PURPLE_LIGHT, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <MessageCircle size={15} color={PURPLE} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>Live Chat</div>
          <div style={{ fontSize: 11, color: "#888" }}>Chat with our support team</div>
        </div>
      </div>
    </div>
  );
}

export default function Header({ onLoginClick, onRegisterClick, onHomeClick }: HeaderProps) {
  const { user } = useAuth();
  const { canInstall, install } = usePWAInstall();
  const [showContact, setShowContact] = useState(false);

  return (
    <header className="header" style={{ height: "auto", padding: "6px 12px", flexDirection: "column", alignItems: "stretch", gap: 4 }}>

      {/* Row 1: Logo (left) + Clock (right) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="header-logo" onClick={onHomeClick} style={{ cursor: "pointer" }}>
          <span className="logo-text" style={{ fontSize: 24 }}>
            <span className="logo-bet">BET</span><span className="logo-mali">MALI</span>
          </span>
        </div>

        {/* Clock pill — purple, right side */}
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          background: PURPLE, color: "#fff",
          borderRadius: 8, padding: "4px 10px",
          fontSize: 11, fontWeight: 700,
          boxShadow: "0 2px 8px rgba(109,40,217,0.3)",
        }}>
          <Clock size={11} />
          <LiveClock />
        </div>
      </div>

      {/* Row 2: App + Contact (left) | Login + Register / Balance (right) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
        {/* Left: purple utility buttons */}
        <div style={{ display: "flex", gap: 5 }}>
          <PurpleBtn icon={Download} label="APP" onClick={install} active={canInstall} />
          <div style={{ position: "relative" }}>
            <PurpleBtn icon={Mail} label="CONTACT" onClick={() => setShowContact(v => !v)} active={showContact} />
            {showContact && <ContactFloat onClose={() => setShowContact(false)} />}
          </div>
        </div>

        {/* Right: auth */}
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(45,169,98,0.12)", border: "1px solid rgba(45,169,98,0.35)", borderRadius: 18, padding: "4px 10px 4px 5px" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: "Oswald, sans-serif" }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 9, color: "var(--text-muted)", lineHeight: 1 }}>Balance</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--green)", fontFamily: "Oswald, sans-serif", lineHeight: 1.3 }}>
                UGX {(user.balance + (user.bonus ?? 0)).toLocaleString()}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 5 }}>
            <button className="btn-login" onClick={onLoginClick} style={{ display: "flex", alignItems: "center", gap: 3, padding: "5px 12px", fontSize: 11 }}>
              <LogIn size={12} />LOGIN
            </button>
            <button className="btn-register" onClick={onRegisterClick} style={{ padding: "5px 12px", fontSize: 11 }}>REGISTER</button>
          </div>
        )}
      </div>
    </header>
  );
}
