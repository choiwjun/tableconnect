// Supported locales
export const locales = ['ja', 'ko', 'zh', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ja';

// Language display names
export const languageNames: Record<Locale, string> = {
  ja: '日本語',
  ko: '한국어',
  zh: '中文',
  en: 'English',
};

// Language flags
export const languageFlags: Record<Locale, string> = {
  ja: '🇯🇵',
  ko: '🇰🇷',
  zh: '🇨🇳',
  en: '🇺🇸',
};

// Check if locale is valid
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

// Get locale from cookie or default
export function getLocaleFromCookie(cookieValue?: string): Locale {
  if (cookieValue && isValidLocale(cookieValue)) {
    return cookieValue;
  }
  return defaultLocale;
}
