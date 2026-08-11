import { expect, test } from "@playwright/test";

test("public experience is available", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /prospecta 4\.0/i })).toBeVisible();
  await page.getByRole("link", { name: /abrir dashboard completo/i }).click();
  await expect(page.getByText("GeoLab", { exact: true })).toBeVisible();
});

test("blog renders published content", async ({ page }) => {
  await page.goto("/blog");
  await expect(page.getByRole("heading", { name: /publicações & notícias/i })).toBeVisible();
  await expect(page.locator(".post-card").first()).toBeVisible();
});

test("news radar supports curated cards and filters", async ({ page }) => {
  await page.goto("/radar");
  await expect(page.getByRole("heading", { name: /radar prospecta/i })).toBeVisible();
  await expect(page.locator(".news-card").first()).toBeVisible();
  await page.getByPlaceholder(/busque mineral/i).fill("inteligência artificial");
  await expect(page.getByRole("heading", { name: /ia acelera/i })).toBeVisible();
});
