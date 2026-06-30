import { useState, useEffect, useRef } from "react";
import { LogIn, Clock, Download, Mail, MessageCircle, X, Phone } from "lucide-react";
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
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 700, color: "#111", fontFamily: "Oswald, monospace", letterSpacing: 0.5, background: "rgba(0,0,0,0.07)", borderRadius: 8, padding: "3px 7px" }}>
      <Clock size={11} />
      {h}:{m}:{s}
    </div>
  );
}

let deferredPrompt: any = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const check = () => setCanInstall(!!deferredPrompt);
    check();
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

function ContactFloat({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", handler), 10);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} style={{
      position: "absolute", top: "calc(100% + 6px)", right: 0,
      background: "#fff", borderRadius: 14, minWidth: 230,
      boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
      border: "1px solid rgba(0,0,0,0.08)",
      overflow: "hidden", zIndex: 200,
    }}>
      <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid #f0f0f0" }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#111", fontFamily: "Oswald, sans-serif", letterSpacing: 0.5 }}>CONTACT US</div>
        <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>We reply within minutes</div>
      </div>
      <a href="mailto:support@betmali.site"
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", textDecoration: "none", borderBottom: "1px solid #f5f5f5", transition: "background 0.12s" }}
        onMouseEnter={e => (e.currentTarget.style.background = "#f8f8f8")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(45,169,98,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Mail size={15} color="#2DA962" />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#111" }}>Email Support</div>
          <div style={{ fontSize: 11, color: "#2DA962" }}>support@betmali.site</div>
        </div>
      </a>
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", cursor: "pointer", transition: "background 0.12s" }}
        onClick={() => { onClose(); setTimeout(() => document.querySelector<HTMLButtonElement>("[data-livechat-trigger]")?.click(), 100); }}
        onMouseEnter={e => (e.currentTarget.style.background = "#f8f8f8")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(45,169,98,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <MessageCircle size={15} color="#2DA962" />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#111" }}>Live Chat</div>
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
    <header className="header" style={{ position: "relative" }}>
      {/* Logo */}
      <div className="header-logo" onClick={onHomeClick} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
        <span className="logo-text">
          <span className="logo-bet">BET</span><span className="logo-mali">MALI</span>
        </span>
        <LiveClock />
      </div>

      {/* Actions */}
      <div className="header-actions" style={{ display: "flex", alignItems: "center", gap: 5 }}>
        {/* App install button */}
        <button
          onClick={install}
          title="Install BetMali App"
          style={{
            display: "flex", alignItems: "center", gap: 4,
            background: canInstall ? "#111" : "rgba(0,0,0,0.07)",
            color: canInstall ? "#ffe60f" : "#666",
            border: "none", borderRadius: 8, padding: "5px 9px",
            fontSize: 11, fontWeight: 700, cursor: canInstall ? "pointer" : "default",
            fontFamily: "Oswald, sans-serif", letterSpacing: 0.3,
            transition: "all 0.15s",
          }}
        >
          <Download size={12} />
          <span style={{ display: window.innerWidth < 360 ? "none" : "inline" }}>APP</span>
        </button>

        {/* Contact button */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowContact(v => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              background: showContact ? "rgba(45,169,98,0.15)" : "rgba(0,0,0,0.07)",
              color: showContact ? "#1a8a2e" : "#333",
              border: showContact ? "1px solid rgba(45,169,98,0.4)" : "1px solid transparent",
              borderRadius: 8, padding: "5px 9px",
              fontSize: 11, fontWeight: 700, cursor: "pointer",
              fontFamily: "Oswald, sans-serif", letterSpacing: 0.3,
              transition: "all 0.15s",
            }}
          >
            <Mail size={12} />
            <span style={{ display: window.innerWidth < 380 ? "none" : "inline" }}>CONTACT</span>
          </button>
          {showContact && <ContactFloat onClose={() => setShowContact(false)} />}
        </div>

        {/* Auth area */}
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(45,169,98,0.12)", border: "1px solid rgba(45,169,98,0.3)", borderRadius: 20, padding: "5px 12px 5px 6px" }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: "Oswald, sans-serif" }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", lineHeight: 1 }}>Balance</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--green)", fontFamily: "Oswald, sans-serif", lineHeight: 1.3 }}>
                UGX {(user.balance + (user.bonus ?? 0)).toLocaleString()}
              </div>
            </div>
          </div>
        ) : (
          <>
            <button className="btn-login" onClick={onLoginClick} style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <LogIn size={13} />LOGIN
            </button>
            <button className="btn-register" onClick={onRegisterClick}>REG</button>
          </>
        )}
      </div>
    </header>
  );
}
