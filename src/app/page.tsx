'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DashboardHeader,
  PopularTablesSidebar,
  PopularTablesHorizontal,
  TableCardGrid,
  DashboardFooter,
  MenuModal,
  MobileBottomNav,
  TableRegistrationModal,
  TableProfileModal,
  OrderHistoryModal,
} from '@/components/dashboard';
import { useSessionStore } from '@/lib/stores/sessionStore';

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

export default function Home() {
  const router = useRouter();
  const { setCurrentSession, setMerchantInfo } = useSessionStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<typeof mockActiveTables[0] | null>(null);

  const handleTableClick = (tableId: string) => {
    const table = mockActiveTables.find((t) => t.id === tableId);
    if (table) {
      setSelectedTable(table);
      setIsProfileOpen(true);
    }
  };

  const handleSendGift = (tableId: string) => {
    console.log('Send gift to table:', tableId);
  };

  const handleStartChat = (tableId: string) => {
    // Open registration to create session first
    setIsProfileOpen(false);
    setIsRegistrationOpen(true);
  };

  const handleTableRegistration = async (data: {
    tableNumber: number;
    nickname: string;
    tableTitle?: string;
  }) => {
    // Home page is for demo purposes - create local session without API call
    // Real merchant pages (/[merchant]/[table]/...) handle actual Supabase integration
    const demoSessionId = `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

    // Store session in localStorage
    localStorage.setItem('tableconnect_session_id', demoSessionId);
    localStorage.setItem(`tableconnect_session_demo_${data.tableNumber}`, demoSessionId);

    // Store session in sessionStore for chat page
    setCurrentSession({
      id: demoSessionId,
      merchant_id: 'demo',
      table_number: data.tableNumber,
      nickname: data.nickname,
      is_active: true,
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
    });
    setMerchantInfo('demo', data.tableNumber);

    // Navigate to chat page
    router.push(`/demo/${data.tableNumber}/chat`);
  };

  return (
    <div className="bg-background-dark text-white font-body antialiased selection:bg-primary selection:text-black overflow-hidden h-screen flex flex-col">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 bg-gradient-radial from-[#1a2530] via-background-dark to-black z-0" />

      {/* Header */}
      <DashboardHeader
        merchantName="Tokyo Shinjuku"
        isOnline={true}
        onMenuClick={() => setIsMenuOpen(true)}
      />

      {/* Main Content Area - pb-20 for mobile bottom nav space, md:pb-4 for desktop */}
      <main className="relative z-10 flex flex-col lg:flex-row flex-1 overflow-hidden p-4 gap-4 pb-20 md:pb-4">
        {/* Mobile: Horizontal Popular Tables */}
        <PopularTablesHorizontal
          tables={mockPopularTables}
          onTableClick={handleTableClick}
        />

        {/* Desktop: Left Sidebar - Real-time Popular */}
        <div className="hidden lg:block flex-none">
          <PopularTablesSidebar
            tables={mockPopularTables}
            onTableClick={handleTableClick}
            onRegisterClick={() => setIsRegistrationOpen(true)}
          />
        </div>

        {/* Central Discovery Hub */}
        <TableCardGrid
          tables={mockActiveTables}
          locationName="Live Feed • Tokyo Shinjuku"
          onViewProfile={handleTableClick}
          onSendGift={handleSendGift}
        />
      </main>

      {/* Footer Status Bar - Hidden on mobile */}
      <div className="hidden md:block">
        <DashboardFooter isConnected={true} version="V1.0.0" />
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab="home"
        onHomeClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onMenuClick={() => setIsMenuOpen(true)}
        onMessageClick={() => setIsRegistrationOpen(true)}
        onOrderClick={() => setIsOrderHistoryOpen(true)}
        onRegisterClick={() => setIsRegistrationOpen(true)}
      />

      {/* Menu Modal */}
      <MenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        merchantName="Tokyo Shinjuku"
      />

      {/* Table Registration Modal */}
      <TableRegistrationModal
        isOpen={isRegistrationOpen}
        onClose={() => setIsRegistrationOpen(false)}
        onSubmit={handleTableRegistration}
        maxTableNumber={50}
      />

      {/* Table Profile Modal */}
      <TableProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        table={selectedTable}
        onSendGift={handleSendGift}
        onStartChat={handleStartChat}
      />

      {/* Order History Modal */}
      <OrderHistoryModal
        isOpen={isOrderHistoryOpen}
        onClose={() => setIsOrderHistoryOpen(false)}
      />
    </div>
  );
}
