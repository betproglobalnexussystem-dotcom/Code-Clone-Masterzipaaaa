import { Trophy, Radio, ClipboardList, Tag, User, Home, Gamepad2 } from "lucide-react";
import type { Page } from "../App";

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

export default function DesktopSidebar({ activePage, setActivePage }: DesktopSidebarProps) {
  return (
    <aside className="desktop-sidebar">
      <div className="desktop-sidebar-section-title">MENU</div>
      {NAV_ITEMS.map(({ page, label, icon: Icon, accent }) => {
        const isActive = activePage === page || (page === "sport" && activePage === "live" && false);
        const active = activePage === page;
        return (
          <div
            key={page}
            className={`desktop-sidebar-item${active ? " active" : ""}`}
            onClick={() => setActivePage(page)}
          >
            <span className="desktop-sidebar-item-icon">
              <Icon size={17} color={active ? "var(--green)" : accent ?? "var(--text-muted)"} />
            </span>
            <span className="desktop-sidebar-item-label">{label}</span>
            {page === "live" && (
              <span className="desktop-sidebar-live-badge">LIVE</span>
            )}
          </div>
        );
      })}

      <div className="desktop-sidebar-section-title" style={{ marginTop: 20 }}>CASINO</div>
      <div
        className="desktop-sidebar-item"
        style={{ opacity: 0.6, cursor: "default" }}
      >
        <span className="desktop-sidebar-item-icon">
          <Gamepad2 size={17} color="var(--text-muted)" />
        </span>
        <span className="desktop-sidebar-item-label">Slots</span>
        <span style={{ fontSize: 9, background: "var(--green)", color: "#fff", borderRadius: 6, padding: "1px 6px", fontWeight: 700, fontFamily: "Oswald, sans-serif" }}>NEW</span>
      </div>

      <div className="desktop-sidebar-footer">
        <div style={{ fontSize: 10, color: "var(--text-muted)", lineHeight: 1.6 }}>
          © 2024 BangBet. All rights reserved.<br />
          Bet responsibly. 18+
        </div>
      </div>
    </aside>
  );
}
