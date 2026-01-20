/**
 * Browser language auto-detection utilities
 * Detects browser language settings and provides translations
 */

export function getBrowserLanguage(): string {
  // Get browser language preference
  if (typeof navigator !== 'undefined' && navigator.language) {
    const lang = navigator.language.toLowerCase();
    
    // Map to supported locales
    if (lang.startsWith('ja')) return 'ja';
    if (lang.startsWith('ko')) return 'ko';
    if (lang.startsWith('zh')) return 'zh';
    if (lang.startsWith('en')) return 'en';
  }
  
  // Default to English
  return 'en';
}

export function shouldAutoTranslate(currentLocale: string): boolean {
  const browserLang = getBrowserLanguage();
  
  // Auto-translate if browser language differs from current locale
  // Or if current locale is 'en' (assumes user speaks English)
  return browserLang !== currentLocale || currentLocale === 'en';
}

export function getDetectedLanguageName(locale: string): string {
  const names: Record<string, string> = {
    'ja': '日本語',
    'ko': '한국어',
    'en': 'English',
    'zh': '中文',
  };
  return names[locale] || 'English';
}
