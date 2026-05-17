interface SvgProps { size?: number }

function Defs({ id, c1, c2, c3 }: { id: string; c1: string; c2: string; c3?: string }) {
  return (
    <defs>
      <linearGradient id={`g-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={c1} />
        <stop offset="55%" stopColor={c2} />
        {c3 && <stop offset="100%" stopColor={c3} />}
      </linearGradient>
      <filter id={`glow-${id}`}>
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
  );
}

function GemCard({ letter, c1, c2, textColor, size = 56 }: { letter: string; c1: string; c2: string; textColor: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
      <Defs id={letter} c1={c1} c2={c2} />
      <rect x="4" y="4" width="48" height="48" rx="8" fill={`url(#g-${letter})`} />
      <rect x="7" y="7" width="42" height="42" rx="6" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      <rect x="10" y="10" width="36" height="36" rx="5" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      {/* Corner diamonds */}
      <polygon points="10,4 16,10 10,16" fill="rgba(255,255,255,0.15)" />
      <polygon points="46,4 40,10 46,16" fill="rgba(255,255,255,0.15)" />
      <polygon points="10,52 16,46 10,40" fill="rgba(255,255,255,0.1)" />
      <polygon points="46,52 40,46 46,40" fill="rgba(255,255,255,0.1)" />
      <text x="28" y="36" textAnchor="middle" fontFamily="Georgia,serif" fontWeight="900" fontSize={letter.length > 1 ? "19" : "24"} fill={textColor} style={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
        {letter}
      </text>
      {/* Shine overlay */}
      <rect x="4" y="4" width="48" height="20" rx="8" fill="rgba(255,255,255,0.08)" />
    </svg>
  );
}

export function SymA({ size = 56 }: SvgProps) {
  return <GemCard letter="A" c1="#8B0000" c2="#CC0000" textColor="#FFD700" size={size} />;
}
export function SymK({ size = 56 }: SvgProps) {
  return <GemCard letter="K" c1="#0d47a1" c2="#1976D2" textColor="#90CAF9" size={size} />;
}
export function SymQ({ size = 56 }: SvgProps) {
  return <GemCard letter="Q" c1="#4a148c" c2="#7B1FA2" textColor="#CE93D8" size={size} />;
}
export function SymJ({ size = 56 }: SvgProps) {
  return <GemCard letter="J" c1="#1B5E20" c2="#388E3C" textColor="#A5D6A7" size={size} />;
}
export function Sym10({ size = 56 }: SvgProps) {
  return <GemCard letter="10" c1="#4a3500" c2="#7a5c00" textColor="#FFD700" size={size} />;
}
export function Sym9({ size = 56 }: SvgProps) {
  return <GemCard letter="9" c1="#263238" c2="#37474F" textColor="#90A4AE" size={size} />;
}

export function PhPharaoh({ size = 56 }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ph-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE566" />
          <stop offset="50%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#CC7700" />
        </linearGradient>
        <linearGradient id="ph-face" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F5CBA7" />
          <stop offset="100%" stopColor="#D4A574" />
        </linearGradient>
      </defs>
      {/* Headdress top */}
      <rect x="18" y="4" width="20" height="6" rx="3" fill="url(#ph-gold)" />
      {/* Headdress main - nemes cloth */}
      <path d="M12 10 L44 10 L48 28 L40 44 L16 44 L8 28 Z" fill="url(#ph-gold)" />
      {/* Blue stripes on headdress */}
      <rect x="13" y="13" width="30" height="3" rx="1" fill="#1565C0" opacity="0.85" />
      <rect x="13" y="18" width="30" height="3" rx="1" fill="#1565C0" opacity="0.85" />
      <rect x="14" y="23" width="28" height="3" rx="1" fill="#1565C0" opacity="0.85" />
      <rect x="15" y="28" width="26" height="3" rx="1" fill="#1565C0" opacity="0.85" />
      {/* Gold band across top of face */}
      <rect x="15" y="10" width="26" height="5" rx="2" fill="url(#ph-gold)" />
      <circle cx="28" cy="12" r="2" fill="#E53935" />
      {/* Face */}
      <ellipse cx="28" cy="30" rx="12" ry="13" fill="url(#ph-face)" />
      {/* Eye outlines (kohl) */}
      <path d="M19 28 Q22 25 25 28 Q22 31 19 28Z" fill="#1a1a1a" />
      <path d="M31 28 Q34 25 37 28 Q34 31 31 28Z" fill="#1a1a1a" />
      {/* Eyes */}
      <ellipse cx="22" cy="28" rx="2.5" ry="2" fill="white" />
      <circle cx="22" cy="28" r="1.3" fill="#1a1a1a" />
      <circle cx="22.5" cy="27.4" r="0.5" fill="white" />
      <ellipse cx="34" cy="28" rx="2.5" ry="2" fill="white" />
      <circle cx="34" cy="28" r="1.3" fill="#1a1a1a" />
      <circle cx="34.5" cy="27.4" r="0.5" fill="white" />
      {/* Blue glowing irises */}
      <circle cx="22" cy="28" r="0.8" fill="#4FC3F7" opacity="0.7" />
      <circle cx="34" cy="28" r="0.8" fill="#4FC3F7" opacity="0.7" />
      {/* Nose */}
      <path d="M26 31 L28 35 L30 31" fill="none" stroke="#C4916A" strokeWidth="0.8" />
      {/* Mouth */}
      <path d="M24 37 Q28 40 32 37" fill="none" stroke="#A0522D" strokeWidth="1.2" strokeLinecap="round" />
      {/* Gold collar */}
      <path d="M16 44 Q28 48 40 44" fill="none" stroke="url(#ph-gold)" strokeWidth="2.5" />
      {/* Gems on collar */}
      <circle cx="28" cy="46" r="2" fill="#E53935" />
      <circle cx="22" cy="45" r="1.5" fill="#1976D2" />
      <circle cx="34" cy="45" r="1.5" fill="#1976D2" />
    </svg>
  );
}

export function PhAnkh({ size = 56 }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ankh-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE566" />
          <stop offset="50%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
        <filter id="ankh-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Loop top */}
      <ellipse cx="28" cy="18" rx="10" ry="12" fill="none" stroke="url(#ankh-g)" strokeWidth="5.5" filter="url(#ankh-glow)" />
      <ellipse cx="28" cy="18" rx="5" ry="7" fill="url(#ankh-g)" opacity="0.15" />
      {/* Vertical bar */}
      <rect x="24.5" y="28" width="7" height="24" rx="3.5" fill="url(#ankh-g)" />
      {/* Horizontal bar */}
      <rect x="10" y="33" width="36" height="7" rx="3.5" fill="url(#ankh-g)" />
      {/* Center jewel */}
      <circle cx="28" cy="37" r="4" fill="#E53935" stroke="url(#ankh-g)" strokeWidth="1.5" />
      <circle cx="28" cy="37" r="2" fill="#FF6B6B" />
      <circle cx="27" cy="36" r="0.8" fill="rgba(255,255,255,0.7)" />
      {/* Decorative corners on cross */}
      <circle cx="10" cy="36.5" r="2.5" fill="url(#ankh-g)" />
      <circle cx="46" cy="36.5" r="2.5" fill="url(#ankh-g)" />
      <circle cx="28" cy="52" r="2.5" fill="url(#ankh-g)" />
      {/* Shine on loop */}
      <ellipse cx="24" cy="12" rx="3" ry="2" fill="rgba(255,255,255,0.4)" transform="rotate(-30,24,12)" />
    </svg>
  );
}

export function PhEyeRa({ size = 56 }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="eye-gold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFE566" />
          <stop offset="100%" stopColor="#CC7700" />
        </linearGradient>
        <radialGradient id="eye-iris" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#29B6F6" />
          <stop offset="60%" stopColor="#0288D1" />
          <stop offset="100%" stopColor="#01579B" />
        </radialGradient>
      </defs>
      {/* Rays of Ra */}
      {[0,45,90,135,180,225,270,315].map((angle, i) => (
        <line key={i} x1="28" y1="28" x2={28 + Math.cos(angle * Math.PI / 180) * 22} y2={28 + Math.sin(angle * Math.PI / 180) * 22}
          stroke="#FFD700" strokeWidth="1.5" opacity="0.5" />
      ))}
      {/* Eye white */}
      <path d="M6 28 Q28 10 50 28 Q28 46 6 28Z" fill="white" />
      {/* Kohl outline */}
      <path d="M4 28 Q28 8 52 28 Q28 48 4 28Z" fill="none" stroke="#1a1a1a" strokeWidth="2.5" />
      {/* Iris */}
      <circle cx="28" cy="28" r="9" fill="url(#eye-iris)" />
      {/* Pupil */}
      <circle cx="28" cy="28" r="5" fill="#0a0a1a" />
      <circle cx="29" cy="26" r="2" fill="rgba(255,255,255,0.5)" />
      {/* Gold iris ring */}
      <circle cx="28" cy="28" r="9" fill="none" stroke="url(#eye-gold)" strokeWidth="1.5" />
      {/* Kohl lines (Egyptian style) */}
      <path d="M6 28 L2 30" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M50 28 L54 30" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M28 46 L28 52" stroke="url(#eye-gold)" strokeWidth="2" strokeLinecap="round" />
      {/* Gold teardrops */}
      <path d="M8 30 Q5 35 8 38 Q12 36 10 30Z" fill="url(#eye-gold)" opacity="0.8" />
    </svg>
  );
}

