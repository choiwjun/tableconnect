'use client';

import { useState, useEffect, useCallback } from 'react';
import { TableCard } from './TableCard';
import { useTranslation } from '@/lib/i18n/context';
import type { Session } from '@/types/database';

interface TableListProps {
  sessions: Session[];
  currentSessionId: string | null;
  onSelectTable: (session: Session) => void;
  unreadSessions?: Set<string>;
  searchQuery?: string;
}

export function TableList({
  sessions,
  currentSessionId,
  onSelectTable,
  unreadSessions = new Set(),
  searchQuery = '',
}: TableListProps) {
  const { t } = useTranslation();
  const [filteredSessions, setFilteredSessions] = useState<Session[]>(sessions);

  // Filter sessions based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredSessions(sessions);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = sessions.filter(session => {
      const nicknameMatch = session.nickname?.toLowerCase().includes(query);
      const tableNumberMatch = session.table_number.toString().includes(query);
      return nicknameMatch || tableNumberMatch;
    });

    setFilteredSessions(filtered);
  }, [sessions, searchQuery]);

  const handleTableSelect = useCallback((sessionId: string) => {
    const selectedSession = sessions.find(s => s.id === sessionId);
    if (!selectedSession) return;

    // Call parent handler
    onSelectTable(selectedSession);
  }, [sessions, onSelectTable]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-soft-white font-medium">
          {t('tables.participatingTables')}
        </h2>
        <span className="text-sm text-muted">
          {t('tables.tableCount', { count: filteredSessions.length })}
        </span>
      </div>

      {/* Empty State */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl border border-steel/30">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-steel/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="font-display text-2xl text-soft-white mb-3">
            {t('tables.noParticipants')}
          </h2>
          <p className="text-muted mb-6">
            {searchQuery ? t('tables.noSearchResults') : t('tables.newParticipantsNotice')}
          </p>
          <p className="text-sm text-muted">
            {t('tables.waitForParticipants')}
          </p>
        </div>
      ) : (
        /* Table Cards */
        filteredSessions.map((session) => (
          <TableCard
            key={session.id}
            sessionId={session.id}
            tableNumber={session.table_number}
            nickname={session.nickname}
            gender={session.gender}
            ageRange={session.age_range}
            partySize={session.party_size}
            createdAt={session.created_at}
            onClick={() => handleTableSelect(session.id)}
            hasUnread={unreadSessions.has(session.id)}
            isCurrentSession={session.id === currentSessionId}
          />
        ))
      )}
    </div>
  );
}
