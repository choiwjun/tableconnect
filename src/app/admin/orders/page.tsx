'use client';

import { useEffect, useState } from 'react';
import { useRealtimeGifts } from '@/lib/hooks/useRealtime';
import { Container, Button, Spinner } from '@/components/ui';
import { useTranslation } from '@/lib/i18n/context';
import type { Gift } from '@/types/database';
import { useSessionStore } from '@/lib/stores/sessionStore';

interface OrderItem extends Gift {
  menu_name?: string; // For menu gifts
  status_display: string;
}

export default function OrdersPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { merchantId } = useSessionStore();

  // Fetch initial orders
  useEffect(() => {
    async function fetchOrders() {
      if (!merchantId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/admin/orders?merchantId=${merchantId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }

        const { data: gifts, menuItems } = await response.json();

        // Combine gifts with menu names
        const ordersWithMenu: OrderItem[] = gifts.map((gift: Gift) => ({
          ...gift,
          menu_name: menuItems.find((item: any) => item.id === gift.menu_item_id)?.name,
          status_display: gift.status,
        }));

        setOrders(ordersWithMenu);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, [merchantId]);

  // Handle real-time new orders
  const handleNewGift = (newGift: Record<string, unknown>) => {
    const gift = newGift as Gift;
    if (gift.merchant_id !== merchantId) return;

    // Fetch menu name
    fetch(`/api/admin/menus/${gift.menu_item_id}`)
      .then((res) => res.json())
      .then(({ data: menuItem }) => {
        const orderItem: OrderItem = {
          ...gift,
          menu_name: menuItem?.name,
          status_display: gift.status,
        };
        setOrders((prev) => [orderItem, ...prev]);
      })
      .catch(console.error);
  };

  useRealtimeGifts(merchantId || '', handleNewGift);

  // Handle complete order
  const handleCompleteOrder = async (orderId: string) => {
    try {
      const response = await fetch('/api/admin/orders/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete order');
      }

      // Update local state
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status_display: 'completed' } : order
        )
      );
    } catch (error) {
      console.error('Error completing order:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!merchantId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Container maxWidth="sm" className="text-center">
          <h1 className="font-display text-2xl text-soft-white mb-4">
            アクセス拒否
          </h1>
          <p className="text-muted">管理者権限が必要です</p>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-dark">
      {/* Ambient Background */}
      <div className="fixed inset-0 bg-gradient-radial from-[#1a2530] via-background-dark to-black z-0" />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl" />

      <Container maxWidth="lg" className="relative z-10 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl text-soft-white mb-2">
            {t('admin.orders')}
          </h1>
          <p className="text-neon-cyan text-lg">
            {orders.length} 件の注文
          </p>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 border border-steel/30 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-neon-cyan/10 flex items-center justify-center border border-neon-cyan/30">
              <svg
                className="w-8 h-8 text-neon-cyan"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4M16 21l5-5 5-5M21 21l-9-9M3 10l5-5 5-5M4 20l5-5 5-5"
                />
              </svg>
            </div>
            <h2 className="font-display text-2xl text-soft-white mb-4">
              注文はありません
            </h2>
            <p className="text-muted mb-8">
              新しい注文が入るとここに表示されます
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="glass-panel rounded-2xl p-6 border border-steel/30 hover:border-neon-cyan/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Order Info */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-neon-pink/20 flex items-center justify-center border border-neon-pink/30">
                        <span className="font-display text-lg text-neon-pink">
                          {order.sender_session_id?.slice(0, 8)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-xl text-soft-white">
                            {order.gift_type === 'menu_item' ? order.menu_name : `¥${order.amount}`}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              order.status_display === 'completed'
                                ? 'bg-green-500/20 text-green-400'
                                : order.status_display === 'failed'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}
                          >
                            {order.status_display === 'completed' && '完了'}
                            {order.status_display === 'pending' && '待機中'}
                            {order.status_display === 'failed' && '失敗'}
                          </span>
                        </div>
                        <p className="text-sm text-muted">
                          テーブル {order.sender_session_id?.slice(0, 4)} → テーブル{' '}
                          {order.receiver_session_id?.slice(0, 4)}
                        </p>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="text-xs text-muted">
                      {new Date(order.created_at).toLocaleString('ja-JP')}
                    </div>
                  </div>

                  {/* Action Button */}
                  {order.status_display === 'pending' && (
                    <Button
                      variant="primary"
                      onClick={() => handleCompleteOrder(order.id)}
                      className="px-6 py-2"
                    >
                      完了
                    </Button>
                  )}

                  {order.status_display === 'completed' && (
                    <span className="text-green-400 font-medium">
                      ✓
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