export function PhWild({ size = 56 }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="scarab-body" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#66BB6A" />
          <stop offset="70%" stopColor="#2E7D32" />
          <stop offset="100%" stopColor="#1B5E20" />
        </radialGradient>
        <linearGradient id="scarab-wing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00E676" />
          <stop offset="100%" stopColor="#1B5E20" />
        </linearGradient>
      </defs>
      {/* Wings left */}
      <path d="M28 22 Q8 16 4 30 Q6 42 20 40 L28 36Z" fill="url(#scarab-wing)" stroke="#00E676" strokeWidth="0.8" />
      {/* Wings right */}
      <path d="M28 22 Q48 16 52 30 Q50 42 36 40 L28 36Z" fill="url(#scarab-wing)" stroke="#00E676" strokeWidth="0.8" />
      {/* Wing veins left */}
      <path d="M20 22 Q14 28 18 36" fill="none" stroke="#004D40" strokeWidth="0.8" opacity="0.6" />
      <path d="M14 24 Q10 30 14 38" fill="none" stroke="#004D40" strokeWidth="0.8" opacity="0.6" />
      {/* Wing veins right */}
      <path d="M36 22 Q42 28 38 36" fill="none" stroke="#004D40" strokeWidth="0.8" opacity="0.6" />
      <path d="M42 24 Q46 30 42 38" fill="none" stroke="#004D40" strokeWidth="0.8" opacity="0.6" />
      {/* Body */}
      <ellipse cx="28" cy="32" rx="9" ry="12" fill="url(#scarab-body)" />
      {/* Pronotum (head shield) */}
      <ellipse cx="28" cy="21" rx="7" ry="5" fill="url(#scarab-body)" />
      {/* Head */}
      <ellipse cx="28" cy="15" rx="5" ry="4" fill="#2E7D32" />
      {/* Eyes */}
      <circle cx="25" cy="14" r="1.5" fill="#FFD700" />
      <circle cx="31" cy="14" r="1.5" fill="#FFD700" />
      <circle cx="25" cy="14" r="0.7" fill="#1a1a1a" />
      <circle cx="31" cy="14" r="0.7" fill="#1a1a1a" />
      {/* Horns */}
      <path d="M24 12 L20 6" stroke="#2E7D32" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M32 12 L36 6" stroke="#2E7D32" strokeWidth="1.5" strokeLinecap="round" />
      {/* Body segments */}
      <line x1="19" y1="28" x2="37" y2="28" stroke="#1B5E20" strokeWidth="1" opacity="0.5" />
      <line x1="19" y1="33" x2="37" y2="33" stroke="#1B5E20" strokeWidth="1" opacity="0.5" />
      <line x1="19" y1="38" x2="37" y2="38" stroke="#1B5E20" strokeWidth="1" opacity="0.5" />
      {/* WILD text */}
      <text x="28" y="51" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="7" fill="#00E676" letterSpacing="1">WILD</text>
    </svg>
  );
}

