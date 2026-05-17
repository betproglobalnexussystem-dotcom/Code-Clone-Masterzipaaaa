import { useState, useEffect } from "react";
import { Save, Globe, DollarSign, Percent, RefreshCw, Loader, Megaphone, Trophy } from "lucide-react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";

const DEFAULT_SETTINGS = {
  siteName: "BetMali", siteUrl: "https://betmali.ug", currency: "UGX", language: "English",
  timezone: "Africa/Kampala", oddsFormat: "Decimal",
  supportEmail: "support@betmali.ug", supportPhone: "+256 700 000 000",
  minDeposit: "1000", maxDeposit: "5000000", minWithdrawal: "5000", maxWithdrawal: "5000000",
  minBet: "500", maxBet: "500000", maxWin: "50000000",
  welcomeBonus: "100", welcomeBonusMax: "370000",
  maintenanceMode: false, registrationOpen: true, bettingEnabled: true,
  liveScoresEnabled: true, casinoEnabled: true, notificationsEnabled: true,
  autoSettlement: true, kycRequired: false, emailVerification: false,
};

type Settings = typeof DEFAULT_SETTINGS;

function SettingRow({ label, desc, value, onChange, type = "text" }: { label: string; desc: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #f1f5f9" }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{label}</div>
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{desc}</div>
      </div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, width: 200, textAlign: "right", background: "#f8fafc", color: "#0f172a", fontWeight: 600 }} />
    </div>
  );
}

