// Server Client - 서버 컴포넌트/API에서 사용
export { createClient as createServerClient } from './server';

// Browser Client - 클라이언트 컴포넌트에서 사용
export { createClient as createBrowserClient } from './client';

// Admin Client - API Routes에서 service role key로 사용
export { getSupabaseAdmin } from './admin';
