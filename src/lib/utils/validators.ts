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

// Forbidden words for content validation (Japanese + English + Korean)
const FORBIDDEN_WORDS_CONTENT: string[] = [
  // Japanese inappropriate words
  'バカ', 'ばか', '馬鹿',
  'アホ', 'あほ', '阿呆',
  'クソ', 'くそ', '糞',
  '死ね', 'しね',
  '殺す', 'ころす',
  'キモい', 'きもい',
  'ブス', 'ぶす',
  'デブ', 'でぶ',
  'ハゲ', 'はげ', '禿',
  'うざい', 'ウザい',
  '変態', 'へんたい', 'ヘンタイ',
  'エロ', 'えろ',
  // English inappropriate words
  'fuck', 'shit', 'bitch', 'asshole', 'bastard',
  'dick', 'pussy', 'cunt', 'whore', 'slut',
  'nigger', 'faggot', 'retard',
  // Korean inappropriate words
  '씨발', '시발', '개새끼', '병신', '지랄',
  '미친', '꺼져', '죽어',
  // Chinese inappropriate words
  '傻逼', '他妈', '操你', '去死',
];

// Additional words forbidden only for nicknames (admin/staff impersonation)
const FORBIDDEN_WORDS_NICKNAME_ONLY: string[] = [
  'admin', 'administrator', '管理者', '管理人',
  'staff', 'スタッフ', '店員', '店長',
  'owner', 'オーナー', '運営',
  'system', 'システム',
  'official', '公式',
];

// Combined list for nickname validation
const FORBIDDEN_WORDS: string[] = [
  ...FORBIDDEN_WORDS_CONTENT,
  ...FORBIDDEN_WORDS_NICKNAME_ONLY,
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

  // Check for forbidden words (content only, not admin impersonation words)
  const lowerContent = trimmed.toLowerCase();
  for (const word of FORBIDDEN_WORDS_CONTENT) {
    if (lowerContent.includes(word.toLowerCase())) {
      return { valid: false, error: '不適切な表現が含まれています' };
    }
  }

  return { valid: true };
}

/**
 * Check if content contains forbidden words (exportable for API use)
 */
export function containsForbiddenWords(content: string): {
  hasForbidden: boolean;
  matchedWords: string[];
} {
  const lowerContent = content.toLowerCase();
  const matchedWords: string[] = [];

  for (const word of FORBIDDEN_WORDS_CONTENT) {
    if (lowerContent.includes(word.toLowerCase())) {
      matchedWords.push(word);
    }
  }

  return {
    hasForbidden: matchedWords.length > 0,
    matchedWords,
  };
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
