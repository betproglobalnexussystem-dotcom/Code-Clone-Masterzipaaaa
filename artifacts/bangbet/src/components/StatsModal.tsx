import { useState, useEffect } from "react";
import { X, BarChart2, Loader2, TrendingUp, Shield, Activity } from "lucide-react";
import type { Match } from "./MatchCard";
import { formatKickOff, api, type ApiMatchDetails } from "../lib/api";
import { parseBetMap } from "../lib/betTypes";

interface StatsModalProps {
  match: Match;
  onClose: () => void;
}

function ProbBar({ label, value, color, team }: { label: string; value: number; color: string; team: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 4, fontWeight: 600 }}>
        <span>{team}</span>
        <span style={{ color, fontWeight: 700 }}>{value.toFixed(1)}%</span>
      </div>
      <div style={{ height: 7, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 4, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

function OddCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div style={{
      flex: 1, background: "var(--green-light)", borderRadius: 10, padding: "10px 8px",
      textAlign: "center", border: "1px solid var(--border)",
    }}>
      <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: "var(--dark)", fontFamily: "Oswald, sans-serif" }}>
        {value > 1 ? value.toFixed(2) : "-"}
      </div>
      {sub && <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function StatsModal({ match, onClose }: StatsModalProps) {
  const kickOffDisplay = match.kickOffTime ? formatKickOff(match.kickOffTime) : match.time;
  const [details, setDetails] = useState<ApiMatchDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!match.apiId) return;
    setLoading(true);
    api.matchDetails(match.apiId)
      .then(setDetails)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [match.apiId]);

  // Calculate win probabilities from odds
  const h = match.odds.home > 1 ? 1 / match.odds.home : 0;
  const d = match.odds.draw > 1 ? 1 / match.odds.draw : 0;
  const a = match.odds.away > 1 ? 1 / match.odds.away : 0;
  const total = h + d + a || 1;
  const homeProb = (h / total) * 100;
  const drawProb = (d / total) * 100;
  const awayProb = (a / total) * 100;

  // Get over/under and BTTS from details
  const parsedMarkets = details ? parseBetMap(details.betMap) : [];
  const ouMarket = parsedMarkets.find((m) => m.name.includes("Over/Under 2.5") || m.name === "Total Goals");
  const bttsMarket = parsedMarkets.find((m) => m.name.includes("Both Teams") || m.name.includes("BTTS"));
  const ouOver = ouMarket?.selections.find((s) => s.label?.includes("Over") || s.sv?.includes("Over"));
  const ouUnder = ouMarket?.selections.find((s) => s.label?.includes("Under") || s.sv?.includes("Under"));
  const bttsYes = bttsMarket?.selections.find((s) => s.label === "Yes" || s.sv === "Yes");
  const bttsNo = bttsMarket?.selections.find((s) => s.label === "No" || s.sv === "No");
  const totalMarkets = parsedMarkets.length;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}
      onClick={onClose}
    >
      <div
        style={{ width: "100%", maxWidth: 480, background: "#fff", borderRadius: "18px 18px 0 0", overflow: "hidden", maxHeight: "88vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "linear-gradient(135deg, #1a6e3d, #2DA962)", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "Oswald, sans-serif" }}>
              {match.homeTeam} vs {match.awayTeam}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
              {match.league} · {kickOffDisplay}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={16} color="#fff" />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {/* Win Probability */}
          <div style={{ padding: "16px 16px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
              <Activity size={15} style={{ color: "var(--green)" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--dark)", fontFamily: "Oswald, sans-serif" }}>WIN PROBABILITY</span>
            </div>
            <ProbBar label="Home" value={homeProb} color="#2DA962" team={match.homeTeam} />
            <ProbBar label="Draw" value={drawProb} color="#f59e0b" team="Draw" />
            <ProbBar label="Away" value={awayProb} color="#e53935" team={match.awayTeam} />
          </div>

          <div style={{ height: 1, background: "var(--border2)", margin: "0 16px" }} />

          {/* 1X2 Odds */}
          <div style={{ padding: "14px 16px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
              <TrendingUp size={15} style={{ color: "var(--green)" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--dark)", fontFamily: "Oswald, sans-serif" }}>MATCH ODDS (1X2)</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <OddCard label="HOME WIN" value={match.odds.home} sub="1" />
              <OddCard label="DRAW" value={match.odds.draw} sub="X" />
              <OddCard label="AWAY WIN" value={match.odds.away} sub="2" />
            </div>
          </div>

          {/* Over/Under & BTTS */}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 16 }}>
              <Loader2 size={15} style={{ animation: "spin 1s linear infinite", color: "var(--green)" }} />
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Loading more stats...</span>
            </div>
          )}

          {!loading && details && (ouMarket || bttsMarket) && (
            <>
              <div style={{ height: 1, background: "var(--border2)", margin: "0 16px" }} />
              <div style={{ padding: "14px 16px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                  <BarChart2 size={15} style={{ color: "var(--green)" }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--dark)", fontFamily: "Oswald, sans-serif" }}>MORE MARKETS</span>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {ouOver && <OddCard label="OVER 2.5" value={ouOver.odds} />}
                  {ouUnder && <OddCard label="UNDER 2.5" value={ouUnder.odds} />}
                  {bttsYes && <OddCard label="BTTS YES" value={bttsYes.odds} />}
                  {bttsNo && <OddCard label="BTTS NO" value={bttsNo.odds} />}
                </div>
              </div>
            </>
          )}

          {/* Markets count */}
          {!loading && totalMarkets > 0 && (
            <>
              <div style={{ height: 1, background: "var(--border2)", margin: "0 16px" }} />
              <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                <Shield size={14} style={{ color: "var(--green)" }} />
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  <strong style={{ color: "var(--dark)" }}>{totalMarkets}</strong> betting markets available for this match
                </span>
              </div>
            </>
          )}

          {/* Match kickoff info */}
          <div style={{ padding: "10px 16px 20px" }}>
            <div style={{ background: "var(--bg-light)", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Kick-off</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--dark)", fontFamily: "Oswald, sans-serif" }}>{kickOffDisplay}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
