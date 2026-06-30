import { useState, useEffect, useRef } from "react";
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, doc, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { MessageCircle, Clock, Send, Circle, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

interface ChatSession {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  status: "open" | "closed";
  lastMessage: string;
  lastMessageAt: number;
  unreadAdmin: number;
  createdAt: number;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "admin";
  senderName: string;
  createdAt: number;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  const s = d.getSeconds().toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
      <Clock size={12} />
      {time.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </div>
  );
}

export default function LiveChatTab() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<"open" | "closed" | "all">("open");
  const [now, setNow] = useState(Date.now());
  const bottomRef = useRef<HTMLDivElement>(null);

  // Tick clock for relative times
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(t);
  }, []);

  // Broadcast admin presence every 60s
  useEffect(() => {
    const ping = () => setDoc(doc(db, "admin_presence", "status"), { lastSeen: serverTimestamp() }, { merge: true });
    ping();
    const t = setInterval(ping, 60_000);
    return () => clearInterval(t);
  }, []);

  // All sessions
  useEffect(() => {
    const q = query(collection(db, "support_chats"), orderBy("lastMessageAt", "desc"));
    const unsub = onSnapshot(q, snap => {
      setSessions(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<ChatSession, "id">) })));
    });
    return unsub;
  }, []);

  // Active conversation messages
  useEffect(() => {
    if (!activeChatId) return;
    const q = query(collection(db, "support_chats", activeChatId, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<ChatMessage, "id">),
        createdAt: d.data().createdAt?.toMillis?.() ?? d.data().createdAt ?? Date.now(),
      })));
      // Mark as read
      updateDoc(doc(db, "support_chats", activeChatId), { unreadAdmin: 0 }).catch(() => {});
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
    });
    return unsub;
  }, [activeChatId]);

  const sendReply = async () => {
    const text = input.trim();
    if (!text || !activeChatId || sending) return;
    setInput("");
    setSending(true);
    try {
      await addDoc(collection(db, "support_chats", activeChatId, "messages"), {
        text,
        sender: "admin",
        senderName: "Support",
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "support_chats", activeChatId), {
        lastMessage: text,
        lastMessageAt: Date.now(),
        unreadAdmin: 0,
      });
    } finally {
      setSending(false);
    }
  };

  const closeConversation = async (id: string) => {
    await updateDoc(doc(db, "support_chats", id), { status: "closed" });
    if (activeChatId === id) setActiveChatId(null);
  };

  const reopenConversation = async (id: string) => {
    await updateDoc(doc(db, "support_chats", id), { status: "open" });
  };

  const filteredSessions = sessions.filter(s =>
    filter === "all" ? true : s.status === filter
  );

  const openCount = sessions.filter(s => s.status === "open").length;
  const unreadTotal = sessions.reduce((a, s) => a + (s.unreadAdmin || 0), 0);

  const activeSession = sessions.find(s => s.id === activeChatId);

  return (
    <div style={{ display: "flex", height: "calc(100vh - 60px)", overflow: "hidden", background: "#0f172a" }}>

      {/* Left: session list */}
      <div style={{ width: 280, borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* Header */}
        <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MessageCircle size={18} color="#2DA962" />
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, fontFamily: "Oswald, sans-serif" }}>LIVE CHAT</span>
              {unreadTotal > 0 && (
                <div style={{ background: "#e53935", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 10 }}>{unreadTotal}</div>
              )}
            </div>
            <LiveClock />
          </div>
          {/* Stats */}
          <div style={{ display: "flex", gap: 8 }}>
            {[["open","#2DA962",openCount],["all","#6c7a8f",sessions.length],["closed","#9e9e9e",sessions.filter(s=>s.status==="closed").length]].map(([f,c,n]) => (
              <button key={f as string} onClick={() => setFilter(f as any)} style={{ flex: 1, background: filter === f ? `${c}22` : "rgba(255,255,255,0.04)", border: `1px solid ${filter===f ? c : "transparent"}`, borderRadius: 8, padding: "4px 0", cursor: "pointer", color: filter===f ? c as string : "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700 }}>
                {String(f).toUpperCase()}<br /><span style={{ fontSize: 15 }}>{String(n)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Session list */}
        <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
          {filteredSessions.length === 0 && (
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", padding: 32, fontSize: 13 }}>No conversations</div>
          )}
          {filteredSessions.map(s => (
            <div key={s.id} onClick={() => setActiveChatId(s.id)}
              style={{
                padding: "12px 14px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.05)",
                background: activeChatId === s.id ? "rgba(45,169,98,0.1)" : s.unreadAdmin > 0 ? "rgba(255,255,255,0.04)" : "transparent",
                borderLeft: activeChatId === s.id ? "3px solid #2DA962" : "3px solid transparent",
                transition: "background 0.15s",
              }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: s.status === "open" ? "rgba(45,169,98,0.25)" : "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: s.status === "open" ? "#2DA962" : "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    {(s.userName || "G").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ color: "#fff", fontSize: 13, fontWeight: s.unreadAdmin > 0 ? 700 : 500 }}>{s.userName || "Guest"}</div>
                    {s.userPhone && <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>{s.userPhone}</div>}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                  <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>{formatRelative(s.lastMessageAt)}</span>
                  {s.unreadAdmin > 0 && <div style={{ background: "#2DA962", color: "#fff", fontSize: 10, fontWeight: 700, width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{s.unreadAdmin}</div>}
                </div>
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingLeft: 34 }}>{s.lastMessage || "No messages yet"}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: conversation */}
      {!activeChatId ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "rgba(255,255,255,0.3)" }}>
          <MessageCircle size={48} style={{ opacity: 0.2 }} />
          <span style={{ fontSize: 14 }}>Select a conversation to reply</span>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Conversation header */}
          <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(45,169,98,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2DA962", fontWeight: 700 }}>
                {(activeSession?.userName || "G").charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{activeSession?.userName || "Guest"}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Circle size={8} fill={activeSession?.status === "open" ? "#2DA962" : "#9e9e9e"} color="transparent" />
                  <span style={{ color: activeSession?.status === "open" ? "#2DA962" : "rgba(255,255,255,0.4)", fontSize: 11 }}>{activeSession?.status === "open" ? "Open" : "Closed"}</span>
                  {activeSession?.userPhone && <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>· {activeSession.userPhone}</span>}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <LiveClock />
              {activeSession?.status === "open" ? (
                <button onClick={() => closeConversation(activeChatId)} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "6px 12px", color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  <XCircle size={14} /> Close
                </button>
              ) : (
                <button onClick={() => reopenConversation(activeChatId)} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(45,169,98,0.12)", border: "1px solid rgba(45,169,98,0.3)", borderRadius: 8, padding: "6px 12px", color: "#2DA962", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  <RefreshCw size={14} /> Reopen
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 4, scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", margin: "auto", fontSize: 13 }}>No messages yet</div>
            )}
            {messages.map(msg => (
              <div key={msg.id} style={{ display: "flex", flexDirection: msg.sender === "admin" ? "row-reverse" : "row", alignItems: "flex-end", gap: 8, marginBottom: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: msg.sender === "admin" ? "rgba(45,169,98,0.25)" : "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: msg.sender === "admin" ? "#2DA962" : "rgba(255,255,255,0.5)", flexShrink: 0 }}>
                  {msg.sender === "admin" ? "A" : (activeSession?.userName || "G").charAt(0).toUpperCase()}
                </div>
                <div style={{ maxWidth: "70%" }}>
                  <div style={{
                    background: msg.sender === "admin" ? "rgba(45,169,98,0.2)" : "rgba(255,255,255,0.08)",
                    borderRadius: msg.sender === "admin" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                    padding: "9px 13px",
                    color: msg.sender === "admin" ? "#c8f5d8" : "rgba(255,255,255,0.85)",
                    fontSize: 13, lineHeight: 1.5,
                  }}>
                    {msg.text}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3, opacity: 0.5, justifyContent: msg.sender === "admin" ? "flex-end" : "flex-start" }}>
                    <Clock size={9} color="rgba(255,255,255,0.5)" />
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>{formatTime(msg.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Reply input */}
          {activeSession?.status === "open" ? (
            <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 10, alignItems: "center" }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendReply()}
                placeholder="Type a reply..."
                style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#fff", outline: "none" }}
              />
              <button onClick={sendReply} disabled={!input.trim() || sending}
                style={{ width: 40, height: 40, borderRadius: "50%", background: input.trim() ? "#2DA962" : "rgba(255,255,255,0.08)", border: "none", cursor: input.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}>
                <Send size={16} color={input.trim() ? "#fff" : "rgba(255,255,255,0.3)"} />
              </button>
            </div>
          ) : (
            <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.07)", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
              Conversation closed. Reopen to reply.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
