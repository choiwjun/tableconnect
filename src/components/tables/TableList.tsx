'use client';

import { useState, useEffect, useCallback } from 'react';
import { TableCard } from './TableCard';
import { useTranslation } from '@/lib/i18n/context';
import type { Session, AgeRange } from '@/types/database';
import type { ActiveTable } from '@/app/api/tables/route';

// Convert ActiveTable to Session-like format for TableCard
interface TableCardData {
  id: string;
  table_number: number;
  nickname: string | null;
  gender: 'male' | 'female' | null;
  age_range: AgeRange | null;
  party_size: number | null;
  created_at: string;
}

// Props for session-based mode
interface SessionBasedProps {
  sessions: Session[];
  merchantId?: never;
  demoTables?: never;
}

// Props for fetch-based mode
interface FetchBasedProps {
  sessions?: never;
  merchantId: string;
  demoTables?: ActiveTable[];
}

type TableListProps = {
  currentSessionId: string | null;
  onSelectTable: (session: TableCardData | ActiveTable | Session) => void;
  unreadSessions?: Set<string>;
  searchQuery?: string;
} & (SessionBasedProps | FetchBasedProps);

export function TableList({
  sessions: propSessions,
  merchantId,
  demoTables,
  currentSessionId,
  onSelectTable,
  unreadSessions = new Set(),
  searchQuery = '',
}: TableListProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [fetchedSessions, setFetchedSessions] = useState<TableCardData[]>([]);

  // Determine data source
  const isSessionBased = !!propSessions;
  const isDemoMode = merchantId === 'demo' || !!demoTables;

  // Fetch sessions from API when merchantId is provided
  useEffect(() => {
    if (isSessionBased) return;

    if (isDemoMode && demoTables) {
      // Convert demo tables to TableCardData format
      const demoData: TableCardData[] = demoTables.map((table) => ({
        id: table.sessionId,
        table_number: table.tableNumber,
        nickname: table.nickname,
        gender: null,
        age_range: null,
        party_size: null,
        created_at: table.createdAt,
      }));
      setFetchedSessions(demoData);
      return;
    }

    if (!merchantId) return;

    async function fetchTables() {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/tables?merchantId=${merchantId}&excludeSessionId=${currentSessionId || ''}`
        );
        if (response.ok) {
          const data = await response.json();
          const tables: ActiveTable[] = data.tables || [];
          // Convert to TableCardData format
          const tableData: TableCardData[] = tables.map((table) => ({
            id: table.sessionId,
            table_number: table.tableNumber,
            nickname: table.nickname,
            gender: null,
            age_range: null,
            party_size: null,
            created_at: table.createdAt,
          }));
          setFetchedSessions(tableData);
        }
      } catch (error) {
        console.error('Error fetching tables:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTables();
  }, [isSessionBased, merchantId, currentSessionId, isDemoMode, demoTables]);

  // Get sessions data based on mode
  const sessions: TableCardData[] = isSessionBased
    ? propSessions.map((s) => ({
        id: s.id,
        table_number: s.table_number,
        nickname: s.nickname,
        gender: s.gender,
        age_range: s.age_range,
        party_size: s.party_size,
        created_at: s.created_at,
      }))
    : fetchedSessions;

  // Filter sessions based on search query
  const [filteredSessions, setFilteredSessions] = useState<TableCardData[]>(sessions);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredSessions(sessions);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = sessions.filter((session) => {
      const nicknameMatch = session.nickname?.toLowerCase().includes(query);
      const tableNumberMatch = session.table_number.toString().includes(query);
      return nicknameMatch || tableNumberMatch;
    });

    setFilteredSessions(filtered);
  }, [sessions, searchQuery]);

  const handleTableSelect = useCallback(
    (sessionId: string) => {
      const selectedSession = sessions.find((s) => s.id === sessionId);
      if (!selectedSession) return;

      // Convert back to appropriate format for callback
      if (isSessionBased && propSessions) {
        const originalSession = propSessions.find((s) => s.id === sessionId);
        if (originalSession) {
          onSelectTable(originalSession);
          return;
        }
      }

      // For fetch-based mode, convert to ActiveTable format
      const activeTable: ActiveTable = {
        sessionId: selectedSession.id,
        tableNumber: selectedSession.table_number,
        nickname: selectedSession.nickname,
        createdAt: selectedSession.created_at,
      };
      onSelectTable(activeTable);
    },
    [sessions, onSelectTable, isSessionBased, propSessions]
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="glass-panel rounded-xl p-4 border border-steel/30 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-steel/20" />
              <div className="flex-1">
                <div className="h-4 bg-steel/20 rounded w-24 mb-2" />
                <div className="h-3 bg-steel/20 rounded w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-soft-white font-medium">{t('tables.participatingTables')}</h2>
        <span className="text-sm text-muted">
          {t('tables.tableCount', { count: filteredSessions.length })}
        </span>
      </div>

      {/* Empty State */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl border border-steel/30">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-steel/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h2 className="font-display text-2xl text-soft-white mb-3">
            {t('tables.noParticipants')}
          </h2>
          <p className="text-muted mb-6">
            {searchQuery ? t('tables.noSearchResults') : t('tables.newParticipantsNotice')}
          </p>
          <p className="text-sm text-muted">{t('tables.waitForParticipants')}</p>
        </div>
      ) : (
        /* Table Cards */
        filteredSessions.map((session) => (
          <TableCard
            key={session.id}
            tableNumber={session.table_number}
            nickname={session.nickname}
            gender={session.gender}
            ageRange={session.age_range}
            partySize={session.party_size}
            createdAt={session.created_at}
            onClick={() => handleTableSelect(session.id)}
            hasUnread={unreadSessions.has(session.id)}
            isCurrentSession={session.id === currentSessionId}
            sessionId={session.id}
            currentSessionId={currentSessionId || undefined}
          />
        ))
      )}
    </div>
  );
}
