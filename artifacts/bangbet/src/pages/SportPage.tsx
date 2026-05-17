import { useState, useEffect } from "react";
import { Globe, Shield, Search, Loader2, Zap } from "lucide-react";
import type { BetSelection } from "../App";
import MatchCard, { type Match } from "../components/MatchCard";
import { api, getOdds1X2, getBoostedOdds, formatKickOff, getLeagueFlagUrl, type ApiMatch, SPORTS } from "../lib/api";
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

const SPORT_COLORS = ["#2DA962","#e65100","#1565c0","#6a1b9a","#c62828","#00838f","#37474f","#455a64","#2e7d32"];

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
      <img src={url} alt="" style={{ width: 14, height: 10, objectFit: "cover", borderRadius: 2, flexShrink: 0, marginRight: 2 }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
    );
  }
  return <Globe size={12} style={{ flexShrink: 0, opacity: 0.5, marginRight: 2 }} />;
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
  return {
    id: String(m.id), apiId: m.id, brMatchId: m.brMatchId,
    league: m.leagueName, homeTeam: m.home, awayTeam: m.away,
    time: formatKickOff(m.kickOffTime),
    isLive: m.live === true && m.kickOffTime < Date.now(),
    odds, oddsCount: m.oddsCount, kickOffTime: m.kickOffTime,
    overUnder: m.params?.overUnder, leagueId: m.leagueId,
    sport: m.sport,
  };
}

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

        // Sort by kickoff time ascending — live first, then by start time
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

  return (
    <div>
      {statsMatch && <StatsModal match={statsMatch} onClose={() => setStatsMatch(null)} />}

      {/* Sport tabs */}
      <div style={{ display: "flex", gap: 0, overflowX: "auto", scrollbarWidth: "none", background: "#fff", borderBottom: "1px solid var(--border)" }}>
        {SPORTS.map(({ code, name }, i) => {
          const isActive = activeSport === i;
          const color = SPORT_COLORS[i] ?? "#555";
          return (
            <div key={code} onClick={() => setActiveSport(i)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              padding: "10px 14px", cursor: "pointer", flexShrink: 0,
              borderBottom: isActive ? `2px solid ${color}` : "2px solid transparent",
              background: isActive ? `${color}10` : "transparent",
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: isActive ? color : "#f0f4f1", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                <SportIcon code={code} size={18} active={isActive} />
              </div>
              <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, color: isActive ? color : "var(--text-muted)", whiteSpace: "nowrap", fontFamily: "Oswald, sans-serif" }}>
                {name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="search-bar">
        <div className="search-input-wrap">
          <Search size={15} className="search-icon" />
          <input className="search-input" placeholder="Search teams or leagues..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </div>

      {/* Live badge */}
      {!loading && liveCount > 0 && (
        <div style={{ padding: "6px 14px", background: "#fff", borderBottom: "1px solid var(--border2)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#e53935", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 10, fontFamily: "Oswald, sans-serif" }}>
            <span style={{ width: 6, height: 6, background: "#fff", borderRadius: "50%", animation: "blink 1s infinite", display: "inline-block" }} />
            {liveCount} LIVE NOW
          </span>
        </div>
      )}

      {/* League chips */}
      <div className="leagues-list">
        {leagues.map((l) => (
          <div key={l} className={`league-chip ${activeLeague === l ? "active" : ""}`} onClick={() => setActiveLeague(l)}
            style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            {l !== "All" && <LeagueFlag leagueName={l} />}
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>{l}</span>
          </div>
        ))}
      </div>

      {/* Results count */}
      {!loading && (
        <div style={{ padding: "6px 14px", background: "#f8f9f8", borderBottom: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>
            {filtered.length} {isLive ? "live" : "upcoming"} matches
          </span>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Sorted by start time</span>
        </div>
      )}

      {/* Boosted Odds Section */}
      {!loading && boostedMatches.length > 0 && !isLive && (
        <>
          <div style={{ padding: "10px 14px 6px", background: "#fff", borderBottom: "1px solid var(--border2)", display: "flex", alignItems: "center", gap: 7 }}>
            <Zap size={14} style={{ color: "#fb8c00" }} fill="#fb8c00" />
            <span style={{ fontSize: 13, fontWeight: 800, color: "#fb8c00", fontFamily: "Oswald, sans-serif", letterSpacing: 0.5 }}>BOOSTED ODDS</span>
            <span style={{ fontSize: 10, background: "rgba(251,140,0,0.12)", color: "#fb8c00", fontWeight: 700, padding: "1px 7px", borderRadius: 8, fontFamily: "Oswald, sans-serif" }}>{boostedMatches.length}</span>
          </div>
          <div className="match-list">
            {boostedMatches.map((m) => (
              <MatchCard key={m.id} match={m} onAddBet={onAddBet} betSelections={betSelections} onMatchClick={onMatchClick} onStatsClick={setStatsMatch} />
            ))}
          </div>
          <div style={{ height: 6, background: "var(--border2)" }} />
        </>
      )}

      {/* Matches */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40, gap: 10, color: "var(--text-muted)", background: "#fff" }}>
          <Loader2 size={22} style={{ animation: "spin 1s linear infinite", color: "var(--green)" }} />
          <span style={{ fontSize: 14 }}>Loading {sport.name} matches...</span>
        </div>
      ) : (
        <div className="match-list">
          {filtered.map((m) => (
            <MatchCard key={m.id} match={m} onAddBet={onAddBet} betSelections={betSelections} onMatchClick={onMatchClick} onStatsClick={setStatsMatch} />
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: "40px 14px", textAlign: "center", color: "var(--text-muted)", background: "#fff" }}>
              <Shield size={36} style={{ marginBottom: 10, opacity: 0.3 }} />
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                {isLive ? "No live matches right now" : "No matches found"}
              </div>
              <div style={{ fontSize: 12 }}>Try a different sport or check back later</div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}
