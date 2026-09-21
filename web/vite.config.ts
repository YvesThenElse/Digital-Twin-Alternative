import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // L'API tourne hors du conteneur du front ; le mandataire évite d'avoir
    // à gérer CORS en développement.
    proxy: { "/api": { target: "http://host.docker.internal:5000", changeOrigin: true } },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    globals: true,
  },
});
