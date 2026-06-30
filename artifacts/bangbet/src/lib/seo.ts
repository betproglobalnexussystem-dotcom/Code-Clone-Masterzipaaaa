import { COUNTRIES } from "./countries";

const DOMAIN = "https://betmali.site";

// ── Per-country context ───────────────────────────────────────────────────────
interface CountryContext {
  adjective: string;
  city: string;
  currency: string;
  payment: string;
  topSports: string[];
  localLeague: string;
  population: string;
}

const COUNTRY_CTX: Record<string, CountryContext> = {
  UG: { adjective: "Ugandan", city: "Kampala",     currency: "UGX", payment: "MTN Mobile Money, Airtel Money",    topSports: ["Football","Rugby","Basketball","Cricket","Volleyball","Tennis"],         localLeague: "Uganda Premier League",        population: "47 million" },
  KE: { adjective: "Kenyan",  city: "Nairobi",     currency: "KES", payment: "M-Pesa, Airtel Money",              topSports: ["Football","Rugby","Athletics","Basketball","Cricket","Tennis"],          localLeague: "Football Kenya Federation Premier League", population: "54 million" },
  TZ: { adjective: "Tanzanian",city:"Dar es Salaam",currency:"TZS", payment: "M-Pesa, Tigo Pesa",                 topSports: ["Football","Basketball","Volleyball","Boxing","Athletics","Tennis"],       localLeague: "NBC Premier League",           population: "62 million" },
  NG: { adjective: "Nigerian", city: "Lagos",       currency: "NGN", payment: "OPay, Flutterwave, Bank Transfer",  topSports: ["Football","Basketball","Boxing","Cricket","Athletics","Tennis"],          localLeague: "Nigeria Premier Football League", population: "220 million" },
  GH: { adjective: "Ghanaian", city: "Accra",       currency: "GHS", payment: "MTN MoMo, Vodafone Cash",           topSports: ["Football","Boxing","Athletics","Basketball","Tennis","Cricket"],          localLeague: "Ghana Premier League",         population: "32 million" },
  ZA: { adjective: "South African",city:"Johannesburg",currency:"ZAR",payment:"EFT, Standard Bank, FNB",           topSports: ["Football","Rugby","Cricket","Basketball","Tennis","Golf"],                localLeague: "DStv Premiership",             population: "60 million" },
  RW: { adjective: "Rwandan",  city: "Kigali",      currency: "RWF", payment: "MTN Mobile Money, Airtel Money",    topSports: ["Football","Basketball","Volleyball","Athletics","Tennis","Cycling"],      localLeague: "Rwanda Premier League",        population: "13 million" },
  ET: { adjective: "Ethiopian",city: "Addis Ababa", currency: "ETB", payment: "Telebirr, CBE Birr",                topSports: ["Football","Athletics","Boxing","Cycling","Volleyball","Basketball"],      localLeague: "Ethiopian Premier League",     population: "120 million" },
  ZM: { adjective: "Zambian",  city: "Lusaka",      currency: "ZMW", payment: "MTN Mobile Money, Airtel Money",    topSports: ["Football","Basketball","Athletics","Volleyball","Boxing","Tennis"],       localLeague: "MTN/FAZ Super League",         population: "19 million" },
  ZW: { adjective: "Zimbabwean",city:"Harare",      currency: "USD", payment: "EcoCash, OneMoney",                 topSports: ["Football","Cricket","Basketball","Tennis","Rugby","Athletics"],           localLeague: "Castle Lager Premier Soccer League", population: "15 million" },
  MW: { adjective: "Malawian",  city: "Lilongwe",   currency: "MWK", payment: "Airtel Money, TNM Mpamba",          topSports: ["Football","Basketball","Volleyball","Athletics","Tennis","Boxing"],       localLeague: "TNM Super League",             population: "19 million" },
  MZ: { adjective: "Mozambican",city:"Maputo",      currency: "MZN", payment: "M-Pesa, eMola",                     topSports: ["Football","Basketball","Volleyball","Athletics","Boxing","Tennis"],       localLeague: "Moçambola",                    population: "32 million" },
  CD: { adjective: "Congolese",city: "Kinshasa",    currency: "CDF", payment: "Airtel Money, Orange Money",        topSports: ["Football","Basketball","Volleyball","Boxing","Athletics","Tennis"],       localLeague: "Linafoot",                     population: "100 million" },
  CM: { adjective: "Cameroonian",city:"Yaoundé",    currency: "XAF", payment: "Orange Money, MTN Mobile Money",    topSports: ["Football","Basketball","Volleyball","Athletics","Boxing","Tennis"],       localLeague: "MTN Elite One",                population: "27 million" },
  SN: { adjective: "Senegalese",city:"Dakar",       currency: "XOF", payment: "Orange Money, Wave",                topSports: ["Football","Basketball","Wrestling","Athletics","Tennis","Volleyball"],    localLeague: "Ligue 1 Sénégal",              population: "17 million" },
  CI: { adjective: "Ivorian",  city: "Abidjan",     currency: "XOF", payment: "Orange Money, MTN Mobile Money",    topSports: ["Football","Basketball","Athletics","Volleyball","Tennis","Boxing"],       localLeague: "Ligue 1 Côte d'Ivoire",        population: "26 million" },
  EG: { adjective: "Egyptian", city: "Cairo",       currency: "EGP", payment: "Vodafone Cash, CIB, Fawry",         topSports: ["Football","Basketball","Squash","Tennis","Volleyball","Athletics"],       localLeague: "Egyptian Premier League",      population: "104 million" },
  MA: { adjective: "Moroccan", city: "Casablanca",  currency: "MAD", payment: "CMI, Maroc Telecom Money",           topSports: ["Football","Athletics","Basketball","Tennis","Volleyball","Boxing"],       localLeague: "Botola Pro",                   population: "37 million" },
};

