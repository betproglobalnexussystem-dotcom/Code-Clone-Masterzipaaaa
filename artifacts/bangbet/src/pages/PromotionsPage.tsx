import { Gift, Dices, Zap, Trophy, RefreshCw, Users, Crown, RotateCcw, Clock, ChevronRight } from "lucide-react";

const PROMOS = [
  { id: 1, tag: "SPORTS", icon: Gift, bg: "linear-gradient(135deg, #1a6e3d 0%, #2DA962 100%)", title: "100% Welcome Sports Bonus", desc: "Get 100% bonus on your first sports deposit up to UGX 370,000. Minimum deposit UGX 3,700.", cta: "CLAIM NOW", expires: "Ongoing" },
  { id: 2, tag: "CASINO", icon: Dices, bg: "linear-gradient(135deg, #880e4f 0%, #4a148c 100%)", title: "200% Casino Welcome Bonus", desc: "Double your first casino deposit up to UGX 740,000. Wagering requirement: 30x.", cta: "PLAY CASINO", expires: "Ongoing" },
  { id: 3, tag: "FREE BET", icon: Zap, bg: "linear-gradient(135deg, #1565c0 0%, #1a237e 100%)", title: "UGX 7,400 Free Bet on Registration", desc: "Register and verify your phone number to receive UGX 7,400 free bet instantly.", cta: "REGISTER NOW", expires: "Ongoing" },
  { id: 4, tag: "JACKPOT", icon: Trophy, bg: "linear-gradient(135deg, #b71c1c 0%, #e53935 100%)", title: "Mega Jackpot — UGX 37,000,000", desc: "Predict the correct outcomes of 13 selected matches to win the full jackpot prize.", cta: "PLAY JACKPOT", expires: "This Saturday" },
  { id: 5, tag: "RELOAD", icon: RefreshCw, bg: "linear-gradient(135deg, #e65100 0%, #bf360c 100%)", title: "50% Monday Reload Bonus", desc: "Get a 50% bonus on every Monday deposit up to UGX 185,000. No wagering on sports!", cta: "DEPOSIT NOW", expires: "Every Monday" },
  { id: 6, tag: "REFERRAL", icon: Users, bg: "linear-gradient(135deg, #1a6e3d 0%, #228a4f 100%)", title: "Refer a Friend — Earn UGX 3,700", desc: "Share your unique referral code and earn UGX 3,700 for every friend who makes a deposit.", cta: "SHARE CODE", expires: "Ongoing" },
  { id: 7, tag: "VIP", icon: Crown, bg: "linear-gradient(135deg, #f57f17 0%, #e65100 100%)", title: "VIP Loyalty Program", desc: "Earn loyalty points on every bet placed. Redeem for cash bonuses and exclusive VIP rewards.", cta: "JOIN VIP", expires: "Ongoing" },
  { id: 8, tag: "CASHBACK", icon: RotateCcw, bg: "linear-gradient(135deg, #37474f 0%, #1c1e24 100%)", title: "10% Weekly Cashback", desc: "Receive 10% cashback on your net weekly losses. Automatically credited every Monday morning.", cta: "LEARN MORE", expires: "Every Week" },
];

export default function PromotionsPage() {
  return (
    <div>
      <div style={{ background: "linear-gradient(135deg, #1a6e3d, #2DA962)", padding: "16px 14px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--border)" }}>
        <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 14, width: 46, height: 46, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid rgba(255,255,255,0.2)" }}>
          <Gift size={24} color="#fff" />
        </div>
        <div>
          <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: "0.5px" }}>EXCLUSIVE PROMOTIONS</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 1 }}>Claim your bonuses and maximize your winnings</div>
        </div>
      </div>

      <div style={{ paddingBottom: 8 }}>
        {PROMOS.map((promo) => {
          const Icon = promo.icon;
          return (
            <div key={promo.id} className="promo-card">
              <div className="promo-card-img-area" style={{ background: promo.bg }}>
                <div style={{ position: "absolute", width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.06)", top: -60, right: -40 }} />
                <div style={{ position: "absolute", width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.05)", bottom: -30, left: 20 }} />
                <div className="promo-card-tag">{promo.tag}</div>
                <div className="promo-icon"><Icon size={32} /></div>
                <div className="promo-expires"><Clock size={11} /> {promo.expires}</div>
              </div>
              <div className="promo-card-body">
                <div className="promo-card-title">{promo.title}</div>
                <div className="promo-card-desc">{promo.desc}</div>
                <div className="promo-card-btn">{promo.cta} <ChevronRight size={13} /></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="footer-note">
        All promotions are subject to Terms &amp; Conditions. Licensed by the Uganda National Gaming Board. 18+ Only.
      </div>
    </div>
  );
}
