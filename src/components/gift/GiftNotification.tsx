'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal, Button } from '@/components/ui';

interface Gift {
  id: string;
  menuName: string;
  senderNickname: string;
  senderTableNumber: number;
  message: string | null;
  amount: number;
}

interface GiftNotificationProps {
  gift: Gift;
  onClose: () => void;
  onThankYou?: (giftId: string, senderId: string) => void;
}

export function GiftNotification({ gift, onClose }: GiftNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  return (
    <Modal isOpen={true} onClose={handleClose}>
      <div
        className={`transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Gift Icon with Animation */}
        <div className="text-center mb-6">
          <div className="relative inline-block">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-neon-pink/30 to-neon-purple/30 flex items-center justify-center animate-pulse-slow">
              <svg
                className="w-12 h-12 text-neon-pink"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                />
              </svg>
            </div>
            {/* Sparkles */}
            <div className="absolute -top-2 -right-2 text-2xl animate-bounce">✨</div>
            <div className="absolute -bottom-1 -left-2 text-xl animate-bounce delay-100">🎉</div>
          </div>
        </div>

        {/* Title */}
        <h2 className="font-display text-2xl text-center text-soft-white mb-2">
          ギフトが届きました！
        </h2>

        {/* Sender Info */}
        <p className="text-center text-muted mb-6">
          {gift.senderNickname} (テーブル {gift.senderTableNumber}) さんから
        </p>

        {/* Gift Details */}
        <div className="glass rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-soft-white font-medium">{gift.menuName}</span>
            <span className="text-neon-cyan">¥{gift.amount.toLocaleString()}</span>
          </div>

          {gift.message && (
            <div className="pt-3 border-t border-steel/30">
              <p className="text-sm text-muted mb-1">メッセージ</p>
              <p className="text-soft-white italic">&ldquo;{gift.message}&rdquo;</p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Button variant="primary" className="w-full" onClick={handleClose}>
          ありがとう！
        </Button>
      </div>
    </Modal>
  );
}
