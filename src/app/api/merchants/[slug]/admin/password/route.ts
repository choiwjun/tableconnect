import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
} from '@/lib/security/password';
import { getAdminSessionFromRequest } from '@/lib/security/admin-session';

/**
 * PUT /api/merchants/[slug]/admin/password
 * Change admin password
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Verify admin session
    const session = await getAdminSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'All password fields are required' },
        { status: 400 }
      );
    }

    // Check password confirmation
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New passwords do not match' },
        { status: 400 }
      );
    }

    // Validate password strength
    const strengthCheck = validatePasswordStrength(newPassword);
    if (!strengthCheck.valid) {
      return NextResponse.json(
        {
          error: 'Password does not meet requirements',
          requirements: strengthCheck.errors,
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get merchant by slug
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id, admin_password_hash')
      .eq('slug', slug)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Verify session belongs to this merchant
    if (session.merchantId !== merchant.id) {
      return NextResponse.json(
        { error: 'Forbidden. No access to this merchant.' },
        { status: 403 }
      );
    }

    // Verify current password (if set)
    if (merchant.admin_password_hash) {
      const isValidCurrentPassword = await verifyPassword(
        currentPassword,
        merchant.admin_password_hash
      );

      if (!isValidCurrentPassword) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 401 }
        );
      }
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    const { error: updateError } = await supabase
      .from('merchants')
      .update({ admin_password_hash: newPasswordHash })
      .eq('id', merchant.id);

    if (updateError) {
      console.error('Failed to update password:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    console.log(`[SECURITY] Password changed for merchant: ${slug}`);

    return NextResponse.json({
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/merchants/[slug]/admin/password
 * Set initial admin password (first time setup)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const body = await request.json();
    const { email, newPassword, confirmPassword, setupToken } = body;

    // Validate required fields
    if (!email || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Email and password fields are required' },
        { status: 400 }
      );
    }

    // Check password confirmation
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Validate password strength
    const strengthCheck = validatePasswordStrength(newPassword);
    if (!strengthCheck.valid) {
      return NextResponse.json(
        {
          error: 'Password does not meet requirements',
          requirements: strengthCheck.errors,
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get merchant by slug
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id, admin_email, admin_password_hash, setup_token')
      .eq('slug', slug)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Check if password is already set
    if (merchant.admin_password_hash) {
      return NextResponse.json(
        { error: 'Password already set. Use PUT to change password.' },
        { status: 400 }
      );
    }

    // Verify setup token if provided (for extra security)
    if (merchant.setup_token && setupToken !== merchant.setup_token) {
      return NextResponse.json(
        { error: 'Invalid setup token' },
        { status: 401 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(newPassword);

    // Update merchant with password and email
    const { error: updateError } = await supabase
      .from('merchants')
      .update({
        admin_email: email,
        admin_password_hash: passwordHash,
        setup_token: null, // Clear setup token after use
      })
      .eq('id', merchant.id);

    if (updateError) {
      console.error('Failed to set initial password:', updateError);
      return NextResponse.json(
        { error: 'Failed to set password' },
        { status: 500 }
      );
    }

    console.log(`[SECURITY] Initial password set for merchant: ${slug}`);

    return NextResponse.json({
      message: 'Password set successfully. You can now login.',
    });
  } catch (error) {
    console.error('Set initial password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
