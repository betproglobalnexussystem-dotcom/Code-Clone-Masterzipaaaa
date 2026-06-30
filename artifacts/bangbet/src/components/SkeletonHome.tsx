function Bone({ w = "100%", h = 16, r = 8, style }: { w?: string | number; h?: number; r?: number; style?: React.CSSProperties }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: "linear-gradient(90deg, #e8e8e8 25%, #f5f5f5 50%, #e8e8e8 75%)",
      backgroundSize: "200% 100%",
      animation: "skeletonShimmer 1.4s infinite",
      flexShrink: 0,
      ...style,
    }} />
  );
}

export default function SkeletonHome() {
  return (
    <div style={{ background: "#f2f4f7", minHeight: "100vh" }}>
      <style>{`
        @keyframes skeletonShimmer {
          0%   { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
      `}</style>

      {/* Hero banner skeleton */}
      <div style={{ margin: "0 0 4px 0", padding: "10px 12px 12px", background: "#fff" }}>
        <div style={{ borderRadius: 14, overflow: "hidden", height: 160, position: "relative" }}>
          <Bone w="100%" h={160} r={14} />
          {/* banner dots */}
          <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>
            {[0,1,2].map(i => <div key={i} style={{ width: i===0?18:8, height: 6, borderRadius: 3, background: i===0?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.4)" }} />)}
          </div>
        </div>
      </div>

      {/* Quick nav skeleton */}
      <div style={{ background: "#fff", padding: "10px 8px", display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, minWidth: 54, flexShrink: 0 }}>
            <Bone w={40} h={40} r={20} />
            <Bone w={36} h={10} r={5} />
          </div>
        ))}
      </div>

      <div style={{ height: 6, background: "#f2f4f7" }} />

      {/* Jackpot banner skeleton */}
      <div style={{ background: "#fff", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <Bone w={120} h={12} r={6} />
          <Bone w={180} h={28} r={6} />
          <Bone w={100} h={11} r={5} />
        </div>
        <Bone w={70} h={38} r={19} />
      </div>

      <div style={{ height: 6, background: "#f2f4f7" }} />

      {/* Section header skeleton */}
      <div style={{ background: "#fff", padding: "12px 12px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Bone w={120} h={14} r={6} />
        <Bone w={60} h={12} r={6} />
      </div>

      {/* Column headers */}
      <div style={{ background: "#fff", padding: "6px 12px", display: "flex", justifyContent: "flex-end", gap: 8 }}>
        {["1","X","2","1X","X2","12"].map(l => <Bone key={l} w={28} h={10} r={4} />)}
      </div>

      {/* Match row skeletons */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ background: "#fff", padding: "12px 12px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <Bone w="60%" h={12} r={5} />
            <Bone w="80%" h={13} r={5} />
            <Bone w="80%" h={13} r={5} />
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {Array.from({ length: 6 }).map((_, j) => <Bone key={j} w={34} h={34} r={6} />)}
          </div>
        </div>
      ))}

      <div style={{ height: 6, background: "#f2f4f7" }} />

      {/* Second section */}
      <div style={{ background: "#fff", padding: "12px 12px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Bone w={140} h={14} r={6} />
        <Bone w={60} h={12} r={6} />
      </div>
      <div style={{ background: "#fff", padding: "6px 12px", display: "flex", justifyContent: "flex-end", gap: 8 }}>
        {["1","X","2","1X","X2","12"].map(l => <Bone key={l} w={28} h={10} r={4} />)}
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ background: "#fff", padding: "12px 12px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <Bone w="55%" h={12} r={5} />
            <Bone w="75%" h={13} r={5} />
            <Bone w="75%" h={13} r={5} />
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {Array.from({ length: 6 }).map((_, j) => <Bone key={j} w={34} h={34} r={6} />)}
          </div>
        </div>
      ))}

      <div style={{ height: 80 }} />
    </div>
  );
}