export function PhScatter({ size = 56 }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pyr-g" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#CC7700" />
          <stop offset="50%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#FFE566" />
        </linearGradient>
        <radialGradient id="eye-glow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#4FC3F7" />
          <stop offset="100%" stopColor="#0288D1" />
        </radialGradient>
      </defs>
      {/* Stars around pyramid */}
      {[30,60,90,120,150].map((angle, i) => (
        <circle key={i}
          cx={28 + Math.cos((angle - 90) * Math.PI / 180) * 24}
          cy={28 + Math.sin((angle - 90) * Math.PI / 180) * 24}
          r="1.5" fill="#FFD700" opacity="0.7" />
      ))}
      {/* Pyramid */}
      <polygon points="28,8 6,48 50,48" fill="url(#pyr-g)" />
      {/* Pyramid shading */}
      <polygon points="28,8 28,48 50,48" fill="rgba(0,0,0,0.2)" />
      {/* Stone lines */}
      <line x1="17" y1="28" x2="39" y2="28" stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
      <line x1="12" y1="38" x2="44" y2="38" stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
      <line x1="22" y1="18" x2="34" y2="18" stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
      {/* Glowing Eye of Ra in center */}
      <ellipse cx="28" cy="30" rx="8" ry="5" fill="rgba(255,255,255,0.9)" />
      <circle cx="28" cy="30" r="4" fill="url(#eye-glow)" />
      <circle cx="28" cy="30" r="2" fill="#0a0a1a" />
      <circle cx="28.8" cy="29.2" r="0.8" fill="rgba(255,255,255,0.7)" />
      {/* Glow rays from eye */}
      <circle cx="28" cy="30" r="6" fill="none" stroke="#4FC3F7" strokeWidth="0.8" opacity="0.5" />
      <circle cx="28" cy="30" r="9" fill="none" stroke="#4FC3F7" strokeWidth="0.5" opacity="0.3" />
      {/* SCATTER text */}
      <text x="28" y="54" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="6" fill="#FFD700" letterSpacing="0.5">SCATTER</text>
    </svg>
  );
}

