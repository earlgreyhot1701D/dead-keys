// Browser checks for the built site (shell Req 8.1): Chromium only, run against `vite preview` so
// the tests see what ships. `npm run test:e2e` builds first. The specs are *.spec.js, so
// `node --test` (npm test) never picks them up.
import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.js",
  outputDir: "./node_modules/.cache/playwright", // already git-ignored, so no stray test-results/
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, trace: "off" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
