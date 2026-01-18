# Coding Convention & AI Collaboration Guide

# Table Connect - 코딩 컨벤션 & AI 협업 가이드

**버전:** v1.0

**작성일:** 2026년 1월 18일

**대상:** AI 코딩 파트너 (Cursor, Claude, v0 등)

---

## 1. 개요

본 문서는 Table Connect 프로젝트의 코드 작성 규칙과 AI 코딩 도구와의 효과적인 협업 방법을 정의합니다. 일관성 있고 유지보수 가능한 코드를 생성하기 위한 가이드라인입니다.

---

## 2. 핵심 원칙

### 2.1 "신뢰하되, 검증하라" (Trust, but Verify)

AI가 생성한 코드는:

1. **즉시 실행 가능해야 함** - 문법 오류 없이 동작
2. **명확한 주석 포함** - 복잡한 로직은 설명 필수
3. **테스트 가능해야 함** - 검증 가능한 구조
4. **보안 취약점 없음** - 입력 검증, 권한 확인 필수

### 2.2 점진적 개발 (Incremental Development)

- 한 번에 하나의 기능만 구현
- 작은 커밋 단위로 작업
- 각 단계마다 동작 확인

### 2.3 문서 우선 (Documentation First)

코드 작성 전:

1. PRD, TRD, Database Design 문서 참조
2. User Flow 확인
3. Design System 준수

---

## 3. 프로젝트 구조

### 3.1 디렉토리 구조

```
table-connect/
├── app/                        # Next.js 14 App Router
│   ├── (auth)/                 # 인증 그룹 (관리자용)
│   │   └── admin/
│   │       └── login/
│   │           └── page.tsx
│   ├── (main)/                 # 메인 앱 그룹
│   │   ├── page.tsx            # 홈 (QR 스캔)
│   │   ├── profile/
│   │   │   └── page.tsx        # 프로필 입력
│   │   ├── dashboard/
│   │   │   └── page.tsx        # 대시보드
│   │   ├── explore/
│   │   │   └── page.tsx        # 테이블 탐색
│   │   ├── chat/
│   │   │   └── [sessionId]/
│   │   │       └── page.tsx    # 대화 화면
│   │   └── gifts/
│   │       └── page.tsx        # 받은 선물
│   ├── api/                    # API Routes
│   │   ├── sessions/
│   │   │   ├── create/
│   │   │   │   └── route.ts
│   │   │   ├── active/
│   │   │   │   └── route.ts
│   │   │   └── leave/
│   │   │       └── route.ts
│   │   ├── messages/
│   │   │   ├── send/
│   │   │   │   └── route.ts
│   │   │   └── block/
│   │   │       └── route.ts
│   │   ├── gifts/
│   │   │   ├── send/
│   │   │   │   └── route.ts
│   │   │   └── received/
│   │   │       └── route.ts
│   │   └── admin/
│   │       ├── menus/
│   │       │   └── route.ts
│   │       └── settlements/
│   │           └── route.ts
│   ├── layout.tsx              # 루트 레이아웃
│   └── globals.css             # 글로벌 스타일
├── components/                 # 재사용 컴포넌트
│   ├── ui/                     # 기본 UI 컴포넌트
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── Toast.tsx
│   ├── features/               # 기능별 컴포넌트
│   │   ├── TableCard.tsx       # 테이블 카드
│   │   ├── MessageBubble.tsx   # 메시지 말풍선
│   │   ├── GiftCard.tsx        # 선물 카드
│   │   └── ChatInput.tsx       # 채팅 입력
│   └── layout/                 # 레이아웃 컴포넌트
│       ├── Header.tsx
│       ├── Navigation.tsx
│       └── Footer.tsx
├── lib/                        # 유틸리티 & 헬퍼
│   ├── supabase/
│   │   ├── client.ts           # 클라이언트 Supabase
│   │   ├── server.ts           # 서버 Supabase
│   │   └── types.ts            # Supabase 타입
│   ├── utils/
│   │   ├── cn.ts               # className 유틸
│   │   ├── format.ts           # 포맷팅
│   │   └── validators.ts       # 검증
│   ├── ai/
│   │   └── filter.ts           # AI 필터링
│   └── payments/
│       └── stripe.ts           # Stripe 연동
├── hooks/                      # 커스텀 훅
│   ├── useSession.ts
│   ├── useMessages.ts
│   ├── useRealtime.ts
│   └── useToast.ts
├── store/                      # 상태 관리 (Zustand)
│   ├── sessionStore.ts
│   ├── messagesStore.ts
│   └── uiStore.ts
├── types/                      # TypeScript 타입
│   ├── database.ts             # DB 타입
│   ├── api.ts                  # API 타입
│   └── models.ts               # 모델 타입
├── public/                     # 정적 파일
│   ├── icons/
│   ├── images/
│   └── manifest.json           # PWA manifest
├── supabase/                   # Supabase 설정
│   └── migrations/             # DB 마이그레이션
├── .env.local                  # 환경 변수
├── next.config.js              # Next.js 설정
├── tailwind.config.js          # Tailwind 설정
├── tsconfig.json               # TypeScript 설정
└── package.json

```

