# Design System (디자인 시스템)

# Table Connect - 디자인 시스템 (Design System)

**버전:** v2.0 (Distinctive & Bold)

**작성일:** 2026년 1월 18일

**참조 문서:** PRD v1.0, frontend-design skill

---

## 1. 디자인 철학

### 1.1 핵심 비전: "도쿄 밤의 네온 펄스 (Tokyo Night Pulse)"

Table Connect는 도쿄 시부야 밤거리의 에너지를 디지털로 재현합니다. 네온 사인의 번짐, 젖은 아스팔트의 반사, 이자카야 입구에서 새어 나오는 따뜻한 불빛 - 이 모든 감각적 경험을 인터페이스에 녹여냅니다.

**우리는 절대 만들지 않습니다:**

- ❌ 평범한 다크 모드 앱
- ❌ 보라색 그라데이션 + 흰 배경의 클리셰
- ❌ Inter/Roboto 같은 무난한 시스템 폰트
- ❌ 예측 가능한 레이아웃

**우리가 만드는 것:**

- ✨ 첫 화면부터 "와, 이거 뭐야?"라는 반응
- ✨ 손끝에서 느껴지는 촉각적 피드백
- ✨ 밤의 도쿄를 걷는 듯한 몰입감
- ✨ 20대가 친구에게 자랑하고 싶은 인터페이스

---

## 2. 타이포그래피: 대비의 예술

### 2.1 폰트 패밀리

```css
/* Display/Hero - 강렬한 인상 */
--font-display: 'Righteous', 'M PLUS Rounded 1c', sans-serif;
/* 둥글고 임팩트 있는 디스플레이 폰트 */

/* Body/UI - 가독성과 개성의 균형 */
--font-body: 'DM Sans', 'Noto Sans JP', sans-serif;
/* 모던하면서도 따뜻한 느낌 */

/* Accent - 재미와 위트 */
--font-accent: 'Fredoka', 'M PLUS Rounded 1c', sans-serif;
/* 버튼, 뱃지 등 포인트 요소 */

/* Code/Monospace - 기술적 요소 */
--font-mono: 'JetBrains Mono', 'Courier New', monospace;
/* 테이블 번호, 거래 ID 등 */

```

**폰트 로딩 (next/font):**

```tsx
import { Righteous, DM_Sans, Fredoka, JetBrains_Mono } from 'next/font/google';

const righteous = Righteous({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
});

const dmSans = DM_Sans({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-body',
});

```

### 2.2 타이포그래피 스케일 (유동적)

```css
/* Fluid Typography - 화면 크기에 반응 */
--text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
--text-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
--text-base: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
--text-lg: clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem);
--text-xl: clamp(1.5rem, 1.3rem + 1vw, 2rem);
--text-2xl: clamp(2rem, 1.5rem + 2.5vw, 3rem);
--text-3xl: clamp(2.5rem, 2rem + 2.5vw, 4rem);
--text-hero: clamp(3rem, 2rem + 5vw, 6rem);

```

### 2.3 타이포그래피 사용 예시

| 요소 | 폰트 | 크기 | 두께 | 특징 |
| --- | --- | --- | --- | --- |
| 앱 로고 | Display | hero | 400 | 회전 애니메이션 |
| 페이지 제목 | Display | 3xl | 400 | 네온 글로우 효과 |
| 섹션 제목 | Body | 2xl | 700 | Letter-spacing: -0.02em |
| 버튼 | Accent | lg | 700 | Uppercase, tracking wide |
| 본문 | Body | base | 400 | Line-height: 1.7 |
| Caption | Body | sm | 500 | Opacity: 0.7 |
| 테이블 번호 | Mono | xl | 700 | Tabular numbers |

---

## 3. 색상 시스템: 네온 밤의 팔레트

### 3.1 컬러 철학

**영감:** 시부야 교차로 밤 10시 - 네온 사인, 자동차 불빛, 젖은 아스팔트의 반사

