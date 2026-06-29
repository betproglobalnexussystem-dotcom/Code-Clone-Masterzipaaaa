export interface Country {
  name: string;
  code: string;
  dial: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { name: "Uganda", code: "UG", dial: "+256", flag: "🇺🇬" },
  { name: "Kenya", code: "KE", dial: "+254", flag: "🇰🇪" },
  { name: "Tanzania", code: "TZ", dial: "+255", flag: "🇹🇿" },
  { name: "Rwanda", code: "RW", dial: "+250", flag: "🇷🇼" },
  { name: "Ethiopia", code: "ET", dial: "+251", flag: "🇪🇹" },
  { name: "Nigeria", code: "NG", dial: "+234", flag: "🇳🇬" },
  { name: "Ghana", code: "GH", dial: "+233", flag: "🇬🇭" },
  { name: "South Africa", code: "ZA", dial: "+27", flag: "🇿🇦" },
  { name: "Zambia", code: "ZM", dial: "+260", flag: "🇿🇲" },
  { name: "Zimbabwe", code: "ZW", dial: "+263", flag: "🇿🇼" },
  { name: "Malawi", code: "MW", dial: "+265", flag: "🇲🇼" },
  { name: "Mozambique", code: "MZ", dial: "+258", flag: "🇲🇿" },
  { name: "DR Congo", code: "CD", dial: "+243", flag: "🇨🇩" },
  { name: "Cameroon", code: "CM", dial: "+237", flag: "🇨🇲" },
  { name: "Senegal", code: "SN", dial: "+221", flag: "🇸🇳" },
  { name: "Ivory Coast", code: "CI", dial: "+225", flag: "🇨🇮" },
  { name: "Egypt", code: "EG", dial: "+20", flag: "🇪🇬" },
  { name: "Morocco", code: "MA", dial: "+212", flag: "🇲🇦" },
  { name: "United Kingdom", code: "GB", dial: "+44", flag: "🇬🇧" },
  { name: "United States", code: "US", dial: "+1", flag: "🇺🇸" },
  { name: "India", code: "IN", dial: "+91", flag: "🇮🇳" },
  { name: "China", code: "CN", dial: "+86", flag: "🇨🇳" },
  { name: "Germany", code: "DE", dial: "+49", flag: "🇩🇪" },
  { name: "France", code: "FR", dial: "+33", flag: "🇫🇷" },
  { name: "Canada", code: "CA", dial: "+1", flag: "🇨🇦" },
  { name: "Australia", code: "AU", dial: "+61", flag: "🇦🇺" },
  { name: "Brazil", code: "BR", dial: "+55", flag: "🇧🇷" },
  { name: "Portugal", code: "PT", dial: "+351", flag: "🇵🇹" },
  { name: "Spain", code: "ES", dial: "+34", flag: "🇪🇸" },
  { name: "Italy", code: "IT", dial: "+39", flag: "🇮🇹" },
];

export const DEFAULT_COUNTRY = COUNTRIES[0];
