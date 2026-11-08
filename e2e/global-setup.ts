import type { FullConfig } from "@playwright/test";

// Warm the expensive renders before the first test so a cold pool connection or
// heaviest component does not land inside a test and read as a flake.
export default async function globalSetup(_config: FullConfig) {
  const base = "http://localhost:3100";
  for (const path of ["/api/health", "/", "/login"]) {
    try {
      await fetch(base + path);
    } catch {
      // The webServer may still be binding; the first test retries through it.
    }
  }
}