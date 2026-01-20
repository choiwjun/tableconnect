'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MerchantAdminSidebar } from '@/components/admin';
import { Spinner, Card, Button } from '@/components/ui';
import { formatPrice } from '@/lib/utils';
import { useSessionStore } from '@/lib/stores/sessionStore';

interface Settlement {
  id: string;
  merchant_id: string;
  month: string;
  total_revenue: number;
  total_gifts: number;
  total_fees: number;
  net_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  paid_at?: string;
}

export default function MerchantSettlementsPage() {
  const params = useParams<{ merchant: string }>();
  const router = useRouter();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const { merchantId } = useSessionStore();

  const merchantSlug = params.merchant;

  useEffect(() => {
    async function fetchSettlements() {
      if (!merchantId) {
        setError('관리자 권한이 필요합니다');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/merchants/${merchantSlug}/admin/settlements`);
        
        if (!response.ok) {
          throw new Error('정산 데이터 가져오기 실패');
        }

        const { data } = await response.json();
        setSettlements(data || []);
      } catch (err) {
        console.error('Settlements error:', err);
        setError('정산 내역을 가져오는 중 오류가 발생했습니다');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSettlements();
  }, [merchantSlug, merchantId]);

  const handleRequestSettlement = async (month: string) => {
    if (!confirm(`${month} 정산을 정말 요청하시겠습니까?`)) return;

    try {
      const response = await fetch(`/api/merchants/${merchantSlug}/admin/settlements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month }),
      });

      if (!response.ok) {
        throw new Error('정산 요청 실패');
      }

      const { data } = await response.json();
      setSettlements((prev) => [...prev, data]);
      alert('정산 요청이 완료되었습니다. 영업일 기준 3일 내에 처리됩니다.');
    } catch (err) {
      setError(err instanceof Error ? err.message : '정산 요청 중 오류 발생');
    }
  };

  const filteredSettlements = selectedMonth === 'all' 
    ? settlements 
    : settlements.filter((s) => s.month === selectedMonth);

  const uniqueMonths = Array.from(new Set(settlements.map((s) => s.month))).sort().reverse();

  if (isLoading) {
    return (
      <div className="flex">
        <MerchantAdminSidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="flex items-center justify-center h-64">
            <Spinner size="lg" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex">
      <MerchantAdminSidebar />

      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display text-soft-white mb-2">
                정산 내역
              </h1>
              <p className="text-muted">
                총 {settlements.length}개월의 정산 내역
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 rounded-lg bg-steel/50 border border-steel/30 text-soft-white focus:outline-none focus:border-neon-cyan transition-all"
              >
                <option value="all">전체</option>
                {uniqueMonths.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
              <Button
                variant="primary"
                onClick={() => {
                  const month = new Date().toISOString().slice(0, 7);
                  handleRequestSettlement(month);
                }}
                className="px-4 py-2"
              >
                정산 요청
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Card className="p-4 mb-6 bg-red-500/10 border-red-500/30">
              <p className="text-red-400">{error}</p>
            </Card>
          )}

          {/* Summary Cards */}
          {settlements.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="p-6">
                <h2 className="text-sm font-medium text-muted mb-2">
                  총 매출
                </h2>
                <p className="text-3xl font-display text-soft-white">
                  {formatPrice(settlements.reduce((sum, s) => sum + s.total_revenue, 0))}
                </p>
              </Card>

              <Card className="p-6">
                <h2 className="text-sm font-medium text-muted mb-2">
                  총 수수료
                </h2>
                <p className="text-3xl font-display text-neon-pink">
                  {formatPrice(settlements.reduce((sum, s) => sum + s.total_fees, 0))}
                </p>
              </Card>

              <Card className="p-6">
                <h2 className="text-sm font-medium text-muted mb-2">
                  총 정산 금액
                </h2>
                <p className="text-3xl font-display text-neon-cyan">
                  {formatPrice(settlements.reduce((sum, s) => sum + s.net_amount, 0))}
                </p>
              </Card>
            </div>
          )}

          {/* Settlement List */}
          {filteredSettlements.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-neon-cyan/10 flex items-center justify-center border border-neon-cyan/30">
                <svg className="w-8 h-8 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="font-display text-2xl text-soft-white mb-4">
                정산 내역이 없습니다
              </h2>
              <p className="text-muted mb-8">
                정산을 요청하면 이곳에서 확인할 수 있습니다
              </p>
              <Button
                variant="primary"
                onClick={() => {
                  const month = new Date().toISOString().slice(0, 7);
                  handleRequestSettlement(month);
                }}
                className="px-8 py-3"
              >
                첫 정산 요청
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredSettlements.map((settlement) => (
                <Card key={settlement.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="font-display text-xl text-soft-white">
                          {settlement.month}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            settlement.status === 'completed'
                              ? 'bg-green-500/20 text-green-400'
                              : settlement.status === 'processing'
                              ? 'bg-blue-500/20 text-blue-400'
                              : settlement.status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {settlement.status === 'completed' && '완료'}
                          {settlement.status === 'processing' && '처리 중'}
                          {settlement.status === 'pending' && '대기 중'}
                          {settlement.status === 'failed' && '실패'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted mb-1">총 매출</p>
                          <p className="text-lg font-display text-soft-white">
                            {formatPrice(settlement.total_revenue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted mb-1">총 선물 수</p>
                          <p className="text-lg font-display text-soft-white">
                            {settlement.total_gifts}개
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted mb-1">수수료</p>
                          <p className="text-lg font-display text-neon-pink">
                            {formatPrice(settlement.total_fees)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted mb-1">정산 금액</p>
                          <p className="text-lg font-display text-neon-cyan">
                            {formatPrice(settlement.net_amount)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-steel/30">
                        <div className="text-sm text-muted space-y-1">
                          <p>요청일: {new Date(settlement.created_at).toLocaleString('ko-KR')}</p>
                          {settlement.paid_at && (
                            <p>지급일: {new Date(settlement.paid_at).toLocaleString('ko-KR')}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {settlement.status === 'completed' && (
                      <div className="ml-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30 mb-2">
                          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm text-green-400 font-medium">지급 완료</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
