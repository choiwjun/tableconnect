'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import { formatPrice } from '@/lib/utils/format';
import { useTranslation } from '@/lib/i18n/context';
import type { Menu } from '@/types/database';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchantId?: string;
  merchantName?: string;
}

// Mock menu data for demo
const mockMenus: Menu[] = [
  {
    id: '1',
    merchant_id: 'demo',
    name: '生ビール (中)',
    description: 'キンキンに冷えた生ビール',
    price: 550,
    image_url: null,
    category: 'ドリンク',
    is_available: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    merchant_id: 'demo',
    name: 'ハイボール',
    description: 'すっきり爽やかなハイボール',
    price: 480,
    image_url: null,
    category: 'ドリンク',
    is_available: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    merchant_id: 'demo',
    name: '梅酒ソーダ',
    description: '甘酸っぱい梅酒のソーダ割り',
    price: 520,
    image_url: null,
    category: 'ドリンク',
    is_available: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    merchant_id: 'demo',
    name: '枝豆',
    description: '塩茹でした枝豆',
    price: 380,
    image_url: null,
    category: 'おつまみ',
    is_available: true,
    sort_order: 4,
    created_at: new Date().toISOString(),
  },
  {
    id: '5',
    merchant_id: 'demo',
    name: '焼き鳥盛り合わせ (5本)',
    description: 'ももタレ、ねぎま塩、つくね、砂肝、レバー',
    price: 980,
    image_url: null,
    category: '焼き鳥',
    is_available: true,
    sort_order: 5,
    created_at: new Date().toISOString(),
  },
  {
    id: '6',
    merchant_id: 'demo',
    name: '唐揚げ',
    description: 'ジューシーな鶏の唐揚げ 6個',
    price: 680,
    image_url: null,
    category: '揚げ物',
    is_available: true,
    sort_order: 6,
    created_at: new Date().toISOString(),
  },
  {
    id: '7',
    merchant_id: 'demo',
    name: 'ポテトフライ',
    description: 'カリカリのポテトフライ',
    price: 450,
    image_url: null,
    category: '揚げ物',
    is_available: true,
    sort_order: 7,
    created_at: new Date().toISOString(),
  },
  {
    id: '8',
    merchant_id: 'demo',
    name: '刺身盛り合わせ',
    description: '本日の新鮮な刺身5種盛り',
    price: 1580,
    image_url: null,
    category: '刺身',
    is_available: true,
    sort_order: 8,
    created_at: new Date().toISOString(),
  },
];

export function MenuModal({
  isOpen,
  onClose,
  merchantName = 'TableConnect',
}: MenuModalProps) {
  const { t } = useTranslation();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // In production, fetch from API
      // For now, use mock data
      setIsLoading(true);
      setTimeout(() => {
        setMenus(mockMenus);
        setIsLoading(false);
      }, 300);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Get unique categories
  const categories = Array.from(new Set(menus.map((m) => m.category).filter(Boolean))) as string[];

  // Filter menus by category
  const filteredMenus = selectedCategory
    ? menus.filter((m) => m.category === selectedCategory)
    : menus;

  // Group menus by category for display
  const menusByCategory = filteredMenus.reduce((acc, menu) => {
    const cat = menu.category || 'その他';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(menu);
    return acc;
  }, {} as Record<string, Menu[]>);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] mx-4 glass-panel rounded-2xl overflow-hidden flex flex-col animate-slideUp">
        {/* Header */}
        <div className="flex-none p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">
                {t('dashboard.menuTitle')}
              </h2>
              <p className="text-sm text-gray-400 mt-1">{merchantName}</p>
            </div>
            <button
              onClick={onClose}
              className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-gray-400">
                close
              </span>
            </button>
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                  selectedCategory === null
                    ? 'bg-primary text-black'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                )}
              >
                {t('dashboard.allCategories')}
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                    selectedCategory === category
                      ? 'bg-primary text-black'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Menu List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(menusByCategory).map(([category, items]) => (
                <div key={category}>
                  <h3 className="font-display text-lg font-bold text-primary mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">
                      restaurant_menu
                    </span>
                    {category}
                  </h3>
                  <div className="grid gap-3">
                    {items.map((menu) => (
                      <MenuItemCard key={menu.id} menu={menu} t={t} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-none p-4 border-t border-white/10 bg-white/5">
          <p className="text-center text-xs text-gray-500">
            {t('dashboard.priceNote')}
          </p>
        </div>
      </div>
    </div>
  );
}

function MenuItemCard({ menu, t }: { menu: Menu; t: (key: string) => string }) {
  return (
    <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary/30 transition-colors">
      {/* Image */}
      {menu.image_url ? (
        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-steel/50 relative">
          <Image
            src={menu.image_url}
            alt={menu.name}
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="w-20 h-20 rounded-lg flex-shrink-0 bg-gradient-to-br from-primary/10 to-neon-purple/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl text-primary/40">
            lunch_dining
          </span>
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-white">{menu.name}</h4>
          <span className="text-primary font-bold whitespace-nowrap">
            {formatPrice(menu.price)}
          </span>
        </div>
        {menu.description && (
          <p className="text-sm text-gray-400 mt-1 line-clamp-2">
            {menu.description}
          </p>
        )}
        {!menu.is_available && (
          <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded bg-red-500/20 text-red-400 border border-red-500/30">
            {t('dashboard.soldOut')}
          </span>
        )}
      </div>
    </div>
  );
}