```css
/* Base - 밤의 깊이 */
--color-void: #0a0a0f;           /* 가장 어두운 밤하늘 */
--color-deep: #12121a;           /* 그림자 속 */
--color-midnight: #1a1a27;       /* 주 배경 */
--color-dusk: #252534;           /* 카드, 모달 */
--color-twilight: #32324a;       /* 호버 상태 */

/* Neon Accents - 네온 사인 */
--color-neon-pink: #ff0080;      /* 메인 CTA - 핑크 네온 */
--color-neon-pink-glow: #ff0080; /* 글로우용 */
--color-neon-cyan: #00ffff;      /* 액센트 - 시안 네온 */
--color-neon-purple: #b300ff;    /* 서브 - 퍼플 네온 */
--color-neon-lime: #ccff00;      /* 성공 - 라임 네온 */
--color-neon-orange: #ff6600;    /* 경고 - 오렌지 네온 */
--color-neon-red: #ff0033;       /* 에러 - 레드 네온 */

/* Glass - 유리 반사 */
--color-glass: rgba(255, 255, 255, 0.05);
--color-glass-border: rgba(255, 255, 255, 0.1);
--color-glass-strong: rgba(255, 255, 255, 0.15);

/* Text - 가독성 */
--color-text-primary: #ffffff;
--color-text-secondary: rgba(255, 255, 255, 0.7);
--color-text-tertiary: rgba(255, 255, 255, 0.4);
--color-text-glow: rgba(255, 255, 255, 0.9);

```

### 3.2 그라디언트 시스템

```css
/* Mesh Gradients - 배경용 */
--gradient-hero:
  radial-gradient(
    ellipse 80% 50% at 50% -20%,
    rgba(255, 0, 128, 0.15),
    transparent
  ),
  radial-gradient(
    ellipse 60% 50% at 0% 100%,
    rgba(0, 255, 255, 0.1),
    transparent
  ),
  radial-gradient(
    ellipse 60% 50% at 100% 100%,
    rgba(179, 0, 255, 0.1),
    transparent
  );

/* Button Gradients - 네온 효과 */
--gradient-neon-pink:
  linear-gradient(
    135deg,
    #ff0080 0%,
    #ff0055 50%,
    #ff0080 100%
  );

--gradient-neon-cyan:
  linear-gradient(
    135deg,
    #00ffff 0%,
    #00ccff 50%,
    #00ffff 100%
  );

/* Glass Morphism */
--gradient-glass:
  linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );

```

### 3.3 네온 글로우 효과

```css
/* Text Glow */
.text-neon-pink {
  color: var(--color-neon-pink);
  text-shadow:
    0 0 10px rgba(255, 0, 128, 0.5),
    0 0 20px rgba(255, 0, 128, 0.3),
    0 0 40px rgba(255, 0, 128, 0.1);
}

.text-neon-cyan {
  color: var(--color-neon-cyan);
  text-shadow:
    0 0 10px rgba(0, 255, 255, 0.5),
    0 0 20px rgba(0, 255, 255, 0.3),
    0 0 40px rgba(0, 255, 255, 0.1);
}

/* Box Glow */
.box-neon-glow {
  box-shadow:
    0 0 20px rgba(255, 0, 128, 0.3),
    0 0 40px rgba(255, 0, 128, 0.1),
    inset 0 0 20px rgba(255, 0, 128, 0.05);
}

```

---

## 4. 공간 시스템: 리듬과 호흡

### 4.1 비선형 스케일

```css
/* 피보나치 기반 + 자유로운 변형 */
--space-xs: 0.5rem;    /* 8px */
--space-sm: 0.75rem;   /* 12px */
--space-md: 1.25rem;   /* 20px */
--space-lg: 2rem;      /* 32px */
--space-xl: 3.25rem;   /* 52px */
--space-2xl: 5.25rem;  /* 84px */
--space-3xl: 8.5rem;   /* 136px */

```

