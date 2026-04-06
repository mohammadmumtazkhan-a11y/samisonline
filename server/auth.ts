import type { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { emailCheckSchema, loginSchema, otpVerifySchema } from "@shared/schema";
import type { AuthUser } from "@shared/schema";

// ---------------------------------------------------------------------------
// In-memory storage (prototype — replace with DB queries in production)
// ---------------------------------------------------------------------------

const authUsersMap = new Map<string, AuthUser & { password: string }>();
const otpCodesMap = new Map<string, { code: string; expiresAt: Date; used: boolean }[]>();

// Fixed OTP for prototype — never use in production
const DEV_OTP = "123456";

function safeUser(user: AuthUser & { password: string }) {
  const { password: _password, ...safe } = user;
  return safe;
}

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export function registerAuthRoutes(app: Express) {

  // 1. Check email — returns whether the address is already registered
  app.post("/api/auth/check-email", (req: Request, res: Response) => {
    try {
      const { email } = emailCheckSchema.parse(req.body);
      const user = authUsersMap.get(email.toLowerCase());
      if (user) {
        res.json({ registered: true, status: user.status });
      } else {
        res.json({ registered: false, status: null });
      }
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Invalid input" });
    }
  });

  // 2. Login — validates credentials and opens a session
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = authUsersMap.get(email.toLowerCase());

      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      if (user.status === "pending") {
        return res.status(403).json({ message: "Please verify your email first" });
      }
      if (user.status === "blocked") {
        return res.status(403).json({ message: "Account has been blocked" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      (req.session as any).userId = user.id;
      res.json({ user: safeUser(user) });
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Invalid input" });
    }
  });

  // 3. Register — creates a new user in pending state and issues a dev OTP
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const emailLower = (data.email || "").toLowerCase();

      if (!emailLower) {
        return res.status(400).json({ message: "Email is required" });
      }
      if (authUsersMap.has(emailLower)) {
        return res.status(409).json({ message: "Email already registered" });
      }
      if (!data.password) {
        return res.status(400).json({ message: "Password is required" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 12);
      const { confirmPassword: _confirmPassword, ...userData } = data;

      const newUser: AuthUser & { password: string } = {
        id: crypto.randomUUID(),
        email: emailLower,
        password: hashedPassword,
        accountType: userData.accountType || "individual",
        country: userData.country || "",
        firstName: userData.firstName ?? null,
        middleName: userData.middleName ?? null,
        lastName: userData.lastName ?? null,
        dateOfBirth: userData.dateOfBirth ?? null,
        gender: userData.gender ?? null,
        mobileCode: userData.mobileCode ?? null,
        mobileNumber: userData.mobileNumber ?? null,
        businessName: userData.businessName ?? null,
        businessRegNo: userData.businessRegNo ?? null,
        businessPhoneCode: userData.businessPhoneCode ?? null,
        businessPhoneNumber: userData.businessPhoneNumber ?? null,
        directorName: userData.directorName ?? null,
        status: "pending",
        createdAt: new Date(),
      };

      authUsersMap.set(emailLower, newUser);

      // Issue dev OTP valid for 1 hour
      const existingOtps = otpCodesMap.get(emailLower) || [];
      existingOtps.push({
        code: DEV_OTP,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        used: false,
      });
      otpCodesMap.set(emailLower, existingOtps);

      res.json({
        success: true,
        message: "Registration successful. Please verify your email.",
        devOtp: DEV_OTP,
      });
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Registration failed" });
    }
  });

  // 4. Verify OTP — activates the account and opens a session
  app.post("/api/auth/verify-otp", (req: Request, res: Response) => {
    try {
      const { email, code } = otpVerifySchema.parse(req.body);
      const emailLower = email.toLowerCase();

      // Prototype: only the fixed dev OTP is accepted
      if (code !== DEV_OTP) {
        return res.status(400).json({ message: "Invalid OTP code" });
      }

      const user = authUsersMap.get(emailLower);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.status === "active") {
        return res.status(400).json({ message: "Account already verified" });
      }

      // Activate user
      user.status = "active";
      authUsersMap.set(emailLower, user);

      // Invalidate all OTPs for this email
      const otps = otpCodesMap.get(emailLower) || [];
      otps.forEach((o) => { o.used = true; });

      (req.session as any).userId = user.id;
      res.json({ success: true, user: safeUser(user) });
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Verification failed" });
    }
  });

  // 5. Resend OTP — invalidates previous codes and issues a fresh dev OTP
  app.post("/api/auth/resend-otp", (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const emailLower = (email || "").toLowerCase();

      if (!emailLower) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = authUsersMap.get(emailLower);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const otps = otpCodesMap.get(emailLower) || [];
      otps.forEach((o) => { o.used = true; });
      otps.push({
        code: DEV_OTP,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        used: false,
      });
      otpCodesMap.set(emailLower, otps);

      res.json({ success: true, devOtp: DEV_OTP });
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Failed to resend OTP" });
    }
  });

  // 6. Get current user — returns the session-bound user record
  app.get("/api/auth/me", (req: Request, res: Response) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    for (const user of authUsersMap.values()) {
      if (user.id === userId) {
        return res.json({ user: safeUser(user) });
      }
    }

    res.status(401).json({ message: "User not found" });
  });

  // 7. Logout — destroys the session
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true, message: "Logged out" });
    });
  });
}
