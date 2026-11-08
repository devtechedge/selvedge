import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import { chromium } from "@playwright/test";

try {
  process.loadEnvFile();
} catch {
  // CI provides environment variables.
}

const base = process.env.BASE_URL ?? "http://localhost:3100";
const out = "docs/screenshots";
fs.mkdirSync(out, { recursive: true });

let server = null;
if (!process.env.BASE_URL) {
  server = spawn("npx", ["next", "start", "-p", "3100"], {
    cwd: process.cwd(),
    shell: true,
    stdio: "ignore",
    env: { ...process.env, DEMO_MODE: "1" },
  });
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(base + "/api/health");
      if (res.ok) break;
    } catch {
      // still binding
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const settle = (ms = 700) => page.waitForTimeout(ms);

async function shot(name) {
  await page.screenshot({ path: `${out}/${name}` });
  console.log("captured", name);
}

// Landing, light theme, canvas painted after hydration.
await page.goto(base + "/", { waitUntil: "domcontentloaded" });
await page.getByRole("img", { name: /Woven cloth preview/i }).waitFor();
await settle();
await shot("01-landing.png");

await page.getByRole("button", { name: /Switch to dark theme/i }).click();
await settle(400);
await shot("02-landing-dark.png");

// Back to light for the studio surfaces.
await page.getByRole("button", { name: /Switch to light theme/i }).click();
await settle(300);

await page.goto(base + "/login", { waitUntil: "domcontentloaded" });
await page.getByRole("heading", { name: "Sign in", exact: true }).waitFor();
await settle(300);
await shot("03-login.png");

await page.getByRole("button", { name: /Mara Okonkwo/ }).click();
await page.getByRole("heading", { name: "The desk", exact: true }).waitFor();
await settle();
await shot("04-desk.png");

// The editor has a Save button the list does not; wait for it, not the name.
await page.goto(base + "/drafts", { waitUntil: "domcontentloaded" });
await page.getByRole("link", { name: /Madder twill scarf/ }).first().click();
await page.getByRole("button", { name: /Save revision/ }).waitFor();
await settle(900);
await shot("05-draft-editor.png");

await page.goto(base + "/releases", { waitUntil: "domcontentloaded" });
await page.getByText("verified", { exact: true }).first().waitFor();
await settle();
await shot("06-releases.png");

await page.setViewportSize({ width: 1280, height: 640 });
await page.goto(base + "/", { waitUntil: "domcontentloaded" });
await page.getByRole("img", { name: /Woven cloth preview/i }).waitFor();
await settle(900);
await shot("social-preview.png");

await browser.close();
if (server) {
  try {
    execSync(`taskkill /PID ${server.pid} /T /F`, { shell: true, stdio: "ignore" });
  } catch {
    server.kill("SIGKILL");
  }
}
console.log("done");