import type { Express, Request, Response } from "express";
import { randomUUID } from "crypto";
import { insertBeneficiarySchema, type Beneficiary } from "@shared/schema";
import { currencyForCountry, generateUniqueCode } from "@shared/beneficiaries";

// ---------------------------------------------------------------------------
// In-memory beneficiary store (prototype — swap for the MITO beneficiary API).
// Mirrors Rhemito's recipient record: bank details + 6-digit unique code.
// ---------------------------------------------------------------------------

const seedBeneficiaries: Beneficiary[] = [
  {
    id: "ben-001", seed: true, recipientType: "individual",
    firstName: "Akshita", lastName: "Gupta", businessName: "", email: "akshita.gupta@example.com",
    country: "Nigeria", currency: "NGN", bankName: "Zenith Bank", accountNumber: "1234567890",
    sortCode: "", iban: "", swift: "", serviceType: "Bank Deposit",
    narration: "Family support — monthly", relationship: "Family", uniqueCode: "482913", createdAt: "2026-08-12",
  },
  {
    id: "ben-002", seed: true, recipientType: "individual",
    firstName: "Sarah", lastName: "Chen", businessName: "", email: "sarah.chen@example.com",
    country: "Nigeria", currency: "NGN", bankName: "Access Bank", accountNumber: "0876543210",
    sortCode: "", iban: "", swift: "", serviceType: "Bank Deposit",
    narration: "School fees", relationship: "Friend", uniqueCode: "573820", createdAt: "2026-07-18",
  },
  {
    id: "ben-003", seed: true, recipientType: "individual",
    firstName: "David", lastName: "Okonkwo", businessName: "", email: "david.okonkwo@example.com",
    country: "Nigeria", currency: "NGN", bankName: "GTBank", accountNumber: "0112233445",
    sortCode: "", iban: "", swift: "", serviceType: "Bank Deposit",
    narration: "Money transfer", relationship: "Family", uniqueCode: "291746", createdAt: "2026-07-02",
  },
  {
    // Non-NGN example: kept to show corridor filtering (hidden in the GBP → NGN send flow).
    id: "ben-004", seed: true, recipientType: "individual",
    firstName: "Bob", lastName: "Woolmer", businessName: "", email: "bob.woolmer@example.com",
    country: "United Kingdom", currency: "GBP", bankName: "Barclays", accountNumber: "12345678",
    sortCode: "20-45-67", iban: "", swift: "", serviceType: "Bank Deposit",
    narration: "", relationship: "Friend", uniqueCode: "650218", createdAt: "2026-06-21",
  },
];

let beneficiaries: Beneficiary[] = [...seedBeneficiaries];

/** Test helper — restores the seed data. */
export function resetBeneficiaries() {
  beneficiaries = [...seedBeneficiaries];
}

export function registerBeneficiaryRoutes(app: Express) {
  // List beneficiaries (newest first)
  app.get("/api/beneficiaries", (_req: Request, res: Response) => {
    const sorted = [...beneficiaries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json(sorted);
  });

  // Create a beneficiary
  app.post("/api/beneficiaries", (req: Request, res: Response) => {
    const parsed = insertBeneficiarySchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      const first = Object.values(errors).flat()[0];
      return res.status(400).json({ message: first || "Invalid recipient details", errors });
    }
    const data = parsed.data;

    const duplicate = beneficiaries.find(
      (b) =>
        b.country === data.country &&
        b.accountNumber === data.accountNumber &&
        b.bankName.toLowerCase() === data.bankName.toLowerCase()
    );
    if (duplicate) {
      return res.status(409).json({ message: "A recipient with this bank account already exists." });
    }

    const created: Beneficiary = {
      ...data,
      id: randomUUID(),
      currency: currencyForCountry(data.country),
      uniqueCode: generateUniqueCode(beneficiaries.map((b) => b.uniqueCode)),
      createdAt: new Date().toISOString(),
    };
    beneficiaries.push(created);
    res.status(201).json(created);
  });
}
