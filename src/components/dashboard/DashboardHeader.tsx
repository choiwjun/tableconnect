'use client';

import Link from 'next/link';
import { LanguageSelector } from '@/components/i18n/LanguageSelector';
import { cn } from '@/lib/utils/cn';
import { useTranslation } from '@/lib/i18n/context';

interface DashboardHeaderProps {
  merchantName?: string;
  nickname?: string;
  isOnline?: boolean;
  onMenuClick?: () => void;
}

export function DashboardHeader({
  merchantName = 'TableConnect',
  nickname,
  isOnline = true,
  onMenuClick,
}: DashboardHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="relative z-50 flex-none w-full glass-panel border-b border-white/5">
      <div className="flex items-center justify-between px-4 md:px-6 py-4 h-16">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 border border-primary/30 text-primary shadow-neon">
            <span className="material-symbols-outlined text-xl">radar</span>
          </div>
          <h1 className="font-display text-xl font-bold tracking-tight text-white uppercase">
            Table<span className="text-primary text-neon">Connect</span>
          </h1>
          <div className="hidden md:flex ml-4 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
            <span className="text-[10px] font-display font-medium text-primary tracking-widest uppercase">
              {merchantName}
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <div className="flex items-center gap-4 md:gap-8">
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="#"
              className="text-sm font-medium text-white hover:text-primary transition-colors hover:drop-shadow-[0_0_5px_rgba(0,255,255,0.5)] duration-300"
            >
              {t('dashboard.home')}
            </Link>
            <button
              onClick={onMenuClick}
              className="text-sm font-medium text-gray-400 hover:text-primary transition-colors duration-300 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-base">
                restaurant_menu
              </span>
              {t('dashboard.menu')}
            </button>
            <Link
              href="#"
              className="text-sm font-medium text-gray-400 hover:text-primary transition-colors duration-300"
            >
              {t('dashboard.messages')}
            </Link>
            <Link
              href="#"
              className="text-sm font-medium text-gray-400 hover:text-primary transition-colors duration-300"
            >
              {t('dashboard.myOrders')}
            </Link>
          </nav>

          {/* Language Selector */}
          <LanguageSelector />

          {/* Profile */}
          <div className="flex items-center gap-4 pl-4 border-l border-white/10">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-400 font-display">
                {t('dashboard.status')}
              </p>
              <div className="flex items-center gap-1.5 justify-end">
                <span
                  className={cn(
                    'size-1.5 rounded-full',
                    isOnline
                      ? 'bg-primary shadow-neon animate-pulse'
                      : 'bg-gray-500'
                  )}
                />
                <p className="text-xs font-bold text-white tracking-wide uppercase">
                  {isOnline ? t('dashboard.online') : t('dashboard.offline')}
                </p>
              </div>
            </div>
            {nickname && (
              <div className="size-9 rounded-full bg-gradient-to-br from-primary/30 to-neon-purple/30 flex items-center justify-center border border-white/20">
                <span className="text-sm font-bold text-white">
                  {nickname.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