---

## 4. 명명 규칙 (Naming Conventions)

### 4.1 파일명

**컴포넌트:**

```
PascalCase.tsx
예: Button.tsx, TableCard.tsx, MessageBubble.tsx

```

**API Routes:**

```
route.ts (Next.js 규칙)
예: app/api/sessions/create/route.ts

```

**유틸리티/훅:**

```
camelCase.ts
예: useSession.ts, format.ts, validators.ts

```

**타입 파일:**

```
camelCase.ts
예: database.ts, api.ts

```

### 4.2 변수명

```tsx
// camelCase
const userName = 'John';
const isActive = true;
const messageCount = 10;

// 상수는 UPPER_SNAKE_CASE
const MAX_MESSAGE_LENGTH = 200;
const API_BASE_URL = '<https://api.example.com>';

// Boolean은 is/has/should 접두사
const isLoading = false;
const hasError = true;
const shouldRedirect = false;

```

### 4.3 함수명

```tsx
// 동사로 시작
function createSession() {}
function sendMessage() {}
function validateInput() {}

// Boolean 반환 함수는 is/has/can 접두사
function isValidEmail(email: string): boolean {}
function hasPermission(user: User): boolean {}
function canSendMessage(): boolean {}

// 이벤트 핸들러는 handle 접두사
function handleClick() {}
function handleSubmit() {}
function handleInputChange() {}

```

### 4.4 컴포넌트명

```tsx
// PascalCase
function Button() {}
function TableCard() {}
function MessageBubble() {}

// Props 타입은 컴포넌트명 + Props
interface ButtonProps {}
interface TableCardProps {}

```

### 4.5 타입/인터페이스명

```tsx
// PascalCase
type User = {};
interface Session {};
type MessageType = 'text' | 'emoji';

// API 응답은 접미사 Response
interface CreateSessionResponse {}
interface SendMessageResponse {}

```

---

## 5. TypeScript 규칙

### 5.1 타입 우선 (Type-First)

```tsx
// ❌ 나쁜 예: any 사용
function sendMessage(data: any) {}

// ✅ 좋은 예: 명확한 타입
interface SendMessageRequest {
  receiver_id: string;
  content: string;
  message_type: 'text' | 'emoji';
}

function sendMessage(data: SendMessageRequest) {}

```

### 5.2 명시적 타입 선언

```tsx
// ❌ 나쁜 예: 암시적 타입
const messages = [];

// ✅ 좋은 예: 명시적 타입
const messages: Message[] = [];

```

### 5.3 유니온 타입 활용

```tsx
// 상태 타입
type Status = 'pending' | 'completed' | 'failed';

// 메시지 타입
type MessageType = 'text' | 'emoji' | 'quick_reply';

```

### 5.4 옵셔널 체이닝

```tsx
// ✅ 안전한 접근
const nickname = session?.profile?.nickname ?? 'Anonymous';

// ❌ 피할 것: 중첩된 if
if (session && session.profile && session.profile.nickname) {
  // ...
}

```

### 5.5 타입 가드

```tsx
// 타입 가드 함수
function isTextMessage(msg: Message): msg is TextMessage {
  return msg.message_type === 'text';
}

// 사용
if (isTextMessage(message)) {
  // message는 TextMessage 타입으로 좁혀짐
  console.log(message.content);
}

```

---

## 6. React/Next.js 규칙

### 6.1 컴포넌트 구조

