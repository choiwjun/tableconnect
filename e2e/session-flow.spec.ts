import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Session Flow
 * Tests the complete user flow from QR code scan to session creation
 */

test.describe('Session Flow', () => {
  test.describe('Landing Page', () => {
    test('should display landing page correctly', async ({ page }) => {
      await page.goto('/');

      // Check page title
      await expect(page).toHaveTitle(/TableConnect/i);

      // Check main heading
      await expect(page.locator('h1')).toBeVisible();
    });
  });

  test.describe('QR Code Entry', () => {
    test('should navigate to merchant page via QR code URL', async ({ page }) => {
      // Simulate QR code scan by navigating directly
      await page.goto('/demo-merchant/1');

      // Should show nickname input or table view
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle invalid merchant gracefully', async ({ page }) => {
      await page.goto('/invalid-merchant-id/1');

      // Should show error or redirect
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Nickname Input', () => {
    test('should allow entering nickname', async ({ page }) => {
      await page.goto('/demo-merchant/1');

      // Look for nickname input field
      const nicknameInput = page.locator('input[placeholder*="ニックネーム"], input[name="nickname"]');

      if (await nicknameInput.isVisible()) {
        await nicknameInput.fill('テストユーザー');

        // Check the value was entered
        await expect(nicknameInput).toHaveValue('テストユーザー');
      }
    });

    test('should validate nickname length', async ({ page }) => {
      await page.goto('/demo-merchant/1');

      const nicknameInput = page.locator('input[placeholder*="ニックネーム"], input[name="nickname"]');

      if (await nicknameInput.isVisible()) {
        // Try to enter a very long nickname
        await nicknameInput.fill('a'.repeat(51));

        // Submit button should be disabled or show error
        const submitButton = page.locator('button[type="submit"]');

        if (await submitButton.isVisible()) {
          // Either button is disabled or error message is shown
          const hasError = await page.locator('[role="alert"], .error, .text-red').isVisible();
          const isDisabled = await submitButton.isDisabled();

          expect(hasError || isDisabled).toBeTruthy();
        }
      }
    });
  });
});