export function DrDragon({ size = 56 }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="dr-scale" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B6B" />
          <stop offset="50%" stopColor="#CC0000" />
          <stop offset="100%" stopColor="#8B0000" />
        </linearGradient>
        <radialGradient id="dr-eye" cx="30%" cy="30%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#FF6D00" />
        </radialGradient>
      </defs>
      {/* Dragon body/neck */}
      <path d="M18 48 Q14 40 16 30 Q18 22 28 18 Q38 14 44 20 Q50 26 46 34 Q42 42 34 46 Q26 50 18 48Z" fill="url(#dr-scale)" />
      {/* Head */}
      <path d="M28 8 Q38 6 44 14 Q50 22 44 28 Q38 34 30 30 Q22 26 22 18 Q22 10 28 8Z" fill="url(#dr-scale)" />
      {/* Snout */}
      <path d="M36 16 Q44 14 46 20 Q42 24 38 22 Q36 20 36 16Z" fill="#CC0000" />
      {/* Nostrils */}
      <ellipse cx="42" cy="18" rx="1.5" ry="1" fill="#8B0000" />
      <ellipse cx="44" cy="20" rx="1" ry="0.8" fill="#8B0000" />
      {/* Fire breath */}
      <path d="M44 18 Q50 14 54 10 Q52 16 56 18 Q50 18 54 22 Q50 20 44 22Z" fill="#FF6D00" opacity="0.9" />
      <path d="M46 17 Q52 12 56 10 Q54 16 58 16" fill="none" stroke="#FFD700" strokeWidth="1.5" opacity="0.7" />
      {/* Eye */}
      <ellipse cx="32" cy="18" rx="5" ry="4" fill="white" />
      <circle cx="32" cy="18" r="3" fill="url(#dr-eye)" />
      <ellipse cx="32" cy="18" rx="1" ry="2" fill="#1a1a1a" />
      <circle cx="31" cy="17" r="0.8" fill="rgba(255,255,255,0.8)" />
      {/* Horns */}
      <path d="M30 8 Q28 2 26 0" stroke="#CC0000" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M36 7 Q36 1 38 0" stroke="#CC0000" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Scales texture */}
      <circle cx="25" cy="35" r="2.5" fill="none" stroke="#8B0000" strokeWidth="0.8" />
      <circle cx="31" cy="38" r="2.5" fill="none" stroke="#8B0000" strokeWidth="0.8" />
      <circle cx="37" cy="35" r="2.5" fill="none" stroke="#8B0000" strokeWidth="0.8" />
      <circle cx="22" cy="43" r="2" fill="none" stroke="#8B0000" strokeWidth="0.8" />
      <circle cx="28" cy="46" r="2" fill="none" stroke="#8B0000" strokeWidth="0.8" />
      {/* Wing tip */}
      <path d="M16 30 Q6 24 4 16 Q10 18 14 22" fill="#CC0000" opacity="0.7" />
    </svg>
  );
}

export function DrTiger({ size = 56 }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="tiger-fur" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#FF9800" />
          <stop offset="100%" stopColor="#E65100" />
        </radialGradient>
      </defs>
      {/* Ears */}
      <polygon points="14,14 10,4 20,10" fill="url(#tiger-fur)" />
      <polygon points="42,14 46,4 36,10" fill="url(#tiger-fur)" />
      <polygon points="15,13 12,6 19,10" fill="#CC3300" />
      <polygon points="41,13 44,6 37,10" fill="#CC3300" />
      {/* Head */}
      <ellipse cx="28" cy="28" rx="20" ry="20" fill="url(#tiger-fur)" />
      {/* White face patches */}
      <ellipse cx="21" cy="32" rx="7" ry="6" fill="#FFF8E1" />
      <ellipse cx="35" cy="32" rx="7" ry="6" fill="#FFF8E1" />
      <ellipse cx="28" cy="35" rx="8" ry="6" fill="#FFF8E1" />
      {/* Stripes */}
      <path d="M10 20 Q14 18 14 22" stroke="#1a1a1a" strokeWidth="2.5" fill="none" />
      <path d="M8 26 Q12 24 12 28" stroke="#1a1a1a" strokeWidth="2.5" fill="none" />
      <path d="M8 32 Q12 30 12 34" stroke="#1a1a1a" strokeWidth="2.5" fill="none" />
      <path d="M46 20 Q42 18 42 22" stroke="#1a1a1a" strokeWidth="2.5" fill="none" />
      <path d="M48 26 Q44 24 44 28" stroke="#1a1a1a" strokeWidth="2.5" fill="none" />
      <path d="M48 32 Q44 30 44 34" stroke="#1a1a1a" strokeWidth="2.5" fill="none" />
      {/* Forehead stripes */}
      <path d="M22 10 Q24 8 26 10" stroke="#1a1a1a" strokeWidth="1.5" fill="none" />
      <path d="M28 8 Q28 6 28 9" stroke="#1a1a1a" strokeWidth="1.5" fill="none" />
      <path d="M30 10 Q32 8 34 10" stroke="#1a1a1a" strokeWidth="1.5" fill="none" />
      {/* Eyes */}
      <ellipse cx="21" cy="24" rx="5" ry="4" fill="#FFF" />
      <ellipse cx="35" cy="24" rx="5" ry="4" fill="#FFF" />
      <circle cx="21" cy="24" r="3" fill="#4CAF50" />
      <ellipse cx="21" cy="24" rx="1.2" ry="2.5" fill="#1a1a1a" />
      <circle cx="20.2" cy="23" r="0.9" fill="rgba(255,255,255,0.8)" />
      <circle cx="35" cy="24" r="3" fill="#4CAF50" />
      <ellipse cx="35" cy="24" rx="1.2" ry="2.5" fill="#1a1a1a" />
      <circle cx="34.2" cy="23" r="0.9" fill="rgba(255,255,255,0.8)" />
      {/* Nose */}
      <path d="M25 34 L28 36 L31 34 L28 32Z" fill="#CC3300" />
      {/* Mouth */}
      <path d="M24 37 Q28 42 32 37" fill="none" stroke="#CC3300" strokeWidth="1.5" />
      {/* Whiskers */}
      <line x1="10" y1="33" x2="20" y2="34" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" />
      <line x1="10" y1="36" x2="20" y2="36" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" />
      <line x1="46" y1="33" x2="36" y2="34" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" />
      <line x1="46" y1="36" x2="36" y2="36" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" />
    </svg>
  );
}

