import { useState, useEffect } from "react";
import { Plus, Trash2, Eye, EyeOff, Image as ImageIcon, Loader, Link } from "lucide-react";
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../lib/firebase";

interface CarouselImage {
  id: string; title: string; url: string; active: boolean; order: number; addedDate: string;
  fadeColor?: string; linkType?: string; linkValue?: string;
}

const LINK_OPTIONS = [
  { value: "none",       label: "No link" },
  { value: "home",       label: "Home" },
  { value: "sport",      label: "Sports" },
  { value: "live",       label: "Live Betting" },
  { value: "casino",     label: "Casino" },
  { value: "promotions", label: "Promotions" },
  { value: "results",    label: "Results" },
];

export default function CarouselTab() {
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newFadeColor, setNewFadeColor] = useState("#1a6e3d");
  const [newLinkType, setNewLinkType] = useState("none");
  const [adding, setAdding] = useState(false);
  const [preview, setPreview] = useState<CarouselImage | null>(null);

  useEffect(() => {
    const q = query(collection(db, "carousel"), orderBy("order", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setImages(snap.docs.map(d => ({ id: d.id, ...d.data() } as CarouselImage)));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  const toggleActive = async (id: string, current: boolean) => {
    await updateDoc(doc(db, "carousel", id), { active: !current });
  };

  const deleteImage = async (id: string) => {
    await deleteDoc(doc(db, "carousel", id));
  };

  const addImage = async () => {
    if (!newTitle.trim() || !newUrl.trim()) return;
    setAdding(true);
    try {
      await addDoc(collection(db, "carousel"), {
        title: newTitle.trim(),
        url: newUrl.trim(),
        active: true,
        order: images.length + 1,
        fadeColor: newFadeColor,
        linkType: newLinkType,
        addedDate: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        createdAt: serverTimestamp(),
      });
      setNewTitle(""); setNewUrl(""); setNewFadeColor("#1a6e3d"); setNewLinkType("none"); setShowAdd(false);
    } finally {
      setAdding(false);
    }
  };

  const hexToRgb = (hex: string) => {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : "26,110,61";
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", fontFamily: "Oswald, sans-serif" }}>Carousel Manager</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>Manage homepage banners · images display live on the homepage</div>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ display: "flex", alignItems: "center", gap: 7, background: "#2DA962", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Oswald, sans-serif" }}>
          <Plus size={16} /> ADD BANNER
        </button>
      </div>

      {showAdd && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #2DA962", padding: "20px", marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 14 }}>Add New Banner</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6 }}>BANNER TITLE</label>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Weekend Jackpot" style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6 }}>IMAGE URL <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 400 }}>(paste a direct image link)</span></label>
              <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://example.com/banner.jpg" style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, boxSizing: "border-box" }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6 }}>FADE OVERLAY COLOUR</label>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="color" value={newFadeColor} onChange={e => setNewFadeColor(e.target.value)} style={{ width: 44, height: 38, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: 2, cursor: "pointer" }} />
                <div style={{ flex: 1, height: 38, borderRadius: 8, background: `linear-gradient(to right, rgba(${hexToRgb(newFadeColor)},0.92), rgba(${hexToRgb(newFadeColor)},0.5), transparent)`, border: "1.5px solid #e2e8f0" }} />
              </div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>Colour fades from left side of banner</div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6 }}>
                <Link size={11} style={{ display: "inline", marginRight: 4 }} />LINK WHEN TAPPED
              </label>
              <select value={newLinkType} onChange={e => setNewLinkType(e.target.value)} style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, boxSizing: "border-box", background: "#fff" }}>
                {LINK_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>Where users go when they tap the banner</div>
            </div>
          </div>

          {newUrl && (
            <div style={{ marginBottom: 14, borderRadius: 10, overflow: "hidden", height: 140, background: "#f1f5f9", position: "relative" }}>
              <img src={newUrl} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to right, rgba(${hexToRgb(newFadeColor)},0.85), transparent)` }} />
            </div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={addImage} disabled={adding} style={{ background: "#2DA962", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
              {adding ? <><Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> Adding…</> : "Add Banner"}
            </button>
            <button onClick={() => { setShowAdd(false); setNewTitle(""); setNewUrl(""); }} style={{ background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, gap: 10, color: "#94a3b8" }}>
          <Loader size={20} style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: 14 }}>Loading banners…</span>
        </div>
      ) : images.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
          <ImageIcon size={40} style={{ margin: "0 auto 12px", display: "block", opacity: 0.3 }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>No banners yet</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Click ADD BANNER to upload your first carousel image</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px,1fr))", gap: 16 }}>
          {images.map((img, idx) => {
            const rgb = hexToRgb(img.fadeColor || "#1a6e3d");
            const linkLabel = LINK_OPTIONS.find(o => o.value === (img.linkType || "none"))?.label ?? "No link";
            return (
              <div key={img.id} style={{ background: "#fff", borderRadius: 14, border: `1.5px solid ${img.active ? "#e2e8f0" : "#f1f5f9"}`, overflow: "hidden", opacity: img.active ? 1 : 0.65 }}>
                <div style={{ position: "relative", height: 160, background: "#f1f5f9", cursor: "pointer" }} onClick={() => setPreview(img)}>
                  <img src={img.url} alt={img.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to right, rgba(${rgb},0.88), rgba(${rgb},0.5) 50%, transparent)` }} />
                  <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.55)", borderRadius: 6, padding: "3px 8px" }}>
                    <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>Order #{idx + 1}</span>
                  </div>
                  {img.linkType && img.linkType !== "none" && (
                    <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(45,169,98,0.85)", borderRadius: 6, padding: "3px 8px", display: "flex", alignItems: "center", gap: 4 }}>
                      <Link size={9} color="#fff" />
                      <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>{linkLabel}</span>
                    </div>
                  )}
                  {!img.active && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 12, color: "#fff", fontWeight: 700, background: "rgba(0,0,0,0.6)", padding: "4px 12px", borderRadius: 6 }}>INACTIVE</span>
                    </div>
                  )}
                </div>
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", flex: 1 }}>{img.title}</div>
                    <div style={{ width: 20, height: 20, borderRadius: 4, background: img.fadeColor || "#1a6e3d", border: "1.5px solid #e2e8f0", flexShrink: 0 }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 12 }}>Added {img.addedDate} · Links to: {linkLabel}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => toggleActive(img.id, img.active)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, background: img.active ? "rgba(245,158,11,0.1)" : "rgba(45,169,98,0.1)", color: img.active ? "#f59e0b" : "#2DA962", border: `1px solid ${img.active ? "rgba(245,158,11,0.3)" : "rgba(45,169,98,0.3)"}`, borderRadius: 8, padding: "8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                      {img.active ? <><EyeOff size={13} /> Deactivate</> : <><Eye size={13} /> Activate</>}
                    </button>
                    <button onClick={() => deleteImage(img.id)} style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {preview && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setPreview(null)}>
          <div style={{ maxWidth: 700, width: "100%" }}>
            <img src={preview.url} alt={preview.title} style={{ width: "100%", borderRadius: 14, maxHeight: "80vh", objectFit: "contain" }} />
            <div style={{ textAlign: "center", color: "#fff", fontSize: 14, fontWeight: 700, marginTop: 12 }}>{preview.title}</div>
          </div>
        </div>
      )}
    </div>
  );
}
