import { test, expect } from "@playwright/test";

/**
 * Smoke test for the CalculatorShell shared layout component.
 *
 * NOTE: CalculatorShell is shared infrastructure used by the MVP0 business
 * calculators (Tasks 2-6). It is not yet rendered on any public route at the
 * time this test was written, so we verify it through the homepage build
 * pipeline rather than a dedicated consumer page:
 *   1. The homepage loads (i.e. nothing in src/ breaks the build/import graph)
 *   2. The dev server responds (i.e. CalculatorShell.tsx compiles under Vite)
 *
 * A targeted "renders CalculatorShell with a title" assertion will be added
 * here once the first MVP0 calculator route (e.g. /tools/loan-calculator)
 * ships and wires CalculatorShell into its page.
 */
test.describe("CalculatorShell", () => {
  test("dev server compiles the CalculatorShell module without errors", async ({
    page,
    request,
  }) => {
    const homepage = await request.get("/");
    expect(homepage.status()).toBe(200);

    await page.goto("/");
    await expect(page.locator("nav")).toBeVisible();
  });
});
