export interface Country {
  name: string;
  code: string;
  dial: string;
  flag: string;
  placeholder: string;
}

export const COUNTRIES: Country[] = [
  { name: "Uganda",        code: "UG", dial: "+256", flag: "🇺🇬", placeholder: "0700 000 000" },
  { name: "Kenya",         code: "KE", dial: "+254", flag: "🇰🇪", placeholder: "0712 345 678" },
  { name: "Tanzania",      code: "TZ", dial: "+255", flag: "🇹🇿", placeholder: "0712 345 678" },
  { name: "Rwanda",        code: "RW", dial: "+250", flag: "🇷🇼", placeholder: "0780 000 000" },
  { name: "Ethiopia",      code: "ET", dial: "+251", flag: "🇪🇹", placeholder: "0911 000 000" },
  { name: "Nigeria",       code: "NG", dial: "+234", flag: "🇳🇬", placeholder: "0801 234 5678" },
  { name: "Ghana",         code: "GH", dial: "+233", flag: "🇬🇭", placeholder: "020 000 0000" },
  { name: "South Africa",  code: "ZA", dial: "+27",  flag: "🇿🇦", placeholder: "071 000 0000" },
  { name: "Zambia",        code: "ZM", dial: "+260", flag: "🇿🇲", placeholder: "097 000 0000" },
  { name: "Zimbabwe",      code: "ZW", dial: "+263", flag: "🇿🇼", placeholder: "077 000 0000" },
  { name: "Malawi",        code: "MW", dial: "+265", flag: "🇲🇼", placeholder: "0888 000 000" },
  { name: "Mozambique",    code: "MZ", dial: "+258", flag: "🇲🇿", placeholder: "84 000 0000" },
  { name: "DR Congo",      code: "CD", dial: "+243", flag: "🇨🇩", placeholder: "081 000 0000" },
  { name: "Cameroon",      code: "CM", dial: "+237", flag: "🇨🇲", placeholder: "6 70 00 00 00" },
  { name: "Senegal",       code: "SN", dial: "+221", flag: "🇸🇳", placeholder: "77 000 0000" },
  { name: "Ivory Coast",   code: "CI", dial: "+225", flag: "🇨🇮", placeholder: "07 00 00 00 00" },
  { name: "Egypt",         code: "EG", dial: "+20",  flag: "🇪🇬", placeholder: "010 0000 0000" },
  { name: "Morocco",       code: "MA", dial: "+212", flag: "🇲🇦", placeholder: "0600 000 000" },
  { name: "United Kingdom",code: "GB", dial: "+44",  flag: "🇬🇧", placeholder: "07700 900000" },
  { name: "United States", code: "US", dial: "+1",   flag: "🇺🇸", placeholder: "201 555 0100" },
  { name: "India",         code: "IN", dial: "+91",  flag: "🇮🇳", placeholder: "098765 43210" },
  { name: "China",         code: "CN", dial: "+86",  flag: "🇨🇳", placeholder: "131 0000 0000" },
  { name: "Germany",       code: "DE", dial: "+49",  flag: "🇩🇪", placeholder: "0151 00000000" },
  { name: "France",        code: "FR", dial: "+33",  flag: "🇫🇷", placeholder: "06 00 00 00 00" },
  { name: "Canada",        code: "CA", dial: "+1",   flag: "🇨🇦", placeholder: "204 555 0100" },
  { name: "Australia",     code: "AU", dial: "+61",  flag: "🇦🇺", placeholder: "0412 000 000" },
  { name: "Brazil",        code: "BR", dial: "+55",  flag: "🇧🇷", placeholder: "11 91234-5678" },
  { name: "Portugal",      code: "PT", dial: "+351", flag: "🇵🇹", placeholder: "912 000 000" },
  { name: "Spain",         code: "ES", dial: "+34",  flag: "🇪🇸", placeholder: "612 00 00 00" },
  { name: "Italy",         code: "IT", dial: "+39",  flag: "🇮🇹", placeholder: "312 000 0000" },
];

export const DEFAULT_COUNTRY = COUNTRIES[0];

/** Country-code → URL path segment, e.g. "UG" → "ug" */
export function countryToPath(code: string): string {
  return "/" + code.toLowerCase();
}

/** URL path → country code, e.g. "/ug" → "UG". Returns null if not a country path. */
export function pathToCountryCode(path: string): string | null {
  const seg = path.replace(/^\//, "").toLowerCase();
  if (!seg || seg.length !== 2) return null;
  const found = COUNTRIES.find((c) => c.code.toLowerCase() === seg);
  return found ? found.code : null;
}
