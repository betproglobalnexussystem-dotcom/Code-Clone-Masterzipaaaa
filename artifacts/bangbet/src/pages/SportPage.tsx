import { useState, useEffect } from "react";
import { Globe, Shield, Search, Loader2, Zap } from "lucide-react";
import type { BetSelection } from "../App";
import MatchRow from "../components/MatchRow";
import MatchCard, { type Match } from "../components/MatchCard";
import { api, getOdds1X2, getDoubleChance, getBoostedOdds, formatKickOff, getLeagueFlagUrl, type ApiMatch, SPORTS } from "../lib/api";
import StatsModal from "../components/StatsModal";

const _sportCache: Record<string, { matches: Match[]; leagues: string[]; ready: boolean }> = {};

interface SportPageProps {
  onAddBet: (bet: BetSelection) => void;
  betSelections: BetSelection[];
  onMatchClick: (match: Match) => void;
  isLive?: boolean;
}

const SPORT_ICON_URLS: Record<string, string> = {
  S: "https://www.svgrepo.com/show/404149/soccer-ball.svg",
  B: "https://www.svgrepo.com/show/480502/basketball-6.svg",
  T: "https://www.svgrepo.com/show/512962/tenis-786.svg",
  RL: "https://www.svgrepo.com/show/480498/rugby-4.svg",
  MM: "https://www.svgrepo.com/show/480387/headgear-for-combat-sports-such-as-boxing.svg",
  BB: "https://www.svgrepo.com/show/480565/baseball-ball-1.svg",
  V: "https://www.svgrepo.com/show/480340/volleyball-2.svg",
};

