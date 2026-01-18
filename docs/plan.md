# Table Connect - Development Plan (Constitution)

> 이 문서는 프로젝트의 **최상위 실행 규칙(Constitution)**입니다.
> `docs/` 폴더의 내용과 충돌 시, 이 문서의 규칙이 우선합니다.

---

## 1. Document Hierarchy (문서 계층)

```
plan.md (Constitution) - 최상위 실행 규칙
    ↓
docs/*.md (Source of Truth) - 제품 명세
    ↓
tasks.md (Execution Queue) - 실행 큐
```

### 문서 역할

| 문서 | 역할 | 우선순위 |
|------|------|----------|
| `plan.md` | 개발 방법론, TDD 사이클, 커밋 규율 | 1 (최고) |
| `docs/*.md` | 도메인 지식, 기능 요구사항, 비즈니스 의도 | 2 |
| `tasks.md` | 테스트 가능한 최소 단위 작업 큐 | 3 |

---

## 2. Core Development Principles (핵심 개발 원칙)

### 2.1 TDD Cycle: Red → Green → Refactor

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

### 2.2 TDD Rules

1. **한 번에 하나의 테스트만 작성**
2. **테스트 이름은 행위를 명확히 표현**
   - 예: `shouldReturnSessionWhenValidQRCodeScanned`
   - 예: `shouldRejectMessageWhenContentIsInappropriate`
3. **테스트 실패 메시지는 명확하고 이해하기 쉽게**
4. **테스트 통과에 필요한 최소한의 코드만 작성**
5. **모든 테스트 통과 후에만 리팩토링 고려**

### 2.3 Bug Fix Protocol

1. 먼저 **API 레벨에서 실패하는 테스트** 작성
2. 문제를 재현하는 **가장 작은 테스트** 추가
3. 두 테스트 모두 통과시키기

---

## 3. Tidy First Approach (구조 우선 접근법)

모든 변경사항은 반드시 두 가지 유형 중 하나로 분류:

### 3.1 STRUCTURAL Changes (구조적 변경)

> 행위 변경 없이 구조만 변경

**예시:**
- 이름 변경 (Rename)
- 메서드 추출 (Extract Method)
- 코드 이동 (Move Code)
- 파일 분리/병합
- Import 정리

**규칙:**
- 구조적 변경 전후로 테스트 실행하여 행위 불변 확인
- 커밋 메시지에 `[STRUCTURAL]` 접두사 사용

### 3.2 BEHAVIORAL Changes (행위적 변경)

> 실제 기능 추가 또는 수정

**예시:**
- 새 기능 추가
- 기존 로직 변경
- 버그 수정

**규칙:**
- 반드시 테스트와 함께 커밋
- 커밋 메시지에 `[BEHAVIORAL]` 접두사 사용

### 3.3 Core Rule

```
⚠️ 절대로 구조적 변경과 행위적 변경을 같은 커밋에 섞지 않는다
⚠️ 둘 다 필요하면 구조적 변경을 먼저 수행
```

---

## 4. Commit Discipline (커밋 규율)

### 4.1 커밋 조건

다음 조건을 **모두** 만족할 때만 커밋:

- [ ] 모든 테스트 통과
- [ ] 컴파일러/린터 경고 없음
- [ ] 하나의 논리적 작업 단위만 포함
- [ ] 구조적/행위적 변경 구분 명시
- [ ] 작고 빈번한 커밋 선호

### 4.2 커밋 메시지 형식

```
[TYPE] <scope>: <description>

<optional body>

<optional footer>
```

**TYPE:**
- `[STRUCTURAL]` - 구조적 변경
- `[BEHAVIORAL]` - 행위적 변경
- `[TEST]` - 테스트만 추가/수정
- `[DOCS]` - 문서 변경
- `[FIX]` - 버그 수정

**Scope (Table Connect 기준):**
- `session` - 세션/테이블 연결
- `message` - 메시징 기능
- `gift` - 선물 기능
- `payment` - 결제 (Stripe)
- `moderation` - AI 컨텐츠 필터링
- `admin` - 관리자 기능
- `ui` - UI 컴포넌트

