'use client';

import { useState, useCallback } from 'react';
import { Button, Modal } from '@/components/ui';
import { useTranslation } from '@/lib/i18n/context';

type ReportReason = 'harassment' | 'spam' | 'inappropriate' | 'other';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSessionId: string;
  targetNickname: string;
  currentSessionId: string;
  messageId?: string;
  onReport?: () => void;
}

export function ReportModal({
  isOpen,
  onClose,
  targetSessionId,
  targetNickname,
  currentSessionId,
  messageId,
  onReport,
}: ReportModalProps) {
  const { t } = useTranslation();
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const reasonLabels: Record<ReportReason, string> = {
    harassment: t('safety.harassment'),
    spam: t('safety.spam'),
    inappropriate: t('safety.inappropriate'),
    other: t('safety.other'),
  };

  const handleSubmit = useCallback(async () => {
    if (!selectedReason) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterSessionId: currentSessionId,
          reportedSessionId: targetSessionId,
          messageId: messageId || null,
          reason: selectedReason,
          description: description.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit report');
      }

      setIsSuccess(true);
      onReport?.();
    } catch (err) {
      console.error('Error submitting report:', err);
      setError(err instanceof Error ? err.message : t('safety.report'));
    } finally {
      setIsLoading(false);
    }
  }, [currentSessionId, targetSessionId, messageId, selectedReason, description, onReport, t]);

  const handleClose = useCallback(() => {
    setSelectedReason(null);
    setDescription('');
    setError(null);
    setIsSuccess(false);
    onClose();
  }, [onClose]);

  if (isSuccess) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-400"
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
          </div>

          <h2 className="font-display text-xl text-soft-white mb-2">
            {t('safety.reportSuccess')}
          </h2>
          <p className="text-muted text-sm mb-6">
            {t('safety.reportSuccessDescription')}
          </p>

          <Button variant="primary" className="w-full" onClick={handleClose}>
            {t('common.close')}
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div>
        <h2 className="font-display text-xl text-soft-white text-center mb-2">
          {t('safety.reportNickname', { nickname: targetNickname })}
        </h2>
        <p className="text-muted text-sm text-center mb-6">
          {t('safety.reportReason')}
        </p>

        {/* Reason Selection */}
        <div className="space-y-2 mb-6">
          {(Object.keys(reasonLabels) as ReportReason[]).map((reason) => (
            <button
              key={reason}
              onClick={() => setSelectedReason(reason)}
              className={`w-full p-3 rounded-xl text-left transition-all ${
                selectedReason === reason
                  ? 'bg-neon-pink/20 border border-neon-pink/50 text-soft-white'
                  : 'bg-midnight border border-steel/50 text-muted hover:border-steel'
              }`}
            >
              <span className="flex items-center gap-3">
                <span
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedReason === reason
                      ? 'border-neon-pink'
                      : 'border-steel'
                  }`}
                >
                  {selectedReason === reason && (
                    <span className="w-2.5 h-2.5 rounded-full bg-neon-pink" />
                  )}
                </span>
                {reasonLabels[reason]}
              </span>
            </button>
          ))}
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-soft-white text-sm mb-2">
            {t('safety.reportDescription')}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('safety.reportDescriptionPlaceholder')}
            maxLength={500}
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-midnight border border-steel/50 text-soft-white placeholder:text-muted resize-none focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/30"
          />
          <p className="text-right text-xs text-muted mt-1">
            {description.length}/500
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={handleClose}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={handleSubmit}
            loading={isLoading}
            disabled={isLoading || !selectedReason}
          >
            {t('safety.report')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