const DEFAULT_CTX: CountryContext = COUNTRY_CTX["UG"];

// ── All sports offered ────────────────────────────────────────────────────────
export const SEO_SPORTS = [
  "Football","Basketball","Tennis","Rugby","Volleyball","Cricket",
  "Boxing","MMA","Baseball","Ice Hockey","Handball","American Football",
  "Formula 1","Motorsport","Cycling","Golf","Snooker","Darts","Esports","Live Betting",
];

// ── Core types ────────────────────────────────────────────────────────────────
export interface PageSEO {
  title: string;
  description: string;
  h1: string;
  h2s: string[];
  keywords: string;
  canonical: string;
  ogImage: string;
  robots: string;
  breadcrumbs: Array<{ name: string; url: string }>;
  faq: Array<{ q: string; a: string }>;
  schemaOrg: object[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function ctx(code: string): CountryContext {
  return COUNTRY_CTX[code.toUpperCase()] ?? DEFAULT_CTX;
}

function countryName(code: string): string {
  return COUNTRIES.find((c) => c.code === code.toUpperCase())?.name ?? "Uganda";
}

function cc(code: string) {
  return code.toLowerCase();
}

function orgSchema(code: string): object {
  const name = countryName(code);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "BetMali",
    alternateName: `BetMali ${name}`,
    url: `${DOMAIN}/${cc(code)}`,
    logo: { "@type": "ImageObject", url: `${DOMAIN}/logo.svg`, width: 200, height: 60 },
    description: `BetMali is ${name}'s top online sports betting platform. Bet on football, basketball, rugby, tennis and 20+ sports with live odds.`,
    contactPoint: { "@type": "ContactPoint", contactType: "customer service", availableLanguage: "English" },
    areaServed: { "@type": "Country", name },
    sameAs: [
      "https://twitter.com/betmali",
      "https://facebook.com/betmali",
      "https://instagram.com/betmali",
    ],
  };
}

function websiteSchema(code: string): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "BetMali",
    url: `${DOMAIN}/${cc(code)}`,
    description: `Sports betting platform for ${countryName(code)}`,
    inLanguage: "en",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${DOMAIN}/${cc(code)}/sports?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

function breadcrumbSchema(crumbs: Array<{ name: string; url: string }>): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
}

function faqSchema(faqs: Array<{ q: string; a: string }>): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

