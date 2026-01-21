'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n/context';

interface JoinSession {
  id: string;
  joinCode: string;
  tableA: number;
  tableB: number;
  endsAt: string;
}

interface JoinConfirmationScreenProps {
  joinSession: JoinSession;
  myTableNumber: number;
  partnerTableNumber: number;
  onClose: () => void;
}

export function JoinConfirmationScreen({
  joinSession,
  myTableNumber,
  partnerTableNumber,
  onClose,
}: JoinConfirmationScreenProps) {
  const { locale } = useI18n();
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Countdown timer
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const endsAt = new Date(joinSession.endsAt);
      const diff = endsAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('00:00');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [joinSession.endsAt]);

  const getTitle = () => {
    const titles: Record<string, string> = {
      ja: '合席確定',
      ko: '합석 확정',
      en: 'Join Confirmed',
      'zh-CN': '合桌确定',
      'zh-TW': '合桌確定',
    };
    return titles[locale] || titles['ja'];
  };

  const getInstructionText = () => {
    const texts: Record<string, string> = {
      ja: 'スタッフにこの画面を見せてください',
      ko: '직원에게 이 화면을 보여주세요',
      en: 'Please show this screen to staff',
      'zh-CN': '请向工作人员出示此画面',
      'zh-TW': '請向工作人員出示此畫面',
    };
    return texts[locale] || texts['ja'];
  };

  const getCodeLabel = () => {
    const labels: Record<string, string> = {
      ja: '確認コード',
      ko: '확인 코드',
      en: 'Confirmation Code',
      'zh-CN': '确认码',
      'zh-TW': '確認碼',
    };
    return labels[locale] || labels['ja'];
  };

  const getTablesLabel = () => {
    const labels: Record<string, string> = {
      ja: '合席テーブル',
      ko: '합석 테이블',
      en: 'Joining Tables',
      'zh-CN': '合桌桌号',
      'zh-TW': '合桌桌號',
    };
    return labels[locale] || labels['ja'];
  };

  const getTimeLeftLabel = () => {
    const labels: Record<string, string> = {
      ja: '有効期限',
      ko: '유효 시간',
      en: 'Time Left',
      'zh-CN': '有效期限',
      'zh-TW': '有效期限',
    };
    return labels[locale] || labels['ja'];
  };

  const getCloseLabel = () => {
    const labels: Record<string, string> = {
      ja: '閉じる',
      ko: '닫기',
      en: 'Close',
      'zh-CN': '关闭',
      'zh-TW': '關閉',
    };
    return labels[locale] || labels['ja'];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void">
      {/* Background animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-neon-cyan/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-neon-pink/20 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Content */}
      <div className="relative w-full max-w-md text-center">
        {/* Title */}
        <div className="mb-8">
          <span className="text-6xl mb-4 block">🎉</span>
          <h1 className="text-3xl font-display text-soft-white mb-2">
            {getTitle()}
          </h1>
          <p className="text-neon-cyan text-lg animate-pulse">
            {getInstructionText()}
          </p>
        </div>

        {/* Confirmation Code - Large Display */}
        <div className="bg-deep-gray/80 backdrop-blur-sm rounded-3xl border-2 border-neon-cyan p-8 mb-6 shadow-lg shadow-neon-cyan/20">
          <p className="text-muted-gray text-sm mb-2">{getCodeLabel()}</p>
          <div className="text-6xl font-mono font-bold tracking-widest text-neon-cyan mb-4">
            {joinSession.joinCode}
          </div>

          {/* Tables */}
          <div className="flex items-center justify-center gap-4 py-4 border-t border-white/10">
            <div className="text-center">
              <div className="w-16 h-16 rounded-xl bg-neon-pink/20 border border-neon-pink flex items-center justify-center mb-2">
                <span className="text-2xl font-bold text-neon-pink">
                  {myTableNumber}
                </span>
              </div>
            </div>
            <span className="text-3xl">🤝</span>
            <div className="text-center">
              <div className="w-16 h-16 rounded-xl bg-neon-purple/20 border border-neon-purple flex items-center justify-center mb-2">
                <span className="text-2xl font-bold text-neon-purple">
                  {partnerTableNumber}
                </span>
              </div>
            </div>
          </div>
          <p className="text-muted-gray text-sm">{getTablesLabel()}</p>
        </div>

        {/* Timer */}
        <div className="mb-8">
          <p className="text-muted-gray text-sm mb-1">{getTimeLeftLabel()}</p>
          <div className="text-2xl font-mono text-soft-white">
            {timeLeft}
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="px-8 py-3 rounded-xl bg-void border border-white/20 text-soft-white font-medium hover:bg-white/5 transition-colors"
        >
          {getCloseLabel()}
        </button>
      </div>
    </div>
  );
}
