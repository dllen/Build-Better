import { test, expect } from "@playwright/test";

test("Size Converter shows size table", async ({ page }) => {
  await page.goto("/size-converter");
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByText("US")).toBeVisible();
  await expect(page.getByText("EU")).toBeVisible();
  await expect(page.getByText("UK")).toBeVisible();
  await expect(page.getByText("Asia")).toBeVisible();
});

test("Size Converter category switch works", async ({ page }) => {
  await page.goto("/size-converter");
  await page.getByText("👞 Shoe - Men").click();
  const firstRow = page.locator("tbody tr").first();
  await expect(firstRow).toBeVisible();
});

test("Size Converter row hover highlights", async ({ page }) => {
  await page.goto("/size-converter");
  const firstRow = page.locator("tbody tr").first();
  await firstRow.hover();
  await expect(firstRow).toHaveClass(/bg-pink-50/);
});
