import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from '../sessionStore';
import type { Session } from '@/types/database';

describe('sessionStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useSessionStore.setState({
      currentSession: null,
      partnerSession: null,
      merchantId: null,
      tableNumber: null,
    });
  });

  describe('setCurrentSession', () => {
    it('should set current session', () => {
      const mockSession: Session = {
        id: 'session-1',
        merchant_id: 'merchant-1',
        table_number: 5,
        nickname: 'TestUser',
        gender: null,
        age_range: null,
        party_size: null,
        is_active: true,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      };

      useSessionStore.getState().setCurrentSession(mockSession);

      expect(useSessionStore.getState().currentSession).toEqual(mockSession);
    });

    it('should clear current session when null', () => {
      useSessionStore.getState().setCurrentSession({
        id: 'session-1',
        merchant_id: 'merchant-1',
        table_number: 5,
        nickname: 'TestUser',
        gender: null,
        age_range: null,
        party_size: null,
        is_active: true,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      });

      useSessionStore.getState().setCurrentSession(null);

      expect(useSessionStore.getState().currentSession).toBeNull();
    });
  });

  describe('setPartnerSession', () => {
    it('should set partner session', () => {
      const partnerSession = {
        id: 'partner-1',
        table_number: 3,
        nickname: 'PartnerUser',
      };

      useSessionStore.getState().setPartnerSession(partnerSession);

      expect(useSessionStore.getState().partnerSession).toEqual(partnerSession);
    });
  });

  describe('setMerchantInfo', () => {
    it('should set merchant ID and table number', () => {
      useSessionStore.getState().setMerchantInfo('merchant-123', 7);

      expect(useSessionStore.getState().merchantId).toBe('merchant-123');
      expect(useSessionStore.getState().tableNumber).toBe(7);
    });
  });

  describe('clearSession', () => {
    it('should clear all session data', () => {
      // Set some data first
      useSessionStore.getState().setCurrentSession({
        id: 'session-1',
        merchant_id: 'merchant-1',
        table_number: 5,
        nickname: 'TestUser',
        gender: null,
        age_range: null,
        party_size: null,
        is_active: true,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      });
      useSessionStore.getState().setPartnerSession({
        id: 'partner-1',
        table_number: 3,
        nickname: 'Partner',
      });
      useSessionStore.getState().setMerchantInfo('merchant-1', 5);

      // Clear everything
      useSessionStore.getState().clearSession();

      const state = useSessionStore.getState();
      expect(state.currentSession).toBeNull();
      expect(state.partnerSession).toBeNull();
      expect(state.merchantId).toBeNull();
      expect(state.tableNumber).toBeNull();
    });
  });

  describe('updateNickname', () => {
    it('should update nickname of current session', () => {
      useSessionStore.getState().setCurrentSession({
        id: 'session-1',
        merchant_id: 'merchant-1',
        table_number: 5,
        nickname: 'OldNickname',
        gender: null,
        age_range: null,
        party_size: null,
        is_active: true,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      });

      useSessionStore.getState().updateNickname('NewNickname');

      expect(useSessionStore.getState().currentSession?.nickname).toBe('NewNickname');
    });

    it('should not update nickname if no current session', () => {
      useSessionStore.getState().updateNickname('NewNickname');

      expect(useSessionStore.getState().currentSession).toBeNull();
    });
  });
});
