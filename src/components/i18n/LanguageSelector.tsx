'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const languages = [
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
] as const;

type LanguageCode = (typeof languages)[number]['code'];

interface LanguageSelectorProps {
  currentLocale?: string;
  className?: string;
}

export function LanguageSelector({
  currentLocale = 'ja',
  className,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [locale, setLocale] = useState<LanguageCode>(currentLocale as LanguageCode);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const currentLanguage = languages.find((l) => l.code === locale) || languages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = async (code: LanguageCode) => {
    setLocale(code);
    setIsOpen(false);

    // Save to cookie via API
    await fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: code }),
    });

    // Refresh to apply new locale
    router.refresh();
  };

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-midnight border border-steel/50 hover:border-steel transition-colors"
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="text-sm text-soft-white">{currentLanguage.name}</span>
        <svg
          className={cn(
            'w-4 h-4 text-muted transition-transform',
            isOpen && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-40 glass rounded-lg overflow-hidden z-50 animate-fadeIn">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                language.code === locale
                  ? 'bg-neon-cyan/10 text-neon-cyan'
                  : 'text-muted hover:bg-steel/20 hover:text-soft-white'
              )}
            >
              <span className="text-lg">{language.flag}</span>
              <span className="text-sm">{language.name}</span>
              {language.code === locale && (
                <svg
                  className="w-4 h-4 ml-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
