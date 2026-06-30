import { useState, useEffect } from "react";
import { COUNTRIES } from "./lib/countries";
import { getCountryFromURL } from "./lib/seo";
import { AuthProvider, useAuth } from "./context/AuthContext";
import SEO from "./components/SEO";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import DesktopSidebar from "./components/DesktopSidebar";
import HomePage from "./pages/HomePage";
import SportPage from "./pages/SportPage";
import ResultsPage from "./pages/ResultsPage";
import PromotionsPage from "./pages/PromotionsPage";
import ProfilePage from "./pages/ProfilePage";
import MatchDetailsPage from "./pages/MatchDetailsPage";
import LoginModal from "./components/LoginModal";
import BetSlip from "./components/BetSlip";
import AdminPage from "./pages/admin/AdminPage";
import NotificationsPage from "./pages/NotificationsPage";
import PendingPaymentRecovery from "./components/PendingPaymentRecovery";
import ClientSettlement from "./components/ClientSettlement";
import LiveChat from "./components/LiveChat";
import type { Match } from "./components/MatchCard";
import "./index.css";

export type Page = "home" | "sport" | "live" | "results" | "promotions" | "profile" | "notifications" | "slots";

export interface BetSelection {
  id: string;
  match: string;
  pick: string;
  odd: number;
  matchId?: number;
  kickOffTime?: number;
  sport?: string;
  marketKey?: string;
}

function useCountryDetection() {
  useEffect(() => {
    const seg = window.location.pathname.replace(/^\//, "").toLowerCase();
    if (seg.length === 2 && COUNTRIES.find((c) => c.code.toLowerCase() === seg)) return;
    fetch("https://api.country.is", { signal: AbortSignal.timeout(4000) })
      .then((r) => r.json())
      .then((d) => {
        const code = (d?.country as string)?.toUpperCase();
        if (code && COUNTRIES.find((c) => c.code === code)) {
          const path = "/" + code.toLowerCase();
          if (window.location.pathname !== path) window.history.replaceState({}, "", path);
        }
      })
      .catch(() => {
        fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4000) })
          .then((r) => r.json())
          .then((d) => {
            const code = (d?.country_code as string)?.toUpperCase();
            if (code && COUNTRIES.find((c) => c.code === code)) {
              const path = "/" + code.toLowerCase();
              if (window.location.pathname !== path) window.history.replaceState({}, "", path);
            }
          })
          .catch(() => {});
      });
  }, []);
}