function SportIcon({ code, size = 18, active = false }: { code: string; size?: number; active?: boolean }) {
  const url = SPORT_ICON_URLS[code];
  if (url) {
    return (
      <img src={url} alt="" width={size} height={size}
        style={{ objectFit: "contain", filter: active ? "brightness(0) invert(1)" : "none" }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
    );
  }
  return <Globe size={size} color={active ? "#fff" : "var(--text-muted)"} />;
}

function LeagueFlag({ leagueName }: { leagueName: string }) {
  const url = getLeagueFlagUrl(leagueName);
  if (url) {
    return (
      <img src={url} alt="" style={{ width: 14, height: 10, objectFit: "cover", borderRadius: 2, flexShrink: 0 }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
    );
  }
  return <Globe size={12} style={{ flexShrink: 0, opacity: 0.5 }} />;
}

function apiBoostedToMatch(m: ApiMatch): Match | null {
  const odds = getBoostedOdds(m.betMap);
  if (!odds) return null;
  return {
    id: `b-${m.id}`, apiId: m.id, brMatchId: m.brMatchId,
    league: m.leagueName, homeTeam: m.home, awayTeam: m.away,
    time: formatKickOff(m.kickOffTime),
    isLive: m.live === true && m.kickOffTime < Date.now(),
    odds, oddsCount: m.oddsCount, kickOffTime: m.kickOffTime,
    isBoosted: true, sport: m.sport,
  };
}

function apiMatchToMatch(m: ApiMatch): Match | null {
  const odds = getOdds1X2(m.betMap);
  if (!odds) {
    const entries = Object.entries(m.betMap)
      .map(([, svMap]) => {
        const pick = Object.values(svMap)[0];
        return pick?.s === "U" && pick.ov > 1 ? pick.ov : null;
      })
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b);
    if (entries.length < 2) return null;
    return {
      id: String(m.id), apiId: m.id, brMatchId: m.brMatchId,
      league: m.leagueName, homeTeam: m.home, awayTeam: m.away,
      time: formatKickOff(m.kickOffTime),
      isLive: m.live === true && m.kickOffTime < Date.now(),
      odds: { home: entries[0] ?? 0, draw: entries[Math.floor(entries.length / 2)] ?? 0, away: entries[entries.length - 1] ?? 0 },
      oddsCount: m.oddsCount, kickOffTime: m.kickOffTime,
      sport: m.sport,
    };
  }
  const dc = getDoubleChance(m.betMap);
  return {
    id: String(m.id), apiId: m.id, brMatchId: m.brMatchId,
    league: m.leagueName, homeTeam: m.home, awayTeam: m.away,
    time: formatKickOff(m.kickOffTime),
    isLive: m.live === true && m.kickOffTime < Date.now(),
    odds, doubleChance: dc ?? undefined,
    oddsCount: m.oddsCount, kickOffTime: m.kickOffTime,
    overUnder: m.params?.overUnder, leagueId: m.leagueId,
    sport: m.sport,
  };
}

function LeagueGroup({
  league, matches, onAddBet, betSelections, onMatchClick, onStatsClick,
}: {
  league: string;
  matches: Match[];
  onAddBet: (bet: BetSelection) => void;
  betSelections: BetSelection[];
  onMatchClick: (match: Match) => void;
  onStatsClick: (match: Match) => void;
}) {
  return (
    <div className="league-group">
      <div className="league-group-header">
        <LeagueFlag leagueName={league} />
        <span className="league-group-name">{league}</span>
        <div className="league-group-col-labels">
          <span className="league-group-col-label">1</span>
          <span className="league-group-col-label">X</span>
          <span className="league-group-col-label">2</span>
        </div>
        {matches[0]?.doubleChance && (
          <div className="league-group-col-labels league-group-dc-labels">
            <span className="league-group-col-label">1X</span>
            <span className="league-group-col-label">X2</span>
            <span className="league-group-col-label">12</span>
          </div>
        )}
        <span className="league-group-col-spacer" />
      </div>
      {matches.map((m) => (
        <MatchRow
          key={m.id}
          match={m}
          onAddBet={onAddBet}
          betSelections={betSelections}
          onMatchClick={onMatchClick}
        />
      ))}
    </div>
  );
}

const SPORT_COLORS = ["#2DA962","#e65100","#1565c0","#6a1b9a","#c62828","#00838f","#37474f","#455a64","#2e7d32"];

export default function SportPage({ onAddBet, betSelections, onMatchClick, isLive }: SportPageProps) {
  const [activeSport, setActiveSport] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [allMatches, setAllMatches] = useState<Match[]>(() => _sportCache["S"]?.matches ?? []);
  const [boostedMatches, setBoostedMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(() => !(_sportCache["S"]?.ready));
  const [statsMatch, setStatsMatch] = useState<Match | null>(null);
  const [activeLeague, setActiveLeague] = useState("All");
  const [leagues, setLeagues] = useState<string[]>(() => _sportCache["S"]?.leagues ?? ["All"]);

  const sport = SPORTS[activeSport] ?? SPORTS[0];

  useEffect(() => {
    const cached = _sportCache[sport.code];
    if (cached?.ready) {
      setAllMatches(cached.matches);
      setLeagues(cached.leagues);
      setLoading(false);
    } else {
      setLoading(true);
      setAllMatches([]);
    }
    setActiveLeague("All");

    async function load() {
      try {
        const pages = await Promise.all([
          api.matches(sport.code, 0),
          api.matches(sport.code, 200),
          api.matches(sport.code, 400),
        ]);

        const raw: ApiMatch[] = [];
        const seenIds = new Set<number>();
        pages.forEach((p) => {
          (p.esMatches || []).forEach((m) => {
            if (!seenIds.has(m.id)) { seenIds.add(m.id); raw.push(m); }
          });
        });

        const parsed: Match[] = [];
        raw.forEach((m) => {
          const isActuallyLive = m.live === true && m.kickOffTime < Date.now();
          if (isLive && !isActuallyLive) return;
          const match = apiMatchToMatch(m);
          if (match) parsed.push(match);
        });

        parsed.sort((a, b) => {
          if (a.isLive && !b.isLive) return -1;
          if (!a.isLive && b.isLive) return 1;
          return (a.kickOffTime ?? 0) - (b.kickOffTime ?? 0);
        });

        const newLeagues = ["All", ...Array.from(new Set(parsed.map((m) => m.league))).slice(0, 14)];
        _sportCache[sport.code] = { matches: parsed, leagues: newLeagues, ready: true };
        setAllMatches(parsed);
        setLeagues(newLeagues);

        api.boostedMatches(sport.code).then((resp) => {
          const boosted: Match[] = [];
          const seen = new Set<number>();
          (resp.esMatches || []).forEach((m) => {
            if (!seen.has(m.id)) { seen.add(m.id); const bm = apiBoostedToMatch(m); if (bm) boosted.push(bm); }
          });
          setBoostedMatches(boosted);
        }).catch(() => setBoostedMatches([]));
      } catch (err) {
        console.error("Failed to fetch sport matches", err);
        setAllMatches([]);
      } finally {
        setLoading(false);
      }
    }

    setBoostedMatches([]);
    load();
  }, [activeSport, isLive]);

  useEffect(() => {
    const silentRefresh = async () => {
      try {
        const [p1, p2] = await Promise.all([
          api.matches(sport.code, 0),
          api.matches(sport.code, 200),
        ]);
        const oddsById = new Map<string, { home: number; draw: number; away: number }>();
        [...(p1.esMatches || []), ...(p2.esMatches || [])].forEach((m) => {
          const odds = getOdds1X2(m.betMap);
          if (odds) oddsById.set(String(m.id), odds);
        });
        setAllMatches((prev) => {
          let changed = false;
          const next = prev.map((m) => {
            const no = oddsById.get(m.id);
            if (no && (no.home !== m.odds.home || no.draw !== m.odds.draw || no.away !== m.odds.away)) {
              changed = true;
              return { ...m, odds: no };
            }
            return m;
          });
          return changed ? next : prev;
        });
      } catch {}
    };
    const id = setInterval(silentRefresh, 3000);
    return () => clearInterval(id);
  }, [sport.code]);

  const filtered = allMatches.filter((m) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || m.homeTeam.toLowerCase().includes(q) || m.awayTeam.toLowerCase().includes(q) || m.league.toLowerCase().includes(q);
    const matchesLeague = activeLeague === "All" || m.league === activeLeague;
    return matchesSearch && matchesLeague;
  });

  const liveCount = allMatches.filter((m) => m.isLive).length;

  // Group by league
  const groupedByLeague: { league: string; matches: Match[] }[] = [];
  if (activeLeague !== "All") {
    groupedByLeague.push({ league: activeLeague, matches: filtered });
  } else {
    const leagueMap = new Map<string, Match[]>();
    filtered.forEach((m) => {
      if (!leagueMap.has(m.league)) leagueMap.set(m.league, []);
      leagueMap.get(m.league)!.push(m);
    });
    leagueMap.forEach((matches, league) => groupedByLeague.push({ league, matches }));
  }

  return (
    <div>
      {statsMatch && <StatsModal match={statsMatch} onClose={() => setStatsMatch(null)} />}

      {/* Sport tabs */}
      <div style={{ display: "flex", gap: 0, overflowX: "auto", scrollbarWidth: "none", background: "#1c1e24", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {SPORTS.map(({ code, name }, i) => {
          const isActive = activeSport === i;
          const color = SPORT_COLORS[i] ?? "#555";
          return (
            <div key={code} onClick={() => setActiveSport(i)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              padding: "8px 12px", cursor: "pointer", flexShrink: 0,
              borderBottom: isActive ? `2px solid ${color}` : "2px solid transparent",
              background: isActive ? `rgba(255,255,255,0.06)` : "transparent",
            }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: isActive ? color : "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                <SportIcon code={code} size={15} active={isActive} />
              </div>
              <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 500, color: isActive ? "#fff" : "rgba(255,255,255,0.45)", whiteSpace: "nowrap", fontFamily: "Oswald, sans-serif" }}>
                {name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ padding: "7px 10px", background: "#1c1e24", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18, display: "flex", alignItems: "center", gap: 7, padding: "6px 12px" }}>
          <Search size={13} style={{ color: "rgba(255,255,255,0.35)", flexShrink: 0 }} />
          <input
            style={{ flex: 1, background: "none", border: "none", color: "#fff", fontSize: 12, outline: "none" }}
            placeholder="Search teams or leagues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Live badge + count */}
      <div style={{ padding: "6px 10px", background: "#f0f4f1", borderBottom: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {!loading && liveCount > 0 && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#e53935", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8, fontFamily: "Oswald, sans-serif" }}>
              <span style={{ width: 5, height: 5, background: "#fff", borderRadius: "50%", animation: "blink 1s infinite", display: "inline-block" }} />
              {liveCount} LIVE
            </span>
          )}
          {!loading && boostedMatches.length > 0 && !isLive && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(251,140,0,0.12)", color: "#fb8c00", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8, fontFamily: "Oswald, sans-serif", border: "1px solid rgba(251,140,0,0.3)" }}>
              <Zap size={10} fill="#fb8c00" />
              {boostedMatches.length} BOOSTED
            </span>
          )}
        </div>
        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{filtered.length} matches</span>
      </div>

      {/* League filter chips */}
      <div className="leagues-list" style={{ background: "#fff", padding: "7px 8px" }}>
        {leagues.map((l) => (
          <div key={l} className={`league-chip ${activeLeague === l ? "active" : ""}`} onClick={() => setActiveLeague(l)}
            style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, fontSize: 11, padding: "4px 11px" }}>
            {l !== "All" && <LeagueFlag leagueName={l} />}
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>{l}</span>
          </div>
        ))}
      </div>

      {/* Boosted odds as cards */}
      {!loading && boostedMatches.length > 0 && !isLive && (
        <>
          <div style={{ padding: "8px 10px 4px", background: "#fff", borderBottom: "1px solid var(--border2)", display: "flex", alignItems: "center", gap: 6 }}>
            <Zap size={13} style={{ color: "#fb8c00" }} fill="#fb8c00" />
            <span style={{ fontSize: 12, fontWeight: 800, color: "#fb8c00", fontFamily: "Oswald, sans-serif", letterSpacing: 0.5 }}>BOOSTED ODDS</span>
          </div>
          <div className="match-list">
            {boostedMatches.map((m) => (
              <MatchCard key={m.id} match={m} onAddBet={onAddBet} betSelections={betSelections} onMatchClick={onMatchClick} onStatsClick={setStatsMatch} />
            ))}
          </div>
          <div style={{ height: 6, background: "var(--border2)" }} />
        </>
      )}

      {/* Match list grouped by league */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 36, gap: 10, color: "var(--text-muted)", background: "#fff" }}>
          <Loader2 size={20} style={{ animation: "spin 1s linear infinite", color: "var(--green)" }} />
          <span style={{ fontSize: 13 }}>Loading {sport.name} matches...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "36px 14px", textAlign: "center", color: "var(--text-muted)", background: "#fff" }}>
          <Shield size={32} style={{ marginBottom: 10, opacity: 0.3 }} />
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            {isLive ? "No live matches right now" : "No matches found"}
          </div>
          <div style={{ fontSize: 11 }}>Try a different sport or check back later</div>
        </div>
      ) : (
        <div>
          {groupedByLeague.map(({ league, matches }) => (
            <LeagueGroup
              key={league}
              league={league}
              matches={matches}
              onAddBet={onAddBet}
              betSelections={betSelections}
              onMatchClick={onMatchClick}
              onStatsClick={setStatsMatch}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}
