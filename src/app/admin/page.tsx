'use client';

import { useState, useEffect } from 'react';
import { AdminSidebar, StatCard } from '@/components/admin';
import { Spinner, Card } from '@/components/ui';
import { formatPrice } from '@/lib/utils';

interface SummaryData {
  summary: {
    totalRevenue: number;
    totalFees: number;
    totalPaid: number;
    pendingAmount: number;
    currentMonthRevenue: number;
    lastMonthRevenue: number;
    monthOverMonthGrowth: number;
    giftsThisMonth: number;
  };
  statusBreakdown: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  chartData: Array<{ date: string; amount: number }>;
}

interface ReportStats {
  total: number;
  pendingCount: number;
  resolvedToday: number;
  weekOverWeekChange: number;
  reasonBreakdown: {
    harassment: number;
    spam: number;
    inappropriate: number;
    other: number;
  };
}

export default function AdminDashboardPage() {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [reportStats, setReportStats] = useState<ReportStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [summaryRes, reportsRes] = await Promise.all([
          fetch('/api/admin/settlements/summary'),
          fetch('/api/admin/reports/stats'),
        ]);

        if (!summaryRes.ok || !reportsRes.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const [summaryJson, reportsJson] = await Promise.all([
          summaryRes.json(),
          reportsRes.json(),
        ]);

        setSummaryData(summaryJson);
        setReportStats(reportsJson);
      } catch (err) {
        console.error('Dashboard error:', err);
        setError('データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="flex">
      <AdminSidebar />

      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-display text-soft-white mb-2">
              ダッシュボード
            </h1>
            <p className="text-muted">
              Table Connect の概要と統計情報
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <Card className="p-8 text-center">
              <p className="text-red-400">{error}</p>
            </Card>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="今月の売上"
                  value={formatPrice(summaryData?.summary.currentMonthRevenue || 0)}
                  change={summaryData?.summary.monthOverMonthGrowth}
                  variant="default"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />

                <StatCard
                  title="今月のギフト数"
                  value={summaryData?.summary.giftsThisMonth || 0}
                  variant="success"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                  }
                />

                <StatCard
                  title="未処理の報告"
                  value={reportStats?.pendingCount || 0}
                  variant={reportStats?.pendingCount && reportStats.pendingCount > 5 ? 'danger' : 'warning'}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  }
                />

                <StatCard
                  title="未精算金額"
                  value={formatPrice(summaryData?.summary.pendingAmount || 0)}
                  variant="default"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  }
                />
              </div>

              {/* Charts and Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <Card className="p-6">
                  <h2 className="text-lg font-display text-soft-white mb-4">
                    売上推移（過去7日間）
                  </h2>
                  <div className="space-y-3">
                    {summaryData?.chartData.map((item, index) => {
                      const maxAmount = Math.max(...(summaryData.chartData.map(d => d.amount) || [1]));
                      const percentage = (item.amount / maxAmount) * 100;

                      return (
                        <div key={index} className="flex items-center gap-4">
                          <span className="text-sm text-muted w-24">
                            {new Date(item.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                          </span>
                          <div className="flex-1 h-6 bg-steel/20 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-soft-white w-24 text-right">
                            {formatPrice(item.amount)}
                          </span>
                        </div>
                      );
                    })}
                    {(!summaryData?.chartData || summaryData.chartData.length === 0) && (
                      <p className="text-center text-muted py-8">データがありません</p>
                    )}
                  </div>
                </Card>

                {/* Report Breakdown */}
                <Card className="p-6">
                  <h2 className="text-lg font-display text-soft-white mb-4">
                    報告の内訳
                  </h2>
                  <div className="space-y-4">
                    {[
                      { label: '嫌がらせ', count: reportStats?.reasonBreakdown.harassment || 0, color: 'bg-red-500' },
                      { label: 'スパム', count: reportStats?.reasonBreakdown.spam || 0, color: 'bg-yellow-500' },
                      { label: '不適切', count: reportStats?.reasonBreakdown.inappropriate || 0, color: 'bg-orange-500' },
                      { label: 'その他', count: reportStats?.reasonBreakdown.other || 0, color: 'bg-gray-500' },
                    ].map((item) => {
                      const total = reportStats?.total || 1;
                      const percentage = (item.count / total) * 100;

                      return (
                        <div key={item.label}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-muted">{item.label}</span>
                            <span className="text-sm text-soft-white">{item.count}件</span>
                          </div>
                          <div className="h-2 bg-steel/20 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${item.color} rounded-full transition-all`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 pt-6 border-t border-steel/30">
                    <div className="flex justify-between items-center">
                      <span className="text-muted">総報告数</span>
                      <span className="text-xl font-display text-soft-white">{reportStats?.total || 0}件</span>
                    </div>
                  </div>
                </Card>

                {/* Settlement Status */}
                <Card className="p-6">
                  <h2 className="text-lg font-display text-soft-white mb-4">
                    精算ステータス
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: '未処理', count: summaryData?.statusBreakdown.pending || 0, color: 'text-yellow-400' },
                      { label: '処理中', count: summaryData?.statusBreakdown.processing || 0, color: 'text-blue-400' },
                      { label: '完了', count: summaryData?.statusBreakdown.completed || 0, color: 'text-green-400' },
                      { label: '失敗', count: summaryData?.statusBreakdown.failed || 0, color: 'text-red-400' },
                    ].map((item) => (
                      <div key={item.label} className="p-4 bg-steel/10 rounded-xl">
                        <p className="text-sm text-muted mb-1">{item.label}</p>
                        <p className={`text-2xl font-display ${item.color}`}>{item.count}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Quick Actions */}
                <Card className="p-6">
                  <h2 className="text-lg font-display text-soft-white mb-4">
                    クイックアクション
                  </h2>
                  <div className="space-y-3">
                    <a
                      href="/admin/reports?status=pending"
                      className="flex items-center justify-between p-4 bg-steel/10 rounded-xl hover:bg-steel/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                          <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <span className="text-soft-white">未処理の報告を確認</span>
                      </div>
                      <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>

                    <a
                      href="/admin/settlements?status=pending"
                      className="flex items-center justify-between p-4 bg-steel/10 rounded-xl hover:bg-steel/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-neon-cyan/20 flex items-center justify-center">
                          <svg className="w-5 h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-soft-white">未精算を処理</span>
                      </div>
                      <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>

                    <a
                      href="/admin/merchants"
                      className="flex items-center justify-between p-4 bg-steel/10 rounded-xl hover:bg-steel/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-neon-purple/20 flex items-center justify-center">
                          <svg className="w-5 h-5 text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <span className="text-soft-white">加盟店を管理</span>
                      </div>
                      <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
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
