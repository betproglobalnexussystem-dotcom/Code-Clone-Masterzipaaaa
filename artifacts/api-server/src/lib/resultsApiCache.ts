export interface MatchScores {
  FULLTIME?: number;
  FIRST_HALF?: number;
  SECOND_HALF?: number;
  CURRENT_SCORE?: number;
  FULLTIME_SETS?: number;
  FULLTIME_PERIODS?: number;
  [key: string]: number | undefined;
}

export interface MatchResult {
  p: string;
  hs: MatchScores;
  as: MatchScores;
}

export interface ApiResultMatch {
  id: number;
  matchCode: number;
  home: string;
  away: string;
  kickOffTime: number;
  status: number;
  live: boolean;
  sport: string;
  leagueId: number;
  leagueName: string;
  matchResult: MatchResult;
}

const PLAYING_PERIODS = new Set([
  "FIRST_HALF","SECOND_HALF","PAUSE",
  "FIRST_QUARTER","SECOND_QUARTER","THIRD_QUARTER","FOURTH_QUARTER",
  "FIRST_PERIOD","SECOND_PERIOD","THIRD_PERIOD",
  "FIRST_SET","SECOND_SET","THIRD_SET","FOURTH_SET","FIFTH_SET",
  "FIRST_INNING","SECOND_INNING","THIRD_INNING","FOURTH_INNING",
  "FIFTH_INNING","SIXTH_INNING","SEVENTH_INNING","EIGHTH_INNING","NINTH_INNING",
  "FIRST_MAP","SECOND_MAP","THIRD_MAP","BREAK_TIME","IN_PROGRESS",
]);

const _cache = new Map<string, { byId: Map<number, ApiResultMatch>; fetchedAt: number }>();
const CACHE_TTL_MS = 25_000;

function formatDate(d: Date): string {
  const day = String(d.getDate()).padStart(2,"0");
  const mo  = String(d.getMonth()+1).padStart(2,"0");
  return `${day}.${mo}.${d.getFullYear()}.`;
}

export async function getMatchResult(matchId: number, kickOffTime: number): Promise<ApiResultMatch | null> {
  const date    = new Date(kickOffTime);
  const dateKey = formatDate(date);
  const now     = Date.now();

  const cached = _cache.get(dateKey);
  if (!cached || now - cached.fetchedAt > CACHE_TTL_MS) {
    try {
      const url = `https://www.topbet.ug/restapi/results/en/day/${dateKey}?desktopVersion=1.45.4.37&locale=en`;
      const res = await fetch(url, {
        headers: { Accept: "application/json", "x-requested-with": "XMLHttpRequest" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) return null;

      const data = await res.json() as { resultsMap?: Record<string, ApiResultMatch[]> };
      const byId = new Map<number, ApiResultMatch>();
      for (const matches of Object.values(data.resultsMap ?? {})) {
        for (const m of matches as ApiResultMatch[]) {
          byId.set(m.id, m);
          if (m.matchCode) byId.set(m.matchCode, m);
        }
      }
      _cache.set(dateKey, { byId, fetchedAt: now });
    } catch {
      return null;
    }
  }

  return _cache.get(dateKey)?.byId.get(matchId) ?? null;
}

export function isMatchEnded(m: ApiResultMatch): boolean {
  return (m.status === 1 || m.status === 6) && m.matchResult?.p === "END";
}

export function isMatchLive(m: ApiResultMatch): boolean {
  return m.status === 6 && PLAYING_PERIODS.has(m.matchResult?.p ?? "");
}

export function isMatchPostponed(m: ApiResultMatch): boolean {
  return m.status === 3;
}

export function isMatchAbandoned(m: ApiResultMatch): boolean {
  return m.status === 7;
}

function validScore(v: number | undefined): number | null {
  return v !== undefined && v >= 0 ? v : null;
}

export function getFullTimeScore(m: ApiResultMatch): { home: number; away: number } | null {
  const hs = m.matchResult?.hs ?? {};
  const as_ = m.matchResult?.as ?? {};
  for (const key of ["FULLTIME","FULLTIME_SETS","FULLTIME_PERIODS","CURRENT_SCORE"]) {
    const h = validScore(hs[key]);
    const a = validScore(as_[key]);
    if (h !== null && a !== null) return { home: h, away: a };
  }
  return null;
}

export function getHalfTimeScore(m: ApiResultMatch): { home: number; away: number } | null {
  const hs = m.matchResult?.hs ?? {};
  const as_ = m.matchResult?.as ?? {};
  const h = validScore(hs["FIRST_HALF"]);
  const a = validScore(as_["FIRST_HALF"]);
  return h !== null && a !== null ? { home: h, away: a } : null;
}

export function getLiveScore(m: ApiResultMatch): { home: number; away: number } | null {
  if (!isMatchLive(m)) return null;
  return getFullTimeScore(m);
}

export function getLivePeriod(m: ApiResultMatch): string {
  return m.matchResult?.p ?? "IN_PROGRESS";
}
