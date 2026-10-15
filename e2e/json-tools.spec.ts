import { test, expect } from "@playwright/test";

test.describe("JSON ecosystem tools", () => {
  test("JsonToTypescript: converts JSON to TS interface", async ({ page }) => {
    await page.goto("/json-to-typescript");
    const input = page.locator("textarea").first();
    await input.fill('{"name": "Tom", "age": 30}');
    // Wait for output to render
    await expect(page.locator("pre code")).toContainText("name: string");
    await expect(page.locator("pre code")).toContainText("age: number");
  });

  test("JsonToSql: includes CREATE TABLE statement", async ({ page }) => {
    await page.goto("/json-to-sql");
    const input = page.locator("textarea").first();
    await input.fill('[{"id": 1, "name": "Tom"}]');
    await expect(page.locator("pre code")).toContainText("CREATE TABLE");
    await expect(page.locator("pre code")).toContainText("INSERT INTO");
  });

  test("JsonSort: sorts object keys alphabetically", async ({ page }) => {
    await page.goto("/json-sort");
    const input = page.locator("textarea").first();
    await input.fill('{"b": 1, "a": 2}');
    await expect(page.locator("pre code")).toContainText('"a": 2');
  });
});
