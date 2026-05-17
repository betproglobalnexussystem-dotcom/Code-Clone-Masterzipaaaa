import { useState, useEffect } from "react";
import { Bell, ChevronLeft, Loader, Clock } from "lucide-react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  createdAt: any;
}

const LAST_READ_KEY = "betmali_notif_read";

interface NotificationsPageProps {
  onBack: () => void;
}

export default function NotificationsPage({ onBack }: NotificationsPageProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRead] = useState(() => parseInt(localStorage.getItem(LAST_READ_KEY) ?? "0", 10));

  useEffect(() => {
    localStorage.setItem(LAST_READ_KEY, String(Date.now()));
    window.dispatchEvent(new Event("notif-read"));

    const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", padding: "16px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button onClick={onBack} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <ChevronLeft size={20} color="#fff" />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", fontFamily: "Oswald, sans-serif", letterSpacing: 0.5 }}>NOTIFICATIONS</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Messages from BetMali</div>
          </div>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(45,169,98,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bell size={18} color="#2DA962" />
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 14px" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, gap: 10, color: "#94a3b8" }}>
            <Loader size={20} style={{ animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: 14 }}>Loading…</span>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
            <Bell size={44} style={{ margin: "0 auto 14px", display: "block", opacity: 0.2 }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: "#64748b" }}>No notifications yet</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>We'll notify you of promotions and updates here</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {notifications.map(n => {
              const ms = n.createdAt?.toMillis?.() ?? 0;
              const isNew = ms > lastRead;
              return (
                <div key={n.id} style={{ background: "#fff", borderRadius: 14, border: `1.5px solid ${isNew ? "#2DA962" : "#e2e8f0"}`, padding: "14px 16px", position: "relative", overflow: "hidden" }}>
                  {isNew && <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 4, background: "#2DA962", borderRadius: "14px 0 0 14px" }} />}
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: isNew ? "rgba(45,169,98,0.12)" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Bell size={18} color={isNew ? "#2DA962" : "#94a3b8"} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{n.title}</div>
                        {isNew && <span style={{ fontSize: 9, fontWeight: 700, background: "#2DA962", color: "#fff", padding: "2px 7px", borderRadius: 10 }}>NEW</span>}
                      </div>
                      <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{n.message}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#94a3b8", marginTop: 8 }}>
                        <Clock size={11} /> {n.date}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function useUnreadNotifCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const compute = () => {
      const lastRead = parseInt(localStorage.getItem(LAST_READ_KEY) ?? "0", 10);
      const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
      const unsub = onSnapshot(q, (snap) => {
        const unread = snap.docs.filter(d => {
          const ms = d.data().createdAt?.toMillis?.() ?? 0;
          return ms > lastRead;
        }).length;
        setCount(unread);
      }, () => {});
      return unsub;
    };
    const unsub = compute();
    const onRead = () => setCount(0);
    window.addEventListener("notif-read", onRead);
    return () => { unsub(); window.removeEventListener("notif-read", onRead); };
  }, []);

  return count;
}
