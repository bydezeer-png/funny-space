import { test, expect } from '@playwright/test';

test.describe('Public Landing Page & Route Protection E2E Flow', () => {
  test('should render the landing page successfully', async ({ page }) => {
    // Go to landing page
    await page.goto('/');

    // Check title contains Soly's Space
    await expect(page).toHaveTitle(/Soly's Space/i);

    // Verify brand navigation or header text
    const heading = page.locator("h1:has-text(\"Soly's Space\")");
    await expect(heading).toBeVisible();

    // Verify presence of "Book Your Spot" call-to-action
    const ctaButton = page.locator('text=Book Your Spot 🎀').first();
    await expect(ctaButton).toBeVisible();
  });

  test('should redirect unauthenticated users from dashboard to login', async ({ page }) => {
    // Attempt to access dashboard route directly
    await page.goto('/dashboard');

    // Middleware should block this and redirect to login
    await expect(page).toHaveURL(/\/login/);

    // Verify the login form elements are present
    const loginHeader = page.locator('h1:has-text("بوابة الإدارة والتحكم")');
    await expect(loginHeader).toBeVisible();

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });
});
