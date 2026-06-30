import { useState } from "react";
import { Gamepad2, Flame, Sparkles, Zap, Star, Crown, Search } from "lucide-react";
import ProSlotGame, { SLOT_THEMES, type SlotTheme } from "./slots/ProSlotGame";
import { useAuth } from "../context/AuthContext";

type Category = "all" | "popular" | "new" | "classic";

const GAME_META: Record<string, { category: Category[]; badge?: string; badgeColor?: string; hot?: boolean }> = {
  lucky7: { category: ["popular", "classic"], badge: "🔥 HOT",   badgeColor: "#FF1744", hot: true },
  egypt:  { category: ["popular"],            badge: "⭐ TOP",   badgeColor: "#FFB300" },
  safari: { category: ["new"],                badge: "🆕 NEW",   badgeColor: "#2DA962" },
  dragon: { category: ["popular"],            badge: "🔥 HOT",   badgeColor: "#FF1744", hot: true },
  gems:   { category: ["new", "popular"],     badge: "💎 GEMS",  badgeColor: "#00E5FF" },
};

const CATS: { id: Category | "all"; label: string; icon: React.ReactNode }[] = [
  { id: "all",     label: "All Games", icon: <Gamepad2 size={13} /> },
  { id: "popular", label: "Popular",   icon: <Flame size={13} />    },
  { id: "new",     label: "New",       icon: <Sparkles size={13} /> },
  { id: "classic", label: "Classic",   icon: <Star size={13} />     },
];

