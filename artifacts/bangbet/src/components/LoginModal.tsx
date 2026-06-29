import { useState } from "react";
import { Phone, Lock, User, Mail, LogIn, UserPlus, Eye, EyeOff, AlertCircle, CheckCircle, X, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface LoginModalProps {
  mode: "login" | "register";
  onClose: () => void;
  onSwitchMode: () => void;
}

type View = "login" | "register" | "forgot";

export default function LoginModal({ mode, onClose, onSwitchMode }: LoginModalProps) {
  const { login, register, forgotPassword } = useAuth();
  const [view, setView] = useState<View>(mode);

  // Login fields
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Register fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [email, setEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const clearMessages = () => { setError(""); setSuccess(""); };

  const switchTo = (v: View) => { clearMessages(); setView(v); };

  const handleLogin = async () => {
    clearMessages();
    setLoading(true);
    try {
      const result = await login(phone, password);
      if (result.success) {
        setSuccess("Welcome back!");
        setTimeout(onClose, 700);
      } else {
        setError(result.error || "Login failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    clearMessages();
    setLoading(true);
    try {
      const result = await register(firstName, lastName, regPhone, email, regPassword);
      if (result.success) {
        setSuccess("Account created! Welcome to BetMali!");
        setTimeout(onClose, 900);
      } else {
        setError(result.error || "Registration failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    clearMessages();
    setLoading(true);
    try {
      const result = await forgotPassword(forgotEmail);
      if (result.success) {
        setSuccess("Reset link sent! Check your email inbox.");
      } else {
        setError(result.error || "Failed to send reset email.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent, fn: () => void) => {
    if (e.key === "Enter") fn();
  };

  const inputRow: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 };
  const eyeBtn: React.CSSProperties = { position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0, display: "flex" };

  const Alert = ({ type, msg }: { type: "error" | "success"; msg: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, background: type === "error" ? "#ffeaea" : "#e8f5e9", border: `1px solid ${type === "error" ? "#ffb3b3" : "#a5d6a7"}`, borderRadius: 7, padding: "6px 9px", marginBottom: 9, color: type === "error" ? "#c62828" : "#2e7d32", fontSize: 11, fontWeight: 600 }}>
      {type === "error" ? <AlertCircle size={12} style={{ flexShrink: 0 }} /> : <CheckCircle size={12} style={{ flexShrink: 0 }} />}
      {msg}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          {view === "forgot" ? (
            <button onClick={() => switchTo("login")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2, display: "flex" }}>
              <ArrowLeft size={15} />
            </button>
          ) : (
            <div style={{ width: 24, height: 3, background: "var(--yellow)", borderRadius: 2 }} />
          )}
          <div className="modal-title" style={{ margin: 0 }}>
            {view === "login" && <>WELCOME <span className="highlight">BACK</span></>}
            {view === "register" && <>CREATE <span className="highlight">ACCOUNT</span></>}
            {view === "forgot" && <>RESET <span className="highlight">PASSWORD</span></>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2, display: "flex" }}>
            <X size={15} />
          </button>
        </div>

        {error && <Alert type="error" msg={error} />}
        {success && <Alert type="success" msg={success} />}

        {/* ── LOGIN ── */}
        {view === "login" && (
          <>
            <div className="form-group">
              <label className="form-label"><Phone size={11} /> Phone Number</label>
              <input className="form-input" type="tel" placeholder="07XXXXXXXX" value={phone}
                onChange={(e) => setPhone(e.target.value)} onKeyDown={(e) => handleKey(e, handleLogin)} autoComplete="tel" />
            </div>
            <div className="form-group">
              <label className="form-label"><Lock size={11} /> Password</label>
              <div style={{ position: "relative" }}>
                <input className="form-input" type={showPassword ? "text" : "password"} placeholder="Your password" value={password}
                  onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => handleKey(e, handleLogin)}
                  autoComplete="current-password" style={{ paddingRight: 32 }} />
                <button type="button" style={eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>
            <div style={{ textAlign: "right", marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: "var(--green)", cursor: "pointer", fontWeight: 600 }} onClick={() => switchTo("forgot")}>
                Forgot password?
              </span>
            </div>
            <button className="btn-primary" onClick={handleLogin} disabled={loading}
              style={{ opacity: loading ? 0.75 : 1, fontSize: 12.5, padding: "8px 14px" }}>
              {loading ? "Please wait..." : <><LogIn size={13} /> LOGIN</>}
            </button>
            <p style={{ fontSize: 11, color: "var(--text-secondary)", textAlign: "center", marginTop: 10, marginBottom: 0 }}>
              New to BetMali?{" "}
              <span style={{ color: "var(--green)", fontWeight: 700, cursor: "pointer" }} onClick={() => { switchTo("register"); onSwitchMode(); }}>Register</span>
            </p>
          </>
        )}

        {/* ── REGISTER ── */}
        {view === "register" && (
          <>
            {/* First name | Last name */}
            <div className="form-group" style={inputRow}>
              <div>
                <label className="form-label"><User size={11} /> First Name</label>
                <input className="form-input" type="text" placeholder="First" value={firstName}
                  onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" />
              </div>
              <div>
                <label className="form-label"><User size={11} /> Last Name</label>
                <input className="form-input" type="text" placeholder="Last" value={lastName}
                  onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
              </div>
            </div>

            {/* Phone */}
            <div className="form-group">
              <label className="form-label"><Phone size={11} /> Phone Number</label>
              <input className="form-input" type="tel" placeholder="07XXXXXXXX" value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)} autoComplete="tel" />
            </div>

            {/* Email | Password */}
            <div className="form-group" style={inputRow}>
              <div>
                <label className="form-label"><Mail size={11} /> Email</label>
                <input className="form-input" type="email" placeholder="you@email.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <div>
                <label className="form-label"><Lock size={11} /> Password</label>
                <div style={{ position: "relative" }}>
                  <input className="form-input" type={showRegPassword ? "text" : "password"} placeholder="Min 6 chars" value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)} onKeyDown={(e) => handleKey(e, handleRegister)}
                    autoComplete="new-password" style={{ paddingRight: 32 }} />
                  <button type="button" style={eyeBtn} onClick={() => setShowRegPassword(!showRegPassword)}>
                    {showRegPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
            </div>

            <button className="btn-primary" onClick={handleRegister} disabled={loading}
              style={{ opacity: loading ? 0.75 : 1, fontSize: 12.5, padding: "8px 14px", marginTop: 2 }}>
              {loading ? "Please wait..." : <><UserPlus size={13} /> CREATE ACCOUNT</>}
            </button>
            <p style={{ fontSize: 11, color: "var(--text-secondary)", textAlign: "center", marginTop: 10, marginBottom: 0 }}>
              Already have an account?{" "}
              <span style={{ color: "var(--green)", fontWeight: 700, cursor: "pointer" }} onClick={() => { switchTo("login"); onSwitchMode(); }}>Login</span>
            </p>
          </>
        )}

        {/* ── FORGOT PASSWORD ── */}
        {view === "forgot" && (
          <>
            <p style={{ fontSize: 11.5, color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.5 }}>
              Enter the email address linked to your account and we'll send a reset link.
            </p>
            <div className="form-group">
              <label className="form-label"><Mail size={11} /> Email Address</label>
              <input className="form-input" type="email" placeholder="you@email.com" value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)} onKeyDown={(e) => handleKey(e, handleForgot)}
                autoComplete="email" />
            </div>
            <button className="btn-primary" onClick={handleForgot} disabled={loading || !!success}
              style={{ opacity: loading || !!success ? 0.75 : 1, fontSize: 12.5, padding: "8px 14px" }}>
              {loading ? "Sending..." : success ? "Email Sent ✓" : "Send Reset Link"}
            </button>
            <p style={{ fontSize: 11, color: "var(--text-secondary)", textAlign: "center", marginTop: 10, marginBottom: 0 }}>
              Remember it?{" "}
              <span style={{ color: "var(--green)", fontWeight: 700, cursor: "pointer" }} onClick={() => switchTo("login")}>Back to Login</span>
            </p>
          </>
        )}

        <p style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", marginTop: 8, lineHeight: 1.5 }}>
          18+ only · Terms & Conditions apply
        </p>
      </div>
    </div>
  );
}
