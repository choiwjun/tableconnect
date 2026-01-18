import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminUser, hasAccessToMerchant } from '@/lib/auth';

// GET /api/admin/settlements - Get settlement data
export async function GET(request: NextRequest) {
  const admin = await getAdminUser();

  if (!admin) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;

  const merchantId = searchParams.get('merchantId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  // Check merchant access for merchant_admin
  if (merchantId && admin.role === 'merchant_admin') {
    const hasAccess = await hasAccessToMerchant(merchantId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
  }

  try {
    // Build query
    let query = supabase
      .from('settlements')
      .select(`
        id,
        merchant_id,
        period_start,
        period_end,
        total_amount,
        fee_amount,
        net_amount,
        status,
        paid_at,
        created_at,
        merchant:merchants (
          id,
          name,
          slug
        )
      `, { count: 'exact' });

    // Apply filters
    if (merchantId) {
      query = query.eq('merchant_id', merchantId);
    } else if (admin.role === 'merchant_admin' && admin.merchantId) {
      // Merchant admin can only see their own settlements
      query = query.eq('merchant_id', admin.merchantId);
    }

    if (startDate) {
      query = query.gte('period_start', startDate);
    }

    if (endDate) {
      query = query.lte('period_end', endDate);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: settlements, error, count } = await query;

    if (error) {
      console.error('Error fetching settlements:', error);
      return NextResponse.json(
        { error: 'Failed to fetch settlements' },
        { status: 500 }
      );
    }

    // Transform the data
    const transformedSettlements = (settlements || []).map((settlement) => {
      const merchantData = Array.isArray(settlement.merchant)
        ? settlement.merchant[0]
        : settlement.merchant;

      return {
        id: settlement.id,
        merchantId: settlement.merchant_id,
        periodStart: settlement.period_start,
        periodEnd: settlement.period_end,
        totalAmount: settlement.total_amount,
        feeAmount: settlement.fee_amount,
        netAmount: settlement.net_amount,
        status: settlement.status,
        paidAt: settlement.paid_at,
        createdAt: settlement.created_at,
        merchant: merchantData,
      };
    });

    return NextResponse.json({
      settlements: transformedSettlements,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Settlements API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/settlements - Create a new settlement (super admin only)
export async function POST(request: NextRequest) {
  const admin = await getAdminUser();

  if (!admin || admin.role !== 'super_admin') {
    return NextResponse.json(
      { error: 'Forbidden. Super admin access required.' },
      { status: 403 }
    );
  }

  const supabase = await createClient();

  try {
    const body = await request.json();
    const { merchantId, periodStart, periodEnd } = body;

    if (!merchantId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'merchantId, periodStart, and periodEnd are required' },
        { status: 400 }
      );
    }

    // Get session IDs for this merchant
    const { data: merchantSessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id')
      .eq('merchant_id', merchantId);

    if (sessionsError) {
      console.error('Error fetching merchant sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to calculate settlement' },
        { status: 500 }
      );
    }

    const sessionIds = (merchantSessions || []).map(s => s.id);

    // Calculate total amount from gifts in the period
    let gifts: { amount: number }[] = [];
    if (sessionIds.length > 0) {
      const { data, error: giftsError } = await supabase
        .from('gifts')
        .select('amount')
        .eq('status', 'completed')
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd)
        .in('sender_session_id', sessionIds);

      if (giftsError) {
        console.error('Error calculating settlement:', giftsError);
        return NextResponse.json(
          { error: 'Failed to calculate settlement' },
          { status: 500 }
        );
      }
      gifts = data || [];
    }

    const totalAmount = (gifts || []).reduce((sum, gift) => sum + gift.amount, 0);
    const feeRate = 0.1; // 10% platform fee
    const feeAmount = Math.floor(totalAmount * feeRate);
    const netAmount = totalAmount - feeAmount;

    // Create settlement record
    const { data: settlement, error } = await supabase
      .from('settlements')
      .insert({
        merchant_id: merchantId,
        period_start: periodStart,
        period_end: periodEnd,
        total_amount: totalAmount,
        fee_amount: feeAmount,
        net_amount: netAmount,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating settlement:', error);
      return NextResponse.json(
        { error: 'Failed to create settlement' },
        { status: 500 }
      );
    }

    return NextResponse.json({ settlement }, { status: 201 });
  } catch (error) {
    console.error('Settlement creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/settlements - Update settlement status (super admin only)
export async function PATCH(request: NextRequest) {
  const admin = await getAdminUser();

  if (!admin || admin.role !== 'super_admin') {
    return NextResponse.json(
      { error: 'Forbidden. Super admin access required.' },
      { status: 403 }
    );
  }

  const supabase = await createClient();

  try {
    const body = await request.json();
    const { settlementId, status: newStatus } = body;

    if (!settlementId || !newStatus) {
      return NextResponse.json(
        { error: 'settlementId and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'processing', 'completed', 'failed'];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'completed') {
      updateData.paid_at = new Date().toISOString();
    }

    const { data: settlement, error } = await supabase
      .from('settlements')
      .update(updateData)
      .eq('id', settlementId)
      .select()
      .single();

    if (error) {
      console.error('Error updating settlement:', error);
      return NextResponse.json(
        { error: 'Failed to update settlement' },
        { status: 500 }
      );
    }

    return NextResponse.json({ settlement });
  } catch (error) {
    console.error('Settlement update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
