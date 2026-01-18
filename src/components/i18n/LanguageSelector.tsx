'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { useI18n } from '@/lib/i18n/context';
import {
  locales,
  languageNames,
  languageFlags,
  type Locale,
} from '@/lib/i18n';

interface LanguageSelectorProps {
  className?: string;
}

export function LanguageSelector({ className }: LanguageSelectorProps) {
  const { locale, setLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = async (code: Locale) => {
    await setLocale(code);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-midnight border border-steel/50 hover:border-steel transition-colors"
      >
        <span className="text-lg">{languageFlags[locale]}</span>
        <span className="text-sm text-soft-white hidden sm:inline">
          {languageNames[locale]}
        </span>
        <span className="material-symbols-outlined text-muted text-sm">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-40 glass rounded-lg overflow-hidden z-50 animate-fadeIn">
          {locales.map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                lang === locale
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted hover:bg-steel/20 hover:text-soft-white'
              )}
            >
              <span className="text-lg">{languageFlags[lang]}</span>
              <span className="text-sm">{languageNames[lang]}</span>
              {lang === locale && (
                <span className="material-symbols-outlined text-sm ml-auto">
                  check
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
