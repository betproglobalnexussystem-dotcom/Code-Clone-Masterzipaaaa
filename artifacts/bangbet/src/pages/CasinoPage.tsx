import { useState } from "react";
import { Dices, ChevronRight, Zap, Trophy, Shield } from "lucide-react";
import GoldenPharaohSlot from "./slots/GoldenPharaohSlot";
import DragonFortuneSlot from "./slots/DragonFortuneSlot";
import VikingConquestSlot from "./slots/VikingConquestSlot";

type GameId = "pharaoh" | "dragon" | "viking" | null;

const GAMES = [
  {
    id: "pharaoh" as GameId,
    name: "Golden Pharaoh",
    tagline: "Ancient Egypt Awaits",
    tag: "HOT",
    tagColor: "#FF1744",
    rtp: "96% RTP",
    maxWin: "300x",
    bg: "linear-gradient(160deg, #1a0d00 0%, #3d2000 60%, #0d0800 100%)",
    accentColor: "#FFD700",
    bgImage: "https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=600&q=80",
    emoji: "👑",
    features: ["25 Paylines", "Free Spins", "Wild Scarab"],
    symbolsPreview: ["👑", "☥", "👁", "🪲", "🔺"],
  },
  {
    id: "dragon" as GameId,
    name: "Dragon Fortune",
    tagline: "Legendary Asian Riches",
    tag: "NEW",
    tagColor: "#2DA962",
    rtp: "96% RTP",
    maxWin: "300x",
    bg: "linear-gradient(160deg, #1a0000 0%, #3d0000 60%, #0a0000 100%)",
    accentColor: "#FF4444",
    bgImage: "https://images.unsplash.com/photo-1610870946651-fdc6f51c8d9c?w=600&q=80",
    emoji: "🐉",
    features: ["25 Paylines", "Free Spins", "Gold Wild"],
    symbolsPreview: ["🐉", "🐯", "🌸", "🪙", "🏮"],
  },
  {
    id: "viking" as GameId,
    name: "Viking Conquest",
    tagline: "Conquer Norse Riches",
    tag: "TOP",
    tagColor: "#1565C0",
    rtp: "96% RTP",
    maxWin: "300x",
    bg: "linear-gradient(160deg, #000d1a 0%, #001a3d 60%, #000610 100%)",
    accentColor: "#64B5F6",
    bgImage: "https://images.unsplash.com/photo-1531685250784-7569952593d2?w=600&q=80",
    emoji: "⚡",
    features: ["25 Paylines", "Free Spins", "Shield Wild"],
    symbolsPreview: ["⚡", "🪓", "🐺", "🛡", "🚢"],
  },
];

