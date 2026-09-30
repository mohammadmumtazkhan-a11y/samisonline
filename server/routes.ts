import type { Express } from "express";
import { registerAuthRoutes } from "./auth";

export function registerRoutes(app: Express) {
  registerAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });
}
