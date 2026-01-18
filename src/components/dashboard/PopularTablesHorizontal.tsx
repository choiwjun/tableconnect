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

interface PopularTablesHorizontalProps {
  tables: PopularTable[];
  onTableClick?: (tableId: string) => void;
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

export function PopularTablesHorizontal({
  tables,
  onTableClick,
}: PopularTablesHorizontalProps) {
  const { t } = useTranslation();

  if (tables.length === 0) return null;

  return (
    <section className="lg:hidden flex-none glass-panel rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary animate-pulse text-lg">
            local_fire_department
          </span>
          <h2 className="font-display text-white font-bold text-sm">
            {t('dashboard.livePopular')}
          </h2>
        </div>
        <span className="text-[10px] text-gray-500 font-display uppercase tracking-wider">
          Live Popular
        </span>
      </div>

      {/* Horizontal Scroll List */}
      <div className="flex gap-3 p-3 overflow-x-auto scrollbar-hide">
        {tables.map((table) => (
          <button
            key={table.id}
            onClick={() => onTableClick?.(table.id)}
            className="group flex-none w-36 p-3 rounded-lg bg-white/5 border border-white/5 hover:border-primary/40 hover:shadow-neon transition-all duration-300 text-left"
          >
            {/* Thumbnail */}
            <div className="relative w-full h-16 rounded-lg overflow-hidden mb-2 border border-white/10 group-hover:border-primary/50 transition-colors bg-midnight">
              {table.imageUrl ? (
                <img
                  src={table.imageUrl}
                  alt={`Table ${table.tableNumber}`}
                  className="size-full object-cover"
                />
              ) : (
                <div className="size-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-neon-purple/20">
                  <span className="font-display text-primary text-lg font-bold">
                    T-{table.tableNumber.toString().padStart(2, '0')}
                  </span>
                </div>
              )}
              {/* Status Badge */}
              <div className="absolute top-1 right-1">
                {table.status === 'private' ? (
                  <span className="material-symbols-outlined text-xs text-gray-400 bg-black/50 rounded p-0.5">
                    lock
                  </span>
                ) : (
                  <span
                    className={cn(
                      'text-[8px] font-bold px-1.5 py-0.5 rounded border backdrop-blur-sm',
                      statusBadge[table.status].className
                    )}
                  >
                    {statusBadge[table.status].text}
                  </span>
                )}
              </div>
            </div>

            {/* Info */}
            <h3 className="font-display font-bold text-white text-xs truncate group-hover:text-primary transition-colors">
              {table.label}
            </h3>
            <p className="text-[10px] text-gray-400 truncate mt-0.5">
              {table.description}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
