# Table Connect - Tasks (Execution Queue)

> 이 문서는 **실행 가능한 개발 큐(Execution Queue)**입니다.
> 각 Task는 하나의 테스트로 검증 가능한 최소 단위입니다.
> `plan.md`의 규칙을 따라 진행합니다.

---

## Task Status Legend

| 상태 | 의미 |
|------|------|
| `TODO` | 대기 중 |
| `IN_PROGRESS` | 진행 중 |
| `DONE` | 완료 |
| `BLOCKED` | 차단됨 (선행 작업 필요) |

---

## Phase 0: Project Setup (프로젝트 초기 설정)

### TASK-0.0: Supabase 데이터베이스 스키마 마이그레이션
- **Status:** `DONE`
- **Type:** STRUCTURAL
- **Description:** Database Design 문서 기반 Supabase 테이블 생성
- **Test:** 모든 테이블 존재 및 관계 확인
- **Acceptance Criteria:**
  - [x] `merchants` 테이블 생성 (id, name, slug, description, address, phone, business_hours, settings, is_active, created_at, updated_at)
  - [x] `menus` 테이블 생성 (id, merchant_id, name, description, price, image_url, category, is_available, sort_order, created_at, updated_at)
  - [x] `sessions` 테이블 생성 (id, merchant_id, table_number, nickname, is_active, created_at, expires_at)
  - [x] `messages` 테이블 생성 (id, sender_session_id, receiver_session_id, content, is_read, created_at)
  - [x] `gifts` 테이블 생성 (id, sender_session_id, receiver_session_id, menu_id, amount, message, status, stripe_payment_intent_id, created_at)
  - [x] `settlements` 테이블 생성 (id, merchant_id, period_start, period_end, total_amount, fee_amount, net_amount, status, paid_at, created_at)
  - [x] `reports` 테이블 생성 (id, reporter_session_id, reported_session_id, message_id, reason, description, status, admin_note, created_at, resolved_at)
  - [x] `blocks` 테이블 생성 (id, blocker_session_id, blocked_session_id, created_at)
  - [x] 외래키 관계 설정
  - [x] RLS (Row Level Security) 정책 설정
  - [ ] Realtime 활성화 (messages, gifts 테이블) - Supabase Dashboard에서 실행 필요

### TASK-0.1: Next.js 프로젝트 초기화
- **Status:** `DONE`
- **Type:** STRUCTURAL
- **Description:** Next.js 14 App Router 프로젝트 생성
- **Test:** 프로젝트 빌드 성공 확인
- **Acceptance Criteria:**
  - [x] `npx create-next-app@14` 실행
  - [x] TypeScript, Tailwind CSS, ESLint 설정
  - [x] App Router 구조 확인
  - [x] `npm run build` 성공 확인

### TASK-0.2: 프로젝트 디렉토리 구조 설정
- **Status:** `DONE`
- **Type:** STRUCTURAL
- **Description:** Coding Convention 문서 기반 폴더 구조 생성
- **Test:** 디렉토리 구조 존재 확인
- **Acceptance Criteria:**
  - [x] `src/app/` - 페이지 라우트
  - [x] `src/components/` - UI 컴포넌트 (ui, features, layout)
  - [x] `src/lib/` - 유틸리티, 훅 (utils, hooks, supabase)
  - [x] `src/types/` - TypeScript 타입
  - [x] `src/styles/` - 글로벌 스타일

### TASK-0.3: Tailwind CSS 커스텀 설정
- **Status:** `DONE`
- **Type:** STRUCTURAL
- **Description:** Design System 문서 기반 Tailwind 설정
- **Test:** 커스텀 색상/폰트 적용 확인
- **Acceptance Criteria:**
  - [x] Tokyo Night Pulse 색상 팔레트 추가 (void, midnight, steel, neon-pink, neon-cyan, neon-purple)
  - [x] 커스텀 폰트 (Righteous, DM Sans, Fredoka) 설정 + Google Fonts 연동
  - [x] Glass morphism 유틸리티 클래스 추가 (.glass, .glass-hover)
  - [x] 애니메이션 키프레임 설정 (fadeIn, slideUp, pulseGlow, celebrate 등)

### TASK-0.4: Supabase 클라이언트 설정
- **Status:** `DONE`
- **Type:** STRUCTURAL
- **Description:** Supabase 서버/클라이언트 인스턴스 생성
- **Test:** Supabase 연결 테스트 통과
- **Acceptance Criteria:**
  - [x] `@supabase/supabase-js`, `@supabase/ssr` 설치
  - [x] `src/lib/supabase/server.ts` 생성 (서버 컴포넌트용)
  - [x] `src/lib/supabase/client.ts` 생성 (클라이언트 컴포넌트용)
  - [x] `src/middleware.ts` 생성 (세션 갱신용)
  - [x] 환경 변수 설정 (`.env.local.example`)