function webPageSchema(title: string, desc: string, url: string, breadcrumbs: Array<{ name: string; url: string }>): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description: desc,
    url,
    inLanguage: "en",
    breadcrumb: breadcrumbSchema(breadcrumbs),
    publisher: {
      "@type": "Organization",
      name: "BetMali",
      url: DOMAIN,
    },
  };
}

// ── HOME PAGE ─────────────────────────────────────────────────────────────────
function homeSEO(code: string): PageSEO {
  const c = ctx(code);
  const name = countryName(code);
  const path = `${DOMAIN}/${cc(code)}`;
  const breadcrumbs = [{ name: "Home", url: path }];
  const title = `BetMali ${name} | Sports Betting, Live Betting & Football Odds`;
  const description = `BetMali is ${name}'s leading sports betting site. Bet on Football, Basketball, Rugby, Tennis, Cricket, Volleyball, Boxing, MMA and 20+ sports. Get competitive odds, live betting and ${c.payment}.`;
  const faq = [
    { q: `Is BetMali legal in ${name}?`, a: `BetMali operates as an online sports betting platform serving ${name} with competitive odds across all major sports.` },
    { q: `How do I deposit on BetMali ${name}?`, a: `You can deposit using ${c.payment}. Deposits are instant and secure.` },
    { q: `What sports can I bet on at BetMali ${name}?`, a: `BetMali offers betting on ${c.topSports.join(", ")}, and many more sports including live in-play betting.` },
    { q: `What is the minimum bet on BetMali?`, a: `The minimum bet on BetMali is 500 ${c.currency}. You can bet on single or multi-bet accumulators.` },
    { q: `Does BetMali offer live betting in ${name}?`, a: `Yes! BetMali offers real-time live in-play betting on football, basketball, tennis and more — with odds that update every second.` },
  ];
  return {
    title,
    description,
    h1: `BetMali ${name} Sports Betting`,
    h2s: ["Football Betting", "Live Betting", "Basketball Betting", "Tennis Betting", "Rugby Betting", "Cricket Betting", "Volleyball Betting", "Boxing Betting", "MMA Betting", "Motorsport Betting"],
    keywords: `sports betting ${name.toLowerCase()}, football betting ${name.toLowerCase()}, online betting ${name.toLowerCase()}, live betting ${name.toLowerCase()}, betmali ${name.toLowerCase()}, ${cc(code)} betting, ${c.adjective.toLowerCase()} sports betting`,
    canonical: path,
    ogImage: `${DOMAIN}/opengraph.jpg`,
    robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    breadcrumbs,
    faq,
    schemaOrg: [orgSchema(code), websiteSchema(code), webPageSchema(title, description, path, breadcrumbs), faqSchema(faq)],
  };
}

// ── SPORTS PAGE ───────────────────────────────────────────────────────────────
function sportSEO(code: string): PageSEO {
  const c = ctx(code);
  const name = countryName(code);
  const path = `${DOMAIN}/${cc(code)}/sports`;
  const breadcrumbs = [{ name: "Home", url: `${DOMAIN}/${cc(code)}` }, { name: "Sports", url: path }];
  const title = `Sports Betting ${name} | Football, Basketball, Rugby & More | BetMali`;
  const description = `Bet on ${c.topSports.slice(0, 4).join(", ")} and 20+ sports at BetMali ${name}. Get the best odds on the ${c.localLeague}, Champions League, NBA and more. Join now and get a welcome bonus.`;
  const faq = [
    { q: `What sports can I bet on at BetMali ${name}?`, a: `BetMali offers ${c.topSports.join(", ")}, plus Baseball, Ice Hockey, Handball, American Football, Darts, Snooker, Golf, Formula 1 and Esports.` },
    { q: `Can I bet on the ${c.localLeague} at BetMali?`, a: `Yes! BetMali covers the ${c.localLeague} and all major ${name} football competitions with competitive odds.` },
    { q: `Are sports odds competitive at BetMali?`, a: `BetMali offers some of the best odds in ${name} across all sports, with boosted odds on selected matches every day.` },
  ];
  return {
    title,
    description,
    h1: `Sports Betting in ${name}`,
    h2s: c.topSports.slice(0, 8).map((s) => `${s} Betting`),
    keywords: `${c.topSports.map((s) => `${s.toLowerCase()} betting ${name.toLowerCase()}`).join(", ")}, sports odds ${name.toLowerCase()}, betmali sports ${name.toLowerCase()}`,
    canonical: path,
    ogImage: `${DOMAIN}/opengraph.jpg`,
    robots: "index, follow",
    breadcrumbs,
    faq,
    schemaOrg: [orgSchema(code), webPageSchema(title, description, path, breadcrumbs), breadcrumbSchema(breadcrumbs), faqSchema(faq)],
  };
}

