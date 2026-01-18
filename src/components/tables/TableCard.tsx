'use client';

import { formatRelativeTime } from '@/lib/utils/format';

interface TableCardProps {
  tableNumber: number;
  nickname: string;
  createdAt: string;
  onClick: () => void;
  hasUnread?: boolean;
}

export function TableCard({
  tableNumber,
  nickname,
  createdAt,
  onClick,
  hasUnread = false,
}: TableCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full glass rounded-xl p-4 text-left transition-all duration-200 hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98] relative"
    >
      {hasUnread && (
        <span className="absolute top-3 right-3 w-3 h-3 bg-neon-pink rounded-full animate-pulse" />
      )}

      <div className="flex items-center gap-4">
        {/* Table Number Badge */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-pink/20 to-neon-purple/20 flex items-center justify-center border border-neon-pink/30">
          <span className="font-display text-lg text-neon-pink">
            {tableNumber}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-soft-white truncate">
            {nickname}
          </h3>
          <p className="text-sm text-muted">
            テーブル {tableNumber} • {formatRelativeTime(createdAt)}
          </p>
        </div>

        {/* Arrow */}
        <svg
          className="w-5 h-5 text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </button>
  );
}
