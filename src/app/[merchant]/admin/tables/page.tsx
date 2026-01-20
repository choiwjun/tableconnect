'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MerchantAdminSidebar } from '@/components/admin';
import { Spinner, Card, Button } from '@/components/ui';
import { useSessionStore } from '@/lib/stores/sessionStore';

interface TableConfig {
  tableNumber: number;
  type: 'standard' | 'vip' | 'private';
  capacity: number;
  isAvailable: boolean;
}

export default function MerchantTablesPage() {
  const params = useParams<{ merchant: string }>();
  const router = useRouter();
  const [tables, setTables] = useState<TableConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTable, setEditingTable] = useState<TableConfig | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { merchantId } = useSessionStore();

  const merchantSlug = params.merchant;

  const [formData, setFormData] = useState<Omit<TableConfig, 'tableNumber'>>({
    type: 'standard',
    capacity: 4,
    isAvailable: true,
  });

  useEffect(() => {
    async function fetchTables() {
      if (!merchantId) {
        setError('관리자 권한이 필요합니다');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/merchants/${merchantSlug}/admin/tables`);
        
        if (!response.ok) {
          throw new Error('테이블 설정 가져오기 실패');
        }

        const { data } = await response.json();
        setTables(data || []);
      } catch (err) {
        console.error('Tables error:', err);
        setError('테이블 설정을 가져오는 중 오류가 발생했습니다');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTables();
  }, [merchantSlug, merchantId]);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch(`/api/merchants/${merchantSlug}/admin/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('테이블 추가 실패');
      }

      const { data } = await response.json();
      setTables((prev) => [...prev, data]);
      setShowAddForm(false);
      setFormData({ type: 'standard', capacity: 4, isAvailable: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '테이블 추가 중 오류 발생');
    }
  };

  const handleUpdateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable) return;

    setError(null);

    try {
      const response = await fetch(`/api/merchants/${merchantSlug}/admin/tables/${editingTable.tableNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('테이블 수정 실패');
      }

      const { data } = await response.json();
      setTables((prev) => prev.map((t) => t.tableNumber === editingTable.tableNumber ? data : t));
      setEditingTable(null);
      setShowAddForm(false);
      setFormData({ type: 'standard', capacity: 4, isAvailable: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '테이블 수정 중 오류 발생');
    }
  };

  const handleDeleteTable = async (tableNumber: number) => {
    if (!confirm(`테이블 ${tableNumber}을 정말 삭제하시겠습니까?`)) return;

    setError(null);

    try {
      const response = await fetch(`/api/merchants/${merchantSlug}/admin/tables/${tableNumber}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('테이블 삭제 실패');
      }

      setTables((prev) => prev.filter((t) => t.tableNumber !== tableNumber));
    } catch (err) {
      setError(err instanceof Error ? err.message : '테이블 삭제 중 오류 발생');
    }
  };

  const handleEditClick = (table: TableConfig) => {
    setEditingTable(table);
    setFormData({
      type: table.type,
      capacity: table.capacity,
      isAvailable: table.isAvailable,
    });
    setShowAddForm(true);
  };

  const handleToggleAvailability = async (tableNumber: number, isAvailable: boolean) => {
    try {
      const table = tables.find((t) => t.tableNumber === tableNumber);
      if (!table) return;

      const response = await fetch(`/api/merchants/${merchantSlug}/admin/tables/${tableNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...table, isAvailable }),
      });

      if (!response.ok) {
        throw new Error('상태 변경 실패');
      }

      const { data } = await response.json();
      setTables((prev) => prev.map((t) => t.tableNumber === tableNumber ? data : t));
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
                테이블 관리
              </h1>
              <p className="text-muted">
                총 {tables.length}개의 테이블
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => {
                setEditingTable(null);
                setFormData({ type: 'standard', capacity: 4, isAvailable: true });
                setShowAddForm(true);
              }}
              className="px-6 py-3"
            >
              + 테이블 추가
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
                {editingTable ? '테이블 수정' : '새 테이블 추가'}
              </h2>
              <form onSubmit={editingTable ? handleUpdateTable : handleAddTable} className="space-y-4">
                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-soft-white mb-2">
                    테이블 타입
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-xl bg-steel/50 border border-steel/30 text-soft-white focus:outline-none focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/20 transition-all"
                  >
                    <option value="standard">일반 테이블</option>
                    <option value="vip">VIP 테이블</option>
                    <option value="private">프라이빗 룸</option>
                  </select>
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-sm font-medium text-soft-white mb-2">
                    수용 인원
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                    min="1"
                    max="20"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-steel/50 border border-steel/30 text-soft-white focus:outline-none focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/20 transition-all"
                  />
                </div>

                {/* Available Toggle */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="w-5 h-5 rounded border-steel/30"
                  />
                  <label htmlFor="isAvailable" className="text-sm text-soft-white">
                    이 테이블 사용 가능 (예약 가능)
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    type="submit"
                    className="flex-1 py-3"
                  >
                    {editingTable ? '수정 완료' : '추가 완료'}
                  </Button>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingTable(null);
                      setFormData({ type: 'standard', capacity: 4, isAvailable: true });
                    }}
                    className="flex-1 py-3"
                  >
                    취소
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Table List */}
          {tables.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-neon-cyan/10 flex items-center justify-center border border-neon-cyan/30">
                <svg className="w-8 h-8 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <h2 className="font-display text-2xl text-soft-white mb-4">
                테이블이 없습니다
              </h2>
              <p className="text-muted mb-8">
                첫 번째 테이블을 추가해보세요!
              </p>
              <Button
                variant="primary"
                onClick={() => setShowAddForm(true)}
                className="px-8 py-3"
              >
                + 첫 테이블 추가
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {tables.map((table) => (
                <Card key={table.tableNumber} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-neon-purple/20 flex items-center justify-center border border-neon-purple/30">
                          <span className="font-display text-lg text-neon-purple">
                            {table.tableNumber}
                          </span>
                        </div>
                        <h3 className="font-display text-xl text-soft-white">
                          {table.type === 'vip' && 'VIP '}
                          {table.type === 'private' && '프라이빗 '}
                          테이블 {table.tableNumber}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            table.isAvailable
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {table.isAvailable ? '사용 가능' : '사용 불가'}
                        </span>
                      </div>
                      <p className="text-sm text-muted">
                        수용 인원: {table.capacity}명
                      </p>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {/* Toggle Availability */}
                      <button
                        onClick={() => handleToggleAvailability(table.tableNumber, !table.isAvailable)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                          table.isAvailable
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={table.isAvailable ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                        </svg>
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleEditClick(table)}
                        className="w-10 h-10 rounded-lg bg-steel/20 text-soft-white hover:bg-steel/30 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteTable(table.tableNumber)}
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
