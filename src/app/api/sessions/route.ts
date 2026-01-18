import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { SESSION_TTL_MS } from '@/lib/utils/constants';
import { isValidTableNumber, isValidUUID } from '@/lib/utils/validators';

/**
 * POST /api/sessions
 * Create a new session for a table
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantId, tableNumber } = body;

    // Validate input
    if (!merchantId || !isValidUUID(merchantId)) {
      return NextResponse.json(
        { error: 'Invalid merchant ID' },
        { status: 400 }
      );
    }

    if (!isValidTableNumber(tableNumber)) {
      return NextResponse.json(
        { error: 'Invalid table number' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Verify merchant exists and is active
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id, settings')
      .eq('id', merchantId)
      .eq('is_active', true)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Check table number is valid for this merchant
    const maxTables = merchant.settings?.max_tables ?? 50;
    if (tableNumber > maxTables) {
      return NextResponse.json(
        { error: 'Invalid table number for this merchant' },
        { status: 400 }
      );
    }

    // Check for existing active session at this table
    const { data: existingSession } = await supabase
      .from('sessions')
      .select('id')
      .eq('merchant_id', merchantId)
      .eq('table_number', tableNumber)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingSession) {
      // Return existing session
      return NextResponse.json(
        { sessionId: existingSession.id, isExisting: true },
        { status: 200 }
      );
    }

    // Create new session
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

    const { data: newSession, error: createError } = await supabase
      .from('sessions')
      .insert({
        merchant_id: merchantId,
        table_number: tableNumber,
        is_active: true,
        expires_at: expiresAt,
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating session:', createError);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { sessionId: newSession.id, isExisting: false },
      { status: 201 }
    );
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sessions?merchantId=xxx&tableNumber=xxx
 * Get active session for a table
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const tableNumber = searchParams.get('tableNumber');

    if (!merchantId || !isValidUUID(merchantId)) {
      return NextResponse.json(
        { error: 'Invalid merchant ID' },
        { status: 400 }
      );
    }

    const tableNum = tableNumber ? parseInt(tableNumber, 10) : null;
    if (tableNum !== null && !isValidTableNumber(tableNum)) {
      return NextResponse.json(
        { error: 'Invalid table number' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('sessions')
      .select('*')
      .eq('merchant_id', merchantId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString());

    if (tableNum !== null) {
      query = query.eq('table_number', tableNum);
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error('Error fetching sessions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