export function DrLotus({ size = 56 }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="petal-g" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F48FB1" />
          <stop offset="100%" stopColor="#FCE4EC" />
        </linearGradient>
        <linearGradient id="petal-inner" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#FF8C00" />
        </linearGradient>
      </defs>
      {/* Outer petals */}
      <path d="M28 28 Q20 14 14 8 Q18 18 20 28Z" fill="url(#petal-g)" />
      <path d="M28 28 Q36 14 42 8 Q38 18 36 28Z" fill="url(#petal-g)" />
      <path d="M28 28 Q10 22 6 16 Q14 22 20 28Z" fill="url(#petal-g)" opacity="0.9" />
      <path d="M28 28 Q46 22 50 16 Q42 22 36 28Z" fill="url(#petal-g)" opacity="0.9" />
      <path d="M28 28 Q6 28 2 22 Q10 26 18 28Z" fill="url(#petal-g)" opacity="0.8" />
      <path d="M28 28 Q50 28 54 22 Q46 26 38 28Z" fill="url(#petal-g)" opacity="0.8" />
      {/* Inner petals */}
      <path d="M28 28 Q24 16 24 10 Q26 18 28 24Z" fill="#FCE4EC" />
      <path d="M28 28 Q32 16 32 10 Q30 18 28 24Z" fill="#FCE4EC" />
      <path d="M28 28 Q16 24 12 20 Q20 24 24 28Z" fill="#FCE4EC" opacity="0.9" />
      <path d="M28 28 Q40 24 44 20 Q36 24 32 28Z" fill="#FCE4EC" opacity="0.9" />
      {/* Center */}
      <circle cx="28" cy="28" r="7" fill="url(#petal-inner)" />
      <circle cx="28" cy="28" r="5" fill="#FF8C00" />
      {/* Stamens */}
      {[0,45,90,135,180,225,270,315].map((a, i) => (
        <line key={i}
          x1={28 + Math.cos(a * Math.PI / 180) * 4}
          y1={28 + Math.sin(a * Math.PI / 180) * 4}
          x2={28 + Math.cos(a * Math.PI / 180) * 7}
          y2={28 + Math.sin(a * Math.PI / 180) * 7}
          stroke="#FFD700" strokeWidth="1" />
      ))}
      <circle cx="28" cy="28" r="3" fill="#FFD700" />
      {/* Water ripple */}
      <path d="M14 44 Q28 40 42 44" fill="none" stroke="#4DD0E1" strokeWidth="1.5" opacity="0.6" />
      <path d="M18 48 Q28 45 38 48" fill="none" stroke="#4DD0E1" strokeWidth="1.5" opacity="0.4" />
      {/* Lily pad */}
      <ellipse cx="28" cy="46" rx="16" ry="6" fill="#2E7D32" opacity="0.5" />
      <line x1="28" y1="40" x2="28" y2="46" stroke="#1B5E20" strokeWidth="1.5" />
    </svg>
  );
}

export function DrWild({ size = 56 }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="coin-g" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#FFE566" />
          <stop offset="50%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#CC7700" />
        </radialGradient>
      </defs>
      {/* Coin shadow */}
      <ellipse cx="30" cy="32" rx="20" ry="20" fill="rgba(0,0,0,0.3)" />
      {/* Coin body */}
      <circle cx="28" cy="28" r="22" fill="#CC7700" />
      <circle cx="28" cy="28" r="20" fill="url(#coin-g)" />
      {/* Coin rim */}
      <circle cx="28" cy="28" r="22" fill="none" stroke="#B8860B" strokeWidth="2" />
      <circle cx="28" cy="28" r="18" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      {/* Dragon emblem */}
      <path d="M28 14 Q34 12 38 16 Q42 20 40 26 Q38 32 34 34 Q30 36 26 32 Q22 28 22 22 Q22 16 28 14Z"
        fill="rgba(180,100,0,0.8)" stroke="#CC7700" strokeWidth="1" />
      {/* Chinese character (stylized) */}
      <line x1="28" y1="16" x2="28" y2="32" stroke="#8B4513" strokeWidth="2" />
      <line x1="22" y1="22" x2="34" y2="22" stroke="#8B4513" strokeWidth="2" />
      <line x1="22" y1="27" x2="34" y2="27" stroke="#8B4513" strokeWidth="2" />
      {/* Shine */}
      <ellipse cx="20" cy="18" rx="6" ry="4" fill="rgba(255,255,255,0.35)" transform="rotate(-30,20,18)" />
      {/* WILD text */}
      <text x="28" y="46" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="7" fill="#8B4513" letterSpacing="1">WILD</text>
    </svg>
  );
}

