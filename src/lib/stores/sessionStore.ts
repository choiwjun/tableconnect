import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Session, Gender, AgeRange } from '@/types/database';

interface SessionState {
  // Current user session
  currentSession: Session | null;
  // Partner session (chat partner)
  partnerSession: Pick<Session, 'id' | 'table_number' | 'nickname' | 'gender' | 'age_range' | 'party_size'> | null;
  // Merchant ID from URL
  merchantId: string | null;
  // Table number from URL
  tableNumber: number | null;

  // Actions
  setCurrentSession: (session: Session | null) => void;
  setPartnerSession: (session: Pick<Session, 'id' | 'table_number' | 'nickname' | 'gender' | 'age_range' | 'party_size'> | null) => void;
  setMerchantInfo: (merchantId: string, tableNumber: number) => void;
  clearSession: () => void;
  updateNickname: (nickname: string) => void;
  updateProfile: (profile: { gender: Gender; ageRange: AgeRange; partySize: number }) => void;
}

export const useSessionStore = create<SessionState>()(
  devtools(
    persist(
      (set) => ({
        currentSession: null,
        partnerSession: null,
        merchantId: null,
        tableNumber: null,

        setCurrentSession: (session) =>
          set({ currentSession: session }, false, 'setCurrentSession'),

        setPartnerSession: (session) =>
          set({ partnerSession: session }, false, 'setPartnerSession'),

        setMerchantInfo: (merchantId, tableNumber) =>
          set({ merchantId, tableNumber }, false, 'setMerchantInfo'),

        clearSession: () =>
          set(
            {
              currentSession: null,
              partnerSession: null,
              merchantId: null,
              tableNumber: null,
            },
            false,
            'clearSession'
          ),

        updateNickname: (nickname) =>
          set(
            (state) => ({
              currentSession: state.currentSession
                ? { ...state.currentSession, nickname }
                : null,
            }),
            false,
            'updateNickname'
          ),

        updateProfile: (profile) =>
          set(
            (state) => ({
              currentSession: state.currentSession
                ? { ...state.currentSession, ...profile }
                : null,
            }),
            false,
            'updateProfile'
          ),
      }),
      {
        name: 'tableconnect-session',
        partialize: (state) => ({
          currentSession: state.currentSession,
          merchantId: state.merchantId,
          tableNumber: state.tableNumber,
        }),
      }
    ),
    { name: 'SessionStore' }
  )
);
