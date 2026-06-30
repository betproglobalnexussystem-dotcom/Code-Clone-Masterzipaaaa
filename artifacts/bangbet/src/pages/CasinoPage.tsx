import { useState } from "react";
import { ChevronLeft, Search, Gamepad2, Loader, Star, Zap, Flame, Sparkles, Crown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import GoldenPharaohSlot from "./slots/GoldenPharaohSlot";
import DragonFortuneSlot from "./slots/DragonFortuneSlot";
import VikingConquestSlot from "./slots/VikingConquestSlot";

type Category = "all" | "popular" | "new" | "megaways" | "classics" | "originals";
type CustomGameId = "pharaoh" | "dragon" | "viking";

interface PPGame {
  symbol: string;
  name: string;
  categories: Category[];
  rtp: string;
  maxWin: string;
  badge?: string;
  badgeColor?: string;
}

type ActiveGame =
  | { type: "pp"; game: PPGame }
  | { type: "custom"; id: CustomGameId }
  | null;

const PP_GAMES: PPGame[] = [
  { symbol: "vs20olympx",    name: "Gates of Olympus",       categories: ["popular"],            rtp: "96.50%", maxWin: "5,000×",   badge: "🔥 HOT",      badgeColor: "#FF1744" },
  { symbol: "vs20starlight", name: "Starlight Princess",     categories: ["popular","new"],       rtp: "96.50%", maxWin: "5,000×",   badge: "⭐ TOP",       badgeColor: "#FFC107" },
  { symbol: "vs10bbbonanza", name: "Big Bass Bonanza",       categories: ["popular"],            rtp: "96.71%", maxWin: "2,100×",   badge: "🔥 HOT",      badgeColor: "#FF1744" },
  { symbol: "vs10doghouse",  name: "The Dog House",          categories: ["popular","classics"], rtp: "96.51%", maxWin: "6,750×" },
  { symbol: "vs20fruitparty",name: "Fruit Party",            categories: ["popular"],            rtp: "96.47%", maxWin: "5,000×" },
  { symbol: "vs25wildwest",  name: "Wild West Gold",         categories: ["popular"],            rtp: "96.51%", maxWin: "10,000×" },
  { symbol: "vs10firestrike",name: "Fire Strike",            categories: ["classics"],           rtp: "96.52%", maxWin: "5,000×" },
  { symbol: "vs25wolfgold",  name: "Wolf Gold",              categories: ["popular","classics"], rtp: "96.01%", maxWin: "5,000×" },
  { symbol: "vs25mustang",   name: "Mustang Gold",           categories: ["popular"],            rtp: "96.53%", maxWin: "5,000×" },
  { symbol: "vs20gemsbonanza",name:"Gems Bonanza",           categories: ["popular"],            rtp: "96.51%", maxWin: "250,000×"},
  { symbol: "vs1lion",       name: "5 Lions Gold",           categories: ["classics"],           rtp: "95.01%", maxWin: "5,000×" },
  { symbol: "vs10bookof",    name: "Book of Fallen",         categories: ["popular","classics"], rtp: "96.48%", maxWin: "5,000×" },
  { symbol: "vs20aztec",     name: "Aztec Bonanza",          categories: ["megaways"],           rtp: "96.51%", maxWin: "150,000×",badge: "♾ MEGAWAYS",  badgeColor: "#9C27B0" },
  { symbol: "vs40pirate",    name: "Pirate Gold Deluxe",     categories: ["classics"],           rtp: "96.50%", maxWin: "2,500×" },
  { symbol: "vs20kraken",    name: "Release the Kraken 2",   categories: ["popular","new"],      rtp: "96.55%", maxWin: "5,000×",   badge: "🆕 NEW",      badgeColor: "#2DA962" },
  { symbol: "vs20honey",     name: "Honey Honey Honey",      categories: ["classics"],           rtp: "96.40%", maxWin: "5,000×" },
  { symbol: "vs20rhino",     name: "Great Rhino Megaways",   categories: ["megaways","popular"], rtp: "96.55%", maxWin: "20,000×",  badge: "♾ MEGAWAYS",  badgeColor: "#9C27B0" },
  { symbol: "vs20monkeymd",  name: "Monkey Madness",         categories: ["new"],                rtp: "96.64%", maxWin: "5,000×",   badge: "🆕 NEW",      badgeColor: "#2DA962" },
  { symbol: "vs20sugarrush", name: "Sugar Rush",             categories: ["new","popular"],      rtp: "96.50%", maxWin: "5,000×",   badge: "🔥 HOT",      badgeColor: "#FF1744" },
  { symbol: "vs10chkchase",  name: "Chicken Chase",          categories: ["new"],                rtp: "96.50%", maxWin: "5,000×",   badge: "🆕 NEW",      badgeColor: "#2DA962" },
  { symbol: "vs20superx",    name: "Super X",                categories: ["classics"],           rtp: "96.06%", maxWin: "5,000×" },
  { symbol: "vs1powerap",    name: "Power of Thor Megaways", categories: ["megaways"],           rtp: "96.55%", maxWin: "20,000×",  badge: "♾ MEGAWAYS",  badgeColor: "#9C27B0" },
  { symbol: "vs20moneymaze", name: "Magic Money Maze",       categories: ["new"],                rtp: "96.53%", maxWin: "5,000×",   badge: "🆕 NEW",      badgeColor: "#2DA962" },
  { symbol: "vs25jokerking", name: "Joker King",             categories: ["classics"],           rtp: "96.51%", maxWin: "500×" },
  { symbol: "vs20farmfest",  name: "Wild Farm",              categories: ["new"],                rtp: "96.51%", maxWin: "5,000×",   badge: "🆕 NEW",      badgeColor: "#2DA962" },
];

const ORIGINALS = [
  { id: "pharaoh" as CustomGameId, name: "Golden Pharaoh",  emoji: "👑", tagline: "Ancient Egypt Awaits",    color: "#FFD700", rtp: "96%", maxWin: "300×" },
  { id: "dragon"  as CustomGameId, name: "Dragon Fortune",  emoji: "🐉", tagline: "Legendary Asian Riches",  color: "#FF5252", rtp: "96%", maxWin: "300×" },
  { id: "viking"  as CustomGameId, name: "Viking Conquest", emoji: "⚡", tagline: "Conquer Norse Riches",    color: "#64B5F6", rtp: "96%", maxWin: "300×" },
];

const CATS: { id: Category; label: string; icon: React.ReactNode }[] = [
  { id: "all",       label: "All Games",   icon: <Gamepad2 size={13} /> },
  { id: "popular",   label: "Popular",     icon: <Flame size={13} /> },
  { id: "new",       label: "New",         icon: <Sparkles size={13} /> },
  { id: "megaways",  label: "Megaways",    icon: <Zap size={13} /> },
  { id: "classics",  label: "Classics",    icon: <Star size={13} /> },
  { id: "originals", label: "Originals",   icon: <Crown size={13} /> },
];

function getPPUrl(symbol: string) {
  return `https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?gameSymbol=${symbol}&websiteUrl=https://demogamesfree.pragmaticplay.net&lobbyUrl=https://demogamesfree.pragmaticplay.net&jurisdiction=99&lang=EN`;
}

function getPPThumb(symbol: string) {
  return `https://eg.pragmaticplay.net/game_pic/square/200/${symbol}.jpg`;
}

function GameThumb({ symbol, name }: { symbol: string; name: string }) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <div style={{
        width: "100%", paddingBottom: "100%", position: "relative",
        background: "linear-gradient(135deg, #1a1a2e 0%, #2a1f3d 100%)",
      }}>
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 40,
        }}>🎰</div>
      </div>
    );
  }
  return (
    <div style={{ width: "100%", paddingBottom: "100%", position: "relative", overflow: "hidden" }}>
      <img
        src={getPPThumb(symbol)}
        alt={name}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        onError={() => setErr(true)}
      />
    </div>
  );
}

