'use client';

import { useState, useCallback } from 'react';
import { Input, Button } from '@/components/ui';
import { isValidNickname } from '@/lib/utils/validators';
import { MAX_NICKNAME_LENGTH } from '@/lib/utils/constants';
import { useTranslation } from '@/lib/i18n/context';

interface NicknameFormProps {
  onSubmit: (nickname: string) => Promise<void>;
  isLoading?: boolean;
  initialValue?: string;
}

export function NicknameForm({
  onSubmit,
  isLoading = false,
  initialValue = '',
}: NicknameFormProps) {
  const { t } = useTranslation();
  const [nickname, setNickname] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const trimmedNickname = nickname.trim();

      if (!trimmedNickname) {
        setError(t('session.nicknameRequired'));
        return;
      }

      if (!isValidNickname(trimmedNickname)) {
        setError(t('session.nicknameTooLong', { max: MAX_NICKNAME_LENGTH }));
        return;
      }

      try {
        await onSubmit(trimmedNickname);
      } catch (err) {
        console.error('Nickname submission error:', err);
        setError(t('session.errorOccurred'));
      }
    },
    [nickname, onSubmit, t]
  );

  const handleChange = useCallback((value: string) => {
    setNickname(value);
    setError(null);
  }, []);

  const remainingChars = MAX_NICKNAME_LENGTH - nickname.length;
  const isOverLimit = remainingChars < 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          type="text"
          value={nickname}
          onChange={handleChange}
          placeholder={t('session.enterNickname')}
          maxLength={MAX_NICKNAME_LENGTH + 5} // Allow slight overflow to show error
          disabled={isLoading}
          error={error ?? undefined}
          className="text-center text-lg"
          autoFocus
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
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full py-3 text-lg"
        loading={isLoading}
        disabled={isLoading || isOverLimit || !nickname.trim()}
      >
        {t('session.joinSession')}
      </Button>
    </form>
  );
}