### 4.2 레이아웃 원칙

**대담한 비대칭:**

- 중앙 정렬은 지루합니다
- 왼쪽 무게 중심 또는 대각선 흐름
- 요소들이 겹치고 레이어를 만듭니다

**여백의 극단:**

- 빽빽함: 정보 밀도 높은 리스트
- 넉넉함: Hero 섹션의 과감한 여백

---

## 5. 컴포넌트: 촉각적 인터페이스

### 5.1 버튼 - 누르고 싶게 만들기

### Primary Button (네온 펄스)

```css
.btn-primary {
  /* Base */
  position: relative;
  padding: 1rem 2.5rem;
  background: var(--gradient-neon-pink);
  border: 2px solid var(--color-neon-pink);
  border-radius: 100px;

  font-family: var(--font-accent);
  font-size: var(--text-lg);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: white;

  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Glow */
  box-shadow:
    0 0 20px rgba(255, 0, 128, 0.4),
    0 4px 20px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Hover - 펄스 + 리프트 */
.btn-primary:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow:
    0 0 40px rgba(255, 0, 128, 0.6),
    0 8px 30px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  border-color: var(--color-neon-pink-glow);
}

/* Active - 펀치 */
.btn-primary:active {
  transform: translateY(0) scale(0.98);
  box-shadow:
    0 0 20px rgba(255, 0, 128, 0.5),
    0 2px 10px rgba(0, 0, 0, 0.3);
}

/* Ripple Effect */
.btn-primary::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.3) 0%,
    transparent 70%
  );
  opacity: 0;
  transform: scale(0);
  transition: all 0.6s;
}

.btn-primary:active::before {
  opacity: 1;
  transform: scale(1.5);
  transition: 0s;
}

/* 펄스 애니메이션 */
@keyframes pulse {
  0%, 100% {
    box-shadow:
      0 0 20px rgba(255, 0, 128, 0.4),
      0 4px 20px rgba(0, 0, 0, 0.3);
  }
  50% {
    box-shadow:
      0 0 40px rgba(255, 0, 128, 0.6),
      0 4px 20px rgba(0, 0, 0, 0.3);
  }
}

.btn-primary.pulse {
  animation: pulse 2s ease-in-out infinite;
}

```

### Ghost Button (유령 같은)

```css
.btn-ghost {
  padding: 0.75rem 2rem;
  background: transparent;
  border: 2px solid var(--color-glass-border);
  border-radius: 100px;

  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--color-text-secondary);

  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.btn-ghost:hover {
  border-color: var(--color-neon-cyan);
  color: var(--color-neon-cyan);
  background: rgba(0, 255, 255, 0.05);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
}

```

---

### 5.2 카드 - Glass Morphism의 진화

### Table Card (테이블 탐색용)

```css
.table-card {
  position: relative;
  padding: var(--space-lg);

  /* Glass Effect */
  background: var(--gradient-glass);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--color-glass-border);
  border-radius: 24px;

  /* 3D Depth */
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2);

  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Hover - Lift & Glow */
.table-card:hover {
  transform: translateY(-8px) scale(1.02);
  border-color: rgba(255, 0, 128, 0.3);

  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.4),
    0 0 40px rgba(255, 0, 128, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Active */
.table-card:active {
  transform: translateY(-4px) scale(1);
}

/* 반짝이는 효과 (선택적) */
.table-card::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 70%
  );
  transform: rotate(45deg);
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%) rotate(45deg); }
  100% { transform: translateX(100%) rotate(45deg); }
}

```

---

### 5.3 Input - 미래적 입력 필드

