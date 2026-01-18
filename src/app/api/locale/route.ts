import { NextRequest, NextResponse } from 'next/server';
import { locales, type Locale } from '@/i18n/request';

export async function POST(request: NextRequest) {
  try {
    const { locale } = await request.json();

    if (!locale || !locales.includes(locale as Locale)) {
      return NextResponse.json(
        { error: 'Invalid locale' },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ success: true, locale });

    // Set locale cookie (expires in 1 year)
    response.cookies.set('NEXT_LOCALE', locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Failed to set locale' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const locale = request.cookies.get('NEXT_LOCALE')?.value || 'ja';

  return NextResponse.json({ locale });
}
