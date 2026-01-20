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
  {
    id: '4',
    tableNumber: 8,
    label: 'Table 08',
    status: 'hot' as const,
    description: '🎉 분위기 최고! (Hot)',
  },
  {
    id: '5',
    tableNumber: 25,
    label: 'Table 25',
    status: 'new' as const,
    description: '👋 새로운 팀 (New Team)',
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
  {
    id: '7',
    tableNumber: 15,
    title: '한국 여행객들 🇰🇷',
    description: '서울에서 왔어요! 일본 친구들 사귀고 싶어요.',
    members: [
      { id: 'm21', nickname: 'Minji' },
      { id: 'm22', nickname: 'Jin' },
      { id: 'm23', nickname: 'Sora' },
      { id: 'm24', nickname: 'Hyeon' },
    ],
    status: 'active' as const,
  },
  {
    id: '8',
    tableNumber: 33,
    title: '개발자 모임 💻',
    description: 'React, TypeScript 얘기할 사람! 취업 정보도 공유해요.',
    members: [
      { id: 'm25', nickname: 'CodeMaster' },
      { id: 'm26', nickname: 'FrontendKing' },
      { id: 'm27', nickname: 'FullStackSam' },
    ],
    status: 'music' as const,
  },
  {
    id: '9',
    tableNumber: 7,
    title: '맛집 투어 중 🍜',
    description: '도쿄 맛집 여행 중이에요. 추천 부탁드려요!',
    members: [
      { id: 'm28', nickname: 'FoodieKun' },
      { id: 'm29', nickname: 'RamenLover' },
      { id: 'm30', nickname: 'SushiGirl' },
    ],
    status: 'active' as const,
  },
  {
    id: '10',
    tableNumber: 18,
    title: '게임할 사람? 🎮',
    description: '스마트폰 게임 팀원 찾아요. 랭크 상관없어요!',
    members: [
      { id: 'm31', nickname: 'GamerX' },
      { id: 'm32', nickname: 'ProPlayer' },
      { id: 'm33', nickname: 'CasualGamer' },
    ],
    status: 'active' as const,
  },
  {
    id: '11',
    tableNumber: 11,
    title: '술자리 찾아요 🍶',
    description: '혼자 왔는데 같이 마실 사람 구합니다!',
    members: [
      { id: 'm34', nickname: 'SoloDrinker' },
    ],
    status: 'new' as const,
  },
  {
    id: '12',
    tableNumber: 26,
    title: '취업 면접 준비중 📝',
    description: '면접 준비하는 분들끼리 정보 공유할까요?',
    members: [
      { id: 'm35', nickname: 'JobHunter1' },
      { id: 'm36', nickname: 'JobHunter2' },
    ],
    status: 'active' as const,
  },
  {
    id: '13',
    tableNumber: 40,
    title: '팬클럽 모임 💖',
    description: 'K-POP 좋아하는 사람들 모임!',
    members: [
      { id: 'm37', nickname: 'ArmyForever' },
      { id: 'm38', nickname: 'BlinkForever' },
      { id: 'm39', nickname: 'KpopFan' },
      { id: 'm40', nickname: 'StanGirl' },
      { id: 'm41', nickname: 'IdolLover' },
    ],
    status: 'music' as const,
  },
  {
    id: '14',
    tableNumber: 6,
    title: '사진 찍는 중 📸',
    description: '인스타그램용 사진 찍어요! 같이 찍을 사람?',
    members: [
      { id: 'm42', nickname: 'InstaGirl' },
      { id: 'm43', nickname: 'PhotoBoy' },
    ],
    status: 'active' as const,
  },
  {
    id: '15',
    tableNumber: 30,
    title: '외국인 친구 구함 🌍',
    description: '영어 회화 연습하고 싶어요! 언어 상관없어요.',
    members: [
      { id: 'm44', nickname: 'EnglishLearner' },
      { id: 'm45', nickname: 'GlobalCitizen' },
    ],
    status: 'new' as const,
  },
  {
    id: '16',
    tableNumber: 45,
    title: '주말 데이트 중 💕',
    description: '데이트 장소 추천 부탁드려요!',
    members: [
      { id: 'm46', nickname: 'CoupleGirl' },
      { id: 'm47', nickname: 'CoupleBoy' },
    ],
    status: 'private' as const,
  },
  {
    id: '17',
    tableNumber: 19,
    title: '운동 동료 찾아요 🏋️',
    description: '헬스장 같이 갈 사람 구해요! PT 트레이너도 환영',
    members: [
      { id: 'm48', nickname: 'GymRat' },
      { id: 'm49', nickname: 'FitnessKing' },
    ],
    status: 'active' as const,
  },
  {
    id: '18',
    tableNumber: 9,
    title: '맛있는 거 먹어요 🍣',
    description: '오늘 회식이에요! 같이 즐겁게 먹어요.',
    members: [
      { id: 'm50', nickname: 'ManagerSama' },
      { id: 'm51', nickname: 'Employee1' },
      { id: 'm52', nickname: 'Employee2' },
      { id: 'm53', nickname: 'Employee3' },
      { id: 'm54', nickname: 'Employee4' },
    ],
    status: 'active' as const,
  },
  {
    id: '19',
    tableNumber: 13,
    title: '주식 투자자 모임 📈',
    description: '주식 정보 공유해요! 수익률 자랑도 환영',
    members: [
      { id: 'm55', nickname: 'StockKing' },
      { id: 'm56', nickname: 'CryptoTrader' },
      { id: 'm57', nickname: 'InvestorGuru' },
    ],
    status: 'busy' as const,
  },
  {
    id: '20',
    tableNumber: 38,
    title: '영화 좋아하는 사람 🎬',
    description: '최신 영화 이야기 나눠요! 감독, 배우 얘기도 OK',
    members: [
      { id: 'm58', nickname: 'MovieBuff' },
      { id: 'm59', nickname: 'CinemaLover' },
      { id: 'm60', nickname: 'FilmCritic' },
    ],
    status: 'music' as const,
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleStartChat = (_tableId: string) => {
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
      gender: null,
      age_range: null,
      party_size: null,
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
      <main className="relative z-10 flex flex-col lg:flex-row flex-1 overflow-hidden p-4 gap-4 pb-20 md:pb-4 stagger-children">
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
