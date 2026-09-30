import { describe, it, expect } from "vitest";
import { insertBeneficiarySchema, type Beneficiary } from "@shared/schema";
import {
  bankFieldsFor,
  beneficiariesForCorridor,
  beneficiaryInitials,
  beneficiaryName,
  currencyForCountry,
  generateUniqueCode,
  maskAccount,
  requiresNarration,
  searchBeneficiaries,
  serviceTypeForDeliveryMethod,
} from "@/lib/beneficiaries";

const base = {
  recipientType: "individual" as const,
  firstName: "Ada",
  lastName: "Obi",
  email: "ada@example.com",
  country: "Nigeria",
  bankName: "GTBank",
  accountNumber: "0123456789",
  serviceType: "Bank Deposit" as const,
  narration: "Upkeep",
};

const make = (over: Partial<Beneficiary>): Beneficiary => ({
  ...insertBeneficiarySchema.parse(base),
  id: "b1",
  currency: "NGN",
  uniqueCode: "123456",
  createdAt: "2026-09-30",
  ...over,
});

describe("country rules (ported from Rhemito)", () => {
  it("maps countries to payout currencies", () => {
    expect(currencyForCountry("Nigeria")).toBe("NGN");
    expect(currencyForCountry("United Kingdom")).toBe("GBP");
    expect(currencyForCountry("Atlantis")).toBe("USD");
  });

  it("returns routing fields by country", () => {
    expect(bankFieldsFor("United Kingdom")).toEqual({ sortCode: true, iban: false, swift: false });
    expect(bankFieldsFor("Germany")).toEqual({ sortCode: false, iban: true, swift: false });
    expect(bankFieldsFor("United States")).toEqual({ sortCode: false, iban: false, swift: true });
    expect(bankFieldsFor("Nigeria")).toEqual({ sortCode: false, iban: false, swift: false });
  });

  it("requires narration only for Nigeria", () => {
    expect(requiresNarration("Nigeria")).toBe(true);
    expect(requiresNarration("Ghana")).toBe(false);
  });
});

describe("insertBeneficiarySchema", () => {
  it("accepts a valid Nigerian beneficiary", () => {
    expect(insertBeneficiarySchema.safeParse(base).success).toBe(true);
  });

  it("rejects a Nigerian bank account that is not 10 digits", () => {
    const r = insertBeneficiarySchema.safeParse({ ...base, accountNumber: "12345" });
    expect(r.success).toBe(false);
    expect(r.success ? [] : r.error.flatten().fieldErrors.accountNumber).toContain("Nigerian account numbers are 10 digits");
  });

  it("requires narration for Nigerian beneficiaries", () => {
    expect(insertBeneficiarySchema.safeParse({ ...base, narration: "  " }).success).toBe(false);
  });

  it("requires names for individuals and a business name for businesses", () => {
    expect(insertBeneficiarySchema.safeParse({ ...base, lastName: "" }).success).toBe(false);
    expect(insertBeneficiarySchema.safeParse({ ...base, recipientType: "business", businessName: "" }).success).toBe(false);
    expect(insertBeneficiarySchema.safeParse({ ...base, recipientType: "business", businessName: "Lagos Traders" }).success).toBe(true);
  });

  it("requires the country's routing field (UK sort code)", () => {
    const uk = { ...base, country: "United Kingdom", accountNumber: "12345678", narration: "" };
    expect(insertBeneficiarySchema.safeParse(uk).success).toBe(false);
    expect(insertBeneficiarySchema.safeParse({ ...uk, sortCode: "20-45-67" }).success).toBe(true);
  });

  it("validates the email address", () => {
    expect(insertBeneficiarySchema.safeParse({ ...base, email: "not-an-email" }).success).toBe(false);
  });
});

describe("list helpers", () => {
  const ngn = make({ id: "a", firstName: "Sarah", lastName: "Chen", bankName: "Access Bank" });
  const gbp = make({ id: "b", country: "United Kingdom", currency: "GBP", bankName: "Barclays" });
  const seed = make({ id: "c", seed: true, firstName: "David", lastName: "Okonkwo", bankName: "GTBank" });

  it("keeps only recipients on the payout corridor and hides demo records for new customers", () => {
    expect(beneficiariesForCorridor([ngn, gbp, seed], "NGN").map((b) => b.id)).toEqual(["a", "c"]);
    expect(beneficiariesForCorridor([ngn, gbp, seed], "NGN", { hideSeed: true }).map((b) => b.id)).toEqual(["a"]);
  });

  it("searches by name, bank and account", () => {
    expect(searchBeneficiaries([ngn, seed], "chen").map((b) => b.id)).toEqual(["a"]);
    expect(searchBeneficiaries([ngn, seed], "gtbank").map((b) => b.id)).toEqual(["c"]);
    expect(searchBeneficiaries([ngn, seed], "").length).toBe(2);
  });

  it("formats names, initials and masked accounts", () => {
    expect(beneficiaryName(ngn)).toBe("Sarah Chen");
    expect(beneficiaryInitials(ngn)).toBe("SC");
    const biz = make({ recipientType: "business", businessName: "Lagos Traders" });
    expect(beneficiaryName(biz)).toBe("Lagos Traders");
    expect(beneficiaryInitials(biz)).toBe("LA");
    expect(maskAccount("DE89370400440532013000")).toBe("DE89…3000");
    expect(maskAccount("0123456789")).toBe("0123456789");
  });

  it("maps the step-1 delivery method to a service type", () => {
    expect(serviceTypeForDeliveryMethod("mobile_money")).toBe("Mobile Money");
    expect(serviceTypeForDeliveryMethod("bank_deposit")).toBe("Bank Deposit");
  });

  it("generates unique 6-digit codes", () => {
    const code = generateUniqueCode(["000001"], () => 0.000001);
    expect(code).toMatch(/^\d{6}$/);
    expect(code).not.toBe("000001");
  });
});
