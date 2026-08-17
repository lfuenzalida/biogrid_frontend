import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const viewports = [
  { name: "móvil", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "escritorio", width: 1440, height: 900 },
];

for (const viewport of viewports) {
  test(`login es responsive en ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });
}

test("login no tiene infracciones WCAG críticas o serias", async ({ page }) => {
  await page.goto("/login");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations.filter(({ impact }) => impact === "critical" || impact === "serious"))
    .toEqual([]);
});
