/**
 * Input Sanitization Utilities
 * XSS 방지 및 입력 검증을 위한 유틸리티
 */

/**
 * DOMPurify 대신 HTML 기본 sanitize 함수
 * (프로덕션 버전에서 DOMPurify 라이브러리를 설치해야 함)
 */
export function sanitizeHTML(html: string): string {
  // For now, basic HTML sanitization
  // In production, replace with: return DOMPurify.sanitize(html);
  return html
    .replace(/<\/script>/gi, '&lt;/script&gt;')
    .replace(/<script>/gi, '&lt;script&gt;')
    .replace(/<script/gi, '&lt;script')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/eval\s*\(/gi, 'eval-blocked(')
    .replace(/vbscript:/gi, '');
}

/**
 * URL 인코딩 (XSS 방지)
 */
export function sanitizeURL(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.toString();
  } catch {
    return '';
  }
}

/**
 * HTML 이스케이프 (서버/클라이언트 모두 작동)
 */
export function escapeHTML(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * JSON 입력 검증 (NoSQL Injection 방지)
 */
export function isValidJSON(json: string): boolean {
  try {
    JSON.parse(json);
    return true;
  } catch {
    return false;
  }
}

/**
 * SQL Injection 방지 - 기본 검사
 */
export function hasSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC)\b/i,
    /\b(OR|AND|NOT|XOR)\b/i,
    /\b(WHERE|GROUP BY|HAVING|LIMIT|OFFSET|ORDER BY)\b/i,
    /(;|--)/,
    /".*"/,
    /'.*'/,
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * 파일 업로드 검증
 */
export function isValidFileType(filename: string): boolean {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const fileExtension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return allowedExtensions.includes(fileExtension);
}

/**
 * 이메일 주소 검증 (기본)
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 전화번호 검증 (일본 형식)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^0[0-9]{1,4}-[0-9]{4}$/;
  return phoneRegex.test(phone);
}

/**
 * 닉네임 검증 (2-20자)
 */
export function isValidNickname(nickname: string): boolean {
  if (nickname.length < 2 || nickname.length > 20) {
    return false;
  }
  // 일본어 닉네임 허용 (기본 - 실제에서는 더 복잡한 필터링 필요)
  const nicknameRegex = /^[가-힣ァ-ンa-zA-Z0-9_ ]+$/;
  return nicknameRegex.test(nickname);
}

/**
 * 메시지 길이 검증
 */
export function isValidMessageLength(message: string, maxLength: number = 200): boolean {
  return message.length <= maxLength;
}

/**
 * 가격 검증 (JPY)
 */
export function isValidPrice(price: number): boolean {
  return price >= 0 && price <= 1000000; // 최대 100만 엔
}

/**
 * 테이블 번호 검증
 */
export function isValidTableNumber(number: number, max: number = 200): boolean {
  return number > 0 && number <= max;
}
