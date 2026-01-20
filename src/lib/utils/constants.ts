/**
 * Application Constants
 */

// Message constraints
export const MAX_MESSAGE_LENGTH = 200; // Changed from 500 to 200 (PRD requirement)

// Nickname constraints
export const MAX_NICKNAME_LENGTH = 20;
export const MIN_NICKNAME_LENGTH = 1;

// Profile constraints
export const MIN_PARTY_SIZE = 1;
export const MAX_PARTY_SIZE = 10;

// Session settings
export const SESSION_TTL_HOURS = 2;
export const SESSION_TTL_MS = SESSION_TTL_HOURS * 60 * 60 * 1000;

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Currency settings
export const DEFAULT_CURRENCY = 'JPY';
export const CURRENCY_LOCALE = 'ja-JP';

// Timezone
export const DEFAULT_TIMEZONE = 'Asia/Tokyo';

// Gift status
export const GIFT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

// Report reasons
export const REPORT_REASONS = {
  HARASSMENT: 'harassment',
  INAPPROPRIATE_CONTENT: 'inappropriate_content',
  SPAM: 'spam',
  IMPERSONATION: 'impersonation',
  OTHER: 'other',
} as const;

// Report status
export const REPORT_STATUS = {
  PENDING: 'pending',
  REVIEWING: 'reviewing',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
} as const;

// Moderation categories
export const MODERATION_CATEGORIES = [
  'hate',
  'harassment',
  'self-harm',
  'sexual',
  'violence',
] as const;

// Fee rate (15%)
export const DEFAULT_FEE_RATE = 0.15;

// Table number constraints
export const MIN_TABLE_NUMBER = 1;
export const MAX_TABLE_NUMBER = 999;

// Gift amounts (in yen)
export const GIFT_AMOUNTS = [500, 1000, 2000, 5000] as const;

// Quick reply templates
export const QUICK_REPLIES = {
  GREETING: 'greeting',
  CHEERS: 'cheers',
  ENJOY: 'enjoy',
  THANKS: 'thanks',
} as const;
