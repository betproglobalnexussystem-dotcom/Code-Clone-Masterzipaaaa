import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft, RefreshCw, Globe,
  Calendar, Clock, Trophy, Activity, TrendingUp, ChevronDown, ChevronRight,
} from "lucide-react";
import {
  getLeagueFlagUrl, validScore,
  SPORT_NAMES, SPORT_ICONS,
} from "../lib/api";
import type { ApiResultMatch, MatchResult } from "../lib/api";
import { useResultsCache } from "../lib/resultsCache";

// ── Date helpers ──────────────────────────────────────────────────────────────
function buildDateList(): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (13 - i));
    return d;
  });
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function dayLabel(d: Date): string {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yest = new Date(today); yest.setDate(today.getDate() - 1);
  if (isSameDay(d, today)) return "Today";
  if (isSameDay(d, yest)) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "short" });
}

// ── Status codes from TopBet API ──────────────────────────────────────────────
// status=0        → Not started (no p value)
// status=1, p=END → Ended (official result)
// status=3        → Postponed (p=DELAYED or undefined)
// status=6 + playing period → Live / In Progress
// status=6 + live=false OR p=END → Ended (game done, status not yet updated)
// status=7        → Abandoned / Cancelled
// NOTE: live=true alone does NOT mean in-progress — ended matches also have live=true
//       (762 cases: status=1, live=true, p=END). Use status=6 + playing period for live.

const PLAYING_PERIODS = new Set([
  "FIRST_HALF", "SECOND_HALF", "PAUSE",
  "FIRST_QUARTER", "SECOND_QUARTER", "THIRD_QUARTER", "FOURTH_QUARTER",
  "FIRST_PERIOD", "SECOND_PERIOD", "THIRD_PERIOD",
  "FIRST_SET", "SECOND_SET", "THIRD_SET", "FOURTH_SET", "FIFTH_SET",
  "SIXTH_SET", "SEVENTH_SET",
  "FIRST_INNING", "SECOND_INNING", "THIRD_INNING", "FOURTH_INNING",
  "FIFTH_INNING", "SIXTH_INNING", "SEVENTH_INNING", "EIGHTH_INNING", "NINTH_INNING",
  "FIRST_MAP", "SECOND_MAP", "THIRD_MAP",
  "BREAK_TIME", "IN_PROGRESS",
]);

function isLiveMatch(m: ApiResultMatch): boolean {
  return m.status === 6 && PLAYING_PERIODS.has(m.matchResult?.p ?? "");
}

type MatchStatus = {
  category: "live" | "ended" | "postponed" | "abandoned" | "not_started";
  text: string;
  liveDetail?: string;
  color: string;
  bg: string;
  isLive: boolean;
};

const PERIOD_DISPLAY: Record<string, string> = {
  FIRST_HALF:      "1st Half",
  SECOND_HALF:     "2nd Half",
  PAUSE:           "Half Time",
  FIRST_QUARTER:   "1st Qtr",
  SECOND_QUARTER:  "2nd Qtr",
  THIRD_QUARTER:   "3rd Qtr",
  FOURTH_QUARTER:  "4th Qtr",
  FIRST_PERIOD:    "1st Period",
  SECOND_PERIOD:   "2nd Period",
  THIRD_PERIOD:    "3rd Period",
  FIRST_SET:       "1st Set",
  SECOND_SET:      "2nd Set",
  THIRD_SET:       "3rd Set",
  FOURTH_SET:      "4th Set",
  FIFTH_SET:       "5th Set",
  FIRST_INNING:    "1st Inning",
  SECOND_INNING:   "2nd Inning",
  THIRD_INNING:    "3rd Inning",
  FOURTH_INNING:   "4th Inning",
  FIFTH_INNING:    "5th Inning",
  SIXTH_INNING:    "6th Inning",
  SEVENTH_INNING:  "7th Inning",
  EIGHTH_INNING:   "8th Inning",
  NINTH_INNING:    "9th Inning",
  FIRST_MAP:       "Map 1",
  SECOND_MAP:      "Map 2",
  THIRD_MAP:       "Map 3",
  BREAK_TIME:      "Break",
  IN_PROGRESS:     "In Progress",
};

function getMatchStatus(match: ApiResultMatch): MatchStatus {
  const p = match.matchResult?.p ?? "";
  const s = match.status;

  // Live: status=6 with an active playing period
  if (s === 6 && PLAYING_PERIODS.has(p)) {
    return {
      category: "live",
      text: "Live",
      liveDetail: PERIOD_DISPLAY[p] ?? p.replace(/_/g, " "),
      color: "#fff",
      bg: "#e53935",
      isLive: true,
    };
  }

  // Postponed: status=3
  if (s === 3 || p === "DELAYED" || p === "POSTPONED") {
    return { category: "postponed", text: "Postponed", color: "#fff", bg: "#f57c00", isLive: false };
  }

  // Abandoned / Cancelled: status=7
  if (s === 7) {
    return { category: "abandoned", text: "Cancelled", color: "#fff", bg: "#9e9e9e", isLive: false };
  }

  // Not Started: status=0, no period
  if (s === 0 && !p) {
    return { category: "not_started", text: "Scheduled", color: "var(--text-muted)", bg: "#e8f0e9", isLive: false };
  }

  // Ended: status=1, p=END, or status=6 with non-playing period (game finished)
  return { category: "ended", text: "Ended", color: "#fff", bg: "#2DA962", isLive: false };
}

