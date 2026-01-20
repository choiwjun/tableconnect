/**
 * CSRF Protection Utilities
 * Cross-Site Request Forgery 방지
 */

// Generate a CSRF token for the session
export function generateCSRFToken(): string {
  // In production, this should use a proper CSP nonce or server-side CSRF token
  // For now, we'll use a simple timestamp-based token
  const timestamp = Date.now().toString();
  const randomString = Math.random().toString(36).substring(2);
  
  return `${timestamp}-${randomString}`;
}

// Verify a CSRF token
export function verifyCSRFToken(token: string): boolean {
  // Tokens should be valid for 15 minutes
  const [timestamp] = token.split('-');
  
  if (!timestamp || timestamp.length < 2) {
    return false;
  }
  
  const tokenTime = parseInt(timestamp, 10);
  const currentTime = Date.now();
  const maxAge = 15 * 60 * 1000; // 15 minutes in milliseconds
  
  return currentTime - tokenTime < maxAge;
}

// Generate a nonce for inline scripts
export function generateCSPNonce(): string {
  return `nonce-${Date.now()}-${Math.random().toString(36).substring(2)}`;
}

// Content Security Policy headers
export function getSecurityHeaders(token?: string) {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-inline needed for inline scripts
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "font-src 'self' https://fonts.gstatic.com",
      "object-src 'none'",
      "media-src 'self' https://*.supabase.co",
      "frame-src 'self'",
    ].join('; '),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000',
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
