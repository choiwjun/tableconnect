'use client';

import { cn } from '@/lib/utils/cn';
import { formatRelativeTime } from '@/lib/utils/format';

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
  return (
    <div
      className={cn(
        'flex flex-col max-w-[80%]',
        isMine ? 'items-end ml-auto' : 'items-start mr-auto'
      )}
    >
      {/* Sender nickname (only for received messages) */}
      {!isMine && senderNickname && (
        <span className="text-xs text-neon-cyan mb-1 ml-3">
          {senderNickname}
        </span>
      )}

      {/* Message bubble */}
      <div
        className={cn(
          'px-4 py-2.5 rounded-2xl break-words',
          isMine
            ? 'bg-gradient-to-r from-neon-pink to-neon-purple text-white rounded-br-md'
            : 'glass text-soft-white rounded-bl-md'
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{content}</p>
      </div>

      {/* Timestamp and read status */}
      <div
        className={cn(
          'flex items-center gap-1.5 mt-1',
          isMine ? 'mr-1' : 'ml-3'
        )}
      >
        <span className="text-xs text-muted">
          {formatRelativeTime(timestamp)}
        </span>
        {isMine && (
          <span className="text-xs text-muted">
            {isRead ? '既読' : ''}
          </span>
        )}
      </div>
    </div>
  );
}
