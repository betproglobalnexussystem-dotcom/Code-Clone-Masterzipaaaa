import { useState } from "react";
import { Gamepad2, Flame, Sparkles, Star, Crown, Search } from "lucide-react";
import PhaserSlotGame, { PHASER_THEMES, type GameTheme } from "./slots/PhaserSlotGame";
import { useAuth } from "../context/AuthContext";

type Cat = "all" | "popular" | "new" | "classic";

const GAME_META: Record<string, { cats: Cat[]; badge?: string; badgeColor?: string }> = {
  lucky7:  { cats:["popular","classic"], badge:"🔥 HOT",  badgeColor:"#FF1744" },
  egypt:   { cats:["popular"],           badge:"⭐ TOP",  badgeColor:"#FFB300" },
  dragon:  { cats:["popular"],           badge:"🔥 HOT",  badgeColor:"#FF1744" },
  gems:    { cats:["new","popular"],     badge:"💎 NEW",  badgeColor:"#00E5FF" },
  safari:  { cats:["new"],              badge:"🆕 NEW",  badgeColor:"#2DA962" },
};

const CATS: { id: Cat | "all"; label: string; icon: React.ReactNode }[] = [
  { id:"all",     label:"All Games", icon:<Gamepad2 size={13}/> },
  { id:"popular", label:"Popular",   icon:<Flame size={13}/>    },
  { id:"new",     label:"New",       icon:<Sparkles size={13}/> },
  { id:"classic", label:"Classic",   icon:<Star size={13}/>     },
];

