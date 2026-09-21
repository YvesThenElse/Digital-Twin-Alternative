// `defineConfig` vient de vitest/config, qui accepte la clé `test`.
//
// Cela n'a été possible qu'après avoir aligné les versions : Vitest 2 exige
// Vite 5, et avec Vite 6 npm installait une COPIE IMBRIQUÉE de Vite. Les
// greffons portaient alors deux types distincts et incompatibles, pour un
// même paquet. Vitest 3 partage la version majeure — une seule copie.
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Le mandataire évite d'avoir à gérer CORS : le navigateur ne voit qu'une
  // seule origine. `/api` est retiré du chemin, l'API exposant /platforms et
  // non /api/platforms.
  server: {
    host: "127.0.0.1",
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5199",
        changeOrigin: true,
        rewrite: (chemin) => chemin.replace(/^\/api/, ""),
      },
    },
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5199",
        changeOrigin: true,
        rewrite: (chemin) => chemin.replace(/^\/api/, ""),
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    globals: true,
    // `e2e/` appartient à Playwright. Sans cette exclusion, Vitest ramasse le
    // parcours, échoue à l'importer, et le compte parmi ses fichiers — une
    // suite rouge pour une raison qui n'a rien à voir avec le code.
    exclude: ["node_modules/**", "dist/**", "e2e/**"],
  },
});
