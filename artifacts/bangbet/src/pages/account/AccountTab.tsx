import { useState } from "react";
import {
  User, Lock, Phone, Crown, Users, Shield, ChevronDown, ChevronUp,
  MessageCircle, Mail, HelpCircle, FileCheck, ShieldCheck, LogOut,
  CheckCircle, AlertCircle, X, Eye, EyeOff, Star, Zap, Trophy, Send
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function Modal({ title, accent, onClose, children }: { title: React.ReactNode; accent: string; onClose: () => void; children: React.ReactNode }) {
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

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState(""); const [next, setNext] = useState(""); const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false); const [showNext, setShowNext] = useState(false);
  const [error, setError] = useState(""); const [success, setSuccess] = useState(false);

  const handle = async () => {
    setError("");
    if (next !== confirm) { setError("New passwords do not match."); return; }
    const r = await changePassword(current, next);
    if (r.success) { setSuccess(true); setTimeout(onClose, 1200); } else setError(r.error || "Failed.");
  };

  return (
    <Modal title={<>CHANGE <span className="highlight">PASSWORD</span></>} accent="#b71c1c" onClose={onClose}>
      {error && <Alert type="error" msg={error} />}
      {success && <Alert type="success" msg="Password updated successfully!" />}
      {[
        { label: "Current Password", val: current, set: setCurrent, show: showCurrent, toggle: () => setShowCurrent(v => !v) },
        { label: "New Password (min 6 chars)", val: next, set: setNext, show: showNext, toggle: () => setShowNext(v => !v) },
        { label: "Confirm New Password", val: confirm, set: setConfirm, show: showNext, toggle: null },
      ].map(({ label, val, set, show, toggle }) => (
        <div key={label} className="form-group">
          <label className="form-label"><Lock size={13} /> {label}</label>
          <div style={{ position: "relative" }}>
            <input className="form-input" type={show ? "text" : "password"} placeholder={label} value={val} onChange={(e) => set(e.target.value)} style={{ paddingRight: 44 }} />
            {toggle && (
              <button type="button" onClick={toggle} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex" }}>
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            )}
          </div>
        </div>
      ))}
      <button className="btn-primary" style={{ background: "#b71c1c" }} onClick={handle}><Lock size={17} /> UPDATE PASSWORD</button>
    </Modal>
  );
}

function EditProfileModal({ onClose }: { onClose: () => void }) {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [error, setError] = useState(""); const [success, setSuccess] = useState(false);

  const handle = async () => {
    if (!name.trim()) { setError("Name cannot be empty."); return; }
    await updateProfile({ name: name.trim() });
    setSuccess(true);
    setTimeout(onClose, 1000);
  };

  return (
    <Modal title={<>EDIT <span className="highlight">PROFILE</span></>} accent="var(--green)" onClose={onClose}>
      {error && <Alert type="error" msg={error} />}
      {success && <Alert type="success" msg="Profile updated!" />}
      <div className="form-group">
        <label className="form-label"><User size={13} /> Full Name</label>
        <input className="form-input" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
      </div>
      <div className="form-group">
        <label className="form-label"><Phone size={13} /> Phone Number</label>
        <input className="form-input" type="tel" value={user?.phone || ""} disabled style={{ opacity: 0.6 }} />
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Phone number cannot be changed</div>
      </div>
      <button className="btn-primary" onClick={handle}><CheckCircle size={17} /> SAVE CHANGES</button>
    </Modal>
  );
}

