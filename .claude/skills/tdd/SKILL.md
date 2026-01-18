---
name: tdd
description: TDD(Test-Driven Development) 사이클을 따라 코드를 작성합니다. 테스트 작성, 기능 구현, 리팩토링 시 사용하세요. "테스트 작성해줘", "TDD로 개발해줘", "Red-Green-Refactor" 요청 시 활성화됩니다.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# TDD (Test-Driven Development) Skill

이 프로젝트는 Kent Beck의 TDD와 Tidy First 원칙을 따릅니다.

## TDD Cycle: Red → Green → Refactor

```
┌─────────────────────────────────────────────────────────┐
│  1. RED: 실패하는 테스트 작성                              │
│     ↓                                                    │
│  2. GREEN: 테스트 통과를 위한 최소한의 코드 작성             │
│     ↓                                                    │
│  3. REFACTOR: 테스트 통과 상태에서 구조 개선                │
│     ↓                                                    │
│  (반복)                                                  │
└─────────────────────────────────────────────────────────┘
```

## 실행 단계

### Step 1: 테스트 파일 확인/생성

테스트 파일 위치 규칙:
- 컴포넌트: `src/components/__tests__/ComponentName.test.tsx`
- 유틸리티: `src/lib/utils/__tests__/utilName.test.ts`
- API: `src/app/api/__tests__/routeName.test.ts`
- 훅: `src/lib/hooks/__tests__/hookName.test.ts`

### Step 2: 실패하는 테스트 작성 (RED)

```typescript
// 테스트 명명 규칙: should + 동사 + 목적어 + 조건
describe('FunctionName', () => {
  it('should return true when input is valid', () => {
    // Arrange
    const input = 'valid';

    // Act
    const result = functionName(input);

    // Assert
    expect(result).toBe(true);
  });
});
```

### Step 3: 테스트 실행하여 실패 확인

```bash
npm test -- --run ComponentName
```

### Step 4: 최소한의 코드 작성 (GREEN)

- 테스트 통과에 필요한 **최소한**의 코드만 작성
- 하드코딩도 괜찮음 (나중에 리팩토링)
- 추가 기능 NO, 미래 대비 NO

### Step 5: 테스트 통과 확인

```bash
npm test -- --run ComponentName
```

### Step 6: 리팩토링 (REFACTOR)

테스트가 통과한 상태에서만:
- 중복 제거
- 이름 개선
- 구조 정리

**중요**: 리팩토링 후 반드시 테스트 재실행

## Tidy First 규칙

### STRUCTURAL 변경 (행위 변경 없음)
- Rename, Extract Method, Move Code
- 커밋 메시지: `[STRUCTURAL] scope: description`

### BEHAVIORAL 변경 (기능 추가/수정)
- 새 기능, 버그 수정
- 커밋 메시지: `[BEHAVIORAL] scope: description`

**⚠️ 절대 같은 커밋에 섞지 않기**

## Table Connect 테스트 패턴

### 컴포넌트 테스트

```typescript
import { render, screen } from '@testing-library/react';
import { MessageBubble } from '../MessageBubble';

describe('MessageBubble', () => {
  it('should display message content', () => {
    render(<MessageBubble content="Hello" isMine={false} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should apply sent style when isMine is true', () => {
    render(<MessageBubble content="Hello" isMine={true} />);
    expect(screen.getByTestId('message-bubble')).toHaveClass('bg-neon-pink');
  });
});
```

### API 테스트

```typescript
import { POST } from '../route';
import { NextRequest } from 'next/server';

describe('POST /api/sessions', () => {
  it('should create session when valid data provided', async () => {
    const request = new NextRequest('http://localhost/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ merchant_id: '123', table_number: 5 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.session_id).toBeDefined();
  });
});
```

### 유틸리티 테스트

```typescript
import { isSessionValid } from '../sessionUtils';

describe('isSessionValid', () => {
  it('should return false when session is expired', () => {
    const expiredSession = {
      expires_at: new Date(Date.now() - 1000).toISOString(),
      is_active: true,
    };

    expect(isSessionValid(expiredSession)).toBe(false);
  });
});
```

## 체크리스트

테스트 작성 전:
- [ ] tasks.md에서 현재 Task 확인
- [ ] 테스트 파일 위치 결정

테스트 작성 중:
- [ ] 한 번에 하나의 테스트만
- [ ] 명확한 테스트 이름
- [ ] Arrange-Act-Assert 패턴

커밋 전:
- [ ] 모든 테스트 통과
- [ ] 구조적/행위적 변경 분리
