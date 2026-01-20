/**
 * Security Utilities Index
 */

// Password hashing
export {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
} from './password';

// Rate limiting
export {
  checkLoginRateLimit,
  recordLoginAttempt,
  clearLoginAttempts,
  checkMemoryRateLimit,
  clearMemoryRateLimit,
} from './rate-limit';

// Admin session management
export {
  createAdminSession,
  validateAdminSession,
  invalidateAdminSession,
  getAdminSessionFromCookie,
  getAdminSessionFromRequest,
  withMerchantAuth,
  withMerchantAccess,
  cleanupExpiredSessions,
  getSessionCookieOptions,
  type AdminSession,
} from './admin-session';

// CSRF protection
export {
  generateCSRFToken,
  verifyCSRFToken,
  generateCSPNonce,
  getSecurityHeaders,
  sanitizeInput,
} from './csrf';

// Input sanitization
export {
  sanitizeHTML,
  sanitizeURL,
  escapeHTML,
  isValidJSON,
  hasSQLInjection,
  isValidFileType,
  isValidEmail,
  isValidPhoneNumber,
  isValidNickname,
  isValidMessageLength,
  isValidPrice,
  isValidTableNumber,
} from './sanitize';
