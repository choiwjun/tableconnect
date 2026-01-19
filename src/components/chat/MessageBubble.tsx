'use client';

import { cn } from '@/lib/utils/cn';
import { formatRelativeTime } from '@/lib/utils/format';
import { useTranslation } from '@/lib/i18n/context';

interface MessageBubbleProps {
  content: string;
  timestamp: string;
  isMine: boolean;
  senderNickname?: string;
  isRead?: boolean;
}

export function MessageBubble({
  content,
  timestamp,
  isMine,
  senderNickname,
  isRead = false,
}: MessageBubbleProps) {
  const { t } = useTranslation();

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
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
      </div>

      {/* Timestamp and read status */}
      <div
        className={cn(
          'flex items-center gap-2 mt-1.5',
          isMine ? 'mr-1' : 'ml-3'
        )}
      >
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
