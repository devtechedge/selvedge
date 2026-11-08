import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("landing shows a threaded loom and woven twill on first paint", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Draft cloth/i })).toBeVisible();
  await expect(page.getByRole("img", { name: /Drawdown of a 2\/2 twill/i })).toBeVisible();
  await expect(page.getByRole("img", { name: /Woven cloth preview/i })).toBeVisible();
});

test("a visitor steps picks and changes weft color with no account", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("12/24 picks")).toBeVisible();
  await page.getByRole("button", { name: /Treadle 1\. Weave one pick/i }).click();
  await expect(page.getByText("13/24 picks")).toBeVisible();
  await page.getByRole("button", { name: "Weld", exact: true }).click();
  await expect(page.getByRole("button", { name: "Weld", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("the theme toggle switches to dark and back", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Switch to dark theme/i }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: /Switch to light theme/i }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("landing has no serious or critical accessibility violations", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("img", { name: /Woven cloth preview/i })).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious).toEqual([]);
});

test("landing has no horizontal overflow at 390, 768 and 1440", async ({ page }) => {
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("img", { name: /Woven cloth preview/i })).toBeVisible();
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth - window.innerWidth;
    });
    expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(0);
  }
});