function AppInner({ onOpenAdmin }: { onOpenAdmin: () => void }) {
  useCountryDetection();
  const { user } = useAuth();
  const [activePage, setActivePage] = useState<Page>("home");
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showBetSlip, setShowBetSlip] = useState(false);
  const [betSelections, setBetSelections] = useState<BetSelection[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // Shared sport/league state — controlled by sidebar on desktop, by tabs on mobile
  const [activeSportIndex, setActiveSportIndex] = useState(0);
  const [activeLeague, setActiveLeague] = useState("All");
  const [sportLeagues, setSportLeagues] = useState<string[]>([]);

  const openLogin = () => { setShowRegister(false); setShowLogin(true); };
  const openRegister = () => { setShowLogin(false); setShowRegister(true); };
  const closeModal = () => { setShowLogin(false); setShowRegister(false); };

  const addBet = (bet: BetSelection) => {
    setBetSelections((prev) => {
      const exists = prev.find((b) => b.id === bet.id);
      if (exists) return prev.filter((b) => b.id !== bet.id);
      return [...prev.filter((b) => b.match !== bet.match), bet];
    });
  };

  const removeBet = (id: string) => setBetSelections((prev) => prev.filter((b) => b.id !== id));
  const clearBets = () => { setBetSelections([]); setShowBetSlip(false); };
  const handleMatchClick = (match: Match) => setSelectedMatch(match);
  const handleBackFromMatch = () => setSelectedMatch(null);

  const navigateTo = (page: Page) => {
    setSelectedMatch(null);
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSidebarSportChange = (idx: number) => {
    setActiveSportIndex(idx);
    setActiveLeague("All");
    setSelectedMatch(null);
    setActivePage("sport");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSidebarLeagueChange = (league: string) => {
    setActiveLeague(league);
    setSelectedMatch(null);
    setActivePage("sport");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPage = () => {
    switch (activePage) {
      case "home":
        return (
          <HomePage
            onAddBet={addBet}
            betSelections={betSelections}
            onOpenLogin={openLogin}
            onMatchClick={handleMatchClick}
            onNavigate={navigateTo}
          />
        );
      case "sport":
      case "live":
        return (
          <SportPage
            onAddBet={addBet}
            betSelections={betSelections}
            onMatchClick={handleMatchClick}
            isLive={activePage === "live"}
            activeSportIndex={activeSportIndex}
            onSportIndexChange={(idx) => { setActiveSportIndex(idx); setActiveLeague("All"); }}
            activeLeague={activeLeague}
            onLeagueChange={setActiveLeague}
            onLeaguesLoaded={setSportLeagues}
          />
        );
      case "results":
        return <ResultsPage />;
      case "promotions":
        return <PromotionsPage />;
      case "profile":
        return <ProfilePage onOpenLogin={openLogin} onOpenRegister={openRegister} onOpenAdmin={onOpenAdmin} />;
      case "notifications":
        return <NotificationsPage onBack={() => navigateTo("home")} />;
      default:
        return (
          <HomePage
            onAddBet={addBet}
            betSelections={betSelections}
            onOpenLogin={openLogin}
            onMatchClick={handleMatchClick}
            onNavigate={navigateTo}
          />
        );
    }
  };

  return (
    <div id="root">
      <SEO page={activePage} countryCode={getCountryFromURL()} />
      <PendingPaymentRecovery />
      <ClientSettlement />
      <LiveChat />
      <Header onLoginClick={openLogin} onRegisterClick={openRegister} onHomeClick={() => { setSelectedMatch(null); setActivePage("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />

      {/* Desktop layout: sidebar + main + betslip */}
      <div className="desktop-body">
        <DesktopSidebar
          activePage={activePage}
          setActivePage={(p) => { setSelectedMatch(null); setActivePage(p); }}
          activeSportIndex={activeSportIndex}
          onSportChange={handleSidebarSportChange}
          sportLeagues={sportLeagues}
          activeLeague={activeLeague}
          onLeagueChange={handleSidebarLeagueChange}
        />
        <main className="main-content">
          {selectedMatch ? (
            <MatchDetailsPage
              match={selectedMatch}
              onBack={handleBackFromMatch}
              onAddBet={addBet}
              betSelections={betSelections}
            />
          ) : renderPage()}
        </main>
        {/* Right betslip panel — always visible on desktop */}
        <div className="desktop-right-panel">
          <BetSlip
            selections={betSelections}
            onRemove={removeBet}
            onClose={() => {}}
            onBetPlaced={clearBets}
            onOpenLogin={openLogin}
            inline
          />
        </div>
      </div>

      <BottomNav
        activePage={selectedMatch ? activePage : activePage}
        setActivePage={(p) => { setSelectedMatch(null); setActivePage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        betCount={betSelections.length}
        onBetSlipClick={() => setShowBetSlip(true)}
      />

      {/* Mobile betslip modal */}
      {showBetSlip && (
        <div className="mobile-betslip-modal">
          <BetSlip selections={betSelections} onRemove={removeBet} onClose={() => setShowBetSlip(false)} onBetPlaced={clearBets} />
        </div>
      )}

      {(showLogin || showRegister) && (
        <LoginModal
          mode={showRegister ? "register" : "login"}
          onClose={closeModal}
          onSwitchMode={() => { setShowLogin(!showLogin); setShowRegister(!showRegister); }}
        />
      )}
    </div>
  );
}

function App() {
  const [showAdmin, setShowAdmin] = useState(() => {
    return new URLSearchParams(window.location.search).has("admin") ||
      window.location.hash === "#admin";
  });

  if (showAdmin) {
    return <AdminPage onExit={() => { setShowAdmin(false); window.history.replaceState({}, "", "/"); }} />;
  }

  return (
    <AuthProvider>
      <AppInner onOpenAdmin={() => setShowAdmin(true)} />
    </AuthProvider>
  );
}

export default App;
