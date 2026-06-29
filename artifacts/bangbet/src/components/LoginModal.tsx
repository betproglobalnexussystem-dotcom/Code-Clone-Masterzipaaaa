import { useState, useEffect, useRef } from "react";
import { Phone, Lock, User, Mail, LogIn, UserPlus, Eye, EyeOff, AlertCircle, CheckCircle, X, ArrowLeft, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { COUNTRIES, DEFAULT_COUNTRY, type Country } from "../lib/countries";

interface LoginModalProps {
  mode: "login" | "register";
  onClose: () => void;
  onSwitchMode: () => void;
}

type View = "login" | "register" | "forgot" | "phone-prompt";

const GoogleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

// ── Country Phone Input ─────────────────────────────────────────────────────
interface CountryPhoneInputProps {
  country: Country;
  phone: string;
  onCountryChange: (c: Country) => void;
  onPhoneChange: (v: string) => void;
  onEnter?: () => void;
  placeholder?: string;
  autoComplete?: string;
}

function CountryPhoneInput({ country, phone, onCountryChange, onPhoneChange, onEnter, placeholder = "700 000 000", autoComplete = "tel" }: CountryPhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false); setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.dial.includes(search)
  );

  return (
    <div style={{ display: "flex", gap: 5 }}>
      {/* Flag + dial code button */}
      <div ref={dropRef} style={{ position: "relative", flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => { setOpen(!open); setSearch(""); }}
          style={{
            display: "flex", alignItems: "center", gap: 3,
            background: "var(--bg-light)", border: "1.5px solid var(--border)",
            borderRadius: 8, padding: "7px 7px", cursor: "pointer",
            fontSize: 12, color: "var(--text-primary)", whiteSpace: "nowrap", height: "100%",
          }}
        >
          <span style={{ fontSize: 17, lineHeight: 1 }}>{country.flag}</span>
          <span style={{ fontWeight: 600 }}>{country.dial}</span>
          <ChevronDown size={10} style={{ color: "var(--text-muted)" }} />
        </button>

        {open && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 1000,
            background: "#fff", border: "1.5px solid var(--border)", borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)", width: 210, maxHeight: 200,
            overflow: "hidden", display: "flex", flexDirection: "column",
          }}>
            <div style={{ padding: "5px 7px", borderBottom: "1px solid var(--border)" }}>
              <input
                autoFocus
                className="form-input"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ padding: "4px 8px", fontSize: 11 }}
              />
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {filtered.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { onCountryChange(c); setOpen(false); setSearch(""); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 7, width: "100%",
                    padding: "6px 10px", background: c.code === country.code ? "var(--bg-light)" : "none",
                    border: "none", cursor: "pointer", fontSize: 11.5, textAlign: "left",
                    color: "var(--text-primary)",
                  }}
                >
                  <span style={{ fontSize: 16, lineHeight: 1 }}>{c.flag}</span>
                  <span style={{ flex: 1 }}>{c.name}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: 10.5 }}>{c.dial}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p style={{ padding: "10px", fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>No results</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Phone number input */}
      <input
        className="form-input"
        type="tel"
        placeholder={placeholder}
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
        autoComplete={autoComplete}
        style={{ flex: 1, minWidth: 0 }}
      />
    </div>
  );
}

// ── Detect country from browser locale / timezone ──────────────────────────
function detectCountry(): Country {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tzMap: Record<string, string> = {
      "Africa/Kampala": "UG", "Africa/Nairobi": "KE", "Africa/Dar_es_Salaam": "TZ",
      "Africa/Kigali": "RW", "Africa/Addis_Ababa": "ET", "Africa/Lagos": "NG",
      "Africa/Accra": "GH", "Africa/Johannesburg": "ZA", "Africa/Lusaka": "ZM",
      "Africa/Harare": "ZW", "Africa/Blantyre": "MW", "Africa/Maputo": "MZ",
      "Africa/Kinshasa": "CD", "Africa/Douala": "CM", "Africa/Dakar": "SN",
      "Africa/Abidjan": "CI", "Africa/Cairo": "EG", "Africa/Casablanca": "MA",
      "Europe/London": "GB", "America/New_York": "US", "America/Chicago": "US",
      "America/Los_Angeles": "US", "Asia/Kolkata": "IN", "Asia/Shanghai": "CN",
      "Europe/Berlin": "DE", "Europe/Paris": "FR", "America/Toronto": "CA",
      "Australia/Sydney": "AU", "America/Sao_Paulo": "BR", "Europe/Lisbon": "PT",
      "Europe/Madrid": "ES", "Europe/Rome": "IT",
    };
    const code = tzMap[tz];
    if (code) {
      const found = COUNTRIES.find(c => c.code === code);
      if (found) return found;
    }
    // Fallback: try navigator.language (e.g. "sw-UG" → "UG")
    const lang = navigator.language || "";
    const langCode = lang.split("-")[1]?.toUpperCase();
    if (langCode) {
      const found = COUNTRIES.find(c => c.code === langCode);
      if (found) return found;
    }
  } catch {}
  return DEFAULT_COUNTRY;
}