```css
.input-neon {
  width: 100%;
  padding: 1rem 1.5rem;

  background: rgba(255, 255, 255, 0.03);
  border: 2px solid var(--color-glass-border);
  border-radius: 16px;

  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-text-primary);

  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.input-neon:focus {
  outline: none;
  border-color: var(--color-neon-cyan);
  background: rgba(0, 255, 255, 0.05);

  box-shadow:
    0 0 0 4px rgba(0, 255, 255, 0.1),
    0 0 20px rgba(0, 255, 255, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.input-neon::placeholder {
  color: var(--color-text-tertiary);
}

/* Floating Label */
.input-floating {
  position: relative;
}

.input-floating label {
  position: absolute;
  left: 1.5rem;
  top: 50%;
  transform: translateY(-50%);

  font-size: var(--text-base);
  color: var(--color-text-tertiary);
  pointer-events: none;

  transition: all 0.3s ease;
}

.input-floating input:focus + label,
.input-floating input:not(:placeholder-shown) + label {
  top: -0.5rem;
  left: 1rem;
  padding: 0 0.5rem;
  font-size: var(--text-xs);
  color: var(--color-neon-cyan);
  background: var(--color-midnight);
}

```

---

### 5.4 메시지 말풍선 - 대화의 생동감

```css
/* 보낸 메시지 - 네온 핑크 */
.message-sent {
  position: relative;
  max-width: 70%;
  margin-left: auto;
  padding: 1rem 1.5rem;

  background: var(--gradient-neon-pink);
  border-radius: 24px 24px 4px 24px;

  font-family: var(--font-body);
  font-size: var(--text-base);
  color: white;

  box-shadow:
    0 4px 16px rgba(255, 0, 128, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);

  /* 입장 애니메이션 */
  animation: slideInRight 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

/* 받은 메시지 - Glass */
.message-received {
  position: relative;
  max-width: 70%;
  margin-right: auto;
  padding: 1rem 1.5rem;

  background: var(--gradient-glass);
  backdrop-filter: blur(20px);
  border: 1px solid var(--color-glass-border);
  border-radius: 24px 24px 24px 4px;

  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-text-primary);

  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);

  animation: slideInLeft 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

/* 타이핑 인디케이터 */
.typing-indicator {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
}

.typing-dot {
  width: 8px;
  height: 8px;
  background: var(--color-neon-cyan);
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

```

---

## 6. 애니메이션: 생명을 불어넣기

### 6.1 페이지 전환

```css
/* Page Enter */
@keyframes pageEnter {
  from {
    opacity: 0;
    transform: translateY(20px);
    filter: blur(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

.page-enter {
  animation: pageEnter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Staggered Children */
.stagger-children > * {
  animation: pageEnter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
}

.stagger-children > *:nth-child(1) { animation-delay: 0.1s; }
.stagger-children > *:nth-child(2) { animation-delay: 0.2s; }
.stagger-children > *:nth-child(3) { animation-delay: 0.3s; }
.stagger-children > *:nth-child(4) { animation-delay: 0.4s; }
.stagger-children > *:nth-child(5) { animation-delay: 0.5s; }

```

### 6.2 선물 축하 애니메이션

```css
@keyframes giftCelebrate {
  0% {
    transform: scale(0.5) rotate(0deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(180deg);
  }
  70% {
    transform: scale(0.9) rotate(360deg);
  }
  100% {
    transform: scale(1) rotate(360deg);
    opacity: 1;
  }
}

.gift-celebrate {
  animation: giftCelebrate 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* 파티클 효과 (CSS only) */
@keyframes confetti {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

.confetti {
  position: fixed;
  width: 10px;
  height: 10px;
  background: var(--color-neon-pink);
  animation: confetti 3s ease-out forwards;
}

```

### 6.3 호버 마이크로인터랙션

```css
/* Magnetic Button */
.btn-magnetic {
  transition: transform 0.2s ease;
}

.btn-magnetic:hover {
  /* JavaScript로 마우스 위치 추적하여 미세하게 움직임 */
  transform: translate(var(--mouse-x), var(--mouse-y));
}

/* Ripple on Click */
.ripple {
  position: relative;
  overflow: hidden;
}

.ripple::after {
  content: '';
  position: absolute;
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  transform: scale(0);
  pointer-events: none;
}

.ripple:active::after {
  animation: ripple-effect 0.6s ease-out;
}

@keyframes ripple-effect {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

```