```tsx
// 1. Imports
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

// 2. Types
interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
}

// 3. Component
export function MessageBubble({ message, isSent }: MessageBubbleProps) {
  // 4. Hooks
  const [isRead, setIsRead] = useState(false);

  // 5. Effects
  useEffect(() => {
    // ...
  }, []);

  // 6. Event Handlers
  const handleClick = () => {
    // ...
  };

  // 7. Render
  return (
    <div className={/* ... */}>
      {/* ... */}
    </div>
  );
}

```

### 6.2 Server vs Client Components

```tsx
// ✅ 서버 컴포넌트 (기본)
// app/dashboard/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data } = await supabase.from('sessions').select();

  return <div>{/* ... */}</div>;
}

// ✅ 클라이언트 컴포넌트
// components/ChatInput.tsx
'use client';

import { useState } from 'react';

export function ChatInput() {
  const [message, setMessage] = useState('');
  // ...
}

```

### 6.3 API Route 구조

```tsx
// app/api/messages/send/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 1. 검증 스키마
const SendMessageSchema = z.object({
  receiver_id: z.string().uuid(),
  content: z.string().min(1).max(200),
});

// 2. API 핸들러
export async function POST(request: NextRequest) {
  try {
    // 3. 요청 파싱
    const body = await request.json();

    // 4. 검증
    const result = SendMessageSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error },
        { status: 400 }
      );
    }

    // 5. Supabase 클라이언트
    const supabase = createRouteHandlerClient({ cookies });

    // 6. 비즈니스 로직
    const { data, error } = await supabase
      .from('messages')
      .insert(result.data);

    if (error) throw error;

    // 7. 응답
    return NextResponse.json({ success: true, data });

  } catch (error) {
    // 8. 에러 처리
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

```

### 6.4 커스텀 훅

```tsx
// hooks/useSession.ts
'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    // 세션 로드 로직
    loadSession();
  }, []);

  const loadSession = async () => {
    // ...
  };

  return { session, loading };
}

```

---

## 7. Supabase 사용 규칙

### 7.1 클라이언트 생성

```tsx
// ✅ 서버 컴포넌트
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const supabase = createServerComponentClient({ cookies });

// ✅ 클라이언트 컴포넌트
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

// ✅ API Route
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const supabase = createRouteHandlerClient({ cookies });

// ✅ 서버 전용 (Service Role)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 절대 클라이언트 노출 금지
);

```

### 7.2 쿼리 패턴

```tsx
// ✅ 좋은 예: 타입 안전
const { data, error } = await supabase
  .from('sessions')
  .select('id, profile, merchant_id')
  .eq('is_active', true)
  .single();

if (error) {
  console.error('Query error:', error);
  throw error;
}

// ❌ 나쁜 예: 에러 무시
const { data } = await supabase.from('sessions').select();

```

### 7.3 Realtime 구독

```tsx
// ✅ 클라이언트 컴포넌트에서만
'use client';

import { useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function ChatMessages({ sessionId }: { sessionId: string }) {
  const supabase = createClientComponentClient();

  useEffect(() => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('New message:', payload.new);
          // 상태 업데이트
        }
      )
      .subscribe();

    // 정리
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return <div>{/* ... */}</div>;
}

```

---

## 8. 스타일링 규칙 (Tailwind CSS)

### 8.1 클래스 순서

```tsx
// 1. Layout (display, position)
// 2. Box Model (width, height, padding, margin)
// 3. Typography (font, text)
// 4. Visual (background, border)
// 5. Interactive (cursor, transition)

<div className="
  flex items-center justify-between
  w-full h-16 px-4 py-2
  text-lg font-semibold
  bg-elevated rounded-lg border border-tertiary
  cursor-pointer transition-all hover:bg-tertiary
">

```

### 8.2 조건부 스타일

```tsx
// ✅ cn 유틸리티 사용
import { cn } from '@/lib/utils/cn';

<div className={cn(
  "base-class",
  isActive && "active-class",
  hasError && "error-class"
)}>

```

### 8.3 커스텀 컴포넌트 스타일

