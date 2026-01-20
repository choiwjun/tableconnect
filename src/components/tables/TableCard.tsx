'use client';

import { formatRelativeTime } from '@/lib/utils/format';
import type { Gender, AgeRange } from '@/types/database';

interface TableCardProps {
  tableNumber: number;
  nickname: string | null;
  gender: Gender | null;
  ageRange: AgeRange | null;
  partySize: number | null;
  createdAt: string;
  onClick: () => void;
  hasUnread?: boolean;
  isCurrentSession?: boolean;
}

// Gender icons
const getGenderIcon = (gender: Gender | null) => {
  if (gender === 'male') return '👨';
  if (gender === 'female') return '👩';
  return '❓';
};

// Age range label
const getAgeRangeLabel = (ageRange: AgeRange | null) => {
  const labels = {
    '20s_early': '20代前半',
    '20s_mid': '20代中盤',
    '20s_late': '20代後半',
    '30s_early': '30代前半',
    '30s_mid': '30代中盤',
    '30s_late': '30代後半',
    '40s': '40代以上',
  };
  return labels[ageRange || '40s'] || '';
};

// Party size icon
const getPartySizeIcon = (size: number | null) => {
  if (!size) return '';
  if (size <= 2) return '👤';
  if (size <= 4) return '👥';
  if (size <= 6) return '👨‍👩‍👧';
  return '👨‍👩‍👧‍👦';
};

export function TableCard({
  tableNumber,
  nickname,
  gender,
  ageRange,
  partySize,
  createdAt,
  onClick,
  hasUnread = false,
  isCurrentSession = false,
}: TableCardProps) {
  const genderIcon = getGenderIcon(gender);
  const ageLabel = getAgeRangeLabel(ageRange);
  const partyIcon = getPartySizeIcon(partySize);

  return (
    <button
      onClick={onClick}
      disabled={isCurrentSession}
      className={`
        w-full glass-panel rounded-2xl p-5 text-left transition-all duration-200
        hover:bg-white/10 hover:scale-[1.02]
        active:scale-[0.98]
        relative
        ${isCurrentSession ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${hasUnread ? 'ring-2 ring-neon-pink/30' : ''}
      `}
    >
      {hasUnread && (
        <span className="absolute top-4 right-4 w-3 h-3 bg-neon-pink rounded-full animate-pulse shadow-lg shadow-neon-pink/50" />
      )}

      <div className="flex items-start gap-4">
        {/* Table Number Badge */}
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-neon-pink/20 to-neon-purple/20 flex items-center justify-center border border-neon-pink/30 flex-shrink-0">
          <span className="font-display text-xl text-neon-pink">
            {tableNumber}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-display text-lg text-soft-white truncate">
              {nickname || `テーブル ${tableNumber}`}
            </h3>
            
            {/* Gender & Age badges */}
            <div className="flex items-center gap-1.5">
              <span className="text-lg" title="性別">
                {genderIcon}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan">
                {ageLabel}
              </span>
              {partySize !== null && (
                <span className="text-sm" title="人数">
                  {partyIcon}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <p className="text-muted truncate">
              テーブル {tableNumber}
            </p>
            {partySize !== null && (
              <>
                <span className="text-steel">•</span>
                <span className="text-muted">
                  {partySize}人
                </span>
              </>
            )}
            <span className="text-steel">•</span>
            <p className="text-muted">
              {formatRelativeTime(createdAt)}
            </p>
          </div>
        </div>

        {/* Arrow */}
        {!isCurrentSession && (
          <div className="flex-shrink-0 self-center">
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
        )}
      </div>

      {/* Bottom border for visual separation */}
      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>クリックしてチャットを開始</span>
          {hasUnread && (
            <span className="text-neon-pink font-medium">
              新着メッセージ
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
