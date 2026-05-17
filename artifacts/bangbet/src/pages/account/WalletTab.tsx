import { useState } from "react";
import { CreditCard, Wallet, Gift, Users, Copy, CheckCircle, AlertCircle, X, ChevronRight, Smartphone, Building2, Star } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function Modal({ title, accent, onClose, children }: { title: string; accent: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-handle" />
        <div style={{ height: 4, background: accent, borderRadius: 2, marginBottom: 18 }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="modal-title" style={{ marginBottom: 0 }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={22} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Alert({ type, msg }: { type: "error" | "success"; msg: string }) {
  return (
    <div style={{ display: "flex", gap: 8, background: type === "error" ? "#ffeaea" : "#e8f5e9", border: `1px solid ${type === "error" ? "#ffb3b3" : "#a5d6a7"}`, borderRadius: 10, padding: "10px 12px", marginBottom: 14, color: type === "error" ? "#c62828" : "#2e7d32", fontSize: 13, fontWeight: 600, alignItems: "center" }}>
      {type === "error" ? <AlertCircle size={16} style={{ flexShrink: 0 }} /> : <CheckCircle size={16} style={{ flexShrink: 0 }} />}
      {msg}
    </div>
  );
}

function DepositModal({ onClose }: { onClose: () => void }) {
  const { user, deposit } = useAuth();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("MTN Mobile Money");
  const [number, setNumber] = useState(user?.phone || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const presets = [5000, 10000, 20000, 50000, 100000];

  const handleDeposit = async () => {
    setError("");
    if (!number.trim()) { setError("Please enter your mobile number."); return; }
    const amt = parseInt(amount.replace(/,/g, ""));
    if (isNaN(amt)) { setError("Please enter a valid amount."); return; }
    const result = await deposit(amt, method);
    if (result.success) { setSuccess(true); setTimeout(onClose, 1200); }
    else setError(result.error || "Deposit failed.");
  };

  return (
    <Modal title={<>DEPOSIT <span className="highlight">FUNDS</span></>} accent="var(--green)" onClose={onClose}>
      {error && <Alert type="error" msg={error} />}
      {success && <Alert type="success" msg="Deposit successful! Balance updated." />}

      <div className="form-group">
        <label className="form-label">Select Method</label>
        {["MTN Mobile Money", "Airtel Money"].map((m) => (
          <div key={m} onClick={() => setMethod(m)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${method === m ? "var(--green)" : "var(--border)"}`, marginBottom: 8, cursor: "pointer", background: method === m ? "var(--green-light)" : "#fff" }}>
            <Smartphone size={18} color={method === m ? "var(--green)" : "var(--text-muted)"} />
            <span style={{ fontSize: 13, fontWeight: 600, color: method === m ? "var(--green-dark)" : "var(--dark)" }}>{m}</span>
            {method === m && <CheckCircle size={16} color="var(--green)" style={{ marginLeft: "auto" }} />}
          </div>
        ))}
      </div>

      <div className="form-group">
        <label className="form-label">Mobile Number</label>
        <input className="form-input" type="tel" placeholder="+256 700 000 000" value={number} onChange={(e) => setNumber(e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Amount (UGX)</label>
        <input className="form-input" type="number" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
          {presets.map((p) => (
            <button key={p} onClick={() => setAmount(String(p))} style={{ fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 8, border: "1.5px solid var(--green)", color: "var(--green)", background: "#fff", cursor: "pointer" }}>
              {p.toLocaleString()}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>Minimum: UGX 1,000</div>
      </div>

      <button className="btn-primary" onClick={handleDeposit}><CreditCard size={17} /> DEPOSIT NOW</button>
    </Modal>
  );
}

function WithdrawModal({ onClose }: { onClose: () => void }) {
  const { user, withdraw } = useAuth();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("MTN Mobile Money");
  const [number, setNumber] = useState(user?.phone || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleWithdraw = async () => {
    setError("");
    const amt = parseInt(amount.replace(/,/g, ""));
    if (isNaN(amt)) { setError("Please enter a valid amount."); return; }
    const result = await withdraw(amt, method, number);
    if (result.success) { setSuccess(true); setTimeout(onClose, 1200); }
    else setError(result.error || "Withdrawal failed.");
  };

  return (
    <Modal title={<>WITHDRAW <span className="highlight">FUNDS</span></>} accent="#1565c0" onClose={onClose}>
      {error && <Alert type="error" msg={error} />}
      {success && <Alert type="success" msg="Withdrawal submitted! Funds arriving shortly." />}

      <div style={{ background: "var(--green-light)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Available Balance</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--green-dark)", fontFamily: "Oswald, sans-serif" }}>UGX {(user?.balance || 0).toLocaleString()}</span>
      </div>

      <div className="form-group">
        <label className="form-label">Select Method</label>
        {["MTN Mobile Money", "Airtel Money"].map((m) => (
          <div key={m} onClick={() => setMethod(m)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${method === m ? "#1565c0" : "var(--border)"}`, marginBottom: 8, cursor: "pointer", background: method === m ? "#e3f2fd" : "#fff" }}>
            <Smartphone size={18} color={method === m ? "#1565c0" : "var(--text-muted)"} />
            <span style={{ fontSize: 13, fontWeight: 600, color: method === m ? "#1565c0" : "var(--dark)" }}>{m}</span>
            {method === m && <CheckCircle size={16} color="#1565c0" style={{ marginLeft: "auto" }} />}
          </div>
        ))}
      </div>

      <div className="form-group">
        <label className="form-label">Mobile Number</label>
        <input className="form-input" type="tel" placeholder="+256 700 000 000" value={number} onChange={(e) => setNumber(e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Amount (UGX)</label>
        <input className="form-input" type="number" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>Minimum: UGX 5,000</div>
      </div>

      <button className="btn-primary" style={{ background: "#1565c0" }} onClick={handleWithdraw}><Wallet size={17} /> WITHDRAW NOW</button>
    </Modal>
  );
}

function ReferModal({ onClose }: { onClose: () => void }) {
  const { user, claimReferral } = useAuth();
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(user?.referralCode || "").then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const handleClaim = () => {
    setError(""); setSuccess(false);
    if (!code.trim()) { setError("Please enter a referral code."); return; }
    const result = claimReferral(code);
    if (result.success) setSuccess(true);
    else setError(result.error || "Failed.");
  };

  return (
    <Modal title={<>REFER <span className="highlight">& EARN</span></>} accent="#e65100" onClose={onClose}>
      <div style={{ background: "linear-gradient(135deg, #e65100, #ff8f00)", borderRadius: 14, padding: 16, marginBottom: 18, textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginBottom: 6 }}>Your Referral Code</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", fontFamily: "Oswald, sans-serif", letterSpacing: 2, marginBottom: 10 }}>{user?.referralCode}</div>
        <button onClick={copyCode} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)", color: "#fff", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
          {copied ? <><CheckCircle size={15} /> Copied!</> : <><Copy size={15} /> Copy Code</>}
        </button>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, padding: "12px 14px", border: "1px solid var(--border)", marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--dark)", marginBottom: 8 }}>How it works</div>
        {[
          "Share your referral code with a friend",
          "Friend registers and uses your code",
          "You both get UGX 500 bonus credited instantly",
        ].map((step, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#e65100", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
            <span style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{step}</span>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px dashed var(--border)", paddingTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--dark)", marginBottom: 8 }}>Have a friend's code?</div>
        {error && <Alert type="error" msg={error} />}
        {success && <Alert type="success" msg="UGX 500 bonus credited to your account!" />}
        <div className="form-group">
          <input className="form-input" type="text" placeholder="Enter referral code (e.g. BM123456)" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        </div>
        <button className="btn-primary" style={{ background: "#e65100" }} onClick={handleClaim}><Gift size={17} /> CLAIM BONUS</button>
      </div>
    </Modal>
  );
}

export default function WalletTab() {
  const { user } = useAuth();
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showRefer, setShowRefer] = useState(false);

  return (
    <div style={{ paddingBottom: 20 }}>
      {showDeposit && <DepositModal onClose={() => setShowDeposit(false)} />}
      {showWithdraw && <WithdrawModal onClose={() => setShowWithdraw(false)} />}
      {showRefer && <ReferModal onClose={() => setShowRefer(false)} />}

      {/* Balance Cards */}
      <div style={{ padding: "14px 14px 0" }}>
        <div style={{ background: "linear-gradient(135deg, #1a6e3d, #2DA962)", borderRadius: 16, padding: "18px 18px 14px", marginBottom: 10, boxShadow: "0 4px 18px rgba(45,169,98,0.35)" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Main Balance</div>
          <div style={{ fontSize: 30, fontWeight: 900, color: "#fff", fontFamily: "Oswald, sans-serif", letterSpacing: 1 }}>UGX {(user?.balance || 0).toLocaleString()}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button onClick={() => setShowDeposit(true)} style={{ flex: 1, background: "#fff", color: "var(--green-dark)", fontWeight: 700, fontSize: 13, padding: "10px", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "Oswald, sans-serif", cursor: "pointer" }}>
              <CreditCard size={16} /> DEPOSIT
            </button>
            <button onClick={() => setShowWithdraw(true)} style={{ flex: 1, background: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 700, fontSize: 13, padding: "10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "Oswald, sans-serif", cursor: "pointer" }}>
              <Wallet size={16} /> WITHDRAW
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <div style={{ flex: 1, background: "#fff", borderRadius: 12, padding: "12px 14px", border: "1px solid var(--border)", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Bonus</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#e65100", fontFamily: "Oswald, sans-serif" }}>UGX {(user?.bonus || 0).toLocaleString()}</div>
          </div>
          <div style={{ flex: 1, background: "#fff", borderRadius: 12, padding: "12px 14px", border: "1px solid var(--border)", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Winnings</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--green)", fontFamily: "Oswald, sans-serif" }}>UGX {(user?.winnings || 0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Bonuses Section */}
      <div style={{ padding: "0 14px" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--dark)", fontFamily: "Oswald, sans-serif", letterSpacing: 0.5, marginBottom: 10, textTransform: "uppercase" }}>Bonuses & Promotions</div>

        {[
          { icon: Gift, title: "Welcome Bonus", desc: "100% up to UGX 370,000 on first deposit", tag: "Active", tagColor: "var(--green)", bg: "linear-gradient(135deg, #2DA962, #228a4f)" },
          { icon: Star, title: "Accumulator Boost", desc: "Get up to 500% extra on winning accumulators", tag: "Available", tagColor: "#1565c0", bg: "linear-gradient(135deg, #1565c0, #0d47a1)" },
          { icon: Gift, title: "Free Bet Friday", desc: "Claim your weekly UGX 10,000 free bet", tag: "Fridays", tagColor: "#e65100", bg: "linear-gradient(135deg, #e65100, #bf360c)" },
        ].map(({ icon: Icon, title, desc, tag, tagColor, bg }) => (
          <div key={title} style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", borderRadius: 14, padding: "13px 12px", marginBottom: 9, border: "1px solid var(--border)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={21} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--dark)", marginBottom: 2 }}>{title}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>{desc}</div>
            </div>
            <div style={{ background: tagColor + "1a", color: tagColor, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap", border: `1px solid ${tagColor}33` }}>{tag}</div>
          </div>
        ))}

        {/* Refer & Earn */}
        <div onClick={() => setShowRefer(true)} style={{ background: "linear-gradient(135deg, #e65100, #ff8f00)", borderRadius: 14, padding: "16px 14px", marginBottom: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Users size={24} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", fontFamily: "Oswald, sans-serif", letterSpacing: 0.5, marginBottom: 3 }}>REFER & EARN UGX 500</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>Invite friends — you both get UGX 500 bonus when they join</div>
          </div>
          <ChevronRight size={20} color="rgba(255,255,255,0.7)" />
        </div>
      </div>
    </div>
  );
}
