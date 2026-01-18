import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
  const { data: { user } } = await supabase.auth.getUser();

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
