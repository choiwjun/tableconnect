'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { Locale, defaultLocale, isValidLocale } from './index';

// Import all message files
import jaMessages from '@/messages/ja.json';
import koMessages from '@/messages/ko.json';
import zhMessages from '@/messages/zh.json';
import enMessages from '@/messages/en.json';

type Messages = typeof jaMessages;
type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${NestedKeyOf<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

type TranslationKey = NestedKeyOf<Messages>;

const messages: Record<Locale, Messages> = {
  ja: jaMessages,
  ko: koMessages,
  zh: zhMessages as Messages,
  en: enMessages as Messages,
};

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  messages: Messages;
  isHydrated: boolean;
}

const I18nContext = createContext<I18nContextType | null>(null);

// Get nested value from object using dot notation
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let value: unknown = obj;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return path; // Return key if not found
    }
  }

  return typeof value === 'string' ? value : path;
}

// Replace params in string
function replaceParams(
  str: string,
  params?: Record<string, string | number>
): string {
  if (!params) return str;

  return Object.entries(params).reduce((acc, [key, value]) => {
    return acc.replace(new RegExp(`{${key}}`, 'g'), String(value));
  }, str);
}

interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  // Always start with defaultLocale on both server and client to ensure hydration match
  const [locale, setLocaleState] = useState<Locale>(initialLocale || defaultLocale);
  const [isHydrated, setIsHydrated] = useState(false);

  // After hydration, check cookie and update locale if needed
  useEffect(() => {
    const cookieLocale = document.cookie
      .split('; ')
      .find((row) => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1];

    if (cookieLocale && isValidLocale(cookieLocale)) {
      setLocaleState(cookieLocale);
    }
    setIsHydrated(true);
  }, []);

  // Update html lang attribute when locale changes
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback(async (newLocale: Locale) => {
    // Save to cookie
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;

    // Update state
    setLocaleState(newLocale);

    // Update html lang
    document.documentElement.lang = newLocale;
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const value = getNestedValue(
        messages[locale] as unknown as Record<string, unknown>,
        key
      );
      return replaceParams(value, params);
    },
    [locale]
  );

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        t,
        messages: messages[locale],
        isHydrated,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export function useTranslation() {
  const { t, locale } = useI18n();
  return { t, locale };
}
