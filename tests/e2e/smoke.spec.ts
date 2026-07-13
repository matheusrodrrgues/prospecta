import { expect, test } from "@playwright/test";

test("public experience is available", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /prospecta 4\.0/i })).toBeVisible();
  await page.getByRole("link", { name: /abrir dashboard completo/i }).click();
  await expect(page.getByText("Dashboard Mineral")).toBeVisible();
});

test("blog renders published content", async ({ page }) => {
  await page.goto("/blog");
  await expect(page.getByRole("heading", { name: /publicações & notícias/i })).toBeVisible();
  await expect(page.locator(".post-card").first()).toBeVisible();
});
