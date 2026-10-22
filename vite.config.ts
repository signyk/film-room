import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// One dev server for the dashboard (web/) and the Worker (worker/), as in production
export default defineConfig({
  root: "web",
  publicDir: "public",
  build: { outDir: "../dist", emptyOutDir: true },
  plugins: [react(), cloudflare({ configPath: "../wrangler.jsonc" })],
});
