import { create } from 'zustand';

interface Gift {
  id: string;
  amount: number;
  message: string | null;
  status: string;
  createdAt: string;
  paidAt: string | null;
  menu: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
  } | null;
  sender: {
    id: string;
    nickname: string;
    table_number: number;
  } | null;
  receiver: {
    id: string;
    nickname: string;
    table_number: number;
  } | null;
  isSent: boolean;
}

interface PendingNotification {
  id: string;
  menuName: string;
  senderNickname: string;
  senderTableNumber: number;
  message: string | null;
  amount: number;
}

interface GiftState {
  // Gift history
  gifts: Gift[];
  isLoading: boolean;
  error: string | null;

  // Pending gift notifications
  pendingNotifications: PendingNotification[];

  // Actions
  setGifts: (gifts: Gift[]) => void;
  addGift: (gift: Gift) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Notification actions
  addNotification: (notification: PendingNotification) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Fetch actions
  fetchGifts: (sessionId: string, type?: 'sent' | 'received' | 'all') => Promise<void>;
}

export const useGiftStore = create<GiftState>((set, get) => ({
  gifts: [],
  isLoading: false,
  error: null,
  pendingNotifications: [],

  setGifts: (gifts) => set({ gifts }),

  addGift: (gift) => set((state) => ({
    gifts: [gift, ...state.gifts],
  })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  addNotification: (notification) => set((state) => ({
    pendingNotifications: [...state.pendingNotifications, notification],
  })),

  removeNotification: (id) => set((state) => ({
    pendingNotifications: state.pendingNotifications.filter((n) => n.id !== id),
  })),

  clearNotifications: () => set({ pendingNotifications: [] }),

  fetchGifts: async (sessionId, type = 'all') => {
    const { setLoading, setError, setGifts } = get();

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/gifts?sessionId=${sessionId}&type=${type}`);

      if (!response.ok) {
        throw new Error('Failed to fetch gifts');
      }

      const data = await response.json();
      setGifts(data.gifts);
    } catch (err) {
      console.error('Error fetching gifts:', err);
      setError(err instanceof Error ? err.message : 'ギフト履歴の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  },
}));
