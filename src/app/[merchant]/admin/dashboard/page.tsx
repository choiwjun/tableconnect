'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MerchantAdminSidebar, StatCard } from '@/components/admin';
import { Spinner, Card } from '@/components/ui';
import { formatPrice } from '@/lib/utils';
import { useSessionStore } from '@/lib/stores/sessionStore';

interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  todayGifts: number;
  activeSessions: number;
  pendingOrders: number;
  monthlyRevenue: number;
  lastMonthRevenue: number;
  monthOverMonthGrowth: number;
}

export default function MerchantAdminDashboardPage() {
  const params = useParams<{ merchant: string }>();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { merchantId } = useSessionStore();

  const merchantSlug = params.merchant;

  useEffect(() => {
    async function fetchStats() {
      if (!merchantId) {
        setError('관리자 권한이 필요합니다');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/merchants/${merchantSlug}/admin/stats`);
        
        if (!response.ok) {
          throw new Error('데이터 가져오기 실패');
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Dashboard error:', err);
        setError('통계 데이터를 가져오는 중 오류가 발생했습니다');
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [merchantSlug, merchantId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push(`/${merchantSlug}/admin/login`)}
            className="btn-primary px-6 py-2"
          >
            로그인 페이지로
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex">
      <MerchantAdminSidebar />

      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-display text-soft-white mb-2">
              가게 대시보드
            </h1>
            <p className="text-muted">
              {merchantSlug}의 운영 현황 및 통계 정보
            </p>
          </div>

          {stats && (
            <>
              {/* Today's Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="오늘 매출"
                  value={formatPrice(stats.todayRevenue)}
                  variant="success"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />

                <StatCard
                  title="오늘 주문"
                  value={stats.todayOrders}
                  variant="default"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  }
                />

                <StatCard
                  title="오늘 선물"
                  value={stats.todayGifts}
                  variant="success"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                  }
                />

                <StatCard
                  title="현재 방문자"
                  value={stats.activeSessions}
                  variant="default"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  }
                />
              </div>

              {/* Monthly Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <Card className="p-6">
                  <h2 className="text-lg font-display text-soft-white mb-4">
                    이번 달 매출
                  </h2>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-display text-soft-white mb-1">
                        {formatPrice(stats.monthlyRevenue)}
                      </p>
                      <p className="text-sm text-muted">
                        지난달: {formatPrice(stats.lastMonthRevenue)}
                      </p>
                    </div>
                    <div className={`text-right ${stats.monthOverMonthGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      <p className="text-xl font-bold">
                        {stats.monthOverMonthGrowth >= 0 ? '+' : ''}{stats.monthOverMonthGrowth.toFixed(1)}%
                      </p>
                      <p className="text-xs">
                        {stats.monthOverMonthGrowth >= 0 ? '증가' : '감소'}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h2 className="text-lg font-display text-soft-white mb-4">
                    대기 중 주문
                  </h2>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-display text-yellow-400 mb-1">
                        {stats.pendingOrders}
                      </p>
                      <p className="text-sm text-muted">
                        처리 필요
                      </p>
                    </div>
                    <button
                      onClick={() => router.push(`/${merchantSlug}/admin/orders`)}
                      className="px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                    >
                      확인하기 →
                    </button>
                  </div>
                </Card>

                <Card className="p-6">
                  <h2 className="text-lg font-display text-soft-white mb-4">
                    퀵 액션
                  </h2>
                  <div className="space-y-2">
                    <button
                      onClick={() => router.push(`/${merchantSlug}/admin/orders`)}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-steel/10 hover:bg-steel/20 transition-colors"
                    >
                      <span className="text-soft-white">주문 확인</span>
                      <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => router.push(`/${merchantSlug}/admin/menus`)}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-steel/10 hover:bg-steel/20 transition-colors"
                    >
                      <span className="text-soft-white">메뉴 관리</span>
                      <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => router.push(`/${merchantSlug}/admin/settlements`)}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-steel/10 hover:bg-steel/20 transition-colors"
                    >
                      <span className="text-soft-white">정산 내역</span>
                      <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
