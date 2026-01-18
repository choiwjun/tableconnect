'use client';

import { cn } from '@/lib/utils/cn';
import type { ContainerProps } from '@/types/ui';

const maxWidthStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full',
};

export function Container({
  className,
  children,
  maxWidth = 'md',
  padding = true,
}: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full',
        maxWidthStyles[maxWidth],
        padding && 'px-4',
        className
      )}
    >
      {children}
    </div>
  );
}
