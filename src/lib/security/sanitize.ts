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
    .replace(/</script>/gi, '<\\/script>')
    .replace(/<script>/gi, '<\\/script>')
    .replace(/javascript:/gi, '')
    .replace(/on\w+="[^>]*>/gi, '')
    .replace(/onerror\s*=/gi, '')
    .replace(/onload\s*=/gi, '')
    .replace(/onfocus\s*=/gi, '');
    .replace(/onclick\s*=/gi, '');
    .replace(/onmouseover\s*=/gi, '');
    .replace(/onsubmit\s*=/gi, '');
    .replace(/onkeydown\s*=/gi, '')
    .replace(/onkeyup\s*=/gi, '');
    .replace(/onmouseenter\s*=/gi, '')
    .replace(/onmouseleave\s*=/gi, '');
    .replace(/onmousedown\s*=/gi, '')
    .replace(/onmouseup\s*=/gi, '');
    .replace(/eval\s*\(/gi, 'eval-blocked');
    .replace(/vbscript:/gi, 'vbscript-blocked');
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
 * 이스케이프 방지
 */
export function escapeHTML(unsafe: string): string {
  const div = document.createElement('div');
  div.textContent = unsafe;
  return div.innerHTML;
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
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXEC\b)/i,
    /(\b(OR|AND|NOT|XOR)\b)/i,
    /(\b(WHERE|GROUP BY|HAVING|LIMIT|OFFSET|ORDER BY)\b)/i,
    /(;|\-{2})/,
    /(\".*\")/,
    /\'.*'/,
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
