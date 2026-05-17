import BaseSlotGame from "./BaseSlotGame";
import type { SlotTheme } from "./BaseSlotGame";

const reelStrip = [
  "S1","K","Q","S2","A","9","S1","Q","K","10",
  "J","9","A","K","S2","10","9","J","S1","K",
  "Q","10","9","A","WILD","K","Q","J","10","9",
  "A","K","Q","SCATTER","10","9","S1","K","S3","J",
  "10","9","A","S3","Q","J","10","9","A","K",
  "Q","J","10","9","A","K","S3","J","10","9",
  "S1","K","Q","J",
];
const reel2 = [
  "K","S3","J","A","10","9","S2","Q","K","10",
  "J","9","S1","K","Q","10","9","J","A","K",
  "Q","10","9","S2","WILD","K","Q","J","10","9",
  "A","K","SCATTER","10","9","S1","A","K","Q","J",
  "10","9","S3","K","Q","J","10","9","A","K",
  "Q","J","10","9","S2","K","Q","J","10","9",
  "A","K","Q","J",
];
const reel3 = [
  "A","K","S1","J","10","9","S3","Q","K","10",
  "J","9","A","K","Q","10","9","J","S2","K",
  "Q","10","9","A","WILD","S1","Q","J","10","9",
  "A","K","Q","J","10","SCATTER","A","K","Q","J",
  "10","9","A","K","S3","J","10","9","S1","K",
  "Q","J","10","9","A","K","Q","J","10","9",
  "A","K","Q","J",
];

const DRAGON_THEME: SlotTheme = {
  name: "DRAGON FORTUNE",
  subtitle: "5 Reels · 25 Lines · Asian Luck",
  bgGradient: "linear-gradient(160deg, #0a0000 0%, #1a0000 50%, #0d0000 100%)",
  bgImage: "https://images.unsplash.com/photo-1610870946651-fdc6f51c8d9c?w=800&q=80",
  accentColor: "#FF4444",
  secondaryColor: "#FFD700",
  reelBg: "rgba(30,0,0,0.9)",
  spinBtnGradient: "linear-gradient(135deg, #FF1744 0%, #FF6D00 50%, #FF1744 100%)",
  themeId: "dragon",
  reelStrips: [reelStrip, reel2, reel3, reel2, reelStrip],
  symbols: {
    S1:      { label: "DRAGON",  border: "#FF1744", glow: "#FF1744" },
    S2:      { label: "TIGER",   border: "#FF6D00", glow: "#FF6D00" },
    S3:      { label: "LOTUS",   border: "#F48FB1", glow: "#F48FB1" },
    A:       { label: "ACE",     border: "#EF5350", glow: "#EF5350" },
    K:       { label: "KING",    border: "#FFC107", glow: "#FFC107" },
    Q:       { label: "QUEEN",   border: "#CE93D8", glow: "#CE93D8" },
    J:       { label: "JACK",    border: "#4DD0E1", glow: "#4DD0E1" },
    "10":    { label: "TEN",     border: "#66BB6A", glow: "#66BB6A" },
    "9":     { label: "NINE",    border: "#90A4AE", glow: "#90A4AE" },
    WILD:    { label: "WILD",    border: "#FFD700", glow: "#FFD700" },
    SCATTER: { label: "SCATTER", border: "#FF1744", glow: "#FF1744" },
  },
};

export default function DragonFortuneSlot({ onBack }: { onBack: () => void }) {
  return <BaseSlotGame theme={DRAGON_THEME} onBack={onBack} />;
}
