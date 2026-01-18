import type { Session } from '@/types/database';

/**
 * Check if a session is expired
 */
export function isSessionExpired(session: Session): boolean {
  const expiresAt = new Date(session.expires_at);
  return expiresAt < new Date();
}

/**
 * Check if a session is valid (active and not expired)
 */
export function isSessionValid(session: Session): boolean {
  return session.is_active && !isSessionExpired(session);
}

/**
 * Get remaining time for a session in milliseconds
 */
export function getSessionRemainingTime(session: Session): number {
  const expiresAt = new Date(session.expires_at);
  const remaining = expiresAt.getTime() - Date.now();
  return Math.max(0, remaining);
}

/**
 * Get remaining time formatted as "HH:MM:SS"
 */
export function formatSessionRemainingTime(session: Session): string {
  const remaining = getSessionRemainingTime(session);

  if (remaining <= 0) {
    return '00:00:00';
  }

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0'),
  ].join(':');
}

/**
 * Check if session is about to expire (within 10 minutes)
 */
export function isSessionExpiringSoon(session: Session, thresholdMs: number = 10 * 60 * 1000): boolean {
  const remaining = getSessionRemainingTime(session);
  return remaining > 0 && remaining <= thresholdMs;
}

/**
 * Generate a display name for a session
 */
export function getSessionDisplayName(session: Session): string {
  if (session.nickname) {
    return session.nickname;
  }
  return `テーブル ${session.table_number}`;
}

/**
 * Check if two sessions can communicate (same merchant, both active)
 */
export function canSessionsCommunicate(
  session1: Session,
  session2: Session
): boolean {
  // Must be same merchant
  if (session1.merchant_id !== session2.merchant_id) {
    return false;
  }

  // Both must be valid
  if (!isSessionValid(session1) || !isSessionValid(session2)) {
    return false;
  }

  // Cannot communicate with self
  if (session1.id === session2.id) {
    return false;
  }

  return true;
}
