import BaseSlotGame from "./BaseSlotGame";
import type { SlotTheme } from "./BaseSlotGame";

const reelStrip = [
  "S1","K","Q","S2","A","9","S1","Q","K","10",
  "J","9","A","K","S2","10","9","J","S1","K",
  "Q","10","9","A","WILD","K","Q","J","10","9",
  "A","K","Q","SCATTER","10","9","S1","K","S3","J",
  "10","9","A","S3","Q","J","10","9","A","K",
  "Q","J","10","9","A","K","S2","J","10","9",
  "S3","K","Q","J",
];
const reel2 = [
  "K","S2","J","A","10","9","S3","Q","K","10",
  "J","9","S1","K","Q","10","9","J","A","K",
  "Q","10","9","S2","WILD","K","Q","J","10","9",
  "A","K","SCATTER","10","9","S1","A","K","Q","J",
  "10","9","S3","K","Q","J","10","9","A","K",
  "Q","J","10","9","S1","K","Q","J","10","9",
  "A","K","Q","J",
];
const reel3 = [
  "A","K","S3","J","10","9","S1","Q","K","10",
  "J","9","A","K","Q","10","9","J","S2","K",
  "Q","10","9","A","WILD","S3","Q","J","10","9",
  "A","K","Q","J","10","SCATTER","A","K","Q","J",
  "10","9","A","K","S1","J","10","9","S2","K",
  "Q","J","10","9","A","K","Q","J","10","9",
  "A","K","Q","J",
];

const VIKING_THEME: SlotTheme = {
  name: "VIKING CONQUEST",
  subtitle: "5 Reels · 25 Lines · Norse Legends",
  bgGradient: "linear-gradient(160deg, #000d1a 0%, #001a2a 50%, #00061a 100%)",
  bgImage: "https://images.unsplash.com/photo-1531685250784-7569952593d2?w=800&q=80",
  accentColor: "#64B5F6",
  secondaryColor: "#B0BEC5",
  reelBg: "rgba(0,10,30,0.9)",
  spinBtnGradient: "linear-gradient(135deg, #1565C0 0%, #42A5F5 50%, #1565C0 100%)",
  themeId: "viking",
  reelStrips: [reelStrip, reel2, reel3, reel2, reelStrip],
  symbols: {
    S1:      { label: "THOR",    border: "#5C9CF6", glow: "#5C9CF6" },
    S2:      { label: "AXE",     border: "#78909C", glow: "#78909C" },
    S3:      { label: "WOLF",    border: "#81C784", glow: "#81C784" },
    A:       { label: "ACE",     border: "#EF5350", glow: "#EF5350" },
    K:       { label: "KING",    border: "#FFC107", glow: "#FFC107" },
    Q:       { label: "QUEEN",   border: "#CE93D8", glow: "#CE93D8" },
    J:       { label: "JACK",    border: "#4DD0E1", glow: "#4DD0E1" },
    "10":    { label: "TEN",     border: "#66BB6A", glow: "#66BB6A" },
    "9":     { label: "NINE",    border: "#90A4AE", glow: "#90A4AE" },
    WILD:    { label: "WILD",    border: "#29B6F6", glow: "#29B6F6" },
    SCATTER: { label: "SCATTER", border: "#42A5F5", glow: "#42A5F5" },
  },
};

export default function VikingConquestSlot({ onBack }: { onBack: () => void }) {
  return <BaseSlotGame theme={VIKING_THEME} onBack={onBack} />;
}
