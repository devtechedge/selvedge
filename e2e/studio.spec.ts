import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function signIn(page: Page, name: string) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: new RegExp(name) }).click();
  await expect(page.getByRole("heading", { name: "The desk", exact: true })).toBeVisible();
}

test("the studio redirects an anonymous visitor to sign in", async ({ page }) => {
  await page.goto("/studio", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
});

test("login page has no serious accessibility violations", async ({ page }) => {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual([]);
});

test("manager reserves yarn, weaves, finishes and releases a pattern", async ({ page }) => {
  await signIn(page, "Mara Okonkwo");

  await page.goto("/projects", { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: /Madder twill scarf/ }).first().click();
  await expect(page.getByRole("heading", { name: "Madder twill scarf", exact: true })).toBeVisible();
  await expect(page.getByRole("img", { name: /Cloth for Madder twill scarf/i })).toBeVisible();

  await page.getByLabel("Length (m)", { exact: true }).fill("50");
  await page.getByRole("button", { name: "Reserve yarn", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: /Reserved 50 m/ })).toBeVisible();

  await page.getByLabel("Picks to weave", { exact: true }).fill("10");
  await page.getByRole("button", { name: "Weave picks", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: /Wove 10 picks/ })).toBeVisible();

  await page.getByRole("button", { name: "Finish and free loom", exact: true }).click();
  await expect(page.getByText("FINISHED", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Finishing log", exact: true })).toBeVisible();

  await page.goto("/drafts", { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: /Madder twill scarf/ }).first().click();
  await expect(page.getByRole("heading", { name: "Madder twill scarf", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Release immutable version", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: /Released version/ })).toBeVisible();

  await page.goto("/releases", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("verified", { exact: true }).first()).toBeVisible();
});

const SURFACES = ["/studio", "/drafts", "/yarn", "/looms", "/projects", "/releases", "/team"];

for (const surface of SURFACES) {
  test(`${surface} has no serious accessibility violations`, async ({ page }) => {
    await signIn(page, "Mara Okonkwo");
    await page.goto(surface, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".studio-main")).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious, `${surface} axe violations`).toEqual([]);
  });

  test(`${surface} has no horizontal overflow at 390, 768 and 1440`, async ({ page }) => {
    await signIn(page, "Mara Okonkwo");
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(surface, { waitUntil: "domcontentloaded" });
      await expect(page.locator(".studio-main")).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${surface} overflow at ${width}px`).toBeLessThanOrEqual(0);
    }
  });
}