### TASK-0.5: 테스트 환경 설정
- **Status:** `DONE`
- **Type:** STRUCTURAL
- **Description:** Vitest + Testing Library 설정
- **Test:** 샘플 테스트 실행 성공 (6 tests passed)
- **Acceptance Criteria:**
  - [x] Vitest 설치 및 설정 (`vitest`, `jsdom`, `@vitejs/plugin-react`)
  - [x] React Testing Library 설치 (`@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`)
  - [x] `vitest.config.ts` 생성 (jsdom 환경, 경로 별칭, 커버리지 설정)
  - [x] 샘플 테스트 파일 작성 및 실행 (`cn.test.ts` - 6 tests passed)

### TASK-0.6: TypeScript 타입 정의
- **Status:** `DONE`
- **Type:** STRUCTURAL
- **Description:** Database Design 기반 타입 정의
- **Test:** 타입 체크 통과 (`tsc --noEmit` & `npm run build`)
- **Acceptance Criteria:**
  - [x] `src/types/database.ts` - DB 스키마 타입 (Merchant, Menu, Session, Message, Gift, Settlement, Report, Block)
  - [x] `src/types/api.ts` - API 요청/응답 타입 (Session, Message, Gift, Payment, Block, Report, Admin API)
  - [x] `src/types/ui.ts` - UI 관련 타입 (Button, Input, Card, MessageBubble, Modal, Toast 등)

### TASK-0.7: 공통 UI 컴포넌트 (Design System)
- **Status:** `DONE`
- **Type:** STRUCTURAL
- **Description:** Design System 문서 기반 재사용 가능한 UI 컴포넌트 생성
- **Test:** 각 컴포넌트 렌더링 테스트
- **Acceptance Criteria:**
  - [x] `Button.tsx` - primary, secondary, ghost, danger 변형 + 로딩 상태
  - [x] `Input.tsx` - text, email, password, number, tel 타입 + 에러 상태
  - [x] `Card.tsx` - default, glow 변형 (Glass morphism 적용)
  - [x] `Modal.tsx` - 오버레이 + 닫기 버튼 + 애니메이션
  - [x] `Toast.tsx` - success, error, warning, info 타입 + auto-dismiss
  - [x] `Spinner.tsx` / `Loading.tsx` - 로딩 인디케이터
  - [x] `Container.tsx` - 반응형 레이아웃 컨테이너
  - [x] `Header.tsx` - 네비게이션 헤더 (뒤로가기, 제목, 액션)

### TASK-0.8: 유틸리티 함수
- **Status:** `DONE`
- **Type:** STRUCTURAL
- **Description:** 공통 유틸리티 함수 생성
- **Test:** 각 유틸리티 함수 단위 테스트 (43 tests passed)
- **Acceptance Criteria:**
  - [x] `format.ts` - formatPrice (¥1,000 형식), formatDate, formatRelativeTime
  - [x] `validators.ts` - isValidNickname, isValidMessage, isValidTableNumber
  - [x] `constants.ts` - MAX_MESSAGE_LENGTH (500), MAX_NICKNAME_LENGTH (20), SESSION_TTL_HOURS (2)

### TASK-0.9: 커스텀 훅
- **Status:** `DONE`
- **Type:** STRUCTURAL
- **Description:** 재사용 가능한 React 커스텀 훅 생성
- **Test:** 각 훅 동작 테스트
- **Acceptance Criteria:**
  - [x] `useSession.ts` - 세션 상태 관리 (생성, 조회, 만료 체크)
  - [x] `useMessages.ts` - 메시지 CRUD + 페이지네이션
  - [x] `useRealtime.ts` - Supabase Realtime 구독 관리
  - [x] `useToast.ts` - 토스트 알림 관리
  - [x] `useLocalStorage.ts` - 로컬 스토리지 상태 동기화

### TASK-0.10: 상태 관리 설정 (Zustand)
- **Status:** `DONE`
- **Type:** STRUCTURAL
- **Description:** Zustand 기반 전역 상태 관리 설정
- **Test:** 스토어 상태 업데이트 테스트
- **Acceptance Criteria:**
  - [x] `sessionStore.ts` - 현재 세션, 상대방 세션 정보
  - [x] `chatStore.ts` - 메시지 목록, 입력 상태
  - [x] `uiStore.ts` - 모달, 토스트, 로딩 상태
  - [x] Zustand devtools 설정

