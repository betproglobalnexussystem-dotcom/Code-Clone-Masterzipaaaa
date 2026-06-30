import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Clock, ChevronDown } from "lucide-react";
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "admin";
  senderName: string;
  createdAt: number;
}

function getSessionId(): string {
  let id = localStorage.getItem("betmali_chat_session");
  if (!id) {
    id = "guest_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("betmali_chat_session", id);
  }
  return id;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

function formatDateLabel(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getDate() - d.getDate();
  if (diff === 0 && now.getMonth() === d.getMonth()) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function LiveChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const [adminOnline, setAdminOnline] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const seenCountRef = useRef(0);

  const sessionId = getSessionId();
  const effectiveChatId = user ? `user_${user.phone?.replace(/\D/g,"") || user.name.replace(/\s/g,"_")}` : sessionId;
  const displayName = user ? user.name : "Guest";

  // Init chat doc
  useEffect(() => {
    const id = effectiveChatId;
    setChatId(id);
    const ref = doc(db, "support_chats", id);
    getDoc(ref).then(snap => {
      if (!snap.exists()) {
        setDoc(ref, {
          userId: id,
          userName: displayName,
          userPhone: user?.phone || "",
          status: "open",
          createdAt: Date.now(),
          lastMessage: "",
          lastMessageAt: Date.now(),
          unreadAdmin: 0,
        });
      }
    });
  }, [effectiveChatId, displayName]);

  // Listen to messages
  useEffect(() => {
    if (!chatId) return;
    const q = query(collection(db, "support_chats", chatId, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<ChatMessage, "id">),
        createdAt: d.data().createdAt?.toMillis?.() ?? d.data().createdAt ?? Date.now(),
      }));
      setMessages(msgs);
      if (!open) {
        const adminMsgs = msgs.filter(m => m.sender === "admin").length;
        setUnread(Math.max(0, adminMsgs - seenCountRef.current));
      }
    });
    return unsub;
  }, [chatId, open]);

  // Admin presence
  useEffect(() => {
    const ref = doc(db, "admin_presence", "status");
    const unsub = onSnapshot(ref, snap => {
      const data = snap.data();
      if (data) {
        const lastSeen = data.lastSeen?.toMillis?.() ?? 0;
        setAdminOnline(Date.now() - lastSeen < 120_000);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (open) {
      setUnread(0);
      seenCountRef.current = messages.filter(m => m.sender === "admin").length;
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  }, [open, messages.length]);

  const send = async () => {
    const text = input.trim();
    if (!text || !chatId || sending) return;
    setInput("");
    setSending(true);
    try {
      await addDoc(collection(db, "support_chats", chatId, "messages"), {
        text,
        sender: "user",
        senderName: displayName,
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, "support_chats", chatId), {
        lastMessage: text,
        lastMessageAt: Date.now(),
        unreadAdmin: (messages.filter(m => m.sender === "user").length) + 1,
        status: "open",
        userName: displayName,
        userPhone: user?.phone || "",
      }, { merge: true });
    } finally {
      setSending(false);
    }
  };

  // Group messages by date
  const grouped: { label: string; msgs: ChatMessage[] }[] = [];
  messages.forEach(msg => {
    const label = formatDateLabel(msg.createdAt);
    const last = grouped[grouped.length - 1];
    if (last && last.label === label) last.msgs.push(msg);
    else grouped.push({ label, msgs: [msg] });
  });

  return (
    <>
      {/* Floating bubble */}
      {!open && (
        <button
          data-livechat-trigger
          onClick={() => setOpen(true)}
          style={{
            position: "fixed", bottom: 72, right: 16, zIndex: 900,
            width: 52, height: 52, borderRadius: "50%",
            background: "linear-gradient(135deg, #1a8a2e, #2DA962)",
            border: "none", cursor: "pointer",
            boxShadow: "0 4px 16px rgba(45,169,98,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        >
          <MessageCircle size={24} color="#fff" />
          {unread > 0 && (
            <div style={{
              position: "absolute", top: -4, right: -4,
              background: "#e53935", color: "#fff", fontSize: 10, fontWeight: 700,
              width: 18, height: 18, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "2px solid #fff",
            }}>{unread}</div>
          )}
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div style={{
          position: "fixed", bottom: 72, right: 16, zIndex: 950,
          width: 320, maxWidth: "calc(100vw - 32px)",
          background: "#fff", borderRadius: 18,
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column",
          overflow: "hidden", height: 420,
          border: "1px solid rgba(0,0,0,0.08)",
        }}>
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #1a8a2e, #2DA962)",
            padding: "12px 14px",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{ position: "relative" }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <MessageCircle size={18} color="#fff" />
              </div>
              <div style={{
                position: "absolute", bottom: 0, right: 0,
                width: 10, height: 10, borderRadius: "50%",
                background: adminOnline ? "#4caf50" : "#9e9e9e",
                border: "2px solid #fff",
              }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, fontFamily: "Oswald, sans-serif" }}>BetMali Support</div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>
                {adminOnline ? "● Online – typically replies instantly" : "● Away – we'll reply shortly"}
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.8)", padding: 4 }}>
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 8px", display: "flex", flexDirection: "column", gap: 2, scrollbarWidth: "none" }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", color: "#aaa", fontSize: 12, margin: "auto 0" }}>
                <MessageCircle size={32} style={{ opacity: 0.3, marginBottom: 8, display: "block", margin: "0 auto 8px" }} />
                Hi {displayName}! 👋<br />How can we help you today?
              </div>
            )}
            {grouped.map(group => (
              <div key={group.label}>
                <div style={{ textAlign: "center", fontSize: 10, color: "#aaa", margin: "6px 0" }}>{group.label}</div>
                {group.msgs.map(msg => (
                  <div key={msg.id} style={{
                    display: "flex",
                    flexDirection: msg.sender === "user" ? "row-reverse" : "row",
                    alignItems: "flex-end", gap: 6, marginBottom: 6,
                  }}>
                    {msg.sender === "admin" && (
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700, flexShrink: 0 }}>S</div>
                    )}
                    <div style={{
                      maxWidth: "78%",
                      background: msg.sender === "user" ? "var(--green)" : "#f0f0f0",
                      color: msg.sender === "user" ? "#fff" : "#111",
                      borderRadius: msg.sender === "user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                      padding: "7px 10px",
                      fontSize: 13,
                      lineHeight: 1.4,
                    }}>
                      {msg.text}
                      <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 3, opacity: 0.6, justifyContent: msg.sender === "user" ? "flex-end" : "flex-start" }}>
                        <Clock size={9} />
                        <span style={{ fontSize: 9 }}>{formatTime(msg.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "8px 10px", borderTop: "1px solid #f0f0f0", display: "flex", gap: 8, alignItems: "center" }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Type a message..."
              style={{
                flex: 1, border: "1.5px solid #e8e8e8", borderRadius: 20,
                padding: "8px 14px", fontSize: 13, outline: "none",
                background: "#fafafa",
              }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || sending}
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: input.trim() ? "var(--green)" : "#e0e0e0",
                border: "none", cursor: input.trim() ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.15s", flexShrink: 0,
              }}
            >
              <Send size={16} color="#fff" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
