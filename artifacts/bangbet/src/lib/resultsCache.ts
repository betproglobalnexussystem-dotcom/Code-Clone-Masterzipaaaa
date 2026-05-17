import { api, formatResultsDate } from "./api";
import type { ApiResultMatch, ResultsResponse } from "./api";
import { useEffect, useRef, useState, useCallback } from "react";

export interface CachedDateResults {
  resultsMap: Record<string, ApiResultMatch[]>;
  byMatchId: Map<number, ApiResultMatch>;
  hasLive: boolean;
  fetchedAt: number;
  error: boolean;
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

function isLiveMatch(m: ApiResultMatch): boolean {
  return m.status === 6 && PLAYING_PERIODS.has(m.matchResult?.p ?? "");
}

const _cache = new Map<string, CachedDateResults>();

function buildByMatchId(resultsMap: Record<string, ApiResultMatch[]>): Map<number, ApiResultMatch> {
  const map = new Map<number, ApiResultMatch>();
  for (const matches of Object.values(resultsMap)) {
    for (const m of matches) {
      map.set(m.id, m);
      if (m.matchCode) map.set(m.matchCode, m);
    }
  }
  return map;
}

async function fetchAndCache(date: Date): Promise<CachedDateResults> {
  const key = formatResultsDate(date);
  try {
    const data: ResultsResponse = await api.results(date);
    const resultsMap = data.resultsMap ?? {};
    const byMatchId  = buildByMatchId(resultsMap);
    const hasLive    = Array.from(byMatchId.values()).some(isLiveMatch);
    const entry: CachedDateResults = {
      resultsMap, byMatchId, hasLive,
      fetchedAt: Date.now(), error: false,
    };
    _cache.set(key, entry);
    return entry;
  } catch {
    const existing = _cache.get(key);
    if (existing) return { ...existing, error: true };
    const empty: CachedDateResults = {
      resultsMap: {}, byMatchId: new Map(), hasLive: false,
      fetchedAt: Date.now(), error: true,
    };
    _cache.set(key, empty);
    return empty;
  }
}

export function getCachedResults(date: Date): CachedDateResults | null {
  return _cache.get(formatResultsDate(date)) ?? null;
}

export function lookupMatchById(matchId: number, date?: Date): ApiResultMatch | null {
  if (date) {
    return _cache.get(formatResultsDate(date))?.byMatchId.get(matchId) ?? null;
  }
  for (const entry of _cache.values()) {
    const m = entry.byMatchId.get(matchId);
    if (m) return m;
  }
  return null;
}

export function useResultsCache(date: Date) {
  const key = formatResultsDate(date);
  const [data, setData] = useState<CachedDateResults | null>(() => _cache.get(key) ?? null);
  const [loading, setLoading] = useState(!_cache.has(key));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dateRef  = useRef(key);
  dateRef.current = key;

  const load = useCallback(async (force = false) => {
    const cached = _cache.get(dateRef.current);
    const now    = Date.now();

    const isToday = dateRef.current === formatResultsDate(new Date());
    const hasLiveNow = cached?.hasLive ?? false;
    const staleTtl   = hasLiveNow ? 5_000 : isToday ? 30_000 : 120_000;

    if (!force && cached && now - cached.fetchedAt < staleTtl) {
      setData(cached);
      setLoading(false);
      return cached.hasLive;
    }

    const result = await fetchAndCache(new Date(date));
    if (dateRef.current === formatResultsDate(date)) {
      setData(result);
      setLoading(false);
    }
    return result.hasLive;
  }, [key]);

  useEffect(() => {
    let alive = true;

    const tick = async () => {
      if (!alive) return;
      const hasLive = await load();
      if (!alive) return;
      const interval = hasLive ? 5_000 : 30_000;
      timerRef.current = setTimeout(tick, interval);
    };

    setLoading(!_cache.has(key));
    tick();

    return () => {
      alive = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [key, load]);

  const refresh = useCallback(() => load(true), [load]);

  return { data, loading, refresh };
}

export { isLiveMatch };