/* ── Game preview card ── */
function GameCard({ theme, onClick }: { theme: GameTheme; onClick: ()=>void }) {
  const [hover, setHover] = useState(false);
  const meta = GAME_META[theme.id];
  const previewSyms = theme.symbols.filter(s=>!s.isWild&&!s.isScatter).slice(-4);

  return (
    <div
      onClick={onClick}
      onMouseEnter={()=>setHover(true)}
      onMouseLeave={()=>setHover(false)}
      style={{
        borderRadius:16, overflow:"hidden", cursor:"pointer",
        background:"#0f0f0f",
        border:`1px solid ${hover ? theme.accent+"60" : "rgba(255,255,255,0.07)"}`,
        transition:"transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
        transform: hover ? "translateY(-4px) scale(1.02)" : "none",
        boxShadow: hover
          ? `0 16px 40px ${theme.accent}28, 0 4px 12px rgba(0,0,0,0.6)`
          : "0 2px 10px rgba(0,0,0,0.5)",
        position:"relative",
      }}
    >
      {/* Preview area */}
      <div style={{ height:140, position:"relative", overflow:"hidden", background:theme.bg }}>
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.52)" }}/>

        {meta?.badge && (
          <div style={{
            position:"absolute", top:9, left:9, zIndex:2,
            background: meta.badgeColor ?? "#FF1744",
            color:"#fff", fontSize:9, fontWeight:800,
            padding:"3px 9px", borderRadius:20,
            fontFamily:"Oswald,sans-serif", letterSpacing:0.5,
            boxShadow:"0 2px 8px rgba(0,0,0,0.5)",
          }}>{meta.badge}</div>
        )}

        {/* RTP badge */}
        <div style={{
          position:"absolute", top:9, right:9, zIndex:2,
          background:"rgba(0,0,0,0.65)", backdropFilter:"blur(8px)",
          border:`1px solid ${theme.accent}40`,
          color:theme.accent, fontSize:9, fontWeight:700,
          padding:"3px 8px", borderRadius:20, fontFamily:"Oswald,sans-serif",
        }}>96% RTP</div>

        {/* Symbol preview row */}
        <div style={{
          position:"absolute", bottom:0, left:0, right:0, zIndex:2,
          display:"flex", justifyContent:"center", alignItems:"flex-end",
          gap:4, padding:"0 10px 10px",
        }}>
          {previewSyms.map((sym,i)=>(
            <div key={i} style={{
              width:36, height:36, borderRadius:8, flexShrink:0,
              background:`#${sym.bg.toString(16).padStart(6,"0")}`,
              border:`1px solid #${sym.edge.toString(16).padStart(6,"0")}40`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:18, boxShadow:"0 2px 8px rgba(0,0,0,0.6)",
              fontFamily:"Oswald,sans-serif", fontWeight:900,
              color: /^[a-zA-Z0-9☥☀♦⚡⭐]$/.test(sym.display)
                ? `#${sym.edge.toString(16).padStart(6,"0")}` : undefined,
            }}>{sym.display}</div>
          ))}
        </div>

        {/* Game name */}
        <div style={{
          position:"absolute", bottom:52, left:0, right:0,
          textAlign:"center", zIndex:2,
        }}>
          <div style={{
            color:theme.accent, fontSize:16, fontWeight:900,
            fontFamily:"Oswald,sans-serif", letterSpacing:1.5,
            textShadow:`0 0 20px ${theme.accent}`,
          }}>{theme.name.toUpperCase()}</div>
        </div>

        {/* Hover overlay */}
        {hover && (
          <div style={{
            position:"absolute", inset:0, background:"rgba(0,0,0,0.48)",
            display:"flex", alignItems:"center", justifyContent:"center", zIndex:3,
          }}>
            <div style={{
              background:`linear-gradient(135deg,${theme.accent},${theme.accent}99)`,
              color:"#000", fontSize:13, fontWeight:900,
              padding:"11px 28px", borderRadius:30,
              fontFamily:"Oswald,sans-serif", letterSpacing:1,
              boxShadow:`0 6px 20px ${theme.accent}55`,
            }}>▶ PLAY NOW</div>
          </div>
        )}
      </div>

      {/* Info strip */}
      <div style={{ padding:"10px 12px", background:"linear-gradient(180deg,#141414,#0f0f0f)" }}>
        <div style={{ color:"#e5e7eb", fontSize:12, fontWeight:700,
          fontFamily:"Oswald,sans-serif", letterSpacing:0.3, marginBottom:6 }}>
          {theme.name}
        </div>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:8 }}>
          {["Phaser Engine","10 Paylines","Free Spins","Wilds"].map(f=>(
            <span key={f} style={{
              background:`${theme.accent}10`,border:`1px solid ${theme.accent}22`,
              color:theme.accent, fontSize:8, fontWeight:600,
              padding:"2px 7px", borderRadius:20,
            }}>{f}</span>
          ))}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", gap:12 }}>
            {[["777×","MAX WIN"],["96%","RTP"],["100","MIN BET"]].map(([v,l])=>(
              <div key={l}>
                <div style={{ color:"#fff", fontSize:10, fontWeight:700 }}>{v}</div>
                <div style={{ color:"rgba(255,255,255,0.28)", fontSize:8 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{
            background:`linear-gradient(135deg,${theme.accent},${theme.accent}99)`,
            color:"#000", fontSize:10, fontWeight:900,
            padding:"7px 14px", borderRadius:20,
            fontFamily:"Oswald,sans-serif", letterSpacing:0.5,
          }}>PLAY</div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Casino Page ── */
export default function CasinoPage() {
  const [activeTheme, setActive] = useState<GameTheme|null>(null);
  const [cat, setCat]            = useState<Cat|"all">("all");
  const [search, setSearch]      = useState("");
  const { user } = useAuth();
  const balance = (user?.balance??0)+(user?.bonus??0);

  if (activeTheme) return <PhaserSlotGame theme={activeTheme} onBack={()=>setActive(null)}/>;

  const q = search.toLowerCase().trim();
  const filtered = PHASER_THEMES.filter(t=>{
    const m=GAME_META[t.id];
    return (cat==="all" || m?.cats.includes(cat as Cat))
        && (!q || t.name.toLowerCase().includes(q) || t.tagline.toLowerCase().includes(q));
  });

  return (
    <div style={{ background:"#0a0a0a", minHeight:"100vh" }}>
      {/* Hero */}
      <div style={{
        background:"linear-gradient(135deg,#0d1a0d,#0a1020,#1a0a20)",
        padding:"16px 14px 14px", position:"relative", overflow:"hidden",
        borderBottom:"1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{position:"absolute",top:-50,right:-50,width:180,height:180,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(45,169,98,0.18),transparent 70%)",pointerEvents:"none"}}/>

        <div style={{ position:"relative", display:"flex", alignItems:"center", gap:12 }}>
          <div style={{
            width:50,height:50,borderRadius:14,flexShrink:0,
            background:"linear-gradient(135deg,#2DA962,#1a6e3d)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:26,boxShadow:"0 4px 18px rgba(45,169,98,0.45)",
          }}>🎰</div>
          <div style={{ flex:1 }}>
            <div style={{
              fontSize:20,fontWeight:900,color:"#fff",
              fontFamily:"Oswald,sans-serif",letterSpacing:1.5,
              textShadow:"0 0 20px rgba(45,169,98,0.5)",
            }}>BETMALI CASINO</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:1 }}>
              {PHASER_THEMES.length} Phaser-engine slots · Real wallet · Real wins
            </div>
          </div>
          {user ? (
            <div style={{
              background:"rgba(45,169,98,0.12)",border:"1px solid rgba(45,169,98,0.32)",
              borderRadius:12,padding:"8px 14px",textAlign:"right",flexShrink:0,
            }}>
              <div style={{ color:"rgba(255,255,255,0.35)", fontSize:9, fontFamily:"Oswald,sans-serif" }}>
                MY BALANCE
              </div>
              <div style={{ color:"#2DA962", fontSize:16, fontWeight:800, fontFamily:"Oswald,sans-serif" }}>
                UGX {balance.toLocaleString()}
              </div>
            </div>
          ):(
            <div style={{
              background:"rgba(255,193,7,0.1)",border:"1px solid rgba(255,193,7,0.28)",
              borderRadius:12,padding:"9px 14px",fontSize:11,
              color:"#FFC107",fontFamily:"Oswald,sans-serif",fontWeight:800,
            }}>LOGIN TO PLAY</div>
          )}
        </div>

        {/* Real wallet callout */}
        <div style={{
          marginTop:14,
          background:"linear-gradient(90deg,rgba(45,169,98,0.09),rgba(124,77,255,0.09))",
          border:"1px solid rgba(45,169,98,0.18)",borderRadius:12,
          padding:"10px 14px",
          display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,
        }}>
          <div>
            <div style={{color:"#2DA962",fontSize:11,fontWeight:800,fontFamily:"Oswald,sans-serif"}}>
              ✅ REAL WALLET · PHASER 3 ENGINE
            </div>
            <div style={{color:"rgba(255,255,255,0.4)",fontSize:10,marginTop:2}}>
              Every bet deducted &amp; every win credited to your BetMali balance
            </div>
          </div>
          <div style={{ display:"flex", gap:12, flexShrink:0 }}>
            {[["777×","MAX WIN"],["96%","RTP"],["10","LINES"]].map(([v,l])=>(
              <div key={l} style={{textAlign:"center"}}>
                <div style={{color:"#fff",fontSize:13,fontWeight:800,fontFamily:"Oswald,sans-serif"}}>{v}</div>
                <div style={{color:"rgba(255,255,255,0.28)",fontSize:8}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding:"12px 14px 0" }}>
        <div style={{
          display:"flex",alignItems:"center",gap:9,
          background:"#111",border:"1px solid rgba(255,255,255,0.09)",
          borderRadius:12,padding:"10px 14px",
        }}>
          <Search size={15} color="rgba(255,255,255,0.28)"/>
          <input
            type="text" placeholder="Search games…" value={search}
            onChange={e=>setSearch(e.target.value)}
            style={{flex:1,background:"none",border:"none",outline:"none",
              color:"#fff",fontSize:13,fontFamily:"Roboto,sans-serif"}}
          />
          {search&&<div onClick={()=>setSearch("")}
            style={{color:"rgba(255,255,255,0.3)",cursor:"pointer",fontSize:18,lineHeight:1}}>×</div>}
        </div>
      </div>

      {/* Category tabs */}
      <div style={{ padding:"12px 14px 0", overflowX:"auto" }}>
        <div style={{ display:"flex", gap:8, minWidth:"max-content", paddingBottom:4 }}>
          {CATS.map(c=>{
            const active=cat===c.id;
            return(
              <button key={c.id} onClick={()=>setCat(c.id as Cat|"all")}
                style={{
                  display:"flex",alignItems:"center",gap:6,
                  padding:"7px 15px",borderRadius:20,cursor:"pointer",
                  border:"none",outline:"none",
                  background:active?"linear-gradient(135deg,#2DA962,#1a6e3d)":"rgba(255,255,255,0.06)",
                  color:active?"#fff":"rgba(255,255,255,0.5)",
                  fontSize:12,fontWeight:active?700:500,
                  fontFamily:"Roboto,sans-serif",
                  transition:"all 0.15s ease",
                  boxShadow:active?"0 4px 12px rgba(45,169,98,0.4)":"none",
                  whiteSpace:"nowrap",
                }}>
                {c.icon} {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Games grid */}
      <div style={{ padding:"16px 14px 24px" }}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            <Crown size={14} color="#FFD700"/>
            <span style={{color:"#e5e7eb",fontSize:13,fontWeight:700,fontFamily:"Oswald,sans-serif"}}>
              {cat==="all"?"ALL GAMES":CATS.find(c=>c.id===cat)?.label.toUpperCase()}
            </span>
          </div>
          <span style={{color:"rgba(255,255,255,0.28)",fontSize:10}}>
            {filtered.length} games · Phaser 3
          </span>
        </div>

        {filtered.length>0?(
          <div style={{
            display:"grid",
            gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",
            gap:14,
          }}>
            {filtered.map(t=>(
              <GameCard key={t.id} theme={t} onClick={()=>setActive(t)}/>
            ))}
          </div>
        ):(
          <div style={{textAlign:"center",padding:"50px 20px",color:"rgba(255,255,255,0.28)"}}>
            <div style={{fontSize:40,marginBottom:12}}>🔍</div>
            <div style={{fontSize:14,fontFamily:"Oswald,sans-serif"}}>No games found</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        margin:"0 14px 16px",padding:"12px 14px",
        background:"rgba(255,255,255,0.03)",
        border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,
        display:"flex",flexWrap:"wrap",gap:14,justifyContent:"center",
      }}>
        {["✅ Real Balance","🎮 Phaser 3 Engine","⚡ Instant Play","🏆 96%+ RTP","🎁 Free Spins","18+ Only"].map(t=>(
          <div key={t} style={{color:"rgba(255,255,255,0.28)",fontSize:10}}>{t}</div>
        ))}
      </div>
      <div style={{height:80}}/>
    </div>
  );
}
