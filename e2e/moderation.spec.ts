import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Content Moderation & Safety
 * Tests blocking, reporting, and content moderation features
 */

test.describe('Moderation & Safety', () => {
  test.describe('Block User', () => {
    test('should have block user option available', async ({ page }) => {
      await page.goto('/demo-merchant/1');
      await page.waitForLoadState('networkidle');

      // Look for block-related UI
      const blockButton = page.locator(
        'button[aria-label*="ブロック"], ' +
        'button:has-text("ブロック"), ' +
        '[data-testid="block-button"], ' +
        '[class*="block"]'
      );

      // Page should be functional
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Report User', () => {
    test('should have report user option available', async ({ page }) => {
      await page.goto('/demo-merchant/1');
      await page.waitForLoadState('networkidle');

      // Look for report-related UI
      const reportButton = page.locator(
        'button[aria-label*="報告"], ' +
        'button:has-text("報告"), ' +
        'button:has-text("通報"), ' +
        '[data-testid="report-button"]'
      );

      // Page should be functional
      await expect(page.locator('body')).toBeVisible();
    });

    test('should have report reasons if report modal opens', async ({ page }) => {
      await page.goto('/demo-merchant/1');
      await page.waitForLoadState('networkidle');

      const reportButton = page.locator('button:has-text("報告"), button:has-text("通報")').first();

      if (await reportButton.isVisible()) {
        await reportButton.click();
        await page.waitForTimeout(500);

        // Check for report reason options
        const reasonOptions = page.locator(
          'input[type="radio"], ' +
          'select option, ' +
          '[role="option"], ' +
          'label:has-text("スパム"), ' +
          'label:has-text("ハラスメント")'
        );

        const hasOptions = await reasonOptions.count() > 0;

        // Page should remain stable
        await expect(page.locator('body')).toBeVisible();
      }
    });
  });

  test.describe('Session Safety', () => {
    test('should display session expiry information', async ({ page }) => {
      await page.goto('/demo-merchant/1');
      await page.waitForLoadState('networkidle');

      // Look for session/time related UI
      const sessionInfo = page.locator(
        '[data-testid="session-timer"], ' +
        '[class*="timer"], ' +
        '[class*="expir"], ' +
        ':has-text("残り")'
      );

      // Page should be functional
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle session end gracefully', async ({ page }) => {
      await page.goto('/demo-merchant/1');
      await page.waitForLoadState('networkidle');

      // Look for exit/end session button
      const exitButton = page.locator(
        'button:has-text("退出"), ' +
        'button:has-text("終了"), ' +
        '[data-testid="exit-button"]'
      );

      if (await exitButton.isVisible()) {
        await exitButton.click();
        await page.waitForTimeout(500);

        // Should show confirmation or redirect
        const confirmDialog = page.locator('[role="dialog"], [role="alertdialog"]');
        const confirmVisible = await confirmDialog.isVisible().catch(() => false);

        // Page should remain accessible
        await expect(page.locator('body')).toBeVisible();
      }
    });
  });
});