```tsx
// components/ui/Button.tsx
import { cn } from '@/lib/utils/cn';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        // Base styles
        "rounded-button font-semibold transition-all",
        // Variant styles
        variant === 'primary' && "bg-primary-500 text-white hover:bg-primary-600",
        variant === 'secondary' && "bg-secondary-500 text-white hover:bg-secondary-600",
        variant === 'outline' && "border border-text-tertiary text-text-secondary hover:border-text-secondary",
        // Size styles
        size === 'sm' && "px-3 py-2 text-sm",
        size === 'md' && "px-4 py-3 text-base",
        size === 'lg' && "px-6 py-4 text-lg",
        // Custom className
        className
      )}
      {...props}
    />
  );
}

```

---

## 9. 에러 처리

### 9.1 Try-Catch 패턴

```tsx
// ✅ API Route
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // 로직...
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);

    // 에러 타입별 처리
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

```

### 9.2 클라이언트 에러 처리

```tsx
// ✅ 사용자 친화적 에러 메시지
import { toast } from '@/hooks/useToast';

async function sendMessage(content: string) {
  try {
    const response = await fetch('/api/messages/send', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    toast.success('메시지가 전송되었습니다');
  } catch (error) {
    console.error('Send message error:', error);
    toast.error('메시지 전송에 실패했습니다');
  }
}

```

---

## 10. 보안 규칙

### 10.1 환경 변수

```tsx
// ✅ 클라이언트에서 접근 가능 (NEXT_PUBLIC_ 접두사)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ✅ 서버 전용 (접두사 없음)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

// ❌ 절대 금지: 클라이언트에서 서버 전용 키 사용
// const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // 위험!

```

### 10.2 입력 검증

```tsx
// ✅ Zod로 검증
import { z } from 'zod';

const MessageSchema = z.object({
  content: z.string()
    .min(1, '메시지를 입력해주세요')
    .max(200, '메시지는 200자 이하로 입력해주세요'),
  receiver_id: z.string().uuid('올바른 ID가 아닙니다'),
});

// 사용
const result = MessageSchema.safeParse(input);
if (!result.success) {
  // 에러 처리
}

```

### 10.3 XSS 방지

```tsx
// ✅ React는 기본적으로 XSS 방지
<div>{userInput}</div> // 자동 이스케이핑

// ⚠️ dangerouslySetInnerHTML은 피하기
// 필요 시 DOMPurify 사용
import DOMPurify from 'dompurify';

<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(html)
}} />

```

### 10.4 CSRF 방지

```tsx
// Next.js API Routes는 기본적으로 CSRF 보호
// SameSite 쿠키 설정
cookies().set('session_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
});

```

---

## 11. 성능 최적화

### 11.1 이미지 최적화

```tsx
// ✅ next/image 사용
import Image from 'next/image';

<Image
  src="/images/logo.png"
  alt="Table Connect"
  width={200}
  height={50}
  priority // LCP 이미지는 priority
/>

```

### 11.2 코드 스플리팅

```tsx
// ✅ 동적 import
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>로딩 중...</p>,
  ssr: false, // 클라이언트에서만 로드
});

```

### 11.3 메모이제이션

```tsx
// ✅ useMemo
import { useMemo } from 'react';

const filteredMessages = useMemo(() => {
  return messages.filter(msg => msg.receiver_id === sessionId);
}, [messages, sessionId]);

// ✅ useCallback
import { useCallback } from 'react';

const handleSend = useCallback((content: string) => {
  sendMessage(content);
}, [sendMessage]);

```

---

## 12. 테스트

### 12.1 단위 테스트 (Jest)

```tsx
// lib/utils/format.test.ts
import { formatCurrency } from './format';

describe('formatCurrency', () => {
  it('should format number to JPY currency', () => {
    expect(formatCurrency(1000)).toBe('¥1,000');
  });

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('¥0');
  });
});

```

### 12.2 컴포넌트 테스트 (React Testing Library)

```tsx
// components/ui/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

```

---

## 13. AI 협업 프롬프트 패턴

### 13.1 컴포넌트 생성 프롬프트

```
다음 요구사항에 맞는 React 컴포넌트를 생성해주세요:

컴포넌트명: TableCard
목적: 테이블 리스트 아이템 표시
Props:
- sessionId: string
- profile: { gender, age_range, party_size, nickname, icon }
- onClick: () => void

디자인:
- Design System의 card 스타일 사용
- 좌측에 아이콘, 우측에 정보 표시
- hover 시 살짝 올라가는 애니메이션

참조 문서:
- Design System의 7.3 Cards
- Tailwind 설정

```

