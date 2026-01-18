import { describe, it, expect } from 'vitest';

const API_BASE = 'http://localhost:3000';

describe('Messages API', () => {
  describe('GET /api/messages', () => {
    it('should return messages between two sessions', async () => {
      const response = await fetch(
        `${API_BASE}/api/messages?sessionId=session-123&partnerId=session-456`
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.messages).toBeDefined();
      expect(Array.isArray(data.messages)).toBe(true);
      expect(data.messages.length).toBeGreaterThan(0);
    });

    it('should return 400 for missing parameters', async () => {
      const response = await fetch(`${API_BASE}/api/messages?sessionId=session-123`);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid parameters');
    });
  });

  describe('POST /api/messages', () => {
    it('should create a new message', async () => {
      const response = await fetch(`${API_BASE}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderSessionId: 'session-123',
          receiverSessionId: 'session-456',
          content: 'Hello, world!',
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.message).toBeDefined();
      expect(data.message.content).toBe('Hello, world!');
      expect(data.message.sender_session_id).toBe('session-123');
      expect(data.message.receiver_session_id).toBe('session-456');
    });

    it('should reject message with content too long', async () => {
      const longContent = 'a'.repeat(501);
      const response = await fetch(`${API_BASE}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderSessionId: 'session-123',
          receiverSessionId: 'session-456',
          content: longContent,
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid message content');
    });

    it('should reject empty message', async () => {
      const response = await fetch(`${API_BASE}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderSessionId: 'session-123',
          receiverSessionId: 'session-456',
          content: '',
        }),
      });

      expect(response.status).toBe(400);
    });
  });
});
