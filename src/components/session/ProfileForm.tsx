'use client';

import { useState, useCallback } from 'react';
import { isValidNickname } from '@/lib/utils/validators';
import { MAX_NICKNAME_LENGTH, MIN_PARTY_SIZE, MAX_PARTY_SIZE } from '@/lib/utils/constants';
import { useTranslation } from '@/lib/i18n/context';

// Types
export type Gender = 'male' | 'female';
export type AgeRange = '20s_early' | '20s_mid' | '20s_late' | '30s_early' | '30s_mid' | '30s_late' | '40s';

export interface ProfileData {
  gender: Gender;
  ageRange: AgeRange;
  partySize: number;
  nickname?: string;
}

interface ProfileFormProps {
  onSubmit: (data: ProfileData) => Promise<void>;
  isLoading?: boolean;
}

const genderOptions: { value: Gender; label: string; icon: string }[] = [
  { value: 'male', label: '男性', icon: '👨' },
  { value: 'female', label: '女性', icon: '👩' },
];

const ageRangeOptions: { value: AgeRange; label: string }[] = [
  { value: '20s_early', label: '20代前半' },
  { value: '20s_mid', label: '20代中盤' },
  { value: '20s_late', label: '20代後半' },
  { value: '30s_early', label: '30代前半' },
  { value: '30s_mid', label: '30代中盤' },
  { value: '30s_late', label: '30代後半' },
  { value: '40s', label: '40代以上' },
];

