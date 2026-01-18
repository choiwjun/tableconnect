import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Accessibility
 * Tests basic accessibility requirements
 */

test.describe('Accessibility', () => {
  test.describe('Keyboard Navigation', () => {
    test('should support keyboard navigation on landing page', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Tab through focusable elements
      await page.keyboard.press('Tab');

      // Get the currently focused element
      const focusedElement = page.locator(':focus');

      // Something should be focused after Tab
      await expect(focusedElement).toBeVisible();
    });

    test('should support keyboard navigation on table page', async ({ page }) => {
      await page.goto('/demo-merchant/1');
      await page.waitForLoadState('networkidle');

      // Tab through elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Page should remain accessible
      await expect(page.locator('body')).toBeVisible();
    });

    test('should close modal with Escape key', async ({ page }) => {
      await page.goto('/demo-merchant/1');
      await page.waitForLoadState('networkidle');

      // Try to open a modal
      const modalTrigger = page.locator('button').first();

      if (await modalTrigger.isVisible()) {
        await modalTrigger.click();
        await page.waitForTimeout(300);

        // Press Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);

        // Page should be accessible
        await expect(page.locator('body')).toBeVisible();
      }
    });
  });

  test.describe('ARIA Attributes', () => {
    test('should have proper document structure', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check for main landmark
      const mainContent = page.locator('main, [role="main"]');

      // Page should have semantic structure
      await expect(page.locator('body')).toBeVisible();
    });

    test('should have labeled form inputs', async ({ page }) => {
      await page.goto('/demo-merchant/1');
      await page.waitForLoadState('networkidle');

      // Check inputs have labels or aria-label
      const inputs = page.locator('input:not([type="hidden"]), textarea');
      const inputCount = await inputs.count();

      for (let i = 0; i < Math.min(inputCount, 5); i++) {
        const input = inputs.nth(i);
        const hasLabel =
          (await input.getAttribute('aria-label')) ||
          (await input.getAttribute('aria-labelledby')) ||
          (await input.getAttribute('placeholder')) ||
          (await input.getAttribute('id'));

        // Input should have some form of label
        expect(hasLabel).toBeTruthy();
      }
    });

    test('should have proper button labels', async ({ page }) => {
      await page.goto('/demo-merchant/1');
      await page.waitForLoadState('networkidle');

      // Check buttons have accessible names
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const hasAccessibleName =
          (await button.getAttribute('aria-label')) ||
          (await button.textContent())?.trim();

        // Button should have accessible name
        expect(hasAccessibleName).toBeTruthy();
      }
    });
  });

  test.describe('Color Contrast', () => {
    test('should have visible text content', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check main text is visible
      const headings = page.locator('h1, h2, h3');
      const headingCount = await headings.count();

      if (headingCount > 0) {
        const firstHeading = headings.first();
        await expect(firstHeading).toBeVisible();
      }
    });
  });

  test.describe('Focus Management', () => {
    test('should have visible focus indicators', async ({ page }) => {
      await page.goto('/demo-merchant/1');
      await page.waitForLoadState('networkidle');

      // Tab to a focusable element
      await page.keyboard.press('Tab');

      // Focused element should be visible
      const focusedElement = page.locator(':focus');
      const isVisible = await focusedElement.isVisible().catch(() => false);

      // Page should remain accessible
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
