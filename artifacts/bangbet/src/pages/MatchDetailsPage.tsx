import { useState, useEffect } from "react";
import {
  ArrowLeft, BarChart2, Clock, Globe, Zap, Loader2,
  ChevronDown, Bot, Activity, TrendingUp, Shield, Target
} from "lucide-react";
import type { Match } from "../components/MatchCard";
import type { BetSelection } from "../App";
import { api, formatKickOff, getLeagueFlagUrl, type ApiMatchDetails } from "../lib/api";
import { parseBetMap, GROUPS_ORDER, type ParsedMarket, type ParsedSelection } from "../lib/betTypes";
import MatchAI from "../components/MatchAI";

interface MatchDetailsPageProps {
  match: Match;
  onBack: () => void;
  onAddBet: (bet: BetSelection) => void;
  betSelections: BetSelection[];
}

type ActiveTab = "markets" | "stats" | "ai";

function LeagueFlag({ leagueName }: { leagueName: string }) {
  const url = getLeagueFlagUrl(leagueName);
  if (url) {
    return (
      <img src={url} alt="" style={{ width: 14, height: 10, objectFit: "cover", borderRadius: 2, flexShrink: 0 }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
    );
  }
  return <Globe size={11} style={{ opacity: 0.6 }} />;
}

function OddButton({ sel, isSelected, onClick }: { sel: ParsedSelection; isSelected: boolean; onClick: () => void }) {
  const locked = sel.status === "L" || sel.odds <= 1;
  return (
    <button onClick={onClick} disabled={locked} style={{
      flex: 1, minWidth: 0,
      background: isSelected ? "var(--green)" : "var(--green-light)",
      border: `1px solid ${isSelected ? "var(--green)" : "var(--border)"}`,
      borderRadius: 10, padding: "8px 4px",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
      cursor: locked ? "default" : "pointer", transition: "all 0.15s",
      opacity: locked ? 0.45 : 1,
    }}>
      <span style={{ fontSize: 10, color: isSelected ? "rgba(255,255,255,0.85)" : "var(--text-muted)", fontWeight: 500, textAlign: "center", lineHeight: 1.3, padding: "0 2px", wordBreak: "break-word" }}>
        {sel.label || sel.sv || String(sel.tt)}
      </span>
      <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? "#fff" : "var(--dark)", fontFamily: "Oswald, sans-serif" }}>
        {locked ? "-" : sel.odds.toFixed(2)}
      </span>
    </button>
  );
}

