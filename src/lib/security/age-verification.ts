/**
 * Age Verification Utilities
 * 연령 확인 관련 유틸리티
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface AgeVerificationStatus {
  isVerified: boolean;
  verifiedAt: string | null;
  verifiedByStaff: boolean;
  verificationMethod: 'self' | 'staff' | 'id_check' | null;
}

/**
 * Check if a session has age verification
 */
export async function checkAgeVerification(
  supabase: SupabaseClient,
  sessionId: string
): Promise<AgeVerificationStatus> {
  const { data, error } = await supabase
    .from('sessions')
    .select('age_verified_at, age_verified_by_staff, age_verification_method')
    .eq('id', sessionId)
    .single();

  if (error || !data) {
    return {
      isVerified: false,
      verifiedAt: null,
      verifiedByStaff: false,
      verificationMethod: null,
    };
  }

  return {
    isVerified: !!data.age_verified_at,
    verifiedAt: data.age_verified_at,
    verifiedByStaff: data.age_verified_by_staff || false,
    verificationMethod: data.age_verification_method,
  };
}

/**
 * Require age verification for an action
 * Returns error message if not verified, null if verified
 */
export async function requireAgeVerification(
  supabase: SupabaseClient,
  sessionId: string,
  requireStaffVerification: boolean = false
): Promise<{ allowed: boolean; error?: string }> {
  const status = await checkAgeVerification(supabase, sessionId);

  if (!status.isVerified) {
    return {
      allowed: false,
      error: '年齢確認が必要です。スタッフにお声がけください。',
    };
  }

  if (requireStaffVerification && !status.verifiedByStaff) {
    return {
      allowed: false,
      error: 'スタッフによる年齢確認が必要です。',
    };
  }

  return { allowed: true };
}

/**
 * Get age verification error message in multiple languages
 */
export function getAgeVerificationError(
  locale: string = 'ja',
  requireStaff: boolean = false
): string {
  const messages: Record<string, Record<string, string>> = {
    ja: {
      notVerified: '年齢確認が必要です。スタッフにお声がけください。',
      staffRequired: 'スタッフによる年齢確認が必要です。',
    },
    en: {
      notVerified: 'Age verification is required. Please ask a staff member.',
      staffRequired: 'Staff age verification is required.',
    },
    ko: {
      notVerified: '연령 확인이 필요합니다. 직원에게 문의해 주세요.',
      staffRequired: '직원에 의한 연령 확인이 필요합니다.',
    },
  };

  const localeMessages = messages[locale] || messages['ja'];
  return requireStaff ? localeMessages['staffRequired'] : localeMessages['notVerified'];
}

/**
 * Self-verification: User confirms they are of legal age
 * This is the minimum requirement, stores timestamp and IP for audit
 */
export async function selfVerifyAge(
  supabase: SupabaseClient,
  sessionId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; error?: string }> {
  // Check if already verified
  const status = await checkAgeVerification(supabase, sessionId);
  if (status.isVerified) {
    return { success: true };
  }

  const { error } = await supabase
    .from('sessions')
    .update({
      age_verified_at: new Date().toISOString(),
      age_verification_method: 'self',
      age_verified_by_staff: false,
    })
    .eq('id', sessionId)
    .is('age_verified_at', null);

  if (error) {
    console.error('Self age verification error:', error);
    return { success: false, error: 'Failed to verify age' };
  }

  // Log the self-verification for audit purposes
  console.log(`[AGE_VERIFICATION] Session ${sessionId} self-verified`, {
    timestamp: new Date().toISOString(),
    ipAddress: ipAddress || 'unknown',
    userAgent: userAgent || 'unknown',
  });

  return { success: true };
}
