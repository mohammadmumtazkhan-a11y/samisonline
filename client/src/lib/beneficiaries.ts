import type { Beneficiary } from "@shared/schema";

export * from "@shared/beneficiaries";

/** Display name — business name for business recipients (Rhemito `displayName`). */
export function beneficiaryName(b: Pick<Beneficiary, "recipientType" | "firstName" | "lastName" | "businessName">): string {
  if (b.recipientType === "business") return b.businessName;
  return `${b.firstName} ${b.lastName}`.trim();
}

/** Two-letter avatar initials (Rhemito `initials`). */
export function beneficiaryInitials(b: Pick<Beneficiary, "recipientType" | "firstName" | "lastName" | "businessName">): string {
  if (b.recipientType === "business") return b.businessName.slice(0, 2).toUpperCase();
  return `${b.firstName.charAt(0)}${b.lastName.charAt(0)}`.toUpperCase();
}

const AVATAR_COLORS = [
  "bg-primary/10 text-primary",
  "bg-purple-100 text-purple-600",
  "bg-green-100 text-green-600",
  "bg-amber-100 text-amber-700",
];

/** Stable avatar colour per beneficiary. */
export function beneficiaryColor(id: string): string {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/** Mask long account numbers for list chips: 0123…6789. */
export function maskAccount(account: string): string {
  return account.length > 10 ? `${account.slice(0, 4)}…${account.slice(-4)}` : account;
}

/** Case-insensitive search over name, bank and account number. */
export function searchBeneficiaries<T extends Beneficiary>(list: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (b) =>
      beneficiaryName(b).toLowerCase().includes(q) ||
      b.bankName.toLowerCase().includes(q) ||
      b.accountNumber.includes(q)
  );
}

/** Beneficiaries that can receive on the current corridor (payout currency). */
export function beneficiariesForCorridor<T extends Beneficiary>(
  list: T[],
  payoutCurrency: string,
  { hideSeed = false }: { hideSeed?: boolean } = {}
): T[] {
  return list.filter((b) => b.currency === payoutCurrency && (!hideSeed || !b.seed));
}

/** Maps the flow's delivery method (step 1) to a Rhemito service type. */
export function serviceTypeForDeliveryMethod(method: string): "Bank Deposit" | "Mobile Money" | "SWIFT" {
  return method === "mobile_money" ? "Mobile Money" : "Bank Deposit";
}
