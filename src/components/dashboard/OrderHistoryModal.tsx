'use client';

import { useTranslation } from '@/lib/i18n/context';

interface Order {
  id: string;
  menuName: string;
  price: number;
  quantity: number;
  status: 'pending' | 'preparing' | 'completed';
  createdAt: string;
}

// Demo orders data
const DEMO_ORDERS: Order[] = [
  {
    id: 'order-1',
    menuName: '生ビール',
    price: 500,
    quantity: 2,
    status: 'completed',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'order-2',
    menuName: '唐揚げ',
    price: 550,
    quantity: 1,
    status: 'completed',
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
  {
    id: 'order-3',
    menuName: 'ハイボール',
    price: 450,
    quantity: 1,
    status: 'preparing',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
];

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrderHistoryModal({ isOpen, onClose }: OrderHistoryModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'preparing':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'completed':
        return 'text-green-400 bg-green-400/10 border-green-400/30';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return '대기 중';
      case 'preparing':
        return '준비 중';
      case 'completed':
        return '완료';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  const totalAmount = DEMO_ORDERS.reduce((sum, order) => sum + order.price * order.quantity, 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 glass-panel rounded-2xl overflow-hidden animate-slideUp max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">receipt_long</span>
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-white">
                  {t('dashboard.myOrders')}
                </h2>
                <p className="text-xs text-gray-400">
                  오늘의 주문 내역
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-gray-400">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {DEMO_ORDERS.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-4xl text-gray-500 mb-3">receipt_long</span>
              <p className="text-gray-400">주문 내역이 없습니다</p>
            </div>
          ) : (
            DEMO_ORDERS.map((order) => (
              <div
                key={order.id}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white">{order.menuName}</h3>
                      <span className="text-gray-500">x{order.quantity}</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      {formatTime(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">
                      ¥{(order.price * order.quantity).toLocaleString()}
                    </p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs border ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400">합계</span>
            <span className="text-xl font-bold text-white">¥{totalAmount.toLocaleString()}</span>
          </div>
          <p className="text-xs text-gray-500 text-center">
            * 데모 모드에서는 실제 주문이 이루어지지 않습니다
          </p>
        </div>
      </div>
    </div>
  );
}
