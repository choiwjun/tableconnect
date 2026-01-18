'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import { formatPrice } from '@/lib/utils/format';
import type { Menu } from '@/types/database';

interface MenuCardProps {
  menu: Menu;
  isSelected?: boolean;
  onSelect: (menu: Menu) => void;
}

export function MenuCard({ menu, isSelected = false, onSelect }: MenuCardProps) {
  return (
    <button
      onClick={() => onSelect(menu)}
      className={cn(
        'w-full text-left rounded-xl p-4 transition-all duration-200',
        'border-2',
        isSelected
          ? 'border-neon-pink bg-neon-pink/10 shadow-lg shadow-neon-pink/20'
          : 'border-transparent glass hover:bg-white/10'
      )}
    >
      <div className="flex gap-4">
        {/* Menu Image */}
        {menu.image_url ? (
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-steel/50 relative">
            <Image
              src={menu.image_url}
              alt={menu.name}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-lg flex-shrink-0 bg-gradient-to-br from-neon-pink/20 to-neon-purple/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-neon-pink/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
              />
            </svg>
          </div>
        )}

        {/* Menu Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-soft-white truncate">
              {menu.name}
            </h3>
            {isSelected && (
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-neon-pink flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </span>
            )}
          </div>

          {menu.description && (
            <p className="text-sm text-muted mt-1 line-clamp-2">
              {menu.description}
            </p>
          )}

          <p className="text-neon-cyan font-medium mt-2">
            {formatPrice(menu.price)}
          </p>
        </div>
      </div>

      {/* Category Badge */}
      {menu.category && (
        <span className="inline-block mt-3 px-2 py-0.5 text-xs rounded-full bg-steel/50 text-muted">
          {menu.category}
        </span>
      )}
    </button>
  );
}
