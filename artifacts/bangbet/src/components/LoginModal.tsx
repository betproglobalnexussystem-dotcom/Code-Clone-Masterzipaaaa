import { useState } from "react";
import { Phone, Lock, User, LogIn, UserPlus, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface LoginModalProps {
  mode: "login" | "register";
  onClose: () => void;
  onSwitchMode: () => void;
  onForgotPassword?: () => void;
}

export default function LoginModal({ mode, onClose, onSwitchMode, onForgotPassword }: LoginModalProps) {
  const { login, register } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (mode === "login") {
        const result = await login(phone, password);
        if (result.success) {
          setSuccess("Welcome back!");
          setTimeout(onClose, 700);
        } else {
          setError(result.error || "Login failed.");
        }
      } else {
        const result = await register(name, phone, password);
        if (result.success) {
          setSuccess("Account created! Welcome to BetMali!");
          setTimeout(onClose, 900);
        } else {
          setError(result.error || "Registration failed.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-handle" />

        <div style={{ height: 4, background: "var(--yellow)", borderRadius: 2, marginBottom: 20 }} />

        <div className="modal-title">
          {mode === "login" ? (
            <>WELCOME <span className="highlight">BACK</span></>
          ) : (
            <>CREATE <span className="highlight">ACCOUNT</span></>
          )}
        </div>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#ffeaea", border: "1px solid #ffb3b3", borderRadius: 10, padding: "10px 12px", marginBottom: 14, color: "#c62828", fontSize: 13, fontWeight: 600 }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {success && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: 10, padding: "10px 12px", marginBottom: 14, color: "#2e7d32", fontSize: 13, fontWeight: 600 }}>
            <CheckCircle size={16} style={{ flexShrink: 0 }} />
            {success}
          </div>
        )}

        {mode === "register" && (
          <div className="form-group">
            <label className="form-label"><User size={13} /> Full Name</label>
            <input
              className="form-input"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="name"
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label"><Phone size={13} /> Phone Number</label>
          <input
            className="form-input"
            type="tel"
            placeholder="07XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="tel"
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <Lock size={13} /> Password{" "}
            {mode === "register" && <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(min. 6 characters)</span>}
          </label>
          <div style={{ position: "relative" }}>
            <input
              className="form-input"
              type={showPassword ? "text" : "password"}
              placeholder={mode === "register" ? "Create a strong password" : "Enter your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0, display: "flex" }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {mode === "login" && (
          <div style={{ textAlign: "right", marginBottom: 14 }}>
            <span
              style={{ fontSize: 12, color: "var(--green)", cursor: "pointer", fontWeight: 600 }}
              onClick={onForgotPassword}
            >
              Forgot password?
            </span>
          </div>
        )}

        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={loading}
          style={{ opacity: loading ? 0.75 : 1 }}
        >
          {loading ? "Please wait..." : mode === "login" ? <><LogIn size={17} /> LOGIN</> : <><UserPlus size={17} /> CREATE ACCOUNT</>}
        </button>

        <p className="modal-footer-text">
          {mode === "login" ? "New to BetMali? " : "Already have an account? "}
          <span className="modal-footer-link" onClick={onSwitchMode}>
            {mode === "login" ? "Register Now" : "Login"}
          </span>
        </p>

        <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", marginTop: 14, lineHeight: 1.6 }}>
          By registering you confirm you are 18+ and accept our Terms &amp; Conditions.
        </p>
      </div>
    </div>
  );
}
