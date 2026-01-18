import { describe, it, expect } from 'vitest';

const API_BASE = 'http://localhost:3000';

describe('Sessions API', () => {
  describe('POST /api/sessions', () => {
    it('should create a new session', async () => {
      const response = await fetch(`${API_BASE}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: 'merchant-123',
          tableNumber: 5,
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.session).toBeDefined();
      expect(data.session.merchant_id).toBe('merchant-123');
      expect(data.session.table_number).toBe(5);
      expect(data.session.is_active).toBe(true);
    });
  });

  describe('GET /api/sessions/:sessionId', () => {
    it('should return session by ID', async () => {
      const response = await fetch(`${API_BASE}/api/sessions/session-123`);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.session).toBeDefined();
      expect(data.session.id).toBe('session-123');
    });

    it('should return 404 for invalid session', async () => {
      const response = await fetch(`${API_BASE}/api/sessions/invalid`);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Session not found');
    });
  });

  describe('POST /api/sessions/:sessionId/join', () => {
    it('should join session with nickname', async () => {
      const response = await fetch(`${API_BASE}/api/sessions/session-123/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: 'TestUser' }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.session.nickname).toBe('TestUser');
    });
  });
});
