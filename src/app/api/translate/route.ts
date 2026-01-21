import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { isValidUUID } from '@/lib/utils/validators';

// OpenAI API Configuration
// IMPORTANT: Use server-side only environment variable (no NEXT_PUBLIC_ prefix)
// This ensures the API key is never exposed to the client
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Supported language codes map
const LANGUAGE_CODES: Record<string, string> = {
  'ja-JP': 'Japanese',
  'ja': 'Japanese',
  'ko-KR': 'Korean',
  'ko': 'Korean',
  'en-US': 'English',
  'en': 'English',
  'zh-CN': 'Simplified Chinese',
  'zh': 'Simplified Chinese',
};

/**
 * Translate text using OpenAI API
 */
async function translateText(text: string, targetLanguage: string): Promise<string> {
  const langName = LANGUAGE_CODES[targetLanguage] || LANGUAGE_CODES['en'];

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the given text to ${langName}. Provide ONLY the translation, no additional text or explanations. Keep the tone natural and conversational.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('OpenAI API Error:', error);
    throw new Error(`Translation API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const translatedText = data.choices[0]?.message?.content?.trim() || text;

  return translatedText;
}

/**
 * POST /api/translate
 * Translates text to the target language
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, targetLanguage, messageId, saveToDb = false } = body;

    // Validate input
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    if (!targetLanguage || typeof targetLanguage !== 'string') {
      return NextResponse.json(
        { error: 'Target language is required' },
        { status: 400 }
      );
    }

    // Check if translation is needed
    const langName = LANGUAGE_CODES[targetLanguage];
    if (!langName) {
      return NextResponse.json(
        { error: 'Unsupported target language' },
        { status: 400 }
      );
    }

    // Check API key
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Translation service not configured' },
        { status: 500 }
      );
    }

    // Translate text
    const translatedText = await translateText(text, targetLanguage);

    // Optionally save translation to database for audit trail
    if (saveToDb && messageId && isValidUUID(messageId)) {
      const supabase = getSupabaseAdmin();

      await supabase
        .from('messages')
        .update({
          original_content: text,
          translated_content: translatedText,
          translation_language: targetLanguage,
          translated_at: new Date().toISOString(),
        })
        .eq('id', messageId);
    }

    return NextResponse.json({
      original: text,
      translated: translatedText,
      targetLanguage,
      savedToDb: saveToDb && messageId ? true : false,
    });
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Translation failed',
        translated: null,
      },
      { status: 500 }
    );
  }
}
