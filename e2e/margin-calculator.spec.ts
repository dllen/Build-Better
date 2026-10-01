import { test, expect } from "@playwright/test";

test("Margin Calculator calculates correctly", async ({ page }) => {
  await page.goto("/margin-calculator");
  await page.locator('input[type="number"]').first().fill("50");
  await page.locator('input[type="number"]').last().fill("100");
  await expect(page.getByText("$50.00")).toBeVisible();
  await expect(page.getByText("50.00%")).toBeVisible();
  await expect(page.getByText("100.00%")).toBeVisible();
});

test("Margin Calculator shows warning when price below cost", async ({ page }) => {
  await page.goto("/margin-calculator");
  await page.locator('input[type="number"]').first().fill("100");
  await page.locator('input[type="number"]').last().fill("50");
  await expect(page.getByText(/price is below cost/i)).toBeVisible();
});

test("Margin Calculator reset works", async ({ page }) => {
  await page.goto("/margin-calculator");
  await page.locator('input[type="number"]').first().fill("50");
  await page.getByRole("button", { name: "Reset" }).click();
  const inputs = page.locator('input[type="number"]');
  await expect(inputs.first()).toHaveValue("");
});
