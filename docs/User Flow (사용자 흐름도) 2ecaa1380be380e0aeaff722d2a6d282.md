# User Flow (사용자 흐름도)

# Table Connect - 사용자 흐름도 (User Flow)

**버전:** v1.0

**작성일:** 2026년 1월 18일

**참조 문서:** PRD v1.0, TRD v1.1

---

## 1. 개요

본 문서는 Table Connect의 주요 사용자 여정을 시각화한 플로우차트입니다. Mermaid 다이어그램을 사용하여 각 기능의 흐름을 표현합니다.

---

## 2. 전체 서비스 플로우

```mermaid
graph TD
    Start[매장 입장] --> QR[QR 코드 스캔]
    QR --> Profile[프로필 입력]
    Profile --> ProfileInput{입력 완료?}
    ProfileInput -->|아니오| Profile
    ProfileInput -->|예| Dashboard[대시보드]

    Dashboard --> Explore[테이블 탐색]
    Dashboard --> Messages[메시지함]
    Dashboard --> Gifts[받은 선물]
    Dashboard --> Leave[매장 떠나기]

    Explore --> SelectTable[테이블 선택]
    SelectTable --> SendMessage[메시지 보내기]
    SendMessage --> Filter{AI 필터}
    Filter -->|차단| Warning[경고 메시지]
    Filter -->|통과| Sent[전송 완료]
    Sent --> Chat[대화 시작]

    Chat --> SendGift[선물하기]
    SendGift --> SelectItem[아이템 선택]
    SelectItem --> Payment[결제]
    Payment --> PaymentDone[결제 완료]
    PaymentDone --> Notify[상대방 알림]

    Chat --> Block[차단하기]
    Block --> BlockConfirm{확인?}
    BlockConfirm -->|예| Blocked[차단 완료]
    BlockConfirm -->|아니오| Chat

    Messages --> ViewConvo[대화 보기]
    ViewConvo --> Chat

    Leave --> LeaveConfirm{확인?}
    LeaveConfirm -->|예| Cleanup[세션 정리]
    LeaveConfirm -->|아니오| Dashboard
    Cleanup --> End[종료]

    style Start fill:#8338EC
    style End fill:#FF006E
    style Filter fill:#FFD60A
    style Payment fill:#06FFA5

```

---

## 3. [FEAT-1] 테이블 연결 플로우

```mermaid
graph TD
    A[QR 코드 스캔] --> B{매장 유효성}
    B -->|유효하지 않음| C[에러: 유효하지 않은 QR]
    B -->|유효함| D[프로필 입력 화면]

    D --> E[성별 선택]
    E --> F[나이대 선택]
    F --> G[인원수 입력]
    G --> H{닉네임 입력?}
    H -->|입력함| I[닉네임 저장]
    H -->|건너뜀| J[랜덤 닉네임 생성]

    I --> K[성별별 아이콘 배정]
    J --> K

    K --> L[세션 생성 API 호출]
    L --> M{세션 생성 성공?}
    M -->|실패| N[에러: 세션 생성 실패]
    M -->|성공| O[세션 토큰 쿠키 저장]

    O --> P[대시보드로 이동]
    P --> Q[활성 테이블 목록 로드]
    Q --> R{활성 테이블 있음?}
    R -->|없음| S[안내: 아직 다른 테이블 없음]
    R -->|있음| T[테이블 리스트 표시]

    T --> U[테이블 정보 표시]
    U --> V[성별, 나이대, 인원수, 닉네임]

    style A fill:#8338EC
    style P fill:#06FFA5
    style C fill:#FF006E
    style N fill:#FF006E

```

### 3.1 프로필 입력 상세

**필수 입력:**

1. 성별 (남성/여성) - 버튼 선택
2. 나이대 (20대 초반/중반/후반, 30대 초반/중반/후반, 40대) - 드롭다운
3. 인원수 (1-10명) - 숫자 입력

**선택 입력:**
4. 닉네임 - 텍스트 입력 (최대 10자)

- 미입력 시: 랜덤 닉네임 (예: "푸른사슴", "빨간여우")

**자동 생성:**
5. 아이콘 - 성별에 따라 자동 배정

---

## 4. [FEAT-2] 익명 메시징 플로우

