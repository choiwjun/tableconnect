import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isSessionExpired,
  isSessionValid,
  getSessionRemainingTime,
  formatSessionRemainingTime,
  isSessionExpiringSoon,
  getSessionDisplayName,
  canSessionsCommunicate,
} from './session';
import type { Session } from '@/types/database';

// Helper to create a mock session
function createMockSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-1',
    merchant_id: 'merchant-1',
    table_number: 1,
    nickname: null,
    is_active: true,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    ...overrides,
  };
}

describe('session utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-18T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('isSessionExpired', () => {
    it('returns false for session expiring in future', () => {
      const session = createMockSession({
        expires_at: new Date('2025-01-18T14:00:00Z').toISOString(),
      });
      expect(isSessionExpired(session)).toBe(false);
    });

    it('returns true for session expired in past', () => {
      const session = createMockSession({
        expires_at: new Date('2025-01-18T10:00:00Z').toISOString(),
      });
      expect(isSessionExpired(session)).toBe(true);
    });

    it('returns false for session expiring exactly now (edge case)', () => {
      // Session expires exactly at current time - not yet expired since < comparison is used
      const session = createMockSession({
        expires_at: new Date('2025-01-18T12:00:00Z').toISOString(),
      });
      expect(isSessionExpired(session)).toBe(false);
    });
  });

  describe('isSessionValid', () => {
    it('returns true for active, non-expired session', () => {
      const session = createMockSession({
        is_active: true,
        expires_at: new Date('2025-01-18T14:00:00Z').toISOString(),
      });
      expect(isSessionValid(session)).toBe(true);
    });

    it('returns false for inactive session', () => {
      const session = createMockSession({
        is_active: false,
        expires_at: new Date('2025-01-18T14:00:00Z').toISOString(),
      });
      expect(isSessionValid(session)).toBe(false);
    });

    it('returns false for expired session', () => {
      const session = createMockSession({
        is_active: true,
        expires_at: new Date('2025-01-18T10:00:00Z').toISOString(),
      });
      expect(isSessionValid(session)).toBe(false);
    });
  });

  describe('getSessionRemainingTime', () => {
    it('returns remaining time in milliseconds', () => {
      const session = createMockSession({
        expires_at: new Date('2025-01-18T14:00:00Z').toISOString(),
      });
      expect(getSessionRemainingTime(session)).toBe(2 * 60 * 60 * 1000); // 2 hours
    });

    it('returns 0 for expired session', () => {
      const session = createMockSession({
        expires_at: new Date('2025-01-18T10:00:00Z').toISOString(),
      });
      expect(getSessionRemainingTime(session)).toBe(0);
    });
  });

  describe('formatSessionRemainingTime', () => {
    it('formats remaining time correctly', () => {
      const session = createMockSession({
        expires_at: new Date('2025-01-18T14:30:45Z').toISOString(),
      });
      expect(formatSessionRemainingTime(session)).toBe('02:30:45');
    });

    it('returns 00:00:00 for expired session', () => {
      const session = createMockSession({
        expires_at: new Date('2025-01-18T10:00:00Z').toISOString(),
      });
      expect(formatSessionRemainingTime(session)).toBe('00:00:00');
    });

    it('pads single digits with zeros', () => {
      const session = createMockSession({
        expires_at: new Date('2025-01-18T12:05:03Z').toISOString(),
      });
      expect(formatSessionRemainingTime(session)).toBe('00:05:03');
    });
  });

  describe('isSessionExpiringSoon', () => {
    it('returns false for session with plenty of time', () => {
      const session = createMockSession({
        expires_at: new Date('2025-01-18T14:00:00Z').toISOString(),
      });
      expect(isSessionExpiringSoon(session)).toBe(false);
    });

    it('returns true for session expiring within threshold', () => {
      const session = createMockSession({
        expires_at: new Date('2025-01-18T12:05:00Z').toISOString(), // 5 minutes
      });
      expect(isSessionExpiringSoon(session)).toBe(true);
    });

    it('returns false for already expired session', () => {
      const session = createMockSession({
        expires_at: new Date('2025-01-18T10:00:00Z').toISOString(),
      });
      expect(isSessionExpiringSoon(session)).toBe(false);
    });

    it('respects custom threshold', () => {
      const session = createMockSession({
        expires_at: new Date('2025-01-18T12:15:00Z').toISOString(), // 15 minutes
      });
      expect(isSessionExpiringSoon(session, 10 * 60 * 1000)).toBe(false);
      expect(isSessionExpiringSoon(session, 20 * 60 * 1000)).toBe(true);
    });
  });

  describe('getSessionDisplayName', () => {
    it('returns nickname if set', () => {
      const session = createMockSession({ nickname: 'たろう' });
      expect(getSessionDisplayName(session)).toBe('たろう');
    });

    it('returns table number if no nickname', () => {
      const session = createMockSession({ nickname: null, table_number: 5 });
      expect(getSessionDisplayName(session)).toBe('テーブル 5');
    });
  });

  describe('canSessionsCommunicate', () => {
    it('returns true for two valid sessions from same merchant', () => {
      const session1 = createMockSession({
        id: 'session-1',
        merchant_id: 'merchant-1',
        expires_at: new Date('2025-01-18T14:00:00Z').toISOString(),
      });
      const session2 = createMockSession({
        id: 'session-2',
        merchant_id: 'merchant-1',
        expires_at: new Date('2025-01-18T14:00:00Z').toISOString(),
      });
      expect(canSessionsCommunicate(session1, session2)).toBe(true);
    });

    it('returns false for sessions from different merchants', () => {
      const session1 = createMockSession({
        id: 'session-1',
        merchant_id: 'merchant-1',
      });
      const session2 = createMockSession({
        id: 'session-2',
        merchant_id: 'merchant-2',
      });
      expect(canSessionsCommunicate(session1, session2)).toBe(false);
    });

    it('returns false if first session is inactive', () => {
      const session1 = createMockSession({
        id: 'session-1',
        is_active: false,
      });
      const session2 = createMockSession({ id: 'session-2' });
      expect(canSessionsCommunicate(session1, session2)).toBe(false);
    });

    it('returns false if second session is expired', () => {
      const session1 = createMockSession({ id: 'session-1' });
      const session2 = createMockSession({
        id: 'session-2',
        expires_at: new Date('2025-01-18T10:00:00Z').toISOString(),
      });
      expect(canSessionsCommunicate(session1, session2)).toBe(false);
    });

    it('returns false for same session (self-communication)', () => {
      const session = createMockSession({ id: 'session-1' });
      expect(canSessionsCommunicate(session, session)).toBe(false);
    });
  });
});
