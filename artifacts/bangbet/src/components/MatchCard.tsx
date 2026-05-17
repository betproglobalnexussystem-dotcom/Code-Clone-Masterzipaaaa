import { Globe, BarChart2, ChevronRight } from "lucide-react";
import type { BetSelection } from "../App";
import { getLeagueFlagUrl } from "../lib/api";

export interface Match {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  time: string;
  isLive?: boolean;
  odds: { home: number; draw: number; away: number };
  oddsCount?: number;
  apiId?: number;
  brMatchId?: number;
  kickOffTime?: number;
  overUnder?: string;
  leagueId?: number;
  isBoosted?: boolean;
  sport?: string;
}

interface MatchCardProps {
  match: Match;
  onAddBet: (bet: BetSelection) => void;
  betSelections: BetSelection[];
  onMatchClick?: (match: Match) => void;
  onStatsClick?: (match: Match) => void;
}

function LeagueFlag({ leagueName }: { leagueName: string }) {
  const url = getLeagueFlagUrl(leagueName);
  if (url) {
    return (
      <img
        src={url}
        alt=""
        style={{ width: 14, height: 10, objectFit: "cover", borderRadius: 2, flexShrink: 0 }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return <Globe size={12} style={{ flexShrink: 0, opacity: 0.6 }} />;
}

function FireIcon({ size = 18, color = "#ff6d00" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle", filter: "drop-shadow(0 0 3px rgba(255,109,0,0.6))" }}
    >
      <path d="M16 2s-1.5 3-3 6c-1 2-2 4-2 6a5 5 0 0010 0c0-3-1.5-5-2.5-6.5.2 1 .5 2.5.5 3.5a3 3 0 01-6 0c0-2.5 1.5-5 3-8.5z" />
      <path d="M16 2C16 2 9 10 9 16a7 7 0 0014 0c0-3.5-2-6-3-8 .5 1.5 1 3 1 5a5 5 0 01-10 0c0-3 2-6 5-11z" opacity="0.35" />
    </svg>
  );
}

export default function MatchCard({ match, onAddBet, betSelections, onMatchClick, onStatsClick }: MatchCardProps) {
  const isSelected = (key: string) => betSelections.some((b) => b.id === `${match.id}-${key}`);
  const markets = match.oddsCount ?? 122;

  const handleOdd = (e: React.MouseEvent, label: string, odd: number, key: string) => {
    e.stopPropagation();
    if (odd <= 1) return;
    onAddBet({
      id: `${match.id}-${key}`,
      match: `${match.homeTeam} vs ${match.awayTeam}`,
      pick: label,
      odd,
      matchId: match.apiId,
      kickOffTime: match.kickOffTime,
      sport: match.sport,
      marketKey: key,
    });
  };

  const oddsArr = [
    { label: "1", pick: `${match.homeTeam} Win`, odd: match.odds.home, key: "home" },
    { label: "X", pick: "Draw", odd: match.odds.draw, key: "draw" },
    { label: "2", pick: `${match.awayTeam} Win`, odd: match.odds.away, key: "away" },
  ];

  const maxOdd = Math.max(...oddsArr.map((o) => o.odd));

  return (
    <div className="match-item" onClick={() => onMatchClick?.(match)}>
      <div className="match-header">
        <div className="match-league">
          <LeagueFlag leagueName={match.league} />
          {match.league}
          {match.isBoosted && (
            <span style={{
              background: "linear-gradient(90deg, #ff6d00, #ff9100)",
              color: "#fff",
              fontSize: 9,
              fontWeight: 700,
              padding: "1px 5px",
              borderRadius: 6,
              marginLeft: 4,
              fontFamily: "Oswald, sans-serif",
              letterSpacing: 0.3,
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
            }}>
              <FireIcon size={11} color="#fff" />
              BOOSTED
            </span>
          )}
        </div>
        {match.isLive ? (
          <span className="match-live-badge">
            <span className="live-dot" />
            LIVE
          </span>
        ) : (
          <span className="match-time">{match.time}</span>
        )}
      </div>

      <div className="match-teams">
        <div className="match-team">
          <span className="team-name">{match.homeTeam}</span>
        </div>
        <div className="match-vs">VS</div>
        <div className="match-team match-team-right">
          <span className="team-name">{match.awayTeam}</span>
        </div>
      </div>

      <div className="match-odds" onClick={(e) => e.stopPropagation()}>
        {oddsArr.map(({ label, pick, odd, key }) => {
          const isBest = match.isBoosted && odd === maxOdd && odd > 1;
          const sel = isSelected(key);
          return (
            <button
              key={key}
              className={`odd-btn ${sel ? "selected" : ""}`}
              onClick={(e) => handleOdd(e, pick, odd, key)}
              disabled={odd <= 1}
              style={{ opacity: odd <= 1 ? 0.45 : 1, position: "relative" }}
            >
              <span className="odd-label">{label}</span>
              <span className="odd-value" style={{ display: "block", textAlign: "center", position: "relative" }}>
                {odd > 1 ? odd.toFixed(2) : "-"}
                {isBest && (
                  <span style={{ position: "absolute", right: -28, top: "50%", transform: "translateY(-50%)" }}>
                    <FireIcon size={22} color={sel ? "#fff" : "#ff6d00"} />
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="match-footer">
        <div
          className="match-stats-btn"
          onClick={(e) => {
            e.stopPropagation();
            if (onStatsClick) {
              onStatsClick(match);
            } else {
              onMatchClick?.(match);
            }
          }}
        >
          <BarChart2 size={13} />
          <span>Stats</span>
        </div>
        <div className="match-markets" onClick={(e) => { e.stopPropagation(); onMatchClick?.(match); }}>
          <span>+{markets}</span>
          <ChevronRight size={12} />
        </div>
      </div>
    </div>
  );
}
