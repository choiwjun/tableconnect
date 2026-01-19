'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { useI18n } from '@/lib/i18n/context';
import type { Locale } from '@/lib/i18n';

interface Language {
  code: Locale;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
];

interface LanguageSelectorProps {
  onSelect: (locale: Locale) => void;
  className?: string;
}

export function LanguageSelector({ onSelect, className }: LanguageSelectorProps) {
  const { locale: currentLocale } = useI18n();
  const [selectedLocale, setSelectedLocale] = useState<Locale>(currentLocale);

  const handleSelect = (locale: Locale) => {
    setSelectedLocale(locale);
  };

  const handleConfirm = () => {
    onSelect(selectedLocale);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Language Title - shown in all languages */}
      <div className="text-center">
        <h2 className="font-display text-2xl text-soft-white mb-2">
          言語を選択 / Select Language
        </h2>
        <p className="text-gray-400 text-sm">
          언어 선택 / 选择语言
        </p>
      </div>

      {/* Language Options */}
      <div className="grid grid-cols-2 gap-3">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleSelect(lang.code)}
            className={cn(
              'flex flex-col items-center justify-center p-4 rounded-xl border transition-all',
              selectedLocale === lang.code
                ? 'bg-primary/10 border-primary shadow-neon'
                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
            )}
          >
            <span className="text-3xl mb-2">{lang.flag}</span>
            <span className={cn(
              'font-medium',
              selectedLocale === lang.code ? 'text-primary' : 'text-white'
            )}>
              {lang.nativeName}
            </span>
            <span className="text-xs text-gray-500 mt-1">{lang.name}</span>
          </button>
        ))}
      </div>

      {/* Confirm Button */}
      <button
        onClick={handleConfirm}
        className="w-full py-3 rounded-xl bg-primary text-black font-bold hover:bg-primary/90 transition-all shadow-neon flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-lg">check</span>
        <span>
          {selectedLocale === 'ja' && '確認'}
          {selectedLocale === 'ko' && '확인'}
          {selectedLocale === 'zh' && '确认'}
          {selectedLocale === 'en' && 'Confirm'}
        </span>
      </button>
    </div>
  );
}
