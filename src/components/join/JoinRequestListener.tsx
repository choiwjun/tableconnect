'use client';

import { useState, useEffect, useCallback } from 'react';
import { JoinRequestPopup } from './JoinRequestPopup';
import { JoinConfirmationScreen } from './JoinConfirmationScreen';
import { createClient } from '@/lib/supabase/client';

interface JoinRequest {
  id: string;
  from_table_number: number;
  template_type: string;
  created_at: string;
  expires_at: string;
  from_session: {
    id: string;
    nickname: string;
    gender: string | null;
    age_range: string | null;
    party_size: number | null;
  };
}

interface JoinSession {
  id: string;
  joinCode: string;
  tableA: number;
  tableB: number;
  endsAt: string;
}

interface JoinRequestListenerProps {
  sessionId: string;
  tableNumber: number;
  onJoinSessionCreated?: (joinSession: JoinSession) => void;
}

export function JoinRequestListener({
  sessionId,
  tableNumber,
  onJoinSessionCreated,
}: JoinRequestListenerProps) {
  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([]);
  const [currentRequest, setCurrentRequest] = useState<JoinRequest | null>(null);
  const [joinSession, setJoinSession] = useState<JoinSession | null>(null);
  const supabase = createClient();

  // Fetch pending requests
  const fetchPendingRequests = useCallback(async () => {
    try {
      const response = await fetch(`/api/join/requests?sessionId=${sessionId}&type=received`);
      if (response.ok) {
        const data = await response.json();
        setPendingRequests(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching join requests:', error);
    }
  }, [sessionId]);

  // Initial fetch
  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  // Realtime subscription for new join requests
  useEffect(() => {
    const channel = supabase
      .channel(`join_requests_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'join_requests',
          filter: `to_session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('New join request received:', payload);
          fetchPendingRequests();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'join_requests',
          filter: `to_session_id=eq.${sessionId}`,
        },
        () => {
          fetchPendingRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, sessionId, fetchPendingRequests]);

  // Show first pending request as popup
  useEffect(() => {
    if (pendingRequests.length > 0 && !currentRequest && !joinSession) {
      setCurrentRequest(pendingRequests[0]);
    }
  }, [pendingRequests, currentRequest, joinSession]);

  const handleAccept = (newJoinSession: JoinSession) => {
    setCurrentRequest(null);
    setJoinSession(newJoinSession);
    onJoinSessionCreated?.(newJoinSession);

    // Remove from pending
    setPendingRequests((prev) =>
      prev.filter((r) => r.id !== currentRequest?.id)
    );
  };

  const handleReject = () => {
    // Remove from pending and show next
    setPendingRequests((prev) =>
      prev.filter((r) => r.id !== currentRequest?.id)
    );
    setCurrentRequest(null);
  };

  const handleCloseConfirmation = () => {
    setJoinSession(null);
  };

  // Don't render anything if no active request or session
  if (!currentRequest && !joinSession) {
    return null;
  }

  return (
    <>
      {/* Join Request Popup */}
      {currentRequest && !joinSession && (
        <JoinRequestPopup
          request={currentRequest}
          sessionId={sessionId}
          onAccept={handleAccept}
          onReject={handleReject}
          onClose={() => setCurrentRequest(null)}
        />
      )}

      {/* Join Confirmation Screen */}
      {joinSession && (
        <JoinConfirmationScreen
          joinSession={joinSession}
          myTableNumber={tableNumber}
          partnerTableNumber={
            joinSession.tableA === tableNumber
              ? joinSession.tableB
              : joinSession.tableA
          }
          onClose={handleCloseConfirmation}
        />
      )}
    </>
  );
}
