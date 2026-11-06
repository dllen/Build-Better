import { test, expect } from "@playwright/test";

test("Support page shows both tip codes", async ({ page }) => {
  await page.goto("/support");

  await expect(page.getByRole("heading", { level: 1, name: "Support Build Better" })).toBeVisible();

  const codes = page.locator('img[alt*="QR code"]');
  await expect(codes).toHaveCount(2);

  await page.waitForFunction(() => {
    const images = Array.from(document.querySelectorAll<HTMLImageElement>('img[alt*="QR code"]'));
    return images.length === 2 && images.every((image) => image.complete && image.naturalWidth > 0);
  });

  await expect(codes.nth(0)).toHaveAttribute(
    "alt",
    "WeChat Pay QR code — scan with WeChat to tip Build Better"
  );
  await expect(codes.nth(1)).toHaveAttribute(
    "alt",
    "Alipay QR code — scan with Alipay to tip Build Better"
  );
  await expect(codes.nth(0)).toHaveAttribute("src", /\/support\/wechat-pay\.webp$/);
  await expect(codes.nth(1)).toHaveAttribute("src", /\/support\/alipay\.webp$/);
});

test("Footer links to the support page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("contentinfo").getByRole("link", { name: "Support" }).click();
  await expect(page).toHaveURL(/\/support$/);
  await expect(page.getByRole("heading", { level: 1, name: "Support Build Better" })).toBeVisible();
});

test("Support page renders under a locale route", async ({ page }) => {
  await page.goto("/zh-CN/support");
  await expect(page.getByRole("heading", { level: 1, name: "Support Build Better" })).toBeVisible();
  await expect(page.getByText("微信支付", { exact: true })).toBeVisible();
});
