import type { BetMap, BetPick } from "./api";

export interface MarketDef {
  bc: number;
  name: string;
  group: string;
  priority: number;
  ttLabels: Record<number, string>;
  ouMarket?: boolean;
}

export const MARKETS: MarketDef[] = [
  {
    bc: 20001,
    name: "Match Result (1X2)",
    group: "Main Markets",
    priority: 1,
    ttLabels: { 1: "1", 2: "X", 3: "2" },
  },
  {
    bc: 20007,
    name: "Double Chance",
    group: "Main Markets",
    priority: 2,
    ttLabels: { 4: "1X", 5: "X2", 6: "12" },
  },
  {
    bc: 20008,
    name: "Over/Under Goals",
    group: "Main Markets",
    priority: 3,
    ttLabels: { 227: "Over", 228: "Under" },
    ouMarket: true,
  },
  {
    bc: 20016,
    name: "Both Teams to Score",
    group: "Main Markets",
    priority: 4,
    ttLabels: { 264: "Yes", 265: "No" },
  },
  {
    bc: 20014,
    name: "Asian Handicap",
    group: "Main Markets",
    priority: 5,
    ttLabels: { 397: "Home", 398: "Draw", 399: "Away" },
  },
  {
    bc: 20011,
    name: "Draw No Bet",
    group: "Main Markets",
    priority: 6,
    ttLabels: { 235: "Home", 236: "Draw", 237: "Away" },
  },
  {
    bc: 20013,
    name: "1st Half Result",
    group: "Half Time",
    priority: 10,
    ttLabels: { 7: "1", 8: "X", 9: "2" },
  },
  {
    bc: 20012,
    name: "Halftime Result",
    group: "Half Time",
    priority: 11,
    ttLabels: { 284: "1", 285: "X", 286: "2" },
  },
  {
    bc: 20044,
    name: "1st Half Over/Under",
    group: "Half Time",
    priority: 12,
    ttLabels: { 355: "Over", 356: "Under" },
    ouMarket: true,
  },
  {
    bc: 20045,
    name: "1st Half Double Chance",
    group: "Half Time",
    priority: 13,
    ttLabels: { 323: "1X", 324: "X2", 484: "12" },
  },
  {
    bc: 20058,
    name: "2nd Half Result",
    group: "Half Time",
    priority: 14,
    ttLabels: { 325: "1", 326: "X", 485: "2" },
  },
  {
    bc: 20059,
    name: "2nd Half 1X2",
    group: "Half Time",
    priority: 15,
    ttLabels: { 481: "1", 482: "X", 483: "2" },
  },
  {
    bc: 20057,
    name: "2nd Half Over/Under",
    group: "Half Time",
    priority: 16,
    ttLabels: { 357: "Over", 358: "Under" },
    ouMarket: true,
  },
  {
    bc: 20038,
    name: "Half Time / Full Time",
    group: "Combined",
    priority: 20,
    ttLabels: {
      29: "1/1", 30: "1/X", 31: "1/2",
      32: "X/1", 33: "X/X", 34: "X/2",
      35: "2/1", 36: "2/X", 37: "2/2",
    },
  },
  {
    bc: 20029,
    name: "1X2 & Both Teams Score",
    group: "Combined",
    priority: 21,
    ttLabels: {
      23: "1 & Yes", 26: "2 & Yes",
      220: "X & Yes",
      243: "1 & No", 244: "2 & No",
      278: "1 & Yes", 279: "X & Yes", 280: "2 & Yes", 281: "No Goal",
      333: "Any & Yes",
      379: "1 & No", 380: "X & No", 381: "2 & No",
    },
  },
  {
    bc: 20097,
    name: "BTTS & Win",
    group: "Combined",
    priority: 22,
    ttLabels: { 402: "Yes & Home Win", 403: "Yes & Away Win", 532: "Yes & Draw", 533: "No" },
  },
  {
    bc: 20098,
    name: "BTTS & Over/Under",
    group: "Combined",
    priority: 23,
    ttLabels: { 50256: "Yes & Over 2.5", 50257: "Yes & Under 2.5" },
  },
  {
    bc: 20020,
    name: "Result & Both Teams Score",
    group: "Combined",
    priority: 24,
    ttLabels: { 388: "Yes", 389: "No" },
  },
  {
    bc: 20019,
    name: "Correct Score",
    group: "Goals",
    priority: 30,
    ttLabels: {
      10: "1-0", 11: "2-0", 12: "3-0",
      13: "2-1", 14: "3-1", 15: "0-0",
      16: "0-1", 17: "0-2", 18: "1-1",
      379: "0-0", 380: "0-1", 381: "1-0", 382: "1-1",
    },
  },
  {
    bc: 20027,
    name: "Home Team Over/Under Goals",
    group: "Goals",
    priority: 31,
    ttLabels: { 229: "Over", 230: "Under" },
    ouMarket: true,
  },
  {
    bc: 20028,
    name: "Away Team Over/Under Goals",
    group: "Goals",
    priority: 32,
    ttLabels: { 390: "Over", 392: "Under" },
    ouMarket: true,
  },
  {
    bc: 20021,
    name: "Next Goal",
    group: "Goals",
    priority: 33,
    ttLabels: { 272: "Home", 273: "Away" },
  },
  {
    bc: 20022,
    name: "Clean Sheet",
    group: "Goals",
    priority: 34,
    ttLabels: { 291: "Home", 292: "Away" },
  },
  {
    bc: 20023,
    name: "Win to Nil",
    group: "Goals",
    priority: 35,
    ttLabels: { 299: "Home", 300: "Away" },
  },
  {
    bc: 20015,
    name: "HT/FT Result",
    group: "Half Time",
    priority: 17,
    ttLabels: {
      608: "Home/Home", 609: "Home/Draw", 610: "Home/Away",
      611: "Draw/Home", 612: "Draw/Draw", 613: "Draw/Away",
      614: "Away/Home", 615: "Away/Draw", 616: "Away/Away",
    },
  },
  {
    bc: 20017,
    name: "HT Both Teams to Score",
    group: "Half Time",
    priority: 18,
    ttLabels: { 611: "Yes", 612: "No" },
  },
  {
    bc: 20018,
    name: "2nd Half Both Teams to Score",
    group: "Half Time",
    priority: 19,
    ttLabels: { 613: "Yes", 614: "No" },
  },
  {
    bc: 20033,
    name: "Total Corners",
    group: "Corners",
    priority: 40,
    ttLabels: { 268: "Home", 777: "Over", 779: "Under" },
    ouMarket: true,
  },
  {
    bc: 20034,
    name: "1st Half Corners",
    group: "Corners",
    priority: 41,
    ttLabels: { 776: "Over", 778: "Under" },
    ouMarket: true,
  },
  {
    bc: 20072,
    name: "Corners Over/Under",
    group: "Corners",
    priority: 42,
    ttLabels: { 287: "Over", 288: "Under", 315: "Home Handicap", 400: "Home Corners", 401: "Away Corners" },
    ouMarket: true,
  },
  {
    bc: 20073,
    name: "Corner Handicap",
    group: "Corners",
    priority: 43,
    ttLabels: { 282: "Home", 283: "Away" },
  },
  {
    bc: 20048,
    name: "Home Team Corners",
    group: "Corners",
    priority: 44,
    ttLabels: { 341: "Over", 345: "Under" },
    ouMarket: true,
  },
  {
    bc: 20035,
    name: "Total Cards",
    group: "Cards",
    priority: 50,
    ttLabels: { 270: "Home", 782: "Over", 784: "Under" },
    ouMarket: true,
  },
  {
    bc: 20036,
    name: "1st Half Cards",
    group: "Cards",
    priority: 51,
    ttLabels: { 781: "Over", 783: "Under" },
    ouMarket: true,
  },
  {
    bc: 20080,
    name: "Cards Market",
    group: "Cards",
    priority: 52,
    ttLabels: {
      557: "Home Over", 559: "Home Under",
      570: "Away Over", 572: "Away Under",
      575: "Total Over", 577: "Total Under",
    },
  },
  {
    bc: 20051,
    name: "Home Team Cards",
    group: "Cards",
    priority: 53,
    ttLabels: { 343: "Over", 347: "Under" },
    ouMarket: true,
  },
  {
    bc: 20052,
    name: "Away Team Cards",
    group: "Cards",
    priority: 54,
    ttLabels: { 50232: "Over", 50233: "Under" },
    ouMarket: true,
  },
  {
    bc: 20077,
    name: "Team to Score First",
    group: "Specials",
    priority: 60,
    ttLabels: { 419: "Home", 50266: "No Goal / Away" },
  },
  {
    bc: 20078,
    name: "Team to Score Last",
    group: "Specials",
    priority: 61,
    ttLabels: { 420: "Home", 50267: "No Goal / Away" },
  },
  {
    bc: 20087,
    name: "Goalscorer Market",
    group: "Specials",
    priority: 62,
    ttLabels: { 443: "Anytime", 701: "First", 702: "Last", 703: "Any" },
  },
  {
    bc: 20084,
    name: "Shots on Target",
    group: "Specials",
    priority: 63,
    ttLabels: {},
  },
  {
    bc: 20100,
    name: "Total Goals (Exact)",
    group: "Goals",
    priority: 36,
    ttLabels: {},
  },
  {
    bc: 20099,
    name: "Handicap Result",
    group: "Main Markets",
    priority: 7,
    ttLabels: { 526: "Home", 528: "Draw", 529: "Away", 531: "Away" },
  },
];

