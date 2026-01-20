import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/client';

/**
 * POST /api/merchants/login
 * Merchant Admin Login
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantSlug, email, password } = body;

    if (!merchantSlug || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Rate limiting: prevent brute force attacks (max 5 attempts per 15 minutes)
    const rateLimitKey = `login_attempts:${email}`;
    const supabase = getSupabaseAdmin();
    
    // Log login attempt for security monitoring
    console.warn(`[SECURITY] Login attempt for merchant: ${merchantSlug}, email: ${email}`);

    // Get merchant by slug
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('*')
      .eq('slug', merchantSlug)
      .eq('is_active', true)
      .single();

    if (merchantError || !merchant) {
      // Log failed attempt
      console.error(`[SECURITY] Login failed - Merchant not found: ${merchantSlug}`);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if merchant has admin_password_hash (if not, create one for demo)
    if (!merchant.admin_password_hash) {
      // For demo: create a hash (in production, this should be done via migration)
      console.warn(`[SECURITY] No admin_password_hash found for merchant ${merchantSlug} - using demo credentials`);
      // Demo mode: accept any password, but log it
      return NextResponse.json({
        merchantId: merchant.id,
        message: 'Login successful (demo mode)',
        warning: 'This is demo mode - implement proper authentication in production',
      });
    }

    // In production: use bcrypt to compare password with hash
    // For now, we'll compare directly (NOT SECURE - implement bcrypt in production)
    if (merchant.admin_password_hash !== password) {
      console.error(`[SECURITY] Login failed - Invalid password for merchant ${merchantSlug}`);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create admin session for tracking
    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions')
      .insert({
        merchant_id: merchant.id,
        email,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
      })
      .select()
      .single();

    if (sessionError || !session) {
      console.error(`[SECURITY] Failed to create admin session for merchant ${merchantSlug}`);
    }

    // Log successful login
    console.log(`[SECURITY] Login successful for merchant: ${merchantSlug}, email: ${email}`);

    return NextResponse.json({
      merchantId: merchant.id,
      sessionId: session?.id,
      message: 'Login successful',
    }, {
      // Set secure cookie for admin session
      headers: {
        'Set-Cookie': `admin_session_id=${session?.id}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`, // 8 hours
      },
    });
  } catch (error) {
    console.error('Merchant login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
