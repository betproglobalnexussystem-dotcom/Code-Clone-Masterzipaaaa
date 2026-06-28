import { ChevronRight } from "lucide-react";
import type { BetSelection } from "../App";
import type { Match } from "./MatchCard";

interface MatchRowProps {
  match: Match;
  onAddBet: (bet: BetSelection) => void;
  betSelections: BetSelection[];
  onMatchClick?: (match: Match) => void;
}

function FireIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="#ff6d00" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, filter: "drop-shadow(0 0 3px rgba(255,109,0,0.5))" }}>
      <path d="M16 2s-1.5 3-3 6c-1 2-2 4-2 6a5 5 0 0010 0c0-3-1.5-5-2.5-6.5.2 1 .5 2.5.5 3.5a3 3 0 01-6 0c0-2.5 1.5-5 3-8.5z" />
    </svg>
  );
}

export default function MatchRow({ match, onAddBet, betSelections, onMatchClick }: MatchRowProps) {
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
    <div className="match-row" onClick={() => onMatchClick?.(match)}>
      <div className="match-row-time">
        {match.isLive ? (
          <span className="match-row-live-badge">
            <span className="live-dot" style={{ width: 5, height: 5, background: "#fff", borderRadius: "50%", display: "inline-block", animation: "blink 1s infinite" }} />
            LIVE
          </span>
        ) : (
          <span style={{ fontSize: 10, color: "var(--text-muted)", lineHeight: 1.4 }}>{match.time}</span>
        )}
      </div>

      <div className="match-row-teams">
        <div className="match-row-team">{match.homeTeam}</div>
        <div className="match-row-team" style={{ color: "var(--text-secondary)" }}>{match.awayTeam}</div>
      </div>

      <div className="match-row-odds" onClick={(e) => e.stopPropagation()}>
        {oddsArr.map(({ label, pick, odd, key }) => {
          const isBoostedBest = match.isBoosted && odd === maxOdd && odd > 1;
          const sel = isSelected(key);
          return (
            <button
              key={key}
              className={`match-row-odd-btn${sel ? " selected" : ""}`}
              onClick={(e) => handleOdd(e, pick, odd, key)}
              disabled={odd <= 1}
              style={{ opacity: odd <= 1 ? 0.4 : 1 }}
            >
              <span className="match-row-odd-label">{label}</span>
              <span className="match-row-odd-value">
                {odd > 1 ? odd.toFixed(2) : "-"}
                {isBoostedBest && <FireIcon size={10} />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="match-row-more" onClick={(e) => { e.stopPropagation(); onMatchClick?.(match); }}>
        <span>+{markets}</span>
        <ChevronRight size={10} style={{ opacity: 0.5 }} />
      </div>
    </div>
  );
}