// ── LIVE BETTING PAGE ─────────────────────────────────────────────────────────
function liveSEO(code: string): PageSEO {
  const c = ctx(code);
  const name = countryName(code);
  const path = `${DOMAIN}/${cc(code)}/live`;
  const breadcrumbs = [{ name: "Home", url: `${DOMAIN}/${cc(code)}` }, { name: "Live Betting", url: path }];
  const title = `Live Betting ${name} | In-Play Sports Odds | BetMali`;
  const description = `Bet live in real-time on Football, Basketball, Tennis, Rugby and more at BetMali ${name}. Updated odds every second. Cash out available. Play now with ${c.payment}.`;
  const faq = [
    { q: `What is live betting at BetMali ${name}?`, a: `Live (in-play) betting lets you place bets on matches that are already in progress. Odds update in real-time based on what's happening on the field.` },
    { q: `Which sports have live betting on BetMali?`, a: `BetMali offers live in-play betting on Football, Basketball, Tennis, Volleyball, and more — available 24/7 in ${name}.` },
    { q: `Can I cash out my live bet on BetMali?`, a: `BetMali supports early cash-out on selected live markets, allowing you to secure winnings before a match ends.` },
  ];
  return {
    title,
    description,
    h1: `Live Betting ${name} – Real-Time Odds`,
    h2s: ["Live Football Betting", "Live Basketball Betting", "Live Tennis Betting", "Live Rugby Betting", "Live Volleyball Betting", "In-Play Odds"],
    keywords: `live betting ${name.toLowerCase()}, in-play betting ${name.toLowerCase()}, live football odds ${name.toLowerCase()}, betmali live ${name.toLowerCase()}, real-time sports betting ${cc(code)}`,
    canonical: path,
    ogImage: `${DOMAIN}/opengraph.jpg`,
    robots: "index, follow",
    breadcrumbs,
    faq,
    schemaOrg: [orgSchema(code), webPageSchema(title, description, path, breadcrumbs), breadcrumbSchema(breadcrumbs), faqSchema(faq)],
  };
}

// ── RESULTS PAGE ──────────────────────────────────────────────────────────────
function resultsSEO(code: string): PageSEO {
  const name = countryName(code);
  const path = `${DOMAIN}/${cc(code)}/results`;
  const breadcrumbs = [{ name: "Home", url: `${DOMAIN}/${cc(code)}` }, { name: "Results", url: path }];
  const title = `Sports Betting Results ${name} | Match Scores & Outcomes | BetMali`;
  const description = `Check today's football, basketball, tennis and rugby results at BetMali ${name}. Full match scores, half-time results and final outcomes for all sports.`;
  const faq = [
    { q: "How do I check my bet results on BetMali?", a: "Go to Results and find the match. Results are updated live as games finish. Settled bets are shown in your account history." },
    { q: "How quickly are results updated on BetMali?", a: "BetMali updates match results in real-time as games conclude — usually within minutes of the final whistle." },
  ];
  return {
    title,
    description,
    h1: `Sports Results ${name}`,
    h2s: ["Football Results", "Basketball Results", "Tennis Results", "Today's Scores", "Yesterday's Results"],
    keywords: `sports results ${name.toLowerCase()}, football scores ${name.toLowerCase()}, match results ${name.toLowerCase()}, betmali results`,
    canonical: path,
    ogImage: `${DOMAIN}/opengraph.jpg`,
    robots: "index, follow",
    breadcrumbs,
    faq,
    schemaOrg: [orgSchema(code), webPageSchema(title, description, path, breadcrumbs), breadcrumbSchema(breadcrumbs), faqSchema(faq)],
  };
}

