import { useState, useEffect, useRef } from "react";
import { Bell, Globe, Gift, Zap, ChevronRight, Play, TrendingUp, Gamepad2, Trophy } from "lucide-react";
import SkeletonHome from "../components/SkeletonHome";
import type { BetSelection } from "../App";
import type { Page } from "../App";
import MatchCard, { type Match } from "../components/MatchCard";
import MatchRow from "../components/MatchRow";
import { api, getOdds1X2, getDoubleChance, getBoostedOdds, formatKickOff, getLeagueFlagUrl, type ApiMatch } from "../lib/api";
import StatsModal from "../components/StatsModal";
import { collection, query, orderBy, onSnapshot, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useUnreadNotifCount } from "./NotificationsPage";

interface FirestoreBanner { id: string; title: string; url: string; active: boolean; order: number; fadeColor?: string; linkType?: string; }

function hexToRgb(hex: string): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "#1a6e3d");
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : "26,110,61";
}

const _homeCache: {
  live: Match[]; upcoming: Match[]; boosted: Match[];
  leagues: string[]; ready: boolean;
} = { live: [], upcoming: [], boosted: [], leagues: ["All"], ready: false };

const REEL = Array.from({ length: 60 }, (_, i) => i % 10);

function SlotDigit({ digit, height, posFromRight, tier }: { digit: number; height: number; posFromRight: number; tier: "gold" | "silver" | "bronze" }) {
  const prevRef = useRef(digit);
  const accumRef = useRef(digit);
  const [pos, setPos] = useState(digit);
  const [animated, setAnimated] = useState(true);

  useEffect(() => {
    const prev = prevRef.current;
    if (digit === prev) return;
    const steps = digit > prev ? digit - prev : (10 - prev + digit);
    prevRef.current = digit;
    const newAccum = accumRef.current + steps;
    if (newAccum >= 50) {
      const resetTo = newAccum % 10;
      setAnimated(false);
      setPos(resetTo);
      accumRef.current = resetTo;
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimated(true)));
    } else {
      accumRef.current = newAccum;
      setPos(newAccum);
    }
  }, [digit]);

  const baseDur = tier === "gold" ? 0.18 : tier === "silver" ? 0.65 : 2.0;
  const dur = baseDur + posFromRight * (tier === "gold" ? 0.07 : tier === "silver" ? 0.22 : 0.7);
  const clr = tier === "gold" ? "#FFD700" : tier === "silver" ? "#D8D8D8" : "#CD9B6A";

  return (
    <span style={{ display: "inline-block", overflow: "hidden", height, verticalAlign: "top" }}>
      <span style={{
        display: "flex", flexDirection: "column",
        transform: `translateY(-${pos * height}px)`,
        transition: animated ? `transform ${dur}s cubic-bezier(0.25, 0.46, 0.45, 0.94)` : "none",
        willChange: "transform", color: clr, fontWeight: 900,
      }}>
        {REEL.map((d, i) => (
          <span key={i} style={{ height, lineHeight: `${height}px`, display: "block", textAlign: "center" }}>{d}</span>
        ))}
      </span>
    </span>
  );
}

