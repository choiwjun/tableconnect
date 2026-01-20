'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MerchantAdminSidebar } from '@/components/admin';
import { Spinner, Card, Button } from '@/components/ui';
import { formatPrice } from '@/lib/utils';
import { useRealtimeGifts } from '@/lib/hooks/useRealtime';
import { useSessionStore } from '@/lib/stores/sessionStore';
import type { Gift } from '@/types/database';

interface OrderItem extends Gift {
  menu_name?: string;
  status_display: string;
}

export default function MerchantOrdersPage() {
  const params = useParams<{ merchant: string }>();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { merchantId } = useSessionStore();

  const merchantSlug = params.merchant;

  useEffect(() => {
    async function fetchOrders() {
      if (!merchantId) {
        setError('관리자 권한이 필요합니다');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/merchants/${merchantSlug}/admin/orders`);
        
        if (!response.ok) {
          throw new Error('주문 가져오기 실패');
        }

        const { data: gifts, menuItems } = await response.json();
        
        const ordersWithMenu: OrderItem[] = gifts.map((gift: Gift) => ({
          ...gift,
          menu_name: menuItems?.find((item: any) => item.id === gift.menu_item_id)?.name,
          status_display: gift.status,
        }));

        setOrders(ordersWithMenu);
      } catch (err) {
        console.error('Orders error:', err);
        setError('주문을 가져오는 중 오류가 발생했습니다');
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, [merchantSlug, merchantId]);

  const handleNewGift = (newGift: Record<string, unknown>) => {
    const gift = newGift as Gift;
    if (gift.merchant_id !== merchantId) return;

    setOrders((prev) => [{
      ...gift,
      status_display: 'pending',
    } as OrderItem, ...prev]);
  };

  useRealtimeGifts(merchantSlug, handleNewGift);

  const handleCompleteOrder = async (orderId: string) => {
    setIsCompleting(orderId);
    setError(null);

    try {
      const response = await fetch(`/api/merchants/${merchantSlug}/admin/orders/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        throw new Error('주문 완료 처리 실패');
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status_display: 'completed' } : order
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '주문 완료 중 오류 발생');
    } finally {
      setIsCompleting(null);
    }
  };

  const pendingOrders = orders.filter((order) => order.status_display === 'pending');
  const completedOrders = orders.filter((order) => order.status_display === 'completed');

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
          <div className="mb-8">
            <h1 className="text-3xl font-display text-soft-white mb-2">
              주문 확인
            </h1>
            <div className="flex items-center gap-4">
              <p className="text-muted">
                총 {orders.length}개의 주문
              </p>
              {pendingOrders.length > 0 && (
                <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm font-medium">
                  대기 중: {pendingOrders.length}개
                </span>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Card className="p-4 mb-6 bg-red-500/10 border-red-500/30">
              <p className="text-red-400">{error}</p>
            </Card>
          )}

          {/* Pending Orders */}
          {pendingOrders.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-display text-soft-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                대기 중 주문 ({pendingOrders.length})
              </h2>
              <div className="space-y-4">
                {pendingOrders.map((order) => (
                  <Card key={order.id} className="p-6 border-yellow-500/30 bg-yellow-500/5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-full bg-neon-pink/20 flex items-center justify-center border border-neon-pink/30">
                            <svg className="w-6 h-6 text-neon-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-display text-xl text-soft-white">
                              {order.gift_type === 'menu_item' ? order.menu_name : `포인트 ${order.amount}`}
                            </h3>
                            <p className="text-sm text-muted">
                              테이블 {order.sender_session_id?.slice(0, 4)} → 테이블 {order.receiver_session_id?.slice(0, 4)}
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-muted">
                          <p>금액: {formatPrice(order.amount)}</p>
                          <p>시간: {new Date(order.created_at).toLocaleString('ko-KR')}</p>
                        </div>
                      </div>

                      <Button
                        variant="primary"
                        onClick={() => handleCompleteOrder(order.id)}
                        disabled={isCompleting === order.id}
                        className="px-6 py-2"
                      >
                        {isCompleting === order.id ? (
                          <Spinner size="sm" />
                        ) : (
                          '완료 처리'
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Completed Orders */}
          {completedOrders.length > 0 && (
            <div>
              <h2 className="text-xl font-display text-soft-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                완료된 주문 ({completedOrders.length})
              </h2>
              <div className="space-y-4">
                {completedOrders.map((order) => (
                  <Card key={order.id} className="p-6 border-steel/30 opacity-75">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-display text-xl text-soft-white">
                              {order.gift_type === 'menu_item' ? order.menu_name : `포인트 ${order.amount}`}
                            </h3>
                            <p className="text-sm text-muted">
                              테이블 {order.sender_session_id?.slice(0, 4)} → 테이블 {order.receiver_session_id?.slice(0, 4)}
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-muted">
                          <p>금액: {formatPrice(order.amount)}</p>
                          <p>시간: {new Date(order.created_at).toLocaleString('ko-KR')}</p>
                        </div>
                      </div>

                      <span className="text-green-400 font-medium text-lg">
                        ✓ 완료
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {orders.length === 0 && (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-neon-cyan/10 flex items-center justify-center border border-neon-cyan/30">
                <svg className="w-8 h-8 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4M16 21l5-5 5-5M21 21l-9-9M3 10l5-5 5-5M4 20l5-5 5-5" />
                </svg>
              </div>
              <h2 className="font-display text-2xl text-soft-white mb-4">
                주문이 없습니다
              </h2>
              <p className="text-muted">
                새로운 주문이 들어오면 실시간으로 표시됩니다
              </p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
