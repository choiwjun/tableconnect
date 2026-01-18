'use client';

import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils/cn';
import type { InputProps } from '@/types/ui';

const Input = forwardRef<HTMLInputElement, InputProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>>(
  (
    {
      type = 'text',
      placeholder,
      value,
      defaultValue,
      disabled = false,
      error,
      maxLength,
      className,
      onChange,
      onBlur,
      onFocus,
      ...props
    },
    ref
  ) => {
    const id = useId();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value);
    };

    return (
      <div className="w-full">
        <input
          ref={ref}
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          maxLength={maxLength}
          onChange={handleChange}
          onBlur={onBlur}
          onFocus={onFocus}
          className={cn(
            'w-full px-4 py-3 rounded-lg font-body text-soft-white',
            'bg-midnight border border-steel/50',
            'placeholder:text-muted',
            'focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/30',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/30',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-400 font-body">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
