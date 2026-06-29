import { useState } from "react";
import { Phone, Lock, User, LogIn, UserPlus, Eye, EyeOff, AlertCircle, CheckCircle, X } from "lucide-react";
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
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ width: 28, height: 3, background: "var(--yellow)", borderRadius: 2 }} />
          <div className="modal-title" style={{ margin: 0 }}>
            {mode === "login" ? <>WELCOME <span className="highlight">BACK</span></> : <>CREATE <span className="highlight">ACCOUNT</span></>}
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2, display: "flex", borderRadius: 6 }}
          >
            <X size={15} />
          </button>
        </div>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#ffeaea", border: "1px solid #ffb3b3", borderRadius: 7, padding: "7px 10px", marginBottom: 9, color: "#c62828", fontSize: 11.5, fontWeight: 600 }}>
            <AlertCircle size={13} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {success && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: 7, padding: "7px 10px", marginBottom: 9, color: "#2e7d32", fontSize: 11.5, fontWeight: 600 }}>
            <CheckCircle size={13} style={{ flexShrink: 0 }} />
            {success}
          </div>
        )}

        {mode === "register" && (
          <div className="form-group">
            <label className="form-label"><User size={11} /> Full Name</label>
            <input
              className="form-input"
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="name"
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label"><Phone size={11} /> Phone Number</label>
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
            <Lock size={11} /> Password
            {mode === "register" && <span style={{ color: "var(--text-muted)", fontWeight: 400 }}> (min. 6 chars)</span>}
          </label>
          <div style={{ position: "relative" }}>
            <input
              className="form-input"
              type={showPassword ? "text" : "password"}
              placeholder={mode === "register" ? "Create a password" : "Your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              style={{ paddingRight: 36 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0, display: "flex" }}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {mode === "login" && (
          <div style={{ textAlign: "right", marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: "var(--green)", cursor: "pointer", fontWeight: 600 }} onClick={onForgotPassword}>
              Forgot password?
            </span>
          </div>
        )}

        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={loading}
          style={{ opacity: loading ? 0.75 : 1, fontSize: 13, padding: "9px 14px", marginTop: 2 }}
        >
          {loading ? "Please wait..." : mode === "login" ? <><LogIn size={14} /> LOGIN</> : <><UserPlus size={14} /> CREATE ACCOUNT</>}
        </button>

        <p style={{ fontSize: 11, color: "var(--text-secondary)", textAlign: "center", marginTop: 10, marginBottom: 0 }}>
          {mode === "login" ? "New to BetMali? " : "Already have an account? "}
          <span style={{ color: "var(--green)", fontWeight: 700, cursor: "pointer" }} onClick={onSwitchMode}>
            {mode === "login" ? "Register" : "Login"}
          </span>
        </p>

        <p style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", marginTop: 7, lineHeight: 1.5 }}>
          18+ only · Terms & Conditions apply
        </p>
      </div>
    </div>
  );
}
