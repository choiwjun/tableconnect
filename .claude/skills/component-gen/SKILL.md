---
name: component-gen
description: Table Connect 디자인 시스템에 맞는 React 컴포넌트를 생성합니다. "컴포넌트 만들어줘", "UI 생성", "Tokyo Night Pulse 스타일" 요청 시 활성화됩니다.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
---

# Component Generator Skill

Table Connect의 "Tokyo Night Pulse" 디자인 시스템에 맞는 컴포넌트를 생성합니다.

## Design System Overview

### Color Palette

```typescript
const colors = {
  // Background
  void: '#0a0a0f',
  midnight: '#1a1a27',
  steel: '#2a2a3d',

  // Accent
  neonPink: '#ff0080',
  neonCyan: '#00ffff',
  neonPurple: '#bf00ff',

  // Text
  white: '#ffffff',
  silver: '#c0c0c0',
  muted: '#6b7280',

  // Status
  success: '#00ff88',
  warning: '#ffaa00',
  error: '#ff4444',
};
```

### Typography

```typescript
const fonts = {
  display: 'Righteous, cursive',    // 제목, 로고
  body: 'DM Sans, sans-serif',      // 본문
  accent: 'Fredoka, sans-serif',    // 강조, 버튼
};
```

## Component Structure

### 파일 위치

```
src/components/
├── ui/                    # 기본 UI 컴포넌트
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   └── ...
├── features/              # 기능별 컴포넌트
│   ├── chat/
│   │   ├── MessageBubble.tsx
│   │   ├── ChatRoom.tsx
│   │   └── MessageInput.tsx
│   ├── gift/
│   │   ├── MenuCard.tsx
│   │   └── GiftNotification.tsx
│   └── session/
│       ├── TableCard.tsx
│       └── NicknameForm.tsx
└── layout/                # 레이아웃 컴포넌트
    ├── Header.tsx
    └── Container.tsx
```

### 컴포넌트 템플릿

```typescript
// src/components/ui/ComponentName.tsx
'use client';

import { cn } from '@/lib/utils';

interface ComponentNameProps {
  className?: string;
  children?: React.ReactNode;
}

export function ComponentName({ className, children }: ComponentNameProps) {
  return (
    <div className={cn('base-classes', className)}>
      {children}
    </div>
  );
}
```

## UI Components

### Button

```typescript
// src/components/ui/Button.tsx
'use client';

import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        // Base
        'font-accent font-semibold rounded-xl transition-all duration-300',
        'disabled:opacity-50 disabled:cursor-not-allowed',

        // Variant
        variant === 'primary' && [
          'bg-gradient-to-r from-neon-pink to-neon-purple',
          'text-white shadow-neon-pink',
          'hover:shadow-neon-pink-lg hover:scale-105',
          'active:scale-95',
        ],
        variant === 'secondary' && [
          'bg-steel/50 border border-neon-cyan/30',
          'text-neon-cyan',
          'hover:bg-steel hover:border-neon-cyan',
        ],
        variant === 'ghost' && [
          'bg-transparent text-silver',
          'hover:text-white hover:bg-white/5',
        ],

        // Size
        size === 'sm' && 'px-4 py-2 text-sm',
        size === 'md' && 'px-6 py-3 text-base',
        size === 'lg' && 'px-8 py-4 text-lg',

        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

### Card (Glass Morphism)

```typescript
// src/components/ui/Card.tsx
'use client';

import { cn } from '@/lib/utils';

interface CardProps {
  variant?: 'default' | 'glow';
  className?: string;
  children: React.ReactNode;
}

