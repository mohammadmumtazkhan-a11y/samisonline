import { pgTable, text, serial, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { BENEFICIARY_SERVICE_TYPES, NIGERIA_ACCOUNT_REGEX, bankFieldsFor, requiresNarration } from "./beneficiaries";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// ---------------------------------------------------------------------------
// Auth tables
// ---------------------------------------------------------------------------

export const authUsers = pgTable("auth_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  accountType: text("account_type").notNull().default("individual"), // "individual" | "business"
  country: text("country").notNull(),
  // Individual fields
  firstName: text("first_name"),
  middleName: text("middle_name"),
  lastName: text("last_name"),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender"),
  mobileCode: text("mobile_code"),
  mobileNumber: text("mobile_number"),
  // Business fields
  businessName: text("business_name"),
  businessRegNo: text("business_reg_no"),
  businessPhoneCode: text("business_phone_code"),
  businessPhoneNumber: text("business_phone_number"),
  directorName: text("director_name"),
  // Status
  status: text("status").notNull().default("pending"), // "pending" | "active" | "blocked"
  createdAt: timestamp("created_at").defaultNow(),
});

export const otpCodes = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------------------------------------------------------------------------
// Zod validation schemas
// ---------------------------------------------------------------------------

export const emailCheckSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const individualRegSchema = z.object({
  email: z.string().email(),
  accountType: z.literal("individual"),
  country: z.string().min(1),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  mobileCode: z.string().min(1),
  mobileNumber: z.string().min(1, "Mobile number is required"),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const businessRegSchema = z.object({
  email: z.string().email(),
  accountType: z.literal("business"),
  country: z.string().min(1),
  businessName: z.string().min(1, "Business name is required"),
  businessRegNo: z.string().min(1, "Registration number is required"),
  businessPhoneCode: z.string().min(1),
  businessPhoneNumber: z.string().min(1, "Business phone is required"),
  directorName: z.string().min(1, "Director name is required"),
  dateOfBirth: z.string().min(1),
  gender: z.string().min(1),
  mobileCode: z.string().min(1),
  mobileNumber: z.string().min(1),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const otpVerifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must be digits only"),
});

export type AuthUser = typeof authUsers.$inferSelect;
export type InsertAuthUser = typeof authUsers.$inferInsert;

// ---------------------------------------------------------------------------
// Beneficiaries (recipients) — same fields & rules as Rhemito's recipient form
// ---------------------------------------------------------------------------

export const insertBeneficiarySchema = z
  .object({
    recipientType: z.enum(["individual", "business"]),
    firstName: z.string().trim().default(""),
    lastName: z.string().trim().default(""),
    businessName: z.string().trim().default(""),
    email: z.string().trim().min(1, "Email address is required").email("Please enter a valid email address"),
    country: z.string().min(1, "Country is required"),
    bankName: z.string().trim().min(1, "Bank name is required"),
    accountNumber: z.string().trim().min(1, "Account number is required"),
    sortCode: z.string().trim().default(""),
    iban: z.string().trim().default(""),
    swift: z.string().trim().default(""),
    serviceType: z.enum(BENEFICIARY_SERVICE_TYPES),
    narration: z.string().trim().default(""),
    relationship: z.string().trim().default("Personal"),
  })
  .superRefine((data, ctx) => {
    if (data.recipientType === "individual") {
      if (!data.firstName) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["firstName"], message: "First name is required" });
      if (!data.lastName) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["lastName"], message: "Last name is required" });
    } else if (!data.businessName) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["businessName"], message: "Business name is required" });
    }

    if (data.country === "Nigeria" && data.serviceType === "Bank Deposit" && data.accountNumber && !NIGERIA_ACCOUNT_REGEX.test(data.accountNumber)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["accountNumber"], message: "Nigerian account numbers are 10 digits" });
    }

    const fields = bankFieldsFor(data.country);
    if (fields.sortCode && !data.sortCode) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["sortCode"], message: "Sort code is required" });
    if (fields.iban && !data.iban) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["iban"], message: "IBAN is required" });
    if (fields.swift && !data.swift) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["swift"], message: "SWIFT / BIC is required" });

    if (requiresNarration(data.country) && !data.narration) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["narration"], message: "Narration is required for Nigerian beneficiaries" });
    }
  });

export type InsertBeneficiary = z.input<typeof insertBeneficiarySchema>;

export type Beneficiary = z.output<typeof insertBeneficiarySchema> & {
  id: string;
  currency: string;
  uniqueCode: string; // 6-digit payout identifier
  createdAt: string;
  /** Demo/seed record (hidden for brand-new customers). */
  seed?: boolean;
};