// ── Live minute calculation ────────────────────────────────────────────────────
function getLiveMinute(match: ApiResultMatch, now: number): number | null {
  if (!isLiveMatch(match)) return null;
  const p = match.matchResult?.p ?? "";
  if (p === "PAUSE" || p === "BREAK_TIME") return null; // show "Half Time" label instead
  const elapsed = (now - match.kickOffTime) / 60000;

  if (p === "FIRST_HALF")    return Math.min(45, Math.max(1,  Math.floor(elapsed)));
  if (p === "SECOND_HALF")   return Math.min(90, Math.max(46, Math.floor(45 + Math.max(0, elapsed - 50))));
  if (p === "FIRST_QUARTER") return Math.min(12, Math.max(1,  Math.floor(elapsed)));
  if (p === "SECOND_QUARTER")return Math.min(24, Math.max(13, Math.floor(12 + Math.max(0, elapsed - 14))));
  if (p === "THIRD_QUARTER") return Math.min(36, Math.max(25, Math.floor(24 + Math.max(0, elapsed - 28))));
  if (p === "FOURTH_QUARTER")return Math.min(48, Math.max(37, Math.floor(36 + Math.max(0, elapsed - 42))));
  return null;
}

// ── Score extraction ──────────────────────────────────────────────────────────
function extractScore(r: MatchResult, isLive: boolean): { home: number; away: number } | null {
  const hs = r.hs;
  const as = r.as;

  // For live matches prefer CURRENT_SCORE (reflects real-time state)
  if (isLive) {
    const ch = validScore(hs.CURRENT_SCORE);
    const ca = validScore(as.CURRENT_SCORE);
    if (ch !== null && ca !== null) return { home: ch, away: ca };
  }

  for (const key of ["FULLTIME", "FULLTIME_SETS", "FULLTIME_PERIODS", "CURRENT_SCORE"]) {
    const h = validScore(hs[key]);
    const a = validScore(as[key]);
    if (h !== null && a !== null) return { home: h, away: a };
  }
  return null;
}

function getResult(score: { home: number; away: number }): "home" | "draw" | "away" {
  return score.home > score.away ? "home" : score.away > score.home ? "away" : "draw";
}

function getHalfTime(r: MatchResult): { home: number; away: number } | null {
  const h = validScore(r.hs.FIRST_HALF);
  const a = validScore(r.as.FIRST_HALF);
  return h !== null && a !== null ? { home: h, away: a } : null;
}

function getSecondHalf(r: MatchResult): { home: number; away: number } | null {
  const h = validScore(r.hs.SECOND_HALF);
  const a = validScore(r.as.SECOND_HALF);
  return h !== null && a !== null ? { home: h, away: a } : null;
}

function getOvertime(r: MatchResult): { home: number; away: number } | null {
  const h = validScore(r.hs.OVERTIME);
  const a = validScore(r.as.OVERTIME);
  return h !== null && a !== null ? { home: h, away: a } : null;
}

function getPenalties(r: MatchResult, ftScore: { home: number; away: number } | null): { home: number; away: number } | null {
  const h = validScore(r.hs.PENALTIES);
  const a = validScore(r.as.PENALTIES);
  if (h === null || a === null) return null;
  if (ftScore && h === ftScore.home && a === ftScore.away) return null; // same as FT = no shootout
  return { home: h, away: a };
}

function getCorners(r: MatchResult) {
  const get = (key: string) => {
    const h = validScore(r.hs[key]);
    const a = validScore(r.as[key]);
    return h !== null && a !== null ? { home: h, away: a } : null;
  };
  return {
    total:   get("FULLTIME_CORNERS") ?? get("CURRENT_CORNERS"),
    fh:      get("FIRSTHALF_CORNERS"),
    sh:      get("SECONDHALF_CORNERS"),
    current: get("CURRENT_CORNERS"),
  };
}

function getCards(r: MatchResult) {
  const yh = validScore(r.hs.FULLTIME_YC);
  const ya = validScore(r.as.FULLTIME_YC);
  const rh = validScore(r.hs.FULLTIME_RC);
  const ra = validScore(r.as.FULLTIME_RC);
  const hyh = validScore(r.hs.HALFTIME_YC);
  const hya = validScore(r.as.HALFTIME_YC);
  const syh = validScore(r.hs.SECONDTIME_YC);
  const sya = validScore(r.as.SECONDTIME_YC);
  return {
    ftYellow: yh !== null && ya !== null ? { home: yh, away: ya } : null,
    ftRed:    rh !== null && ra !== null && (rh > 0 || ra > 0) ? { home: rh, away: ra } : null,
    htYellow: hyh !== null && hya !== null ? { home: hyh, away: hya } : null,
    shYellow: syh !== null && sya !== null ? { home: syh, away: sya } : null,
  };
}

function getShots(r: MatchResult): { home: number; away: number } | null {
  const h = validScore(r.hs.FULLTIME_SHOTS);
  const a = validScore(r.as.FULLTIME_SHOTS);
  return h !== null && a !== null ? { home: h, away: a } : null;
}

const PERIOD_KEYS = [
  "FIRST_PERIOD", "SECOND_PERIOD", "THIRD_PERIOD", "FOURTH_PERIOD",
  "FIFTH_PERIOD", "SIXTH_PERIOD", "SEVENTH_PERIOD",
];

function getPeriods(r: MatchResult): { home: number; away: number }[] {
  return PERIOD_KEYS.map(k => {
    const h = validScore(r.hs[k]);
    const a = validScore(r.as[k]);
    return h !== null && a !== null ? { home: h, away: a } : null;
  }).filter(Boolean) as { home: number; away: number }[];
}

function getPeriodLabel(index: number, rt: string): string {
  const r = rt.toLowerCase();
  if (r.includes("round"))   return `Round ${index + 1}`;
  if (r.includes("inning"))  return `${["1st","2nd","3rd","4th","5th","6th","7th","8th","9th"][index] ?? `${index+1}th`} Inning`;
  if (r.includes("quarter")) return `${["1st","2nd","3rd","4th"][index] ?? `${index+1}th`} Quarter`;
  if (r.includes("period"))  return `${["1st","2nd","3rd","4th","5th"][index] ?? `${index+1}th`} Period`;
  return `Set ${index + 1}`;
}

