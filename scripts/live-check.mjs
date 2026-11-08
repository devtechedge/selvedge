import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const base = process.env.BASE_URL ?? "https://selvedge-app.vercel.app";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const consoleErrors = [];
const pageErrors = [];
const foreign = [];
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});
page.on("pageerror", (e) => pageErrors.push(String(e)));
page.on("request", (r) => {
  const u = new URL(r.url());
  if (u.protocol.startsWith("http") && u.host !== new URL(base).host) foreign.push(r.url());
});

const report = {};

const health = await (await fetch(base + "/api/health")).json();
report.health = { ok: health.ok, commit: health.commit };

await page.goto(base + "/", { waitUntil: "domcontentloaded" });
await page.getByRole("img", { name: /Woven cloth preview/i }).waitFor();
await page.waitForTimeout(800);
report.landingHero = await page.getByRole("heading", { name: /Draft cloth/i }).isVisible();

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(300);
report.overflow390 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
await page.setViewportSize({ width: 1440, height: 900 });

const axeLanding = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
report.landingAxeSerious = axeLanding.violations.filter((v) => v.impact === "serious" || v.impact === "critical").length;

for (const [name, email] of [
  ["weaver", "weaver@selvedge.demo"],
  ["dyer", "dyer@selvedge.demo"],
  ["manager", "manager@selvedge.demo"],
]) {
  await page.goto(base + "/login", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: new RegExp(email.split("@")[0] === "weaver" ? "Theo Lindqvist" : email.split("@")[0] === "dyer" ? "Ana Ferreira" : "Mara Okonkwo") }).click();
  await page.getByRole("heading", { name: "The desk", exact: true }).waitFor();
  report["login_" + name] = true;
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.getByRole("heading", { name: "Sign in", exact: true }).waitFor();
}

report.consoleErrors = consoleErrors;
report.pageErrors = pageErrors;
report.foreignRequests = foreign;

await browser.close();
console.log(JSON.stringify(report, null, 2));
const fail =
  !report.health.ok ||
  !report.landingHero ||
  report.overflow390 > 0 ||
  report.landingAxeSerious > 0 ||
  pageErrors.length > 0 ||
  foreign.length > 0;
process.exitCode = fail ? 1 : 0;