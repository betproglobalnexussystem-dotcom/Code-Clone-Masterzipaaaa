import { useState, useEffect } from "react";
import { Bell, Globe, Gift, Zap, ChevronRight, Play, TrendingUp, Gamepad2, Loader2, Trophy } from "lucide-react";
import type { BetSelection } from "../App";
import type { Page } from "../App";
import MatchCard, { type Match } from "../components/MatchCard";
import { api, getOdds1X2, getBoostedOdds, formatKickOff, getLeagueFlagUrl, type ApiMatch } from "../lib/api";
import StatsModal from "../components/StatsModal";
import { collection, query, orderBy, where, onSnapshot, doc } from "firebase/firestore";
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

function OdometerDigit({ digit, height }: { digit: number; height: number }) {
  return (
    <span style={{ display: "inline-block", overflow: "hidden", height, verticalAlign: "top" }}>
      <span style={{
        display: "flex",
        flexDirection: "column",
        transform: `translateY(-${digit * height}px)`,
        transition: "transform 0.18s cubic-bezier(0.23, 1, 0.32, 1)",
      }}>
        {[0,1,2,3,4,5,6,7,8,9].map((d) => (
          <span key={d} style={{ height, lineHeight: `${height}px`, display: "block", textAlign: "center" }}>{d}</span>
        ))}
      </span>
    </span>
  );
}