### 13.2 API Route 생성 프롬프트

```
다음 API Route를 생성해주세요:

엔드포인트: POST /api/messages/send
목적: 메시지 전송
요청 body:
- receiver_id: string (UUID)
- content: string (1-200자)
- message_type: 'text' | 'emoji'

처리 흐름:
1. Zod로 입력 검증
2. AI 필터링 (lib/ai/filter.ts)
3. Supabase에 저장
4. 성공 응답

에러 처리:
- 400: 검증 실패
- 403: AI 필터 차단
- 500: 서버 오류

참조:
- TRD의 API 설계
- Database Design의 messages 테이블

```

### 13.3 디버깅 프롬프트

```
다음 코드에서 에러가 발생합니다:

[코드 붙여넣기]

에러 메시지:
[에러 메시지]

예상 원인:
- Supabase 쿼리 문제?
- 타입 불일치?

수정해주세요.

```

---

## 14. Git 규칙

### 14.1 커밋 메시지 규칙

```
<type>: <subject>

<body>

<footer>

```

**타입:**

- `feat`: 새 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 포맷팅
- `refactor`: 리팩토링
- `test`: 테스트 추가
- `chore`: 빌드/설정 변경

**예시:**

```
feat: add message sending feature

- Implement POST /api/messages/send
- Add AI filtering with OpenAI
- Add Realtime subscription

Closes #123

```

### 14.2 브랜치 전략

```
main                 # 프로덕션
├── develop          # 개발
    ├── feature/qr-scan
    ├── feature/messaging
    └── fix/session-bug

```

---

## 15. 코드 리뷰 체크리스트

### 15.1 필수 확인 사항

- [ ]  TypeScript 타입 오류 없음
- [ ]  ESLint 경고 없음
- [ ]  테스트 통과
- [ ]  에러 처리 완료
- [ ]  보안 이슈 없음 (환경 변수, XSS, SQL Injection)
- [ ]  성능 이슈 없음 (무한 루프, 메모리 누수)
- [ ]  접근성 고려 (키보드 네비게이션, ARIA)
- [ ]  반응형 디자인 확인
- [ ]  다국어 지원 (하드코딩된 문자열 없음)
- [ ]  주석 및 문서화 완료

---

## 16. 빌드 & 배포

### 16.1 로컬 개발

```bash
# 개발 서버 시작
npm run dev

# 타입 체크
npm run type-check

# 린트
npm run lint

# 테스트
npm run test

```

### 16.2 프로덕션 빌드

```bash
# 빌드
npm run build

# 빌드 미리보기
npm run start

```

### 16.3 배포 (Vercel)

```bash
# Vercel CLI로 배포
vercel

# 프로덕션 배포
vercel --prod

```

---

## 17. 문제 해결 가이드

### 17.1 자주 발생하는 문제

**Supabase 연결 실패:**

```tsx
// 환경 변수 확인
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// 클라이언트 재생성
const supabase = createClientComponentClient();

```

**Realtime 구독 안됨:**

```tsx
// 1. 테이블에 Realtime 활성화 확인
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

// 2. 올바른 필터 사용
filter: `receiver_session_id=eq.${sessionId}` // ✅
filter: `receiver_session_id=${sessionId}`    // ❌

```

**TypeScript 타입 오류:**

```bash
# Supabase 타입 재생성
npx supabase gen types typescript --project-id <id> > types/supabase.ts

```

---

## 18. 참고 자료

### 18.1 공식 문서

- Next.js 14: [https://nextjs.org/docs](https://nextjs.org/docs)
- Supabase: [https://supabase.com/docs](https://supabase.com/docs)
- Tailwind CSS: [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
- TypeScript: [https://www.typescriptlang.org/docs](https://www.typescriptlang.org/docs)

### 18.2 프로젝트 문서

- PRD: 제품 요구사항
- TRD: 기술 요구사항
- Database Design: DB 스키마
- Design System: 디자인 가이드
- User Flow: 사용자 흐름

---

**문서 작성자:** wj

**문서 버전:** v1.0

**최종 수정일:** 2026-01-18

---

**중요 알림:**
이 문서는 AI 코딩 파트너가 일관된 코드를 생성하도록 돕는 가이드입니다.
모든 코드는 이 규칙을 따라야 하며, 예외 사항은 명확한 주석으로 설명되어야 합니다.