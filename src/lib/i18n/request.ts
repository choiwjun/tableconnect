/* eslint-disable @typescript-eslint/no-require-imports */
import jaMessages from '@/messages/ja.json';
import koMessages from '@/messages/ko.json';
import enMessages from '@/messages/en.json';
import zhMessages from '@/messages/zh.json';

const MESSAGES = {
  ja: jaMessages,
  ko: koMessages,
  en: enMessages,
  zh: zhMessages,
} as const;

type MessageKeys = keyof typeof jaMessages;

/**
 * Get translation for a specific locale
 * Server-side helper for API routes
 */
export function getTranslation(locale: string = 'ja') {
  const messages = MESSAGES[locale as keyof typeof MESSAGES] || MESSAGES.ja;

  return (key: MessageKeys, params?: Record<string, string | number>): string => {
    const message = (messages as Record<string, unknown>)[key as string];

    if (!message) {
      return key;
    }

    // Simple parameter replacement
    let translatedMessage = message as string;
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translatedMessage = translatedMessage.replace(
          new RegExp(`{${param}}`, 'g'),
          String(value)
        );
      });
    }

    return translatedMessage;
  };
}

/**
 * Detect locale from request headers
 */
export function detectLocale(request: Request): string {
  const acceptLanguage = request.headers.get('accept-language') || '';
  const browserLocale = acceptLanguage.split(',')[0].split('-')[0];

  // Map to supported locales
  if (['ja', 'ko', 'en', 'zh'].includes(browserLocale)) {
    return browserLocale;
  }

  return 'ja'; // Default to Japanese
}
