import { test, expect } from "@playwright/test";

test.describe("Build-Better App", () => {
  test("homepage loads correctly", async ({ page }) => {
    await page.goto("/");
    
    // Check title
    await expect(page).toHaveTitle(/BuildBetter/);
    
    // Check main navigation exists
    await expect(page.locator("nav")).toBeVisible();
    
    // Check tools section exists
    await expect(page.locator("text=常用工具")).toBeVisible();
  });

  test("command palette opens with Ctrl+K", async ({ page }) => {
    await page.goto("/");
    
    // Open command palette
    await page.keyboard.press("Control+k");
    
    // Check modal is visible
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
  });

  test("theme toggle works", async ({ page }) => {
    await page.goto("/");
    
    // Find and click theme toggle button
    const themeButton = page.locator("button[title*='Theme']").first();
    await expect(themeButton).toBeVisible();
    await themeButton.click();
  });

  test("can navigate to games page", async ({ page }) => {
    await page.goto("/");
    
    await page.click("text=Games");
    await expect(page).toHaveURL(/\/games/);
  });

  test("can navigate to settings page", async ({ page }) => {
    await page.goto("/");
    
    await page.click("text=Settings");
    await expect(page).toHaveURL(/\/settings/);
  });

  test("settings page shows history section", async ({ page }) => {
    await page.goto("/settings");
    
    await expect(page.locator("text=History")).toBeVisible();
  });

  test("can search for a tool", async ({ page }) => {
    await page.goto("/");
    
    // Open command palette
    await page.keyboard.press("Control+k");
    
    // Type search query
    await page.fill('input[placeholder*="Search"]', "json");
    
    // Check results appear
    await expect(page.locator("text=JSON")).toBeVisible();
  });
});

test.describe("Tool Pages", () => {
  test("csv-to-json page loads", async ({ page }) => {
    await page.goto("/tools/csv-to-json");
    
    // Check page has content
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("password-generator page loads", async ({ page }) => {
    await page.goto("/tools/password-generator");
    
    // Check page has content
    await expect(page.locator("body")).not.toBeEmpty();
  });
});

test.describe("Games", () => {
  test("games listing page loads", async ({ page }) => {
    await page.goto("/games");
    
    await expect(page.locator("body")).not.toBeEmpty();
  });
});