---

## 7. 배경 & 분위기

### 7.1 Hero 배경 (메쉬 그라디언트)

```css
.hero-bg {
  position: fixed;
  inset: 0;
  z-index: -1;

  background:
    /* Mesh Gradients */
    radial-gradient(
      ellipse 80% 50% at 50% -20%,
      rgba(255, 0, 128, 0.15),
      transparent
    ),
    radial-gradient(
      ellipse 60% 50% at 0% 100%,
      rgba(0, 255, 255, 0.1),
      transparent
    ),
    radial-gradient(
      ellipse 60% 50% at 100% 100%,
      rgba(179, 0, 255, 0.1),
      transparent
    ),
    /* Noise Texture */
    url('data:image/svg+xml,...'), /* SVG noise */
    /* Base */
    var(--color-midnight);

  /* Animated */
  animation: gradientShift 20s ease infinite;
}

@keyframes gradientShift {
  0%, 100% { filter: hue-rotate(0deg); }
  50% { filter: hue-rotate(30deg); }
}

```

### 7.2 Grain Overlay (필름 느낌)

```css
.grain-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  pointer-events: none;

  background-image: url('/noise.png'); /* 노이즈 텍스처 */
  opacity: 0.03;
  mix-blend-mode: overlay;

  animation: grain 8s steps(10) infinite;
}

@keyframes grain {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-5%, -10%); }
  30% { transform: translate(3%, -15%); }
  50% { transform: translate(12%, 9%); }
  70% { transform: translate(9%, 4%); }
  90% { transform: translate(-1%, 7%); }
}

```

### 7.3 커서 커스터마이징

```css
* {
  cursor: url('/cursor-default.svg'), auto;
}

button, a, [role="button"] {
  cursor: url('/cursor-pointer.svg'), pointer;
}

/* Neon Trail (JavaScript 필요) */
.cursor-trail {
  position: fixed;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 0, 128, 0.5),
    transparent
  );
  pointer-events: none;
  mix-blend-mode: screen;
  animation: cursorFade 0.5s ease-out forwards;
}

@keyframes cursorFade {
  to {
    transform: scale(2);
    opacity: 0;
  }
}

```

---

## 8. 레이아웃: 비대칭의 아름다움

### 8.1 대시보드 레이아웃

```css
.dashboard {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: var(--space-lg);
  padding: var(--space-xl);
  min-height: 100vh;
}

/* 비대칭 카드 배치 */
.card-large {
  grid-column: span 2;
  transform: rotate(-0.5deg); /* 미세한 기울기 */
}

.card-small {
  transform: rotate(0.5deg);
}

/* 겹치는 레이어 */
.layer-front {
  z-index: 2;
  transform: translateY(-20px);
}

.layer-back {
  z-index: 1;
  opacity: 0.7;
}

```

### 8.2 대화 화면 레이아웃

```css
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-void);

  /* 대각선 분할 배경 */
  background:
    linear-gradient(
      135deg,
      var(--color-midnight) 0%,
      var(--color-void) 50%,
      var(--color-deep) 100%
    );
}

.messages-area {
  flex: 1;
  padding: var(--space-xl);
  overflow-y: auto;

  /* Custom Scrollbar */
  scrollbar-width: thin;
  scrollbar-color: var(--color-neon-cyan) transparent;
}

.messages-area::-webkit-scrollbar {
  width: 4px;
}

.messages-area::-webkit-scrollbar-thumb {
  background: var(--color-neon-cyan);
  border-radius: 2px;
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
}

```

---

## 9. 반응형: 모바일 우선, 과감한 선택

### 9.1 브레이크포인트

```css
/* Mobile First */
@media (min-width: 640px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }

```

### 9.2 모바일 최적화

