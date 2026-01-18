import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore, selectConversation, selectUnreadCount, selectTotalUnread } from '../chatStore';
import type { Message } from '@/types/database';

const createMockMessage = (overrides: Partial<Message> = {}): Message => ({
  id: `msg-${Math.random().toString(36).slice(2)}`,
  sender_session_id: 'sender-1',
  receiver_session_id: 'receiver-1',
  content: 'Test message',
  is_read: false,
  created_at: new Date().toISOString(),
  ...overrides,
});

describe('chatStore', () => {
  beforeEach(() => {
    useChatStore.setState({
      conversations: {},
      inputText: '',
      activePartnerId: null,
      unreadCounts: {},
      isLoading: false,
      error: null,
    });
  });

  describe('setMessages', () => {
    it('should set messages for a partner', () => {
      const messages = [
        createMockMessage({ id: 'msg-1' }),
        createMockMessage({ id: 'msg-2' }),
      ];

      useChatStore.getState().setMessages('partner-1', messages);

      expect(useChatStore.getState().conversations['partner-1']).toEqual(messages);
    });

    it('should replace existing messages', () => {
      const oldMessages = [createMockMessage({ id: 'old-1' })];
      const newMessages = [createMockMessage({ id: 'new-1' })];

      useChatStore.getState().setMessages('partner-1', oldMessages);
      useChatStore.getState().setMessages('partner-1', newMessages);

      expect(useChatStore.getState().conversations['partner-1']).toEqual(newMessages);
    });
  });

  describe('addMessage', () => {
    it('should add a message to the beginning of conversation', () => {
      const existingMsg = createMockMessage({ id: 'existing' });
      const newMsg = createMockMessage({ id: 'new' });

      useChatStore.getState().setMessages('partner-1', [existingMsg]);
      useChatStore.getState().addMessage('partner-1', newMsg);

      const messages = useChatStore.getState().conversations['partner-1'];
      expect(messages[0].id).toBe('new');
      expect(messages[1].id).toBe('existing');
    });

    it('should create conversation if it does not exist', () => {
      const newMsg = createMockMessage({ id: 'new' });

      useChatStore.getState().addMessage('new-partner', newMsg);

      expect(useChatStore.getState().conversations['new-partner']).toHaveLength(1);
    });
  });

  describe('setInputText', () => {
    it('should set input text', () => {
      useChatStore.getState().setInputText('Hello world');

      expect(useChatStore.getState().inputText).toBe('Hello world');
    });
  });

  describe('setActivePartner', () => {
    it('should set active partner', () => {
      useChatStore.getState().setActivePartner('partner-1');

      expect(useChatStore.getState().activePartnerId).toBe('partner-1');
    });

    it('should clear active partner when null', () => {
      useChatStore.getState().setActivePartner('partner-1');
      useChatStore.getState().setActivePartner(null);

      expect(useChatStore.getState().activePartnerId).toBeNull();
    });
  });

  describe('unread counts', () => {
    it('should increment unread count', () => {
      useChatStore.getState().incrementUnread('partner-1');
      useChatStore.getState().incrementUnread('partner-1');

      expect(useChatStore.getState().unreadCounts['partner-1']).toBe(2);
    });

    it('should clear unread count', () => {
      useChatStore.getState().incrementUnread('partner-1');
      useChatStore.getState().incrementUnread('partner-1');
      useChatStore.getState().clearUnread('partner-1');

      expect(useChatStore.getState().unreadCounts['partner-1']).toBe(0);
    });
  });

  describe('markMessageAsRead', () => {
    it('should mark a specific message as read', () => {
      const msg1 = createMockMessage({ id: 'msg-1', is_read: false });
      const msg2 = createMockMessage({ id: 'msg-2', is_read: false });

      useChatStore.getState().setMessages('partner-1', [msg1, msg2]);
      useChatStore.getState().markMessageAsRead('partner-1', 'msg-1');

      const messages = useChatStore.getState().conversations['partner-1'];
      expect(messages.find((m) => m.id === 'msg-1')?.is_read).toBe(true);
      expect(messages.find((m) => m.id === 'msg-2')?.is_read).toBe(false);
    });
  });

  describe('clearChat', () => {
    it('should remove conversation and unread count', () => {
      useChatStore.getState().setMessages('partner-1', [createMockMessage()]);
      useChatStore.getState().incrementUnread('partner-1');

      useChatStore.getState().clearChat('partner-1');

      expect(useChatStore.getState().conversations['partner-1']).toBeUndefined();
      expect(useChatStore.getState().unreadCounts['partner-1']).toBeUndefined();
    });

    it('should clear active partner if matching', () => {
      useChatStore.getState().setActivePartner('partner-1');
      useChatStore.getState().clearChat('partner-1');

      expect(useChatStore.getState().activePartnerId).toBeNull();
    });
  });

  describe('clearAllChats', () => {
    it('should clear everything', () => {
      useChatStore.getState().setMessages('partner-1', [createMockMessage()]);
      useChatStore.getState().setMessages('partner-2', [createMockMessage()]);
      useChatStore.getState().incrementUnread('partner-1');
      useChatStore.getState().setInputText('test');
      useChatStore.getState().setActivePartner('partner-1');

      useChatStore.getState().clearAllChats();

      const state = useChatStore.getState();
      expect(Object.keys(state.conversations)).toHaveLength(0);
      expect(Object.keys(state.unreadCounts)).toHaveLength(0);
      expect(state.inputText).toBe('');
      expect(state.activePartnerId).toBeNull();
    });
  });

  describe('loading and error states', () => {
    it('should set loading state', () => {
      useChatStore.getState().setLoading(true);
      expect(useChatStore.getState().isLoading).toBe(true);

      useChatStore.getState().setLoading(false);
      expect(useChatStore.getState().isLoading).toBe(false);
    });

    it('should set error state', () => {
      useChatStore.getState().setError('Something went wrong');
      expect(useChatStore.getState().error).toBe('Something went wrong');

      useChatStore.getState().setError(null);
      expect(useChatStore.getState().error).toBeNull();
    });
  });

  describe('selectors', () => {
    it('selectConversation should return messages for partner', () => {
      const messages = [createMockMessage()];
      useChatStore.getState().setMessages('partner-1', messages);

      const result = selectConversation('partner-1')(useChatStore.getState());
      expect(result).toEqual(messages);
    });

    it('selectConversation should return empty array for unknown partner', () => {
      const result = selectConversation('unknown')(useChatStore.getState());
      expect(result).toEqual([]);
    });

    it('selectUnreadCount should return count for partner', () => {
      useChatStore.getState().incrementUnread('partner-1');
      useChatStore.getState().incrementUnread('partner-1');

      const result = selectUnreadCount('partner-1')(useChatStore.getState());
      expect(result).toBe(2);
    });

    it('selectTotalUnread should return total across all partners', () => {
      useChatStore.getState().incrementUnread('partner-1');
      useChatStore.getState().incrementUnread('partner-1');
      useChatStore.getState().incrementUnread('partner-2');

      const result = selectTotalUnread(useChatStore.getState());
      expect(result).toBe(3);
    });
  });
});