export const MARKET_BY_BC = new Map<number, MarketDef>(
  MARKETS.map((m) => [m.bc, m])
);

export const TT_TO_BC = new Map<number, number>();
MARKETS.forEach((m) => {
  Object.keys(m.ttLabels).forEach((tt) => {
    TT_TO_BC.set(Number(tt), m.bc);
  });
});

export interface ParsedMarket {
  bc: number;
  name: string;
  group: string;
  priority: number;
  ouMarket: boolean;
  selections: ParsedSelection[];
}

export interface ParsedSelection {
  tt: number;
  sv: string;
  label: string;
  odds: number;
  status: "U" | "L";
  betPick: BetPick;
}

function svDisplay(sv: string): string {
  if (sv === "NULL" || sv === "null") return "";
  return sv
    .replace("total=", "")
    .replace("goalnr=", "Goal #")
    .replace("homescore=", "Home ")
    .replace("awayscore=", "Away ");
}

function positionLabel(pos: number, total: number, tt: number): string {
  if (total === 2) return pos === 0 ? "Over" : "Under";
  if (total === 3) return ["1", "X", "2"][pos] ?? `Option ${pos + 1}`;
  return `Option ${pos + 1}`;
}

export function parseBetMap(betMap: BetMap): ParsedMarket[] {
  const bcGroups = new Map<number, Map<string, ParsedSelection[]>>();

  Object.entries(betMap).forEach(([ttStr, svMap]) => {
    const tt = Number(ttStr);
    Object.entries(svMap).forEach(([sv, pick]) => {
      if (pick.s === "L" || pick.ov === 0) return;
      const bc = pick.bc;
      if (!bcGroups.has(bc)) bcGroups.set(bc, new Map());
      const svGroup = bcGroups.get(bc)!;
      const svKey = sv === "NULL" || sv === "null" ? "NULL" : sv;
      if (!svGroup.has(svKey)) svGroup.set(svKey, []);
      svGroup.get(svKey)!.push({
        tt,
        sv: svKey,
        label: "",
        odds: pick.ov,
        status: pick.s,
        betPick: pick,
      });
    });
  });

  const markets: ParsedMarket[] = [];

  bcGroups.forEach((svGroup, bc) => {
    const def = MARKET_BY_BC.get(bc);
    const name = def?.name ?? `Market ${bc}`;
    const group = def?.group ?? "Other";
    const priority = def?.priority ?? 99;
    const ouMarket = def?.ouMarket ?? false;

    if (ouMarket && svGroup.size > 1) {
      svGroup.forEach((sels, sv) => {
        const displaySv = svDisplay(sv);
        const sortedSels = [...sels].sort((a, b) => a.tt - b.tt);
        sortedSels.forEach((s, i) => {
          const knownLabel = def?.ttLabels[s.tt];
          s.label = knownLabel
            ? `${knownLabel}${displaySv ? ` ${displaySv}` : ""}`
            : positionLabel(i, sortedSels.length, s.tt);
        });

        markets.push({
          bc,
          name: displaySv ? `${name} ${displaySv}` : name,
          group,
          priority: priority + (sv !== "NULL" ? 0.1 : 0),
          ouMarket,
          selections: sortedSels,
        });
      });
    } else {
      const allSels: ParsedSelection[] = [];
      svGroup.forEach((sels, sv) => {
        const displaySv = svDisplay(sv);
        sels.forEach((s) => {
          const knownLabel = def?.ttLabels[s.tt];
          s.label = knownLabel
            ? `${knownLabel}${displaySv ? ` ${displaySv}` : ""}`
            : displaySv;
          allSels.push(s);
        });
      });

      if (allSels.length === 0) return;

      allSels.sort((a, b) => {
        if (a.sv !== b.sv) return a.sv.localeCompare(b.sv);
        return a.tt - b.tt;
      });

      allSels.forEach((s, i) => {
        if (!s.label) s.label = positionLabel(i, allSels.length, s.tt);
      });

      markets.push({
        bc,
        name,
        group,
        priority,
        ouMarket,
        selections: allSels,
      });
    }
  });

  return markets.sort((a, b) => a.priority - b.priority);
}

export const GROUPS_ORDER = [
  "Main Markets",
  "Half Time",
  "Combined",
  "Goals",
  "Corners",
  "Cards",
  "Specials",
  "Other",
];
