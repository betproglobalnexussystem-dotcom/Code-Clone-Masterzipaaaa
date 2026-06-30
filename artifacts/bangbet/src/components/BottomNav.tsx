import { Trophy, Radio, FileText, User } from "lucide-react";
import type { Page } from "../App";

interface BottomNavProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
  betCount: number;
  onBetSlipClick: () => void;
}

export default function BottomNav({ activePage, setActivePage, betCount, onBetSlipClick }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      {/* Sport */}
      <div
        className={`bottom-nav-item ${activePage === "sport" ? "active" : ""}`}
        onClick={() => setActivePage("sport")}
      >
        <Trophy size={20} />
        <span className="bottom-nav-label">Sports</span>
      </div>

      {/* Live */}
      <div
        className={`bottom-nav-item ${activePage === "live" ? "active" : ""}`}
        onClick={() => setActivePage("live")}
      >
        <Radio size={20} />
        <span className="bottom-nav-label">Live</span>
      </div>

      {/* BetSlip — center raised circle */}
      <div className="bottom-nav-center" onClick={onBetSlipClick}>
        <div className="bottom-nav-center-btn">
          <FileText size={22} />
          {betCount > 0 && (
            <div className="bottom-nav-center-badge">{betCount}</div>
          )}
        </div>
        <span className="bottom-nav-center-label">BetSlip</span>
      </div>

      {/* Me */}
      <div
        className={`bottom-nav-item ${activePage === "profile" ? "active" : ""}`}
        onClick={() => setActivePage("profile")}
      >
        <User size={20} />
        <span className="bottom-nav-label">Me</span>
      </div>
    </nav>
  );
}
