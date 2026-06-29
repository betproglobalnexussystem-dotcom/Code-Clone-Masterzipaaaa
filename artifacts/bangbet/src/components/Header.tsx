import { User, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface HeaderProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onHomeClick: () => void;
}

export default function Header({ onLoginClick, onRegisterClick, onHomeClick }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="header">
      <div className="header-logo" onClick={onHomeClick} style={{ cursor: "pointer" }}>
        <span className="logo-text">
          <span className="logo-bet">BET</span><span className="logo-mali">MALI</span>
        </span>
      </div>
      <div className="header-actions">
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
          </div>
        ) : (
          <>
            <button className="btn-login" onClick={onLoginClick}>
              <LogIn size={14} style={{ marginRight: 3 }} />LOGIN
            </button>
            <button className="btn-register" onClick={onRegisterClick}>REGISTER</button>
          </>
        )}
      </div>
    </header>
  );
}
