'use client';

import { useParams, useRouter, usePathname } from 'next/navigation';
import { useSessionStore } from '@/lib/stores/sessionStore';

export function MerchantAdminSidebar() {
  const params = useParams<{ merchant: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const { clearSession } = useSessionStore();

  const merchantSlug = params.merchant;

  const navItems = [
    {
      label: '대시보드',
      href: `/${merchantSlug}/admin/dashboard`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
    },
    {
      label: '메뉴 관리',
      href: `/${merchantSlug}/admin/menus`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: '주문 확인',
      href: `/${merchantSlug}/admin/orders`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      label: '정산 내역',
      href: `/${merchantSlug}/admin/settlements`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: '테이블 관리',
      href: `/${merchantSlug}/admin/tables`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
    },
    {
      label: '가게 설정',
      href: `/${merchantSlug}/admin/settings`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        </svg>
      ),
    },
  ];

  const handleLogout = async () => {
    if (!confirm('정말 로그아웃하시겠습니까?')) return;

    clearSession();
    router.push(`/${merchantSlug}/admin/login`);
  };

  const handleBackToStore = () => {
    router.push(`/${merchantSlug}`);
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-void border-r border-steel/30 z-20">
      {/* Logo */}
      <div className="p-6 border-b border-steel/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
            <span className="text-white font-display text-lg">TC</span>
          </div>
          <div>
            <p className="text-soft-white font-medium">가게 관리</p>
            <p className="text-xs text-muted">{merchantSlug}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <a
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-neon-pink to-neon-purple text-white shadow-lg shadow-neon-pink/40'
                  : 'text-muted hover:text-soft-white hover:bg-steel/20'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </a>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-steel/30 space-y-2">
        <button
          onClick={handleBackToStore}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted hover:text-soft-white hover:bg-steel/20 transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 00-1 1v3a1 1 0 001 1h2a1 1 0 001-1v-3" />
          </svg>
          <span>가게로 돌아가기</span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4 4m4-4v12M9 12h.01M12 9v2m0-2h.01M7 21a2 2 0 01-2-2V5a2 2 0 012-2h5l-1 1M6 21V10l-6-7-6 7" />
          </svg>
          <span>로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