// Time-range goals (football)
const TIME_RANGES = [
  { key: "FIRST_10M",         label: "0–10'" },
  { key: "TIME_RANGE_11_20",  label: "11–20'" },
  { key: "TIME_RANGE_16_30",  label: "16–30'" },
  { key: "TIME_RANGE_31_40",  label: "31–40'" },
  { key: "TIME_RANGE_31_45",  label: "31–45'" },
  { key: "TIME_RANGE_16_45",  label: "16–45'" },
  { key: "TIME_RANGE_46_60",  label: "46–60'" },
  { key: "TIME_RANGE_51_60",  label: "51–60'" },
  { key: "TIME_RANGE_61_70",  label: "61–70'" },
  { key: "TIME_RANGE_61_75",  label: "61–75'" },
  { key: "TIME_RANGE_71_80",  label: "71–80'" },
  { key: "TIME_RANGE_76_90",  label: "76–90'" },
  { key: "TIME_RANGE_81_PLUS",label: "81+'" },
];

function getTimeRangeGoals(r: MatchResult): { label: string; home: number; away: number }[] {
  // pick the non-overlapping set that has data
  const available: { label: string; home: number; away: number }[] = [];
  for (const { key, label } of TIME_RANGES) {
    const h = validScore(r.hs[key]);
    const a = validScore(r.as[key]);
    if (h !== null && a !== null && (h > 0 || a > 0)) {
      available.push({ label, home: h, away: a });
    }
  }
  return available;
}

// ── Sport sort ────────────────────────────────────────────────────────────────
const SPORT_PRIORITY: Record<string, number> = {
  S: 0, B: 1, T: 2, HB: 3, V: 4, RL: 5, IH: 6, BB: 7, MM: 8, AM: 9,
};

function sortedSportEntries(map: Record<string, ApiResultMatch[]>): [string, ApiResultMatch[]][] {
  return Object.entries(map)
    .filter(([, ms]) => ms.length > 0)
    .sort(([a], [b]) => {
      const pa = SPORT_PRIORITY[a] ?? 99;
      const pb = SPORT_PRIORITY[b] ?? 99;
      return pa !== pb ? pa - pb : (map[b]?.length ?? 0) - (map[a]?.length ?? 0);
    });
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatusChip({ match, now, small = false }: { match: ApiResultMatch; now: number; small?: boolean }) {
  const s = getMatchStatus(match);
  const minute = s.isLive ? getLiveMinute(match, now) : null;

  let label = s.text;
  if (s.isLive) {
    if (minute !== null) label = `${minute}'`;
    else if (s.liveDetail) label = s.liveDetail;
  }

  return (
    <span style={{
      fontSize: small ? 8 : 9, fontWeight: 800, letterSpacing: 0.3,
      color: s.color, background: s.bg,
      padding: small ? "2px 5px" : "2px 7px",
      borderRadius: 4, flexShrink: 0, whiteSpace: "nowrap",
      ...(s.isLive ? { animation: "livePulse 1.4s ease-in-out infinite" } : {}),
    }}>{label}</span>
  );
}

function LeagueFlag({ name }: { name: string }) {
  const url = getLeagueFlagUrl(name);
  if (url)
    return (
      <img src={url} alt="" style={{ width: 16, height: 11, objectFit: "cover", borderRadius: 2, flexShrink: 0 }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
    );
  return <Globe size={12} style={{ opacity: 0.4, flexShrink: 0 }} />;
}

function ResultRow({ match, onClick, now }: { match: ApiResultMatch; onClick: () => void; now: number }) {
  const status = getMatchStatus(match);
  const score = extractScore(match.matchResult, status.isLive);
  const result = (!status.isLive && score) ? getResult(score) : null;
  const ht = (["S","HB","RL","AM"].includes(match.sport) && !status.isLive)
    ? getHalfTime(match.matchResult) : null;
  const kickoff = new Date(match.kickOffTime);
  const timeStr = kickoff.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center",
        padding: "10px 14px",
        borderBottom: "1px solid var(--border2)",
        gap: 10, cursor: "pointer",
        background: status.isLive ? "rgba(229,57,53,0.03)" : "#fff",
        transition: "background 0.1s",
        borderLeft: status.isLive ? "3px solid #e53935" : "3px solid transparent",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = status.isLive ? "rgba(229,57,53,0.06)" : "#f8faf9")}
      onMouseLeave={e => (e.currentTarget.style.background = status.isLive ? "rgba(229,57,53,0.03)" : "#fff")}
    >
      <div style={{ minWidth: 44, textAlign: "center", flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, marginBottom: 3 }}>{timeStr}</div>
        <StatusChip match={match} now={now} small />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{
            flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            fontSize: 12.5,
            fontWeight: result === "home" ? 700 : 400,
            color: result === "home" ? "var(--dark)" : "var(--text-secondary)",
          }}>{match.home}</span>
          <span style={{
            fontSize: 18, fontWeight: 900, minWidth: 24, textAlign: "right",
            color: status.isLive ? "#e53935" : result === "home" ? "var(--green)" : "var(--text-secondary)",
            fontFamily: "Oswald, sans-serif", lineHeight: 1,
          }}>{score !== null ? score.home : "-"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{
            flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            fontSize: 12.5,
            fontWeight: result === "away" ? 700 : 400,
            color: result === "away" ? "var(--dark)" : "var(--text-secondary)",
          }}>{match.away}</span>
          <span style={{
            fontSize: 18, fontWeight: 900, minWidth: 24, textAlign: "right",
            color: status.isLive ? "#e53935" : result === "away" ? "var(--green)" : "var(--text-secondary)",
            fontFamily: "Oswald, sans-serif", lineHeight: 1,
          }}>{score !== null ? score.away : "-"}</span>
        </div>
        {ht && (
          <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 3 }}>
            Half Time: {ht.home} – {ht.away}
          </div>
        )}
        {status.isLive && status.liveDetail && (
          <div style={{ fontSize: 9, color: "#e53935", marginTop: 3, fontWeight: 700 }}>
            {status.liveDetail}
          </div>
        )}
      </div>

      <ChevronRight size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
    </div>
  );
}