function TierCounter({ value, tier, fontSize = 18 }: { value: number; tier: "gold" | "silver" | "bronze"; fontSize?: number }) {
  const h = Math.ceil(fontSize * 1.22);
  const formatted = Math.max(0, Math.floor(value)).toLocaleString();
  const chars = formatted.split("");
  let dIdx = 0;
  const rightCounts = [...chars].reverse().map(c => !isNaN(parseInt(c)) ? dIdx++ : -1).reverse();
  const sepClr = tier === "gold" ? "rgba(255,215,0,0.5)" : tier === "silver" ? "rgba(216,216,216,0.5)" : "rgba(205,155,106,0.5)";
  return (
    <span style={{ display: "inline-flex", alignItems: "flex-start", fontFamily: "Oswald, monospace", fontWeight: 900, fontSize, lineHeight: `${h}px`, letterSpacing: 0.5 }}>
      {chars.map((char, i) => {
        const fr = rightCounts[i];
        if (fr === -1) return <span key={i} style={{ height: h, lineHeight: `${h}px`, color: sepClr, display: "inline-block" }}>{char}</span>;
        return <SlotDigit key={i} digit={parseInt(char)} height={h} posFromRight={fr} tier={tier} />;
      })}
    </span>
  );
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

function SportSvgIcon({ url, size = 22, inverted = false }: { url: string; size?: number; inverted?: boolean }) {
  return (
    <img src={url} alt="" width={size} height={size}
      style={{ objectFit: "contain", filter: inverted ? "brightness(0) invert(1)" : undefined }}
      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
  );
}

function apiMatchToMatch(m: ApiMatch, opts?: { boosted?: boolean }): Match | null {
  const odds = getOdds1X2(m.betMap);
  if (!odds) return null;
  const dc = getDoubleChance(m.betMap);
  return {
    id: String(m.id),
    apiId: m.id,
    brMatchId: m.brMatchId,
    league: m.leagueName,
    homeTeam: m.home,
    awayTeam: m.away,
    time: formatKickOff(m.kickOffTime),
    isLive: m.live === true && m.kickOffTime < Date.now(),
    odds,
    doubleChance: dc ?? undefined,
    oddsCount: m.oddsCount,
    kickOffTime: m.kickOffTime,
    overUnder: m.params?.overUnder,
    leagueId: m.leagueId,
    isBoosted: opts?.boosted,
    sport: m.sport,
  };
}

function apiBoostedToMatch(
  m: ApiMatch,
  fullBetMap?: import("../lib/api").BetMap
): Match | null {
  const odds = getBoostedOdds(m.betMap);
  if (!odds) return null;
  // Prefer DC from the full betMap (regular match endpoint has all markets)
  const dc = (fullBetMap ? getDoubleChance(fullBetMap) : null) ?? getDoubleChance(m.betMap);
  return {
    id: `b-${m.id}`,
    apiId: m.id,
    brMatchId: m.brMatchId,
    league: m.leagueName,
    homeTeam: m.home,
    awayTeam: m.away,
    time: formatKickOff(m.kickOffTime),
    isLive: m.live === true && m.kickOffTime < Date.now(),
    odds,
    doubleChance: dc ?? undefined,
    oddsCount: m.oddsCount,
    kickOffTime: m.kickOffTime,
    isBoosted: true,
  };
}

function OddsColHeaders({ hasDc }: { hasDc: boolean }) {
  return (
    <div className="league-group-header home-odds-col-headers" style={{ background: "#f8f9fa", borderBottom: "1px solid var(--border2)", position: "static" }}>
      <span style={{ flex: 1 }} />
      <div className="league-group-col-labels">
        <span className="league-group-col-label" style={{ color: "var(--text-muted)" }}>1</span>
        <span className="league-group-col-label" style={{ color: "var(--text-muted)" }}>X</span>
        <span className="league-group-col-label" style={{ color: "var(--text-muted)" }}>2</span>
      </div>
      {hasDc && (
        <div className="league-group-col-labels league-group-dc-labels">
          <span className="league-group-col-label" style={{ color: "rgba(45,169,98,0.7)" }}>1X</span>
          <span className="league-group-col-label" style={{ color: "rgba(45,169,98,0.7)" }}>X2</span>
          <span className="league-group-col-label" style={{ color: "rgba(45,169,98,0.7)" }}>12</span>
        </div>
      )}
      <span className="league-group-col-spacer" />
    </div>
  );
}


const QUICK_NAV = [
  { iconUrl: "https://www.svgrepo.com/show/404149/soccer-ball.svg", label: "Football" },
  { iconUrl: "https://www.svgrepo.com/show/480502/basketball-6.svg", label: "Basketball" },
  { iconUrl: "https://www.svgrepo.com/show/512962/tenis-786.svg", label: "Tennis" },
  { iconUrl: "https://www.svgrepo.com/show/480498/rugby-4.svg", label: "Rugby" },
  { iconUrl: "https://www.svgrepo.com/show/480387/headgear-for-combat-sports-such-as-boxing.svg", label: "MMA" },
  { iconUrl: "https://www.svgrepo.com/show/480565/baseball-ball-1.svg", label: "Baseball" },
  { iconUrl: "https://www.svgrepo.com/show/480340/volleyball-2.svg", label: "Volleyball" },
  { iconSvg: Gamepad2, label: "E-Sports" },
  { iconSvg: Play, label: "Virtual" },
];

interface HomePageProps {
  onAddBet: (bet: BetSelection) => void;
  betSelections: BetSelection[];
  onOpenLogin: () => void;
  onMatchClick: (match: Match) => void;
  onNavigate: (page: Page) => void;
}

export default function HomePage({ onAddBet, betSelections, onOpenLogin, onMatchClick, onNavigate }: HomePageProps) {
  const [activeBanner, setActiveBanner] = useState(0);
  const [firestoreBanners, setFirestoreBanners] = useState<FirestoreBanner[]>([]);
  const [bannersLoaded, setBannersLoaded] = useState(false);
  const [jackpot, setJackpot] = useState(37_000_000);
  const [displayJackpot, setDisplayJackpot] = useState(0);
  const [bustTarget, setBustTarget] = useState(0);
  const [isBusting, setIsBusting] = useState(false);
  const [winnerNotice, setWinnerNotice] = useState("");
  const [bustFlash, setBustFlash] = useState(false);
  const [jackpotSub, setJackpotSub] = useState("Predict 13 games · Closes in 2h 34m");
  const [noticeText, setNoticeText] = useState("🏆 076****654 Won UGX 156,000,000 \u00a0\u00a0\u00a0 🏆 070****432 Won UGX 22,000,000 \u00a0\u00a0\u00a0 🏆 078****211 Won UGX 105,000,000 \u00a0\u00a0\u00a0 🏆 075****913 Won UGX 18,500,000 \u00a0\u00a0\u00a0 🏆 074****544 Won UGX 92,000,000 \u00a0\u00a0\u00a0");
  const unreadCount = useUnreadNotifCount();
  const [liveMatches, setLiveMatches] = useState<Match[]>(() => _homeCache.live);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>(() => _homeCache.upcoming);
  const [boostedMatches, setBoostedMatches] = useState<Match[]>(() => _homeCache.boosted);
  const [loading, setLoading] = useState(() => !_homeCache.ready);
  const [statsMatch, setStatsMatch] = useState<Match | null>(null);
  const [activeLeague, setActiveLeague] = useState("All");
  const [leagues, setLeagues] = useState<string[]>(() => _homeCache.leagues);

  useEffect(() => {
    const q = query(collection(db, "carousel"), orderBy("order", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreBanner));
      setFirestoreBanners(all.filter(b => b.active));
      setBannersLoaded(true);
    }, (err) => { console.error("Carousel fetch error:", err); setBannersLoaded(true); });
    return unsub;
  }, []);

  const newBustTarget = (max: number) =>
    Math.floor(max * (0.55 + Math.random() * 0.38));

  const randomPhone = () => {
    const prefixes = ["070", "071", "072", "074", "075", "076", "077", "078"];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const mid = String(Math.floor(Math.random() * 900) + 100);
    const suffix = String(Math.floor(Math.random() * 900) + 100);
    return `${p}****${mid}${suffix}`.slice(0, 13);
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "jackpot"), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.amount) {
          setJackpot(d.amount);
          setBustTarget(newBustTarget(d.amount));
          setDisplayJackpot(0);
        }
        if (d.closesAt) setJackpotSub(d.closesAt);
      }
    }, () => {});
    return unsub;
  }, []);

  useEffect(() => {
    if (bustTarget === 0) { setBustTarget(newBustTarget(jackpot)); }
  }, [jackpot]);

  useEffect(() => {
    if (isBusting) return;
    const scheduleNext = () => {
      const delay = Math.floor(Math.random() * 500) + 250;
      return setTimeout(() => {
        setDisplayJackpot((prev) => prev + Math.floor(Math.random() * 150_000) + 50_000);
        timerId = scheduleNext();
      }, delay);
    };
    let timerId = scheduleNext();
    return () => clearTimeout(timerId);
  }, [isBusting]);

  useEffect(() => {
    if (bustTarget > 0 && displayJackpot >= bustTarget && !isBusting) {
      setIsBusting(true);
      setBustFlash(true);
      const won = displayJackpot;
      const phone = randomPhone();
      const announcement = `\u00a0\u00a0\u00a0\u00a0🏆 ${phone} WON UGX ${won.toLocaleString()}! JACKPOT BUSTED!\u00a0\u00a0\u00a0\u00a0`;
      setWinnerNotice(announcement);
      setTimeout(() => setBustFlash(false), 2_000);
      setTimeout(() => {
        setDisplayJackpot(0);
        setBustTarget(newBustTarget(jackpot));
        setIsBusting(false);
      }, 3_500);
      setTimeout(() => setWinnerNotice(""), 90_000);
    }
  }, [displayJackpot, bustTarget, isBusting, jackpot]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "notice"), (snap) => {
      if (snap.exists() && snap.data().text) setNoticeText(snap.data().text);
    }, () => {});
    return unsub;
  }, []);

  const bannerCount = firestoreBanners.length;

  useEffect(() => {
    setActiveBanner(0);
  }, [firestoreBanners.length]);

  useEffect(() => {
    if (bannerCount < 2) return;
    const timer = setInterval(() => setActiveBanner((prev) => (prev + 1) % bannerCount), 6000);
    return () => clearInterval(timer);
  }, [bannerCount]);

  useEffect(() => {
    async function load() {
      try {
        const [page1, page2, page3, boostedResp] = await Promise.all([
          api.matches("S", 0),
          api.matches("S", 200),
          api.matches("S", 400),
          api.boostedMatches("S"),
        ]);

        const allRaw: ApiMatch[] = [
          ...(page1.esMatches || []),
          ...(page2.esMatches || []),
          ...(page3.esMatches || []),
        ];

        const live: Match[] = [];
        const upcoming: Match[] = [];
        const seenIds = new Set<number>();

        allRaw.forEach((m) => {
          if (seenIds.has(m.id)) return;
          seenIds.add(m.id);
          const match = apiMatchToMatch(m);
          if (!match) return;
          if (m.live === true && m.kickOffTime < Date.now()) {
            live.push(match);
          } else {
            upcoming.push(match);
          }
        });

        // Sort upcoming by kickoff time ascending (earliest first)
        upcoming.sort((a, b) => (a.kickOffTime ?? 0) - (b.kickOffTime ?? 0));

        // Build a lookup of full betMaps from the regular match pages
        const fullBetMapById = new Map<number, import("../lib/api").BetMap>();
        allRaw.forEach((m) => fullBetMapById.set(m.id, m.betMap));

        const boosted: Match[] = [];
        (boostedResp.esMatches || []).forEach((m) => {
          const fullBetMap = fullBetMapById.get(m.id);
          const match = apiBoostedToMatch(m, fullBetMap);
          if (match) boosted.push(match);
        });

        const newLeagues = ["All", ...Array.from(new Set(upcoming.map((m) => m.league))).slice(0, 10)];
        _homeCache.live = live;
        _homeCache.upcoming = upcoming;
        _homeCache.boosted = boosted;
        _homeCache.leagues = newLeagues;
        _homeCache.ready = true;
        setLiveMatches(live);
        setUpcomingMatches(upcoming);
        setBoostedMatches(boosted);
        setLeagues(newLeagues);
      } catch (err) {
        console.error("Failed to load matches", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    const silentRefresh = async () => {
      try {
        const [p1, p2] = await Promise.all([api.matches("S", 0), api.matches("S", 200)]);
        const oddsById = new Map<string, { home: number; draw: number; away: number }>();
        [...(p1.esMatches || []), ...(p2.esMatches || [])].forEach((m) => {
          const odds = getOdds1X2(m.betMap);
          if (odds) oddsById.set(String(m.id), odds);
        });
        const merge = (prev: Match[]) => {
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
        };
        setUpcomingMatches(merge);
        setLiveMatches(merge);
      } catch {}
    };
    const id = setInterval(silentRefresh, 3000);
    return () => clearInterval(id);
  }, []);

  const fsBanner = firestoreBanners.length > 0 ? firestoreBanners[Math.min(activeBanner, firestoreBanners.length - 1)] : null;

  const filteredUpcoming = activeLeague === "All"
    ? upcomingMatches
    : upcomingMatches.filter((m) => m.league === activeLeague);

  return (
    <div>
      {statsMatch && <StatsModal match={statsMatch} onClose={() => setStatsMatch(null)} />}

      <div className="banner-slider">
        {fsBanner ? (
          <div
            className="banner-slide"
            style={{ backgroundImage: `url(${fsBanner.url})`, backgroundSize: "cover", backgroundPosition: "center", position: "relative", cursor: fsBanner.linkType && fsBanner.linkType !== "none" ? "pointer" : "default" }}
            onClick={() => fsBanner.linkType && fsBanner.linkType !== "none" && onNavigate(fsBanner.linkType as Page)}
          >
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to right, rgba(${hexToRgb(fsBanner.fadeColor || "#1a6e3d")},0.92) 0%, rgba(${hexToRgb(fsBanner.fadeColor || "#1a6e3d")},0.75) 45%, rgba(${hexToRgb(fsBanner.fadeColor || "#1a6e3d")},0.15) 80%, transparent 100%)`, zIndex: 1 }} />
            <div className="banner-content" style={{ zIndex: 2 }}>
              <div className="banner-tag">PROMOTION</div>
              <div className="banner-title"><span className="highlight">{fsBanner.title}</span></div>
              <div className="banner-btn" onClick={e => { e.stopPropagation(); onOpenLogin(); }}><Zap size={13} />PLAY NOW</div>
            </div>
            <div style={{ width: 110, height: 110, flexShrink: 0, zIndex: 2 }} />
          </div>
        ) : bannersLoaded ? (
          <div className="banner-slide" style={{ background: "linear-gradient(135deg, #1a6e3d 0%, #2DA962 100%)", position: "relative" }}>
            <div className="banner-content" style={{ zIndex: 2 }}>
              <div className="banner-tag">WELCOME</div>
              <div className="banner-title"><span className="highlight">Win Big with BetMali</span></div>
              <div className="banner-btn" onClick={onOpenLogin}><Zap size={13} />GET STARTED</div>
            </div>
            <div style={{ width: 110, height: 110, flexShrink: 0, zIndex: 2 }} />
          </div>
        ) : (
          <div className="banner-slide" style={{ background: "linear-gradient(90deg, #e8e8e8 25%, #f5f5f5 50%, #e8e8e8 75%)", backgroundSize: "200% 100%", animation: "skeletonShimmer 1.4s infinite" }} />
        )}
        {bannerCount > 1 && (
          <div className="banner-dots">
            {firestoreBanners.map((_, i) => (
              <div key={i} className={`banner-dot ${activeBanner === i ? "active" : ""}`} onClick={() => setActiveBanner(i)} />
            ))}
          </div>
        )}
      </div>

      <div className="notice-bar">
        <div style={{ position: "relative", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center" }} onClick={() => onNavigate("notifications")}>
          <Bell size={13} className="notice-icon" />
          {unreadCount > 0 && (
            <span style={{ position: "absolute", top: -5, right: -5, background: "#ef4444", color: "#fff", fontSize: 8, fontWeight: 800, borderRadius: "50%", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>{unreadCount > 9 ? "9+" : unreadCount}</span>
          )}
        </div>
        <div className="notice-scroll">{winnerNotice}{noticeText}</div>
      </div>

      <div className="quick-nav">
        {QUICK_NAV.map((item, i) => {
          const Icon = "iconSvg" in item ? item.iconSvg : null;
          return (
            <div className="quick-nav-item" key={i} onClick={() => onNavigate("sport")}>
              <div className="quick-nav-icon">
                {"iconUrl" in item ? <SportSvgIcon url={item.iconUrl!} size={22} /> : Icon ? <Icon size={20} color="var(--text-muted)" /> : null}
              </div>
              <span className="quick-nav-label">{item.label}</span>
            </div>
          );
        })}
      </div>

      <div className="divider-thick" />

      <div className="jackpot-banner" style={bustFlash ? { animation: "jackpotBust 0.35s ease-in-out infinite alternate" } : undefined}>
        <div className="jackpot-label">
          <Trophy size={13} />
          {bustFlash ? "🎉 JACKPOT BUSTED!" : "JACKPOT POOLS"}
        </div>

        <div className="jackpot-tiers">
          <div className="jackpot-tier jackpot-tier-gold">
            <div className="jackpot-tier-name">🏆 MEGA</div>
            <div className="jackpot-tier-ugx">UGX</div>
            <TierCounter value={displayJackpot} tier="gold" fontSize={16} />
          </div>
          <div className="jackpot-tier jackpot-tier-silver">
            <div className="jackpot-tier-name">🥈 MAJOR</div>
            <div className="jackpot-tier-ugx">UGX</div>
            <TierCounter value={Math.floor(displayJackpot * 0.27)} tier="silver" fontSize={16} />
          </div>
          <div className="jackpot-tier jackpot-tier-bronze">
            <div className="jackpot-tier-name">🥉 MINI</div>
            <div className="jackpot-tier-ugx">UGX</div>
            <TierCounter value={Math.floor(displayJackpot * 0.07)} tier="bronze" fontSize={16} />
          </div>
        </div>

        <div className="jackpot-footer">
          <div className="jackpot-sub">
            {bustFlash
              ? "A lucky player just won! 🏆"
              : bustTarget > 0 && displayJackpot > bustTarget * 0.8
                ? "⚡ BUSTING SOON — Play Now!"
                : jackpotSub}
          </div>
          <button className="jackpot-btn" onClick={onOpenLogin}><Play size={13} fill="currentColor" /> PLAY</button>
        </div>
      </div>

      {loading && <SkeletonHome />}

      {!loading && liveMatches.length > 0 && (
        <>
          <div className="section">
            <div className="section-header">
              <div className="section-title">
                <div className="section-title-dot" style={{ background: "#e53935", boxShadow: "0 0 6px #e53935", animation: "blink 1s infinite" }} />
                LIVE MATCHES
                <span style={{ background: "#e53935", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 10 }}>
                  {liveMatches.length}
                </span>
              </div>
              <span className="section-more" onClick={() => onNavigate("live")} style={{ cursor: "pointer" }}>
                View All <ChevronRight size={14} />
              </span>
            </div>
            <div className="match-list">
              {liveMatches.map((m) => (
                <MatchRow key={m.id} match={m} onAddBet={onAddBet} betSelections={betSelections} onMatchClick={onMatchClick} />
              ))}
            </div>
          </div>
          <div className="divider-thick" />
        </>
      )}

      {!loading && boostedMatches.length > 0 && (
        <>
          <div className="section">
            <div className="section-header">
              <div className="section-title">
                <Zap size={15} style={{ color: "#ff6d00" }} />
                <span style={{ color: "#ff6d00" }}>BOOSTED ODDS</span>
              </div>
              <span className="section-more" onClick={() => onNavigate("sport")} style={{ cursor: "pointer" }}>
                View All <ChevronRight size={14} />
              </span>
            </div>
            <OddsColHeaders hasDc={true} />
            <div className="match-list">
              {boostedMatches.map((m) => (
                <MatchRow key={m.id} match={m} onAddBet={onAddBet} betSelections={betSelections} onMatchClick={onMatchClick} />
              ))}
            </div>
          </div>
          <div className="divider-thick" />
        </>
      )}

      <div className="leagues-list">
        {leagues.map((l) => (
          <div key={l} className={`league-chip ${activeLeague === l ? "active" : ""}`} onClick={() => setActiveLeague(l)}
            style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            {l !== "All" && <LeagueFlag leagueName={l} />}
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>{l}</span>
          </div>
        ))}
      </div>

      <div className="section">
        <div className="section-header">
          <div className="section-title">
            <Trophy size={16} style={{ color: "var(--green)" }} />
            {loading ? "LOADING..." : `UPCOMING (${filteredUpcoming.length})`}
          </div>
          <span className="section-more" onClick={() => onNavigate("sport")} style={{ cursor: "pointer" }}>
            View All <ChevronRight size={14} />
          </span>
        </div>
        {loading ? (
          <div style={{ padding: "12px", background: "#fff" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ height: 52, borderRadius: 8, marginBottom: 6, background: "linear-gradient(90deg, #e8e8e8 25%, #f5f5f5 50%, #e8e8e8 75%)", backgroundSize: "200% 100%", animation: "skeletonShimmer 1.4s infinite" }} />
            ))}
          </div>
        ) : (
          <>
          <OddsColHeaders hasDc={filteredUpcoming.some((m) => !!m.doubleChance)} />
          <div className="match-list">
            {filteredUpcoming.map((m) => (
              <MatchRow key={m.id} match={m} onAddBet={onAddBet} betSelections={betSelections} onMatchClick={onMatchClick} />
            ))}
            {filteredUpcoming.length === 0 && (
              <div style={{ padding: "24px 14px", textAlign: "center", color: "var(--text-muted)", fontSize: 13, background: "#fff" }}>
                No matches found
              </div>
            )}
          </div>
          </>
        )}
      </div>

      <div className="divider-thick" />

      <div className="section">
        <div className="section-header">
          <div className="section-title"><Gift size={16} style={{ color: "var(--green)" }} />PROMOTIONS</div>
          <span className="section-more" onClick={() => onNavigate("promotions")} style={{ cursor: "pointer" }}>
            View All <ChevronRight size={14} />
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, padding: "0 10px 14px", overflowX: "auto", scrollbarWidth: "none", background: "#fff" }}>
          {[
            { bg: "linear-gradient(135deg, #1a6e3d, #2DA962)", icon: Gift, title: "100% Welcome Bonus", sub: "Up to UGX 370,000" },
            { bg: "linear-gradient(135deg, #1a237e, #3949ab)", icon: Zap, title: "Mobile Money Bonus", sub: "Deposit & get UGX 1,000 free" },
            { bg: "linear-gradient(135deg, #b71c1c, #e53935)", icon: TrendingUp, title: "Refer & Earn", sub: "UGX 3,700 per referral" },
          ].map(({ bg, icon: Icon, title, sub }, i) => (
            <div key={i} onClick={onOpenLogin} style={{ flexShrink: 0, width: 185, borderRadius: 14, background: bg, padding: "14px 12px", cursor: "pointer", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,0.08)", top: -25, right: -20 }} />
              <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 12, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 9, border: "1px solid rgba(255,255,255,0.2)" }}>
                <Icon size={20} color="#fff" />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 3, fontFamily: "Oswald, sans-serif" }}>{title}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{sub}</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 10, background: "#fff", color: "var(--green-dark)", fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 12, fontFamily: "Oswald, sans-serif" }}>
                CLAIM <ChevronRight size={11} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="footer-note">
        Licensed and regulated by the Uganda National Gaming Board. Gambling is addictive — please play responsibly. 18+ only.
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}
