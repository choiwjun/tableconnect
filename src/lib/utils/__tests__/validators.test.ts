import { describe, it, expect } from 'vitest';
import {
  isValidNickname,
  isValidMessage,
  isValidTableNumber,
  isValidUUID,
  isValidEmail,
  sanitizeString,
} from '../validators';

describe('isValidNickname', () => {
  it('should accept valid nicknames', () => {
    expect(isValidNickname('さくら').valid).toBe(true);
    expect(isValidNickname('TestUser').valid).toBe(true);
    expect(isValidNickname('花子123').valid).toBe(true);
  });

  it('should reject empty nicknames', () => {
    const result = isValidNickname('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should reject nicknames that are too long', () => {
    const longNickname = 'a'.repeat(21);
    const result = isValidNickname(longNickname);
    expect(result.valid).toBe(false);
  });

  it('should reject whitespace-only nicknames', () => {
    const result = isValidNickname('   ');
    expect(result.valid).toBe(false);
  });

  it('should accept nicknames at max length', () => {
    const maxNickname = 'a'.repeat(20);
    expect(isValidNickname(maxNickname).valid).toBe(true);
  });
});

describe('isValidMessage', () => {
  it('should accept valid messages', () => {
    expect(isValidMessage('こんにちは！').valid).toBe(true);
    expect(isValidMessage('Hello, how are you?').valid).toBe(true);
  });

  it('should reject empty messages', () => {
    const result = isValidMessage('');
    expect(result.valid).toBe(false);
  });

  it('should reject messages that are too long', () => {
    const longMessage = 'a'.repeat(501);
    const result = isValidMessage(longMessage);
    expect(result.valid).toBe(false);
  });

  it('should accept messages at max length', () => {
    const maxMessage = 'a'.repeat(500);
    expect(isValidMessage(maxMessage).valid).toBe(true);
  });
});

describe('isValidTableNumber', () => {
  it('should accept valid table numbers', () => {
    expect(isValidTableNumber(1).valid).toBe(true);
    expect(isValidTableNumber(50).valid).toBe(true);
    expect(isValidTableNumber(999).valid).toBe(true);
  });

  it('should reject table number 0', () => {
    expect(isValidTableNumber(0).valid).toBe(false);
  });

  it('should reject negative table numbers', () => {
    expect(isValidTableNumber(-1).valid).toBe(false);
  });

  it('should reject table numbers above max', () => {
    expect(isValidTableNumber(1000).valid).toBe(false);
  });

  it('should reject non-integers', () => {
    expect(isValidTableNumber(1.5).valid).toBe(false);
  });
});

describe('isValidUUID', () => {
  it('should accept valid UUIDs', () => {
    expect(isValidUUID('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')).toBe(true);
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('should reject invalid UUIDs', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false);
    expect(isValidUUID('12345')).toBe(false);
    expect(isValidUUID('')).toBe(false);
  });
});

describe('isValidEmail', () => {
  it('should accept valid emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.jp')).toBe(true);
  });

  it('should reject invalid emails', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('@domain.com')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
  });
});

describe('sanitizeString', () => {
  it('should escape HTML characters', () => {
    expect(sanitizeString('<script>')).toBe('&lt;script&gt;');
    expect(sanitizeString('"test"')).toBe('&quot;test&quot;');
    expect(sanitizeString("it's")).toBe("it&#039;s");
  });

  it('should handle ampersands', () => {
    expect(sanitizeString('a & b')).toBe('a &amp; b');
  });

  it('should not modify safe strings', () => {
    expect(sanitizeString('Hello World')).toBe('Hello World');
  });
});