export default function CasinoPage() {
  const [activeGame, setActiveGame] = useState<GameId>(null);

  if (activeGame === "pharaoh") return <GoldenPharaohSlot onBack={() => setActiveGame(null)} />;
  if (activeGame === "dragon") return <DragonFortuneSlot onBack={() => setActiveGame(null)} />;
  if (activeGame === "viking") return <VikingConquestSlot onBack={() => setActiveGame(null)} />;

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh" }}>
      <style>{`
        @keyframes cardShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes floatEmoji {
          0%, 100% { transform: translateY(0px) rotate(-5deg); }
          50% { transform: translateY(-8px) rotate(5deg); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .game-card-lobby:active {
          transform: scale(0.97) !important;
        }
      `}</style>

      <div
        style={{
          background: "linear-gradient(135deg, #1a6e3d, #2DA962)",
          padding: "13px 14px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.07)",
            top: -30,
            right: 70,
          }}
        />
        <div
          style={{
            background: "rgba(255,255,255,0.18)",
            borderRadius: 12,
            width: 46,
            height: 46,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <Dices size={24} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#fff",
              fontFamily: "Oswald, sans-serif",
              letterSpacing: "0.3px",
            }}
          >
            CASINO WELCOME BONUS
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
            200% up to UGX 740,000 on first casino deposit
          </div>
        </div>
        <div
          style={{
            background: "#fff",
            color: "var(--green-dark)",
            fontSize: 11,
            fontWeight: 700,
            padding: "8px 13px",
            borderRadius: 20,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontFamily: "Oswald, sans-serif",
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            cursor: "pointer",
          }}
        >
          CLAIM <ChevronRight size={12} />
        </div>
      </div>

      <div style={{ padding: "18px 14px 6px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#FFD700",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "Oswald, sans-serif",
              letterSpacing: 1,
            }}
          >
            <Zap size={15} color="#FFD700" />
            PREMIUM SLOT GAMES
          </div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>
            3 games · Provably Fair
          </div>
        </div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 14 }}>
          Real paylines · Free spins · Wild symbols · 25 paylines each
        </div>
      </div>

      <div style={{ padding: "0 14px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {GAMES.map((game) => (
          <div
            key={game.id}
            className="game-card-lobby"
            onClick={() => setActiveGame(game.id)}
            style={{
              borderRadius: 18,
              overflow: "hidden",
              cursor: "pointer",
              position: "relative",
              boxShadow: `0 8px 32px ${game.accentColor}30, 0 2px 8px rgba(0,0,0,0.5)`,
              border: `1px solid ${game.accentColor}30`,
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              transform: "scale(1)",
            }}
          >
            <div
              style={{
                position: "relative",
                height: 160,
                background: game.bg,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `url(${game.bgImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  opacity: 0.3,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `linear-gradient(180deg, transparent 20%, ${game.bg} 100%)`,
                }}
              />

              <div
                style={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  background: game.tagColor,
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "3px 10px",
                  borderRadius: 20,
                  letterSpacing: 1,
                }}
              >
                {game.tag}
              </div>

              <div
                style={{
                  position: "absolute",
                  top: 8,
                  right: 12,
                  background: "rgba(0,0,0,0.5)",
                  border: `1px solid ${game.accentColor}40`,
                  color: game.accentColor,
                  fontSize: 9,
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: 20,
                  backdropFilter: "blur(8px)",
                }}
              >
                {game.rtp}
              </div>

              <div
                style={{
                  position: "absolute",
                  right: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 72,
                  opacity: 0.8,
                  animation: "floatEmoji 3s ease-in-out infinite",
                  filter: `drop-shadow(0 0 16px ${game.accentColor})`,
                }}
              >
                {game.emoji}
              </div>

              <div
                style={{
                  position: "absolute",
                  bottom: 12,
                  left: 12,
                }}
              >
                <div
                  style={{
                    color: game.accentColor,
                    fontSize: 20,
                    fontWeight: 900,
                    fontFamily: "Oswald, sans-serif",
                    letterSpacing: 1,
                    textShadow: `0 0 20px ${game.accentColor}80`,
                    lineHeight: 1.1,
                  }}
                >
                  {game.name.toUpperCase()}
                </div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.55)",
                    fontSize: 11,
                    marginTop: 2,
                  }}
                >
                  {game.tagline}
                </div>
              </div>
            </div>

            <div
              style={{
                background: "linear-gradient(180deg, #111 0%, #0d0d0d 100%)",
                padding: "12px 14px 14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  marginBottom: 12,
                  overflowX: "auto",
                }}
              >
                {game.symbolsPreview.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.06)",
                      border: `1px solid ${game.accentColor}25`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      flexShrink: 0,
                    }}
                  >
                    {s}
                  </div>
                ))}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: `${game.accentColor}10`,
                    border: `1px dashed ${game.accentColor}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    color: game.accentColor,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  +more
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 6,
                  marginBottom: 12,
                }}
              >
                {game.features.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      background: `${game.accentColor}12`,
                      border: `1px solid ${game.accentColor}25`,
                      color: game.accentColor,
                      fontSize: 9,
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: 20,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {f}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ display: "flex", gap: 12, flex: 1 }}>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 9 }}>
                    <span style={{ display: "block", color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: 11 }}>
                      {game.maxWin}
                    </span>
                    MAX WIN
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 9 }}>
                    <span style={{ display: "block", color: "#2DA962", fontWeight: 700, fontSize: 11 }}>
                      96%
                    </span>
                    RTP
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 9 }}>
                    <span style={{ display: "block", color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: 11 }}>
                      UGX 100
                    </span>
                    MIN BET
                  </div>
                </div>

                <button
                  style={{
                    background: `linear-gradient(135deg, ${game.accentColor}, ${game.accentColor}aa)`,
                    border: "none",
                    color: "#000",
                    fontSize: 12,
                    fontWeight: 800,
                    padding: "10px 20px",
                    borderRadius: 10,
                    cursor: "pointer",
                    letterSpacing: 0.5,
                    fontFamily: "Oswald, sans-serif",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    boxShadow: `0 4px 16px ${game.accentColor}50`,
                    flexShrink: 0,
                  }}
                >
                  PLAY NOW <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          margin: "0 14px 16px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12,
          padding: "12px 14px",
          display: "flex",
          gap: 16,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.4)", fontSize: 10 }}>
          <Shield size={11} /> Provably Fair
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.4)", fontSize: 10 }}>
          <Trophy size={11} /> 96% RTP
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.4)", fontSize: 10 }}>
          <Zap size={11} /> Instant Play
        </div>
      </div>

      <div className="footer-note">
        18+ Only. Please gamble responsibly. Licensed by the Uganda National Gaming Board.
      </div>
    </div>
  );
}
