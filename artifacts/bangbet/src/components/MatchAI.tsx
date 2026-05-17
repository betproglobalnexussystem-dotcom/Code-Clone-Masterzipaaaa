import { useState, useRef, useEffect } from "react";
import { Bot, Send, Loader2, Sparkles, PlusCircle, CheckCircle2 } from "lucide-react";
import type { Match } from "./MatchCard";
import type { BetSelection } from "../App";

interface Message { role: "user" | "assistant"; content: string; recBets?: RecBet[]; }
interface RecBet { id: string; label: string; odd: number; matchName: string; }
interface MatchAIProps { match: Match; onAddBet: (b: BetSelection) => void; betSelections: BetSelection[]; }

const STARTERS = [
  "Who is likely to win this match?",
  "Analyse the odds and give best bet",
  "Key players and tactics",
  "Head-to-head record & recent form",
  "Over/Under goals prediction",
];

// ── Win probability from odds ──────────────────────────────────────────────
function calcProbs(h: number, d: number, a: number) {
  const rh = h > 1 ? 1 / h : 0, rd = d > 1 ? 1 / d : 0, ra = a > 1 ? 1 / a : 0;
  const tot = rh + rd + ra || 1;
  return { h: (rh / tot) * 100, d: (rd / tot) * 100, a: (ra / tot) * 100 };
}

// ── SVG donut ring ─────────────────────────────────────────────────────────
function DonutRing({ pct, color, size = 74 }: { pct: number; color: string; size?: number }) {
  const r = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 100) / 100);
  const c = size / 2;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="8" />
      <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset} strokeLinecap="round" />
    </svg>
  );
}

function StatCircle({ pct, color, label, odd }: { pct: number; color: string; label: string; odd: number }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <div style={{ position: "relative", width: 74, height: 74 }}>
        <DonutRing pct={pct} color={color} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#fff", fontFamily: "Oswald, sans-serif", lineHeight: 1 }}>{pct.toFixed(0)}%</span>
        </div>
      </div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 700, letterSpacing: 0.3, textAlign: "center", maxWidth: 64, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div>
      <div style={{ fontSize: 14, color: "#fff", fontWeight: 700, fontFamily: "Oswald, sans-serif" }}>{odd > 1 ? odd.toFixed(2) : "—"}</div>
      <div style={{ width: "70%", height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 1s ease" }} />
      </div>
    </div>
  );
}

// ── Recommended bet detection ──────────────────────────────────────────────
function extractRecBets(text: string, match: Match): RecBet[] {
  const lower = text.toLowerCase();
  const results: RecBet[] = [];
  const mn = `${match.homeTeam} vs ${match.awayTeam}`;
  const hs = match.homeTeam.toLowerCase().slice(0, 5);
  const as2 = match.awayTeam.toLowerCase().slice(0, 5);
  const patterns = [
    /recommended bet[s]?:?\s*([^\n•\-–—]{2,60})/gi,
    /best bet[s]?:?\s*([^\n•\-–—]{2,60})/gi,
    /bet on[:\s]+([^\n•\-–—]{2,60})/gi,
    /place (?:your )?bet[s]? (?:on\s)?([^\n•\-–—]{2,60})/gi,
  ];
  for (const pat of patterns) {
    let m: RegExpExecArray | null;
    pat.lastIndex = 0;
    while ((m = pat.exec(lower)) !== null) {
      const rec = m[1].toLowerCase().trim().replace(/[–—-].*/g, "").trim();
      if (!results.find(r => r.id === `${match.id}-1`) && (rec.includes(hs) || rec.includes("home win") || rec === "1"))
        results.push({ id: `${match.id}-1`, label: `${match.homeTeam} Win`, odd: match.odds.home, matchName: mn });
      if (!results.find(r => r.id === `${match.id}-X`) && (rec.includes("draw") || rec === "x"))
        results.push({ id: `${match.id}-X`, label: "Draw", odd: match.odds.draw, matchName: mn });
      if (!results.find(r => r.id === `${match.id}-2`) && (rec.includes(as2) || rec.includes("away win") || rec === "2"))
        results.push({ id: `${match.id}-2`, label: `${match.awayTeam} Win`, odd: match.odds.away, matchName: mn });
    }
  }
  return results;
}

// ── Inline bold / italic ───────────────────────────────────────────────────
function parseBold(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i}>{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>
  );
}