function PPGamePlayer({ game, onBack }: { game: PPGame; onBack: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const { user } = useAuth();
  const balance = (user?.balance ?? 0) + (user?.bonus ?? 0);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0a0a0a", zIndex: 300, display: "flex", flexDirection: "column" }}>
      <style>{`@keyframes spinLoad { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }`}</style>

      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
        background: "#111827", borderBottom: "1px solid #1f2937", flexShrink: 0,
        minHeight: 56,
      }}>
        <button
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)",
            color: "#fff", borderRadius: 8, padding: "8px 13px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5, fontSize: 12,
            fontWeight: 700, fontFamily: "Oswald, sans-serif", whiteSpace: "nowrap",
          }}
        >
          <ChevronLeft size={15} /> BACK
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "Oswald, sans-serif", letterSpacing: 0.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {game.name}
          </div>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>Pragmatic Play</div>
        </div>

        <div style={{
          background: "rgba(255,193,7,0.12)", border: "1px solid rgba(255,193,7,0.4)",
          color: "#FFC107", padding: "5px 11px", borderRadius: 20,
          fontSize: 10, fontWeight: 800, fontFamily: "Oswald, sans-serif",
          letterSpacing: 0.5, whiteSpace: "nowrap", flexShrink: 0,
        }}>
          🎮 DEMO
        </div>

        {user && (
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, fontFamily: "Oswald, sans-serif" }}>MY BALANCE</div>
            <div style={{ color: "#2DA962", fontSize: 13, fontWeight: 800, fontFamily: "Oswald, sans-serif" }}>
              UGX {balance.toLocaleString()}
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {!loaded && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 18, background: "#0d0d14", zIndex: 2,
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: "50%",
              border: "3px solid #2DA962", borderTopColor: "transparent",
              animation: "spinLoad 0.8s linear infinite",
            }} />
            <div style={{ color: "#2DA962", fontSize: 14, fontFamily: "Oswald, sans-serif", letterSpacing: 1 }}>
              Loading {game.name}...
            </div>
            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, textAlign: "center", maxWidth: 260 }}>
              Powered by Pragmatic Play · Demo Mode
            </div>
          </div>
        )}
        <iframe
          src={getPPUrl(game.symbol)}
          title={game.name}
          style={{ width: "100%", height: "100%", border: "none", display: "block" }}
          allow="fullscreen; autoplay; payment"
          allowFullScreen
          onLoad={() => setLoaded(true)}
        />
      </div>
    </div>
  );
}