```mermaid
graph TD
    A[테이블 선택] --> B[프로필 확인]
    B --> C{이미 차단한 테이블?}
    C -->|예| D[에러: 차단된 테이블]
    C -->|아니오| E[대화 화면 진입]

    E --> F{기존 대화 있음?}
    F -->|예| G[이전 메시지 로드]
    F -->|아니오| H[새 대화 시작]

    G --> I[메시지 입력 인터페이스]
    H --> I

    I --> J[사용자 입력]
    J --> K{입력 타입?}
    K -->|텍스트| L[텍스트 메시지]
    K -->|이모티콘| M[이모티콘 선택]

    L --> N{글자수 체크}
    N -->|200자 초과| O[에러: 글자수 초과]
    N -->|200자 이하| P[전송 버튼 활성화]

    M --> P
    O --> J

    P --> Q[전송 클릭]
    Q --> R[API: /api/messages/send]
    R --> S{AI 필터 검사}

    S -->|부적절함| T[차단 + 경고]
    S -->|통과| U[Supabase에 저장]

    T --> V[경고 메시지 표시]
    V --> W{경고 횟수}
    W -->|1-2회| J
    W -->|3회 이상| X[세션 일시 정지]

    U --> Y[Realtime으로 전송]
    Y --> Z[상대방 수신]
    Z --> AA[읽음 표시]
    AA --> AB{상대방 응답?}
    AB -->|예| AC[새 메시지 수신]
    AB -->|아니오| I
    AC --> I

    I --> AD[차단 버튼]
    AD --> AE{차단 확인?}
    AE -->|아니오| I
    AE -->|예| AF[차단 처리]
    AF --> AG[더 이상 메시지 수신 안 함]

    style S fill:#FFD60A
    style T fill:#FF006E
    style U fill:#06FFA5
    style D fill:#FF006E

```

### 4.1 메시지 타입

**텍스트 메시지:**

- 최소 1자, 최대 200자
- 특수문자 허용
- URL 자동 링크 변환 (선택적)

**이모티콘:**

- 기본 이모티콘 팩 제공
- Unicode 이모지 지원

**정형 메시지 (Quick Reply):**

- "안녕하세요! 🍻"
- "건배! 🥂"
- "즐거운 시간 보내세요 ✨"
- "감사합니다 🙏"

---

## 5. [FEAT-3] 선물하기 플로우

```mermaid
graph TD
    A[대화 중] --> B[선물하기 버튼]
    B --> C[선물 선택 화면]

    C --> D{선물 타입?}
    D -->|메뉴 아이템| E[매장 메뉴 리스트]
    D -->|포인트| F[금액 선택]

    E --> G[메뉴 아이템 선택]
    G --> H[가격 확인]

    F --> I[포인트 금액 선택]
    I --> J[¥500 / ¥1000 / ¥2000 / ¥5000]

    H --> K[결제 화면]
    J --> K

    K --> L[결제 수단 선택]
    L --> M{PG 연동}
    M -->|Stripe| N[Stripe Checkout]
    M -->|기타 PG| O[해당 PG Checkout]

    N --> P{결제 성공?}
    O --> P

    P -->|실패| Q[에러: 결제 실패]
    P -->|성공| R[API: /api/gifts/send]

    Q --> K

    R --> S[Supabase gifts 테이블 저장]
    S --> T[정산 테이블 업데이트]
    T --> U[Realtime으로 수신자에게 알림]

    U --> V[수신자 화면에 알림]
    V --> W[축하 애니메이션]
    W --> X[선물 상세 표시]
    X --> Y[자동 감사 메시지 전송]

    Y --> Z[발신자에게 확인]
    Z --> AA[선물 완료]

    AA --> AB[매장 주문 큐 추가]
    AB --> AC[종업원에게 알림]
    AC --> AD{매장 POS 연동?}
    AD -->|연동됨| AE[자동 주문 입력]
    AD -->|미연동| AF[수동 주문 입력]

    AE --> AG[주문 완료]
    AF --> AG

    style P fill:#FFD60A
    style AA fill:#06FFA5
    style Q fill:#FF006E

```

### 5.1 선물 옵션

**메뉴 아이템:**

- 매장이 등록한 메뉴에서 선택
- 가격 표시
- 이미지 (있는 경우)
- 카테고리: 술, 안주, 디저트 등

**포인트:**

- 고정 금액: ¥500, ¥1000, ¥2000, ¥5000
- 수신자가 자유롭게 사용 가능

### 5.2 결제 흐름

1. 선물 선택
2. 결제 정보 입력 (일회성, 저장 안 함)
3. PG사 결제 처리
4. 결제 완료 → Webhook
5. DB에 거래 기록
6. 수신자에게 실시간 알림