// ── PROMOTIONS PAGE ───────────────────────────────────────────────────────────
function promotionsSEO(code: string): PageSEO {
  const c = ctx(code);
  const name = countryName(code);
  const path = `${DOMAIN}/${cc(code)}/promotions`;
  const breadcrumbs = [{ name: "Home", url: `${DOMAIN}/${cc(code)}` }, { name: "Promotions", url: path }];
  const title = `Sports Betting Bonuses ${name} | Welcome Bonus & Free Bets | BetMali`;
  const description = `Claim your BetMali ${name} welcome bonus! Get free bets, deposit bonuses, boosted odds and referral rewards. Deposit via ${c.payment} and start winning today.`;
  const faq = [
    { q: `What bonuses does BetMali offer in ${name}?`, a: `BetMali offers a welcome deposit bonus, free bets, boosted odds on selected matches, and a referral bonus when you invite friends.` },
    { q: `How do I claim my welcome bonus at BetMali?`, a: `Register, make your first deposit using ${c.payment} and your welcome bonus is automatically credited to your account.` },
    { q: `Can I use bonus funds on all sports?`, a: `Yes! Your BetMali bonus can be used on all sports including Football, Basketball, Rugby, Tennis and live betting markets.` },
  ];
  return {
    title,
    description,
    h1: `BetMali ${name} Bonuses & Promotions`,
    h2s: ["Welcome Deposit Bonus", "Free Bets", "Boosted Odds", "Referral Bonus", "Daily Promotions"],
    keywords: `betting bonus ${name.toLowerCase()}, free bets ${name.toLowerCase()}, welcome bonus ${name.toLowerCase()}, betmali promotions ${name.toLowerCase()}, deposit bonus ${cc(code)}`,
    canonical: path,
    ogImage: `${DOMAIN}/opengraph.jpg`,
    robots: "index, follow",
    breadcrumbs,
    faq,
    schemaOrg: [orgSchema(code), webPageSchema(title, description, path, breadcrumbs), breadcrumbSchema(breadcrumbs), faqSchema(faq)],
  };
}

// ── PROFILE PAGE (no-index) ───────────────────────────────────────────────────
function profileSEO(code: string): PageSEO {
  const name = countryName(code);
  const path = `${DOMAIN}/${cc(code)}/account`;
  const breadcrumbs = [{ name: "Home", url: `${DOMAIN}/${cc(code)}` }, { name: "My Account", url: path }];
  return {
    title: `My Account | BetMali ${name}`,
    description: "Manage your BetMali account, view transactions, update your profile and withdraw winnings.",
    h1: "My Account",
    h2s: ["My Bets", "Deposit", "Withdraw", "Account Settings"],
    keywords: "",
    canonical: path,
    ogImage: `${DOMAIN}/opengraph.jpg`,
    robots: "noindex, nofollow",
    breadcrumbs,
    faq: [],
    schemaOrg: [],
  };
}

// ── PUBLIC API ────────────────────────────────────────────────────────────────
export type AppPage = "home" | "sport" | "live" | "results" | "promotions" | "profile" | "notifications" | "slots";

export function getPageSEO(countryCode: string, page: AppPage): PageSEO {
  const code = countryCode.toUpperCase() || "UG";
  switch (page) {
    case "home":        return homeSEO(code);
    case "sport":       return sportSEO(code);
    case "live":        return liveSEO(code);
    case "results":     return resultsSEO(code);
    case "promotions":  return promotionsSEO(code);
    case "profile":
    case "notifications":
    default:            return profileSEO(code);
  }
}

/** Detect country code from current URL path, e.g. /ug → "UG" */
export function getCountryFromURL(): string {
  const seg = window.location.pathname.replace(/^\//, "").split("/")[0].toLowerCase();
  const found = COUNTRIES.find((c) => c.code.toLowerCase() === seg);
  return found?.code ?? "UG";
}

export { DOMAIN };