function PPGameCard({ game, onClick }: { game: PPGame; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 12, overflow: "hidden", cursor: "pointer",
        background: "#111827", border: "1px solid #1f2937",
        transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
        transform: hovered ? "translateY(-3px) scale(1.02)" : "none",
        boxShadow: hovered ? "0 12px 32px rgba(45,169,98,0.25)" : "0 2px 8px rgba(0,0,0,0.4)",
        borderColor: hovered ? "rgba(45,169,98,0.5)" : "#1f2937",
        position: "relative",
      }}
    >
      <div style={{ position: "relative" }}>
        <GameThumb symbol={game.symbol} name={game.name} />
        {game.badge && (
          <div style={{
            position: "absolute", top: 7, left: 7,
            background: game.badgeColor ?? "#FF1744",
            color: "#fff", fontSize: 9, fontWeight: 800,
            padding: "3px 8px", borderRadius: 20,
            fontFamily: "Oswald, sans-serif", letterSpacing: 0.5,
            boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
          }}>
            {game.badge}
          </div>
        )}
        {hovered && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              background: "#2DA962", color: "#fff", fontSize: 12, fontWeight: 800,
              padding: "10px 22px", borderRadius: 30, fontFamily: "Oswald, sans-serif",
              letterSpacing: 1, boxShadow: "0 4px 16px rgba(45,169,98,0.5)",
            }}>
              ▶ PLAY
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: "8px 9px 10px" }}>
        <div style={{
          color: "#e5e7eb", fontSize: 11, fontWeight: 600,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          marginBottom: 4,
        }}>{game.name}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 9 }}>RTP {game.rtp}</span>
          <span style={{ color: "#2DA962", fontSize: 9, fontWeight: 700 }}>MAX {game.maxWin}</span>
        </div>
      </div>
    </div>
  );
}