---

## 6. 관리자 플로우 (가맹점)

```mermaid
graph TD
    A[관리자 로그인] --> B{Supabase Auth}
    B -->|실패| C[에러: 로그인 실패]
    B -->|성공| D[관리자 대시보드]

    D --> E[메뉴]
    D --> F[주문 관리]
    D --> G[정산]
    D --> H[설정]

    E --> E1[메뉴 목록]
    E1 --> E2[메뉴 추가]
    E1 --> E3[메뉴 수정]
    E1 --> E4[메뉴 삭제]

    E2 --> E5[이름, 가격, 카테고리 입력]
    E5 --> E6[API: POST /api/admin/menus]
    E6 --> E7{성공?}
    E7 -->|예| E1
    E7 -->|아니오| E8[에러 표시]

    F --> F1[실시간 주문 목록]
    F1 --> F2{새 선물 주문?}
    F2 -->|예| F3[알림 + 리스트 업데이트]
    F2 -->|아니오| F1
    F3 --> F4[주문 상세 보기]
    F4 --> F5[주문 완료 처리]

    G --> G1[기간 선택]
    G1 --> G2[일별/월별 선택]
    G2 --> G3[API: GET /api/admin/settlements]
    G3 --> G4[정산 내역 표시]
    G4 --> G5[거래 건수, 총 금액, 수수료]

    H --> H1[매장 정보 수정]
    H --> H2[QR 코드 재발급]
    H --> H3[영업시간 설정]

    style D fill:#8338EC
    style G4 fill:#06FFA5

```

---

## 7. 에러 및 예외 처리 플로우

```mermaid
graph TD
    A[사용자 액션] --> B{네트워크 연결?}
    B -->|끊김| C[오프라인 알림]
    B -->|정상| D[API 요청]

    D --> E{응답 상태?}
    E -->|200 OK| F[정상 처리]
    E -->|400 Bad Request| G[입력 오류 안내]
    E -->|401 Unauthorized| H[세션 만료 → 재로그인]
    E -->|403 Forbidden| I[권한 없음 안내]
    E -->|429 Too Many Requests| J[잠시 후 다시 시도]
    E -->|500 Server Error| K[서버 오류 안내]

    G --> L[사용자 입력 재요청]
    H --> M[QR 재스캔 안내]
    I --> N[에러 메시지 표시]
    J --> O[재시도 타이머]
    K --> P[관리자에게 알림]

    C --> Q{재연결 시도}
    Q -->|성공| D
    Q -->|실패| R[오프라인 모드 안내]

    style F fill:#06FFA5
    style K fill:#FF006E
    style H fill:#FFD60A

```

---

## 8. 세션 생명주기

```mermaid
graph TD
    A[QR 스캔] --> B[세션 생성]
    B --> C{세션 활성}

    C --> D[사용자 활동]
    D --> E{활동 있음?}
    E -->|예| F[updated_at 갱신]
    E -->|아니오| G[Idle 카운트]

    F --> C

    G --> H{Idle 시간}
    H -->|< 1시간| C
    H -->|1-2시간| I[경고: 곧 종료됨]
    H -->|> 2시간| J[자동 세션 종료]

    I --> K{사용자 반응?}
    K -->|활동 재개| F
    K -->|반응 없음| J

    C --> L[매장 떠나기 클릭]
    L --> M{확인?}
    M -->|아니오| C
    M -->|예| J

    J --> N[세션 종료 처리]
    N --> O[관련 메시지 삭제]
    O --> P[세션 레코드 삭제]
    P --> Q[쿠키 삭제]
    Q --> R[종료 완료]

    style B fill:#06FFA5
    style R fill:#FF006E

```

---

## 9. 실시간 알림 플로우

```mermaid
graph TD
    A[Supabase Realtime 구독] --> B{이벤트 타입}

    B -->|새 메시지| C[messages 테이블 INSERT]
    B -->|새 선물| D[gifts 테이블 INSERT]
    B -->|세션 상태 변경| E[sessions 테이블 UPDATE]

    C --> F[메시지 필터링]
    F --> G{내가 수신자?}
    G -->|예| H[UI 업데이트]
    G -->|아니오| I[무시]

    D --> J[선물 알림]
    J --> K[축하 애니메이션]
    K --> L[선물 상세 표시]

    E --> M{변경 내용?}
    M -->|is_active = false| N[상대방 퇴장 알림]
    M -->|profile 변경| O[무시]

    H --> P[소리 + 진동]
    P --> Q[배지 카운트 증가]
    Q --> R[메시지 리스트 갱신]

    L --> S[감사 메시지 자동 전송]

    style H fill:#06FFA5
    style K fill:#FFD60A

```

