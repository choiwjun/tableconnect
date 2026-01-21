'use client';

import { useState, useEffect } from 'react';

interface JoinEvent {
  type: 'request' | 'session';
  id: string;
  // Request fields
  tableFrom?: number;
  tableTo?: number;
  fromNickname?: string;
  toNickname?: string;
  templateType?: string;
  createdAt?: string;
  respondedAt?: string;
  // Session fields
  tableA?: number;
  tableB?: number;
  joinCode?: string;
  nicknameA?: string;
  nicknameB?: string;
  startedAt?: string;
  endsAt?: string;
  confirmedAt?: string;
  endedAt?: string;
  endReason?: string;
  // Common
  status: string;
}

interface JoinStats {
  pendingRequests: number;
  activeJoinSessions: number;
  todayRequests: number;
  todayAccepted: number;
}

interface JoinEventsPanelProps {
  merchantId: string;
}

export function JoinEventsPanel({ merchantId }: JoinEventsPanelProps) {
  const [events, setEvents] = useState<JoinEvent[]>([]);
  const [stats, setStats] = useState<JoinStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active'>('all');

  const fetchEvents = async () => {
    try {
      const response = await fetch(`/api/admin/join?merchantId=${merchantId}&status=${filter}`);
      const data = await response.json();

      if (response.ok) {
        setEvents(data.events || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Error fetching join events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [merchantId, filter]);

  const handleConfirmSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/join/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm' }),
      });

      if (response.ok) {
        fetchEvents();
      }
    } catch (error) {
      console.error('Error confirming session:', error);
    }
  };

  const handleEndSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/join/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end', staffId: 'admin' }),
      });

      if (response.ok) {
        fetchEvents();
      }
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (event: JoinEvent) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: '待機中' },
      accepted: { bg: 'bg-green-500/20', text: 'text-green-400', label: '承認済' },
      rejected: { bg: 'bg-red-500/20', text: 'text-red-400', label: '拒否' },
      expired: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: '期限切れ' },
      cancelled: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'キャンセル' },
      pending_confirmation: { bg: 'bg-neon-cyan/20', text: 'text-neon-cyan', label: '確認待ち' },
      confirmed: { bg: 'bg-neon-green/20', text: 'text-neon-green', label: '確認済' },
      ended: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: '終了' },
    };

    const config = statusConfig[event.status] || statusConfig['pending'];

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getTemplateLabel = (templateType: string) => {
    const labels: Record<string, string> = {
      available_now: '今すぐ可能',
      available_soon: '10分後可能',
      drink_together: 'もう一杯',
    };
    return labels[templateType] || templateType;
  };

  if (isLoading) {
    return (
      <div className="bg-deep-gray rounded-xl p-6 border border-white/10">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-1/3" />
          <div className="h-20 bg-white/10 rounded" />
          <div className="h-20 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-deep-gray rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-neon-pink/10 to-neon-purple/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤝</span>
            <h3 className="text-lg font-display text-soft-white">合席イベント</h3>
          </div>
          <button
            onClick={fetchEvents}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-muted-gray">refresh</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 p-4 border-b border-white/5">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400">{stats.pendingRequests}</p>
            <p className="text-xs text-muted-gray">待機中</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-neon-cyan">{stats.activeJoinSessions}</p>
            <p className="text-xs text-muted-gray">進行中</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-soft-white">{stats.todayRequests}</p>
            <p className="text-xs text-muted-gray">今日の要求</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-neon-green">{stats.todayAccepted}</p>
            <p className="text-xs text-muted-gray">今日の成立</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="px-4 py-2 border-b border-white/5 flex gap-2">
        {(['all', 'pending', 'active'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filter === f
                ? 'bg-neon-cyan/20 text-neon-cyan'
                : 'text-muted-gray hover:text-soft-white'
            }`}
          >
            {f === 'all' ? '全て' : f === 'pending' ? '待機中' : '進行中'}
          </button>
        ))}
      </div>

      {/* Events List */}
      <div className="max-h-96 overflow-y-auto">
        {events.length === 0 ? (
          <div className="p-8 text-center text-muted-gray">
            イベントがありません
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {events.map((event) => (
              <div key={`${event.type}-${event.id}`} className="p-4 hover:bg-white/5 transition-colors">
                {event.type === 'request' ? (
                  // Join Request
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <span className="text-lg font-bold text-neon-pink">T{event.tableFrom}</span>
                        <span className="text-muted-gray mx-2">→</span>
                        <span className="text-lg font-bold text-neon-purple">T{event.tableTo}</span>
                      </div>
                      <div>
                        <p className="text-sm text-soft-white">
                          {event.fromNickname} → {event.toNickname}
                        </p>
                        <p className="text-xs text-muted-gray">
                          {getTemplateLabel(event.templateType || '')} • {formatTime(event.createdAt || '')}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(event)}
                  </div>
                ) : (
                  // Join Session
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <span className="text-lg font-bold text-neon-cyan">T{event.tableA}</span>
                        <span className="text-neon-cyan mx-2">🤝</span>
                        <span className="text-lg font-bold text-neon-cyan">T{event.tableB}</span>
                      </div>
                      <div>
                        <p className="text-sm text-soft-white font-mono">
                          コード: <span className="text-neon-cyan">{event.joinCode}</span>
                        </p>
                        <p className="text-xs text-muted-gray">
                          {event.nicknameA} & {event.nicknameB} • {formatTime(event.startedAt || '')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(event)}
                      {event.status === 'pending_confirmation' && (
                        <button
                          onClick={() => handleConfirmSession(event.id)}
                          className="px-3 py-1 rounded-lg bg-neon-green/20 text-neon-green text-xs hover:bg-neon-green/30 transition-colors"
                        >
                          確認
                        </button>
                      )}
                      {(event.status === 'pending_confirmation' || event.status === 'confirmed') && (
                        <button
                          onClick={() => handleEndSession(event.id)}
                          className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition-colors"
                        >
                          終了
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