function OriginalCard({ game, onClick }: { game: typeof ORIGINALS[0]; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 12, overflow: "hidden", cursor: "pointer",
        background: `linear-gradient(135deg, #0d0d1a, #1a1a2e)`,
        border: `1px solid ${game.color}30`,
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        transform: hovered ? "translateY(-3px) scale(1.02)" : "none",
        boxShadow: hovered ? `0 12px 32px ${game.color}40` : `0 2px 8px rgba(0,0,0,0.5)`,
        position: "relative",
      }}
    >
      <div style={{
        aspectRatio: "1", background: `radial-gradient(circle at center, ${game.color}15, #0d0d1a)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 52, position: "relative",
      }}>
        {game.emoji}
        <div style={{
          position: "absolute", top: 7, left: 7,
          background: "rgba(45,169,98,0.9)", color: "#fff",
          fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 20,
          fontFamily: "Oswald, sans-serif",
        }}>
          👑 ORIGINAL
        </div>
        {hovered && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              background: game.color, color: "#000", fontSize: 12, fontWeight: 800,
              padding: "10px 22px", borderRadius: 30, fontFamily: "Oswald, sans-serif",
              letterSpacing: 1,
            }}>
              ▶ PLAY
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: "8px 9px 10px" }}>
        <div style={{
          color: game.color, fontSize: 11, fontWeight: 700,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          marginBottom: 4, fontFamily: "Oswald, sans-serif",
        }}>{game.name}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 9 }}>RTP {game.rtp}</span>
          <span style={{ color: "#2DA962", fontSize: 9, fontWeight: 700 }}>MAX {game.maxWin}</span>
        </div>
      </div>
    </div>
  );
}

export default function CasinoPage() {
  const [activeGame, setActiveGame] = useState<ActiveGame>(null);
  const [category, setCategory] = useState<Category>("all");
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const balance = (user?.balance ?? 0) + (user?.bonus ?? 0);

  if (activeGame?.type === "custom") {
    const onBack = () => setActiveGame(null);
    if (activeGame.id === "pharaoh") return <GoldenPharaohSlot onBack={onBack} />;
    if (activeGame.id === "dragon")  return <DragonFortuneSlot onBack={onBack} />;
    if (activeGame.id === "viking")  return <VikingConquestSlot onBack={onBack} />;
  }
  if (activeGame?.type === "pp") {
    return <PPGamePlayer game={activeGame.game} onBack={() => setActiveGame(null)} />;
  }

  const q = search.toLowerCase().trim();
  const filteredPP = PP_GAMES.filter((g) => {
    const matchesCat = category === "all" || category === "originals" ? true : g.categories.includes(category);
    const matchesQ = !q || g.name.toLowerCase().includes(q);
    return matchesCat && matchesQ;
  });
  const showOriginals = (category === "all" || category === "originals") && (!q || ORIGINALS.some((o) => o.name.toLowerCase().includes(q)));

  return (
    <div style={{ background: "#0d0d14", minHeight: "100vh", fontFamily: "'Roboto', sans-serif" }}>
      <style>{`
        @keyframes casinoShimmer {
          0%   { background-position: -300% 0; }
          100% { background-position:  300% 0; }
        }
        @keyframes casinoPulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.6; }
        }
      `}</style>

      {/* ─── HERO HEADER ─── */}
      <div style={{
        background: "linear-gradient(135deg, #0d1a0d 0%, #0a1628 50%, #1a0a28 100%)",
        padding: "16px 14px 14px", position: "relative", overflow: "hidden",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{
          position: "absolute", top: -40, right: -40,
          width: 160, height: 160, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(45,169,98,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -30, left: -20,
          width: 120, height: 120, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(156,39,176,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: "linear-gradient(135deg, #2DA962, #1a6e3d)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, boxShadow: "0 4px 16px rgba(45,169,98,0.4)",
          }}>🎰</div>

          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 18, fontWeight: 900, color: "#fff",
              fontFamily: "Oswald, sans-serif", letterSpacing: 1,
              textShadow: "0 0 20px rgba(45,169,98,0.4)",
            }}>
              BETMALI CASINO
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
              {PP_GAMES.length + ORIGINALS.length} games · Pragmatic Play · BetMali Originals
            </div>
          </div>

          {user ? (
            <div style={{
              background: "rgba(45,169,98,0.12)", border: "1px solid rgba(45,169,98,0.35)",
              borderRadius: 12, padding: "8px 13px", textAlign: "right",
            }}>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, fontFamily: "Oswald, sans-serif" }}>BALANCE</div>
              <div style={{ color: "#2DA962", fontSize: 15, fontWeight: 800, fontFamily: "Oswald, sans-serif" }}>
                UGX {balance.toLocaleString()}
              </div>
            </div>
          ) : (
            <div style={{
              background: "rgba(255,193,7,0.1)", border: "1px solid rgba(255,193,7,0.3)",
              borderRadius: 12, padding: "8px 13px", fontSize: 10,
              color: "#FFC107", fontFamily: "Oswald, sans-serif", fontWeight: 700,
            }}>
              LOGIN TO PLAY
            </div>
          )}
        </div>

        <div style={{
          marginTop: 14, background: "linear-gradient(90deg, rgba(45,169,98,0.12), rgba(156,39,176,0.12))",
          border: "1px solid rgba(45,169,98,0.2)", borderRadius: 12, padding: "10px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ color: "#FFD700", fontSize: 12, fontWeight: 800, fontFamily: "Oswald, sans-serif", letterSpacing: 0.5 }}>
              🎁 200% CASINO WELCOME BONUS
            </div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, marginTop: 2 }}>
              Up to UGX 740,000 on your first casino deposit
            </div>
          </div>
          <div style={{
            background: "linear-gradient(135deg, #FFD700, #FFA000)", color: "#000",
            fontSize: 11, fontWeight: 800, padding: "8px 14px", borderRadius: 20,
            fontFamily: "Oswald, sans-serif", letterSpacing: 0.5, cursor: "pointer",
            flexShrink: 0,
          }}>
            CLAIM
          </div>
        </div>
      </div>

      {/* ─── SEARCH ─── */}
      <div style={{ padding: "12px 14px 0" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 9,
          background: "#111827", border: "1px solid #1f2937",
          borderRadius: 12, padding: "9px 13px",
        }}>
          <Search size={15} color="rgba(255,255,255,0.3)" />
          <input
            type="text"
            placeholder="Search games…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: "#fff", fontSize: 13, fontFamily: "Roboto, sans-serif",
            }}
          />
          {search && (
            <div
              onClick={() => setSearch("")}
              style={{ color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 16, lineHeight: 1 }}
            >×</div>
          )}
        </div>
      </div>

      {/* ─── CATEGORY TABS ─── */}
      <div style={{ padding: "12px 14px 0", overflowX: "auto" }}>
        <div style={{ display: "flex", gap: 7, minWidth: "max-content", paddingBottom: 4 }}>
          {CATS.map((cat) => {
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: 20, cursor: "pointer",
                  border: "none", outline: "none",
                  background: active
                    ? "linear-gradient(135deg, #2DA962, #1a6e3d)"
                    : "rgba(255,255,255,0.06)",
                  color: active ? "#fff" : "rgba(255,255,255,0.5)",
                  fontSize: 12, fontWeight: active ? 700 : 500,
                  fontFamily: "Roboto, sans-serif",
                  transition: "all 0.15s ease",
                  boxShadow: active ? "0 4px 12px rgba(45,169,98,0.4)" : "none",
                  whiteSpace: "nowrap",
                }}
              >
                {cat.icon}
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── ORIGINALS SECTION ─── */}
      {showOriginals && (
        <div style={{ padding: "18px 14px 4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
            <Crown size={14} color="#FFD700" />
            <span style={{ color: "#FFD700", fontSize: 12, fontWeight: 700, fontFamily: "Oswald, sans-serif", letterSpacing: 0.5 }}>
              BETMALI ORIGINALS
            </span>
            <span style={{
              background: "#2DA962", color: "#fff", fontSize: 9, fontWeight: 800,
              padding: "2px 8px", borderRadius: 10, fontFamily: "Oswald, sans-serif",
            }}>
              REAL BALANCE
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {ORIGINALS.filter((o) => !q || o.name.toLowerCase().includes(q)).map((orig) => (
              <OriginalCard
                key={orig.id}
                game={orig}
                onClick={() => setActiveGame({ type: "custom", id: orig.id })}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── PP GAMES GRID ─── */}
      {filteredPP.length > 0 && category !== "originals" && (
        <div style={{ padding: "18px 14px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Gamepad2 size={14} color="#9C27B0" />
              <span style={{ color: "#e5e7eb", fontSize: 12, fontWeight: 700, fontFamily: "Oswald, sans-serif", letterSpacing: 0.5 }}>
                {category === "all" ? "ALL GAMES" : CATS.find((c) => c.id === category)?.label.toUpperCase()}
              </span>
            </div>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>
              {filteredPP.length} games · Pragmatic Play
            </span>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: 10,
          }}>
            {filteredPP.map((game) => (
              <PPGameCard
                key={game.symbol}
                game={game}
                onClick={() => setActiveGame({ type: "pp", game })}
              />
            ))}
          </div>
        </div>
      )}

      {filteredPP.length === 0 && !showOriginals && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.3)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 14, fontFamily: "Oswald, sans-serif", marginBottom: 6 }}>No games found</div>
          <div style={{ fontSize: 12 }}>Try a different search or category</div>
        </div>
      )}

      {/* ─── FOOTER ─── */}
      <div style={{
        margin: "0 14px 16px",
        padding: "12px 14px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
        display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center",
      }}>
        {[
          "🔒 Provably Fair",
          "⚡ Instant Play",
          "🏆 96%+ RTP",
          "🎮 25+ Games",
          "18+ Only",
        ].map((t) => (
          <div key={t} style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{t}</div>
        ))}
      </div>
      <div style={{ height: 80 }} />
    </div>
  );
}
