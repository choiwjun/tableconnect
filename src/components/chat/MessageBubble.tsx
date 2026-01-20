'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';
import { formatRelativeTime } from '@/lib/utils/format';
import { useTranslation } from '@/lib/i18n/context';

interface MessageBubbleProps {
  content: string;
  timestamp: string;
  isMine: boolean;
  senderNickname?: string;
  isRead?: boolean;
  targetLanguage?: string;
}

export function MessageBubble({
  content,
  timestamp,
  isMine,
  senderNickname,
  isRead = false,
  targetLanguage,
}: MessageBubbleProps) {
  const { t, locale } = useTranslation();
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);

  // 번역 기능이 필요한지 확인
  const shouldTranslate = targetLanguage && targetLanguage !== locale;

  // 메시지 번역
  const translateMessage = useCallback(async () => {
    if (!shouldTranslate || isTranslating) return;

    setIsTranslating(true);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: content,
          targetLanguage: targetLanguage || 'en',
        }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      setTranslatedContent(data.translated);
      setShowTranslation(true);
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  }, [content, targetLanguage, shouldTranslate, isTranslating]);

  // 번역 토글
  const handleTranslateToggle = useCallback(() => {
    if (showTranslation) {
      setShowTranslation(false);
    } else if (translatedContent) {
      setShowTranslation(true);
    } else {
      translateMessage();
    }
  }, [showTranslation, translatedContent, translateMessage]);

  return (
    <div
      className={cn(
        'flex flex-col max-w-[80%]',
        isMine ? 'items-end ml-auto' : 'items-start mr-auto'
      )}
    >
      {/* Sender nickname (only for received messages) */}
      {!isMine && senderNickname && (
        <span className="text-xs text-neon-cyan mb-1 ml-3 font-medium">
          {senderNickname}
        </span>
      )}

      {/* Message bubble */}
      <div
        className={cn(
          'px-4 py-3 rounded-2xl break-words shadow-lg transition-all duration-200',
          isMine
            ? 'bg-gradient-to-r from-neon-pink to-neon-purple text-white rounded-br-md shadow-neon-pink/20'
            : 'glass-panel border border-steel/30 text-soft-white rounded-bl-md'
        )}
      >
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {showTranslation && translatedContent ? translatedContent : content}
        </p>

        {/* Translation badge */}
        {showTranslation && translatedContent && (
          <div className="mt-2 pt-2 border-t border-white/20">
            <p className="text-xs opacity-70 italic">{content}</p>
          </div>
        )}
      </div>

      {/* Timestamp and read status */}
      <div
        className={cn(
          'flex items-center gap-2 mt-1.5',
          isMine ? 'mr-1' : 'ml-3'
        )}
      >
        {/* Translate button */}
        {shouldTranslate && (
          <button
            onClick={handleTranslateToggle}
            disabled={isTranslating}
            className="flex items-center gap-1 text-xs text-neon-cyan hover:text-neon-cyan/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isTranslating ? (
              <>
                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('chat.translating')}
              </>
            ) : showTranslation ? (
              <>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                {t('chat.showOriginal')}
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                {t('chat.translate')}
              </>
            )}
          </button>
        )}

        <span className="text-xs text-muted">
          {formatRelativeTime(timestamp)}
        </span>
        {isMine && isRead && (
          <span className="flex items-center gap-1 text-xs text-neon-cyan">
            <svg
              className="w-3 h-3"
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
            {t('chat.read')}
          </span>
        )}
      </div>
    </div>
  );
}
