import { describe, it, expect } from 'vitest';

const API_BASE = 'http://localhost:3000';

describe('Gifts API', () => {
  describe('POST /api/gifts', () => {
    it('should create a gift', async () => {
      const response = await fetch(`${API_BASE}/api/gifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderSessionId: 'session-123',
          receiverSessionId: 'session-456',
          menuId: 'menu-1',
          message: 'Enjoy!',
          paymentIntentId: 'pi_test_123',
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.gift).toBeDefined();
      expect(data.gift.sender_session_id).toBe('session-123');
      expect(data.gift.receiver_session_id).toBe('session-456');
      expect(data.gift.menu_id).toBe('menu-1');
      expect(data.gift.status).toBe('completed');
    });

    it('should create a gift without message', async () => {
      const response = await fetch(`${API_BASE}/api/gifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderSessionId: 'session-123',
          receiverSessionId: 'session-456',
          menuId: 'menu-2',
          paymentIntentId: 'pi_test_456',
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.gift.message).toBeNull();
    });
  });

  describe('GET /api/gifts', () => {
    it('should return gift history for a session', async () => {
      const response = await fetch(`${API_BASE}/api/gifts?session_id=session-123`);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.gifts).toBeDefined();
      expect(Array.isArray(data.gifts)).toBe(true);
    });

    it('should return 400 if session_id is missing', async () => {
      const response = await fetch(`${API_BASE}/api/gifts`);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Session ID required');
    });
  });
});
