import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Message } from '@/types/database';

interface ChatState {
  // Messages grouped by partner session ID
  conversations: Record<string, Message[]>;
  // Current input text
  inputText: string;
  // Currently selected partner ID
  activePartnerId: string | null;
  // Unread count per partner
  unreadCounts: Record<string, number>;
  // Loading state
  isLoading: boolean;
  // Error message
  error: string | null;

  // Actions
  setMessages: (partnerId: string, messages: Message[]) => void;
  addMessage: (partnerId: string, message: Message) => void;
  setInputText: (text: string) => void;
  setActivePartner: (partnerId: string | null) => void;
  incrementUnread: (partnerId: string) => void;
  clearUnread: (partnerId: string) => void;
  markMessageAsRead: (partnerId: string, messageId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearChat: (partnerId: string) => void;
  clearAllChats: () => void;
}

export const useChatStore = create<ChatState>()(
  devtools(
    (set) => ({
      conversations: {},
      inputText: '',
      activePartnerId: null,
      unreadCounts: {},
      isLoading: false,
      error: null,

      setMessages: (partnerId, messages) =>
        set(
          (state) => ({
            conversations: {
              ...state.conversations,
              [partnerId]: messages,
            },
          }),
          false,
          'setMessages'
        ),

      addMessage: (partnerId, message) =>
        set(
          (state) => ({
            conversations: {
              ...state.conversations,
              [partnerId]: [
                message,
                ...(state.conversations[partnerId] || []),
              ],
            },
          }),
          false,
          'addMessage'
        ),

      setInputText: (text) =>
        set({ inputText: text }, false, 'setInputText'),

      setActivePartner: (partnerId) =>
        set({ activePartnerId: partnerId }, false, 'setActivePartner'),

      incrementUnread: (partnerId) =>
        set(
          (state) => ({
            unreadCounts: {
              ...state.unreadCounts,
              [partnerId]: (state.unreadCounts[partnerId] || 0) + 1,
            },
          }),
          false,
          'incrementUnread'
        ),

      clearUnread: (partnerId) =>
        set(
          (state) => ({
            unreadCounts: {
              ...state.unreadCounts,
              [partnerId]: 0,
            },
          }),
          false,
          'clearUnread'
        ),

      markMessageAsRead: (partnerId, messageId) =>
        set(
          (state) => ({
            conversations: {
              ...state.conversations,
              [partnerId]: (state.conversations[partnerId] || []).map((msg) =>
                msg.id === messageId ? { ...msg, is_read: true } : msg
              ),
            },
          }),
          false,
          'markMessageAsRead'
        ),

      setLoading: (loading) =>
        set({ isLoading: loading }, false, 'setLoading'),

      setError: (error) =>
        set({ error }, false, 'setError'),

      clearChat: (partnerId) =>
        set(
          (state) => {
            const { [partnerId]: _removed, ...rest } = state.conversations;
            const { [partnerId]: _removedUnread, ...restUnread } = state.unreadCounts;
            void _removed;
            void _removedUnread;
            return {
              conversations: rest,
              unreadCounts: restUnread,
              activePartnerId:
                state.activePartnerId === partnerId
                  ? null
                  : state.activePartnerId,
            };
          },
          false,
          'clearChat'
        ),

      clearAllChats: () =>
        set(
          {
            conversations: {},
            inputText: '',
            activePartnerId: null,
            unreadCounts: {},
          },
          false,
          'clearAllChats'
        ),
    }),
    { name: 'ChatStore' }
  )
);

// Selectors
export const selectConversation = (partnerId: string) => (state: ChatState) =>
  state.conversations[partnerId] || [];

export const selectUnreadCount = (partnerId: string) => (state: ChatState) =>
  state.unreadCounts[partnerId] || 0;

export const selectTotalUnread = (state: ChatState) =>
  Object.values(state.unreadCounts).reduce((sum, count) => sum + count, 0);
