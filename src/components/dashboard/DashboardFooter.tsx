'use client';

import { useTranslation } from '@/lib/i18n/context';

interface DashboardFooterProps {
  serverName?: string;
  isConnected?: boolean;
  version?: string;
}

export function DashboardFooter({
  serverName = 'Tokyo-JP-01',
  isConnected = true,
  version = 'V1.0.0',
}: DashboardFooterProps) {
  const { t } = useTranslation();

  return (
    <footer className="flex-none px-6 py-2 flex justify-between items-center text-[10px] text-gray-600 font-display uppercase tracking-widest border-t border-white/5 bg-background-dark/80 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <span>Server: {serverName}</span>
        <span className={isConnected ? 'text-primary/50' : 'text-red-400/50'}>
          ● {isConnected ? t('dashboard.connected') : t('dashboard.disconnected')}
        </span>
      </div>
      <div>
        <span>System {version}</span>
      </div>
    </footer>
  );
}
