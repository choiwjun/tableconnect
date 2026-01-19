'use client';

import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { useI18n, useTranslation } from '@/lib/i18n/context';
import { isValidNickname } from '@/lib/utils/validators';
import { MAX_NICKNAME_LENGTH } from '@/lib/utils/constants';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import type { Locale } from '@/lib/i18n';

interface TableRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { tableNumber: number; nickname: string; tableTitle?: string }) => Promise<void>;
  maxTableNumber?: number;
}

export function TableRegistrationModal({
  isOpen,
  onClose,
  onSubmit,
  maxTableNumber = 50,
}: TableRegistrationModalProps) {
  const { t } = useTranslation();
  const { setLocale, isHydrated } = useI18n();
  const [step, setStep] = useState<'language' | 'table' | 'profile'>('language');
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [nickname, setNickname] = useState('');
  const [tableTitle, setTableTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user has already selected language (cookie exists)
  useEffect(() => {
    if (isHydrated) {
      const cookieLocale = document.cookie
        .split('; ')
        .find((row) => row.startsWith('NEXT_LOCALE='))
        ?.split('=')[1];

      if (cookieLocale) {
        setHasSelectedLanguage(true);
        setStep('table');
      }
    }
  }, [isHydrated]);

  const resetForm = useCallback(() => {
    // Only reset to 'table' if language has been selected
    setStep(hasSelectedLanguage ? 'table' : 'language');
    setTableNumber('');
    setNickname('');
    setTableTitle('');
    setError(null);
    setIsLoading(false);
  }, [hasSelectedLanguage]);

  const handleLanguageSelect = useCallback(
    async (locale: Locale) => {
      await setLocale(locale);
      setHasSelectedLanguage(true);
      setStep('table');
    },
    [setLocale]
  );

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleTableSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const num = parseInt(tableNumber, 10);
      if (isNaN(num) || num < 1 || num > maxTableNumber) {
        setError(t('registration.invalidTableNumber').replace('{max}', String(maxTableNumber)));
        return;
      }

      setStep('profile');
    },
    [tableNumber, maxTableNumber, t]
  );

  const handleProfileSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const trimmedNickname = nickname.trim();
      if (!trimmedNickname) {
        setError(t('session.nicknameRequired'));
        return;
      }

      if (!isValidNickname(trimmedNickname)) {
        setError(t('session.nicknameTooLong'));
        return;
      }

      setIsLoading(true);
      try {
        await onSubmit({
          tableNumber: parseInt(tableNumber, 10),
          nickname: trimmedNickname,
          tableTitle: tableTitle.trim() || undefined,
        });
        handleClose();
      } catch (err) {
        console.error('Registration error:', err);
        setError(t('common.error'));
      } finally {
        setIsLoading(false);
      }
    },
    [nickname, tableNumber, tableTitle, onSubmit, handleClose, t]
  );

  if (!isOpen) return null;

  const remainingChars = MAX_NICKNAME_LENGTH - nickname.length;
  const isOverLimit = remainingChars < 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 glass-panel rounded-2xl overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">
                  {step === 'language' ? 'language' : step === 'table' ? 'table_restaurant' : 'person'}
                </span>
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-white">
                  {step === 'language' ? 'Select Language' : t('registration.title')}
                </h2>
                <p className="text-xs text-gray-400">
                  {step === 'language' ? '言語を選択 / 언어 선택' : step === 'table' ? t('registration.stepTable') : t('registration.stepProfile')}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-gray-400">close</span>
            </button>
          </div>

          {/* Step Indicator - 3 steps now */}
          <div className="flex items-center gap-2 mt-4">
            <div
              className={cn(
                'flex-1 h-1 rounded-full transition-colors',
                step === 'language' ? 'bg-primary' : 'bg-primary/30'
              )}
            />
            <div
              className={cn(
                'flex-1 h-1 rounded-full transition-colors',
                step === 'table' ? 'bg-primary' : step === 'profile' ? 'bg-primary/30' : 'bg-white/10'
              )}
            />
            <div
              className={cn(
                'flex-1 h-1 rounded-full transition-colors',
                step === 'profile' ? 'bg-primary' : 'bg-white/10'
              )}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'language' ? (
            <LanguageSelector onSelect={handleLanguageSelect} />
          ) : step === 'table' ? (
            <form onSubmit={handleTableSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('registration.tableNumberLabel')}
                </label>
                <input
                  type="number"
                  min="1"
                  max={maxTableNumber}
                  value={tableNumber}
                  onChange={(e) => {
                    setTableNumber(e.target.value);
                    setError(null);
                  }}
                  placeholder={t('registration.tableNumberPlaceholder')}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-center text-2xl font-bold placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {t('registration.tableNumberHint').replace('{max}', String(maxTableNumber))}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('registration.tableTitleLabel')}
                  <span className="text-gray-500 ml-1">({t('common.optional')})</span>
                </label>
                <input
                  type="text"
                  value={tableTitle}
                  onChange={(e) => setTableTitle(e.target.value)}
                  placeholder={t('registration.tableTitlePlaceholder')}
                  maxLength={50}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={!tableNumber}
                className="w-full py-3 rounded-xl bg-primary text-black font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-neon"
              >
                {t('common.next')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
                  <span className="material-symbols-outlined text-primary text-sm">table_restaurant</span>
                  <span className="text-primary font-bold">T-{tableNumber.padStart(2, '0')}</span>
                  {tableTitle && (
                    <>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-300 text-sm">{tableTitle}</span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('registration.nicknameLabel')}
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    setError(null);
                  }}
                  placeholder={t('session.nicknamePlaceholder')}
                  maxLength={MAX_NICKNAME_LENGTH + 5}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-center text-lg placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  autoFocus
                />
                <div className="flex justify-between mt-2 text-xs">
                  <span className="text-gray-500">{t('registration.nicknameHint')}</span>
                  <span
                    className={cn(
                      isOverLimit
                        ? 'text-red-400'
                        : remainingChars <= 5
                          ? 'text-yellow-400'
                          : 'text-gray-500'
                    )}
                  >
                    {remainingChars}
                  </span>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-400 text-center">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('table')}
                  disabled={isLoading}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-medium hover:bg-white/10 disabled:opacity-50 transition-colors"
                >
                  {t('common.back')}
                </button>
                <button
                  type="submit"
                  disabled={isLoading || isOverLimit || !nickname.trim()}
                  className="flex-1 py-3 rounded-xl bg-primary text-black font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-neon flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="size-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">celebration</span>
                      {t('registration.join')}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Info */}
        <div className="px-6 pb-6">
          <div className="p-3 rounded-lg bg-white/5 border border-white/5">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-primary text-sm mt-0.5">info</span>
              <p className="text-xs text-gray-400 leading-relaxed">
                {t('registration.privacyNote')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
