import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// ============================================
// Rate Limiting (in-memory for single instance)
// For production with multiple instances, use Redis
// ============================================
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(
  ip: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const key = `api:${ip}`;
  const record = rateLimitStore.get(key);

  // Cleanup old entries when store gets large
  if (rateLimitStore.size > 10000) {
    const cutoff = now - windowMs;
    const keysToDelete: string[] = [];
    rateLimitStore.forEach((v, k) => {
      if (v.resetAt < cutoff) keysToDelete.push(k);
    });
    keysToDelete.forEach((k) => rateLimitStore.delete(k));
  }

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}

export async function middleware(request: NextRequest) {
  // Get client IP for rate limiting
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  // ============================================
  // Rate Limiting for API Routes
  // ============================================
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  let rateLimitRemaining = 100;

  if (isApiRoute) {
    // Stricter limits for authentication endpoints
    const isAuthEndpoint =
      request.nextUrl.pathname.includes('/login') ||
      request.nextUrl.pathname.includes('/sessions');

    const maxRequests = isAuthEndpoint ? 20 : 100; // 20/min for auth, 100/min for others
    const { allowed, remaining } = checkRateLimit(ip, maxRequests);
    rateLimitRemaining = remaining;

    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Limit': maxRequests.toString(),
          },
        }
      );
    }
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  // Add rate limit header to response
  if (isApiRoute) {
    supabaseResponse.headers.set('X-RateLimit-Remaining', rateLimitRemaining.toString());
  }

  // Check if Supabase environment variables are configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Skip Supabase auth if not configured - allow request to proceed
    console.warn('Supabase environment variables not configured');
    return supabaseResponse;
  }

  let user = null;

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // 세션 갱신을 위해 getUser 호출
    // 이는 Supabase Auth 토큰을 갱신하는 데 필요합니다
    const { data } = await supabase.auth.getUser();
    user = data?.user;
  } catch (error) {
    console.error('Middleware Supabase error:', error);
    // Continue without auth on error
    return supabaseResponse;
  }

  // Admin routes protection
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isAdminApiRoute = request.nextUrl.pathname.startsWith('/api/admin');
  const isAdminLoginOrUnauthorized =
    request.nextUrl.pathname === '/admin/login' ||
    request.nextUrl.pathname === '/admin/unauthorized';

  if ((isAdminRoute || isAdminApiRoute) && !isAdminLoginOrUnauthorized) {
    if (!user) {
      // Not authenticated - redirect to login for page routes
      if (isAdminRoute) {
        const loginUrl = new URL('/admin/login', request.url);
        loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      }
      // Return 401 for API routes
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const role = user.app_metadata?.role;
    const superAdminEmails = process.env.SUPER_ADMIN_EMAILS?.split(',') || [];
    const isSuperAdmin = superAdminEmails.includes(user.email || '');
    const isAdmin = isSuperAdmin || role === 'super_admin' || role === 'merchant_admin';

    if (!isAdmin) {
      if (isAdminRoute) {
        // Redirect to unauthorized page
        return NextResponse.redirect(new URL('/admin/unauthorized', request.url));
      }
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      );
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * 다음으로 시작하는 경로를 제외한 모든 요청 경로에 적용:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화 파일)
     * - favicon.ico (파비콘 파일)
     * - 이미지 파일 (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
