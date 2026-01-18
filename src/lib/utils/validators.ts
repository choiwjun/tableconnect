/**
 * Validation Utilities
 */

import {
  MAX_NICKNAME_LENGTH,
  MIN_NICKNAME_LENGTH,
  MAX_MESSAGE_LENGTH,
  MIN_TABLE_NUMBER,
  MAX_TABLE_NUMBER,
} from './constants';

// Forbidden words (basic list - can be extended)
const FORBIDDEN_WORDS: string[] = [
  // Add forbidden words as needed
];

/**
 * Validate nickname
 */
export function isValidNickname(nickname: string): {
  valid: boolean;
  error?: string;
} {
  const trimmed = nickname.trim();

  // Check length
  if (trimmed.length < MIN_NICKNAME_LENGTH) {
    return { valid: false, error: 'ニックネームを入力してください' };
  }

  if (trimmed.length > MAX_NICKNAME_LENGTH) {
    return {
      valid: false,
      error: `ニックネームは${MAX_NICKNAME_LENGTH}文字以内で入力してください`,
    };
  }

  // Check for forbidden words
  const lowerNickname = trimmed.toLowerCase();
  for (const word of FORBIDDEN_WORDS) {
    if (lowerNickname.includes(word)) {
      return { valid: false, error: '使用できない文字が含まれています' };
    }
  }

  // Check for only whitespace or special characters
  if (!/\S/.test(trimmed)) {
    return { valid: false, error: '有効なニックネームを入力してください' };
  }

  return { valid: true };
}

/**
 * Validate message content
 */
export function isValidMessage(content: string): {
  valid: boolean;
  error?: string;
} {
  const trimmed = content.trim();

  // Check if empty
  if (trimmed.length === 0) {
    return { valid: false, error: 'メッセージを入力してください' };
  }

  // Check max length
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return {
      valid: false,
      error: `メッセージは${MAX_MESSAGE_LENGTH}文字以内で入力してください`,
    };
  }

  return { valid: true };
}

/**
 * Validate table number
 */
export function isValidTableNumber(tableNumber: number): {
  valid: boolean;
  error?: string;
} {
  // Check if integer
  if (!Number.isInteger(tableNumber)) {
    return { valid: false, error: 'テーブル番号は整数で入力してください' };
  }

  // Check range
  if (tableNumber < MIN_TABLE_NUMBER || tableNumber > MAX_TABLE_NUMBER) {
    return {
      valid: false,
      error: `テーブル番号は${MIN_TABLE_NUMBER}から${MAX_TABLE_NUMBER}の間で入力してください`,
    };
  }

  return { valid: true };
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Japanese format)
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Japanese phone number patterns
  const phoneRegex = /^(\+81|0)[0-9]{9,10}$/;
  const cleaned = phone.replace(/[-\s]/g, '');
  return phoneRegex.test(cleaned);
}

/**
 * Sanitize string (basic XSS prevention)
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
