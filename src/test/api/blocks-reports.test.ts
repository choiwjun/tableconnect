import { describe, it, expect } from 'vitest';

const API_BASE = 'http://localhost:3000';

describe('Blocks API', () => {
  describe('POST /api/blocks', () => {
    it('should block a user', async () => {
      const response = await fetch(`${API_BASE}/api/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockerSessionId: 'session-123',
          blockedSessionId: 'session-456',
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.block).toBeDefined();
      expect(data.block.blocker_session_id).toBe('session-123');
      expect(data.block.blocked_session_id).toBe('session-456');
    });
  });

  describe('GET /api/blocks', () => {
    it('should return blocks for a session', async () => {
      const response = await fetch(`${API_BASE}/api/blocks?sessionId=session-123`);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.blocks).toBeDefined();
      expect(Array.isArray(data.blocks)).toBe(true);
    });

    it('should return 400 if sessionId is missing', async () => {
      const response = await fetch(`${API_BASE}/api/blocks`);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Session ID required');
    });
  });
});

describe('Reports API', () => {
  describe('POST /api/reports', () => {
    it('should create a report', async () => {
      const response = await fetch(`${API_BASE}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterSessionId: 'session-123',
          reportedSessionId: 'session-456',
          reason: 'harassment',
          description: 'User sent inappropriate messages',
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.report).toBeDefined();
      expect(data.report.reporter_session_id).toBe('session-123');
      expect(data.report.reported_session_id).toBe('session-456');
      expect(data.report.reason).toBe('harassment');
      expect(data.report.status).toBe('pending');
    });

    it('should create a report without description', async () => {
      const response = await fetch(`${API_BASE}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterSessionId: 'session-123',
          reportedSessionId: 'session-789',
          reason: 'spam',
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.report.description).toBeNull();
    });
  });
});
