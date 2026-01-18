---
name: task-runner
description: tasks.md의 Task를 실행하고 관리합니다. "go", "다음 태스크", "Task 실행", "tasks.md 업데이트" 요청 시 활성화됩니다. plan.md 규칙을 따라 TDD 사이클로 진행합니다.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Task Runner Skill

tasks.md의 Task를 plan.md 규칙에 따라 실행합니다.

## 실행 흐름

```
┌─────────────────────────────────────────────────────────┐
│  1. tasks.md 읽기 - 다음 TODO Task 확인                   │
│     ↓                                                    │
│  2. Task 상태를 IN_PROGRESS로 업데이트                    │
│     ↓                                                    │
│  3. Task 유형 확인 (STRUCTURAL / BEHAVIORAL)              │
│     ↓                                                    │
│  4. TDD 사이클 실행 (BEHAVIORAL인 경우)                   │
│     ↓                                                    │
│  5. Acceptance Criteria 체크                             │
│     ↓                                                    │
│  6. Task 상태를 DONE으로 업데이트                         │
│     ↓                                                    │
│  7. Change Log 기록                                      │
│     ↓                                                    │
│  8. 작업 즉시 중단 - 사용자 "go" 대기                      │
└─────────────────────────────────────────────────────────┘
```

## Step 1: 다음 Task 확인

```bash
# tasks.md에서 첫 번째 TODO 상태의 Task 찾기
```

tasks.md 파일을 읽고 `Status: TODO`인 첫 번째 Task를 찾습니다.

## Step 2: Task 시작

tasks.md에서 해당 Task의 상태를 업데이트:

```markdown
### TASK-X.X: Task 이름
- **Status:** `IN_PROGRESS`  <!-- TODO에서 변경 -->
```

## Step 3: Task 유형별 처리

### STRUCTURAL Task
구조적 변경 (행위 변경 없음):
1. 변경 전 테스트 실행 (있는 경우)
2. 구조 변경 수행
3. 변경 후 테스트 실행하여 행위 불변 확인
4. 커밋: `[STRUCTURAL] scope: description`

### BEHAVIORAL Task
기능 추가/수정:
1. 실패하는 테스트 작성 (RED)
2. 테스트 실행 - 실패 확인
3. 최소한의 코드 작성 (GREEN)
4. 테스트 실행 - 통과 확인
5. 리팩토링 (필요시)
6. 커밋: `[BEHAVIORAL] scope: description`

## Step 4: Acceptance Criteria 확인

Task의 모든 Acceptance Criteria가 충족되었는지 확인:

```markdown
- [x] 조건 1 완료
- [x] 조건 2 완료
- [x] 조건 3 완료
```

## Step 5: Task 완료

tasks.md 업데이트:

```markdown
### TASK-X.X: Task 이름
- **Status:** `DONE`  <!-- IN_PROGRESS에서 변경 -->
```

Change Log 기록:

```markdown
## Change Log

| 날짜 | Task ID | 변경 내용 | 작성자 |
|------|---------|----------|--------|
| 2024-XX-XX | TASK-X.X | 구현 완료 내용 | Agent |
```

## Step 6: 작업 중단

**⚠️ 중요: Task 완료 후 즉시 작업을 중단합니다.**

사용자에게 보고:
```
✅ TASK-X.X 완료

완료된 작업:
- [완료 내용 1]
- [완료 내용 2]

다음 Task: TASK-X.Y - [Task 이름]

계속하려면 "go"를 입력하세요.
```

## 커밋 메시지 형식

```
[TYPE] <scope>: <description>

<optional body>

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Scope (Table Connect):**
- `session` - 세션/테이블 연결
- `message` - 메시징 기능
- `gift` - 선물 기능
- `payment` - 결제 (Stripe)
- `moderation` - AI 콘텐츠 필터링
- `admin` - 관리자 기능
- `ui` - UI 컴포넌트
- `setup` - 프로젝트 설정

## 예시 실행

사용자: "go"

```
📋 현재 Task 확인 중...

TASK-0.1: Next.js 프로젝트 초기화
- Type: STRUCTURAL
- Status: TODO → IN_PROGRESS

실행 중...
1. npx create-next-app@14 실행
2. TypeScript, Tailwind CSS, ESLint 설정 확인
3. npm run dev 테스트

✅ TASK-0.1 완료

완료된 작업:
- Next.js 14 프로젝트 생성
- TypeScript 설정 완료
- Tailwind CSS 설정 완료
- 개발 서버 정상 실행 확인

다음 Task: TASK-0.2 - 프로젝트 디렉토리 구조 설정

계속하려면 "go"를 입력하세요.
```

## 주의사항

1. **한 번에 하나의 Task만** 처리
2. Task 완료 후 **자동으로 다음 Task 진행 금지**
3. **모든 테스트 통과** 후에만 완료 처리
4. **Acceptance Criteria 100% 충족** 필수
5. BLOCKED Task는 건너뛰고 다음 TODO Task 진행
