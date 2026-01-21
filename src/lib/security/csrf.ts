/**
 * CSRF Protection Utilities
 * Cross-Site Request Forgery 방지
 */

import { randomBytes } from 'crypto';

// Generate a cryptographically secure CSRF token
export function generateCSRFToken(): string {
  const timestamp = Date.now().toString(36);
  // Use crypto.randomBytes for cryptographically secure random string
  const randomString = randomBytes(16).toString('hex');

  return `${timestamp}-${randomString}`;
}

// Verify a CSRF token with timing-safe comparison
export function verifyCSRFToken(token: string, expectedToken?: string): boolean {
  // Basic format validation
  const [timestamp, randomPart] = token.split('-');

  if (!timestamp || !randomPart || timestamp.length < 2 || randomPart.length !== 32) {
    return false;
  }

  // Parse base36 timestamp (matches generateCSRFToken format)
  const tokenTime = parseInt(timestamp, 36);
  if (isNaN(tokenTime)) {
    return false;
  }

  const currentTime = Date.now();
  const maxAge = 15 * 60 * 1000; // 15 minutes in milliseconds

  // Check token expiration
  if (currentTime - tokenTime >= maxAge) {
    return false;
  }

  // If expectedToken is provided, use timing-safe comparison
  if (expectedToken) {
    if (token.length !== expectedToken.length) {
      return false;
    }
    // Timing-safe string comparison to prevent timing attacks
    let result = 0;
    for (let i = 0; i < token.length; i++) {
      result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
    }
    return result === 0;
  }

  return true;
}

// Generate a cryptographically secure nonce for inline scripts
export function generateCSPNonce(): string {
  return randomBytes(16).toString('base64');
}

// Content Security Policy headers
export function getSecurityHeaders(token?: string, nonce?: string) {
  const scriptSrc = nonce
    ? `'self' 'nonce-${nonce}'`
    : "'self'"; // Fallback without unsafe-inline

  const styleSrc = nonce
    ? `'self' 'nonce-${nonce}' https://fonts.googleapis.com`
    : "'self' https://fonts.googleapis.com";

  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      `style-src ${styleSrc}`,
      "img-src 'self' data: blob: https://*.supabase.co https://*.unsplash.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com",
      "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com",
      "object-src 'none'",
      "media-src 'self' https://*.supabase.co",
      "frame-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    ...(token && { 'X-CSRF-Token': token }),
  };
}

// Note: HTML sanitization moved to sanitize.ts
// Note: Rate limiting moved to rate-limit.ts

// Sanitize user input (basic version - use Zod in production)
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .substring(0, 1000); // Limit input length
}
