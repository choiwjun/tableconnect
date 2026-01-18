'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  DashboardHeader,
  PopularTablesSidebar,
  TableCardGrid,
  DashboardFooter,
} from '@/components/dashboard';
import { SessionExpiryWarning } from '@/components/session/SessionExpiryWarning';
import { Spinner } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useSessionStore } from '@/lib/stores/sessionStore';
import type { Session, Merchant } from '@/types/database';

// Mock data for demo - in production, this would come from Supabase realtime
const mockPopularTables = [
  {
    id: '1',
    tableNumber: 5,
    label: 'Table 05',
    status: 'hot' as const,
    description: '🔥 분위기 최고조 (Hype)',
  },
  {
    id: '2',
    tableNumber: 1,
    label: 'VIP Room 1',
    status: 'private' as const,
    description: '비밀 대화 중 (Private)',
  },
  {
    id: '3',
    tableNumber: 12,
    label: 'Table 12',
    status: 'new' as const,
    description: '새로운 만남 대기 (Waiting)',
  },
];

const mockActiveTables = [
  {
    id: '1',
    tableNumber: 8,
    title: '즐거운 금요일! 🍻',
    description: '도쿄 여행 온 친구들끼리 한잔 중입니다. 합석 환영해요!',
    members: [
      { id: 'm1', nickname: 'Yuki' },
      { id: 'm2', nickname: 'Taro' },
      { id: 'm3', nickname: 'Hana' },
    ],
    status: 'active' as const,
  },
  {
    id: '2',
    tableNumber: 14,
    title: '음악 얘기할 사람 🎵',
    description: '시티팝 좋아하는 사람들 모여라. 신청곡 받습니다.',
    members: [
      { id: 'm4', nickname: 'Ken' },
      { id: 'm5', nickname: 'Miki' },
    ],
    status: 'music' as const,
  },
  {
    id: '3',
    tableNumber: 2,
    title: '회사 뒤풀이 중 💼',
    description: '직장인들의 고충 토로... 같이 욕해줄 사람 구함',
    members: [
      { id: 'm6', nickname: 'Sato' },
      { id: 'm7', nickname: 'Yamada' },
      { id: 'm8', nickname: 'Tanaka' },
      { id: 'm9', nickname: 'Suzuki' },
    ],
    status: 'active' as const,
  },
  {
    id: '4',
    tableNumber: 99,
    title: '비공개 모임',
    description: 'VIP 전용 테이블입니다.',
    members: [],
    status: 'private' as const,
    isPrivate: true,
  },
  {
    id: '5',
    tableNumber: 5,
    title: '생일 축하해 🎂',
    description: '친구 생일 파티 중입니다! 케이크 나눠드려요.',
    members: [
      { id: 'm10', nickname: 'Akiko' },
      { id: 'm11', nickname: 'Naomi' },
      { id: 'm12', nickname: 'Ryo' },
      { id: 'm13', nickname: 'Kenji' },
      { id: 'm14', nickname: 'Yui' },
      { id: 'm15', nickname: 'Haruto' },
      { id: 'm16', nickname: 'Sakura' },
      { id: 'm17', nickname: 'Takeshi' },
      { id: 'm18', nickname: 'Mai' },
    ],
    status: 'active' as const,
  },
  {
    id: '6',
    tableNumber: 22,
    title: '조용한 대화',
    description: '진지한 이야기 중. 방해 금지 부탁드려요.',
    members: [
      { id: 'm19', nickname: 'Emi' },
      { id: 'm20', nickname: 'Daiki' },
    ],
    status: 'busy' as const,
  },
];

export default function DashboardPage() {
  const params = useParams<{ merchant: string; table: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { clearSession } = useSessionStore();

  const merchantSlug = params.merchant;
  const tableNumber = parseInt(params.table, 10);

  useEffect(() => {
    async function loadSessionAndMerchant() {
      const supabase = createClient();

      try {
        // Load merchant info
        const { data: merchantData, error: merchantError } = await supabase
          .from('merchants')
          .select('*')
          .eq('slug', merchantSlug)
          .eq('is_active', true)
          .single();

        if (merchantError || !merchantData) {
          setError('店舗が見つかりません');
          setIsLoading(false);
          return;
        }

        setMerchant(merchantData as Merchant);

        // Check for existing session in localStorage
        const sessionId = localStorage.getItem(
          `tableconnect_session_${merchantSlug}_${tableNumber}`
        );

        if (!sessionId) {
          // No session - redirect to profile page
          router.replace(`/${merchantSlug}/${tableNumber}/profile`);
          return;
        }

        // Load session
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionId)
          .eq('status', 'active')
          .single();

        if (sessionError || !sessionData) {
          // Session expired or invalid - clear and redirect
          localStorage.removeItem(
            `tableconnect_session_${merchantSlug}_${tableNumber}`
          );
          router.replace(`/${merchantSlug}/${tableNumber}/profile`);
          return;
        }

        setSession(sessionData as Session);
      } catch (err) {
        console.error('Error loading session:', err);
        setError('エラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    }

    loadSessionAndMerchant();
  }, [merchantSlug, tableNumber, router]);

  const handleSessionEnd = () => {
    // Clear session and redirect to profile
    localStorage.removeItem(`tableconnect_session_${merchantSlug}_${tableNumber}`);
    localStorage.removeItem('tableconnect_session_id');
    clearSession();
    router.replace(`/${merchantSlug}/${tableNumber}/profile`);
  };

  const handleTableClick = (tableId: string) => {
    // Navigate to chat with that table
    console.log('Navigate to table:', tableId);
  };

  const handleSendGift = (tableId: string) => {
    // Open gift flow for that table
    console.log('Send gift to table:', tableId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="glass-panel rounded-2xl p-8 text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-red-400">
              error
            </span>
          </div>
          <h1 className="font-display text-2xl text-white mb-4">エラー</h1>
          <p className="text-muted mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="btn-neon w-full py-3"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-dark text-white font-body antialiased selection:bg-primary selection:text-black overflow-hidden h-screen flex flex-col">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 bg-gradient-radial from-[#1a2530] via-background-dark to-black z-0" />

      {/* Session Expiry Warning */}
      <SessionExpiryWarning
        session={session}
        onSessionEnd={handleSessionEnd}
      />

      {/* Header */}
      <DashboardHeader
        merchantName={merchant?.name}
        nickname={session?.nickname ?? undefined}
        isOnline={true}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex flex-1 overflow-hidden p-4 gap-4">
        {/* Left Sidebar: Real-time Popular (Hidden on mobile) */}
        <div className="hidden lg:block">
          <PopularTablesSidebar
            tables={mockPopularTables}
            onTableClick={handleTableClick}
            onRegisterClick={() => {
              console.log('Register table');
            }}
          />
        </div>

        {/* Central Discovery Hub */}
        <TableCardGrid
          tables={mockActiveTables}
          locationName={`Live Feed • ${merchant?.name || 'TableConnect'}`}
          onViewProfile={handleTableClick}
          onSendGift={handleSendGift}
        />
      </main>

      {/* Footer Status Bar */}
      <DashboardFooter isConnected={true} version="V1.0.0" />
    </div>
  );
}
