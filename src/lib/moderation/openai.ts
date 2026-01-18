/**
 * OpenAI Moderation API integration for content filtering
 */

export interface ModerationCategory {
  hate: boolean;
  'hate/threatening': boolean;
  harassment: boolean;
  'harassment/threatening': boolean;
  'self-harm': boolean;
  'self-harm/intent': boolean;
  'self-harm/instructions': boolean;
  sexual: boolean;
  'sexual/minors': boolean;
  violence: boolean;
  'violence/graphic': boolean;
}

export interface ModerationCategoryScores {
  hate: number;
  'hate/threatening': number;
  harassment: number;
  'harassment/threatening': number;
  'self-harm': number;
  'self-harm/intent': number;
  'self-harm/instructions': number;
  sexual: number;
  'sexual/minors': number;
  violence: number;
  'violence/graphic': number;
}

export interface ModerationResult {
  id: string;
  model: string;
  results: Array<{
    flagged: boolean;
    categories: ModerationCategory;
    category_scores: ModerationCategoryScores;
  }>;
}

export interface ContentModerationResult {
  isAllowed: boolean;
  flagged: boolean;
  categories: string[];
  scores: ModerationCategoryScores | null;
  error?: string;
}

// Category thresholds for custom sensitivity
const DEFAULT_THRESHOLDS: Partial<ModerationCategoryScores> = {
  hate: 0.5,
  harassment: 0.5,
  'self-harm': 0.3,
  sexual: 0.5,
  'sexual/minors': 0.1,
  violence: 0.5,
  'violence/graphic': 0.3,
};

/**
 * Check content using OpenAI Moderation API
 */
export async function moderateContent(
  content: string,
  customThresholds?: Partial<ModerationCategoryScores>
): Promise<ContentModerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  // If no API key, allow content but log warning
  if (!apiKey) {
    console.warn('OpenAI API key not configured. Content moderation is disabled.');
    return {
      isAllowed: true,
      flagged: false,
      categories: [],
      scores: null,
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: content,
        model: 'text-moderation-latest',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Moderation API error:', errorText);
      // On API error, allow content to prevent blocking legitimate users
      return {
        isAllowed: true,
        flagged: false,
        categories: [],
        scores: null,
        error: 'Moderation service unavailable',
      };
    }

    const data: ModerationResult = await response.json();
    const result = data.results[0];

    if (!result) {
      return {
        isAllowed: true,
        flagged: false,
        categories: [],
        scores: null,
        error: 'No moderation result returned',
      };
    }

    // Get flagged categories
    const flaggedCategories: string[] = [];
    const thresholds = { ...DEFAULT_THRESHOLDS, ...customThresholds };

    // Check each category against thresholds
    for (const [category, score] of Object.entries(result.category_scores)) {
      const threshold = thresholds[category as keyof ModerationCategoryScores] ?? 0.5;
      if (score >= threshold) {
        flaggedCategories.push(category);
      }
    }

    const isBlocked = flaggedCategories.length > 0 || result.flagged;

    return {
      isAllowed: !isBlocked,
      flagged: result.flagged,
      categories: flaggedCategories,
      scores: result.category_scores,
    };
  } catch (error) {
    console.error('Content moderation error:', error);
    // On error, allow content to prevent blocking legitimate users
    return {
      isAllowed: true,
      flagged: false,
      categories: [],
      scores: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get user-friendly error message for flagged content
 */
export function getModerationErrorMessage(categories: string[], locale: string = 'ja'): string {
  const messages: Record<string, Record<string, string>> = {
    ja: {
      default: '不適切なコンテンツが検出されました。メッセージを修正してください。',
      hate: 'ヘイトスピーチが含まれている可能性があります。',
      harassment: 'ハラスメントに該当する可能性があります。',
      'self-harm': '自傷行為に関連するコンテンツが含まれている可能性があります。',
      sexual: '性的なコンテンツが含まれている可能性があります。',
      violence: '暴力的なコンテンツが含まれている可能性があります。',
    },
    en: {
      default: 'Inappropriate content detected. Please modify your message.',
      hate: 'Your message may contain hate speech.',
      harassment: 'Your message may be considered harassment.',
      'self-harm': 'Your message may contain self-harm related content.',
      sexual: 'Your message may contain sexual content.',
      violence: 'Your message may contain violent content.',
    },
    ko: {
      default: '부적절한 콘텐츠가 감지되었습니다. 메시지를 수정해주세요.',
      hate: '혐오 발언이 포함되어 있을 수 있습니다.',
      harassment: '괴롭힘에 해당할 수 있습니다.',
      'self-harm': '자해 관련 콘텐츠가 포함되어 있을 수 있습니다.',
      sexual: '성적인 콘텐츠가 포함되어 있을 수 있습니다.',
      violence: '폭력적인 콘텐츠가 포함되어 있을 수 있습니다.',
    },
    zh: {
      default: '检测到不适当的内容。请修改您的消息。',
      hate: '您的消息可能包含仇恨言论。',
      harassment: '您的消息可能构成骚扰。',
      'self-harm': '您的消息可能包含与自残相关的内容。',
      sexual: '您的消息可能包含性内容。',
      violence: '您的消息可能包含暴力内容。',
    },
  };

  const localeMessages = messages[locale] || messages.ja;

  if (categories.length === 0) {
    return localeMessages.default;
  }

  // Return the first relevant category message
  for (const category of categories) {
    const baseCategory = category.split('/')[0];
    if (localeMessages[baseCategory]) {
      return localeMessages[baseCategory];
    }
  }

  return localeMessages.default;
}
