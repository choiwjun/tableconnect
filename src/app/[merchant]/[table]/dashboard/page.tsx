'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  DashboardHeader,
  PopularTablesSidebar,
  TableCardGrid,
  DashboardFooter,
  MobileBottomNav,
  MenuModal,
  TableRegistrationModal,
  TableProfileModal,
} from '@/components/dashboard';
import { SessionExpiryWarning } from '@/components/session/SessionExpiryWarning';
import { Spinner } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useSessionStore } from '@/lib/stores/sessionStore';
import { useTranslation } from '@/lib/i18n/context';
import type { Session, Merchant } from '@/types/database';

// Mock data structure - labels/descriptions come from translations
const mockPopularTablesData = [
  { id: '1', tableNumber: 5, key: 'table05', status: 'hot' as const },
  { id: '2', tableNumber: 1, key: 'vipRoom1', status: 'private' as const },
  { id: '3', tableNumber: 12, key: 'table12', status: 'new' as const },
];

const mockActiveTablesData = [
  {
    id: '1',
    tableNumber: 8,
    key: 'fridayFun',
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
    key: 'musicTalk',
    members: [
      { id: 'm4', nickname: 'Ken' },
      { id: 'm5', nickname: 'Miki' },
    ],
    status: 'music' as const,
  },
  {
    id: '3',
    tableNumber: 2,
    key: 'afterWork',
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
    key: 'privateGathering',
    members: [],
    status: 'private' as const,
    isPrivate: true,
  },
  {
    id: '5',
    tableNumber: 5,
    key: 'birthdayParty',
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
    key: 'quietTalk',
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
  const { t } = useTranslation();
  const [session, setSession] = useState<Session | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'menu' | 'message' | 'order'>('home');
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<typeof mockActiveTables[0] | null>(null);
  const { clearSession } = useSessionStore();

  const merchantSlug = params.merchant;
  const tableNumber = parseInt(params.table, 10);

  // Check if this is demo mode
  const isDemo = merchantSlug === 'demo';

  // Generate translated mock data
  const mockPopularTables = useMemo(() => mockPopularTablesData.map((table) => ({
    ...table,
    label: t(`mockTables.popular.${table.key}.label`),
    description: t(`mockTables.popular.${table.key}.description`),
  })), [t]);

  const mockActiveTables = useMemo(() => mockActiveTablesData.map((table) => ({
    ...table,
    title: t(`mockTables.active.${table.key}.title`),
    description: t(`mockTables.active.${table.key}.description`),
  })), [t]);

  useEffect(() => {
    async function loadSessionAndMerchant() {
      // Demo mode: use mock merchant and check localStorage session
      if (isDemo) {
        const demoMerchant: Merchant = {
          id: 'demo',
          name: 'Demo Store',
          slug: 'demo',
          description: 'Demo store for testing',
          address: null,
          phone: null,
          business_hours: null,
          settings: { max_tables: 50 },
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setMerchant(demoMerchant);

        // Check for existing demo session in localStorage
        const sessionId = localStorage.getItem('tableconnect_session_id');
        if (!sessionId || !sessionId.startsWith('demo-')) {
          router.replace(`/${merchantSlug}/${tableNumber}/profile`);
          return;
        }

        // Create mock session from localStorage data
        const storedSession = localStorage.getItem(`tableconnect_session_demo_${tableNumber}`);
        if (storedSession) {
          setSession({
            id: sessionId,
            merchant_id: 'demo',
            table_number: tableNumber,
            nickname: 'Demo User',
            is_active: true,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          });
        } else {
          router.replace(`/${merchantSlug}/${tableNumber}/profile`);
          return;
        }

        setIsLoading(false);
        return;
      }

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
          setError(t('mockTables.errors.storeNotFound'));
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
        setError(t('mockTables.errors.errorOccurred'));
      } finally {
        setIsLoading(false);
      }
    }

    loadSessionAndMerchant();
  }, [merchantSlug, tableNumber, router, isDemo, t]);

  const handleSessionEnd = () => {
    // Clear session and redirect to profile
    localStorage.removeItem(`tableconnect_session_${merchantSlug}_${tableNumber}`);
    localStorage.removeItem('tableconnect_session_id');
    clearSession();
    router.replace(`/${merchantSlug}/${tableNumber}/profile`);
  };

  const handleTableClick = (tableId: string) => {
    // Find table data and show profile modal
    const table = mockActiveTables.find((t) => t.id === tableId);
    if (table) {
      setSelectedTable(table);
      setShowProfileModal(true);
    }
  };

  const handleSendGift = (tableId: string) => {
    // Open gift flow for that table
    console.log('Send gift to table:', tableId);
  };

  const handleStartChat = (tableId: string) => {
    // Navigate to chat page
    console.log('Start chat with table:', tableId);
    router.push(`/${merchantSlug}/${tableNumber}/chat`);
  };

  // Navigation handlers
  const handleHomeClick = () => {
    setActiveTab('home');
  };

  const handleMenuClick = () => {
    setActiveTab('menu');
    setShowMenuModal(true);
  };

  const handleMessageClick = () => {
    setActiveTab('message');
    router.push(`/${merchantSlug}/${tableNumber}/chat`);
  };

  const handleOrderClick = () => {
    setActiveTab('order');
    // TODO: Show orders modal or navigate to orders page
    console.log('Show orders');
  };

  const handleRegisterClick = () => {
    setShowRegistrationModal(true);
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
          <h1 className="font-display text-2xl text-white mb-4">{t('mockTables.errors.error')}</h1>
          <p className="text-muted mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="btn-neon w-full py-3"
          >
            {t('mockTables.errors.goHome')}
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

      {/* Footer Status Bar (Hidden on mobile) */}
      <div className="hidden md:block">
        <DashboardFooter isConnected={true} version="V1.0.0" />
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        onHomeClick={handleHomeClick}
        onMenuClick={handleMenuClick}
        onMessageClick={handleMessageClick}
        onOrderClick={handleOrderClick}
        onRegisterClick={handleRegisterClick}
      />

      {/* Menu Modal */}
      {merchant && (
        <MenuModal
          isOpen={showMenuModal}
          onClose={() => setShowMenuModal(false)}
          merchantId={merchant.id}
        />
      )}

      {/* Table Registration Modal */}
      <TableRegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        maxTableNumber={merchant?.settings?.max_tables ?? 50}
        onSubmit={async (data) => {
          // Navigate to the new table's profile page
          router.push(`/${merchantSlug}/${data.tableNumber}/profile`);
        }}
      />

      {/* Table Profile Modal */}
      <TableProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        table={selectedTable}
        onSendGift={handleSendGift}
        onStartChat={handleStartChat}
      />
    </div>
  );
}