export function ProfileForm({ onSubmit, isLoading = false }: ProfileFormProps) {
  const { t } = useTranslation();
  
  const [step, setStep] = useState<'gender' | 'age' | 'party' | 'nickname'>('gender');
  const [gender, setGender] = useState<Gender | null>(null);
  const [ageRange, setAgeRange] = useState<AgeRange | null>(null);
  const [partySize, setPartySize] = useState<number | null>(null);
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);

  const _checkCanProceed = () => { // eslint-disable-line @typescript-eslint/no-unused-vars
    if (step === 'gender') return gender !== null;
    if (step === 'age') return ageRange !== null;
    if (step === 'party') return partySize !== null;
    if (step === 'nickname') {
      const trimmed = nickname.trim();
      return trimmed.length >= 1 && trimmed.length <= MAX_NICKNAME_LENGTH;
    }
    return false;
  };

  const handleNext = useCallback(() => {
    setError(null);
    if (step === 'gender') setStep('age');
    else if (step === 'age') setStep('party');
    else if (step === 'party') setStep('nickname');
  }, [step]);

  const handleBack = useCallback(() => {
    setError(null);
    if (step === 'age') setStep('gender');
    else if (step === 'party') setStep('age');
    else if (step === 'nickname') setStep('party');
  }, [step]);

  const handleSubmit = useCallback(async () => {
    setError(null);
    
    if (!gender || !ageRange || partySize === null) {
      setError('プロフィルを全て入力してください');
      return;
    }

    const trimmedNickname = nickname.trim();
    
    if (trimmedNickname && !isValidNickname(trimmedNickname)) {
      setError(t('session.nicknameTooLong', { max: MAX_NICKNAME_LENGTH }));
      return;
    }

    try {
      await onSubmit({
        gender,
        ageRange,
        partySize,
        nickname: trimmedNickname || undefined,
      });
    } catch (err) {
      console.error('Profile submission error:', err);
      setError(t('session.errorOccurred'));
    }
  }, [gender, ageRange, partySize, nickname, onSubmit, t]);

  // Step 1: Gender Selection
  if (step === 'gender') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-display text-soft-white mb-2">
            性別を選んでください
          </h2>
          <p className="text-muted">最初のステップ</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {genderOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setGender(option.value)}
              className={`
                p-8 rounded-2xl border-2 transition-all
                ${
                  gender === option.value
                    ? 'bg-neon-pink/20 border-neon-pink shadow-lg shadow-neon-pink/30'
                    : 'glass-panel border-steel/30 hover:border-neon-cyan/50'
                }
              `}
            >
              <span className="text-6xl mb-4 block">{option.icon}</span>
              <span className="text-xl font-display text-soft-white block">
                {option.label}
              </span>
            </button>
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-center text-sm mt-4">{error}</p>
        )}
      </div>
    );
  }

  // Step 2: Age Range Selection
  if (step === 'age') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-display text-soft-white mb-2">
            年齢を選んでください
          </h2>
          <p className="text-muted">第2ステップ</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {ageRangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setAgeRange(option.value)}
              className={`
                p-4 rounded-xl border-2 transition-all
                ${
                  ageRange === option.value
                    ? 'bg-neon-cyan/20 border-neon-cyan shadow-lg shadow-neon-cyan/30'
                    : 'glass-panel border-steel/30 hover:border-neon-pink/50'
                }
              }
              `}
            >
              <span className="text-base font-medium text-soft-white">
                {option.label}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={handleBack}
            className="flex-1 py-3 rounded-xl border border-steel/30 text-soft-white hover:border-steel/50 transition-colors"
          >
            戻る
          </button>
          <button
            onClick={handleNext}
            disabled={ageRange === null}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-medium hover:shadow-lg hover:shadow-neon-cyan/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            次へ
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-center text-sm mt-4">{error}</p>
        )}
      </div>
    );
  }

  // Step 3: Party Size Selection
  if (step === 'party') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-display text-soft-white mb-2">
            何名ですか？
          </h2>
          <p className="text-muted">第3ステップ</p>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: MAX_PARTY_SIZE }, (_, i) => i + MIN_PARTY_SIZE).map((size) => (
            <button
              key={size}
              onClick={() => setPartySize(size)}
              className={`
                aspect-square rounded-xl border-2 transition-all
                flex items-center justify-center
                ${
                  partySize === size
                    ? 'bg-neon-purple/20 border-neon-purple shadow-lg shadow-neon-purple/30'
                    : 'glass-panel border-steel/30 hover:border-neon-pink/50'
                }
              }
              `}
            >
              <span className="text-2xl font-display text-soft-white">
                {size}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={handleBack}
            className="flex-1 py-3 rounded-xl border border-steel/30 text-soft-white hover:border-steel/50 transition-colors"
          >
            戻る
          </button>
          <button
            onClick={handleNext}
            disabled={partySize === null}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-medium hover:shadow-lg hover:shadow-neon-cyan/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            次へ
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-center text-sm mt-4">{error}</p>
        )}
      </div>
    );
  }

  // Step 4: Nickname (Optional)
  if (step === 'nickname') {
    const remainingChars = MAX_NICKNAME_LENGTH - nickname.length;
    const isOverLimit = remainingChars < 0;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-display text-soft-white mb-2">
            ニックネーム（任意）
          </h2>
          <p className="text-muted">最終ステップ</p>
        </div>

        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder={t('session.enterNickname')}
          maxLength={MAX_NICKNAME_LENGTH + 5}
          className="w-full px-6 py-4 rounded-2xl bg-midnight border border-steel/50 text-soft-white text-lg text-center placeholder:text-muted focus:outline-none focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/20 transition-all"
        />

        <div className="flex justify-between mt-2 text-sm">
          <span className="text-muted">
            {t('session.nicknameHint')}
          </span>
          <span
            className={
              isOverLimit
                ? 'text-red-400'
                : remainingChars <= 5
                  ? 'text-yellow-400'
                  : 'text-muted'
            }
          >
            {remainingChars}
          </span>
        </div>

        <div className="space-y-3 mt-4">
          <button
            onClick={handleSubmit}
            disabled={isLoading || (nickname.trim() !== '' && isOverLimit)}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple text-white font-medium hover:shadow-lg hover:shadow-neon-pink/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-transparent rounded-full animate-spin" />
                <span>送信中...</span>
              </div>
            ) : (
              <span>プロフィルを登録して開始</span>
            )}
          </button>

          <button
            onClick={handleBack}
            disabled={isLoading}
            className="w-full py-4 rounded-xl border border-steel/30 text-soft-white hover:border-steel/50 transition-colors disabled:opacity-50"
          >
            戻る
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-center text-sm mt-4">{error}</p>
        )}
      </div>
    );
  }

  return null;
}