### TASK-0.11: PWA 설정
- **Status:** `DONE`
- **Type:** STRUCTURAL
- **Description:** Progressive Web App 설정 (모바일 최적화)
- **Test:** Lighthouse PWA 점수 확인
- **Acceptance Criteria:**
  - [x] `manifest.json` 생성 (앱 이름, 아이콘, 테마 색상)
  - [ ] Service Worker 설정 (next-pwa 또는 수동 설정) - 추후 적용
  - [x] 메타 태그 설정 (viewport, theme-color, apple-touch-icon)
  - [x] 오프라인 fallback 페이지

### TASK-0.12: Stripe 클라이언트 설정
- **Status:** `DONE`
- **Type:** STRUCTURAL
- **Description:** Stripe 결제 SDK 설정
- **Test:** Stripe 연결 테스트 (테스트 모드)
- **Acceptance Criteria:**
  - [x] `@stripe/stripe-js`, `@stripe/react-stripe-js` 설치
  - [x] `src/lib/stripe/client.ts` 생성 (loadStripe 설정)
  - [x] `src/lib/stripe/server.ts` 생성 (서버 사이드 Stripe 인스턴스)
  - [x] 환경 변수 설정 (STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

---

## Phase 1: Core Features - Table Connection (테이블 연결)

### TASK-1.1: QR 코드 스캔 페이지 라우트 생성
- **Status:** `DONE`
- **Type:** STRUCTURAL
- **Description:** `/[merchant]/[table]` 동적 라우트 생성
- **Test:** 라우트 접근 시 페이지 렌더링 확인
- **Acceptance Criteria:**
  - [x] `src/app/[merchant]/[table]/page.tsx` 생성
  - [x] 동적 파라미터 추출 확인
  - [x] 기본 레이아웃 적용

### TASK-1.2: 세션 생성 API 구현
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** POST `/api/sessions` - 새 세션 생성
- **Test:** `shouldCreateSessionWhenValidTableAccessed`
- **Acceptance Criteria:**
  - [x] merchant_id, table_number 검증
  - [x] 고유 session_id 생성
  - [x] expires_at = 현재 + 2시간 설정
  - [x] Supabase sessions 테이블에 저장
  - [x] 세션 정보 반환

### TASK-1.3: 세션 조회 API 구현
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** GET `/api/sessions/[id]` - 세션 정보 조회
- **Test:** `shouldReturnSessionWhenValidIdProvided`
- **Acceptance Criteria:**
  - [x] session_id로 세션 조회
  - [x] 만료 여부 확인
  - [x] 세션 정보 반환

### TASK-1.4: 세션 유효성 검증 유틸리티
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** 세션 만료 및 유효성 검증 함수
- **Test:** `shouldReturnFalseWhenSessionExpired` (22 tests passed)
- **Acceptance Criteria:**
  - [x] `isSessionValid(session)` 함수 구현
  - [x] 만료 시간 체크
  - [x] is_active 상태 체크
  - [x] `formatSessionRemainingTime`, `isSessionExpiringSoon`, `canSessionsCommunicate` 추가

### TASK-1.5: 닉네임 입력 폼 컴포넌트
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** 익명 닉네임 입력 UI 컴포넌트
- **Test:** `shouldUpdateNicknameOnInput`
- **Acceptance Criteria:**
  - [x] `NicknameForm.tsx` 컴포넌트 생성
  - [x] 입력 필드 + 제출 버튼
  - [x] 최대 20자 제한
  - [x] 빈 값 검증

### TASK-1.6: 세션 참여 API 구현
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** POST `/api/sessions/[id]/join` - 세션 참여
- **Test:** `shouldJoinSessionWithNickname`
- **Acceptance Criteria:**
  - [x] 닉네임 저장 (localStorage)
  - [x] 세션 참여자 정보 업데이트
  - [x] 참여 성공 응답 반환
  - [x] 중복 닉네임 검증

### TASK-1.6.1: 프로필 입력 페이지
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** QR 스캔 후 닉네임 입력 온보딩 페이지
- **Test:** `shouldRenderProfileInputPageAfterQRScan`
- **Acceptance Criteria:**
  - [x] `src/app/[merchant]/[table]/profile/page.tsx` 생성
  - [x] 닉네임 입력 폼 (NicknameForm 컴포넌트 사용)
  - [x] 입력 검증 (1-20자, 금지어 필터링)
  - [x] 세션 생성 후 메인 페이지로 리다이렉트

### TASK-1.6.2: 세션 자동 종료 로직
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** 세션 만료 시 자동 종료 처리
- **Test:** `shouldEndSessionWhenExpired`
- **Acceptance Criteria:**
  - [x] 세션 만료 시간 체크 (2시간 기본값)
  - [x] 만료된 세션 is_active = false 업데이트 (useSession 훅)
  - [x] 클라이언트 측 만료 감지 및 알림 (SessionExpiryWarning 컴포넌트)
  - [x] 만료 시 자동 로그아웃 처리 (endSession 함수)

### TASK-1.7: 활성 테이블 목록 조회 API
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** GET `/api/tables` - 현재 활성 테이블 목록
- **Test:** `shouldReturnActiveTablesInSession`
- **Acceptance Criteria:**
  - [x] 같은 merchant의 활성 세션 조회
  - [x] 자신의 테이블 제외
  - [x] 테이블 번호와 익명화된 정보 반환

### TASK-1.8: 테이블 목록 UI 컴포넌트
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** 활성 테이블 카드 목록 표시
- **Test:** `shouldRenderTableCardsForActiveTables`
- **Acceptance Criteria:**
  - [x] `TableList.tsx` 컴포넌트 생성
  - [x] `TableCard.tsx` 카드 컴포넌트
  - [x] Glass morphism 스타일 적용
  - [x] 테이블 선택 핸들러

---

## Phase 2: Core Features - Anonymous Messaging (익명 메시징)

### TASK-2.1: 메시지 전송 API 구현
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** POST `/api/messages` - 메시지 전송
- **Test:** `shouldCreateMessageWhenValidContentProvided`
- **Acceptance Criteria:**
  - [x] sender_session_id, receiver_session_id 검증
  - [x] content 길이 검증 (최대 500자)
  - [x] messages 테이블에 저장
  - [x] 메시지 정보 반환
  - [x] 차단 여부 검증

### TASK-2.2: AI 콘텐츠 모더레이션 통합
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** OpenAI Moderation API로 메시지 필터링
- **Test:** `shouldRejectMessageWhenContentIsInappropriate`
- **Acceptance Criteria:**
  - [x] OpenAI Moderation API 호출 (`src/lib/moderation/openai.ts`)
  - [x] 부적절한 콘텐츠 거부 (messages API에 통합)
  - [x] 필터링 결과 로깅
  - [x] 사용자에게 적절한 에러 메시지 (다국어 지원: ja, en, ko, zh)

### TASK-2.3: 메시지 목록 조회 API
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** GET `/api/messages?sessionId=&partnerId=` - 대화 메시지 조회
- **Test:** `shouldReturnMessagesForSession`
- **Acceptance Criteria:**
  - [x] 세션 ID와 파트너 ID로 관련 메시지 조회
  - [x] 시간순 정렬
  - [x] 페이지네이션 지원 (offset, limit)
  - [x] 조회 시 자동 읽음 처리

### TASK-2.4: 메시지 버블 컴포넌트
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** 채팅 메시지 버블 UI
- **Test:** `shouldApplySentStyleWhenIsMineIsTrue`
- **Acceptance Criteria:**
  - [x] `MessageBubble.tsx` 컴포넌트
  - [x] 보낸 메시지 / 받은 메시지 스타일 구분
  - [x] 타임스탬프 표시
  - [x] 닉네임 표시
  - [x] 읽음 상태 표시 (既読)

### TASK-2.5: 채팅룸 컴포넌트
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** 메시지 목록 + 입력창 통합 UI
- **Test:** `shouldRenderMessageListAndInput`
- **Acceptance Criteria:**
  - [x] `ChatRoom.tsx` 컴포넌트
  - [x] 메시지 목록 스크롤
  - [x] 메시지 입력창
  - [x] 전송 버튼
  - [x] 채팅 페이지 (`/[merchant]/[table]/chat`)

### TASK-2.6: Supabase Realtime 구독 설정
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** 실시간 메시지 수신
- **Test:** `shouldReceiveNewMessageInRealtime`
- **Acceptance Criteria:**
  - [x] Supabase Realtime 채널 구독 (`useRealtime` 훅)
  - [x] INSERT 이벤트 리스닝
  - [x] 새 메시지 UI 업데이트
  - [x] 구독 해제 처리

### TASK-2.6.1: 메시지 읽음 표시 기능
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** 메시지 읽음 상태 처리
- **Test:** `shouldMarkMessageAsReadWhenViewed`
- **Acceptance Criteria:**
  - [x] 메시지 조회 시 is_read = true 업데이트
  - [x] 읽음 상태 UI 표시 (既読)
  - [ ] 읽지 않은 메시지 카운트 표시 (차후 구현)

### TASK-2.7: 메시지 입력 컴포넌트
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** 메시지 입력 및 전송 UI
- **Test:** `shouldClearInputAfterSend`
- **Acceptance Criteria:**
  - [x] `MessageInput.tsx` 컴포넌트
  - [x] 텍스트 입력 필드 (자동 높이 조절)
  - [x] Enter 키 전송 (Shift+Enter 줄바꿈)
  - [x] 전송 후 입력창 초기화
  - [x] 글자 수 카운터 표시

---

## Phase 3: Core Features - Gift Sending (선물 보내기)

### TASK-3.1: 메뉴 목록 조회 API
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** GET `/api/merchants/[id]/menus` - 메뉴 목록
- **Test:** `shouldReturnMenusForMerchant`
- **Acceptance Criteria:**
  - [x] merchant_id로 메뉴 조회
  - [x] 활성 메뉴만 필터링
  - [x] 가격 정보 포함

### TASK-3.2: 메뉴 카드 컴포넌트
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** 메뉴 아이템 카드 UI
- **Test:** `shouldDisplayMenuNameAndPrice`
- **Acceptance Criteria:**
  - [x] `MenuCard.tsx` 컴포넌트
  - [x] 메뉴 이름, 설명, 가격 표시
  - [x] 이미지 (선택적)
  - [x] 선택 상태 표시

### TASK-3.3: 선물 메뉴 선택 UI
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** 선물할 메뉴 선택 페이지
- **Test:** `shouldUpdateSelectedMenuOnClick`
- **Acceptance Criteria:**
  - [x] 메뉴 목록 그리드 표시
  - [x] 단일 선택 로직
  - [x] 선택된 메뉴 하이라이트
  - [x] 다음 단계 버튼

### TASK-3.4: Stripe 결제 인텐트 생성 API
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** POST `/api/payments/intent` - 결제 인텐트 생성
- **Test:** `shouldCreatePaymentIntentWithCorrectAmount`
- **Acceptance Criteria:**
  - [x] Stripe SDK 사용
  - [x] 메뉴 가격 기반 금액 설정
  - [x] client_secret 반환
  - [x] 메타데이터에 gift 정보 포함

### TASK-3.5: Stripe Elements 결제 폼
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** 카드 결제 UI
- **Test:** `shouldShowPaymentFormWithStripeElements`
- **Acceptance Criteria:**
  - [x] `@stripe/react-stripe-js` 사용
  - [x] 카드 입력 필드
  - [x] 결제 버튼
  - [x] 로딩/에러 상태

### TASK-3.6: 선물 생성 API
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** POST `/api/gifts` - 선물 기록 생성
- **Test:** `shouldCreateGiftAfterPaymentSuccess`
- **Acceptance Criteria:**
  - [x] payment_intent_id 검증
  - [x] gifts 테이블에 저장
  - [x] 수신자에게 알림 (Realtime)
  - [x] 선물 정보 반환

### TASK-3.7: Stripe Webhook 처리
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** POST `/api/webhooks/stripe` - 결제 완료 처리
- **Test:** `shouldUpdateGiftStatusOnPaymentSuccess`
- **Acceptance Criteria:**
  - [x] Webhook 서명 검증
  - [x] payment_intent.succeeded 이벤트 처리
  - [x] 선물 상태 업데이트
  - [x] 정산 데이터 기록

### TASK-3.8: 선물 수신 알림 UI
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** 선물 수신 시 알림 표시
- **Test:** `shouldShowGiftNotificationOnReceive`
- **Acceptance Criteria:**
  - [x] `GiftNotification.tsx` 컴포넌트
  - [x] 축하 애니메이션
  - [x] 선물 정보 표시
  - [x] 감사 메시지 전송 옵션

### TASK-3.9: 선물 히스토리 조회 API
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** GET `/api/gifts?session_id=` - 선물 내역
- **Test:** `shouldReturnGiftHistoryForSession`
- **Acceptance Criteria:**
  - [x] 보낸/받은 선물 모두 조회
  - [x] 시간순 정렬
  - [x] 메뉴 정보 조인

### TASK-3.10: 선물 Realtime 알림 설정
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** 실시간 선물 수신 알림
- **Test:** `shouldReceiveGiftNotificationInRealtime`
- **Acceptance Criteria:**
  - [x] Supabase Realtime gifts 테이블 구독
  - [x] 새 선물 INSERT 이벤트 감지
  - [x] GiftNotification 컴포넌트 표시
  - [x] 축하 애니메이션 + 사운드 (선택적)

### TASK-3.11: 선물 상태 관리 (Zustand)
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** 선물 관련 전역 상태 관리
- **Test:** `shouldUpdateGiftStoreOnReceive`
- **Acceptance Criteria:**
  - [x] `giftStore.ts` 생성
  - [x] 받은 선물 목록 상태
  - [x] 선물 알림 대기열 관리
  - [x] 선물 히스토리 캐싱

---

## Phase 4: Safety & Moderation (안전 및 모더레이션)

### TASK-4.1: 사용자 차단 API
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** POST `/api/blocks` - 사용자 차단
- **Test:** `shouldBlockUserAndPreventMessages`
- **Acceptance Criteria:**
  - [x] blocks 테이블에 저장
  - [x] 차단된 사용자로부터 메시지 필터링
  - [x] 차단 해제 기능

### TASK-4.2: 신고 API
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** POST `/api/reports` - 부적절한 콘텐츠 신고
- **Test:** `shouldCreateReportWithDetails`
- **Acceptance Criteria:**
  - [x] 신고 유형 선택
  - [x] 신고 내용 저장
  - [x] reports 테이블에 기록
  - [ ] 관리자 알림 (Phase 5에서 구현)

### TASK-4.3: 차단/신고 UI 컴포넌트
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** 차단 및 신고 버튼/모달
- **Test:** `shouldOpenReportModalOnClick`
- **Acceptance Criteria:**
  - [x] `BlockButton.tsx` 컴포넌트
  - [x] `ReportModal.tsx` 컴포넌트
  - [x] 신고 유형 선택 UI
  - [x] 확인/취소 동작

### TASK-4.4: 차단 목록 관리 API
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** GET/DELETE `/api/blocks` - 차단 목록 조회 및 해제
- **Test:** `shouldListAndUnblockUsers`
- **Acceptance Criteria:**
  - [x] 현재 세션의 차단 목록 조회
  - [x] 차단 해제 기능
  - [x] 차단된 사용자 정보 (닉네임, 테이블 번호)

### TASK-4.5: 콘텐츠 필터링 고급 설정
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** OpenAI Moderation API 카테고리별 처리
- **Test:** `shouldFilterContentByCategory`
- **Acceptance Criteria:**
  - [x] 카테고리별 민감도 설정 (hate, harassment, sexual, violence 등) - 커스텀 threshold 지원
  - [x] 필터링 로그 저장 (console.log로 디버깅용 로깅)
  - [x] 카테고리별 사용자 메시지 (getModerationErrorMessage)

---

## Phase 5: Admin Features (관리자 기능)

### TASK-5.1: 관리자 인증 미들웨어
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** 관리자 API 접근 제어
- **Test:** `shouldRejectUnauthorizedAdminAccess`
- **Acceptance Criteria:**
  - [x] Supabase Auth 기반 인증
  - [x] 관리자 역할 검증 (super_admin, merchant_admin)
  - [x] 미들웨어 적용 (/admin, /api/admin 라우트)
  - [x] 로그인/권한없음 페이지 생성

### TASK-5.2: 정산 대시보드 API
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** GET `/api/admin/settlements` - 정산 데이터
- **Test:** `shouldReturnSettlementSummary`
- **Acceptance Criteria:**
  - [x] 기간별 매출 집계
  - [x] 수수료 계산 (10%)
  - [x] merchant별 정산 금액
  - [x] 정산 요약 통계 API

### TASK-5.3: 신고 관리 API
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** GET/PATCH `/api/admin/reports` - 신고 관리
- **Test:** `shouldUpdateReportStatus`
- **Acceptance Criteria:**
  - [x] 신고 목록 조회 (페이지네이션)
  - [x] 상태 업데이트 (pending/reviewing/resolved/dismissed)
  - [x] 조치 내역 기록 (admin_note)
  - [x] 신고 통계 API

### TASK-5.4: 관리자 대시보드 페이지
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** 관리자 대시보드 UI
- **Test:** `shouldRenderAdminDashboard`
- **Acceptance Criteria:**
  - [x] `src/app/admin/page.tsx` 생성
  - [x] 정산 요약 위젯
  - [x] 신고 목록 위젯
  - [x] 통계 그래프 (매출 추이)
  - [x] 관리자 전용 레이아웃 (사이드바)

### TASK-5.5: 가맹점 관리 API
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** CRUD `/api/admin/merchants` - 가맹점 관리
- **Test:** `shouldCRUDMerchant`
- **Acceptance Criteria:**
  - [x] 가맹점 목록 조회 (페이지네이션)
  - [x] 가맹점 상세 조회 (통계 포함)
  - [x] 가맹점 생성/수정
  - [x] 가맹점 비활성화 (소프트 삭제)

### TASK-5.6: 메뉴 관리 API
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** CRUD `/api/admin/merchants/[id]/menus` - 메뉴 관리
- **Test:** `shouldCRUDMenu`
- **Acceptance Criteria:**
  - [x] 메뉴 목록 조회 (카테고리 필터)
  - [x] 메뉴 생성/수정/삭제
  - [ ] 메뉴 이미지 업로드 (Supabase Storage) - 추후 구현
  - [x] 메뉴 정렬 순서 변경

---

## Phase 6: Internationalization (다국어 지원)

### TASK-6.1: i18n 설정
- **Status:** `DONE`
- **Type:** STRUCTURAL
- **Description:** next-intl 라이브러리 설정
- **Test:** 다국어 전환 동작 확인
- **Acceptance Criteria:**
  - [x] 일본어 (기본)
  - [x] 한국어
  - [x] 중국어
  - [x] 영어

### TASK-6.2: 번역 파일 생성
- **Status:** `DONE`
- **Type:** STRUCTURAL
- **Description:** 각 언어별 번역 JSON 파일
- **Test:** 번역 키 존재 확인
- **Acceptance Criteria:**
  - [x] `messages/ja.json`
  - [x] `messages/ko.json`
  - [x] `messages/zh.json`
  - [x] `messages/en.json`

### TASK-6.3: 언어 선택 UI
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** 언어 선택 드롭다운/버튼
- **Test:** `shouldChangeLanguageOnSelect`
- **Acceptance Criteria:**
  - [x] `LanguageSelector.tsx` 컴포넌트
  - [x] 현재 언어 표시
  - [x] 언어 변경 시 즉시 반영
  - [x] 선택된 언어 쿠키 저장 (NEXT_LOCALE)

---

## Phase 7: Testing & Quality (테스트 및 품질)

### TASK-7.1: 단위 테스트 (유틸리티)
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** 유틸리티 함수 단위 테스트
- **Test:** 각 유틸리티 함수 커버리지 90% 이상 (144 tests passed)
- **Acceptance Criteria:**
  - [x] `format.test.ts` - formatPrice, formatDate, formatRelativeTime (16 tests)
  - [x] `validators.test.ts` - isValidNickname, isValidMessage (21 tests)
  - [x] `cn.test.ts` - 클래스 병합 테스트 (6 tests)
  - [x] `session.test.ts` - 세션 유틸리티 테스트 (22 tests)

### TASK-7.2: 단위 테스트 (스토어)
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** Zustand 스토어 단위 테스트
- **Test:** 각 스토어 동작 테스트
- **Acceptance Criteria:**
  - [x] `sessionStore.test.ts` (7 tests)
  - [x] `chatStore.test.ts` (19 tests)
  - [x] `uiStore.test.ts` (18 tests)

### TASK-7.3: 컴포넌트 테스트
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** UI 컴포넌트 렌더링/상호작용 테스트
- **Test:** React Testing Library 컴포넌트 테스트
- **Acceptance Criteria:**
  - [x] `Button.test.tsx` (13 tests)
  - [x] `Input.test.tsx` (11 tests)
  - [x] `Card.test.tsx` (11 tests)

### TASK-7.4: API 통합 테스트
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** API 엔드포인트 통합 테스트
- **Test:** MSW (Mock Service Worker) 사용
- **Acceptance Criteria:**
  - [x] Session API 테스트 (`src/test/api/sessions.test.ts` - 4 tests)
  - [x] Message API 테스트 (`src/test/api/messages.test.ts` - 5 tests)
  - [x] Gift API 테스트 (`src/test/api/gifts.test.ts` - 4 tests)
  - [x] Blocks/Reports API 테스트 (`src/test/api/blocks-reports.test.ts` - 5 tests)
  - [x] MSW 핸들러 설정 (`src/test/mocks/handlers.ts`, `src/test/mocks/server.ts`)

### TASK-7.5: E2E 테스트 설정
- **Status:** `DONE`
- **Type:** STRUCTURAL
- **Description:** Playwright E2E 테스트 환경 설정
- **Test:** E2E 테스트 실행 성공
- **Acceptance Criteria:**
  - [x] Playwright 설치 및 설정 (`playwright.config.ts`)
  - [x] E2E 테스트 시나리오 작성:
    - `e2e/session-flow.spec.ts` - 세션 플로우 (QR → 닉네임 입력)
    - `e2e/table-view.spec.ts` - 테이블 뷰 레이아웃/반응형
    - `e2e/messaging.spec.ts` - 채팅 인터페이스
    - `e2e/gift-system.spec.ts` - 선물 시스템
    - `e2e/moderation.spec.ts` - 차단/신고 기능
    - `e2e/accessibility.spec.ts` - 접근성 테스트
  - [x] package.json 스크립트 추가 (test:e2e, test:e2e:ui, test:e2e:headed)
  - [ ] CI/CD 파이프라인 연동 (GitHub Actions - 추후 구현)

---

## Phase 8: Performance & Optimization (성능 최적화)

### TASK-8.1: 이미지 최적화
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** Next.js Image 컴포넌트 적용 및 최적화
- **Test:** Lighthouse 성능 점수 확인
- **Acceptance Criteria:**
  - [x] 메뉴 이미지 Next/Image 적용 (MenuCard.tsx)
  - [x] 이미지 lazy loading (fill 속성)
  - [x] WebP/AVIF 포맷 자동 변환 (next.config images.formats)
  - [x] 원격 이미지 패턴 설정 (remotePatterns)

### TASK-8.2: 번들 사이즈 최적화
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** 코드 스플리팅 및 번들 최적화
- **Test:** 번들 사이즈 분석 (chat 페이지 16.3kB → 14.3kB)
- **Acceptance Criteria:**
  - [x] optimizePackageImports 설정 (zustand, @supabase/supabase-js)
  - [x] 프로덕션 console.log 제거 (compiler.removeConsole)
  - [x] 정적 자원 캐싱 헤더 설정 (1년 immutable)

### TASK-8.3: 캐싱 전략
- **Status:** `DONE`
- **Type:** BEHAVIORAL
- **Description:** 데이터 캐싱 및 revalidation 전략
- **Test:** 캐시 적중률 확인
- **Acceptance Criteria:**
  - [x] 이미지 캐시 TTL 설정 (30일)
  - [x] 정적 자원 헤더 설정 (/icons, /_next/static)
  - [ ] SWR 또는 React Query 적용 (선택적) - 추후 구현

---

## Change Log

| 날짜 | Task ID | 변경 내용 | 작성자 |
|------|---------|----------|--------|
| 2026-01-18 | TASK-7.4, 7.5 | 테스트 완료: API 통합 테스트 (MSW - 18 tests), E2E 테스트 설정 (Playwright - 6개 시나리오 파일) | Agent |
| 2026-01-18 | TASK-1.6.2, 2.2, 4.5 | 누락 작업 완료: 세션 자동 종료 로직 (SessionExpiryWarning 컴포넌트), AI 콘텐츠 모더레이션 (OpenAI API 통합), 콘텐츠 필터링 고급 설정 (카테고리별 threshold) | Agent |
| 2026-01-18 | TASK-6.1~6.3, 7.1~7.3, 8.1~8.3 | Phase 6-8 완료: i18n (next-intl, 4개 언어, LanguageSelector), 테스트 (144 tests - 유틸리티, 스토어, 컴포넌트), 성능 최적화 (이미지, 번들, 캐싱) | Agent |
| 2026-01-18 | TASK-2.1~2.7 | Phase 2 완료: 메시지 전송/조회 API, MessageBubble/MessageInput/ChatRoom 컴포넌트, 채팅 페이지, Realtime 구독 | Agent |
| 2026-01-18 | TASK-1.1~1.8 | Phase 1 완료: QR 스캔 페이지, 세션 API (생성/조회/참여), 세션 유틸리티 (22 tests), 닉네임 폼, 프로필 페이지, 테이블 목록 API/UI | Agent |
| 2026-01-18 | - | tasks.md 대폭 보강: Phase 0에 6개 태스크 추가 (DB 마이그레이션, UI 컴포넌트, 유틸리티, 훅, Zustand, PWA, Stripe), Phase 1-6 세부 태스크 추가, Phase 7-8 신규 추가 | Agent |
| 2025-01-18 | TASK-0.6 | TypeScript 타입 정의 완료 (database, api, ui 타입) | Agent |
| 2025-01-18 | TASK-0.5 | 테스트 환경 설정 완료 (Vitest + Testing Library, 6 tests passed) | Agent |
| 2025-01-18 | TASK-0.4 | Supabase 클라이언트 설정 완료 (server/client/middleware + 환경변수) | Agent |
| 2025-01-18 | TASK-0.3 | Tailwind CSS 커스텀 설정 완료 (Tokyo Night Pulse 테마, Glass morphism, 애니메이션) | Agent |
| 2025-01-18 | TASK-0.2 | 프로젝트 디렉토리 구조 설정 완료 (components, lib, types, styles) + cn 유틸리티 | Agent |
| 2025-01-18 | TASK-0.1 | Next.js 14 프로젝트 초기화 완료 (TypeScript, Tailwind, ESLint, App Router) | Agent |
| - | - | 초기 tasks.md 생성 | Agent |

---

*다음 Task를 진행하려면 `"go"` 를 입력하세요.*
