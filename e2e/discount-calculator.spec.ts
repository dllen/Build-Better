import { test, expect } from "@playwright/test";

test("Discount Calculator - percent mode calculates correctly", async ({ page }) => {
  await page.goto("/discount-calculator");
  await page.locator('input[type="number"]').first().fill("100");
  await page.locator('input[type="number"]').nth(1).fill("20");
  await expect(page.getByText("$20.00")).toBeVisible();
  await expect(page.getByText("$80.00")).toBeVisible();
  await expect(page.getByText("20.0%")).toBeVisible();
});

test("Discount Calculator - final price mode", async ({ page }) => {
  await page.goto("/discount-calculator");
  await page.locator('input[type="number"]').first().fill("100");
  await page.getByRole("button", { name: "Pay $" }).click();
  await page.locator('input[type="number"]').nth(1).fill("75");
  await expect(page.getByText("$25.00")).toBeVisible();
  await expect(page.getByText("25.0%")).toBeVisible();
});

test("Quick discount buttons work", async ({ page }) => {
  await page.goto("/discount-calculator");
  await page.locator('input[type="number"]').first().fill("100");
  await page.getByText("20%", { exact: false }).first().click();
  await expect(page.getByText("$20.00")).toBeVisible();
});