function JackpotOdometer({ value, fontSize = 30 }: { value: number; fontSize?: number }) {
  const h = Math.ceil(fontSize * 1.18);
  const formatted = value.toLocaleString();
  const chars = formatted.split("");
  return (
    <span style={{ display: "inline-flex", alignItems: "flex-start", fontFamily: "Oswald, sans-serif", fontWeight: 900, fontSize, color: "#fff", lineHeight: `${h}px`, letterSpacing: 1 }}>
      {chars.map((char, i) => {
        const fromRight = chars.length - 1 - i;
        const d = parseInt(char);
        if (isNaN(d)) {
          return <span key={`sep-${fromRight}`} style={{ display: "inline-block", height: h, lineHeight: `${h}px` }}>{char}</span>;
        }
        return <OdometerDigit key={`d-${fromRight}`} digit={d} height={h} />;
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
    oddsCount: m.oddsCount,
    kickOffTime: m.kickOffTime,
    overUnder: m.params?.overUnder,
    leagueId: m.leagueId,
    isBoosted: opts?.boosted,
    sport: m.sport,
  };
}

function apiBoostedToMatch(m: ApiMatch): Match | null {
  const odds = getBoostedOdds(m.betMap);
  if (!odds) return null;
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
    oddsCount: m.oddsCount,
    kickOffTime: m.kickOffTime,
    isBoosted: true,
  };
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
  const [jackpot, setJackpot] = useState(37_000_000);
  const [jackpotSub, setJackpotSub] = useState("Predict 13 games · Closes in 2h 34m");
  const [noticeText, setNoticeText] = useState("Welcome Bonus: 100% up to UGX 370,000 on your first deposit! \u00a0\u00a0\u00a0 Jackpot of UGX 37,000,000 this weekend! \u00a0\u00a0\u00a0 Withdraw via Mobile Money in under 5 minutes!");
  const unreadCount = useUnreadNotifCount();
  const [liveMatches, setLiveMatches] = useState<Match[]>(() => _homeCache.live);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>(() => _homeCache.upcoming);
  const [boostedMatches, setBoostedMatches] = useState<Match[]>(() => _homeCache.boosted);
  const [loading, setLoading] = useState(() => !_homeCache.ready);
  const [statsMatch, setStatsMatch] = useState<Match | null>(null);
  const [activeLeague, setActiveLeague] = useState("All");
  const [leagues, setLeagues] = useState<string[]>(() => _homeCache.leagues);

  useEffect(() => {
    const q = query(collection(db, "carousel"), where("active", "==", true), orderBy("order", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setFirestoreBanners(snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreBanner)));
    }, () => {});
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "jackpot"), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.amount) setJackpot(d.amount);
        if (d.closesAt) setJackpotSub(d.closesAt);
      }
    }, () => {});
    return unsub;
  }, []);

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

        const boosted: Match[] = [];
        (boostedResp.esMatches || []).forEach((m) => {
          const match = apiBoostedToMatch(m);
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

      <div className="notice-bar">
        <div style={{ position: "relative", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center" }} onClick={() => onNavigate("notifications")}>
          <Bell size={13} className="notice-icon" />
          {unreadCount > 0 && (
            <span style={{ position: "absolute", top: -5, right: -5, background: "#ef4444", color: "#fff", fontSize: 8, fontWeight: 800, borderRadius: "50%", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>{unreadCount > 9 ? "9+" : unreadCount}</span>
          )}
        </div>
        <div className="notice-scroll">{noticeText}</div>
      </div>

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
        ) : (
          <div className="banner-slide" style={{ background: "linear-gradient(135deg, #1a6e3d 0%, #2DA962 100%)", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 32, height: 32, border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          </div>
        )}
        {bannerCount > 1 && (
          <div className="banner-dots">
            {firestoreBanners.map((_, i) => (
              <div key={i} className={`banner-dot ${activeBanner === i ? "active" : ""}`} onClick={() => setActiveBanner(i)} />
            ))}
          </div>
        )}
      </div>

      <div className="quick-nav">
        {QUICK_NAV.map((item, i) => {
          const Icon = "iconSvg" in item ? item.iconSvg : null;
          return (
            <div className="quick-nav-item" key={i} onClick={() => onNavigate("sport")}>
              <div className="quick-nav-icon">
                {"iconUrl" in item ? <SportSvgIcon url={item.iconUrl} size={22} /> : Icon ? <Icon size={20} color="var(--text-muted)" /> : null}
              </div>
              <span className="quick-nav-label">{item.label}</span>
            </div>
          );
        })}
      </div>

      <div className="divider-thick" />

      <div className="jackpot-banner">
        <div className="jackpot-info">
          <div className="jackpot-label"><Trophy size={13} /> MEGA JACKPOT</div>
          <div className="jackpot-amount" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginRight: 2 }}>UGX</span>
            <JackpotOdometer value={jackpot} fontSize={26} />
          </div>
          <div className="jackpot-sub">{jackpotSub}</div>
        </div>
        <button className="jackpot-btn" onClick={onOpenLogin}><Play size={13} fill="currentColor" /> PLAY</button>
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 32, gap: 10, color: "var(--text-muted)", background: "#fff" }}>
          <Loader2 size={20} style={{ animation: "spin 1s linear infinite", color: "var(--green)" }} />
          <span style={{ fontSize: 14, fontWeight: 500 }}>Loading matches...</span>
        </div>
      )}

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
                <MatchCard key={m.id} match={m} onAddBet={onAddBet} betSelections={betSelections} onMatchClick={onMatchClick} onStatsClick={setStatsMatch} />
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
            <div className="match-list">
              {boostedMatches.map((m) => (
                <MatchCard key={m.id} match={m} onAddBet={onAddBet} betSelections={betSelections} onMatchClick={onMatchClick} onStatsClick={setStatsMatch} />
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
          <div style={{ padding: "24px", textAlign: "center", background: "#fff" }}>
            <Loader2 size={18} style={{ animation: "spin 1s linear infinite", color: "var(--green)", display: "inline-block" }} />
          </div>
        ) : (
          <div className="match-list">
            {filteredUpcoming.map((m) => (
              <MatchCard key={m.id} match={m} onAddBet={onAddBet} betSelections={betSelections} onMatchClick={onMatchClick} onStatsClick={setStatsMatch} />
            ))}
            {filteredUpcoming.length === 0 && (
              <div style={{ padding: "24px 14px", textAlign: "center", color: "var(--text-muted)", fontSize: 13, background: "#fff" }}>
                No matches found
              </div>
            )}
          </div>
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