function GameCard({
  theme, onClick,
}: {
  theme: SlotTheme;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const meta = GAME_META[theme.id];

  // Pick representative symbols for the preview
  const previewSyms = theme.symbols.filter(s => !s.isWild && !s.isScatter).slice(-4);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 16, overflow: "hidden", cursor: "pointer",
        background: "#0f0f0f",
        border: `1px solid ${hovered ? theme.accent + "70" : "rgba(255,255,255,0.07)"}`,
        transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
        transform: hovered ? "translateY(-4px) scale(1.02)" : "none",
        boxShadow: hovered
          ? `0 16px 40px ${theme.accent}30, 0 4px 12px rgba(0,0,0,0.6)`
          : "0 2px 10px rgba(0,0,0,0.5)",
        position: "relative",
      }}
    >
      {/* Game preview area */}
      <div style={{
        height: 140, position: "relative", overflow: "hidden",
        background: theme.bg,
      }}>
        {/* Dark overlay */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />

        {/* Badge */}
        {meta?.badge && (
          <div style={{
            position: "absolute", top: 9, left: 9,
            background: meta.badgeColor ?? "#FF1744",
            color: "#fff", fontSize: 9, fontWeight: 800,
            padding: "3px 9px", borderRadius: 20,
            fontFamily: "Oswald, sans-serif", letterSpacing: 0.5,
            boxShadow: "0 2px 8px rgba(0,0,0,0.5)", zIndex: 2,
          }}>
            {meta.badge}
          </div>
        )}

        {/* RTP badge */}
        <div style={{
          position: "absolute", top: 9, right: 9,
          background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)",
          border: `1px solid ${theme.accent}40`,
          color: theme.accent, fontSize: 9, fontWeight: 700,
          padding: "3px 8px", borderRadius: 20,
          fontFamily: "Oswald, sans-serif", zIndex: 2,
        }}>
          96% RTP
        </div>

        {/* Symbol preview */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          display: "flex", justifyContent: "center", alignItems: "flex-end",
          gap: 4, padding: "0 10px 10px", zIndex: 2,
        }}>
          {previewSyms.map((sym, i) => (
            <div key={i} style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: sym.bgGrad,
              border: `1px solid ${sym.color}40`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: sym.display.length === 1 && !sym.display.match(/\p{Emoji}/u) ? 18 : 18,
              boxShadow: `0 2px 8px rgba(0,0,0,0.6)`,
              fontFamily: "Oswald, sans-serif", fontWeight: 900,
              color: !sym.display.match(/\p{Emoji}/u) ? sym.color : undefined,
            }}>
              {sym.display}
            </div>
          ))}
        </div>

        {/* Game name overlay */}
        <div style={{
          position: "absolute", bottom: 48, left: 0, right: 0,
          textAlign: "center", zIndex: 2,
        }}>
          <div style={{
            color: theme.accent, fontSize: 16, fontWeight: 900,
            fontFamily: "Oswald, sans-serif", letterSpacing: 1.5,
            textShadow: `0 0 20px ${theme.accent}`,
          }}>
            {theme.name.toUpperCase()}
          </div>
        </div>

        {/* Hover PLAY overlay */}
        {hovered && (
          <div style={{
            position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3,
          }}>
            <div style={{
              background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentAlt})`,
              color: "#000", fontSize: 13, fontWeight: 900,
              padding: "11px 28px", borderRadius: 30,
              fontFamily: "Oswald, sans-serif", letterSpacing: 1,
              boxShadow: `0 6px 20px ${theme.accent}60`,
            }}>
              ▶ PLAY NOW
            </div>
          </div>
        )}
      </div>

      {/* Info strip */}
      <div style={{
        padding: "10px 12px",
        background: "linear-gradient(180deg, #141414, #0f0f0f)",
      }}>
        <div style={{
          color: "#e5e7eb", fontSize: 12, fontWeight: 700,
          fontFamily: "Oswald, sans-serif", letterSpacing: 0.3, marginBottom: 6,
        }}>
          {theme.name}
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
          {["10 Paylines", "Free Spins", "Wilds"].map(f => (
            <span key={f} style={{
              background: `${theme.accent}12`, border: `1px solid ${theme.accent}25`,
              color: theme.accent, fontSize: 8, fontWeight: 600,
              padding: "2px 7px", borderRadius: 20,
            }}>{f}</span>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div>
              <div style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>777×</div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 8 }}>MAX WIN</div>
            </div>
            <div>
              <div style={{ color: "#2DA962", fontSize: 10, fontWeight: 700 }}>96%</div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 8 }}>RTP</div>
            </div>
            <div>
              <div style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>UGX 100</div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 8 }}>MIN BET</div>
            </div>
          </div>
          <div style={{
            background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentAlt})`,
            color: "#000", fontSize: 10, fontWeight: 900,
            padding: "7px 14px", borderRadius: 20,
            fontFamily: "Oswald, sans-serif", letterSpacing: 0.5,
            cursor: "pointer",
          }}>
            PLAY
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CasinoPage() {
  const [activeTheme, setActiveTheme] = useState<SlotTheme | null>(null);
  const [category, setCategory] = useState<Category | "all">("all");
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const balance = (user?.balance ?? 0) + (user?.bonus ?? 0);

  if (activeTheme) {
    return <ProSlotGame theme={activeTheme} onBack={() => setActiveTheme(null)} />;
  }

  const q = search.toLowerCase().trim();
  const filtered = SLOT_THEMES.filter(t => {
    const meta = GAME_META[t.id];
    const matchesCat = category === "all" || meta?.category.includes(category as Category);
    const matchesQ = !q || t.name.toLowerCase().includes(q) || t.tagline.toLowerCase().includes(q);
    return matchesCat && matchesQ;
  });

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh" }}>
      <style>{`
        @keyframes casinoGlow {
          0%, 100% { opacity: 0.7; }
          50%       { opacity: 1; }
        }
      `}</style>

      {/* ── HERO HEADER ── */}
      <div style={{
        background: "linear-gradient(135deg, #0d1a0d 0%, #0a1020 50%, #1a0a20 100%)",
        padding: "16px 14px 14px", position: "relative", overflow: "hidden",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{
          position: "absolute", top: -50, right: -50,
          width: 180, height: 180, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(45,169,98,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -40, left: -30,
          width: 140, height: 140, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,77,255,0.14) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 50, height: 50, borderRadius: 14, flexShrink: 0,
            background: "linear-gradient(135deg, #2DA962, #1a6e3d)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, boxShadow: "0 4px 18px rgba(45,169,98,0.45)",
          }}>🎰</div>

          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 20, fontWeight: 900, color: "#fff",
              fontFamily: "Oswald, sans-serif", letterSpacing: 1.5,
              textShadow: "0 0 20px rgba(45,169,98,0.5)",
            }}>
              BETMALI CASINO
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>
              {SLOT_THEMES.length} slot games · Real wallet · Real wins · 10 paylines
            </div>
          </div>

          {user ? (
            <div style={{
              background: "rgba(45,169,98,0.12)", border: "1px solid rgba(45,169,98,0.35)",
              borderRadius: 12, padding: "8px 14px", textAlign: "right", flexShrink: 0,
            }}>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, fontFamily: "Oswald, sans-serif" }}>
                MY BALANCE
              </div>
              <div style={{ color: "#2DA962", fontSize: 16, fontWeight: 800, fontFamily: "Oswald, sans-serif" }}>
                UGX {balance.toLocaleString()}
              </div>
            </div>
          ) : (
            <div style={{
              background: "rgba(255,193,7,0.1)", border: "1px solid rgba(255,193,7,0.3)",
              borderRadius: 12, padding: "9px 14px", fontSize: 11,
              color: "#FFC107", fontFamily: "Oswald, sans-serif", fontWeight: 800,
            }}>
              LOGIN TO PLAY
            </div>
          )}
        </div>

        {/* Wallet banner */}
        <div style={{
          marginTop: 14,
          background: "linear-gradient(90deg, rgba(45,169,98,0.1), rgba(124,77,255,0.1))",
          border: "1px solid rgba(45,169,98,0.2)", borderRadius: 12,
          padding: "10px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 10,
        }}>
          <div>
            <div style={{ color: "#2DA962", fontSize: 11, fontWeight: 800, fontFamily: "Oswald, sans-serif" }}>
              ✅ REAL WALLET INTEGRATION
            </div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, marginTop: 2 }}>
              Bets deducted &amp; wins credited directly to your BetMali balance
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
            {[["777×", "MAX WIN"], ["96%", "RTP"], ["10", "LINES"]].map(([v, l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ color: "#fff", fontSize: 13, fontWeight: 800, fontFamily: "Oswald, sans-serif" }}>{v}</div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 8 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SEARCH ── */}
      <div style={{ padding: "12px 14px 0" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 9,
          background: "#111", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12, padding: "10px 14px",
        }}>
          <Search size={15} color="rgba(255,255,255,0.3)" />
          <input
            type="text"
            placeholder="Search games…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: "#fff", fontSize: 13, fontFamily: "Roboto, sans-serif",
            }}
          />
          {search && (
            <div onClick={() => setSearch("")}
              style={{ color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</div>
          )}
        </div>
      </div>

      {/* ── CATEGORY TABS ── */}
      <div style={{ padding: "12px 14px 0", overflowX: "auto" }}>
        <div style={{ display: "flex", gap: 8, minWidth: "max-content", paddingBottom: 4 }}>
          {CATS.map(cat => {
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id as Category | "all")}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 15px", borderRadius: 20, cursor: "pointer",
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
                {cat.icon} {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── GAMES GRID ── */}
      <div style={{ padding: "16px 14px 24px" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Crown size={14} color="#FFD700" />
            <span style={{ color: "#e5e7eb", fontSize: 13, fontWeight: 700, fontFamily: "Oswald, sans-serif" }}>
              {category === "all" ? "ALL GAMES" : CATS.find(c => c.id === category)?.label.toUpperCase()}
            </span>
          </div>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>
            {filtered.length} games · Real balance
          </span>
        </div>

        {filtered.length > 0 ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 14,
          }}>
            {filtered.map(theme => (
              <GameCard
                key={theme.id}
                theme={theme}
                onClick={() => setActiveTheme(theme)}
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "rgba(255,255,255,0.3)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 14, fontFamily: "Oswald, sans-serif" }}>No games found</div>
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        margin: "0 14px 16px",
        padding: "12px 14px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
        display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center",
      }}>
        {["✅ Real Balance", "🔒 Provably Fair", "⚡ Instant Play", "🏆 96%+ RTP", "🎁 Free Spins", "18+ Only"].map(t => (
          <div key={t} style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{t}</div>
        ))}
      </div>
      <div style={{ height: 80 }} />
    </div>
  );
}
