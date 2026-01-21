/**
 * Contact Information Filter
 * 연락처 정보 감지 및 차단 (LINE, Instagram, 전화번호, 이메일 등)
 */

// Contact info patterns
const CONTACT_PATTERNS = {
  // LINE ID patterns
  line: [
    /LINE\s*[ID|id|Id]?\s*[:=＝：]?\s*[@＠]?[\w._-]+/gi,
    /ライン\s*[ID|id]?\s*[:=＝：]?\s*[@＠]?[\w._-]+/gi,
    /라인\s*[ID|id]?\s*[:=＝：]?\s*[@＠]?[\w._-]+/gi,
    /@[\w._-]{4,}(?=\s|$|[、。！？])/g, // Generic @ mention that could be LINE ID
  ],

  // Instagram patterns
  instagram: [
    /instagram\.com\/[\w._]+/gi,
    /インスタ(?:グラム)?\s*[:=＝：]?\s*[@＠]?[\w._]+/gi,
    /insta(?:gram)?\s*[:=＝：]?\s*[@＠]?[\w._]+/gi,
    /ig\s*[:=＝：]?\s*[@＠]?[\w._]+/gi,
  ],

  // Twitter/X patterns
  twitter: [
    /twitter\.com\/[\w._]+/gi,
    /x\.com\/[\w._]+/gi,
    /ツイッター\s*[:=＝：]?\s*[@＠]?[\w._]+/gi,
  ],

  // Phone number patterns (Japanese, Korean, international)
  phone: [
    /(?:\+81|0)[0-9]{1,4}[-\s]?[0-9]{1,4}[-\s]?[0-9]{3,4}/g, // Japanese
    /(?:\+82|0)[0-9]{1,2}[-\s]?[0-9]{3,4}[-\s]?[0-9]{4}/g,   // Korean
    /\+?[0-9]{10,15}/g, // International
    /[０-９]{10,}/g, // Full-width numbers
  ],

  // Email patterns
  email: [
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
    /[a-zA-Z0-9._%+-]+＠[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, // Full-width @
  ],

  // KakaoTalk patterns
  kakao: [
    /카카오(?:톡)?\s*[ID|id]?\s*[:=＝：]?\s*[\w._]+/gi,
    /kakao(?:talk)?\s*[ID|id]?\s*[:=＝：]?\s*[\w._]+/gi,
  ],

  // WeChat patterns
  wechat: [
    /wechat\s*[ID|id]?\s*[:=＝：]?\s*[\w._]+/gi,
    /微信\s*[:=＝：]?\s*[\w._]+/gi,
    /위챗\s*[ID|id]?\s*[:=＝：]?\s*[\w._]+/gi,
  ],

  // Generic "ID exchange" patterns
  idExchange: [
    /[ID|id|Id]\s*交換/gi,
    /連絡先\s*(?:教え|交換)/gi,
    /연락처\s*(?:교환|알려)/gi,
    /add\s+me/gi,
    /dm\s+me/gi,
  ],
};

// Bypass attempt patterns (leetspeak, spacing tricks)
const BYPASS_PATTERNS = [
  // Spaced letters (L I N E, I n s t a, etc.)
  /L\s*I\s*N\s*E/gi,
  /I\s*N\s*S\s*T\s*A/gi,
  // Leetspeak
  /l[1i]n[3e]/gi,
  /[1i]nst[4a]/gi,
  // URL shorteners
  /bit\.ly\/[\w]+/gi,
  /tinyurl\.com\/[\w]+/gi,
  /t\.co\/[\w]+/gi,
];

export interface ContactDetectionResult {
  hasContact: boolean;
  detectedTypes: string[];
  matches: string[];
}

/**
 * Detect contact information in a message
 */
export function detectContactInfo(message: string): ContactDetectionResult {
  const detectedTypes: string[] = [];
  const matches: string[] = [];

  // Normalize message (convert full-width to half-width for some checks)
  const normalizedMessage = normalizeText(message);

  // Check each pattern category
  for (const [type, patterns] of Object.entries(CONTACT_PATTERNS)) {
    for (const pattern of patterns) {
      const found = normalizedMessage.match(pattern);
      if (found) {
        if (!detectedTypes.includes(type)) {
          detectedTypes.push(type);
        }
        matches.push(...found);
      }
    }
  }

  // Check bypass patterns
  for (const pattern of BYPASS_PATTERNS) {
    const found = normalizedMessage.match(pattern);
    if (found) {
      if (!detectedTypes.includes('bypass')) {
        detectedTypes.push('bypass');
      }
      matches.push(...found);
    }
  }

  return {
    hasContact: detectedTypes.length > 0,
    detectedTypes,
    matches: Array.from(new Set(matches)), // Deduplicate
  };
}

/**
 * Mask contact information in a message
 */
export function maskContactInfo(message: string): string {
  let masked = message;

  // Mask all patterns
  for (const patterns of Object.values(CONTACT_PATTERNS)) {
    for (const pattern of patterns) {
      masked = masked.replace(pattern, '[連絡先は非表示]');
    }
  }

  // Mask bypass attempts
  for (const pattern of BYPASS_PATTERNS) {
    masked = masked.replace(pattern, '[連絡先は非表示]');
  }

  return masked;
}

/**
 * Normalize text for better pattern matching
 */
function normalizeText(text: string): string {
  return text
    // Full-width to half-width alphanumeric
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) - 0xfee0)
    )
    // Full-width @ to half-width
    .replace(/＠/g, '@')
    // Full-width : and = to half-width
    .replace(/：/g, ':')
    .replace(/＝/g, '=');
}

/**
 * Get warning message for detected contact type
 */
export function getContactWarningMessage(
  detectedTypes: string[],
  locale: string = 'ja'
): string {
  const messages: Record<string, Record<string, string>> = {
    ja: {
      default: '連絡先の交換はアプリ内でお願いします。外部サービスのIDや電話番号の共有は禁止されています。',
      phone: '電話番号の共有は禁止されています。',
      email: 'メールアドレスの共有は禁止されています。',
      line: 'LINE IDの共有は禁止されています。',
      instagram: 'Instagram IDの共有は禁止されています。',
    },
    en: {
      default: 'Please keep conversations within the app. Sharing external contact information is not allowed.',
      phone: 'Sharing phone numbers is not allowed.',
      email: 'Sharing email addresses is not allowed.',
      line: 'Sharing LINE IDs is not allowed.',
      instagram: 'Sharing Instagram handles is not allowed.',
    },
    ko: {
      default: '앱 내에서 대화해 주세요. 외부 연락처 공유는 금지되어 있습니다.',
      phone: '전화번호 공유는 금지되어 있습니다.',
      email: '이메일 주소 공유는 금지되어 있습니다.',
      line: '라인 ID 공유는 금지되어 있습니다.',
      instagram: '인스타그램 ID 공유는 금지되어 있습니다.',
    },
  };

  const localeMessages = messages[locale] || messages['ja'];

  // Return specific message if only one type detected
  if (detectedTypes.length === 1 && localeMessages[detectedTypes[0]]) {
    return localeMessages[detectedTypes[0]];
  }

  return localeMessages['default'];
}