---

## 10. 보안 및 필터링 플로우

```mermaid
graph TD
    A[메시지 전송 요청] --> B[프론트엔드 검증]
    B --> C{길이 체크}
    C -->|200자 초과| D[에러: 글자수 초과]
    C -->|정상| E[API 전송]

    E --> F[백엔드 검증]
    F --> G{세션 유효?}
    G -->|아니오| H[401 Unauthorized]
    G -->|예| I{차단된 사용자?}
    I -->|예| J[403 Forbidden]
    I -->|아니오| K[AI 필터 호출]

    K --> L[OpenAI Moderation API]
    L --> M{부적절 판정?}

    M -->|예| N[카테고리 확인]
    N --> O{심각도}
    O -->|경미| P[1차 경고]
    O -->|중간| Q[2차 경고]
    O -->|심각| R[즉시 세션 정지]

    P --> S[경고 횟수 기록]
    Q --> S
    S --> T{누적 경고}
    T -->|< 3회| U[경고 메시지 표시]
    T -->|>= 3회| R

    M -->|아니오| V[Supabase 저장]
    V --> W[Realtime 전송]

    R --> X[관리자에게 알림]
    X --> Y[세션 블록 (24시간)]

    style R fill:#FF006E
    style W fill:#06FFA5
    style L fill:#FFD60A

```

---

## 11. 결제 및 정산 플로우

```mermaid
graph TD
    A[선물 선택] --> B[결제 페이지]
    B --> C[PG사 Checkout]
    C --> D{결제 결과}

    D -->|성공| E[Webhook 수신]
    D -->|실패| F[실패 페이지]
    D -->|취소| G[취소 페이지]

    F --> H[재시도 안내]
    G --> I[대화로 복귀]

    E --> J[거래 검증]
    J --> K{유효한 결제?}
    K -->|아니오| L[에러 로그]
    K -->|예| M[gifts 테이블 저장]

    M --> N[정산 테이블 업데이트]
    N --> O{정산 로직}
    O --> P[플랫폼 수수료 계산]
    O --> Q[가맹점 정산 금액 계산]

    P --> R[수수료율: 10-12% or 15-20%]
    R --> S[플랫폼 수익 기록]

    Q --> T[가맹점 정산 누적]
    T --> U[일일 정산 집계]

    U --> V{정산일?}
    V -->|매월 말일| W[월 정산 생성]
    V -->|아님| X[대기]

    W --> Y[정산서 생성]
    Y --> Z[가맹점에게 이메일 발송]
    Z --> AA[입금 처리]

    style E fill:#06FFA5
    style L fill:#FF006E
    style AA fill:#8338EC

```

---

## 12. 주요 화면 전환 흐름

```mermaid
graph LR
    A[스플래시] --> B[QR 스캔]
    B --> C[프로필 입력]
    C --> D[대시보드]

    D --> E[테이블 탐색]
    D --> F[메시지함]
    D --> G[받은 선물]

    E --> H[테이블 상세]
    H --> I[대화 화면]

    F --> I

    I --> J[선물하기]
    J --> K[결제]
    K --> I

    I --> L[차단 확인]
    L --> D

    D --> M[설정]
    M --> D

    D --> N[매장 떠나기]
    N --> O[종료]

    style D fill:#8338EC
    style I fill:#06FFA5
    style O fill:#FF006E

```

---

## 13. 플로우 요약

### 13.1 핵심 사용자 여정

1. **온보딩:** QR 스캔 → 프로필 입력 (30초)
2. **탐색:** 테이블 리스트 확인 → 관심 테이블 선택
3. **소통:** 메시지 전송 → 실시간 대화
4. **선물:** 선물 선택 → 결제 → 축하 애니메이션
5. **퇴장:** 매장 떠나기 → 세션 정리

### 13.2 평균 소요 시간

- 온보딩: 30초
- 메시지 작성/전송: 10초
- 선물하기: 1-2분
- 전체 세션: 30분-2시간

### 13.3 주요 의사결정 지점

- 프로필 입력 완료 여부
- 메시지 전송 전 AI 필터 통과
- 선물 결제 성공/실패
- 차단 확인
- 세션 종료 확인

---

**문서 작성자:** wj

**문서 버전:** v1.0

**최종 수정일:** 2026-01-18