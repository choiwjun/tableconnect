/**
 * Password Hashing Utilities
 * bcrypt를 사용한 안전한 비밀번호 해싱
 */

import bcrypt from 'bcryptjs';

// Salt rounds - 높을수록 보안성 증가하지만 속도 감소
const SALT_ROUNDS = 12;

/**
 * 비밀번호 해싱
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 비밀번호 검증
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * 비밀번호 강도 검증
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('비밀번호는 최소 8자 이상이어야 합니다');
  }

  if (password.length > 128) {
    errors.push('비밀번호는 128자를 초과할 수 없습니다');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('대문자를 포함해야 합니다');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('소문자를 포함해야 합니다');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('숫자를 포함해야 합니다');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('특수문자를 포함해야 합니다');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
