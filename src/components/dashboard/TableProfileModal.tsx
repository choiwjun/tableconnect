'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { useTranslation } from '@/lib/i18n/context';

interface TableMember {
  id: string;
  nickname: string;
  avatarUrl?: string;
}

export interface TableProfile {
  id: string;
  tableNumber: number;
  title: string;
  description: string;
  members: TableMember[];
  status: 'active' | 'music' | 'private' | 'busy' | 'new';
  imageUrl?: string;
  isPrivate?: boolean;
}

interface TableProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: TableProfile | null;
  onSendGift?: (tableId: string) => void;
  onStartChat?: (tableId: string) => void;
}

const statusConfig = {
  active: {
    text: 'Active',
    className: 'bg-primary/20 border-primary/40 text-primary',
    dot: true,
    icon: 'celebration',
  },
  music: {
    text: 'Music',
    className: 'bg-purple-500/20 border-purple-500/40 text-purple-400',
    dot: false,
    icon: 'music_note',
  },
  private: {
    text: 'Private',
    className: 'bg-gray-500/20 border-gray-500/40 text-gray-400',
    dot: false,
    icon: 'lock',
  },
  busy: {
    text: 'Busy',
    className: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400',
    dot: false,
    icon: 'do_not_disturb',
  },
  new: {
    text: 'New',
    className: 'bg-green-500/20 border-green-500/40 text-green-400',
    dot: true,
    icon: 'fiber_new',
  },
};

export function TableProfileModal({
  isOpen,
  onClose,
  table,
  onSendGift,
  onStartChat,
}: TableProfileModalProps) {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen || !table) return null;

  const status = statusConfig[table.status];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg glass-panel rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
      >
        {/* Header Image/Gradient */}
        <div className="relative h-48 overflow-hidden">
          {/* Background */}
          {table.imageUrl ? (
            <img
              src={table.imageUrl}
              alt={`Table ${table.tableNumber}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-midnight to-neon-purple/30" />
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-card-bg via-transparent to-transparent" />

          {/* Animated Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-neon-purple/10 animate-pulse" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 size-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          {/* Table Number Badge */}
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 backdrop-blur-sm text-sm text-white font-display font-bold">
              T-{table.tableNumber.toString().padStart(2, '0')}
            </span>
          </div>

          {/* Status Badge */}
          <div className="absolute bottom-4 left-4">
            <span
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm text-xs font-bold uppercase tracking-wider border',
                status.className
              )}
            >
              {status.dot && (
                <span className="block size-2 rounded-full bg-primary animate-pulse" />
              )}
              <span className="material-symbols-outlined text-sm">{status.icon}</span>
              {t(`profile.status.${table.status}`)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Title & Description */}
          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold text-white mb-2">
              {table.title}
            </h2>
            <p className="text-gray-400 leading-relaxed">
              {table.description}
            </p>
          </div>

          {/* Members Section */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">group</span>
              {t('profile.members')}
              <span className="text-primary">({table.members.length})</span>
            </h3>

            {table.members.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {table.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="size-8 rounded-full bg-gradient-to-br from-primary/30 to-neon-purple/30 flex items-center justify-center overflow-hidden">
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={member.nickname}
                          className="size-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-white font-bold">
                          {member.nickname.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-white font-medium">
                      {member.nickname}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10 text-gray-500">
                <span className="material-symbols-outlined">person_off</span>
                <span className="text-sm">{t('profile.noMembers')}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          {!table.isPrivate && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  onStartChat?.(table.id);
                  onClose();
                }}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all"
              >
                <span className="material-symbols-outlined">chat</span>
                {t('profile.startChat')}
              </button>
              <button
                onClick={() => {
                  onSendGift?.(table.id);
                  onClose();
                }}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary/10 border border-primary/30 text-primary font-bold hover:bg-primary hover:text-black transition-all shadow-[0_0_15px_rgba(0,255,255,0.2)] hover:shadow-[0_0_20px_rgba(0,255,255,0.5)]"
              >
                <span className="material-symbols-outlined">redeem</span>
                {t('dashboard.sendGift')}
              </button>
            </div>
          )}

          {table.isPrivate && (
            <div className="flex items-center justify-center gap-3 py-4 px-4 rounded-xl bg-gray-500/10 border border-gray-500/20 text-gray-400">
              <span className="material-symbols-outlined">lock</span>
              <span className="text-sm font-medium">{t('profile.privateNotice')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
