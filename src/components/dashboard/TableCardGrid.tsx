'use client';

import { cn } from '@/lib/utils/cn';
import { useTranslation } from '@/lib/i18n/context';

interface TableMember {
  id: string;
  nickname: string;
  avatarUrl?: string;
}

interface ActiveTable {
  id: string;
  tableNumber: number;
  title: string;
  description: string;
  members: TableMember[];
  status: 'active' | 'music' | 'private' | 'busy' | 'new';
  imageUrl?: string;
  isPrivate?: boolean;
}

interface TableCardGridProps {
  tables: ActiveTable[];
  locationName?: string;
  onViewProfile?: (tableId: string) => void;
  onSendGift?: (tableId: string) => void;
}

const statusConfig = {
  active: {
    text: 'Active',
    className: 'bg-primary/20 border-primary/40 text-primary',
    dot: true,
  },
  music: {
    text: 'Music',
    className: 'bg-purple-500/20 border-purple-500/40 text-purple-400',
    dot: false,
  },
  private: {
    text: 'Private',
    className: 'bg-gray-500/20 border-gray-500/40 text-gray-400',
    dot: false,
  },
  busy: {
    text: 'Busy',
    className: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400',
    dot: false,
  },
  new: {
    text: 'New',
    className: 'bg-green-500/20 border-green-500/40 text-green-400',
    dot: true,
  },
};

export function TableCardGrid({
  tables,
  locationName,
  onViewProfile,
  onSendGift,
}: TableCardGridProps) {
  const { t } = useTranslation();

  return (
    <section className="flex-1 flex flex-col glass-panel rounded-xl overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="p-6 pb-2 flex-none z-10">
        <div className="flex items-end justify-between mb-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-1">
              {t('dashboard.activeTables')}
            </h2>
            <div className="flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-primary shadow-neon" />
              <p className="text-sm text-primary font-display tracking-widest uppercase">
                {locationName || t('dashboard.liveFeed')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="size-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:border-primary hover:text-primary transition-all">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
            <button className="size-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:border-primary hover:text-primary transition-all">
              <span className="material-symbols-outlined">grid_view</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Grid */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onViewProfile={() => onViewProfile?.(table.id)}
              onSendGift={() => onSendGift?.(table.id)}
              t={t}
            />
          ))}
        </div>

        {tables.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <span className="material-symbols-outlined text-5xl mb-4">
              celebration
            </span>
            <p className="text-lg mb-2">{t('dashboard.noActiveTables')}</p>
            <p className="text-sm">{t('dashboard.startFirst')}</p>
          </div>
        )}

        {/* Spacer for bottom scrolling */}
        <div className="h-10" />
      </div>
    </section>
  );
}

interface TableCardProps {
  table: ActiveTable;
  onViewProfile?: () => void;
  onSendGift?: () => void;
  t: (key: string) => string;
}

function TableCard({ table, onViewProfile, onSendGift, t }: TableCardProps) {
  const status = statusConfig[table.status];

  if (table.isPrivate) {
    return (
      <article className="group relative flex flex-col bg-card-bg/40 border border-white/5 rounded-xl overflow-hidden opacity-75 hover:opacity-100 transition-all duration-300">
        <div className="relative h-48 overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-500">
          <div className="absolute inset-0 bg-black/60 z-10 backdrop-blur-[2px]" />
          {table.imageUrl ? (
            <img
              src={table.imageUrl}
              alt={`Table ${table.tableNumber}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-midnight to-void" />
          )}
          <div className="absolute inset-0 flex items-center justify-center z-20 flex-col gap-2">
            <span className="material-symbols-outlined text-4xl text-gray-400">
              lock
            </span>
            <span className="text-sm font-display text-gray-400 font-bold uppercase tracking-widest">
              {t('dashboard.privateTable')}
            </span>
          </div>
        </div>
        <div className="p-4 flex flex-col flex-1 border-t border-white/5">
          <h3 className="text-lg font-bold text-gray-400 mb-1">{t('dashboard.privateTable')}</h3>
          <p className="text-sm text-gray-600 mb-4">VIP</p>
          <div className="mt-auto">
            <button className="w-full py-2 px-3 rounded-lg bg-white/5 border border-white/5 text-xs font-medium text-gray-500 cursor-not-allowed">
              {t('dashboard.accessDenied')}
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group relative flex flex-col bg-card-bg/80 border border-white/5 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-primary hover:shadow-neon-strong">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-card-bg to-transparent z-10" />
        {table.imageUrl ? (
          <img
            src={table.imageUrl}
            alt={`Table ${table.tableNumber}`}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-midnight to-neon-purple/20 group-hover:scale-110 transition-transform duration-700" />
        )}

        {/* Table Number Badge */}
        <div className="absolute top-3 left-3 z-20 flex gap-2">
          <span className="px-2 py-1 rounded bg-black/60 border border-white/10 backdrop-blur-sm text-xs text-white font-display">
            T-{table.tableNumber.toString().padStart(2, '0')}
          </span>
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 right-3 z-20">
          <span
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-sm text-[10px] font-bold uppercase tracking-wide border',
              status.className
            )}
          >
            {status.dot && (
              <span className="block size-1.5 rounded-full bg-primary animate-pulse" />
            )}
            {status.text}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pt-0 flex flex-col flex-1 z-20 -mt-6">
        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary transition-colors">
          {table.title}
        </h3>
        <p className="text-sm text-gray-400 mb-4 line-clamp-2">
          {table.description}
        </p>

        {/* Members */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex -space-x-2">
            {table.members.slice(0, 5).map((member) => (
              <div
                key={member.id}
                className="inline-block size-6 rounded-full ring-2 ring-card-bg bg-gradient-to-br from-primary/30 to-neon-purple/30 flex items-center justify-center overflow-hidden"
              >
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt={member.nickname}
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] text-white font-bold">
                    {member.nickname.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            ))}
          </div>
          {table.members.length > 5 && (
            <span className="text-xs text-gray-500">
              {t('dashboard.others').replace('{count}', String(table.members.length - 5))}
            </span>
          )}
          {table.members.length <= 5 && table.members.length > 0 && (
            <span className="text-xs text-gray-500">
              {t('dashboard.participating').replace('{count}', String(table.members.length))}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto grid grid-cols-2 gap-2">
          <button
            onClick={onViewProfile}
            className="py-2 px-3 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white hover:bg-white/10 transition-colors"
          >
            {t('dashboard.viewProfile')}
          </button>
          <button
            onClick={onSendGift}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-primary/10 border border-primary/30 text-xs font-bold text-primary hover:bg-primary hover:text-black transition-all shadow-[0_0_10px_rgba(0,255,255,0.1)] hover:shadow-[0_0_15px_rgba(0,255,255,0.4)]"
          >
            <span className="material-symbols-outlined text-sm">redeem</span>
            {t('dashboard.sendGift')}
          </button>
        </div>
      </div>
    </article>
  );
}
