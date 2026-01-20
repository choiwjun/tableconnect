import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { verifyPassword } from '@/lib/security/password';
import {
  checkLoginRateLimit,
  recordLoginAttempt,
  clearLoginAttempts,
  checkMemoryRateLimit,
  clearMemoryRateLimit,
} from '@/lib/security/rate-limit';
import {
  createAdminSession,
  getSessionCookieOptions,
} from '@/lib/security/admin-session';

/**
 * POST /api/merchants/login
 * Merchant Admin Login with security features
 */
export async function POST(request: NextRequest) {
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    const body = await request.json();
    const { merchantSlug, email, password } = body;

    // Validate required fields
    if (!merchantSlug || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Rate limiting check (email-based)
    const emailRateLimit = await checkLoginRateLimit(email, 'email');
    if (!emailRateLimit.allowed) {
      console.warn(
        `[SECURITY] Rate limit exceeded for email: ${email}, blocked until: ${emailRateLimit.blockExpiresAt}`
      );
      return NextResponse.json(
        {
          error: 'Too many login attempts. Please try again later.',
          blockedUntil: emailRateLimit.blockExpiresAt?.toISOString(),
        },
        { status: 429 }
      );
    }

    // IP-based rate limiting (메모리 기반 - 빠른 체크)
    const ipRateLimit = checkMemoryRateLimit(`ip:${ipAddress}`, 10, 60000); // 1분에 10회
    if (!ipRateLimit.allowed) {
      console.warn(`[SECURITY] IP rate limit exceeded: ${ipAddress}`);
      return NextResponse.json(
        { error: 'Too many requests from this IP. Please try again later.' },
        { status: 429 }
      );
    }

    console.log(
      `[SECURITY] Login attempt for merchant: ${merchantSlug}, email: ${email}, IP: ${ipAddress}`
    );

    const supabase = getSupabaseAdmin();

    // Get merchant by slug
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id, slug, name, admin_email, admin_password_hash, is_active')
      .eq('slug', merchantSlug)
      .eq('is_active', true)
      .single();

    if (merchantError || !merchant) {
      // Record failed attempt
      await recordLoginAttempt(email, 'email', false, ipAddress, userAgent);
      console.error(
        `[SECURITY] Login failed - Merchant not found: ${merchantSlug}`
      );
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if admin email matches
    if (merchant.admin_email && merchant.admin_email !== email) {
      await recordLoginAttempt(email, 'email', false, ipAddress, userAgent);
      console.error(
        `[SECURITY] Login failed - Email mismatch for merchant ${merchantSlug}`
      );
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Demo mode: if no password hash is set
    if (!merchant.admin_password_hash) {
      console.warn(
        `[SECURITY] No admin_password_hash found for merchant ${merchantSlug} - using demo mode`
      );

      // Demo mode: accept password "demo1234" only
      if (password !== 'demo1234') {
        await recordLoginAttempt(email, 'email', false, ipAddress, userAgent);
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      // Create session for demo mode
      const session = await createAdminSession(
        merchant.id,
        email,
        ipAddress,
        userAgent
      );

      if (!session) {
        return NextResponse.json(
          { error: 'Failed to create session' },
          { status: 500 }
        );
      }

      // Clear rate limit on successful login
      await clearLoginAttempts(email, 'email');
      clearMemoryRateLimit(`ip:${ipAddress}`);

      console.log(
        `[SECURITY] Demo login successful for merchant: ${merchantSlug}, email: ${email}`
      );

      const cookieOptions = getSessionCookieOptions();
      const response = NextResponse.json({
        merchantId: merchant.id,
        sessionId: session.id,
        message: 'Login successful (demo mode)',
        warning: 'Please set a secure password in production',
      });

      response.cookies.set(
        cookieOptions.name,
        session.id,
        cookieOptions.options
      );

      return response;
    }

    // Production mode: verify password with bcrypt
    const isValidPassword = await verifyPassword(
      password,
      merchant.admin_password_hash
    );

    if (!isValidPassword) {
      await recordLoginAttempt(email, 'email', false, ipAddress, userAgent);
      console.error(
        `[SECURITY] Login failed - Invalid password for merchant ${merchantSlug}, remaining attempts: ${emailRateLimit.remainingAttempts - 1}`
      );
      return NextResponse.json(
        {
          error: 'Invalid credentials',
          remainingAttempts: emailRateLimit.remainingAttempts - 1,
        },
        { status: 401 }
      );
    }

    // Create admin session
    const session = await createAdminSession(
      merchant.id,
      email,
      ipAddress,
      userAgent
    );

    if (!session) {
      console.error(
        `[SECURITY] Failed to create admin session for merchant ${merchantSlug}`
      );
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    // Record successful login and clear rate limits
    await recordLoginAttempt(email, 'email', true, ipAddress, userAgent);
    await clearLoginAttempts(email, 'email');
    clearMemoryRateLimit(`ip:${ipAddress}`);

    console.log(
      `[SECURITY] Login successful for merchant: ${merchantSlug}, email: ${email}`
    );

    // Set session cookie
    const cookieOptions = getSessionCookieOptions();
    const response = NextResponse.json({
      merchantId: merchant.id,
      sessionId: session.id,
      message: 'Login successful',
    });

    response.cookies.set(cookieOptions.name, session.id, cookieOptions.options);

    return response;
  } catch (error) {
    console.error('Merchant login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/merchants/login
 * Logout - Invalidate admin session
 */
export async function DELETE(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('admin_session_id')?.value;

    if (sessionId) {
      const { invalidateAdminSession } = await import(
        '@/lib/security/admin-session'
      );
      await invalidateAdminSession(sessionId);
    }

    const response = NextResponse.json({ message: 'Logged out successfully' });

    // Clear session cookie
    response.cookies.set('admin_session_id', '', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
