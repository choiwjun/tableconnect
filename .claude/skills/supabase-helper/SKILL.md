---
name: supabase-helper
description: Supabase 데이터베이스 작업을 도와줍니다. 테이블 생성, 마이그레이션, RLS 정책, Realtime 구독 설정 시 사용하세요. "Supabase", "데이터베이스", "마이그레이션", "RLS", "Realtime" 요청 시 활성화됩니다.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Supabase Helper Skill

Table Connect 프로젝트의 Supabase 작업을 지원합니다.

## Database Schema (from Database Design doc)

### Core Tables

```sql
-- merchants: 가맹점 정보
-- menus: 메뉴 정보
-- sessions: 테이블 세션
-- messages: 메시지
-- gifts: 선물
-- settlements: 정산
-- reports: 신고
-- blocks: 차단
```

## 1. 마이그레이션 생성

### 마이그레이션 파일 위치
```
supabase/
└── migrations/
    ├── 20240101000000_create_merchants.sql
    ├── 20240101000001_create_menus.sql
    ├── 20240101000002_create_sessions.sql
    └── ...
```

### 마이그레이션 파일 형식

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_description.sql

-- Up Migration
CREATE TABLE IF NOT EXISTS table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- columns...
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_table_column ON table_name(column);

-- RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

## 2. Table Connect 스키마 정의

### merchants 테이블

```sql
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  address TEXT,
  phone VARCHAR(20),
  business_hours JSONB,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### sessions 테이블

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  nickname VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,

  UNIQUE(merchant_id, table_number, is_active)
    WHERE is_active = true
);

CREATE INDEX idx_sessions_merchant ON sessions(merchant_id);
CREATE INDEX idx_sessions_active ON sessions(is_active, expires_at);
```

### messages 테이블

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  receiver_session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT content_length CHECK (char_length(content) <= 500)
);

CREATE INDEX idx_messages_sender ON messages(sender_session_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_session_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
```

### gifts 테이블

```sql
CREATE TABLE gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  receiver_session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  menu_id UUID REFERENCES menus(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))
);
```

## 3. RLS 정책

### sessions RLS

```sql
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- 자신의 세션만 조회 가능
CREATE POLICY "Users can view own session"
  ON sessions FOR SELECT
  USING (id = current_setting('app.session_id')::uuid);

-- 같은 merchant의 활성 세션 조회 가능
CREATE POLICY "Users can view active sessions in same merchant"
  ON sessions FOR SELECT
  USING (
    merchant_id = (
      SELECT merchant_id FROM sessions
      WHERE id = current_setting('app.session_id')::uuid
    )
    AND is_active = true
  );
```

### messages RLS

```sql
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 자신이 보내거나 받은 메시지만 조회
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (
    sender_session_id = current_setting('app.session_id')::uuid
    OR receiver_session_id = current_setting('app.session_id')::uuid
  );

-- 메시지 전송은 자신의 세션에서만
CREATE POLICY "Users can send messages from own session"
  ON messages FOR INSERT
  WITH CHECK (
    sender_session_id = current_setting('app.session_id')::uuid
  );
```

## 4. Supabase 클라이언트 설정

### Server Client

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

### Browser Client

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

## 5. Realtime 구독

### 메시지 실시간 구독

```typescript
// src/lib/hooks/useRealtimeMessages.ts
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Message } from '@/types/database';

export function useRealtimeMessages(sessionId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const supabase = createClient();

  useEffect(() => {
    // 초기 메시지 로드
    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_session_id.eq.${sessionId},receiver_session_id.eq.${sessionId}`)
        .order('created_at', { ascending: true });

      if (data) setMessages(data);
    };

    loadMessages();

    // Realtime 구독
    const channel = supabase
      .channel(`messages:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_session_id=eq.${sessionId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return messages;
}
```

## 6. 환경 변수

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 7. 타입 생성

```bash
# Supabase CLI로 타입 자동 생성
npx supabase gen types typescript --project-id your-project-id > src/types/supabase.ts
```

## 체크리스트

마이그레이션 작성 시:
- [ ] 테이블명 snake_case
- [ ] UUID 기본 키 사용
- [ ] created_at, updated_at 포함
- [ ] 적절한 인덱스 추가
- [ ] RLS 정책 설정

클라이언트 사용 시:
- [ ] 서버: `createClient()` from server.ts
- [ ] 클라이언트: `createClient()` from client.ts
- [ ] 에러 핸들링 필수