function LiveChatModal({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState([
    { from: "agent", text: "Hi! Welcome to BetMali Support. How can I help you today?" },
  ]);
  const [input, setInput] = useState("");

  const RESPONSES = [
    "Thank you for reaching out! Let me look into that for you.",
    "I understand your concern. Our team will resolve this shortly.",
    "For deposits and withdrawals, please allow up to 5 minutes for processing.",
    "Your account is in good standing. Is there anything else I can help with?",
    "I've escalated your query to our specialist team. You'll hear back within 24 hours.",
  ];

  const send = () => {
    if (!input.trim()) return;
    const userMsg = { from: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTimeout(() => {
      setMessages((prev) => [...prev, { from: "agent", text: RESPONSES[Math.floor(Math.random() * RESPONSES.length)] }]);
    }, 900);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ padding: 0, overflow: "hidden", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
        <div style={{ background: "var(--green)", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MessageCircle size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "Oswald, sans-serif" }}>LIVE SUPPORT</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#69f0ae", display: "inline-block" }} /> Agent Online
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff" }}><X size={22} /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 8px", background: "#f5f5f5", minHeight: 200, maxHeight: 320 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
              <div style={{ maxWidth: "78%", background: m.from === "user" ? "var(--green)" : "#fff", color: m.from === "user" ? "#fff" : "var(--dark)", borderRadius: m.from === "user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px", padding: "10px 13px", fontSize: 13, lineHeight: 1.5, boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "10px 12px 14px", background: "#fff", borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
          <input
            style={{ flex: 1, border: "1.5px solid var(--border)", borderRadius: 22, padding: "10px 14px", fontSize: 13, outline: "none" }}
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button onClick={send} style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--green)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Send size={18} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
}

function FAQModal({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    { q: "How do I deposit money?", a: "Go to Wallet → Deposit. Choose MTN Mobile Money, Airtel Money, or Bank Transfer. Enter the amount (min UGX 1,000) and confirm. Funds reflect instantly." },
    { q: "How long does withdrawal take?", a: "Withdrawals via Mobile Money are processed within 5 minutes. Bank transfers may take 1–3 business days. Minimum withdrawal is UGX 5,000." },
    { q: "How do I claim my welcome bonus?", a: "Your 100% welcome bonus (up to UGX 370,000) is automatically credited after your first deposit. The bonus appears in your Wallet under 'Bonus'." },
    { q: "What is the minimum bet amount?", a: "The minimum bet is UGX 500. The maximum depends on the market and match, usually up to UGX 5,000,000 per selection." },
    { q: "How does the referral program work?", a: "Share your unique referral code found in Wallet → Refer & Earn. When a friend registers and uses your code, you both receive UGX 500 bonus instantly." },
    { q: "How do I reset my password?", a: "Go to Account → Change Password. Enter your current password and your new password (minimum 6 characters). Changes apply immediately." },
    { q: "Is my money safe?", a: "Yes. BetMali is licensed by the Uganda National Gaming Board. All transactions are secured with industry-standard encryption." },
    { q: "What sports can I bet on?", a: "We offer Soccer, Basketball, Tennis, Rugby, E-Sports, Virtual Sports, Aviator, and more. Live betting is available on selected matches." },
  ];

  return (
    <Modal title={<>FREQUENTLY ASKED <span className="highlight">QUESTIONS</span></>} accent="#37474f" onClose={onClose}>
      {faqs.map((f, i) => (
        <div key={i} style={{ borderRadius: 12, border: "1px solid var(--border)", marginBottom: 8, overflow: "hidden" }}>
          <div onClick={() => setOpen(open === i ? null : i)} style={{ padding: "12px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", background: open === i ? "var(--green-light)" : "#fff" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--dark)", flex: 1, paddingRight: 8 }}>{f.q}</span>
            {open === i ? <ChevronUp size={16} color="var(--green)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
          </div>
          {open === i && (
            <div style={{ padding: "10px 14px 13px", background: "#fafafa", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{f.a}</div>
          )}
        </div>
      ))}
    </Modal>
  );
}

function TermsModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title={<>TERMS & <span className="highlight">CONDITIONS</span></>} accent="#4a148c" onClose={onClose}>
      <div style={{ maxHeight: 400, overflowY: "auto", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7 }}>
        {[
          { title: "1. Eligibility", body: "You must be 18 years or older to register and place bets on BetMali. By creating an account you confirm you meet this requirement. BetMali reserves the right to request age verification documents at any time." },
          { title: "2. Account Registration", body: "Each user may only hold one account. Duplicate accounts will be suspended. You are responsible for maintaining the confidentiality of your login credentials. BetMali is not liable for any losses resulting from unauthorized access to your account." },
          { title: "3. Deposits & Withdrawals", body: "Minimum deposit is UGX 1,000. Minimum withdrawal is UGX 5,000. Withdrawals are processed within 5 minutes for Mobile Money. BetMali reserves the right to request identity verification before processing withdrawals." },
          { title: "4. Bonuses", body: "Welcome bonus is 100% of your first deposit up to UGX 370,000. Bonuses are subject to 5x wagering requirements before withdrawal. BetMali may modify or withdraw bonus offers at any time." },
          { title: "5. Responsible Gambling", body: "BetMali supports responsible gambling. If you feel you are developing a gambling problem, please use our self-exclusion feature or contact support. We partner with Gamblers Anonymous Uganda for professional help." },
          { title: "6. Prohibited Conduct", body: "Fraudulent activity, use of bots, collusion, or any form of cheating will result in immediate account suspension and forfeiture of funds. BetMali uses advanced detection systems to identify suspicious behaviour." },
          { title: "7. Privacy", body: "We collect and process personal data in accordance with Uganda's Data Protection laws. Your data is never sold to third parties. For full details, contact support@betmali.ug" },
          { title: "8. Governing Law", body: "These terms are governed by the laws of Uganda. BetMali operates under license from the Uganda National Gaming Board. Any disputes shall be resolved under Ugandan jurisdiction." },
        ].map(({ title, body }) => (
          <div key={title} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--dark)", marginBottom: 6 }}>{title}</div>
            <div>{body}</div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function ResponsibleModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title={<>RESPONSIBLE <span className="highlight">GAMBLING</span></>} accent="#b71c1c" onClose={onClose}>
      <div style={{ background: "#ffeaea", border: "1px solid #ffb3b3", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#c62828", marginBottom: 4 }}>Gambling should be fun, not stressful.</div>
        <div style={{ fontSize: 12, color: "#c62828", lineHeight: 1.6 }}>If betting is affecting your mental health, finances, or relationships, please seek help immediately.</div>
      </div>
      {[
        { icon: Shield, title: "Set Deposit Limits", desc: "Control how much you deposit per day, week, or month. Contact support to set your limits." },
        { icon: Users, title: "Self-Exclusion", desc: "Request a temporary or permanent self-exclusion from BetMali. Contact support@betmali.ug." },
        { icon: HelpCircle, title: "Reality Check", desc: "Enable session time reminders to keep track of how long you've been playing." },
      ].map(({ icon: Icon, title, desc }) => (
        <div key={title} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#ffeaea", border: "1px solid #ffb3b3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={20} color="#b71c1c" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--dark)", marginBottom: 3 }}>{title}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{desc}</div>
          </div>
        </div>
      ))}
      <a href="mailto:support@betmali.ug">
        <button className="btn-primary" style={{ background: "#b71c1c" }}><Mail size={17} /> CONTACT SUPPORT</button>
      </a>
    </Modal>
  );
}

function VIPModal({ onClose }: { onClose: () => void }) {
  const levels = [
    { name: "Bronze", icon: Shield, color: "#cd7f32", req: "Register", perks: ["Access to all sports", "Standard odds", "Welcome bonus"] },
    { name: "Silver", icon: Star, color: "#9e9e9e", req: "Deposit UGX 100,000", perks: ["Priority withdrawals", "5% odds boost", "Monthly free bet"] },
    { name: "Gold", icon: Trophy, color: "#f9a825", req: "Deposit UGX 500,000", perks: ["Dedicated account manager", "10% odds boost", "Weekly cashback"] },
    { name: "Platinum", icon: Crown, color: "#7b1fa2", req: "Deposit UGX 2,000,000", perks: ["VIP customer support", "20% odds boost", "Daily free bets", "Exclusive events"] },
    { name: "Diamond", icon: Zap, color: "#00bcd4", req: "Deposit UGX 10,000,000", perks: ["Personal account manager", "Best odds guaranteed", "Unlimited cashback", "Luxury rewards"] },
  ];

  return (
    <Modal title={<>VIP <span className="highlight">PROGRAM</span></>} accent="#f9a825" onClose={onClose}>
      <div style={{ background: "linear-gradient(135deg, #f9a825, #e65100)", borderRadius: 12, padding: "12px 14px", marginBottom: 16, textAlign: "center" }}>
        <Crown size={28} color="#fff" style={{ marginBottom: 6 }} />
        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "Oswald, sans-serif" }}>YOUR CURRENT LEVEL: BRONZE</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>Deposit more to unlock higher tiers</div>
      </div>
      {levels.map(({ name, icon: Icon, color, req, perks }) => (
        <div key={name} style={{ borderRadius: 12, border: `1.5px solid ${color}44`, marginBottom: 8, overflow: "hidden" }}>
          <div style={{ background: color + "18", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <Icon size={20} color={color} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--dark)" }}>{name}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Requires: {req}</div>
            </div>
          </div>
          <div style={{ padding: "8px 14px 10px", background: "#fff" }}>
            {perks.map((p) => (
              <div key={p} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>
                <CheckCircle size={12} color={color} /> {p}
              </div>
            ))}
          </div>
        </div>
      ))}
    </Modal>
  );
}

export default function AccountTab({ onLogout }: { onLogout: () => void }) {
  const { user } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showResponsible, setShowResponsible] = useState(false);
  const [showVIP, setShowVIP] = useState(false);

  return (
    <div style={{ paddingBottom: 20 }}>
      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
      {showEditProfile && <EditProfileModal onClose={() => setShowEditProfile(false)} />}
      {showLiveChat && <LiveChatModal onClose={() => setShowLiveChat(false)} />}
      {showFAQ && <FAQModal onClose={() => setShowFAQ(false)} />}
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
      {showResponsible && <ResponsibleModal onClose={() => setShowResponsible(false)} />}
      {showVIP && <VIPModal onClose={() => setShowVIP(false)} />}

      {/* Profile Card */}
      <div style={{ margin: "14px 14px 0", background: "#fff", borderRadius: 16, padding: "16px 14px", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 58, height: 58, borderRadius: "50%", background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 24, fontWeight: 700, fontFamily: "Oswald, sans-serif", flexShrink: 0 }}>
          {user?.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--dark)", fontFamily: "Oswald, sans-serif" }}>{user?.name}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{user?.phone}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Member since {user?.joinedDate}</div>
        </div>
        <button onClick={() => setShowEditProfile(true)} style={{ fontSize: 12, fontWeight: 700, color: "var(--green)", background: "var(--green-light)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>
          Edit
        </button>
      </div>

      {/* Account Section */}
      <div style={{ padding: "14px 14px 0" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>Account Settings</div>
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
          {[
            { icon: Lock, label: "Change Password", color: "#b71c1c", action: () => setShowChangePassword(true) },
            { icon: Phone, label: "Verify Account", color: "#006064", action: null },
            { icon: Crown, label: "VIP Program", color: "#f57f17", action: () => setShowVIP(true) },
            { icon: Users, label: "Refer a Friend", color: "#1a237e", action: null },
          ].map(({ icon: Icon, label, color, action }, i, arr) => (
            <div key={label} onClick={action || undefined} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 14px", cursor: action ? "pointer" : "default", borderBottom: i < arr.length - 1 ? "1px solid var(--border2)" : "none", background: "#fff" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${color}33` }}>
                <Icon size={18} color={color} />
              </div>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--dark)" }}>{label}</span>
              <ChevronDown size={15} color="var(--text-muted)" style={{ transform: "rotate(-90deg)" }} />
            </div>
          ))}
        </div>
      </div>

      {/* Support Section */}
      <div style={{ padding: "14px 14px 0" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>Support</div>
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
          {[
            { icon: MessageCircle, label: "Live Chat", color: "#2DA962", action: () => setShowLiveChat(true), badge: "Online" },
            { icon: Mail, label: "Email Support", color: "#1565c0", action: () => window.location.href = "mailto:support@betmali.ug", badge: null },
            { icon: HelpCircle, label: "FAQ", color: "#37474f", action: () => setShowFAQ(true), badge: null },
            { icon: FileCheck, label: "Terms & Conditions", color: "#4a148c", action: () => setShowTerms(true), badge: null },
            { icon: ShieldCheck, label: "Responsible Gambling", color: "#b71c1c", action: () => setShowResponsible(true), badge: null },
          ].map(({ icon: Icon, label, color, action, badge }, i, arr) => (
            <div key={label} onClick={action} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 14px", cursor: "pointer", borderBottom: i < arr.length - 1 ? "1px solid var(--border2)" : "none" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${color}33` }}>
                <Icon size={18} color={color} />
              </div>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--dark)" }}>{label}</span>
              {badge && <span style={{ fontSize: 10, fontWeight: 700, color: "var(--green)", background: "#e8f5e9", border: "1px solid #a5d6a7", padding: "2px 8px", borderRadius: 8 }}>{badge}</span>}
              <ChevronDown size={15} color="var(--text-muted)" style={{ transform: "rotate(-90deg)" }} />
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div style={{ padding: "14px 14px 0" }}>
        <button onClick={onLogout} style={{ width: "100%", background: "transparent", border: "1.5px solid var(--red)", color: "var(--red)", borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "Oswald, sans-serif", letterSpacing: "0.5px", cursor: "pointer" }}>
          <LogOut size={16} /> LOGOUT
        </button>
      </div>

      <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", padding: "14px 14px 0" }}>
        Licensed by the Uganda National Gaming Board · 18+ Only
      </div>
    </div>
  );
}
