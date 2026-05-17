import { useState, useEffect } from "react";
import { AlertTriangle, Shield, CheckCircle, Lock, Unlock, Activity, Save, Loader, Plus } from "lucide-react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { AdminUser } from "../adminData";

interface SecurityLog {
  id: string;
  event: string;
  userId?: string;
  userName?: string;
  ip: string;
  date: string;
  severity: "high" | "medium" | "low";
  resolved: boolean;
}

interface SecuritySettings {
  loginAttemptLimit: string;
  lockoutDuration: string;
  sessionTimeout: string;
  dailyWithdrawalLimit: string;
  maxBetAmount: string;
  kycVerification: string;
  ipWhitelist: string;
  twoFAWithdrawals: string;
}

const DEFAULT_SEC_SETTINGS: SecuritySettings = {
  loginAttemptLimit: "5",
  lockoutDuration: "30",
  sessionTimeout: "2",
  dailyWithdrawalLimit: "5000000",
  maxBetAmount: "500000",
  kycVerification: "Optional",
  ipWhitelist: "Disabled",
  twoFAWithdrawals: "Enabled",
};

export default function SecurityTab() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("logs");
  const [suspendedUsers, setSuspendedUsers] = useState<AdminUser[]>([]);
  const [secSettings, setSecSettings] = useState<SecuritySettings>(DEFAULT_SEC_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAddLog, setShowAddLog] = useState(false);
  const [newEvent, setNewEvent] = useState("");
  const [newIp, setNewIp] = useState("");
  const [newSeverity, setNewSeverity] = useState<"high"|"medium"|"low">("medium");

  useEffect(() => {
    const q = query(collection(db, "securityLogs"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as SecurityLog)));
      setLogsLoading(false);
    }, () => setLogsLoading(false));
    return unsub;
  }, []);

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminUser));
      setSuspendedUsers(all.filter(u => u.status === "suspended" || u.status === "banned"));
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "security"), (snap) => {
      if (snap.exists()) setSecSettings({ ...DEFAULT_SEC_SETTINGS, ...snap.data() } as SecuritySettings);
      setSettingsLoading(false);
    }, () => setSettingsLoading(false));
    return unsub;
  }, []);

  const resolve = async (id: string) => {
    await updateDoc(doc(db, "securityLogs", id), { resolved: true });
  };

  const handleActivate = async (userId: string) => {
    await updateDoc(doc(db, "users", userId), { status: "active" });
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "security"), secSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleAddLog = async () => {
    if (!newEvent.trim() || !newIp.trim()) return;
    await addDoc(collection(db, "securityLogs"), {
      event: newEvent, ip: newIp, severity: newSeverity, resolved: false,
      userName: "Admin Entry", date: new Date().toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      createdAt: serverTimestamp(),
    });
    setNewEvent(""); setNewIp(""); setNewSeverity("medium"); setShowAddLog(false);
  };

  const severityStyle = (s: string) => ({
    high:   { bg: "rgba(239,68,68,0.1)",  color: "#ef4444", border: "rgba(239,68,68,0.3)" },
    medium: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "rgba(245,158,11,0.3)" },
    low:    { bg: "rgba(45,169,98,0.1)",  color: "#2DA962", border: "rgba(45,169,98,0.3)" },
  }[s] || { bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0" });

  const unresolved = logs.filter(l => !l.resolved);
  const highSeverity = logs.filter(l => l.severity === "high");

  const SEC_FIELDS: { key: keyof SecuritySettings; label: string; desc: string; suffix?: string }[] = [
    { key: "loginAttemptLimit", label: "Login Attempt Limit", desc: "Max failed logins before lockout", suffix: "attempts" },
    { key: "lockoutDuration", label: "Account Lockout Duration", desc: "How long accounts are locked after failures", suffix: "minutes" },
    { key: "sessionTimeout", label: "Session Timeout", desc: "Auto-logout after inactivity", suffix: "hours" },
    { key: "dailyWithdrawalLimit", label: "Withdrawal Limit (Daily, UGX)", desc: "Max withdrawal per user per day" },
    { key: "maxBetAmount", label: "Max Bet Amount (UGX)", desc: "Maximum single bet stake" },
    { key: "kycVerification", label: "KYC Verification", desc: "Require identity verification" },
    { key: "ipWhitelist", label: "IP Whitelist", desc: "Restrict admin access by IP" },
    { key: "twoFAWithdrawals", label: "2FA for Withdrawals", desc: "Require OTP for all withdrawals" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", fontFamily: "Oswald, sans-serif" }}>Security Center</div>
        <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>Monitor threats, blocked users, and platform security</div>
      </div>

      {unresolved.length > 0 && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <AlertTriangle size={18} style={{ color: "#ef4444", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>{unresolved.length} Unresolved Security Alert{unresolved.length > 1 ? "s" : ""}</div>
            <div style={{ fontSize: 12, color: "#b91c1c" }}>Review and resolve pending security issues below</div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Alerts", val: logs.length, icon: Activity, color: "#64748b", bg: "#f1f5f9" },
          { label: "Unresolved", val: unresolved.length, icon: AlertTriangle, color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
          { label: "High Severity", val: highSeverity.length, icon: Shield, color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
          { label: "Suspended/Banned", val: suspendedUsers.length, icon: Lock, color: "#7c3aed", bg: "rgba(124,58,237,0.08)" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "Oswald, sans-serif", color: "#0f172a" }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", borderBottom: "2px solid #e2e8f0", marginBottom: 16 }}>
        {["logs", "blocked", "settings"].map(t => (
          <div key={t} onClick={() => setActiveTab(t)} style={{ padding: "9px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", color: activeTab === t ? "#2DA962" : "#94a3b8", borderBottom: `2px solid ${activeTab === t ? "#2DA962" : "transparent"}`, marginBottom: -2, textTransform: "capitalize", transition: "all 0.2s" }}>
            {t === "logs" ? "Security Logs" : t === "blocked" ? "Suspended/Banned Users" : "Security Settings"}
          </div>
        ))}
      </div>

      {activeTab === "logs" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <button onClick={() => setShowAddLog(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              <Plus size={14} /> ADD LOG ENTRY
            </button>
          </div>

          {showAddLog && (
            <div style={{ background: "#fff", border: "1.5px solid #2DA962", borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 5 }}>EVENT DESCRIPTION</label>
                  <input value={newEvent} onChange={e => setNewEvent(e.target.value)} placeholder="e.g. Multiple failed login attempts" style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 12, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 5 }}>IP ADDRESS</label>
                  <input value={newIp} onChange={e => setNewIp(e.target.value)} placeholder="e.g. 105.163.45.12" style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 12, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 5 }}>SEVERITY</label>
                  <select value={newSeverity} onChange={e => setNewSeverity(e.target.value as "high"|"medium"|"low")} style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 12, boxSizing: "border-box" }}>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleAddLog} style={{ background: "#2DA962", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Add Log</button>
                <button onClick={() => setShowAddLog(false)} style={{ background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          )}

          {logsLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40, gap: 10, color: "#94a3b8" }}>
              <Loader size={18} style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 13 }}>Loading security logs…</span>
            </div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 13 }}>
              <Shield size={32} style={{ margin: "0 auto 10px", display: "block", opacity: 0.3 }} />
              No security events recorded
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {logs.map(log => {
                const sc = severityStyle(log.severity);
                return (
                  <div key={log.id} style={{ background: "#fff", borderRadius: 12, border: `1px solid ${log.resolved ? "#f1f5f9" : sc.border}`, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 14, opacity: log.resolved ? 0.6 : 1 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: sc.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <AlertTriangle size={17} color={sc.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{log.event}</div>
                          {log.userName && <div style={{ fontSize: 11, color: "#64748b" }}>User: {log.userName}</div>}
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>IP: {log.ip} · {log.date}</div>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 10, background: sc.bg, color: sc.color, textTransform: "uppercase" }}>{log.severity}</span>
                          {log.resolved ? (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 10, background: "rgba(45,169,98,0.1)", color: "#2DA962" }}>RESOLVED</span>
                          ) : (
                            <button onClick={() => resolve(log.id)} style={{ fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 8, background: "#0f172a", color: "#fff", border: "none", cursor: "pointer" }}>Resolve</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "blocked" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {suspendedUsers.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 13 }}>No suspended or banned users</div>
          ) : suspendedUsers.map(u => (
            <div key={u.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: u.status === "banned" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: u.status === "banned" ? "#ef4444" : "#f59e0b" }}>{u.name?.[0] ?? "?"}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{u.phone}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>Last seen: {u.lastSeen ?? "—"}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 12, background: u.status === "banned" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)", color: u.status === "banned" ? "#ef4444" : "#f59e0b", textTransform: "uppercase" }}>{u.status}</span>
                {(u.status === "suspended" || u.status === "banned") && (
                  <button onClick={() => handleActivate(u.id)} style={{ fontSize: 11, fontWeight: 700, padding: "6px 14px", borderRadius: 8, background: "rgba(45,169,98,0.1)", color: "#2DA962", border: "1px solid rgba(45,169,98,0.3)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                    <Unlock size={12} /> Activate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "settings" && (
        <div>
          {settingsLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40, gap: 10, color: "#94a3b8" }}>
              <Loader size={18} style={{ animation: "spin 1s linear infinite" }} />
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                {SEC_FIELDS.map(f => (
                  <div key={f.key} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "16px 18px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{f.label}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 10 }}>{f.desc}</div>
                    <input
                      value={secSettings[f.key]}
                      onChange={e => setSecSettings(s => ({ ...s, [f.key]: e.target.value }))}
                      style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 13, fontWeight: 600, boxSizing: "border-box" }}
                    />
                  </div>
                ))}
              </div>
              <button onClick={handleSaveSettings} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 7, background: saved ? "#2DA962" : "#0f172a", color: "#fff", border: "none", borderRadius: 10, padding: "11px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Oswald, sans-serif" }}>
                {saving ? <><Loader size={15} style={{ animation: "spin 1s linear infinite" }} /> SAVING…</> : <><Save size={15} /> {saved ? "SAVED!" : "SAVE SECURITY SETTINGS"}</>}
              </button>
            </>
          )}
        </div>
      )}

      {saved && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#2DA962", color: "#fff", borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 700, boxShadow: "0 4px 20px rgba(45,169,98,0.4)", zIndex: 999 }}>
          ✓ Security settings saved
        </div>
      )}
    </div>
  );
}
