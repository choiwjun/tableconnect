'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MerchantAdminSidebar } from '@/components/admin';
import { Spinner, Card, Button } from '@/components/ui';
import { formatPrice } from '@/lib/utils';
import { useSessionStore } from '@/lib/stores/sessionStore';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  is_available: boolean;
  created_at: string;
}

interface MenuFormData {
  name: string;
  price: number;
  description?: string;
  is_available: boolean;
}

export default function MerchantMenusPage() {
  const params = useParams<{ merchant: string }>();
  useRouter(); // For navigation
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { merchantId } = useSessionStore();

  const merchantSlug = params.merchant;

  const [formData, setFormData] = useState<MenuFormData>({
    name: '',
    price: 0,
    description: '',
    is_available: true,
  });

  useEffect(() => {
    async function fetchMenus() {
      if (!merchantId) {
        setError('관리자 권한이 필요합니다');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/merchants/${merchantSlug}/menus`);
        
        if (!response.ok) {
          throw new Error('메뉴 가져오기 실패');
        }

        const { data } = await response.json();
        setMenus(data || []);
      } catch (err) {
        console.error('Menus error:', err);
        setError('메뉴를 가져오는 중 오류가 발생했습니다');
      } finally {
        setIsLoading(false);
      }
    }

    fetchMenus();
  }, [merchantSlug, merchantId]);

  const handleAddMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/merchants/${merchantSlug}/menus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('메뉴 추가 실패');
      }

      const { data } = await response.json();
      setMenus((prev) => [...prev, data]);
      setShowAddForm(false);
      setFormData({ name: '', price: 0, description: '', is_available: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '메뉴 추가 중 오류 발생');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMenu) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/merchants/${merchantSlug}/menus/${editingMenu.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('메뉴 수정 실패');
      }

      const { data } = await response.json();
      setMenus((prev) => prev.map((menu) => (menu.id === editingMenu.id ? data : menu)));
      setEditingMenu(null);
      setShowAddForm(false);
      setFormData({ name: '', price: 0, description: '', is_available: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '메뉴 수정 중 오류 발생');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMenu = async (menuId: string) => {
    if (!confirm('정말 이 메뉴를 삭제하시겠습니까?')) return;

    setError(null);

    try {
      const response = await fetch(`/api/merchants/${merchantSlug}/menus/${menuId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('메뉴 삭제 실패');
      }

      setMenus((prev) => prev.filter((menu) => menu.id !== menuId));
    } catch (err) {
      setError(err instanceof Error ? err.message : '메뉴 삭제 중 오류 발생');
    }
  };

  const handleEditClick = (menu: MenuItem) => {
    setEditingMenu(menu);
    setFormData({
      name: menu.name,
      price: menu.price,
      description: menu.description || '',
      is_available: menu.is_available,
    });
    setShowAddForm(true);
  };

  const handleToggleAvailability = async (menuId: string, isAvailable: boolean) => {
    const menu = menus.find((m) => m.id === menuId);
    if (!menu) return;

    try {
      const response = await fetch(`/api/merchants/${merchantSlug}/menus/${menuId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...menu, is_available: isAvailable }),
      });

      if (!response.ok) {
        throw new Error('상태 변경 실패');
      }

      const { data } = await response.json();
      setMenus((prev) => prev.map((m) => (m.id === menuId ? data : m)));
    } catch (err) {
      console.error('Toggle availability error:', err);
    }
  };

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
                메뉴 관리
              </h1>
              <p className="text-muted">
                총 {menus.length}개의 메뉴
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => {
                setEditingMenu(null);
                setFormData({ name: '', price: 0, description: '', is_available: true });
                setShowAddForm(true);
              }}
              className="px-6 py-3"
            >
              + 메뉴 추가
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <Card className="p-4 mb-6 bg-red-500/10 border-red-500/30">
              <p className="text-red-400">{error}</p>
            </Card>
          )}

          {/* Add/Edit Form */}
          {showAddForm && (
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-display text-soft-white mb-4">
                {editingMenu ? '메뉴 수정' : '새 메뉴 추가'}
              </h2>
              <form onSubmit={editingMenu ? handleUpdateMenu : handleAddMenu} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-soft-white mb-2">
                    메뉴 이름 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="예: 라멘"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-steel/50 border border-steel/30 text-soft-white placeholder:text-muted focus:outline-none focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/20 transition-all"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-soft-white mb-2">
                    가격 (JPY) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    placeholder="예: 1000"
                    required
                    min="0"
                    className="w-full px-4 py-3 rounded-xl bg-steel/50 border border-steel/30 text-soft-white placeholder:text-muted focus:outline-none focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/20 transition-all"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-soft-white mb-2">
                    설명
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="메뉴에 대한 설명을 입력하세요"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-steel/50 border border-steel/30 text-soft-white placeholder:text-muted focus:outline-none focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/20 transition-all"
                  />
                </div>

                {/* Available Toggle */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_available"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    className="w-5 h-5 rounded border-steel/30"
                  />
                  <label htmlFor="is_available" className="text-sm text-soft-white">
                    이 메뉴 표시 (재고 있음)
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3"
                  >
                    {isSubmitting ? (
                      <Spinner size="sm" />
                    ) : (
                      editingMenu ? '수정 완료' : '추가 완료'
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingMenu(null);
                      setFormData({ name: '', price: 0, description: '', is_available: true });
                    }}
                    className="flex-1 py-3"
                  >
                    취소
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Menu List */}
          {menus.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-neon-cyan/10 flex items-center justify-center border border-neon-cyan/30">
                <svg className="w-8 h-8 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className="font-display text-2xl text-soft-white mb-4">
                메뉴가 없습니다
              </h2>
              <p className="text-muted mb-8">
                첫 번째 메뉴를 추가해보세요!
              </p>
              <Button
                variant="primary"
                onClick={() => setShowAddForm(true)}
                className="px-8 py-3"
              >
                + 첫 메뉴 추가
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {menus.map((menu) => (
                <Card key={menu.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-display text-xl text-soft-white">
                          {menu.name}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            menu.is_available
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {menu.is_available ? '판매 중' : '품절'}
                        </span>
                      </div>
                      <p className="text-2xl font-display text-neon-cyan mb-2">
                        {formatPrice(menu.price)}
                      </p>
                      {menu.description && (
                        <p className="text-sm text-muted">
                          {menu.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {/* Toggle Availability */}
                      <button
                        onClick={() => handleToggleAvailability(menu.id, !menu.is_available)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                          menu.is_available
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menu.is_available ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                        </svg>
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleEditClick(menu)}
                        className="w-10 h-10 rounded-lg bg-steel/20 text-soft-white hover:bg-steel/30 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteMenu(menu.id)}
                        className="w-10 h-10 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
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
