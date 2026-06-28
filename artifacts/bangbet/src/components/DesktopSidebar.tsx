import { useState } from "react";
import { Trophy, Radio, ClipboardList, Tag, User, Home, Gamepad2, ChevronDown, ChevronUp, Globe } from "lucide-react";
import type { Page } from "../App";
import { getLeagueFlagUrl } from "../lib/api";

interface DesktopSidebarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
}

const NAV_ITEMS: { page: Page; label: string; icon: React.ElementType; accent?: string }[] = [
  { page: "home",        label: "Home",       icon: Home },
  { page: "sport",       label: "Sports",     icon: Trophy },
  { page: "live",        label: "Live",       icon: Radio,    accent: "#e53935" },
  { page: "results",     label: "Results",    icon: ClipboardList },
  { page: "promotions",  label: "Promotions", icon: Tag },
  { page: "profile",     label: "My Account", icon: User },
];

const TOP_CHAMPIONSHIPS = [
  { name: "Premier League" },
  { name: "Bundesliga" },
  { name: "Serie A" },
  { name: "LaLiga" },
  { name: "Ligue 1 France" },
  { name: "Uganda Premier League" },
  { name: "Kenya Premier" },
];

const SPORT_ICON_URLS: Record<string, string> = {
  S:  "https://www.svgrepo.com/show/404149/soccer-ball.svg",
  B:  "https://www.svgrepo.com/show/480502/basketball-6.svg",
  T:  "https://www.svgrepo.com/show/512962/tenis-786.svg",
  RL: "https://www.svgrepo.com/show/480498/rugby-4.svg",
  MM: "https://www.svgrepo.com/show/480387/headgear-for-combat-sports-such-as-boxing.svg",
  BB: "https://www.svgrepo.com/show/480565/baseball-ball-1.svg",
  V:  "https://www.svgrepo.com/show/480340/volleyball-2.svg",
};

const POPULAR_SPORTS = [
  { code: "S",  name: "Soccer",      count: 2047 },
  { code: "B",  name: "Basketball",  count: 1093 },
  { code: "T",  name: "Tennis",      count: 1093 },
  { code: "MM", name: "MMA",         count: 1093 },
  { code: "V",  name: "Volleyball",  count: 1093 },
  { code: "BB", name: "Baseball",    count: 1093 },
  { code: "RL", name: "Rugby",       count: 1093 },
  { code: "ES", name: "E-Sports",    count: 893  },
];

function LeagueFlag({ name }: { name: string }) {
  const url = getLeagueFlagUrl(name);
  if (url) {
    return <img src={url} alt="" style={{ width: 14, height: 10, objectFit: "cover", borderRadius: 2, flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />;
  }
  return <Globe size={11} style={{ flexShrink: 0, opacity: 0.4 }} />;
}

function SportImg({ code }: { code: string }) {
  const url = SPORT_ICON_URLS[code];
  if (url) {
    return <img src={url} alt="" width={14} height={14} style={{ objectFit: "contain", filter: "brightness(0) invert(0.7)", flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />;
  }
  return <Globe size={14} style={{ opacity: 0.5, flexShrink: 0 }} />;
}

export default function DesktopSidebar({ activePage, setActivePage }: DesktopSidebarProps) {
  const [champOpen, setChampOpen] = useState(true);
  const [sportsOpen, setSportsOpen] = useState(true);

  return (
    <aside className="desktop-sidebar">
      {/* Main nav */}
      <div className="dsb-section-title">MENU</div>
      {NAV_ITEMS.map(({ page, label, icon: Icon, accent }) => {
        const active = activePage === page;
        return (
          <div
            key={page}
            className={`dsb-nav-item${active ? " active" : ""}`}
            onClick={() => setActivePage(page)}
          >
            <Icon size={15} color={active ? "var(--green)" : accent ?? "rgba(255,255,255,0.45)"} />
            <span className="dsb-nav-label">{label}</span>
            {page === "live" && (
              <span className="dsb-live-badge">LIVE</span>
            )}
          </div>
        );
      })}

      <div className="dsb-nav-item" style={{ opacity: 0.5, cursor: "default" }}>
        <Gamepad2 size={15} color="rgba(255,255,255,0.4)" />
        <span className="dsb-nav-label">Slots</span>
        <span style={{ fontSize: 8, background: "var(--green)", color: "#fff", borderRadius: 5, padding: "1px 5px", fontWeight: 700, fontFamily: "Oswald, sans-serif" }}>NEW</span>
      </div>

      {/* Top Championships */}
      <div className="dsb-section-title" style={{ marginTop: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
        onClick={() => setChampOpen((v) => !v)}>
        <span>TOP CHAMPIONSHIPS</span>
        {champOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </div>
      {champOpen && (
        <div>
          {TOP_CHAMPIONSHIPS.map((league) => (
            <div key={league.name} className="dsb-league-item" onClick={() => setActivePage("sport")}>
              <LeagueFlag name={league.name} />
              <span className="dsb-league-name">{league.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Popular Sports */}
      <div className="dsb-section-title" style={{ marginTop: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
        onClick={() => setSportsOpen((v) => !v)}>
        <span>POPULAR SPORTS</span>
        {sportsOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </div>
      {sportsOpen && (
        <div>
          {POPULAR_SPORTS.map((sport) => (
            <div key={sport.code} className="dsb-league-item" onClick={() => setActivePage("sport")}>
              <SportImg code={sport.code} />
              <span className="dsb-league-name">{sport.name}</span>
              <span className="dsb-sport-count">{sport.count}</span>
            </div>
          ))}
        </div>
      )}

      <div className="dsb-footer">
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", lineHeight: 1.6, textAlign: "center" }}>
          © 2024 BetMali. All rights reserved.<br />
          Bet responsibly. 18+
        </div>
      </div>
    </aside>
  );
}