function MarketRow({ market, matchId, homeTeam, awayTeam, betSelections, onAddBet }: {
  market: ParsedMarket; matchId: string; homeTeam: string; awayTeam: string;
  betSelections: BetSelection[]; onAddBet: (bet: BetSelection) => void;
}) {
  const isSelected = (sel: ParsedSelection) => betSelections.some((b) => b.id === `${matchId}-${sel.tt}-${sel.sv}`);
  const handleClick = (sel: ParsedSelection) => {
    if (sel.status === "L" || sel.odds <= 1) return;
    onAddBet({ id: `${matchId}-${sel.tt}-${sel.sv}`, match: `${homeTeam} vs ${awayTeam}`, pick: `${market.name}: ${sel.label || sel.sv}`, odd: sel.odds });
  };
  const chunks: ParsedSelection[][] = [];
  const chunkSize = market.selections.length > 4 ? 3 : market.selections.length;
  for (let i = 0; i < market.selections.length; i += chunkSize) chunks.push(market.selections.slice(i, i + chunkSize));

  return (
    <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border2)" }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, fontWeight: 600, letterSpacing: 0.3 }}>{market.name}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {chunks.map((chunk, ci) => (
          <div key={ci} style={{ display: "flex", gap: 5 }}>
            {chunk.map((sel) => (
              <OddButton key={`${sel.tt}-${sel.sv}`} sel={sel} isSelected={isSelected(sel)} onClick={() => handleClick(sel)} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function MarketGroup({ groupName, markets, matchId, homeTeam, awayTeam, betSelections, onAddBet, defaultOpen }: {
  groupName: string; markets: ParsedMarket[]; matchId: string; homeTeam: string; awayTeam: string;
  betSelections: BetSelection[]; onAddBet: (bet: BetSelection) => void; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  if (markets.length === 0) return null;
  return (
    <div style={{ marginBottom: 4, background: "#fff" }}>
      <div onClick={() => setOpen((v) => !v)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", cursor: "pointer", borderBottom: open ? "1px solid var(--border)" : "none", userSelect: "none" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--dark)", fontFamily: "Oswald, sans-serif", letterSpacing: 0.2 }}>{groupName}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{markets.length} markets</span>
          <ChevronDown size={16} style={{ color: "var(--text-muted)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </div>
      </div>
      {open && markets.map((market) => (
        <MarketRow key={`${market.bc}-${market.name}`} market={market} matchId={matchId} homeTeam={homeTeam} awayTeam={awayTeam} betSelections={betSelections} onAddBet={onAddBet} />
      ))}
    </div>
  );
}

function ProbBar({ team, value, color }: { team: string; value: number; color: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
        <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>{team}</span>
        <span style={{ color: "#fff", fontWeight: 700, fontFamily: "Oswald, sans-serif" }}>{value.toFixed(1)}%</span>
      </div>
      <div style={{ height: 8, background: "rgba(255,255,255,0.15)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 4, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

function StatsTab({ match, details, detailsLoading }: { match: Match; details: ApiMatchDetails | null; detailsLoading: boolean }) {
  const h = match.odds.home > 1 ? 1 / match.odds.home : 0;
  const d = match.odds.draw > 1 ? 1 / match.odds.draw : 0;
  const a = match.odds.away > 1 ? 1 / match.odds.away : 0;
  const total = h + d + a || 1;
  const homeProb = (h / total) * 100;
  const drawProb = (d / total) * 100;
  const awayProb = (a / total) * 100;

  const parsedMarkets = details ? parseBetMap(details.betMap) : [];
  const totalMarkets = parsedMarkets.length;

  const ouMarket = parsedMarkets.find((m) => m.name.includes("Over/Under 2.5") || m.name === "Total Goals");
  const bttsMarket = parsedMarkets.find((m) => m.name.includes("Both Teams") || m.name.includes("BTTS"));
  const dcMarket = parsedMarkets.find((m) => m.name.includes("Double Chance"));
  const ouOver = ouMarket?.selections.find((s) => s.label?.includes("Over") || s.sv?.includes("Over"));
  const ouUnder = ouMarket?.selections.find((s) => s.label?.includes("Under") || s.sv?.includes("Under"));
  const bttsYes = bttsMarket?.selections.find((s) => s.label === "Yes" || s.sv === "Yes");
  const bttsNo = bttsMarket?.selections.find((s) => s.label === "No" || s.sv === "No");
  const dc12 = dcMarket?.selections.find((s) => s.sv === "12" || s.label === "1 or 2");
  const dc1x = dcMarket?.selections.find((s) => s.sv === "1X" || s.label === "1 or X");
  const dcx2 = dcMarket?.selections.find((s) => s.sv === "X2" || s.label === "X or 2");

  return (
    <div style={{ background: "var(--bg-light)", paddingBottom: 16 }}>
      {/* Win Probability */}
      <div style={{ margin: "12px 12px 0", background: "linear-gradient(135deg, #1a6e3d, #2DA962)", borderRadius: 14, padding: "16px 16px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
          <Activity size={14} color="rgba(255,255,255,0.8)" />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: "Oswald, sans-serif", letterSpacing: 0.4 }}>WIN PROBABILITY</span>
        </div>
        <ProbBar team={match.homeTeam} value={homeProb} color="#ffe60f" />
        <ProbBar team="Draw" value={drawProb} color="rgba(255,255,255,0.5)" />
        <ProbBar team={match.awayTeam} value={awayProb} color="#ff6d00" />
        <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
          Based on current market odds
        </div>
      </div>

      {/* 1X2 Odds */}
      <div style={{ margin: "10px 12px 0", background: "#fff", borderRadius: 14, padding: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <TrendingUp size={14} style={{ color: "var(--green)" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--dark)", fontFamily: "Oswald, sans-serif", letterSpacing: 0.4 }}>MATCH ODDS (1X2)</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { label: "HOME WIN", val: match.odds.home, key: "1" },
            { label: "DRAW", val: match.odds.draw, key: "X" },
            { label: "AWAY WIN", val: match.odds.away, key: "2" },
          ].map(({ label, val, key }) => (
            <div key={key} style={{ flex: 1, background: "var(--green-light)", borderRadius: 10, padding: "10px 6px", textAlign: "center", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 700, letterSpacing: 0.3, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--dark)", fontFamily: "Oswald, sans-serif" }}>{val > 1 ? val.toFixed(2) : "-"}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{key}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Loading more stats */}
      {detailsLoading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 16 }}>
          <Loader2 size={15} style={{ animation: "spin 1s linear infinite", color: "var(--green)" }} />
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Loading more stats...</span>
        </div>
      )}

      {/* Over/Under */}
      {!detailsLoading && (ouOver || ouUnder) && (
        <div style={{ margin: "10px 12px 0", background: "#fff", borderRadius: 14, padding: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <Target size={14} style={{ color: "var(--green)" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--dark)", fontFamily: "Oswald, sans-serif", letterSpacing: 0.4 }}>OVER / UNDER 2.5</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {ouOver && (
              <div style={{ flex: 1, background: "var(--green-light)", borderRadius: 10, padding: "10px 6px", textAlign: "center", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 700, marginBottom: 4 }}>OVER</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--dark)", fontFamily: "Oswald, sans-serif" }}>{ouOver.odds.toFixed(2)}</div>
              </div>
            )}
            {ouUnder && (
              <div style={{ flex: 1, background: "var(--green-light)", borderRadius: 10, padding: "10px 6px", textAlign: "center", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 700, marginBottom: 4 }}>UNDER</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--dark)", fontFamily: "Oswald, sans-serif" }}>{ouUnder.odds.toFixed(2)}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BTTS */}
      {!detailsLoading && (bttsYes || bttsNo) && (
        <div style={{ margin: "10px 12px 0", background: "#fff", borderRadius: 14, padding: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <Shield size={14} style={{ color: "var(--green)" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--dark)", fontFamily: "Oswald, sans-serif", letterSpacing: 0.4 }}>BOTH TEAMS TO SCORE</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {bttsYes && (
              <div style={{ flex: 1, background: "var(--green-light)", borderRadius: 10, padding: "10px 6px", textAlign: "center", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 700, marginBottom: 4 }}>YES</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--dark)", fontFamily: "Oswald, sans-serif" }}>{bttsYes.odds.toFixed(2)}</div>
              </div>
            )}
            {bttsNo && (
              <div style={{ flex: 1, background: "var(--green-light)", borderRadius: 10, padding: "10px 6px", textAlign: "center", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 700, marginBottom: 4 }}>NO</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--dark)", fontFamily: "Oswald, sans-serif" }}>{bttsNo.odds.toFixed(2)}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Double Chance */}
      {!detailsLoading && (dc1x || dc12 || dcx2) && (
        <div style={{ margin: "10px 12px 0", background: "#fff", borderRadius: 14, padding: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <BarChart2 size={14} style={{ color: "var(--green)" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--dark)", fontFamily: "Oswald, sans-serif", letterSpacing: 0.4 }}>DOUBLE CHANCE</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[dc1x, dc12, dcx2].filter(Boolean).map((sel, i) => sel && (
              <div key={i} style={{ flex: 1, background: "var(--green-light)", borderRadius: 10, padding: "10px 6px", textAlign: "center", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 700, marginBottom: 4 }}>{sel.label || sel.sv}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--dark)", fontFamily: "Oswald, sans-serif" }}>{sel.odds.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Markets summary */}
      {totalMarkets > 0 && (
        <div style={{ margin: "10px 12px 0", background: "#fff", borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, background: "var(--green-light)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <BarChart2 size={18} style={{ color: "var(--green)" }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--dark)" }}>{totalMarkets} Markets Available</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>Tap "Markets" tab to bet on all outcomes</div>
          </div>
        </div>
      )}

      {/* Kick-off info */}
      <div style={{ margin: "10px 12px 0", background: "#fff", borderRadius: 14, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Kick-off</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--dark)", fontFamily: "Oswald, sans-serif" }}>
          {match.kickOffTime ? formatKickOff(match.kickOffTime) : match.time}
        </span>
      </div>
    </div>
  );
}

export default function MatchDetailsPage({ match, onBack, onAddBet, betSelections }: MatchDetailsPageProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("markets");
  const [details, setDetails] = useState<ApiMatchDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const mainOdds = match.odds;
  const isSelected = (key: string) => betSelections.some((b) => b.id === `${match.id}-${key}`);

  useEffect(() => {
    if (!match.apiId) return;
    setLoading(true);
    api.matchDetails(match.apiId)
      .then(setDetails)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [match.apiId]);

  const handleMainOdd = (label: string, odd: number, key: string) => {
    if (odd <= 1) return;
    onAddBet({ id: `${match.id}-${key}`, match: `${match.homeTeam} vs ${match.awayTeam}`, pick: label, odd });
  };

  const parsedMarkets = details ? parseBetMap(details.betMap) : [];
  const grouped = new Map<string, ParsedMarket[]>();
  GROUPS_ORDER.forEach((g) => grouped.set(g, []));
  parsedMarkets.forEach((m) => {
    if (!grouped.has(m.group)) grouped.set(m.group, []);
    grouped.get(m.group)!.push(m);
  });
  const totalMarkets = parsedMarkets.length;

  const TABS: { key: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { key: "markets", label: totalMarkets > 0 ? `Markets (${totalMarkets})` : "Markets", icon: <Zap size={12} /> },
    { key: "stats", label: "Statistics", icon: <BarChart2 size={12} /> },
    { key: "ai", label: "AI Chat", icon: <Bot size={12} /> },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-light)", paddingBottom: 72 }}>
      <div style={{ background: "linear-gradient(160deg, #1a6e3d 0%, #2DA962 100%)", paddingTop: 54, position: "sticky", top: 54, zIndex: 80 }}>
        <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", gap: 10 }}>
          <div onClick={onBack} style={{ width: 32, height: 32, background: "rgba(255,255,255,0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <ArrowLeft size={18} color="#fff" />
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(255,255,255,0.7)", overflow: "hidden" }}>
            <LeagueFlag leagueName={match.league} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{match.league}</span>
          </div>
          {match.isLive && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#e53935", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 10, fontFamily: "Oswald, sans-serif", flexShrink: 0 }}>
              <span style={{ width: 5, height: 5, background: "#fff", borderRadius: "50%", animation: "blink 1s infinite", display: "inline-block" }} />
              LIVE
            </div>
          )}
        </div>

        <div style={{ padding: "4px 16px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ width: 44, height: 44, background: "rgba(255,255,255,0.15)", borderRadius: 12, margin: "0 auto 6px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.2)" }}>
              <span style={{ fontSize: 20, color: "#fff", fontWeight: 700, fontFamily: "Oswald, sans-serif" }}>H</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Oswald, sans-serif", letterSpacing: "0.3px", lineHeight: 1.2 }}>{match.homeTeam}</div>
          </div>
          <div style={{ textAlign: "center", flexShrink: 0, padding: "0 12px" }}>
            {match.isLive ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 11, color: "rgba(255,255,255,0.65)" }}>
                <Clock size={11} /> LIVE
              </div>
            ) : (
              <>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", fontFamily: "Oswald, sans-serif" }}>VS</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 3 }}>
                  {match.kickOffTime ? formatKickOff(match.kickOffTime) : match.time}
                </div>
              </>
            )}
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ width: 44, height: 44, background: "rgba(255,255,255,0.15)", borderRadius: 12, margin: "0 auto 6px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.2)" }}>
              <span style={{ fontSize: 20, color: "#fff", fontWeight: 700, fontFamily: "Oswald, sans-serif" }}>A</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Oswald, sans-serif", letterSpacing: "0.3px", lineHeight: 1.2 }}>{match.awayTeam}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, padding: "12px 14px" }}>
          {[
            { label: "1", pick: `${match.homeTeam} Win`, odd: mainOdds.home, key: "home" },
            { label: "X", pick: "Draw", odd: mainOdds.draw, key: "draw" },
            { label: "2", pick: `${match.awayTeam} Win`, odd: mainOdds.away, key: "away" },
          ].map(({ label, pick, odd, key }) => (
            <button key={key} onClick={() => handleMainOdd(pick, odd, key)} disabled={odd <= 1} style={{
              flex: 1, background: isSelected(key) ? "#ffe60f" : "rgba(255,255,255,0.18)",
              border: isSelected(key) ? "1.5px solid #ffe60f" : "1px solid rgba(255,255,255,0.2)",
              borderRadius: 10, padding: "8px 4px", display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              cursor: odd <= 1 ? "default" : "pointer", transition: "all 0.15s", opacity: odd <= 1 ? 0.5 : 1,
            }}>
              <span style={{ fontSize: 10, color: isSelected(key) ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.7)", fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: isSelected(key) ? "#1a2e1a" : "#fff", fontFamily: "Oswald, sans-serif" }}>
                {odd > 1 ? odd.toFixed(2) : "-"}
              </span>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", background: "rgba(0,0,0,0.18)" }}>
          {TABS.map((tab) => (
            <div key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              padding: "10px 4px", fontSize: 11,
              fontWeight: activeTab === tab.key ? 700 : 500,
              color: activeTab === tab.key ? "#fff" : "rgba(255,255,255,0.5)",
              borderBottom: activeTab === tab.key ? "2px solid #ffe60f" : "2px solid transparent",
              cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
            }}>
              {tab.icon} {tab.label}
            </div>
          ))}
        </div>
      </div>

      {activeTab === "markets" && (
        <div style={{ paddingBottom: 8 }}>
          {loading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 32, gap: 10, color: "var(--text-muted)", background: "#fff" }}>
              <Loader2 size={20} style={{ animation: "spin 1s linear infinite", color: "var(--green)" }} />
              <span style={{ fontSize: 13 }}>Loading all markets...</span>
            </div>
          )}
          {!loading && parsedMarkets.length > 0 && (
            <>
              {GROUPS_ORDER.map((groupName) => {
                const markets = grouped.get(groupName) ?? [];
                return (
                  <MarketGroup key={groupName} groupName={groupName} markets={markets} matchId={match.id}
                    homeTeam={match.homeTeam} awayTeam={match.awayTeam}
                    betSelections={betSelections} onAddBet={onAddBet}
                    defaultOpen={groupName === "Main Markets"} />
                );
              })}
            </>
          )}
          {!loading && parsedMarkets.length === 0 && (
            <div style={{ background: "#fff", padding: "32px 14px", textAlign: "center", color: "var(--text-muted)" }}>
              <BarChart2 size={28} style={{ marginBottom: 10, opacity: 0.3 }} />
              <div style={{ fontSize: 13 }}>No markets available at this time.</div>
            </div>
          )}
        </div>
      )}

      {activeTab === "stats" && (
        <StatsTab match={match} details={details} detailsLoading={loading} />
      )}

      {activeTab === "ai" && (
        <div style={{ background: "#fff" }}>
          <MatchAI match={match} onAddBet={onAddBet} betSelections={betSelections} />
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}
