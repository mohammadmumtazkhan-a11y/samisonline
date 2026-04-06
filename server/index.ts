import express from "express";
import { createServer } from "http";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, unknown> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse).substring(0, 80)}`;
      }
      console.log(logLine);
    }
  });

  next();
});

(async () => {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "samis-dev-secret-change-in-prod",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,        // set to true behind HTTPS in production
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  registerRoutes(app);

  const server = createServer(app);

  // In development, set up Vite middleware; in production, serve static build
  if (process.env.NODE_ENV === "production") {
    await serveStatic(app);
  } else {
    await setupVite(app, server);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
})();
