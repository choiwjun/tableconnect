'use client';

import { useState, useCallback } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { MenuSelector } from './MenuSelector';
import { PaymentForm } from './PaymentForm';
import { Spinner, Button } from '@/components/ui';
import { getStripe, stripeAppearance } from '@/lib/stripe/client';
import type { Menu } from '@/types/database';

type GiftStep = 'menu' | 'message' | 'payment' | 'success';

interface GiftFlowProps {
  merchantId: string;
  senderSessionId: string;
  receiverSessionId: string;
  receiverNickname: string;
  receiverTableNumber: number;
  onClose: () => void;
}

export function GiftFlow({
  merchantId,
  senderSessionId,
  receiverSessionId,
  receiverNickname,
  receiverTableNumber,
  onClose,
}: GiftFlowProps) {
  const [step, setStep] = useState<GiftStep>('menu');
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [message, setMessage] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMenuSelect = useCallback((menu: Menu) => {
    setSelectedMenu(menu);
    setStep('message');
  }, []);

  const handleMessageSubmit = useCallback(async () => {
    if (!selectedMenu) return;

    setIsCreatingIntent(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuId: selectedMenu.id,
          senderSessionId,
          receiverSessionId,
          message: message.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create payment intent');
      }

      const { clientSecret: secret } = await response.json();
      setClientSecret(secret);
      setStep('payment');
    } catch (err) {
      console.error('Error creating payment intent:', err);
      setError(err instanceof Error ? err.message : '決済の準備に失敗しました');
    } finally {
      setIsCreatingIntent(false);
    }
  }, [selectedMenu, senderSessionId, receiverSessionId, message]);

  const handlePaymentSuccess = useCallback(() => {
    setStep('success');
  }, []);

  const handlePaymentError = useCallback((errorMsg: string) => {
    setError(errorMsg);
  }, []);

  const handleBack = useCallback(() => {
    if (step === 'message') {
      setStep('menu');
    } else if (step === 'payment') {
      setStep('message');
      setClientSecret(null);
    }
  }, [step]);

  const renderContent = () => {
    switch (step) {
      case 'menu':
        return (
          <MenuSelector
            merchantId={merchantId}
            onSelect={handleMenuSelect}
            onCancel={onClose}
          />
        );

      case 'message':
        return (
          <div className="space-y-6">
            {/* Selected Menu Summary */}
            {selectedMenu && (
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-neon-pink/20 to-neon-purple/20 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-neon-pink"
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
                  <div>
                    <p className="text-soft-white font-medium">{selectedMenu.name}</p>
                    <p className="text-sm text-neon-cyan">
                      ¥{selectedMenu.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Recipient Info */}
            <div className="text-center">
              <p className="text-muted text-sm">送り先</p>
              <p className="text-soft-white font-medium">
                {receiverNickname} (テーブル {receiverTableNumber})
              </p>
            </div>

            {/* Message Input */}
            <div>
              <label className="block text-soft-white text-sm mb-2">
                メッセージ（任意）
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="ありがとう！など..."
                maxLength={100}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-midnight border border-steel/50 text-soft-white placeholder:text-muted resize-none focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/30"
              />
              <p className="text-right text-xs text-muted mt-1">
                {message.length}/100
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={handleBack}>
                戻る
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleMessageSubmit}
                loading={isCreatingIntent}
                disabled={isCreatingIntent}
              >
                支払いへ進む
              </Button>
            </div>
          </div>
        );

      case 'payment':
        if (!clientSecret || !selectedMenu) {
          return (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          );
        }

        return (
          <Elements
            stripe={getStripe()}
            options={{
              clientSecret,
              appearance: stripeAppearance,
            }}
          >
            <div>
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-muted hover:text-soft-white mb-4"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                戻る
              </button>

              <PaymentForm
                amount={selectedMenu.price}
                menuName={selectedMenu.name}
                receiverNickname={receiverNickname}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </div>
          </Elements>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center animate-celebrate">
              <svg
                className="w-10 h-10 text-green-400"
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

            <h2 className="font-display text-2xl text-soft-white mb-2">
              ギフトを送りました！
            </h2>
            <p className="text-muted mb-6">
              {receiverNickname}さんに{selectedMenu?.name}を送りました。
            </p>

            <Button variant="primary" className="w-full" onClick={onClose}>
              閉じる
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      {/* Header */}
      {step !== 'success' && (
        <div className="text-center mb-6">
          <h2 className="font-display text-xl text-soft-white">
            {step === 'menu' && 'ギフトを選ぶ'}
            {step === 'message' && 'メッセージを添える'}
            {step === 'payment' && '支払い'}
          </h2>
          <p className="text-sm text-muted mt-1">
            {receiverNickname}さんにギフトを送る
          </p>
        </div>
      )}

      {renderContent()}
    </div>
  );
}
