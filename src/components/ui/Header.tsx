'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import type { HeaderProps } from '@/types/ui';

export function Header({
  title,
  showBack = false,
  onBack,
  rightAction,
}: HeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <header className="sticky top-0 z-40 glass border-b border-steel/30">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left: Back Button */}
        <div className="w-10">
          {showBack && (
            <button
              onClick={handleBack}
              className="p-2 -ml-2 rounded-lg text-muted hover:text-soft-white hover:bg-white/5 transition-colors"
              aria-label="Go back"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Center: Title */}
        <h1
          className={cn(
            'font-display text-lg text-soft-white truncate',
            'flex-1 text-center'
          )}
        >
          {title}
        </h1>

        {/* Right: Action */}
        <div className="w-10 flex justify-end">{rightAction}</div>
      </div>
    </header>
  );
}
