import { useState, useEffect } from "react";
import { Bell, Send, Trash2, Loader, Users, Clock } from "lucide-react";
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../lib/firebase";

interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  createdAt: any;
}

export default function NotificationsAdminTab() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    try {
      await addDoc(collection(db, "notifications"), {
        title: title.trim(),
        message: message.trim(),
        date: new Date().toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
        createdAt: serverTimestamp(),
      });
      setTitle(""); setMessage("");
      setSent(true);
      setTimeout(() => setSent(false), 2500);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "notifications", id));
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", fontFamily: "Oswald, sans-serif" }}>Notifications</div>
        <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>Compose and send push messages to all users</div>
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #2DA962", padding: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(45,169,98,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bell size={18} color="#2DA962" />
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>New Notification</div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 }}>Title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. New Jackpot Available!"
            style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", fontSize: 14, fontWeight: 600, boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 }}>Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Write your message to all users here..."
            rows={4}
            style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", fontSize: 13, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8" }}>
            <Users size={14} /> Sends to all registered users
          </div>
          <button
            onClick={handleSend}
            disabled={sending || !title.trim() || !message.trim()}
            style={{ display: "flex", alignItems: "center", gap: 8, background: sent ? "#2DA962" : "#0f172a", color: "#fff", border: "none", borderRadius: 10, padding: "11px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Oswald, sans-serif", opacity: (sending || !title.trim() || !message.trim()) ? 0.6 : 1 }}
          >
            {sending ? <><Loader size={15} style={{ animation: "spin 1s linear infinite" }} /> SENDING…</> : sent ? "✓ SENT!" : <><Send size={15} /> SEND NOTIFICATION</>}
          </button>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 16 }}>Sent Notifications ({notifications.length})</div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40, gap: 10, color: "#94a3b8" }}>
            <Loader size={18} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
            <Bell size={32} style={{ margin: "0 auto 10px", display: "block", opacity: 0.25 }} />
            <div style={{ fontSize: 13 }}>No notifications sent yet</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {notifications.map(n => (
              <div key={n.id} style={{ background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", padding: "14px 16px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(45,169,98,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Bell size={17} color="#2DA962" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>{n.message}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#94a3b8" }}>
                    <Clock size={11} /> {n.date}
                  </div>
                </div>
                <button onClick={() => handleDelete(n.id)} style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "6px 10px", cursor: "pointer" }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
