const BASE = "https://www.topbet.ug/restapi/offer/en";
const Q = "annex=13&desktopVersion=1.45.4.37&locale=en";

export interface BetPick {
  bpc: number;
  tt: number;
  s: "U" | "L";
  ov: number;
  bc: number;
  sv: string;
}

export type BetMap = Record<string, Record<string, BetPick>>;

export interface ApiMatch {
  id: number;
  matchCode: number;
  home: string;
  away: string;
  kickOffTime: number;
  status: number;
  blocked: boolean;
  favourite: boolean;
  params?: Record<string, string>;
  sport: string;
  leagueId: number;
  leagueName: string;
  leagueShort?: string;
  leagueToken: string;
  round: number;
  oddsCount: number;
  conditions: string;
  betMap: BetMap;
  live: boolean;
  superMatch: boolean;
  bonusDisabled: boolean;
  brMatchId?: number;
  homeId?: number;
  awayId?: number;
  sourceId?: string;
  hasBonusTip: boolean;
}

export interface ApiMatchDetails extends ApiMatch {
  brMatchId: number;
}

export interface MatchListResponse {
  systemTime: string;
  esMatches: ApiMatch[];
  totalMatchCount?: number;
}

export const SPORTS: { code: string; name: string }[] = [
  { code: "S", name: "Football" },
  { code: "B", name: "Basketball" },
  { code: "T", name: "Tennis" },
  { code: "V", name: "Volleyball" },
  { code: "BB", name: "Baseball" },
  { code: "MM", name: "MMA" },
  { code: "HB", name: "Handball" },
  { code: "RL", name: "Rugby" },
  { code: "SP", name: "Cycling" },
];

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "x-requested-with": "XMLHttpRequest",
    },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

// ── Results API types ────────────────────────────────────────────────────────
export interface MatchScores {
  FULLTIME?: number;
  FIRST_HALF?: number;
  SECOND_HALF?: number;
  SECOND_HALF_WITH_OT?: number;
  FULLTIME_SETS?: number;
  FULLTIME_GAMES?: number;
  FULLTIME_POINTS?: number;
  FULLTIME_PERIODS?: number;
  FULLTIME_CORNERS?: number;
  FIRSTHALF_CORNERS?: number;
  SECONDHALF_CORNERS?: number;
  CURRENT_CORNERS?: number;
  FULLTIME_YC?: number;
  FULLTIME_RC?: number;
  FULLTIME_CARDS?: number;
  HALFTIME_YC?: number;
  HALFTIME_RC?: number;
  SECONDTIME_YC?: number;
  OVERTIME?: number;
  PENALTIES?: number;
  CURRENT_SCORE?: number;
  LAST_GOAL_TIME?: number;
  FIRST_GOAL_TIME?: number;
  FULLTIME_GOAL_MINUTES_SUM?: number;
  HALF_TIME_GOAL_MINUTES_SUM?: number;
  FULLTIME_SHOTS?: number;
  [key: string]: number | undefined;
}

export interface MatchResult {
  mi: number;
  mc: number;
  rt: string;
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
  /** true when the match is currently in progress */
  live: boolean;
  sport: string;
  leagueId: number;
  leagueName: string;
  leagueShort?: string;
  matchResult: MatchResult;
  resultsType: string;
  tmstmp?: number;
}

export interface ResultsResponse {
  resultsMap: Record<string, ApiResultMatch[]>;
}

export const SPORT_NAMES: Record<string, string> = {
  S:  "Football",
  B:  "Basketball",
  T:  "Tennis",
  V:  "Volleyball",
  BB: "Baseball",
  MM: "MMA",
  HB: "Handball",
  RL: "Rugby",
  IH: "Ice Hockey",
  AM: "Am. Football",
  SP: "Cycling",
  ES: "E-Sports",
};

export const SPORT_ICONS: Record<string, string> = {
  S:  "⚽",
  B:  "🏀",
  T:  "🎾",
  V:  "🏐",
  BB: "⚾",
  MM: "🥊",
  HB: "🤾",
  RL: "🏉",
  IH: "🏒",
  AM: "🏈",
  SP: "🚴",
  ES: "🎮",
};

/** Returns a valid score (≥0), or null if the value means N/A (-1 or -2) */
export function validScore(v: number | undefined): number | null {
  return v !== undefined && v >= 0 ? v : null;
}

/** Extract the primary home/away score for display */
export function extractScore(r: MatchResult): { home: number; away: number } | null {
  const hs = r.hs;
  const as = r.as;
  for (const key of ["FULLTIME", "FULLTIME_SETS", "FULLTIME_PERIODS", "CURRENT_SCORE"]) {
    const h = validScore(hs[key]);
    const a = validScore(as[key]);
    if (h !== null && a !== null) return { home: h, away: a };
  }
  return null;
}

