'use client';

import { useState, useEffect, useCallback } from 'react';
import { MenuCard } from './MenuCard';
import { Spinner, Button } from '@/components/ui';
import type { Menu } from '@/types/database';

interface MenuSelectorProps {
  merchantId: string;
  onSelect: (menu: Menu) => void;
  onCancel: () => void;
}

export function MenuSelector({ merchantId, onSelect, onCancel }: MenuSelectorProps) {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenus = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await fetch(`/api/merchants/${merchantId}/menus`);

      if (!response.ok) {
        throw new Error('Failed to fetch menus');
      }

      const data = await response.json();
      setMenus(data.menus);
      setCategories(data.categories);
    } catch (err) {
      console.error('Error fetching menus:', err);
      setError('メニューの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const handleSelect = useCallback((menu: Menu) => {
    setSelectedMenu((prev) => (prev?.id === menu.id ? null : menu));
  }, []);

  const handleConfirm = useCallback(() => {
    if (selectedMenu) {
      onSelect(selectedMenu);
    }
  }, [selectedMenu, onSelect]);

  const filteredMenus = selectedCategory
    ? menus.filter((m) => m.category === selectedCategory)
    : menus;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted mb-4">{error}</p>
        <button onClick={fetchMenus} className="text-neon-cyan hover:underline">
          再試行
        </button>
      </div>
    );
  }

  if (menus.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted">利用可能なメニューがありません</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm transition-all ${
              selectedCategory === null
                ? 'bg-neon-pink text-white'
                : 'bg-steel/50 text-muted hover:bg-steel/70'
            }`}
          >
            すべて
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm transition-all ${
                selectedCategory === category
                  ? 'bg-neon-pink text-white'
                  : 'bg-steel/50 text-muted hover:bg-steel/70'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Menu Grid */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {filteredMenus.map((menu) => (
          <MenuCard
            key={menu.id}
            menu={menu}
            isSelected={selectedMenu?.id === menu.id}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-steel/30">
        <Button variant="ghost" className="flex-1" onClick={onCancel}>
          キャンセル
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          onClick={handleConfirm}
          disabled={!selectedMenu}
        >
          選択する
        </Button>
      </div>
    </div>
  );
}