function LeagueGroup({
  league, matches, onMatchClick, now,
}: { league: string; matches: ApiResultMatch[]; onMatchClick: (m: ApiResultMatch) => void; now: number }) {
  const [open, setOpen] = useState(true);
  const hasLive = matches.some(m => m.live);
  return (
    <div style={{
      background: "#fff", borderRadius: 12, overflow: "hidden",
      border: `1px solid ${hasLive ? "rgba(229,57,53,0.25)" : "var(--border)"}`,
      marginBottom: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    }}>
      <div onClick={() => setOpen(o => !o)} style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "9px 14px", background: "var(--green-light)",
        cursor: "pointer", borderBottom: open ? "1px solid var(--border)" : "none",
        userSelect: "none",
      }}>
        <LeagueFlag name={league} />
        <span style={{ flex: 1, color: "var(--dark)", fontSize: 12, fontWeight: 700 }}>{league}</span>
        {hasLive && (
          <span style={{
            fontSize: 8, fontWeight: 800, color: "#fff", background: "#e53935",
            borderRadius: 4, padding: "1px 5px", animation: "livePulse 1.4s ease-in-out infinite",
          }}>LIVE</span>
        )}
        <span style={{
          fontSize: 10, color: "var(--text-muted)", background: "#fff",
          borderRadius: 10, padding: "1px 8px", border: "1px solid var(--border)",
        }}>{matches.length}</span>
        <ChevronDown size={14} color="var(--text-muted)"
          style={{ transform: open ? "none" : "rotate(-90deg)", transition: "transform 0.2s" }} />
      </div>
      {open && matches.map(m => (
        <ResultRow key={m.id} match={m} onClick={() => onMatchClick(m)} now={now} />
      ))}
    </div>
  );
}

