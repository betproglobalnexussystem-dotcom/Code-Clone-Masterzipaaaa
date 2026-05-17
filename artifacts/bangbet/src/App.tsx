import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
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
import type { Match } from "./components/MatchCard";
import "./index.css";

export type Page = "home" | "sport" | "live" | "results" | "promotions" | "profile" | "notifications";

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

function AppInner({ onOpenAdmin }: { onOpenAdmin: () => void }) {
  const { user } = useAuth();
  const [activePage, setActivePage] = useState<Page>("home");
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showBetSlip, setShowBetSlip] = useState(false);
  const [betSelections, setBetSelections] = useState<BetSelection[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const openLogin = () => { setShowRegister(false); setShowLogin(true); };
  const openRegister = () => { setShowLogin(false); setShowRegister(true); };
  const closeModal = () => { setShowLogin(false); setShowRegister(false); };

  const addBet = (bet: BetSelection) => {
    if (!user) { openLogin(); return; }
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
        return <SportPage onAddBet={addBet} betSelections={betSelections} onMatchClick={handleMatchClick} isLive={activePage === "live"} />;
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
      <PendingPaymentRecovery />
      <Header onLoginClick={openLogin} onRegisterClick={openRegister} onHomeClick={() => { setSelectedMatch(null); setActivePage("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
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
      <BottomNav
        activePage={selectedMatch ? activePage : activePage}
        setActivePage={(p) => { setSelectedMatch(null); setActivePage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        betCount={betSelections.length}
        onBetSlipClick={() => setShowBetSlip(true)}
      />

      {showBetSlip && (
        <BetSlip selections={betSelections} onRemove={removeBet} onClose={() => setShowBetSlip(false)} onBetPlaced={clearBets} />
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
