'use client';

import { useState, useCallback } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui';
import { formatPrice } from '@/lib/utils/format';

interface PaymentFormProps {
  amount: number;
  menuName: string;
  receiverNickname: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function PaymentForm({
  amount,
  menuName,
  receiverNickname,
  onSuccess,
  onError,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!stripe || !elements) {
        return;
      }

      setIsProcessing(true);
      setErrorMessage(null);

      try {
        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/payment/complete`,
          },
          redirect: 'if_required',
        });

        if (error) {
          if (error.type === 'card_error' || error.type === 'validation_error') {
            setErrorMessage(error.message || '決済に失敗しました');
            onError(error.message || '決済に失敗しました');
          } else {
            setErrorMessage('予期せぬエラーが発生しました');
            onError('予期せぬエラーが発生しました');
          }
        } else {
          // Payment successful
          onSuccess();
        }
      } catch (err) {
        console.error('Payment error:', err);
        setErrorMessage('決済処理中にエラーが発生しました');
        onError('決済処理中にエラーが発生しました');
      } finally {
        setIsProcessing(false);
      }
    },
    [stripe, elements, onSuccess, onError]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Gift Summary */}
      <div className="glass rounded-xl p-4">
        <h3 className="text-soft-white font-medium mb-2">ギフト内容</h3>
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted">メニュー</span>
          <span className="text-soft-white">{menuName}</span>
        </div>
        <div className="flex justify-between items-center text-sm mt-1">
          <span className="text-muted">送り先</span>
          <span className="text-soft-white">{receiverNickname}</span>
        </div>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-steel/30">
          <span className="text-soft-white font-medium">合計</span>
          <span className="text-neon-cyan font-display text-xl">
            {formatPrice(amount)}
          </span>
        </div>
      </div>

      {/* Stripe Payment Element */}
      <div className="glass rounded-xl p-4">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {errorMessage}
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        className="w-full py-3 text-lg"
        loading={isProcessing}
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? '処理中...' : `${formatPrice(amount)}を支払う`}
      </Button>

      <p className="text-center text-xs text-muted">
        決済はStripeによって安全に処理されます
      </p>
    </form>
  );
}