export function DrScatter({ size = 56 }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lant-g" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF1744" />
          <stop offset="100%" stopColor="#8B0000" />
        </linearGradient>
        <radialGradient id="lant-glow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#FFD700" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FF6D00" stopOpacity="0.2" />
        </radialGradient>
      </defs>
      {/* Glow behind lantern */}
      <circle cx="28" cy="30" r="18" fill="url(#lant-glow)" />
      {/* String top */}
      <line x1="28" y1="2" x2="28" y2="10" stroke="#8B4513" strokeWidth="2" />
      <circle cx="28" cy="10" r="2" fill="#FFD700" />
      {/* Lantern top cap */}
      <rect x="18" y="10" width="20" height="5" rx="2" fill="url(#lant-g)" />
      {/* Lantern body */}
      <rect x="14" y="15" width="28" height="30" rx="8" fill="url(#lant-g)" />
      {/* Lantern ribs */}
      <line x1="20" y1="15" x2="20" y2="45" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      <line x1="28" y1="15" x2="28" y2="45" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      <line x1="36" y1="15" x2="36" y2="45" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      {/* Inner glow */}
      <rect x="18" y="19" width="20" height="22" rx="5" fill="#FFD700" opacity="0.6" />
      <rect x="21" y="22" width="14" height="16" rx="3" fill="#FF8C00" opacity="0.5" />
      {/* Chinese pattern */}
      <path d="M22 28 Q28 24 34 28 Q28 32 22 28Z" fill="rgba(180,0,0,0.7)" />
      {/* Bottom cap */}
      <rect x="18" y="45" width="20" height="5" rx="2" fill="url(#lant-g)" />
      {/* Tassels */}
      <line x1="22" y1="50" x2="20" y2="56" stroke="#FFD700" strokeWidth="1.5" />
      <line x1="28" y1="50" x2="28" y2="56" stroke="#FFD700" strokeWidth="1.5" />
      <line x1="34" y1="50" x2="36" y2="56" stroke="#FFD700" strokeWidth="1.5" />
      <circle cx="20" cy="56" r="1.5" fill="#FFD700" />
      <circle cx="28" cy="56" r="1.5" fill="#FFD700" />
      <circle cx="36" cy="56" r="1.5" fill="#FFD700" />
    </svg>
  );
}

export function VkThor({ size = 56 }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bolt-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF176" />
          <stop offset="50%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#FF8F00" />
        </linearGradient>
        <filter id="bolt-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Outer glow */}
      <polygon points="34,2 22,26 30,26 18,54 38,26 28,26" fill="#FFD700" opacity="0.3" filter="url(#bolt-glow)" transform="scale(1.1) translate(-2.5,-2.5)" />
      {/* Main lightning bolt */}
      <polygon points="34,2 22,26 30,26 18,54 38,26 28,26" fill="url(#bolt-g)" stroke="#FF8F00" strokeWidth="1" />
      {/* Inner bright core */}
      <polygon points="32,8 24,26 30,26 20,48 36,26 28,26" fill="#FFFDE7" opacity="0.5" />
      {/* Electricity sparks */}
      <line x1="38" y1="16" x2="46" y2="12" stroke="#FFD700" strokeWidth="1.5" opacity="0.7" strokeLinecap="round" />
      <line x1="40" y1="22" x2="50" y2="20" stroke="#FFD700" strokeWidth="1" opacity="0.6" strokeLinecap="round" />
      <line x1="18" y1="36" x2="10" y2="40" stroke="#FFD700" strokeWidth="1.5" opacity="0.7" strokeLinecap="round" />
      <line x1="16" y1="42" x2="8" y2="44" stroke="#FFD700" strokeWidth="1" opacity="0.6" strokeLinecap="round" />
      {/* Sparkles */}
      <circle cx="42" cy="10" r="2" fill="#FFD700" opacity="0.8" />
      <circle cx="52" cy="18" r="1.5" fill="#FFF176" opacity="0.7" />
      <circle cx="8" cy="38" r="2" fill="#FFD700" opacity="0.8" />
      <circle cx="4" cy="46" r="1.5" fill="#FFF176" opacity="0.7" />
    </svg>
  );
}

export function VkAxe({ size = 56 }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="steel-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#CFD8DC" />
          <stop offset="40%" stopColor="#90A4AE" />
          <stop offset="100%" stopColor="#37474F" />
        </linearGradient>
        <linearGradient id="handle-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8D6E63" />
          <stop offset="100%" stopColor="#4E342E" />
        </linearGradient>
      </defs>
      {/* Handle */}
      <rect x="26" y="14" width="6" height="38" rx="3" fill="url(#handle-g)" transform="rotate(20,29,33)" />
      {/* Handle wrap */}
      <rect x="26" y="20" width="6" height="4" rx="1" fill="#5D4037" transform="rotate(20,29,22)" opacity="0.8" />
      <rect x="26" y="26" width="6" height="4" rx="1" fill="#5D4037" transform="rotate(20,29,28)" opacity="0.8" />
      <rect x="26" y="32" width="6" height="4" rx="1" fill="#5D4037" transform="rotate(20,29,34)" opacity="0.8" />
      {/* Axe head */}
      <path d="M18 10 Q14 16 14 22 Q14 28 18 30 L34 22Z" fill="url(#steel-g)" />
      <path d="M18 10 Q26 6 34 10 L34 22 Q26 18 18 22Z" fill="url(#steel-g)" />
      {/* Blade edge highlight */}
      <path d="M14 16 Q12 22 14 26" stroke="#ECEFF1" strokeWidth="2" fill="none" opacity="0.8" />
      {/* Rune engravings */}
      <text x="18" y="22" fontFamily="serif" fontSize="8" fill="#90A4AE" transform="rotate(-10,18,22)">ᚠ</text>
      {/* Steel shine */}
      <path d="M20 12 Q24 14 22 18" fill="rgba(255,255,255,0.3)" />
      {/* Bottom spike */}
      <path d="M24 46 L28 54 L32 46" fill="url(#handle-g)" transform="rotate(20,28,50)" />
    </svg>
  );
}

