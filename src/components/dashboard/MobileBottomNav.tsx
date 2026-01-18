'use client';

import { cn } from '@/lib/utils/cn';
import { useTranslation } from '@/lib/i18n/context';

interface MobileBottomNavProps {
  onMenuClick?: () => void;
  onHomeClick?: () => void;
  onMessageClick?: () => void;
  onOrderClick?: () => void;
  onRegisterClick?: () => void;
  activeTab?: 'home' | 'menu' | 'message' | 'order';
}

export function MobileBottomNav({
  onMenuClick,
  onHomeClick,
  onMessageClick,
  onOrderClick,
  onRegisterClick,
  activeTab = 'home',
}: MobileBottomNavProps) {
  const { t } = useTranslation();

  const leftNavItems = [
    {
      id: 'home',
      label: t('dashboard.home'),
      icon: 'home',
      onClick: onHomeClick,
    },
    {
      id: 'menu',
      label: t('dashboard.menu'),
      icon: 'restaurant_menu',
      onClick: onMenuClick,
    },
  ];

  const rightNavItems = [
    {
      id: 'message',
      label: t('dashboard.messages'),
      icon: 'chat_bubble',
      onClick: onMessageClick,
    },
    {
      id: 'order',
      label: t('dashboard.myOrders'),
      icon: 'receipt_long',
      onClick: onOrderClick,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-white/10 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2 relative">
        {/* Left nav items */}
        {leftNavItems.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 py-2 px-4 rounded-lg transition-all duration-200',
              activeTab === item.id
                ? 'text-primary'
                : 'text-gray-500 hover:text-gray-300'
            )}
          >
            <span
              className={cn(
                'material-symbols-outlined text-xl',
                activeTab === item.id && 'text-neon'
              )}
            >
              {item.icon}
            </span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}

        {/* Center Register Button */}
        <button
          onClick={onRegisterClick}
          className="flex flex-col items-center justify-center -mt-6"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30 border-4 border-background-dark">
            <span className="material-symbols-outlined text-2xl text-black">
              add
            </span>
          </div>
          <span className="text-[10px] font-medium text-primary mt-1">
            {t('dashboard.registerTable')}
          </span>
        </button>

        {/* Right nav items */}
        {rightNavItems.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 py-2 px-4 rounded-lg transition-all duration-200',
              activeTab === item.id
                ? 'text-primary'
                : 'text-gray-500 hover:text-gray-300'
            )}
          >
            <span
              className={cn(
                'material-symbols-outlined text-xl',
                activeTab === item.id && 'text-neon'
              )}
            >
              {item.icon}
            </span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