function SportSection({
  sportCode, matches, onMatchClick, now,
}: { sportCode: string; matches: ApiResultMatch[]; onMatchClick: (m: ApiResultMatch) => void; now: number }) {
  const [open, setOpen] = useState(true);
  const name = SPORT_NAMES[sportCode] ?? sportCode;
  const icon = SPORT_ICONS[sportCode] ?? "🏆";
  const liveCount = matches.filter(m => m.live).length;

  const byLeague: Record<string, ApiResultMatch[]> = {};
  for (const m of matches) {
    if (!byLeague[m.leagueName]) byLeague[m.leagueName] = [];
    byLeague[m.leagueName].push(m);
  }

  return (
    <div style={{ marginBottom: 4 }}>
      <div onClick={() => setOpen(o => !o)} style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 14px",
        background: "linear-gradient(135deg, #1a6e3d, #2DA962)",
        cursor: "pointer", userSelect: "none",
        borderRadius: open ? "10px 10px 0 0" : 10,
      }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ flex: 1, color: "#fff", fontWeight: 700, fontSize: 13, fontFamily: "Oswald, sans-serif", letterSpacing: 0.5 }}>
          {name.toUpperCase()}
        </span>
        {liveCount > 0 && (
          <span style={{
            background: "#e53935", borderRadius: 10, padding: "1px 8px",
            fontSize: 10, color: "#fff", fontWeight: 700,
            animation: "livePulse 1.4s ease-in-out infinite",
          }}>● {liveCount} Live</span>
        )}
        <span style={{
          background: "rgba(255,255,255,0.2)", borderRadius: 10,
          padding: "1px 10px", fontSize: 11, color: "#fff", fontWeight: 600,
        }}>{matches.length}</span>
        <ChevronDown size={15} color="rgba(255,255,255,0.8)"
          style={{ transform: open ? "none" : "rotate(-90deg)", transition: "transform 0.2s" }} />
      </div>
      {open && (
        <div style={{
          background: "var(--bg-light)", padding: "8px 8px",
          border: "1px solid var(--border)", borderTop: "none",
          borderRadius: "0 0 10px 10px", marginBottom: 10,
        }}>
          {Object.entries(byLeague).map(([league, ms]) => (
            <LeagueGroup key={league} league={league} matches={ms} onMatchClick={onMatchClick} now={now} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Detail: stat row ──────────────────────────────────────────────────────────
function StatRow({
  label, home, away, homeWins, highlight = false,
}: {
  label: string; home: string | number; away: string | number;
  homeWins?: boolean; highlight?: boolean;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "9px 0",
      borderBottom: "1px solid var(--border2)",
      background: highlight ? "rgba(45,169,98,0.04)" : "transparent",
    }}>
      <span style={{
        fontSize: highlight ? 16 : 14, fontWeight: 800, minWidth: 40, textAlign: "right",
        color: homeWins === true ? "var(--green)" : highlight ? "var(--dark)" : "var(--text-secondary)",
        fontFamily: "Oswald, sans-serif",
      }}>{home}</span>
      <span style={{
        flex: 1, textAlign: "center", fontSize: highlight ? 11 : 10,
        color: highlight ? "var(--dark)" : "var(--text-muted)",
        fontWeight: highlight ? 700 : 600,
      }}>{label}</span>
      <span style={{
        fontSize: highlight ? 16 : 14, fontWeight: 800, minWidth: 40, textAlign: "left",
        color: homeWins === false ? "var(--green)" : highlight ? "var(--dark)" : "var(--text-secondary)",
        fontFamily: "Oswald, sans-serif",
      }}>{away}</span>
    </div>
  );
}

function DetailSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{
      margin: "10px 12px 0", background: "#fff", borderRadius: 12,
      border: "1px solid var(--border)", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <div style={{ padding: "11px 14px", borderBottom: "1px solid var(--border2)", display: "flex", alignItems: "center", gap: 6 }}>
        {icon}
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--dark)", fontFamily: "Oswald, sans-serif", letterSpacing: 0.3 }}>{title}</span>
      </div>
      <div style={{ padding: "4px 14px 10px" }}>
        {children}
      </div>
    </div>
  );
}

function ColHeader({ home, away }: { home: string; away: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0 8px", borderBottom: "2px solid var(--border)" }}>
      <span style={{ flex: 1, textAlign: "right", fontSize: 11, fontWeight: 700, color: "var(--dark)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{home}</span>
      <span style={{ minWidth: 80 }} />
      <span style={{ flex: 1, textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--dark)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{away}</span>
    </div>
  );
}

// ── Match detail view ─────────────────────────────────────────────────────────
function MatchDetail({ match, onBack, now }: { match: ApiResultMatch; onBack: () => void; now: number }) {
  const { matchResult: r } = match;
  const status = getMatchStatus(match);
  const score = extractScore(r, status.isLive);
  const result = (!status.isLive && score) ? getResult(score) : null;
  const ht = getHalfTime(r);
  const sh = getSecondHalf(r);
  const ot = getOvertime(r);
  const pen = getPenalties(r, score);
  const corners = getCorners(r);
  const cards = getCards(r);
  const shots = getShots(r);
  const periods = getPeriods(r);
  const timeRanges = getTimeRangeGoals(r);
  const minute = getLiveMinute(match, now);

  const kickoff = new Date(match.kickOffTime);
  const flagUrl = getLeagueFlagUrl(match.leagueName);
  const sportName = SPORT_NAMES[match.sport] ?? match.sport;
  const sportIcon = SPORT_ICONS[match.sport] ?? "🏆";
  const winner = result === "home" ? match.home : result === "away" ? match.away : null;

  const rt = r.rt ?? "";
  const isTwoHalves = ["S","HB","RL","AM"].includes(match.sport);

  const lastGoalTimeH = validScore(r.hs.LAST_GOAL_TIME);
  const lastGoalTimeA = validScore(r.as.LAST_GOAL_TIME);
  const firstGoalTimeH = validScore(r.hs.FIRST_GOAL_TIME);
  const firstGoalTimeA = validScore(r.as.FIRST_GOAL_TIME);

  // Determine the score label shown in hero (Full Time vs In Progress)
  const heroLabel = status.isLive
    ? (minute !== null ? `${minute}'` : (status.liveDetail ?? "Live"))
    : "Full Time";

  return (
    <div style={{ background: "var(--bg-light)", minHeight: "100vh", paddingBottom: 80 }}>

      {/* Back bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "11px 14px",
        background: "#fff", borderBottom: "1px solid var(--border)",
        position: "sticky", top: 54, zIndex: 10,
      }}>
        <button onClick={onBack} style={{
          display: "flex", alignItems: "center", gap: 4,
          color: "var(--green)", fontWeight: 700, fontSize: 13,
          background: "none", border: "none", cursor: "pointer", padding: 0,
        }}>
          <ArrowLeft size={17} /> Back to Results
        </button>
        {status.isLive && (
          <span style={{
            fontSize: 10, fontWeight: 800, color: "#fff", background: "#e53935",
            borderRadius: 20, padding: "3px 10px",
            animation: "livePulse 1.4s ease-in-out infinite",
          }}>● LIVE{minute !== null ? ` · ${minute}'` : ""}</span>
        )}
      </div>

      {/* Hero scoreboard */}
      <div style={{
        background: status.isLive
          ? "linear-gradient(135deg, #7f0000 0%, #e53935 100%)"
          : "linear-gradient(135deg, #1a6e3d 0%, #2DA962 100%)",
        padding: "20px 16px 24px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 16 }}>
          {flagUrl
            ? <img src={flagUrl} alt="" width={18} height={12}
                style={{ borderRadius: 2, objectFit: "cover" }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            : <Globe size={13} color="rgba(255,255,255,0.6)" />
          }
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: 600, letterSpacing: 0.4 }}>
            {match.leagueName}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{
              fontSize: 13, fontWeight: 700, lineHeight: 1.3, marginBottom: 10,
              color: result === "home" ? "#ffe60f" : "rgba(255,255,255,0.9)",
            }}>{match.home}</div>
            <div style={{
              fontSize: 54, fontWeight: 900, lineHeight: 1,
              color: result === "home" ? "#ffe60f" : "#fff",
              fontFamily: "Oswald, sans-serif",
              textShadow: result === "home" ? "0 0 24px rgba(255,230,15,0.5)" : "none",
            }}>{score?.home ?? "-"}</div>
          </div>

          <div style={{ textAlign: "center", flexShrink: 0, paddingTop: 30 }}>
            <div style={{
              background: "rgba(255,255,255,0.2)", borderRadius: 6,
              padding: "3px 10px", fontSize: 10, fontWeight: 800,
              color: "#fff", letterSpacing: 0.5,
              ...(status.isLive ? { animation: "livePulse 1.4s ease-in-out infinite" } : {}),
            }}>{heroLabel}</div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 24, fontWeight: 700, margin: "4px 0" }}>–</div>
            {ht && !status.isLive && (
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>
                Half Time {ht.home}–{ht.away}
              </div>
            )}
            {status.isLive && ht && (
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
                HT {ht.home}–{ht.away}
              </div>
            )}
          </div>

          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{
              fontSize: 13, fontWeight: 700, lineHeight: 1.3, marginBottom: 10,
              color: result === "away" ? "#ffe60f" : "rgba(255,255,255,0.9)",
            }}>{match.away}</div>
            <div style={{
              fontSize: 54, fontWeight: 900, lineHeight: 1,
              color: result === "away" ? "#ffe60f" : "#fff",
              fontFamily: "Oswald, sans-serif",
              textShadow: result === "away" ? "0 0 24px rgba(255,230,15,0.5)" : "none",
            }}>{score?.away ?? "-"}</div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 14 }}>
          {status.isLive ? (
            <span style={{
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff", fontSize: 11, fontWeight: 700,
              padding: "4px 16px", borderRadius: 20,
            }}>
              {status.liveDetail ?? "In Progress"}{minute !== null ? ` · ${minute}'` : ""}
            </span>
          ) : winner ? (
            <span style={{
              background: "rgba(255,230,15,0.18)", border: "1px solid rgba(255,230,15,0.4)",
              color: "#ffe60f", fontSize: 11, fontWeight: 700,
              padding: "4px 16px", borderRadius: 20,
              display: "inline-flex", alignItems: "center", gap: 5,
            }}>
              <Trophy size={11} color="#ffe60f" /> {winner} won
            </span>
          ) : result === "draw" ? (
            <span style={{
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
              color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: 700,
              padding: "4px 16px", borderRadius: 20,
            }}>Match ended in a Draw</span>
          ) : null}
        </div>
      </div>

      {/* Match Info */}
      <DetailSection icon={<Activity size={14} color="var(--green)" />} title="MATCH INFO">
        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 8 }}>
          {[
            { icon: <Calendar size={13} color="var(--green)" />, label: "Date", value: kickoff.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }) },
            { icon: <Clock size={13} color="var(--green)" />, label: "Kick-off", value: kickoff.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) },
            { icon: <Trophy size={13} color="var(--green)" />, label: "Competition", value: match.leagueName },
            { icon: <span style={{ fontSize: 13 }}>{sportIcon}</span>, label: "Sport", value: sportName },
            { icon: <Activity size={13} color="var(--green)" />, label: "Result Type", value: r.rt ?? "–" },
            { icon: <Activity size={13} color={status.bg} />, label: "Status", value: status.isLive ? `Live · ${status.liveDetail ?? ""}${minute !== null ? ` · ${minute}'` : ""}` : status.text },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ marginTop: 1, flexShrink: 0, width: 16, display: "flex", justifyContent: "center" }}>{icon}</div>
              <div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: 12, color: "var(--dark)", fontWeight: 500, marginTop: 1 }}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      </DetailSection>

      {/* Score Breakdown */}
      <DetailSection icon={<TrendingUp size={14} color="var(--green)" />} title="SCORE BREAKDOWN">
        <ColHeader home={match.home} away={match.away} />

        {score && (
          <StatRow label={status.isLive ? "Current Score" : "Full Time"} home={score.home} away={score.away} highlight
            homeWins={result === "home" ? true : result === "away" ? false : undefined} />
        )}
        {pen && (
          <StatRow label="Penalties" home={pen.home} away={pen.away}
            homeWins={pen.home > pen.away ? true : pen.away > pen.home ? false : undefined} />
        )}
        {ot && (
          <StatRow label="Extra Time" home={ot.home} away={ot.away}
            homeWins={ot.home > ot.away ? true : ot.away > ot.home ? false : undefined} />
        )}
        {ht && isTwoHalves && (
          <StatRow label="First Half" home={ht.home} away={ht.away}
            homeWins={ht.home > ht.away ? true : ht.away > ht.home ? false : undefined} />
        )}
        {sh && isTwoHalves && sh.home !== score?.home && sh.away !== score?.away && (
          <StatRow label="Second Half" home={sh.home} away={sh.away}
            homeWins={sh.home > sh.away ? true : sh.away > sh.home ? false : undefined} />
        )}
        {getPeriods(r).map((p, i) => (
          <StatRow key={i} label={getPeriodLabel(i, rt)} home={p.home} away={p.away}
            homeWins={p.home > p.away ? true : p.away > p.home ? false : undefined} />
        ))}
        {(() => {
          const h = validScore(r.hs.FULLTIME_GAMES);
          const a = validScore(r.as.FULLTIME_GAMES);
          return h !== null && a !== null && h > 0
            ? <StatRow label="Total Games" home={h} away={a} homeWins={h > a ? true : a > h ? false : undefined} /> : null;
        })()}
        {(() => {
          const h = validScore(r.hs.FULLTIME_POINTS);
          const a = validScore(r.as.FULLTIME_POINTS);
          return h !== null && a !== null && h > 0
            ? <StatRow label="Total Points" home={h} away={a} homeWins={h > a ? true : a > h ? false : undefined} /> : null;
        })()}
      </DetailSection>

      {/* Goal times (football) */}
      {(lastGoalTimeH !== null || firstGoalTimeH !== null) && (
        <DetailSection icon={<span style={{ fontSize: 14 }}>⚽</span>} title="GOAL TIMES">
          <ColHeader home={match.home} away={match.away} />
          {firstGoalTimeH !== null && firstGoalTimeA !== null && (
            <StatRow label="First Goal (min)"
              home={firstGoalTimeH > 0 ? `${firstGoalTimeH}'` : "–"}
              away={firstGoalTimeA > 0 ? `${firstGoalTimeA}'` : "–"} />
          )}
          {lastGoalTimeH !== null && lastGoalTimeA !== null && (
            <StatRow label="Last Goal (min)"
              home={lastGoalTimeH > 0 ? `${lastGoalTimeH}'` : "–"}
              away={lastGoalTimeA > 0 ? `${lastGoalTimeA}'` : "–"} />
          )}
        </DetailSection>
      )}

      {/* Goals by time range */}
      {timeRanges.length > 0 && (
        <DetailSection icon={<span style={{ fontSize: 14 }}>📊</span>} title="GOALS BY TIME RANGE">
          <ColHeader home={match.home} away={match.away} />
          {timeRanges.map(tr => (
            <StatRow key={tr.label} label={tr.label} home={tr.home} away={tr.away}
              homeWins={tr.home > tr.away ? true : tr.away > tr.home ? false : undefined} />
          ))}
        </DetailSection>
      )}

      {/* Corners */}
      {(corners.total || corners.fh || corners.sh || corners.current) && (
        <DetailSection icon={<span style={{ fontSize: 14 }}>🚩</span>} title="CORNERS">
          <ColHeader home={match.home} away={match.away} />
          {(corners.total ?? corners.current) && (
            <StatRow label={status.isLive ? "Corners (so far)" : "Full Time"} home={(corners.total ?? corners.current)!.home} away={(corners.total ?? corners.current)!.away} highlight
              homeWins={(corners.total ?? corners.current)!.home > (corners.total ?? corners.current)!.away ? true : (corners.total ?? corners.current)!.away > (corners.total ?? corners.current)!.home ? false : undefined} />
          )}
          {corners.fh && <StatRow label="First Half" home={corners.fh.home} away={corners.fh.away} homeWins={corners.fh.home > corners.fh.away ? true : corners.fh.away > corners.fh.home ? false : undefined} />}
          {corners.sh && <StatRow label="Second Half" home={corners.sh.home} away={corners.sh.away} homeWins={corners.sh.home > corners.sh.away ? true : corners.sh.away > corners.sh.home ? false : undefined} />}
        </DetailSection>
      )}

      {/* Cards */}
      {(cards.ftYellow || cards.ftRed) && (
        <DetailSection icon={<span style={{ fontSize: 14 }}>🟨</span>} title="CARDS">
          <ColHeader home={match.home} away={match.away} />
          {cards.ftYellow && <StatRow label={status.isLive ? "Yellow (so far)" : "Yellow Cards"} home={cards.ftYellow.home} away={cards.ftYellow.away} highlight />}
          {cards.htYellow && <StatRow label="Yellow (1st Half)" home={cards.htYellow.home} away={cards.htYellow.away} />}
          {cards.shYellow && <StatRow label="Yellow (2nd Half)" home={cards.shYellow.home} away={cards.shYellow.away} />}
          {cards.ftRed && <StatRow label="Red Cards" home={cards.ftRed.home} away={cards.ftRed.away} />}
        </DetailSection>
      )}

      {/* Shots */}
      {shots && (
        <DetailSection icon={<span style={{ fontSize: 14 }}>⚡</span>} title="SHOTS">
          <ColHeader home={match.home} away={match.away} />
          <StatRow label="Total Shots" home={shots.home} away={shots.away} highlight
            homeWins={shots.home > shots.away ? true : shots.away > shots.home ? false : undefined} />
        </DetailSection>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(today));
  const [activeSport, setActiveSport] = useState<string>("ALL");
  const [selected, setSelected] = useState<ApiResultMatch | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [now, setNow] = useState(Date.now());
  const dateScrollRef = useRef<HTMLDivElement>(null);
  const dates = buildDateList();

  // ── Cache-backed results with smart polling ────────────────────────────────
  const { data: cacheData, loading, refresh } = useResultsCache(selectedDate);
  const resultsMap = cacheData?.resultsMap ?? {};
  const error = cacheData?.error ?? false;

  useEffect(() => {
    setSelected(null);
    setActiveSport("ALL");
    setStatusFilter("ALL");
  }, [selectedDate]);

  // Keep selected match in sync when cache updates
  useEffect(() => {
    if (!selected || !cacheData) return;
    const allMatches = Object.values(cacheData.resultsMap).flat();
    const updated = allMatches.find(m => m.id === selected.id);
    if (updated) setSelected(updated);
  }, [cacheData]);

  const hasLiveMatches = useCallback(() => cacheData?.hasLive ?? false, [cacheData]);

  // ── Per-second clock tick for live minute display ──────────────────────────
  useEffect(() => {
    if (!hasLiveMatches()) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [hasLiveMatches]);

  // ── Scroll date list to today on mount ────────────────────────────────────
  useEffect(() => {
    if (dateScrollRef.current) {
      dateScrollRef.current.scrollLeft = dateScrollRef.current.scrollWidth;
    }
  }, []);

  // ── Render detail view ────────────────────────────────────────────────────
  if (selected) {
    return <MatchDetail match={selected} onBack={() => setSelected(null)} now={now} />;
  }

  const allSportEntries = sortedSportEntries(resultsMap);
  const sportCodes = allSportEntries.map(([c]) => c);

  // Status filter helper
  function matchPassesStatus(m: ApiResultMatch, filter: string): boolean {
    if (filter === "ALL") return true;
    const cat = getMatchStatus(m).category;
    if (filter === "LIVE")      return cat === "live";
    if (filter === "ENDED")     return cat === "ended";
    if (filter === "POSTPONED") return cat === "postponed";
    if (filter === "CANCELLED") return cat === "abandoned";
    return true;
  }

  const sportFilteredEntries = activeSport === "ALL" ? allSportEntries : allSportEntries.filter(([c]) => c === activeSport);
  const displayEntries = sportFilteredEntries
    .map(([c, ms]) => [c, ms.filter(m => matchPassesStatus(m, statusFilter))] as [string, ApiResultMatch[]])
    .filter(([, ms]) => ms.length > 0);

  const totalMatches = displayEntries.reduce((s, [, ms]) => s + ms.length, 0);
  const totalLive = Object.values(resultsMap).reduce((s, ms) => s + ms.filter(m => isLiveMatch(m)).length, 0);

  // Count per status category across current sport filter
  const statusCounts = {
    ALL:       sportFilteredEntries.reduce((s, [, ms]) => s + ms.length, 0),
    LIVE:      sportFilteredEntries.reduce((s, [, ms]) => s + ms.filter(m => isLiveMatch(m)).length, 0),
    ENDED:     sportFilteredEntries.reduce((s, [, ms]) => s + ms.filter(m => getMatchStatus(m).category === "ended").length, 0),
    POSTPONED: sportFilteredEntries.reduce((s, [, ms]) => s + ms.filter(m => getMatchStatus(m).category === "postponed").length, 0),
    CANCELLED: sportFilteredEntries.reduce((s, [, ms]) => s + ms.filter(m => getMatchStatus(m).category === "abandoned").length, 0),
  };

  return (
    <div style={{ background: "var(--bg-light)", minHeight: "100vh", paddingBottom: 80 }}>

      <div style={{ background: "#fff", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px 10px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: "var(--dark)", margin: 0, fontFamily: "Oswald, sans-serif", letterSpacing: 0.3 }}>
                Results
              </h1>
              {totalLive > 0 && (
                <span style={{
                  fontSize: 9, fontWeight: 800, color: "#fff", background: "#e53935",
                  borderRadius: 10, padding: "2px 8px",
                  animation: "livePulse 1.4s ease-in-out infinite",
                }}>● {totalLive} LIVE</span>
              )}
            </div>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>
              {loading ? "Loading…" : `${totalMatches} matches · ${selectedDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`}
            </p>
          </div>
          <button
            onClick={refresh}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "var(--green-light)", border: "1px solid var(--border)",
              borderRadius: 8, padding: "7px 12px",
              color: "var(--green)", fontSize: 11, fontWeight: 700, cursor: "pointer",
            }}
          >
            <RefreshCw size={12} style={loading ? { animation: "spin 0.8s linear infinite" } : {}} />
            Refresh
          </button>
        </div>

        {/* Date scroller */}
        <div ref={dateScrollRef} style={{
          display: "flex", gap: 6, overflowX: "auto",
          padding: "0 14px 10px", scrollbarWidth: "none",
        }}>
          {dates.map((d, i) => {
            const isSelected = isSameDay(d, selectedDate);
            const isToday = isSameDay(d, today);
            return (
              <button key={i} onClick={() => setSelectedDate(new Date(d))} style={{
                flexShrink: 0,
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "6px 10px", borderRadius: 10, border: "none",
                background: isSelected ? "var(--green)" : "var(--green-light)",
                cursor: "pointer", transition: "all 0.15s", minWidth: 52,
              }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: isSelected ? "rgba(255,255,255,0.8)" : "var(--text-muted)", letterSpacing: 0.3 }}>
                  {dayLabel(d)}
                </span>
                <span style={{
                  fontSize: 16, fontWeight: 900,
                  color: isSelected ? "#fff" : isToday ? "var(--green)" : "var(--dark)",
                  fontFamily: "Oswald, sans-serif", lineHeight: 1.2,
                }}>{d.getDate()}</span>
                <span style={{ fontSize: 9, color: isSelected ? "rgba(255,255,255,0.7)" : "var(--text-muted)" }}>
                  {d.toLocaleDateString("en-GB", { month: "short" })}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sport filter tabs */}
        {!loading && sportCodes.length > 1 && (
          <div style={{ display: "flex", gap: 0, overflowX: "auto", scrollbarWidth: "none", borderTop: "1px solid var(--border2)" }}>
            {(["ALL", ...sportCodes] as string[]).map(code => {
              const count = code === "ALL" ? allSportEntries.reduce((s, [, ms]) => s + ms.length, 0) : (resultsMap[code]?.length ?? 0);
              const name = code === "ALL" ? "All" : (SPORT_NAMES[code] ?? code);
              const icon = code === "ALL" ? "🏆" : (SPORT_ICONS[code] ?? "•");
              return (
                <button key={code} onClick={() => { setActiveSport(code); setStatusFilter("ALL"); }} style={{
                  flexShrink: 0, display: "flex", alignItems: "center", gap: 4,
                  padding: "8px 12px", border: "none", background: "none",
                  borderBottom: activeSport === code ? "2px solid var(--green)" : "2px solid transparent",
                  color: activeSport === code ? "var(--green)" : "var(--text-muted)",
                  fontWeight: activeSport === code ? 700 : 500, fontSize: 12, cursor: "pointer",
                }}>
                  <span>{icon}</span> {name}
                  <span style={{
                    fontSize: 9,
                    background: activeSport === code ? "var(--green)" : "var(--border)",
                    color: activeSport === code ? "#fff" : "var(--text-muted)",
                    borderRadius: 8, padding: "1px 5px", marginLeft: 2,
                  }}>{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Status filter tabs */}
      {!loading && (
        <div style={{ display: "flex", gap: 0, overflowX: "auto", scrollbarWidth: "none", background: "#fff", borderBottom: "2px solid var(--border2)" }}>
          {([
            { key: "ALL",       label: "All",        color: "var(--green)" },
            { key: "LIVE",      label: "● Live",     color: "#e53935" },
            { key: "ENDED",     label: "Ended",      color: "#2DA962" },
            { key: "POSTPONED", label: "Postponed",  color: "#f57c00" },
            { key: "CANCELLED", label: "Cancelled",  color: "#9e9e9e" },
          ] as { key: string; label: string; color: string }[])
            .filter(({ key }) => key === "ALL" || statusCounts[key as keyof typeof statusCounts] > 0)
            .map(({ key, label, color }) => {
              const isActive = statusFilter === key;
              const cnt = statusCounts[key as keyof typeof statusCounts];
              return (
                <button key={key} onClick={() => setStatusFilter(key)} style={{
                  flexShrink: 0, display: "flex", alignItems: "center", gap: 5,
                  padding: "9px 14px", border: "none", background: "none",
                  borderBottom: isActive ? `2px solid ${color}` : "2px solid transparent",
                  color: isActive ? color : "var(--text-muted)",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 12, cursor: "pointer", marginBottom: -2,
                  fontFamily: key === "LIVE" ? "Oswald, sans-serif" : undefined,
                  ...(key === "LIVE" && isActive ? { animation: "livePulse 1.4s ease-in-out infinite" } : {}),
                }}>
                  {label}
                  <span style={{
                    fontSize: 9, fontWeight: 700,
                    background: isActive ? color : "var(--border)",
                    color: isActive ? "#fff" : "var(--text-muted)",
                    borderRadius: 8, padding: "1px 5px",
                  }}>{cnt}</span>
                </button>
              );
            })}
        </div>
      )}

      <div style={{ padding: "10px 10px 0" }}>
        {loading && (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{
              width: 34, height: 34,
              border: "3px solid var(--border)", borderTop: "3px solid var(--green)",
              borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
            }} />
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading results…</p>
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 14 }}>Could not load results</p>
            <button onClick={refresh} style={{
              background: "var(--green)", color: "#fff", border: "none",
              borderRadius: 10, padding: "10px 28px", fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}>Try again</button>
          </div>
        )}

        {!loading && !error && totalMatches === 0 && (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <Calendar size={40} style={{ color: "var(--border)", margin: "0 auto 12px", display: "block" }} />
            <p style={{ color: "var(--dark)", fontSize: 14, fontWeight: 600 }}>No results available</p>
            <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4 }}>
              {selectedDate.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long" })}
            </p>
          </div>
        )}

        {!loading && !error && totalMatches > 0 && displayEntries.map(([code, matches]) => (
          <SportSection key={code} sportCode={code} matches={matches} onMatchClick={setSelected} now={now} />
        ))}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.55} }
      `}</style>
    </div>
  );
}