**예시:**
```
[BEHAVIORAL] session: 테이블 세션 생성 API 구현

- QR 코드 스캔 시 세션 생성
- 2시간 TTL 설정
- Supabase에 세션 저장

Closes #12
```

```
[STRUCTURAL] message: MessageBubble 컴포넌트 추출

- ChatRoom에서 MessageBubble 분리
- 테스트 통과 확인
```

---

## 5. Code Quality Standards (코드 품질 기준)

### 5.1 기본 원칙

- **중복 제거** - 무자비하게 제거
- **명확한 의도 표현** - 이름과 구조로 의도 전달
- **명시적 의존성** - 숨겨진 의존성 없음
- **작은 메서드** - 단일 책임
- **상태/부작용 최소화**
- **가장 단순한 해결책 선택**

### 5.2 Table Connect 프로젝트 특화 규칙

```typescript
// ✅ Good: 타입 명시, 단일 책임
interface SessionResponse {
  session_id: string;
  table_number: number;
  expires_at: string;
}

async function createSession(
  merchantId: string,
  tableNumber: number
): Promise<SessionResponse> {
  // 단일 책임: 세션 생성만
}

// ❌ Bad: any 타입, 여러 책임
async function handleTable(data: any) {
  // 세션 생성 + 메시지 전송 + 알림... 혼합
}
```

### 5.3 네이밍 컨벤션 (from Coding Convention)

| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 | PascalCase | `MessageBubble.tsx` |
| 함수/변수 | camelCase | `sendMessage`, `sessionId` |
| 상수 | SCREAMING_SNAKE_CASE | `MAX_MESSAGE_LENGTH` |
| 타입/인터페이스 | PascalCase | `Session`, `Message` |
| 파일 (컴포넌트) | PascalCase | `GiftCard.tsx` |
| 파일 (유틸) | camelCase | `formatDate.ts` |

---

## 6. Refactoring Guidelines (리팩토링 가이드라인)

### 6.1 규칙

1. **Green 상태에서만** 리팩토링 (테스트 통과 시)
2. **검증된 리팩토링 패턴** 사용 (정식 명칭으로)
3. **한 번에 하나의 리팩토링**만 수행
4. 각 리팩토링 후 **테스트 실행**
5. **중복 제거**와 **가독성 개선** 우선

### 6.2 자주 사용할 리팩토링 패턴

- **Extract Method** - 긴 메서드에서 의미 있는 부분 추출
- **Extract Component** - React 컴포넌트 분리
- **Rename** - 의도를 명확히 하는 이름 변경
- **Move to Module** - 관련 코드를 적절한 모듈로 이동
- **Replace Magic Number with Constant** - 매직 넘버를 상수로
- **Introduce Parameter Object** - 여러 파라미터를 객체로 묶기

---

## 7. Task Workflow (작업 흐름)

### 7.1 새 기능 개발 흐름

```
1. tasks.md에서 다음 Task 확인
   ↓
2. 기능의 아주 작은 부분에 대한 실패하는 테스트 작성
   ↓
3. 테스트 통과를 위한 최소한의 코드 작성
   ↓
4. 테스트 실행 → Green 확인
   ↓
5. 필요시 구조적 변경 (Tidy First)
   (각 변경 후 테스트 실행)
   ↓
6. 구조적 변경 별도 커밋
   ↓
7. 행위적 변경 커밋
   ↓
8. 다음 테스트 추가
   ↓
9. 기능 완료까지 반복
```

### 7.2 Task 완료 규칙

Task 완료 시 에이전트는 즉시:

1. `tasks.md`에서 해당 Task 상태를 `DONE`으로 업데이트
2. 변경 사항 명확히 기록
3. **작업 즉시 중단**

> ⚠️ 에이전트는 자동으로 다음 Task로 진행하지 않음
> 사용자의 `"go"` 입력을 기다림

---

## 8. Tech Stack Rules (기술 스택 규칙)