// ── Main Modal ─────────────────────────────────────────────────────────────
export default function LoginModal({ mode, onClose, onSwitchMode }: LoginModalProps) {
  const { login, register, forgotPassword, signInWithGoogle, completeGoogleSignup } = useAuth();
  const [view, setView] = useState<View>(mode);

  // Shared country (auto-detected, used across login / register / google-prompt)
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);

  useEffect(() => {
    setCountry(detectCountry());
  }, []);

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
  const [agreedAge, setAgreedAge] = useState(false);

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState("");

  // Google phone prompt
  const [googlePhone, setGooglePhone] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const clearMessages = () => { setError(""); setSuccess(""); };
  const switchTo = (v: View) => { clearMessages(); setView(v); };

  // full E.164 helper
  const fullPhone = (local: string) => country.dial + local.replace(/\s+/g, "").replace(/^0/, "");

  // ── handlers ──
  const handleLogin = async () => {
    clearMessages(); setLoading(true);
    try {
      const r = await login(phone, password, country.dial);
      if (r.success) { setSuccess("Welcome back!"); setTimeout(onClose, 700); }
      else setError(r.error || "Login failed.");
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    clearMessages();
    if (!agreedAge) { setError("You must confirm you are 25 years or older to register."); return; }
    setLoading(true);
    try {
      const r = await register(firstName, lastName, fullPhone(regPhone), email, regPassword);
      if (r.success) { setSuccess("Account created! Welcome to BetMali!"); setTimeout(onClose, 900); }
      else setError(r.error || "Registration failed.");
    } finally { setLoading(false); }
  };

  const handleForgot = async () => {
    clearMessages(); setLoading(true);
    try {
      const r = await forgotPassword(forgotEmail);
      if (r.success) setSuccess("Reset link sent! Check your email inbox.");
      else setError(r.error || "Failed to send reset email.");
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    clearMessages(); setLoading(true);
    try {
      const r = await signInWithGoogle();
      if (r.success && r.needsPhone) switchTo("phone-prompt");
      else if (r.success) onClose();
      else if (r.error) setError(r.error);
    } finally { setLoading(false); }
  };

  const handlePhonePrompt = async () => {
    clearMessages(); setLoading(true);
    try {
      const r = await completeGoogleSignup(googlePhone, country.dial);
      if (r.success) { setSuccess("Account ready!"); setTimeout(onClose, 800); }
      else setError(r.error || "Failed to save phone number.");
    } finally { setLoading(false); }
  };

  // ── shared styles ──
  const eyeBtn: React.CSSProperties = { position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0, display: "flex" };
  const inputRow: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 };
  const googleBtn: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    border: "1.5px solid var(--border)", borderRadius: 8, background: "#fff",
    cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--dark)",
    padding: "7px 8px", flex: 1, opacity: loading ? 0.6 : 1,
  };

  const Alert = ({ type, msg }: { type: "error" | "success"; msg: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, background: type === "error" ? "#ffeaea" : "#e8f5e9", border: `1px solid ${type === "error" ? "#ffb3b3" : "#a5d6a7"}`, borderRadius: 7, padding: "6px 9px", marginBottom: 9, color: type === "error" ? "#c62828" : "#2e7d32", fontSize: 11, fontWeight: 600 }}>
      {type === "error" ? <AlertCircle size={12} style={{ flexShrink: 0 }} /> : <CheckCircle size={12} style={{ flexShrink: 0 }} />}
      {msg}
    </div>
  );

  const isPhonePrompt = view === "phone-prompt";

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (!isPhonePrompt && e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-content">

        {/* ── Header ── */}
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
            {view === "phone-prompt" && <>ADD <span className="highlight">PHONE</span></>}
          </div>
          {isPhonePrompt ? (
            <div style={{ width: 19 }} />
          ) : (
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2, display: "flex" }}>
              <X size={15} />
            </button>
          )}
        </div>

        {error && <Alert type="error" msg={error} />}
        {success && <Alert type="success" msg={success} />}

        {/* ══ LOGIN ══ */}
        {view === "login" && (
          <>
            <div className="form-group">
              <label className="form-label"><Phone size={11} /> Phone Number</label>
              <CountryPhoneInput
                country={country}
                phone={phone}
                onCountryChange={setCountry}
                onPhoneChange={setPhone}
                onEnter={handleLogin}
                placeholder="700 000 000"
              />
            </div>
            <div className="form-group">
              <label className="form-label"><Lock size={11} /> Password</label>
              <div style={{ position: "relative" }}>
                <input className="form-input" type={showPassword ? "text" : "password"} placeholder="Your password" value={password}
                  onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()}
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

            <div style={{ display: "flex", gap: 7 }}>
              <button className="btn-primary" onClick={handleLogin} disabled={loading}
                style={{ opacity: loading ? 0.75 : 1, fontSize: 12, padding: "8px 10px", flex: 1 }}>
                {loading ? "..." : <><LogIn size={13} /> LOGIN</>}
              </button>
              <button style={googleBtn} onClick={handleGoogle} disabled={loading}>
                <GoogleIcon /> Google
              </button>
            </div>

            <p style={{ fontSize: 11, color: "var(--text-secondary)", textAlign: "center", marginTop: 10, marginBottom: 0 }}>
              New to BetMali?{" "}
              <span style={{ color: "var(--green)", fontWeight: 700, cursor: "pointer" }} onClick={() => { switchTo("register"); onSwitchMode(); }}>Register</span>
            </p>
          </>
        )}

        {/* ══ REGISTER ══ */}
        {view === "register" && (
          <>
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

            <div className="form-group">
              <label className="form-label"><Phone size={11} /> Phone Number</label>
              <CountryPhoneInput
                country={country}
                phone={regPhone}
                onCountryChange={setCountry}
                onPhoneChange={setRegPhone}
                onEnter={handleRegister}
                placeholder="700 000 000"
                autoComplete="tel"
              />
            </div>

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
                    onChange={(e) => setRegPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                    autoComplete="new-password" style={{ paddingRight: 32 }} />
                  <button type="button" style={eyeBtn} onClick={() => setShowRegPassword(!showRegPassword)}>
                    {showRegPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
            </div>

            <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer", marginBottom: 10, marginTop: 4 }}>
              <input type="checkbox" checked={agreedAge} onChange={(e) => setAgreedAge(e.target.checked)}
                style={{ marginTop: 2, accentColor: "var(--green)", width: 13, height: 13, flexShrink: 0, cursor: "pointer" }} />
              <span style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                I confirm I am <strong style={{ color: "var(--dark)" }}>25 years or older</strong> and agree to the Terms & Conditions
              </span>
            </label>

            <div style={{ display: "flex", gap: 7 }}>
              <button className="btn-primary" onClick={handleRegister} disabled={loading || !agreedAge}
                style={{ opacity: loading || !agreedAge ? 0.6 : 1, fontSize: 11.5, padding: "8px 8px", flex: 1 }}>
                {loading ? "..." : <><UserPlus size={13} /> CREATE</>}
              </button>
              <button style={{ ...googleBtn, opacity: loading ? 0.6 : 1 }} onClick={handleGoogle} disabled={loading}>
                <GoogleIcon /> Google
              </button>
            </div>

            <p style={{ fontSize: 11, color: "var(--text-secondary)", textAlign: "center", marginTop: 10, marginBottom: 0 }}>
              Already have an account?{" "}
              <span style={{ color: "var(--green)", fontWeight: 700, cursor: "pointer" }} onClick={() => { switchTo("login"); onSwitchMode(); }}>Login</span>
            </p>
          </>
        )}

        {/* ══ FORGOT PASSWORD ══ */}
        {view === "forgot" && (
          <>
            <p style={{ fontSize: 11.5, color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.5 }}>
              Enter the email linked to your account and we'll send a reset link.
            </p>
            <div className="form-group">
              <label className="form-label"><Mail size={11} /> Email Address</label>
              <input className="form-input" type="email" placeholder="you@email.com" value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleForgot()}
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

        {/* ══ PHONE PROMPT (Google new users — non-closeable) ══ */}
        {view === "phone-prompt" && (
          <>
            <p style={{ fontSize: 11.5, color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.5 }}>
              Almost there! We need your phone number to complete your account.
            </p>
            <div className="form-group">
              <label className="form-label"><Phone size={11} /> Phone Number</label>
              <CountryPhoneInput
                country={country}
                phone={googlePhone}
                onCountryChange={setCountry}
                onPhoneChange={setGooglePhone}
                onEnter={handlePhonePrompt}
                placeholder="700 000 000"
              />
            </div>
            <button className="btn-primary" onClick={handlePhonePrompt} disabled={loading}
              style={{ opacity: loading ? 0.75 : 1, fontSize: 12.5, padding: "8px 14px" }}>
              {loading ? "Saving..." : "Continue →"}
            </button>
            <p style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", marginTop: 8, lineHeight: 1.5 }}>
              Required to complete your BetMali account
            </p>
          </>
        )}

        {!isPhonePrompt && (
          <p style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", marginTop: 8, lineHeight: 1.5 }}>
            25+ only · Terms & Conditions apply
          </p>
        )}
      </div>
    </div>
  );
}
