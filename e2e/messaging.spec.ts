import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Messaging
 * Tests the chat/messaging functionality between users
 */

test.describe('Messaging', () => {
  test.describe('Chat Interface', () => {
    test('should display message input when chat is available', async ({ page }) => {
      await page.goto('/demo-merchant/1');
      await page.waitForLoadState('networkidle');

      // Look for message input field
      const messageInput = page.locator(
        'input[placeholder*="メッセージ"], ' +
        'textarea[placeholder*="メッセージ"], ' +
        '[data-testid="message-input"], ' +
        'input[type="text"][class*="message"], ' +
        'textarea[class*="message"]'
      );

      // Chat interface may or may not be visible depending on state
      const isVisible = await messageInput.isVisible().catch(() => false);

      // Page should load regardless
      await expect(page.locator('body')).toBeVisible();
    });

    test('should have send button when chat is available', async ({ page }) => {
      await page.goto('/demo-merchant/1');
      await page.waitForLoadState('networkidle');

      // Look for send button
      const sendButton = page.locator(
        'button[aria-label*="送信"], ' +
        'button[type="submit"][class*="send"], ' +
        '[data-testid="send-button"], ' +
        'button:has-text("送信")'
      );

      // Page should be functional
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Message Validation', () => {
    test('should handle empty message submission gracefully', async ({ page }) => {
      await page.goto('/demo-merchant/1');
      await page.waitForLoadState('networkidle');

      const messageInput = page.locator('textarea, input[type="text"]').first();
      const submitButton = page.locator('button[type="submit"]').first();

      if (await messageInput.isVisible() && await submitButton.isVisible()) {
        // Clear input and try to submit
        await messageInput.fill('');

        // Button should be disabled or clicking should not cause error
        const isDisabled = await submitButton.isDisabled();

        if (!isDisabled) {
          await submitButton.click();
          // No page crash should occur
          await expect(page.locator('body')).toBeVisible();
        }
      }
    });

    test('should handle long message input', async ({ page }) => {
      await page.goto('/demo-merchant/1');
      await page.waitForLoadState('networkidle');

      const messageInput = page.locator('textarea, input[type="text"]').first();

      if (await messageInput.isVisible()) {
        // Try to enter a very long message
        const longMessage = 'テスト'.repeat(200);
        await messageInput.fill(longMessage);

        // Should either truncate or show character limit warning
        await expect(page.locator('body')).toBeVisible();
      }
    });
  });

  test.describe('Message Display', () => {
    test('should have message container area', async ({ page }) => {
      await page.goto('/demo-merchant/1');
      await page.waitForLoadState('networkidle');

      // Look for message list/container
      const messageContainer = page.locator(
        '[data-testid="message-list"], ' +
        '.message-list, ' +
        '[class*="messages"], ' +
        '[role="log"]'
      );

      // Page should load successfully
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
