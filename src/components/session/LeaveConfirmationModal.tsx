'use client';

import { Modal } from '@/components/ui';
import { useTranslation } from '@/lib/i18n/context';

interface LeaveConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LeaveConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
}: LeaveConfirmationModalProps) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center p-6">
        {/* Warning Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-neon-orange/10 flex items-center justify-center border border-neon-orange/30">
          <svg
            className="w-10 h-10 text-neon-orange"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4 4m4-4H9m6 4v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h5l5 5v6z"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="font-display text-2xl text-soft-white mb-4">
          {t('session.leaveConfirmation')}
        </h2>

        {/* Description */}
        <div className="space-y-3 mb-8">
          <p className="text-muted text-lg">
            {t('session.leaveWarning')}
          </p>
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <p className="text-red-400 text-sm">
              ⚠️ {t('session.leaveWarningDetail')}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-xl border border-steel/30 text-soft-white hover:border-steel/50 hover:bg-white/5 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-4 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple text-white font-medium hover:shadow-lg hover:shadow-neon-pink/30 transition-all"
          >
            {t('session.leaveButton')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
