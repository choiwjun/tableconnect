'use client';

import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  icon,
  variant = 'default',
  className,
}: StatCardProps) {
  const variantStyles = {
    default: 'from-neon-cyan/20 to-neon-cyan/5 border-neon-cyan/30',
    success: 'from-green-500/20 to-green-500/5 border-green-500/30',
    warning: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30',
    danger: 'from-red-500/20 to-red-500/5 border-red-500/30',
  };

  const iconColors = {
    default: 'text-neon-cyan',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    danger: 'text-red-400',
  };

  return (
    <div
      className={cn(
        'relative p-6 rounded-2xl bg-gradient-to-br border overflow-hidden',
        variantStyles[variant],
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />

      <div className="relative">
        {/* Header with icon */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted">{title}</span>
          {icon && (
            <div className={cn('w-10 h-10 rounded-xl bg-midnight/50 flex items-center justify-center', iconColors[variant])}>
              {icon}
            </div>
          )}
        </div>

        {/* Value */}
        <div className="text-3xl font-display text-soft-white mb-2">
          {value}
        </div>

        {/* Change indicator */}
        {change !== undefined && (
          <div className="flex items-center gap-1">
            {change >= 0 ? (
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            <span className={cn('text-sm', change >= 0 ? 'text-green-400' : 'text-red-400')}>
              {Math.abs(change)}%
            </span>
            <span className="text-xs text-muted ml-1">前月比</span>
          </div>
        )}
      </div>
    </div>
  );
}
