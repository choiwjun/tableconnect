import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Tokyo Night Pulse 색상 팔레트
      colors: {
        // Background (design.html 기반)
        void: "#0a0a0f",
        midnight: "#1a1a27",
        steel: "#2a2a3d",
        "background-dark": "#080a0c",
        "glass-bg": "rgba(18, 22, 28, 0.6)",
        "glass-border": "rgba(255, 255, 255, 0.08)",
        "card-bg": "#161b22",

        // Accent (Neon) - Primary cyan from design.html
        primary: "#00ffff",
        "neon-pink": "#ff0080",
        "neon-cyan": "#00ffff",
        "neon-purple": "#bf00ff",

        // Text
        silver: "#c0c0c0",
        muted: "#6b7280",
        "soft-white": "#ffffff",

        // Status
        success: "#00ff88",
        warning: "#ffaa00",
        error: "#ff4444",

        // Legacy (for Next.js default)
        background: "var(--background)",
        foreground: "var(--foreground)",
      },

      // 커스텀 폰트 (design.html 기반)
      fontFamily: {
        // Display font for headings/logos
        display: ["Space Grotesk", "Righteous", "system-ui", "sans-serif"],
        // Accent font for buttons/special text
        accent: ["Fredoka", "system-ui", "sans-serif"],
        // Base body font (English fallback)
        body: ["DM Sans", "system-ui", "sans-serif"],
        // Language-specific fonts
        ja: ["Noto Sans JP", "DM Sans", "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Meiryo", "sans-serif"],
        ko: ["Noto Sans KR", "DM Sans", "Apple SD Gothic Neo", "Malgun Gothic", "sans-serif"],
        "zh-cn": ["Noto Sans SC", "DM Sans", "PingFang SC", "Microsoft YaHei", "sans-serif"],
        "zh-tw": ["Noto Sans TC", "DM Sans", "PingFang TC", "Microsoft JhengHei", "sans-serif"],
        en: ["DM Sans", "Space Grotesk", "Segoe UI", "Roboto", "sans-serif"],
      },

      // 커스텀 그림자 (Neon Glow) - design.html 기반
      boxShadow: {
        "neon": "0 0 10px rgba(0, 255, 255, 0.3), 0 0 20px rgba(0, 255, 255, 0.1)",
        "neon-strong": "0 0 15px rgba(0, 255, 255, 0.5), 0 0 30px rgba(0, 255, 255, 0.2)",
        "neon-pink": "0 0 20px rgba(255, 0, 128, 0.3)",
        "neon-pink-lg": "0 0 30px rgba(255, 0, 128, 0.5)",
        "neon-cyan": "0 0 20px rgba(0, 255, 255, 0.3)",
        "neon-cyan-lg": "0 0 30px rgba(0, 255, 255, 0.5)",
        "neon-purple": "0 0 20px rgba(191, 0, 255, 0.3)",
        glass: "0 8px 32px rgba(0, 0, 0, 0.3)",
      },

      // 그라디언트 배경 (design.html 기반)
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },

      // 애니메이션 키프레임
      keyframes: {
        // 페이드 인
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        // 슬라이드 업
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // 슬라이드 다운
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // 펄스 글로우
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(255, 0, 128, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(255, 0, 128, 0.6)" },
        },
        // 시머 (로딩)
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        // 바운스 소프트
        bounceSoft: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        // 스핀 슬로우
        spinSlow: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        // 선물 축하 애니메이션
        celebrate: {
          "0%": { transform: "scale(0) rotate(0deg)", opacity: "0" },
          "50%": { transform: "scale(1.2) rotate(10deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
      },

      // 애니메이션
      animation: {
        fadeIn: "fadeIn 0.3s ease-out",
        slideUp: "slideUp 0.4s ease-out",
        slideDown: "slideDown 0.4s ease-out",
        pulseGlow: "pulseGlow 2s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        bounceSoft: "bounceSoft 1s ease-in-out infinite",
        spinSlow: "spinSlow 3s linear infinite",
        celebrate: "celebrate 0.5s ease-out",
      },

      // 백드롭 블러
      backdropBlur: {
        xs: "2px",
      },

      // 보더 라디우스
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
