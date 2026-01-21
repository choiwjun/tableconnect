'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n/context';

interface JoinRequestButtonProps {
  fromSessionId: string;
  toSessionId: string;
  toTableNumber: number;
  toNickname: string;
  onSuccess?: (joinRequest: JoinRequestResult) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

interface JoinRequestResult {
  id: string;
  templateType: string;
  expiresAt: string;
}

const TEMPLATE_OPTIONS = [
  {
    id: 'available_now',
    labelKey: 'join.template.available_now',
    defaultLabel: '今すぐ合席できます！',
    icon: '🍻',
  },
  {
    id: 'available_soon',
    labelKey: 'join.template.available_soon',
    defaultLabel: '10分後くらいに合席できます',
    icon: '⏰',
  },
  {
    id: 'drink_together',
    labelKey: 'join.template.drink_together',
    defaultLabel: 'もう一杯一緒にどうですか？',
    icon: '🥂',
  },
];

export function JoinRequestButton({
  fromSessionId,
  toSessionId,
  toTableNumber,
  toNickname,
  onSuccess,
  onError,
  disabled = false,
  className = '',
}: JoinRequestButtonProps) {
  const { t, locale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleOpenModal = () => {
    if (disabled) return;
    setIsOpen(true);
    setSelectedTemplate(null);
  };

  const handleSendRequest = async () => {
    if (!selectedTemplate) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/join/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromSessionId,
          toSessionId,
          templateType: selectedTemplate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send join request');
      }

      setIsOpen(false);
      onSuccess?.({
        id: data.joinRequest.id,
        templateType: selectedTemplate,
        expiresAt: data.joinRequest.expires_at,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonLabel = () => {
    const labels: Record<string, string> = {
      ja: '合席を提案',
      ko: '합석 제안',
      en: 'Propose Join',
      'zh-CN': '提议合桌',
      'zh-TW': '提議合桌',
    };
    return labels[locale] || labels['ja'];
  };

  const getModalTitle = () => {
    const titles: Record<string, string> = {
      ja: `テーブル ${toTableNumber} に合席を提案`,
      ko: `테이블 ${toTableNumber}에 합석 제안`,
      en: `Propose join to Table ${toTableNumber}`,
      'zh-CN': `向桌号 ${toTableNumber} 提议合桌`,
      'zh-TW': `向桌號 ${toTableNumber} 提議合桌`,
    };
    return titles[locale] || titles['ja'];
  };

  const getSendButtonLabel = () => {
    const labels: Record<string, string> = {
      ja: '送信する',
      ko: '보내기',
      en: 'Send Request',
      'zh-CN': '发送请求',
      'zh-TW': '發送請求',
    };
    return labels[locale] || labels['ja'];
  };

  const getCancelLabel = () => {
    const labels: Record<string, string> = {
      ja: 'キャンセル',
      ko: '취소',
      en: 'Cancel',
      'zh-CN': '取消',
      'zh-TW': '取消',
    };
    return labels[locale] || labels['ja'];
  };

  return (
    <>
      {/* Join Request Button */}
      <button
        onClick={handleOpenModal}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-xl
          bg-gradient-to-r from-neon-pink to-neon-purple
          text-white font-medium text-sm
          hover:shadow-lg hover:shadow-neon-pink/30
          transition-all duration-300
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        <span className="material-symbols-outlined text-lg">
          group_add
        </span>
        {getButtonLabel()}
      </button>

      {/* Template Selection Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-void/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md bg-deep-gray rounded-2xl border border-neon-cyan/20 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-neon-pink/10 to-neon-purple/10">
              <h3 className="text-lg font-display text-soft-white">
                {getModalTitle()}
              </h3>
              <p className="text-sm text-muted-gray mt-1">
                {toNickname}
              </p>
            </div>

            {/* Template Options */}
            <div className="p-4 space-y-3">
              {TEMPLATE_OPTIONS.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`
                    w-full p-4 rounded-xl text-left transition-all duration-200
                    ${selectedTemplate === template.id
                      ? 'bg-neon-cyan/20 border-2 border-neon-cyan'
                      : 'bg-void/50 border border-white/10 hover:border-white/30'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{template.icon}</span>
                    <span className="text-soft-white font-medium">
                      {t(template.labelKey) || template.defaultLabel}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-void border border-white/20 text-soft-white font-medium hover:bg-white/5 transition-colors"
              >
                {getCancelLabel()}
              </button>
              <button
                onClick={handleSendRequest}
                disabled={!selectedTemplate || isLoading}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-neon-pink/30 transition-all"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                  </span>
                ) : (
                  getSendButtonLabel()
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
