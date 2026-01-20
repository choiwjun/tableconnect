/**
 * Admin Session Management
 * 가맹점 관리자 세션 검증 및 관리
 */

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const ADMIN_SESSION_COOKIE = 'admin_session_id';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8시간

export interface AdminSession {
  id: string;
  merchantId: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * 관리자 세션 생성
 */
export async function createAdminSession(
  merchantId: string,
  email: string,
  ipAddress: string,
  userAgent: string
): Promise<AdminSession | null> {
  const supabase = getSupabaseAdmin();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

  try {
    // 기존 세션 무효화 (같은 이메일의 다른 세션)
    await supabase
      .from('admin_sessions')
      .update({ is_valid: false })
      .eq('email', email)
      .eq('is_valid', true);

    // 새 세션 생성
    const { data: session, error } = await supabase
      .from('admin_sessions')
      .insert({
        merchant_id: merchantId,
        email,
        ip_address: ipAddress,
        user_agent: userAgent,
        is_valid: true,
        created_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error || !session) {
      console.error('Failed to create admin session:', error);
      return null;
    }

    return {
      id: session.id,
      merchantId: session.merchant_id,
      email: session.email,
      ipAddress: session.ip_address,
      userAgent: session.user_agent,
      createdAt: new Date(session.created_at),
      expiresAt: new Date(session.expires_at),
    };
  } catch (error) {
    console.error('Create admin session error:', error);
    return null;
  }
}

/**
 * 관리자 세션 검증
 */
export async function validateAdminSession(
  sessionId: string,
  ipAddress?: string
): Promise<AdminSession | null> {
  const supabase = getSupabaseAdmin();
  const now = new Date();

  try {
    const { data: session, error } = await supabase
      .from('admin_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('is_valid', true)
      .gt('expires_at', now.toISOString())
      .single();

    if (error || !session) {
      return null;
    }

    // IP 검증 (선택적 - 보안 강화)
    if (ipAddress && session.ip_address !== ipAddress) {
      console.warn(`[SECURITY] IP mismatch for session ${sessionId}: expected ${session.ip_address}, got ${ipAddress}`);
      // IP 변경 시 세션 무효화 (선택적)
      // await invalidateAdminSession(sessionId);
      // return null;
    }

    // 세션 활동 시간 업데이트
    await supabase
      .from('admin_sessions')
      .update({ last_activity_at: now.toISOString() })
      .eq('id', sessionId);

    return {
      id: session.id,
      merchantId: session.merchant_id,
      email: session.email,
      ipAddress: session.ip_address,
      userAgent: session.user_agent,
      createdAt: new Date(session.created_at),
      expiresAt: new Date(session.expires_at),
    };
  } catch (error) {
    console.error('Validate admin session error:', error);
    return null;
  }
}

/**
 * 관리자 세션 무효화 (로그아웃)
 */
export async function invalidateAdminSession(sessionId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  try {
    const { error } = await supabase
      .from('admin_sessions')
      .update({ is_valid: false })
      .eq('id', sessionId);

    return !error;
  } catch (error) {
    console.error('Invalidate admin session error:', error);
    return false;
  }
}

/**
 * 쿠키에서 관리자 세션 가져오기
 */
export async function getAdminSessionFromCookie(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

    if (!sessionId) {
      return null;
    }

    return validateAdminSession(sessionId);
  } catch (error) {
    console.error('Get admin session from cookie error:', error);
    return null;
  }
}

/**
 * Request에서 관리자 세션 가져오기
 */
export async function getAdminSessionFromRequest(
  request: NextRequest
): Promise<AdminSession | null> {
  const sessionId = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (!sessionId) {
    return null;
  }

  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                    request.headers.get('x-real-ip') ||
                    'unknown';

  return validateAdminSession(sessionId, ipAddress);
}

/**
 * 관리자 인증 미들웨어 헬퍼
 */
export async function withMerchantAuth(
  request: NextRequest,
  handler: (session: AdminSession) => Promise<NextResponse>
): Promise<NextResponse> {
  const session = await getAdminSessionFromRequest(request);

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized. Please login.' },
      { status: 401 }
    );
  }

  return handler(session);
}

/**
 * 특정 가맹점 접근 권한 확인
 */
export async function withMerchantAccess(
  request: NextRequest,
  merchantId: string,
  handler: (session: AdminSession) => Promise<NextResponse>
): Promise<NextResponse> {
  const session = await getAdminSessionFromRequest(request);

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized. Please login.' },
      { status: 401 }
    );
  }

  if (session.merchantId !== merchantId) {
    return NextResponse.json(
      { error: 'Forbidden. No access to this merchant.' },
      { status: 403 }
    );
  }

  return handler(session);
}

/**
 * 만료된 세션 정리 (크론 작업용)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const supabase = getSupabaseAdmin();
  const now = new Date();

  try {
    const { data, error } = await supabase
      .from('admin_sessions')
      .delete()
      .lt('expires_at', now.toISOString())
      .select('id');

    if (error) {
      console.error('Cleanup expired sessions error:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Cleanup expired sessions error:', error);
    return 0;
  }
}

/**
 * 세션 쿠키 설정 헬퍼
 */
export function getSessionCookieOptions() {
  return {
    name: ADMIN_SESSION_COOKIE,
    options: {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: SESSION_DURATION_MS / 1000, // seconds
    },
  };
}
