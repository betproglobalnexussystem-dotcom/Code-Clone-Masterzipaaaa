import { useState } from "react";
import { Trophy, Radio, ClipboardList, Tag, User, Home, Gamepad2, ChevronDown, ChevronUp, Globe } from "lucide-react";
import type { Page } from "../App";
import { getLeagueFlagUrl, SPORTS } from "../lib/api";

interface DesktopSidebarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
  activeSportIndex: number;
  onSportChange: (idx: number) => void;
  sportLeagues: string[];
  activeLeague: string;
  onLeagueChange: (league: string) => void;
}

const NAV_ITEMS: { page: Page; label: string; icon: React.ElementType; accent?: string }[] = [
  { page: "home",        label: "Home",       icon: Home },
  { page: "sport",       label: "Sports",     icon: Trophy },
  { page: "live",        label: "Live",       icon: Radio,    accent: "#e53935" },
  { page: "results",     label: "Results",    icon: ClipboardList },
  { page: "promotions",  label: "Promotions", icon: Tag },
  { page: "profile",     label: "My Account", icon: User },
];

const SPORT_ICON_URLS: Record<string, string> = {
  S:  "https://www.svgrepo.com/show/404149/soccer-ball.svg",
  B:  "https://www.svgrepo.com/show/480502/basketball-6.svg",
  T:  "https://www.svgrepo.com/show/512962/tenis-786.svg",
  RL: "https://www.svgrepo.com/show/480498/rugby-4.svg",
  MM: "https://www.svgrepo.com/show/480387/headgear-for-combat-sports-such-as-boxing.svg",
  BB: "https://www.svgrepo.com/show/480565/baseball-ball-1.svg",
  V:  "https://www.svgrepo.com/show/480340/volleyball-2.svg",
  HB: "https://www.svgrepo.com/show/480386/handball.svg",
  SP: "https://www.svgrepo.com/show/480359/cycling-1.svg",
};

function LeagueFlag({ name }: { name: string }) {
  const url = getLeagueFlagUrl(name);
  if (url) {
    return <img src={url} alt="" style={{ width: 14, height: 10, objectFit: "cover", borderRadius: 2, flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />;
  }
  return <Globe size={11} style={{ flexShrink: 0, opacity: 0.4 }} />;
}

function SportImg({ code, active }: { code: string; active?: boolean }) {
  const url = SPORT_ICON_URLS[code];
  if (url) {
    return (
      <img
        src={url} alt="" width={14} height={14}
        style={{ objectFit: "contain", flexShrink: 0, filter: active ? "brightness(0) saturate(100%) invert(47%) sepia(70%) saturate(500%) hue-rotate(100deg) brightness(95%)" : "brightness(0) invert(0.55)" }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return <Globe size={14} style={{ opacity: active ? 1 : 0.5, flexShrink: 0, color: active ? "var(--green)" : undefined }} />;
}

export default function DesktopSidebar({
  activePage, setActivePage,
  activeSportIndex, onSportChange,
  sportLeagues, activeLeague, onLeagueChange,
}: DesktopSidebarProps) {
  const [champOpen, setChampOpen] = useState(true);
  const [sportsOpen, setSportsOpen] = useState(true);

  const visibleLeagues = sportLeagues.filter((l) => l !== "All");
  const isSportPage = activePage === "sport" || activePage === "live";

  return (
    <aside className="desktop-sidebar">
      {/* Main nav */}
      <div className="dsb-section-title">MENU</div>
      <div className="dsb-nav-group">
        {NAV_ITEMS.map(({ page, label, icon: Icon, accent }) => {
          const active = activePage === page;
          return (
            <div
              key={page}
              className={`dsb-nav-item${active ? " active" : ""}`}
              onClick={() => setActivePage(page)}
            >
              <Icon size={15} color={active ? "var(--green)" : accent ?? "var(--text-muted)"} />
              <span className="dsb-nav-label">{label}</span>
              {page === "live" && (
                <span className="dsb-live-badge">LIVE</span>
              )}
            </div>
          );
        })}
        <div className="dsb-nav-item" style={{ opacity: 0.5, cursor: "default" }}>
          <Gamepad2 size={15} color="var(--text-muted)" />
          <span className="dsb-nav-label">Slots</span>
          <span style={{ fontSize: 8, background: "var(--green)", color: "#fff", borderRadius: 5, padding: "1px 5px", fontWeight: 700, fontFamily: "Oswald, sans-serif" }}>NEW</span>
        </div>
      </div>

      {/* Top Championships — shows leagues for current sport */}
      <div
        className="dsb-section-title"
        style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
        onClick={() => setChampOpen((v) => !v)}
      >
        <span>TOP CHAMPIONSHIPS</span>
        {champOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </div>
      {champOpen && (
        <div className="dsb-league-group">
          {visibleLeagues.length === 0 ? (
            <div style={{ padding: "10px 12px", fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>
              Select a sport below
            </div>
          ) : (
            visibleLeagues.slice(0, 12).map((league) => {
              const isActive = isSportPage && activeLeague === league;
              return (
                <div
                  key={league}
                  className={`dsb-league-item${isActive ? " active" : ""}`}
                  onClick={() => onLeagueChange(league)}
                >
                  <LeagueFlag name={league} />
                  <span className={`dsb-league-name${isActive ? " active" : ""}`}>{league}</span>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Sports */}
      <div
        className="dsb-section-title"
        style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
        onClick={() => setSportsOpen((v) => !v)}
      >
        <span>SPORTS</span>
        {sportsOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </div>
      {sportsOpen && (
        <div className="dsb-league-group">
          {SPORTS.map((sport, idx) => {
            const isActive = isSportPage && activeSportIndex === idx;
            return (
              <div
                key={sport.code}
                className={`dsb-league-item${isActive ? " active" : ""}`}
                onClick={() => onSportChange(idx)}
              >
                <SportImg code={sport.code} active={isActive} />
                <span className={`dsb-league-name${isActive ? " active" : ""}`}>{sport.name}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="dsb-footer">
        <div style={{ fontSize: 10, color: "var(--text-muted)", lineHeight: 1.6, textAlign: "center" }}>
          © 2024 BetMali. All rights reserved.<br />
          Bet responsibly. 18+
        </div>
      </div>
    </aside>
  );
}
