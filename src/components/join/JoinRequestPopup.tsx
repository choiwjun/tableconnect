'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n/context';

interface JoinRequest {
  id: string;
  from_table_number: number;
  template_type: string;
  created_at: string;
  expires_at: string;
  from_session: {
    id: string;
    nickname: string;
    gender: string | null;
    age_range: string | null;
    party_size: number | null;
  };
}

interface JoinRequestPopupProps {
  request: JoinRequest;
  sessionId: string;
  onAccept: (joinSession: JoinSessionResult) => void;
  onReject: () => void;
  onClose: () => void;
}

interface JoinSessionResult {
  id: string;
  joinCode: string;
  tableA: number;
  tableB: number;
  endsAt: string;
}

const TEMPLATE_MESSAGES: Record<string, Record<string, string>> = {
  available_now: {
    ja: '今すぐ合席できます！一緒に飲みませんか？',
    ko: '지금 바로 합석 가능해요! 같이 한잔 할까요?',
    en: "We're available right now! Want to join us for a drink?",
    'zh-CN': '现在就可以合桌！一起喝一杯吗？',
    'zh-TW': '現在就可以合桌！一起喝一杯嗎？',
  },
  available_soon: {
    ja: '10分後くらいに合席できます！',
    ko: '10분 뒤에 합석 가능해요!',
    en: "We'll be available in about 10 minutes!",
    'zh-CN': '大约10分钟后可以合桌！',
    'zh-TW': '大約10分鐘後可以合桌！',
  },
  drink_together: {
    ja: 'もう一杯一緒にどうですか？',
    ko: '한잔 더 하면서 이야기할래요?',
    en: 'How about another drink together?',
    'zh-CN': '再来一杯怎么样？',
    'zh-TW': '再來一杯怎麼樣？',
  },
};

export function JoinRequestPopup({
  request,
  sessionId,
  onAccept,
  onReject,
  onClose,
}: JoinRequestPopupProps) {
  const { locale } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<'accept' | 'reject' | null>(null);

  const getMessage = () => {
    const messages = TEMPLATE_MESSAGES[request.template_type] || TEMPLATE_MESSAGES['available_now'];
    return messages[locale] || messages['ja'];
  };

  const handleAction = async (actionType: 'accept' | 'reject') => {
    setIsLoading(true);
    setAction(actionType);

    try {
      const response = await fetch(`/api/join/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          sessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to respond to join request');
      }

      if (actionType === 'accept' && data.joinSession) {
        onAccept(data.joinSession);
      } else {
        onReject();
      }
    } catch (error) {
      console.error('Error responding to join request:', error);
      // Still close popup on error
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    const titles: Record<string, string> = {
      ja: '合席リクエスト',
      ko: '합석 요청',
      en: 'Join Request',
      'zh-CN': '合桌请求',
      'zh-TW': '合桌請求',
    };
    return titles[locale] || titles['ja'];
  };

  const getFromLabel = () => {
    const labels: Record<string, string> = {
      ja: `テーブル ${request.from_table_number} から`,
      ko: `테이블 ${request.from_table_number}에서`,
      en: `From Table ${request.from_table_number}`,
      'zh-CN': `来自桌号 ${request.from_table_number}`,
      'zh-TW': `來自桌號 ${request.from_table_number}`,
    };
    return labels[locale] || labels['ja'];
  };

  const getAcceptLabel = () => {
    const labels: Record<string, string> = {
      ja: '受け入れる',
      ko: '수락',
      en: 'Accept',
      'zh-CN': '接受',
      'zh-TW': '接受',
    };
    return labels[locale] || labels['ja'];
  };

  const getRejectLabel = () => {
    const labels: Record<string, string> = {
      ja: 'お断りする',
      ko: '거절',
      en: 'Decline',
      'zh-CN': '拒绝',
      'zh-TW': '拒絕',
    };
    return labels[locale] || labels['ja'];
  };

  const formatPartySize = (size: number | null) => {
    if (!size) return '';
    const labels: Record<string, string> = {
      ja: `${size}名`,
      ko: `${size}명`,
      en: `${size} people`,
      'zh-CN': `${size}人`,
      'zh-TW': `${size}人`,
    };
    return labels[locale] || labels['ja'];
  };

  const formatAgeRange = (ageRange: string | null) => {
    if (!ageRange) return '';
    const ageLabels: Record<string, Record<string, string>> = {
      ja: {
        '20s_early': '20代前半',
        '20s_mid': '20代半ば',
        '20s_late': '20代後半',
        '30s_early': '30代前半',
        '30s_mid': '30代半ば',
        '30s_late': '30代後半',
        '40s': '40代以上',
      },
      ko: {
        '20s_early': '20대 초반',
        '20s_mid': '20대 중반',
        '20s_late': '20대 후반',
        '30s_early': '30대 초반',
        '30s_mid': '30대 중반',
        '30s_late': '30대 후반',
        '40s': '40대 이상',
      },
    };
    return ageLabels[locale]?.[ageRange] || ageLabels['ja'][ageRange] || '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-void/80 backdrop-blur-sm" />

      {/* Popup */}
      <div className="relative w-full max-w-sm bg-deep-gray rounded-2xl border border-neon-cyan/30 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-neon-pink/5 to-neon-cyan/5" />

        {/* Content */}
        <div className="relative">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🍻</span>
              <div>
                <h3 className="text-lg font-display text-soft-white">
                  {getTitle()}
                </h3>
                <p className="text-sm text-neon-cyan">
                  {getFromLabel()}
                </p>
              </div>
            </div>
          </div>

          {/* Sender Info */}
          <div className="px-6 py-4 border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center text-white font-bold text-lg">
                {request.from_session.nickname?.charAt(0) || 'T'}
              </div>
              <div>
                <p className="font-medium text-soft-white">
                  {request.from_session.nickname}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-gray">
                  {request.from_session.party_size && (
                    <span>{formatPartySize(request.from_session.party_size)}</span>
                  )}
                  {request.from_session.age_range && (
                    <>
                      <span>•</span>
                      <span>{formatAgeRange(request.from_session.age_range)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="px-6 py-5">
            <p className="text-soft-white text-center text-lg leading-relaxed">
              「{getMessage()}」
            </p>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 flex gap-3">
            <button
              onClick={() => handleAction('reject')}
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-xl bg-void border border-white/20 text-soft-white font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              {isLoading && action === 'reject' ? '...' : getRejectLabel()}
            </button>
            <button
              onClick={() => handleAction('accept')}
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-green text-void font-bold hover:shadow-lg hover:shadow-neon-cyan/30 transition-all disabled:opacity-50"
            >
              {isLoading && action === 'accept' ? '...' : getAcceptLabel()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