function ToggleRow({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #f1f5f9" }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{label}</div>
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{desc}</div>
      </div>
      <div onClick={() => onChange(!value)} style={{ width: 46, height: 26, borderRadius: 13, background: value ? "#2DA962" : "#cbd5e1", cursor: "pointer", transition: "background 0.2s", position: "relative", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: 3, left: value ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
      </div>
    </div>
  );
}

export default function SettingsTab() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [noticeText, setNoticeText] = useState("Welcome Bonus: 100% up to UGX 370,000 on your first deposit!   Jackpot of UGX 37,000,000 this weekend!   Withdraw via Mobile Money in under 5 minutes!");
  const [noticeSaving, setNoticeSaving] = useState(false);
  const [noticeSaved, setNoticeSaved] = useState(false);

  const [jackpotAmount, setJackpotAmount] = useState("37000000");
  const [jackpotClosesAt, setJackpotClosesAt] = useState("Predict 13 games · Closes in 2h 34m");
  const [jackpotSaving, setJackpotSaving] = useState(false);
  const [jackpotSaved, setJackpotSaved] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "platform"), (snap) => {
      if (snap.exists()) setSettings({ ...DEFAULT_SETTINGS, ...snap.data() } as Settings);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "notice"), (snap) => {
      if (snap.exists() && snap.data().text) setNoticeText(snap.data().text);
    }, () => {});
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "jackpot"), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.amount) setJackpotAmount(String(d.amount));
        if (d.closesAt) setJackpotClosesAt(d.closesAt);
      }
    }, () => {});
    return unsub;
  }, []);

  const update = (key: string) => (val: string | boolean) => setSettings(s => ({ ...s, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "platform"), settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotice = async () => {
    setNoticeSaving(true);
    try {
      await setDoc(doc(db, "settings", "notice"), { text: noticeText });
      setNoticeSaved(true);
      setTimeout(() => setNoticeSaved(false), 2500);
    } finally {
      setNoticeSaving(false);
    }
  };

  const handleSaveJackpot = async () => {
    setJackpotSaving(true);
    try {
      await setDoc(doc(db, "settings", "jackpot"), { amount: parseInt(jackpotAmount, 10) || 37000000, closesAt: jackpotClosesAt });
      setJackpotSaved(true);
      setTimeout(() => setJackpotSaved(false), 2500);
    } finally {
      setJackpotSaving(false);
    }
  };

  const sections = [
    {
      icon: Globe, title: "General Settings", color: "#1565c0",
      rows: [
        { type: "text" as const, label: "Site Name", desc: "The name of the platform", key: "siteName" },
        { type: "text" as const, label: "Site URL", desc: "The main website URL", key: "siteUrl" },
        { type: "text" as const, label: "Currency", desc: "Default currency code", key: "currency" },
        { type: "text" as const, label: "Language", desc: "Default platform language", key: "language" },
        { type: "text" as const, label: "Timezone", desc: "Server timezone", key: "timezone" },
        { type: "text" as const, label: "Odds Format", desc: "Default odds display format", key: "oddsFormat" },
        { type: "text" as const, label: "Support Email", desc: "Customer support email", key: "supportEmail" },
        { type: "text" as const, label: "Support Phone", desc: "Customer support phone", key: "supportPhone" },
      ]
    },
    {
      icon: DollarSign, title: "Financial Limits", color: "#2DA962",
      rows: [
        { type: "number" as const, label: "Min Deposit (UGX)", desc: "Minimum deposit amount", key: "minDeposit" },
        { type: "number" as const, label: "Max Deposit (UGX)", desc: "Maximum deposit per transaction", key: "maxDeposit" },
        { type: "number" as const, label: "Min Withdrawal (UGX)", desc: "Minimum withdrawal amount", key: "minWithdrawal" },
        { type: "number" as const, label: "Max Withdrawal (UGX)", desc: "Maximum withdrawal per transaction", key: "maxWithdrawal" },
        { type: "number" as const, label: "Min Bet (UGX)", desc: "Minimum bet stake", key: "minBet" },
        { type: "number" as const, label: "Max Bet (UGX)", desc: "Maximum bet stake", key: "maxBet" },
        { type: "number" as const, label: "Max Win (UGX)", desc: "Maximum payout per ticket", key: "maxWin" },
      ]
    },
    {
      icon: Percent, title: "Bonuses & Promotions", color: "#7c3aed",
      rows: [
        { type: "number" as const, label: "Welcome Bonus (%)", desc: "First deposit bonus percentage", key: "welcomeBonus" },
        { type: "number" as const, label: "Welcome Bonus Max (UGX)", desc: "Maximum welcome bonus amount", key: "welcomeBonusMax" },
      ]
    },
  ];

  const toggleSection = [
    { label: "Maintenance Mode", desc: "Take the site offline for maintenance", key: "maintenanceMode" },
    { label: "Registration Open", desc: "Allow new user registrations", key: "registrationOpen" },
    { label: "Betting Enabled", desc: "Allow users to place bets", key: "bettingEnabled" },
    { label: "Live Scores Enabled", desc: "Show live match scores", key: "liveScoresEnabled" },
    { label: "Casino Enabled", desc: "Show casino games section", key: "casinoEnabled" },
    { label: "Auto Settlement", desc: "Automatically settle bets when results are available", key: "autoSettlement" },
    { label: "Push Notifications", desc: "Send push notifications to users", key: "notificationsEnabled" },
    { label: "KYC Required", desc: "Require identity verification before withdrawal", key: "kycRequired" },
    { label: "Email Verification", desc: "Require email verification on registration", key: "emailVerification" },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, gap: 10, color: "#94a3b8" }}>
        <Loader size={20} style={{ animation: "spin 1s linear infinite" }} />
        <span style={{ fontSize: 14, fontWeight: 600 }}>Loading settings…</span>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", fontFamily: "Oswald, sans-serif" }}>Platform Settings</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>Configure all platform settings and features</div>
        </div>
        <button onClick={handleSave} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 7, background: saved ? "#2DA962" : "#0f172a", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "background 0.2s", fontFamily: "Oswald, sans-serif", opacity: saving ? 0.75 : 1 }}>
          {saving ? <><Loader size={15} style={{ animation: "spin 1s linear infinite" }} /> SAVING…</> : <><Save size={15} /> {saved ? "SAVED!" : "SAVE CHANGES"}</>}
        </button>
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #f59e0b", padding: "20px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Megaphone size={18} color="#f59e0b" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Notice Bar Text</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>The scrolling ticker shown at the top of the homepage</div>
            </div>
          </div>
          <button onClick={handleSaveNotice} disabled={noticeSaving} style={{ display: "flex", alignItems: "center", gap: 7, background: noticeSaved ? "#2DA962" : "#f59e0b", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Oswald, sans-serif", opacity: noticeSaving ? 0.75 : 1 }}>
            {noticeSaving ? <><Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> SAVING…</> : noticeSaved ? "✓ SAVED!" : <><Save size={13} /> SAVE</>}
          </button>
        </div>
        <textarea
          value={noticeText}
          onChange={e => setNoticeText(e.target.value)}
          rows={3}
          placeholder="Enter the notice bar scrolling text…"
          style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", fontSize: 13, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.6 }}
        />
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>Tip: use multiple spaces to create gaps between messages in the scroll.</div>
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid rgba(255,180,0,0.4)", padding: "20px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,180,0,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Trophy size={18} color="#c97c00" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Mega Jackpot</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Jackpot amount and subtitle shown on the homepage banner</div>
            </div>
          </div>
          <button onClick={handleSaveJackpot} disabled={jackpotSaving} style={{ display: "flex", alignItems: "center", gap: 7, background: jackpotSaved ? "#2DA962" : "#c97c00", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Oswald, sans-serif", opacity: jackpotSaving ? 0.75 : 1 }}>
            {jackpotSaving ? <><Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> SAVING…</> : jackpotSaved ? "✓ SAVED!" : <><Save size={13} /> SAVE</>}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 }}>Jackpot Amount (UGX)</label>
            <input
              type="number"
              value={jackpotAmount}
              onChange={e => setJackpotAmount(e.target.value)}
              style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", fontSize: 14, fontWeight: 700, boxSizing: "border-box", color: "#0f172a" }}
            />
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
              {parseInt(jackpotAmount || "0", 10).toLocaleString("en-UG")} UGX
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 }}>Subtitle / Closing Time</label>
            <input
              value={jackpotClosesAt}
              onChange={e => setJackpotClosesAt(e.target.value)}
              placeholder="e.g. Predict 13 games · Closes in 2h 34m"
              style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", fontSize: 13, boxSizing: "border-box" }}
            />
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Shown below the jackpot amount on the homepage</div>
          </div>
        </div>
      </div>

      {sections.map(section => (
        <div key={section.title} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "20px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${section.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <section.icon size={18} color={section.color} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{section.title}</div>
          </div>
          {section.rows.map(row => (
            <SettingRow key={row.key} label={row.label} desc={row.desc} type={row.type} value={String(settings[row.key as keyof Settings])} onChange={update(row.key)} />
          ))}
        </div>
      ))}

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "20px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <RefreshCw size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Feature Toggles</div>
        </div>
        {toggleSection.map(row => (
          <ToggleRow key={row.key} label={row.label} desc={row.desc} value={Boolean(settings[row.key as keyof Settings])} onChange={update(row.key)} />
        ))}
      </div>

      {saved && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#2DA962", color: "#fff", borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 700, boxShadow: "0 4px 20px rgba(45,169,98,0.4)", zIndex: 999 }}>
          ✓ Settings saved to Firestore
        </div>
      )}
    </div>
  );
}
