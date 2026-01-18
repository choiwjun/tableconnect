'use client';

import { cn } from '@/lib/utils/cn';
import { useTranslation } from '@/lib/i18n/context';

interface PopularTable {
  id: string;
  tableNumber: number;
  label: string;
  status: 'hot' | 'private' | 'new' | 'active';
  description: string;
  imageUrl?: string;
}

interface PopularTablesSidebarProps {
  tables: PopularTable[];
  onTableClick?: (tableId: string) => void;
  onRegisterClick?: () => void;
}

const statusBadge = {
  hot: {
    text: 'HOT',
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
  private: {
    text: '',
    icon: 'lock',
    className: 'text-gray-500',
  },
  new: {
    text: 'NEW',
    className: 'bg-primary/10 text-primary border-primary/30',
  },
  active: {
    text: 'ACTIVE',
    className: 'bg-primary/20 text-primary border-primary/40',
  },
};

export function PopularTablesSidebar({
  tables,
  onTableClick,
  onRegisterClick,
}: PopularTablesSidebarProps) {
  const { t } = useTranslation();

  return (
    <aside className="w-80 flex-none flex flex-col glass-panel rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-white font-bold tracking-tight">
            {t('dashboard.livePopular')}
          </h2>
          <span className="material-symbols-outlined text-primary animate-pulse text-lg">
            local_fire_department
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1 font-display uppercase tracking-wider">
          Live Popular Tables
        </p>
      </div>

      {/* Table List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {tables.map((table) => (
          <button
            key={table.id}
            onClick={() => onTableClick?.(table.id)}
            className="group w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-primary/40 hover:shadow-neon transition-all duration-300 cursor-pointer text-left"
          >
            {/* Thumbnail */}
            <div className="relative size-12 rounded-lg overflow-hidden shrink-0 border border-white/10 group-hover:border-primary/50 transition-colors bg-midnight">
              {table.imageUrl ? (
                <img
                  src={table.imageUrl}
                  alt={`Table ${table.tableNumber}`}
                  className="size-full object-cover"
                />
              ) : (
                <div className="size-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-neon-purple/20">
                  <span className="font-display text-primary text-sm">
                    T-{table.tableNumber.toString().padStart(2, '0')}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-0.5">
                <h3 className="font-display font-bold text-white text-sm truncate group-hover:text-primary transition-colors">
                  {table.label}
                </h3>
                {table.status === 'private' ? (
                  <span className="material-symbols-outlined text-[10px] text-gray-500">
                    lock
                  </span>
                ) : (
                  <span
                    className={cn(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded border',
                      statusBadge[table.status].className
                    )}
                  >
                    {statusBadge[table.status].text}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 truncate">{table.description}</p>
            </div>

            {/* Arrow */}
            <span className="material-symbols-outlined text-gray-600 group-hover:text-primary transition-colors text-lg">
              chevron_right
            </span>
          </button>
        ))}

        {tables.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <span className="material-symbols-outlined text-3xl mb-2 block">
              table_restaurant
            </span>
            <p className="text-sm">{t('dashboard.noActiveTables')}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5 bg-white/5 backdrop-blur-md">
        <button
          onClick={onRegisterClick}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-white/10 bg-white/5 hover:bg-primary/20 hover:border-primary hover:text-primary hover:shadow-neon transition-all duration-300 text-sm font-medium text-gray-300 group"
        >
          <span className="material-symbols-outlined text-lg group-hover:animate-bounce">
            add
          </span>
          {t('dashboard.registerTable')}
        </button>
      </div>
    </aside>
  );
}
