import type { Express } from "express";
import { registerAuthRoutes } from "./auth";
import { registerBeneficiaryRoutes } from "./beneficiaries";

export function registerRoutes(app: Express) {
  registerAuthRoutes(app);
  registerBeneficiaryRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });
}
