import { pgTable, text, serial, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
