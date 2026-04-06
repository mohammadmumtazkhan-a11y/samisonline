import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import browserslist from "browserslist";
import { browserslistToTargets } from "lightningcss";

const targets = browserslistToTargets(
  browserslist("defaults, safari >= 14, ios >= 14")
);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  root: "client",
  css: {
    transformer: "lightningcss",
    lightningcss: {
      targets,
    },
  },
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
    target: ["es2020", "safari14"],
    cssMinify: "lightningcss",
  },
  server: {
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
});
