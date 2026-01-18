import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { isValidUUID } from '@/lib/utils/validators';

export interface ActiveTable {
  sessionId: string;
  tableNumber: number;
  nickname: string | null;
  createdAt: string;
}

/**
 * GET /api/tables?merchantId=xxx&excludeSessionId=xxx
 * Get list of active tables for a merchant
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const excludeSessionId = searchParams.get('excludeSessionId');

    if (!merchantId || !isValidUUID(merchantId)) {
      return NextResponse.json(
        { error: 'Invalid merchant ID' },
        { status: 400 }
      );
    }

    if (excludeSessionId && !isValidUUID(excludeSessionId)) {
      return NextResponse.json(
        { error: 'Invalid exclude session ID' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get active sessions with nicknames for this merchant
    let query = supabase
      .from('sessions')
      .select('id, table_number, nickname, created_at')
      .eq('merchant_id', merchantId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .not('nickname', 'is', null) // Only include sessions with nicknames
      .order('table_number', { ascending: true });

    // Exclude current user's session if provided
    if (excludeSessionId) {
      query = query.neq('id', excludeSessionId);
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error('Error fetching active tables:', error);
      return NextResponse.json(
        { error: 'Failed to fetch active tables' },
        { status: 500 }
      );
    }

    // Transform to ActiveTable format
    const tables: ActiveTable[] = (sessions || []).map((session) => ({
      sessionId: session.id,
      tableNumber: session.table_number,
      nickname: session.nickname,
      createdAt: session.created_at,
    }));

    return NextResponse.json({ tables });
  } catch (error) {
    console.error('Tables fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
