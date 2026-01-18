'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';
import type { CardProps } from '@/types/ui';

const Card = forwardRef<HTMLDivElement, CardProps & React.HTMLAttributes<HTMLDivElement>>(
  ({ variant = 'default', className, children, onClick, ...props }, ref) => {
    const isClickable = !!onClick;

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl p-4 transition-all duration-200',
          variant === 'default' && 'glass',
          variant === 'glow' && 'glass-hover',
          isClickable && 'cursor-pointer hover:scale-[1.02]',
          className
        )}
        onClick={onClick}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={
          isClickable
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick?.();
                }
              }
            : undefined
        }
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export { Card };