export function VkWolf({ size = 56 }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="wolf-fur" cx="50%" cy="35%">
          <stop offset="0%" stopColor="#90A4AE" />
          <stop offset="100%" stopColor="#37474F" />
        </radialGradient>
        <linearGradient id="wolf-eye" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#64B5F6" />
          <stop offset="100%" stopColor="#1565C0" />
        </linearGradient>
      </defs>
      {/* Ears */}
      <polygon points="14,14 10,2 22,10" fill="url(#wolf-fur)" />
      <polygon points="42,14 46,2 34,10" fill="url(#wolf-fur)" />
      <polygon points="15,13 12,4 20,10" fill="#607D8B" />
      <polygon points="41,13 44,4 36,10" fill="#607D8B" />
      {/* Head */}
      <ellipse cx="28" cy="28" rx="20" ry="20" fill="url(#wolf-fur)" />
      {/* Snout */}
      <ellipse cx="28" cy="38" rx="12" ry="9" fill="#78909C" />
      <ellipse cx="28" cy="42" rx="8" ry="6" fill="#90A4AE" />
      {/* Fur markings */}
      <path d="M14 22 Q18 16 22 20" fill="none" stroke="#546E7A" strokeWidth="1.5" />
      <path d="M42 22 Q38 16 34 20" fill="none" stroke="#546E7A" strokeWidth="1.5" />
      <path d="M10 28 Q14 24 16 28" fill="none" stroke="#546E7A" strokeWidth="1" />
      <path d="M46 28 Q42 24 40 28" fill="none" stroke="#546E7A" strokeWidth="1" />
      {/* Eyes */}
      <ellipse cx="21" cy="24" rx="5" ry="4" fill="#ECEFF1" />
      <ellipse cx="35" cy="24" rx="5" ry="4" fill="#ECEFF1" />
      <circle cx="21" cy="24" r="3.5" fill="url(#wolf-eye)" />
      <ellipse cx="21" cy="24" rx="1.5" ry="2.5" fill="#0a0a1a" />
      <circle cx="20" cy="23" r="1" fill="rgba(255,255,255,0.9)" />
      <circle cx="35" cy="24" r="3.5" fill="url(#wolf-eye)" />
      <ellipse cx="35" cy="24" rx="1.5" ry="2.5" fill="#0a0a1a" />
      <circle cx="34" cy="23" r="1" fill="rgba(255,255,255,0.9)" />
      {/* Nose */}
      <ellipse cx="28" cy="38" rx="4" ry="3" fill="#1a1a1a" />
      <ellipse cx="27" cy="37" rx="1.5" ry="1" fill="#37474F" />
      {/* Mouth */}
      <path d="M24 42 Q28 46 32 42" fill="none" stroke="#546E7A" strokeWidth="1.5" />
      <path d="M28 42 L28 46" stroke="#546E7A" strokeWidth="1.5" />
      {/* Fangs */}
      <polygon points="26,44 24,50 28,44" fill="white" opacity="0.9" />
      <polygon points="30,44 32,50 28,44" fill="white" opacity="0.9" />
      {/* Whiskers */}
      <line x1="10" y1="37" x2="18" y2="38" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
      <line x1="10" y1="40" x2="18" y2="40" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
      <line x1="46" y1="37" x2="38" y2="38" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
      <line x1="46" y1="40" x2="38" y2="40" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
    </svg>
  );
}

export function VkWild({ size = 56 }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shield-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#42A5F5" />
          <stop offset="50%" stopColor="#1565C0" />
          <stop offset="100%" stopColor="#0D47A1" />
        </linearGradient>
        <linearGradient id="shield-rim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#CFD8DC" />
          <stop offset="100%" stopColor="#607D8B" />
        </linearGradient>
      </defs>
      {/* Shield rim */}
      <path d="M28 4 L50 14 L50 34 Q50 48 28 54 Q6 48 6 34 L6 14 Z" fill="url(#shield-rim)" />
      {/* Shield body */}
      <path d="M28 8 L46 16 L46 34 Q46 46 28 50 Q10 46 10 34 L10 16 Z" fill="url(#shield-g)" />
      {/* Cross divider */}
      <line x1="28" y1="10" x2="28" y2="50" stroke="url(#shield-rim)" strokeWidth="3" />
      <line x1="10" y1="28" x2="46" y2="28" stroke="url(#shield-rim)" strokeWidth="3" />
      {/* Quadrant decorations */}
      <circle cx="19" cy="19" r="5" fill="#0D47A1" stroke="#CFD8DC" strokeWidth="1" />
      <circle cx="37" cy="19" r="5" fill="#0D47A1" stroke="#CFD8DC" strokeWidth="1" />
      <text x="19" y="23" textAnchor="middle" fontSize="8" fill="#64B5F6">ᚢ</text>
      <text x="37" y="23" textAnchor="middle" fontSize="8" fill="#64B5F6">ᚢ</text>
      <circle cx="19" cy="37" r="5" fill="#0D47A1" stroke="#CFD8DC" strokeWidth="1" />
      <circle cx="37" cy="37" r="5" fill="#0D47A1" stroke="#CFD8DC" strokeWidth="1" />
      {/* Center boss */}
      <circle cx="28" cy="28" r="5" fill="#CFD8DC" />
      <circle cx="28" cy="28" r="3" fill="#90A4AE" />
      <circle cx="27" cy="27" r="1.2" fill="rgba(255,255,255,0.6)" />
      {/* Shine */}
      <path d="M14 12 Q20 10 20 16" fill="rgba(255,255,255,0.2)" />
      {/* WILD text */}
      <text x="28" y="54" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="6" fill="#64B5F6" letterSpacing="1">WILD</text>
    </svg>
  );
}

