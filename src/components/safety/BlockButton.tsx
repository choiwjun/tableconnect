'use client';

import { useState, useCallback } from 'react';
import { Button, Modal } from '@/components/ui';
import { useTranslation } from '@/lib/i18n/context';

interface BlockButtonProps {
  targetSessionId: string;
  targetNickname: string;
  currentSessionId: string;
  onBlock?: () => void;
  className?: string;
}

export function BlockButton({
  targetSessionId,
  targetNickname,
  currentSessionId,
  onBlock,
  className = '',
}: BlockButtonProps) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBlock = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockerSessionId: currentSessionId,
          blockedSessionId: targetSessionId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to block user');
      }

      setIsModalOpen(false);
      onBlock?.();
    } catch (err) {
      console.error('Error blocking user:', err);
      setError(err instanceof Error ? err.message : t('safety.blockUser'));
    } finally {
      setIsLoading(false);
    }
  }, [currentSessionId, targetSessionId, onBlock, t]);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`text-muted hover:text-red-400 transition-colors ${className}`}
        title={t('safety.block')}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
      </button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>

          <h2 className="font-display text-xl text-soft-white mb-2">
            {t('safety.blockNickname', { nickname: targetNickname })}
          </h2>
          <p className="text-muted text-sm mb-6">
            {t('safety.blockDescription')}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setIsModalOpen(false)}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleBlock}
              loading={isLoading}
              disabled={isLoading}
            >
              {t('safety.blockUser')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