// ── Stat bar: detect "Label: XX%" or "XX% Label" lines ───────────────────
function StatBar({ line }: { line: string }) {
  const m = line.match(/(\d{1,3}(?:\.\d+)?)%/);
  const pct = m ? Math.min(parseFloat(m[1]), 100) : 0;
  const label = line.replace(/\*\*/g, "").replace(/^[-•›]\s*/, "").trim();
  const color = pct >= 60 ? "#2DA962" : pct >= 40 ? "#ffb300" : "#f44336";
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
        <span style={{ fontWeight: 600, color: "#333" }}>{parseBold(label)}</span>
        <span style={{ fontWeight: 800, color, fontFamily: "Oswald, sans-serif", fontSize: 13 }}>{pct.toFixed(1)}%</span>
      </div>
      <div style={{ height: 7, background: "#e8f5e9", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 1s ease" }} />
      </div>
    </div>
  );
}

// ── Markdown table ─────────────────────────────────────────────────────────
function MarkdownTable({ lines }: { lines: string[] }) {
  const rows = lines
    .filter(l => !/^\|[\s\-:|]+\|/.test(l.trim()))
    .map(l => l.split("|").map(c => c.trim()).filter(Boolean));
  if (!rows.length) return null;
  const [headers, ...body] = rows;
  return (
    <div style={{ overflowX: "auto", margin: "10px 0", borderRadius: 10, border: "1px solid #e0f0e8", overflow: "hidden" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 11.5 }}>
        <thead>
          <tr style={{ background: "#1a6e3d" }}>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: "7px 10px", textAlign: "left", color: "#fff", fontWeight: 700, fontSize: 11, letterSpacing: 0.3 }}>
                {parseBold(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f4faf4" }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: "6px 10px", borderBottom: "1px solid #e8f5e9", verticalAlign: "top" }}>
                  {parseBold(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Rich text renderer ─────────────────────────────────────────────────────
function RichText({ text }: { text: string }) {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // Table group
    if (line.trimStart().startsWith("|")) {
      const tbl: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith("|")) { tbl.push(lines[i]); i++; }
      nodes.push(<MarkdownTable key={`t${i}`} lines={tbl} />);
      continue;
    }
    if (!line.trim()) { nodes.push(<div key={i} style={{ height: 6 }} />); i++; continue; }
    // Section header (## or numbered bold "1. **Title**")
    if (/^#{1,4}\s/.test(line)) {
      nodes.push(<div key={i} style={{ fontWeight: 700, color: "#1a6e3d", fontSize: 12, marginTop: 14, marginBottom: 6, fontFamily: "Oswald, sans-serif", letterSpacing: 0.5, textTransform: "uppercase", borderBottom: "2px solid #e0f0e8", paddingBottom: 5 }}>{line.replace(/^#+\s/, "")}</div>);
      i++; continue;
    }
    if (/^\d+\.\s+\*\*/.test(line)) {
      nodes.push(<div key={i} style={{ fontWeight: 700, color: "#1a6e3d", fontSize: 12, marginTop: 14, marginBottom: 6, fontFamily: "Oswald, sans-serif", letterSpacing: 0.4, borderBottom: "2px solid #e0f0e8", paddingBottom: 5 }}>{line.replace(/\*\*/g, "").replace(/^\d+\.\s+/, (m) => m)}</div>);
      i++; continue;
    }
    // Lines with percentage → stat bar
    if (/\d{1,3}(\.\d+)?%/.test(line) && (line.includes(":") || /^[-•]\s/.test(line))) {
      nodes.push(<StatBar key={i} line={line} />);
      i++; continue;
    }
    // Bullet
    if (/^[-•*›]\s/.test(line)) {
      nodes.push(
        <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start", marginBottom: 5 }}>
          <span style={{ color: "#2DA962", fontWeight: 900, flexShrink: 0, fontSize: 16, lineHeight: "16px", marginTop: 2 }}>›</span>
          <span style={{ fontSize: 12.5, lineHeight: 1.65 }}>{parseBold(line.replace(/^[-•*›]\s/, ""))}</span>
        </div>
      );
      i++; continue;
    }
    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      nodes.push(<div key={i} style={{ borderTop: "1px solid #e0f0e8", margin: "10px 0" }} />);
      i++; continue;
    }
    nodes.push(<div key={i} style={{ marginBottom: 4, fontSize: 12.5, lineHeight: 1.65 }}>{parseBold(line)}</div>);
    i++;
  }
  return <div style={{ wordBreak: "break-word" }}>{nodes}</div>;
}

// ── Main component ─────────────────────────────────────────────────────────
export default function MatchAI({ match, onAddBet, betSelections }: MatchAIProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const probs = calcProbs(match.odds.home, match.odds.draw, match.odds.away);

  const systemPrompt = `You are BangBet AI — an expert football analyst, statistician and betting advisor.

MATCH: ${match.homeTeam} vs ${match.awayTeam}
COMPETITION: ${match.league}
KICK-OFF: ${match.time}
ODDS → Home: ${match.odds.home.toFixed(2)} | Draw: ${match.odds.draw.toFixed(2)} | Away: ${match.odds.away.toFixed(2)}
IMPLIED WIN PROBABILITY → Home: ${probs.h.toFixed(1)}% | Draw: ${probs.d.toFixed(1)}% | Away: ${probs.a.toFixed(1)}%${match.overUnder ? `\nO/U LINE: ${match.overUnder}` : ""}

RESPONSE FORMAT RULES:
1. Use numbered sections like "1. **Section Name**" for main topics
2. Use **bold** for key numbers, player names, important stats
3. Use - bullet points for supporting details
4. For any statistic or probability → format as "- Label: XX%" so it renders as a visual bar
5. Use markdown tables (| Col | Col |) for H2H records, form tables, player stats
6. End EVERY analytical response with a dedicated line: "Recommended Bet: [exact bet description]"
7. Be analytical, data-driven, and reference actual odds in every response
8. Build on the FULL conversation history — remember all previous messages`;

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    setError(null);
    const msgs = [...messages, { role: "user" as const, content: text }];
    setMessages(msgs);
    setInput("");
    setLoading(true);
    try {
      const r = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "openai", system: systemPrompt, messages: msgs.map(m => ({ role: m.role, content: m.content })), private: true }),
      });
      if (!r.ok) throw new Error(`${r.status}`);
      const content = (await r.text()).trim() || "Sorry, try again.";
      setMessages(p => [...p, { role: "assistant", content, recBets: extractRecBets(content, match) }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "error";
      setError(msg);
      setMessages(p => [...p, { role: "assistant", content: "Having trouble connecting. Please try again.", recBets: [] }]);
    } finally { setLoading(false); }
  };

  const isAdded = (id: string) => betSelections.some(b => b.id === id);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* ── Header with visual stats ── */}
      <div style={{ background: "linear-gradient(150deg, #0f4d2b 0%, #1a6e3d 50%, #2DA962 100%)", padding: "14px 16px 16px" }}>
        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 34, height: 34, background: "rgba(255,255,255,0.18)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Bot size={18} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Oswald, sans-serif", letterSpacing: 0.4 }}>AI MATCH ANALYST</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 1 }}>{match.homeTeam} vs {match.awayTeam} · {match.time}</div>
          </div>
          <Sparkles size={14} color="rgba(255,255,255,0.4)" />
        </div>

        {/* Donut circles */}
        <div style={{ background: "rgba(0,0,0,0.22)", borderRadius: 14, padding: "14px 10px" }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 700, letterSpacing: 0.6, textAlign: "center", marginBottom: 12 }}>WIN PROBABILITY ANALYSIS</div>
          <div style={{ display: "flex", gap: 6 }}>
            <StatCircle pct={probs.h} color="#ffe60f" label={match.homeTeam} odd={match.odds.home} />
            <StatCircle pct={probs.d} color="rgba(255,255,255,0.7)" label="Draw" odd={match.odds.draw} />
            <StatCircle pct={probs.a} color="#ff6d00" label={match.awayTeam} odd={match.odds.away} />
          </div>
          {/* Probability comparison bar */}
          <div style={{ marginTop: 12, height: 10, borderRadius: 5, overflow: "hidden", display: "flex", background: "rgba(255,255,255,0.1)" }}>
            <div style={{ width: `${probs.h}%`, background: "#ffe60f", transition: "width 1s ease" }} />
            <div style={{ width: `${probs.d}%`, background: "rgba(255,255,255,0.55)", transition: "width 1s ease" }} />
            <div style={{ width: `${probs.a}%`, background: "#ff6d00", transition: "width 1s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 9.5, color: "rgba(255,255,255,0.45)" }}>
            <span style={{ color: "#ffe60f" }}>HOME {probs.h.toFixed(0)}%</span>
            <span>DRAW {probs.d.toFixed(0)}%</span>
            <span style={{ color: "#ff6d00" }}>AWAY {probs.a.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* ── Chat ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10, background: "#f4f6f4", minHeight: 200, maxHeight: 460 }}>
        {messages.length === 0 && (
          <div>
            <div style={{ fontSize: 11.5, color: "#999", textAlign: "center", marginBottom: 12, fontWeight: 500 }}>Ask me anything about this match</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {STARTERS.map(q => (
                <button key={q} onClick={() => send(q)} style={{ background: "#fff", border: "1px solid #dde8dd", borderRadius: 10, padding: "10px 13px", fontSize: 12, color: "#222", cursor: "pointer", textAlign: "left", fontWeight: 500 }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx}>
            {msg.role === "user" ? (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ maxWidth: "78%", background: "var(--green)", color: "#fff", borderRadius: "14px 14px 4px 14px", padding: "10px 13px", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
                  <span style={{ fontSize: 12.5, lineHeight: 1.55 }}>{msg.content}</span>
                </div>
              </div>
            ) : (
              <div style={{ width: "100%", background: "#fff", borderRadius: 14, padding: "13px 14px", boxShadow: "0 1px 5px rgba(0,0,0,0.06)", border: "1px solid #e8ede8" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #e8f5e8" }}>
                  <div style={{ width: 24, height: 24, background: "var(--green)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Bot size={13} color="#fff" />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#1a6e3d", fontFamily: "Oswald, sans-serif", letterSpacing: 0.3 }}>BANGBET AI ANALYSIS</span>
                </div>
                <RichText text={msg.content} />
                {msg.recBets && msg.recBets.length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: "2px solid #e0f0e8" }}>
                    <div style={{ fontSize: 10, color: "#1a6e3d", fontWeight: 700, letterSpacing: 0.5, marginBottom: 8 }}>RECOMMENDED BETS</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {msg.recBets.map(bet => {
                        const added = isAdded(bet.id);
                        return (
                          <button key={bet.id} onClick={() => onAddBet({ id: bet.id, match: bet.matchName, pick: bet.label, odd: bet.odd })}
                            style={{ display: "flex", alignItems: "center", gap: 9, background: added ? "#e8f5e9" : "var(--green)", color: added ? "#1a6e3d" : "#fff", border: added ? "1.5px solid #a5d6a7" : "none", borderRadius: 11, padding: "9px 14px", cursor: "pointer", width: "100%" }}>
                            {added ? <CheckCircle2 size={16} /> : <PlusCircle size={16} />}
                            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, textAlign: "left" }}>{bet.label}</span>
                            <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "Oswald, sans-serif" }}>{bet.odd.toFixed(2)}</span>
                            <span style={{ fontSize: 10, opacity: 0.8 }}>{added ? "Added ✓" : "Add Bet"}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ width: "100%", background: "#fff", borderRadius: 14, padding: "13px 14px", boxShadow: "0 1px 5px rgba(0,0,0,0.06)", border: "1px solid #e8ede8", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 24, height: 24, background: "var(--green)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Bot size={13} color="#fff" />
            </div>
            <Loader2 size={14} style={{ animation: "spin 1s linear infinite", color: "var(--green)" }} />
            <span style={{ fontSize: 12, color: "#888" }}>Analysing match data...</span>
          </div>
        )}
        {error && <div style={{ background: "#fff3f3", border: "1px solid #ffcdd2", borderRadius: 10, padding: "8px 12px", fontSize: 11, color: "#c62828" }}>{error}</div>}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <form onSubmit={e => { e.preventDefault(); send(input); }}
        style={{ padding: "10px 12px", background: "#fff", borderTop: "1px solid #e8ede8", display: "flex", gap: 8, alignItems: "center" }}>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about this match..." disabled={loading}
          style={{ flex: 1, background: "#f4f6f4", border: "1px solid #dde8dd", borderRadius: 20, padding: "9px 14px", fontSize: 13, color: "#222", outline: "none", fontFamily: "inherit" }} />
        <button type="submit" disabled={!input.trim() || loading}
          style={{ width: 38, height: 38, background: !input.trim() || loading ? "#ddd" : "var(--green)", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: !input.trim() || loading ? "default" : "pointer", flexShrink: 0 }}>
          <Send size={16} color="#fff" />
        </button>
      </form>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