### 8.1 Framework & Libraries

| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 14.x | App Router 사용 |
| TypeScript | 5.x | 엄격 모드 |
| Tailwind CSS | 3.x | 유틸리티 우선 |
| Supabase | Latest | DB, Auth, Realtime |
| Stripe | Latest | 결제 |
| Vitest | Latest | 테스트 |

### 8.2 Server vs Client Components

```typescript
// 서버 컴포넌트 (기본)
// - 데이터 페칭
// - 민감한 로직
// - 'use client' 없음

// 클라이언트 컴포넌트
// - useState, useEffect 사용 시
// - 브라우저 API 사용 시
// - 이벤트 핸들러 필요 시
'use client';
```

### 8.3 Supabase 사용 규칙

```typescript
// 서버에서
import { createClient } from '@/lib/supabase/server';

// 클라이언트에서
import { createClient } from '@/lib/supabase/client';

// RLS 정책 필수 활성화
// 직접 SQL 인젝션 방지
```

---

## 9. Testing Strategy (테스트 전략)

### 9.1 테스트 피라미드

```
        /\
       /  \  E2E (Playwright)
      /----\  - 핵심 사용자 플로우만
     /      \
    /--------\  Integration
   /          \  - API 라우트
  /            \  - Supabase 연동
 /--------------\
/                \  Unit
------------------  - 유틸 함수
                    - 컴포넌트 로직
```

### 9.2 테스트 파일 위치

```
src/
├── components/
│   ├── MessageBubble.tsx
│   └── __tests__/
│       └── MessageBubble.test.tsx
├── lib/
│   ├── utils/
│   │   ├── formatDate.ts
│   │   └── __tests__/
│   │       └── formatDate.test.ts
```

### 9.3 테스트 명명 규칙

```typescript
describe('MessageBubble', () => {
  it('should display sender nickname', () => {});
  it('should show timestamp in local format', () => {});
  it('should apply sent style when isMine is true', () => {});
});
```

---

## 10. Security Rules (보안 규칙)

1. **환경 변수**
   - 민감한 정보는 반드시 `.env.local`
   - 절대 커밋하지 않음

2. **입력 검증**
   - 모든 사용자 입력 검증
   - Zod 스키마 사용

3. **SQL 인젝션 방지**
   - Supabase 클라이언트 사용
   - Raw SQL 사용 시 파라미터 바인딩

4. **XSS 방지**
   - React의 기본 이스케이핑 활용
   - `dangerouslySetInnerHTML` 사용 금지

5. **AI 모더레이션**
   - 모든 메시지 OpenAI Moderation API 통과
   - 부적절한 콘텐츠 필터링

---

## 11. Definition of Done (완료 정의)

Task가 "완료"로 간주되려면:

- [ ] 모든 관련 테스트 작성 및 통과
- [ ] 코드 품질 기준 충족
- [ ] 린터/타입 체크 통과
- [ ] 구조적/행위적 변경 분리 커밋
- [ ] `tasks.md` 상태 업데이트

---

## 12. Quick Reference (빠른 참조)

### 커맨드

```bash
# 테스트 실행
npm test

# 특정 테스트 실행
npm test -- MessageBubble

# 타입 체크
npm run type-check

# 린트
npm run lint

# 개발 서버
npm run dev
```

### 체크리스트

**코드 작성 전:**
- [ ] docs/ 문서 확인
- [ ] tasks.md에서 현재 Task 확인
- [ ] 실패하는 테스트 먼저 작성

**커밋 전:**
- [ ] 모든 테스트 통과
- [ ] 린터 경고 없음
- [ ] 구조적/행위적 변경 분리
- [ ] 커밋 메시지 형식 준수

**Task 완료 후:**
- [ ] tasks.md 업데이트
- [ ] 작업 중단
- [ ] 사용자 "go" 대기

---

*이 문서는 Table Connect 프로젝트의 최상위 실행 규칙입니다.*
*모든 개발 활동은 이 규칙을 따라야 합니다.*