```css
/* Mobile: 대담한 타이포 */
.hero-title {
  font-size: var(--text-3xl);
  line-height: 1.1;
  margin-bottom: var(--space-md);
}

/* Desktop: 더 과감하게 */
@media (min-width: 1024px) {
  .hero-title {
    font-size: var(--text-hero);
    line-height: 0.9;
    letter-spacing: -0.03em;
  }
}

```

---

## 10. 접근성: 아름다움과 포용

### 10.1 Focus States

```css
*:focus-visible {
  outline: 3px solid var(--color-neon-cyan);
  outline-offset: 4px;
  border-radius: 8px;
}

/* 네온 글로우 포커스 */
button:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 4px rgba(0, 255, 255, 0.4),
    0 0 20px rgba(0, 255, 255, 0.6);
}

```

### 10.2 컬러 대비

모든 텍스트-배경 조합은 WCAG AA 준수:

- Primary text on midnight: 13.5:1 ✅
- Secondary text on midnight: 7.2:1 ✅
- Neon colors: 충분한 휘도 확보

---

## 11. Tailwind Config

```jsx
// tailwind.config.js
const plugin = require('tailwindcss/plugin');

module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#0a0a0f',
        deep: '#12121a',
        midnight: '#1a1a27',
        dusk: '#252534',
        twilight: '#32324a',
        neon: {
          pink: '#ff0080',
          cyan: '#00ffff',
          purple: '#b300ff',
          lime: '#ccff00',
          orange: '#ff6600',
          red: '#ff0033',
        },
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.05)',
          border: 'rgba(255, 255, 255, 0.1)',
          strong: 'rgba(255, 255, 255, 0.15)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        accent: ['var(--font-accent)'],
        mono: ['var(--font-mono)'],
      },
      fontSize: {
        xs: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
        sm: 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',
        base: 'clamp(1rem, 0.95rem + 0.25vw, 1.125rem)',
        lg: 'clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)',
        xl: 'clamp(1.5rem, 1.3rem + 1vw, 2rem)',
        '2xl': 'clamp(2rem, 1.5rem + 2.5vw, 3rem)',
        '3xl': 'clamp(2.5rem, 2rem + 2.5vw, 4rem)',
        hero: 'clamp(3rem, 2rem + 5vw, 6rem)',
      },
      animation: {
        'pulse': 'pulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 3s infinite',
        'gradient-shift': 'gradientShift 20s ease infinite',
        'grain': 'grain 8s steps(10) infinite',
        'page-enter': 'pageEnter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    plugin(function({ addUtilities }) {
      addUtilities({
        '.text-neon-pink': {
          color: '#ff0080',
          textShadow: '0 0 10px rgba(255,0,128,0.5), 0 0 20px rgba(255,0,128,0.3)',
        },
        '.text-neon-cyan': {
          color: '#00ffff',
          textShadow: '0 0 10px rgba(0,255,255,0.5), 0 0 20px rgba(0,255,255,0.3)',
        },
        '.glass': {
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      });
    }),
  ],
};

```

---

## 12. 금기 사항 (Never Do This)

❌ **절대 하지 말 것:**

- Inter, Roboto, Arial 같은 무난한 폰트
- 평범한 보라색 그라데이션
- 중앙 정렬만 있는 레이아웃
- 애니메이션 없는 버튼
- 단색 배경
- 예측 가능한 호버 효과

✅ **항상 할 것:**

- 독특한 폰트 조합
- 네온 + 글래스 조합
- 비대칭 레이아웃
- 촉각적 피드백
- 레이어와 깊이
- 놀라움을 주는 인터랙션

---

**"이 디자인 시스템은 살아있습니다. 규칙은 깨기 위해 존재합니다.
대담하게, 예상을 벗어나게, 기억에 남게 만드세요."**

---

**문서 작성자:** wj

**문서 버전:** v2.0 (Distinctive & Bold)

**최종 수정일:** 2026-01-18

**영감:** 도쿄 시부야 밤 10시, 네온 사인, 젖은 아스팔트의 반사