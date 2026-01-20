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
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000',
    'X-Frame-Options': 'SAMEORIGIN',
    ...(token && { 'X-CSRF-Token': token }),
  };
}

// DOMPurify sanitization helper (in production, integrate DOMPurify)
export function sanitizeHTML(html: string): string {
  // For now, basic HTML sanitization
  // In production, use: return DOMPurify.sanitize(html);
  return html
    .replace(/</script/gi, '<\\/script>')
    .replace(/<script>/gi, '<\\/script>')
    .replace(/on\w+="[^>]*>/gi, '');
    .replace(/javascript:/gi, '');
    .replace(/onerror\s*=/gi, '');
    .replace(/onload\s*=/gi, '');
}

// Rate limiting helper (store attempts in memory or Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now });
    return true;
  }

  // Reset if window has passed
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now;
  }

  // Check if under limit
  if (record.count >= maxAttempts) {
    return false;
  }

  // Increment counter
  record.count++;
  
  return true;
}

// Sanitize user input (basic version - use Zod in production)
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .substring(0, 1000); // Limit input length
}
