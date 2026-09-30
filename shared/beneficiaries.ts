/**
 * Beneficiary (recipient) rules — ported from Rhemito's `lib/recipients.ts`
 * so the Samis send-money flow creates and validates recipients the same way.
 * Shared by the client (form + flow) and the server (mock API).
 */

export const BENEFICIARY_SERVICE_TYPES = ["Bank Deposit", "Mobile Money", "SWIFT"] as const;
export type BeneficiaryServiceType = (typeof BENEFICIARY_SERVICE_TYPES)[number];

/** Payout currency per supported receiving country (see CLAUDE.md corridors). */
export const COUNTRY_CURRENCY: Record<string, string> = {
  "United Kingdom": "GBP",
  "United States": "USD",
  Nigeria: "NGN",
  Canada: "CAD",
  Ghana: "GHS",
  Kenya: "KES",
  "South Africa": "ZAR",
  Germany: "EUR",
  France: "EUR",
  India: "INR",
  China: "CNY",
  "United Arab Emirates": "AED",
};

export const BENEFICIARY_COUNTRIES = Object.keys(COUNTRY_CURRENCY);

export function currencyForCountry(country: string): string {
  return COUNTRY_CURRENCY[country] ?? "USD";
}

export interface BankFieldConfig {
  sortCode: boolean;
  iban: boolean;
  swift: boolean;
}

/** Which country-specific routing fields a recipient's bank details need. */
export function bankFieldsFor(country: string): BankFieldConfig {
  switch (country) {
    case "United Kingdom":
      return { sortCode: true, iban: false, swift: false };
    case "Germany":
    case "France":
      return { sortCode: false, iban: true, swift: false };
    case "United States":
    case "Canada":
    case "China":
    case "United Arab Emirates":
    case "India":
      return { sortCode: false, iban: false, swift: true };
    default:
      return { sortCode: false, iban: false, swift: false };
  }
}

/** Narration/TXN remarks are mandatory for Nigerian beneficiaries. */
export function requiresNarration(country: string): boolean {
  return country === "Nigeria";
}

/** Nigerian bank accounts (NUBAN) are exactly 10 digits. */
export const NIGERIA_ACCOUNT_REGEX = /^\d{10}$/;

/** 6-digit payout identifier, guaranteed unique against existing codes. */
export function generateUniqueCode(
  existingCodes: string[],
  rng: () => number = Math.random
): string {
  const taken = new Set(existingCodes);
  for (let attempt = 0; attempt < 100; attempt++) {
    const code = String(Math.floor(rng() * 1_000_000)).padStart(6, "0");
    if (!taken.has(code)) return code;
  }
  let counter = 1;
  while (taken.has(String(counter).padStart(6, "0"))) counter++;
  return String(counter).padStart(6, "0");
}
