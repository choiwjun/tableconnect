'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n/context';

const LANGUAGES = [
  { code: 'ja-JP', name: '日本語', flag: '🇯🇵' },
  { code: 'ko-KR', name: '한국어', flag: '🇰🇷' },
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
];

export function ChatLanguageSelector() {
  const { locale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string>('ja-JP');

  // 초기 언어 설정 로드
  useState(() => {
    const savedLang = localStorage.getItem('chat-preferred-language') || locale;
    if (savedLang && LANGUAGES.find(l => l.code === savedLang)) {
      setSelectedLang(savedLang);
    }
  }, [locale]);

  // 언어 변경
  const handleLanguageChange = (newLang: string) => {
    setSelectedLang(newLang);
    
    // 로컬 스토리지에 저장
    localStorage.setItem('chat-preferred-language', newLang);
    
    // 이벤트 디스패치
    const event = new CustomEvent('language-change', {
      detail: { language: newLang },
    });
    window.dispatchEvent(event);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const currentLang = LANGUAGES.find(l => l.code === selectedLang);

  return (
    <>
      {/* 트리거 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed bottom-24 right-4 z-50
          flex items-center gap-2 px-4 py-2.5
          rounded-full glass-panel
          border border-steel/30
          hover:border-neon-cyan/50 hover:bg-neon-cyan/10
          transition-all duration-300
          ${isOpen ? 'ring-2 ring-neon-cyan/50' : ''}
        `}
      >
        <span className="text-xl">{currentLang?.flag || '🌐'}</span>
        <span className="text-sm font-medium text-soft-white">
          {currentLang?.name || 'Select Language'}
        </span>
      </button>

      {/* 언어 선택 모달 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          onClick={handleClose}
        >
          {/* 배경 */}
          <div className="fixed inset-0 bg-void/80 backdrop-blur-sm" />
          
          {/* 모달 */}
          <div 
            className="relative w-80 max-w-[90vw] glass-panel rounded-2xl border border-steel/30 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-steel/20">
              <h3 className="font-display text-xl text-soft-white">
                Language / 言語
              </h3>
              <button
                onClick={handleClose}
                className="text-muted hover:text-soft-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 언어 리스트 */}
            <div className="p-6 space-y-3">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`
                    w-full p-4 rounded-xl border-2 transition-all duration-200
                    flex items-center gap-4
                    ${selectedLang === lang.code
                      ? 'bg-neon-cyan/20 border-neon-cyan/50 shadow-lg shadow-neon-cyan/20'
                      : 'bg-midnight/30 border-steel/30 hover:border-neon-cyan/50 hover:bg-neon-cyan/5'
                    }
                  `}
                >
                  {/* 언어 플래그 */}
                  <span className="text-2xl">{lang.flag}</span>

                  {/* 언어 이름 */}
                  <div className="flex-1 text-left">
                    <span className="block text-lg font-medium text-soft-white">
                      {lang.name}
                    </span>
                    <span className="block text-sm text-muted">
                      {lang.code}
                    </span>
                  </div>

                  {/* 선택 표시 */}
                  {selectedLang === lang.code && (
                    <div className="w-5 h-5 rounded-full bg-neon-cyan flex items-center justify-center">
                      <svg className="w-3 h-3 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* 하단 설명 */}
            <div className="p-4 border-t border-steel/20">
              <p className="text-xs text-muted text-center leading-relaxed">
                Select language for chat translation
                <br />
                <span className="text-neon-cyan">Auto-translate</span> messages
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// 커스텀 이벤트 타입
interface LanguageChangeEvent {
  detail: {
    language: string;
  };
}

declare global {
  interface WindowEventMap {
    'language-change': CustomEvent<LanguageChangeEvent>;
  }
}
