import { test, expect } from "@playwright/test";

test("Break-even Calculator - normal case", async ({ page }) => {
  await page.goto("/break-even-calculator");
  const inputs = page.locator('input[type="number"]');
  await inputs.nth(0).fill("10000"); // fixed
  await inputs.nth(1).fill("25");     // variable
  await inputs.nth(2).fill("50");     // price
  // Break-even = 10000 / (50-25) = 400 units
  await expect(page.getByText(/400 units/)).toBeVisible();
});

test("Break-even shows warning when price <= cost", async ({ page }) => {
  await page.goto("/break-even-calculator");
  const inputs = page.locator('input[type="number"]');
  await inputs.nth(0).fill("10000");
  await inputs.nth(1).fill("50");
  await inputs.nth(2).fill("50");
  await expect(page.getByText(/must exceed variable cost/i)).toBeVisible();
});
