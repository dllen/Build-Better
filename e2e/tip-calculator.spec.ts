import { test, expect } from "@playwright/test";

test("Tip Calculator - 15% of $100", async ({ page }) => {
  await page.goto("/tip-calculator");
  await page.locator('input[type="number"]').first().fill("100");
  await expect(page.getByText("$15.00")).toBeVisible();
  await expect(page.getByText("$115.00")).toBeVisible();
});

test("Tip Calculator - split between 4 people", async ({ page }) => {
  await page.goto("/tip-calculator");
  await page.locator('input[type="number"]').first().fill("100");
  // default 15% = $115 total, /4 = $28.75 per person
  const peopleInput = page.locator('input[type="number"]').nth(1);
  await peopleInput.fill("4");
  await expect(page.getByText("$28.75")).toBeVisible();
});

test("Quick tip buttons work", async ({ page }) => {
  await page.goto("/tip-calculator");
  await page.locator('input[type="number"]').first().fill("100");
  await page.getByRole("button", { name: /20%$/ }).first().click();
  await expect(page.getByText("$20.00")).toBeVisible();
});
