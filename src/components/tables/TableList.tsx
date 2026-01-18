'use client';

import { useState, useEffect, useCallback } from 'react';
import { Spinner } from '@/components/ui';
import { TableCard } from './TableCard';
import type { ActiveTable } from '@/app/api/tables/route';

interface TableListProps {
  merchantId: string;
  currentSessionId: string;
  onSelectTable: (table: ActiveTable) => void;
  unreadSessions?: Set<string>;
}

export function TableList({
  merchantId,
  currentSessionId,
  onSelectTable,
  unreadSessions = new Set(),
}: TableListProps) {
  const [tables, setTables] = useState<ActiveTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTables = useCallback(async () => {
    try {
      setError(null);

      const response = await fetch(
        `/api/tables?merchantId=${merchantId}&excludeSessionId=${currentSessionId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch tables');
      }

      const { tables: fetchedTables } = await response.json();
      setTables(fetchedTables);
    } catch (err) {
      console.error('Error fetching tables:', err);
      setError('テーブル一覧の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [merchantId, currentSessionId]);

  useEffect(() => {
    fetchTables();

    // Refresh every 30 seconds
    const interval = setInterval(fetchTables, 30000);
    return () => clearInterval(interval);
  }, [fetchTables]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted mb-4">{error}</p>
        <button
          onClick={fetchTables}
          className="text-neon-cyan hover:underline"
        >
          再試行
        </button>
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-steel/50 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <p className="text-muted">
          まだ他のテーブルに参加者がいません
        </p>
        <p className="text-muted text-sm mt-2">
          新しい参加者が来るとここに表示されます
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-soft-white font-medium">
          参加中のテーブル
        </h2>
        <span className="text-sm text-muted">
          {tables.length} テーブル
        </span>
      </div>

      {tables.map((table) => (
        <TableCard
          key={table.sessionId}
          tableNumber={table.tableNumber}
          nickname={table.nickname || `テーブル ${table.tableNumber}`}
          createdAt={table.createdAt}
          onClick={() => onSelectTable(table)}
          hasUnread={unreadSessions.has(table.sessionId)}
        />
      ))}
    </div>
  );
}
