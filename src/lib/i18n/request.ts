import { headers } from 'next/headers';

const MESSAGES = {
  ja: require('@/messages/ja.json'),
  ko: require('@/messages/ko.json'),
  en: require('@/messages/en.json'),
  zh: require('@/messages/zh.json'),
} as const;

/**
 * Get translation for a specific locale
 * Server-side helper for API routes
 */
export function getTranslation(locale: string = 'ja') {
  const messages = MESSAGES[locale as keyof typeof MESSAGES] || MESSAGES.ja;

  return (key: string, params?: Record<string, string | number>) => {
    const message = messages[key as string;

    if (!message) {
      return key;
    }

    // Simple parameter replacement
    let translatedMessage = message;
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translatedMessage = translatedMessage.replace(new RegExp(`{${param}}`, 'g'), String(value));
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
