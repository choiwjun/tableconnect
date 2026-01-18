import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export type AdminRole = 'super_admin' | 'merchant_admin';

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  merchantId?: string;
}

/**
 * Check if a user is an admin based on their email and app_metadata
 * In production, this should check against a proper admin table or Supabase user metadata
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Check user metadata for admin role
  // In production, this would come from app_metadata set by a super admin
  const role = user.app_metadata?.role as AdminRole | undefined;
  const merchantId = user.app_metadata?.merchant_id as string | undefined;

  // For development, also check against environment variable for super admin emails
  const superAdminEmails = process.env.SUPER_ADMIN_EMAILS?.split(',') || [];
  const isSuperAdmin = superAdminEmails.includes(user.email || '');

  if (isSuperAdmin) {
    return {
      id: user.id,
      email: user.email || '',
      role: 'super_admin',
    };
  }

  if (role === 'super_admin' || role === 'merchant_admin') {
    return {
      id: user.id,
      email: user.email || '',
      role,
      merchantId,
    };
  }

  return null;
}

/**
 * Check if a user has access to a specific merchant's data
 */
export async function hasAccessToMerchant(merchantId: string): Promise<boolean> {
  const admin = await getAdminUser();

  if (!admin) return false;

  // Super admin has access to all merchants
  if (admin.role === 'super_admin') return true;

  // Merchant admin only has access to their own merchant
  return admin.merchantId === merchantId;
}

/**
 * Middleware helper to protect admin API routes
 */
export async function withAdminAuth(
  request: NextRequest,
  handler: (admin: AdminUser) => Promise<NextResponse>
): Promise<NextResponse> {
  const admin = await getAdminUser();

  if (!admin) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin access required.' },
      { status: 401 }
    );
  }

  return handler(admin);
}

/**
 * Middleware helper to protect merchant-specific admin API routes
 */
export async function withMerchantAdminAuth(
  request: NextRequest,
  merchantId: string,
  handler: (admin: AdminUser) => Promise<NextResponse>
): Promise<NextResponse> {
  const admin = await getAdminUser();

  if (!admin) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin access required.' },
      { status: 401 }
    );
  }

  const hasAccess = await hasAccessToMerchant(merchantId);

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Forbidden. No access to this merchant.' },
      { status: 403 }
    );
  }

  return handler(admin);
}

/**
 * Check if current user is a super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  const admin = await getAdminUser();
  return admin?.role === 'super_admin';
}