export function VkScatter({ size = 56 }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ship-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8D6E63" />
          <stop offset="100%" stopColor="#3E2723" />
        </linearGradient>
        <linearGradient id="sail-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ECEFF1" />
          <stop offset="100%" stopColor="#CFD8DC" />
        </linearGradient>
      </defs>
      {/* Waves */}
      <path d="M2 44 Q10 40 18 44 Q26 48 34 44 Q42 40 50 44 Q54 46 56 44" fill="none" stroke="#42A5F5" strokeWidth="2" />
      <path d="M2 48 Q10 44 18 48 Q26 52 34 48 Q42 44 50 48" fill="none" stroke="#1976D2" strokeWidth="1.5" opacity="0.6" />
      {/* Hull */}
      <path d="M8 38 Q28 36 48 38 Q46 46 28 48 Q10 46 8 38Z" fill="url(#ship-g)" />
      <line x1="12" y1="40" x2="14" y2="46" stroke="#5D4037" strokeWidth="1" />
      <line x1="20" y1="39" x2="22" y2="46" stroke="#5D4037" strokeWidth="1" />
      <line x1="28" y1="38" x2="28" y2="46" stroke="#5D4037" strokeWidth="1" />
      <line x1="36" y1="39" x2="34" y2="46" stroke="#5D4037" strokeWidth="1" />
      <line x1="44" y1="40" x2="42" y2="46" stroke="#5D4037" strokeWidth="1" />
      {/* Mast */}
      <rect x="26" y="10" width="4" height="28" rx="2" fill="#4E342E" />
      {/* Main sail */}
      <path d="M30 12 L46 20 L46 34 L30 38Z" fill="url(#sail-g)" stroke="#B0BEC5" strokeWidth="0.8" />
      {/* Sail cross stripe */}
      <line x1="30" y1="12" x2="46" y2="38" stroke="#EF5350" strokeWidth="2" opacity="0.7" />
      <line x1="30" y1="38" x2="46" y2="12" stroke="#EF5350" strokeWidth="2" opacity="0.7" />
      {/* Dragon head prow */}
      <path d="M8 38 Q2 34 4 28 Q6 22 10 24 Q8 30 8 38Z" fill="#5D4037" />
      <circle cx="5" cy="28" r="2" fill="#FFD700" />
      <circle cx="5" cy="28" r="1" fill="#FF8F00" />
      {/* Flag */}
      <path d="M26 10 L14 6 L26 14Z" fill="#EF5350" />
      {/* Oars */}
      <line x1="14" y1="44" x2="6" y2="50" stroke="#5D4037" strokeWidth="2" />
      <line x1="42" y1="44" x2="50" y2="50" stroke="#5D4037" strokeWidth="2" />
    </svg>
  );
}

export type ThemeId = "pharaoh" | "dragon" | "viking";

export function getSymbolSVG(symbolKey: string, themeId: ThemeId, size = 52): JSX.Element {
  if (symbolKey === "A") return <SymA size={size} />;
  if (symbolKey === "K") return <SymK size={size} />;
  if (symbolKey === "Q") return <SymQ size={size} />;
  if (symbolKey === "J") return <SymJ size={size} />;
  if (symbolKey === "10") return <Sym10 size={size} />;
  if (symbolKey === "9") return <Sym9 size={size} />;

  if (themeId === "pharaoh") {
    if (symbolKey === "S1") return <PhPharaoh size={size} />;
    if (symbolKey === "S2") return <PhAnkh size={size} />;
    if (symbolKey === "S3") return <PhEyeRa size={size} />;
    if (symbolKey === "WILD") return <PhWild size={size} />;
    if (symbolKey === "SCATTER") return <PhScatter size={size} />;
  }
  if (themeId === "dragon") {
    if (symbolKey === "S1") return <DrDragon size={size} />;
    if (symbolKey === "S2") return <DrTiger size={size} />;
    if (symbolKey === "S3") return <DrLotus size={size} />;
    if (symbolKey === "WILD") return <DrWild size={size} />;
    if (symbolKey === "SCATTER") return <DrScatter size={size} />;
  }
  if (themeId === "viking") {
    if (symbolKey === "S1") return <VkThor size={size} />;
    if (symbolKey === "S2") return <VkAxe size={size} />;
    if (symbolKey === "S3") return <VkWolf size={size} />;
    if (symbolKey === "WILD") return <VkWild size={size} />;
    if (symbolKey === "SCATTER") return <VkScatter size={size} />;
  }

  return <Sym9 size={size} />;
}