export function Card({ variant = 'default', className, children }: CardProps) {
  return (
    <div
      className={cn(
        // Glass morphism base
        'backdrop-blur-md rounded-2xl',
        'border border-white/10',

        variant === 'default' && 'bg-midnight/60',
        variant === 'glow' && [
          'bg-midnight/80',
          'shadow-[0_0_30px_rgba(255,0,128,0.15)]',
          'hover:shadow-[0_0_40px_rgba(255,0,128,0.25)]',
          'transition-shadow duration-300',
        ],

        className
      )}
    >
      {children}
    </div>
  );
}
```

### Input

```typescript
// src/components/ui/Input.tsx
'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            // Base
            'w-full px-4 py-3 rounded-xl',
            'bg-steel/50 border border-white/10',
            'text-white placeholder:text-muted',
            'font-body',

            // Focus
            'focus:outline-none focus:border-neon-cyan/50',
            'focus:shadow-[0_0_20px_rgba(0,255,255,0.15)]',
            'transition-all duration-300',

            // Error
            error && 'border-error focus:border-error',

            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

## Feature Components

### MessageBubble

```typescript
// src/components/features/chat/MessageBubble.tsx
'use client';

import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  content: string;
  nickname: string;
  timestamp: string;
  isMine: boolean;
}

export function MessageBubble({
  content,
  nickname,
  timestamp,
  isMine,
}: MessageBubbleProps) {
  return (
    <div
      className={cn(
        'flex flex-col max-w-[80%]',
        isMine ? 'items-end ml-auto' : 'items-start'
      )}
      data-testid="message-bubble"
    >
      {!isMine && (
        <span className="text-xs text-neon-cyan mb-1 font-accent">
          {nickname}
        </span>
      )}

      <div
        className={cn(
          'px-4 py-2 rounded-2xl',
          isMine
            ? 'bg-gradient-to-r from-neon-pink to-neon-purple text-white rounded-br-sm'
            : 'bg-steel/60 text-silver rounded-bl-sm'
        )}
      >
        <p className="font-body text-sm">{content}</p>
      </div>

      <span className="text-xs text-muted mt-1">
        {timestamp}
      </span>
    </div>
  );
}
```

### TableCard

```typescript
// src/components/features/session/TableCard.tsx
'use client';

import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface TableCardProps {
  tableNumber: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export function TableCard({ tableNumber, isSelected, onClick }: TableCardProps) {
  return (
    <Card
      variant={isSelected ? 'glow' : 'default'}
      className={cn(
        'p-6 cursor-pointer',
        'hover:scale-105 transition-transform duration-300',
        isSelected && 'border-neon-pink'
      )}
      onClick={onClick}
    >
      <div className="text-center">
        <span className="text-4xl font-display text-neon-cyan">
          {tableNumber}
        </span>
        <p className="text-sm text-muted mt-2 font-body">
          테이블
        </p>
      </div>
    </Card>
  );
}
```

## Utility: cn function

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Tailwind Config

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        void: '#0a0a0f',
        midnight: '#1a1a27',
        steel: '#2a2a3d',
        'neon-pink': '#ff0080',
        'neon-cyan': '#00ffff',
        'neon-purple': '#bf00ff',
        silver: '#c0c0c0',
        muted: '#6b7280',
        success: '#00ff88',
        warning: '#ffaa00',
        error: '#ff4444',
      },
      fontFamily: {
        display: ['Righteous', 'cursive'],
        body: ['DM Sans', 'sans-serif'],
        accent: ['Fredoka', 'sans-serif'],
      },
      boxShadow: {
        'neon-pink': '0 0 20px rgba(255, 0, 128, 0.3)',
        'neon-pink-lg': '0 0 30px rgba(255, 0, 128, 0.5)',
        'neon-cyan': '0 0 20px rgba(0, 255, 255, 0.3)',
      },
    },
  },
  plugins: [],
};

export default config;
```

## Checklist

컴포넌트 생성 시:
- [ ] 'use client' 필요 여부 확인
- [ ] TypeScript 타입 정의
- [ ] cn() 유틸리티 사용
- [ ] Design System 색상/폰트 사용
- [ ] data-testid 추가 (테스트용)
- [ ] 반응형 고려
- [ ] 접근성 (a11y) 고려
