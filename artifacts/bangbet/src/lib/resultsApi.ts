import type { ApiResultMatch } from "./api";
import { formatResultsDate, validScore } from "./api";

const _cache = new Map<string, { byId: Map<number, ApiResultMatch>; fetchedAt: number }>();
const CACHE_TTL_MS = 30_000;

export async function getMatchResult(matchId: number, kickOffTime: number): Promise<ApiResultMatch | null> {
  const date = new Date(kickOffTime);
  const dateKey = formatResultsDate(date);
  const now = Date.now();

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
  const PLAYING = new Set([
    "FIRST_HALF","SECOND_HALF","PAUSE","FIRST_QUARTER","SECOND_QUARTER",
    "THIRD_QUARTER","FOURTH_QUARTER","FIRST_PERIOD","SECOND_PERIOD","THIRD_PERIOD",
    "FIRST_SET","SECOND_SET","THIRD_SET","FOURTH_SET","FIFTH_SET","IN_PROGRESS",
  ]);
  return m.status === 6 && PLAYING.has(m.matchResult?.p ?? "");
}

export function isMatchPostponed(m: ApiResultMatch): boolean { return m.status === 3; }
export function isMatchAbandoned(m: ApiResultMatch): boolean { return m.status === 7; }

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
  return isMatchLive(m) ? getFullTimeScore(m) : null;
}

export function getLivePeriod(m: ApiResultMatch): string {
  return m.matchResult?.p ?? "IN_PROGRESS";
}
