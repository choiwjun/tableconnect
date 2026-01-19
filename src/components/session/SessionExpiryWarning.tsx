'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Button } from '@/components/ui';
import { useTranslation } from '@/lib/i18n/context';
import type { Session } from '@/types/database';
import {
  isSessionExpired,
  isSessionExpiringSoon,
  formatSessionRemainingTime,
} from '@/lib/utils/session';

interface SessionExpiryWarningProps {
  session: Session | null;
  onSessionEnd: () => void;
  warningThresholdMs?: number;
}

export function SessionExpiryWarning({
  session,
  onSessionEnd,
  warningThresholdMs = 10 * 60 * 1000, // 10 minutes
}: SessionExpiryWarningProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [showExpired, setShowExpired] = useState(false);
  const [remainingTime, setRemainingTime] = useState<string>('');

  // Check session status
  const checkSessionStatus = useCallback(() => {
    if (!session) return;

    if (isSessionExpired(session)) {
      setShowWarning(false);
      setShowExpired(true);
    } else if (isSessionExpiringSoon(session, warningThresholdMs)) {
      setShowWarning(true);
      setRemainingTime(formatSessionRemainingTime(session));
    } else {
      setShowWarning(false);
    }
  }, [session, warningThresholdMs]);

  // Update remaining time every second when warning is shown
  useEffect(() => {
    if (!session) return;

    // Initial check
    checkSessionStatus();

    // Check every second
    const interval = setInterval(() => {
      checkSessionStatus();

      // Update remaining time display
      if (showWarning && session) {
        setRemainingTime(formatSessionRemainingTime(session));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session, showWarning, checkSessionStatus]);

  // Handle session expired
  const handleExpiredConfirm = useCallback(() => {
    setShowExpired(false);
    onSessionEnd();
    router.push('/');
  }, [onSessionEnd, router]);

  // Handle continue session (dismiss warning)
  const handleContinue = useCallback(() => {
    setShowWarning(false);
  }, []);

  if (!session) return null;

  return (
    <>
      {/* Expiring Soon Warning Modal */}
      <Modal
        isOpen={showWarning}
        onClose={handleContinue}
        title={t('session.sessionExpiringSoon')}
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-yellow-500/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <p className="text-soft-white">
            {t('session.sessionEndingSoon')}
          </p>

          <div className="text-3xl font-display text-neon-cyan">
            {remainingTime}
          </div>

          <p className="text-muted text-sm">
            {t('session.sessionEndingSoonDesc')}
          </p>

          <Button variant="primary" onClick={handleContinue} fullWidth>
            {t('common.confirm')}
          </Button>
        </div>
      </Modal>

      {/* Session Expired Modal */}
      <Modal
        isOpen={showExpired}
        onClose={handleExpiredConfirm}
        title={t('session.sessionEnded')}
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <p className="text-soft-white">
            {t('session.sessionExpired')}
          </p>

          <p className="text-muted text-sm">
            {t('session.sessionEndedDesc')}
          </p>

          <Button variant="primary" onClick={handleExpiredConfirm} fullWidth>
            {t('common.confirm')}
          </Button>
        </div>
      </Modal>
    </>
  );
}