/** Format a date as DD.MM.YYYY. (with trailing dot) for the results API */
export function formatResultsDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}.${m}.${y}.`;
}

export const api = {
  matches: (sport = "S", from = 0) =>
    fetchJson<MatchListResponse>(
      `${BASE}/sport/${sport}/mob?${Q}&offset=200&from=${from}&sort=LEAGUE`
    ),

  matchDetails: (id: number) =>
    fetchJson<ApiMatchDetails>(`${BASE}/match/${id}?${Q}`),

  boostedMatches: (sport = "S") =>
    fetchJson<MatchListResponse>(
      `https://www.topbet.ug/restapi/offer/en/bonusTipBetMap/mob?${Q}&sport=${sport}&offset=30`
    ),

  results: (date: Date) =>
    fetchJson<ResultsResponse>(
      `https://www.topbet.ug/restapi/results/en/day/${formatResultsDate(date)}?desktopVersion=1.45.4.37&locale=en`
    ),
};

export function getOdds1X2(betMap: BetMap): { home: number; draw: number; away: number } | null {
  const h = betMap["1"]?.["NULL"]?.ov;
  const d = betMap["2"]?.["NULL"]?.ov;
  const a = betMap["3"]?.["NULL"]?.ov;
  if (!h || !d || !a) return null;
  return { home: h, draw: d, away: a };
}

export function getBoostedOdds(betMap: BetMap): { home: number; draw: number; away: number } | null {
  const entries = Object.entries(betMap)
    .map(([tt, svMap]) => {
      const pick = Object.values(svMap)[0];
      return pick ? { tt: Number(tt), ov: pick.ov, s: pick.s } : null;
    })
    .filter((x): x is { tt: number; ov: number; s: string } => x !== null && x.s === "U" && x.ov > 1)
    .sort((a, b) => a.tt - b.tt);

  if (entries.length >= 3) {
    return { home: entries[0].ov, draw: entries[1].ov, away: entries[2].ov };
  }
  return null;
}

export function formatKickOff(kickOffTime: number): string {
  const d = new Date(kickOffTime);
  const now = new Date();
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, now)) return `Today ${time}`;
  if (sameDay(d, tomorrow)) return `Tomorrow ${time}`;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) + " " + time;
}

const LEAGUE_ISO: Record<string, string> = {
  ENGLAND: "gb-eng",
  ENGLISH: "gb-eng",
  SCOTLAND: "gb-sct",
  WALES: "gb-wls",
  SPAIN: "es",
  GERMANY: "de",
  ITALY: "it",
  FRANCE: "fr",
  PORTUGAL: "pt",
  NETHERLANDS: "nl",
  BELGIUM: "be",
  TURKEY: "tr",
  RUSSIA: "ru",
  UKRAINE: "ua",
  BRAZIL: "br",
  ARGENTINA: "ar",
  COLOMBIA: "co",
  CHILE: "cl",
  MEXICO: "mx",
  USA: "us",
  AUSTRALIA: "au",
  JAPAN: "jp",
  CHINA: "cn",
  SOUTH: "za",
  NIGERIA: "ng",
  GHANA: "gh",
  KENYA: "ke",
  UGANDA: "ug",
  EGYPT: "eg",
  MOROCCO: "ma",
  IVORY: "ci",
  CAMEROON: "cm",
  SENEGAL: "sn",
  ZIMBABWE: "zw",
  TANZANIA: "tz",
  ETHIOPIA: "et",
  SWEDEN: "se",
  NORWAY: "no",
  DENMARK: "dk",
  FINLAND: "fi",
  AUSTRIA: "at",
  SWITZERLAND: "ch",
  CZECH: "cz",
  POLAND: "pl",
  GREECE: "gr",
  ROMANIA: "ro",
  HUNGARY: "hu",
  SERBIA: "rs",
  CROATIA: "hr",
  SLOVENIA: "si",
  SLOVAKIA: "sk",
  BULGARIA: "bg",
  ISRAEL: "il",
  IRAN: "ir",
  SAUDI: "sa",
  KOREA: "kr",
  INDIA: "in",
  PERU: "pe",
  ECUADOR: "ec",
  PARAGUAY: "py",
  URUGUAY: "uy",
  BOLIVIA: "bo",
  VENEZUELA: "ve",
  IRELAND: "ie",
  ICELAND: "is",
  ALBANIA: "al",
  NORTH: "mk",
};

export function getLeagueFlagUrl(leagueName: string): string | null {
  const upper = leagueName.toUpperCase();
  const words = upper.split(/[\s\-_]+/);
  for (const word of words) {
    if (LEAGUE_ISO[word]) {
      return `https://flagcdn.com/w20/${LEAGUE_ISO[word]}.png`;
    }
  }
  return null;
}

export function isMatchLive(m: ApiMatch): boolean {
  return m.live === true && m.kickOffTime < Date.now();
}

export function getLeagueFlag(leagueName: string): string {
  const n = leagueName.toUpperCase();
  if (n.includes("ENGLAND") || n.includes("PREMIER LEAGUE")) return "🏴󠁧󠁢󠁥󠁮󠁧󠁿";
  if (n.includes("SPAIN") || n.includes("LALIGA")) return "🇪🇸";
  if (n.includes("GERMANY") || n.includes("BUNDESLIGA")) return "🇩🇪";
  if (n.includes("ITALY") || n.includes("SERIE A")) return "🇮🇹";
  if (n.includes("FRANCE") || n.includes("LIGUE")) return "🇫🇷";
  if (n.includes("CHAMPIONS")) return "🏆";
  if (n.includes("WORLD CUP") || n.includes("FIFA")) return "🌍";
  if (n.includes("AFRICA") || n.includes("AFCON")) return "🌍";
  return "🌐";
}
