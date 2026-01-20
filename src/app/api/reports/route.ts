import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import crypto from 'crypto';

/**
 * Helper: Hash session ID for privacy
 */
function hashSessionId(sessionId: string): string {
  return crypto.createHash('sha256').update(sessionId).digest('hex');
}

/**
 * POST /api/reports
 * Create a new report with hashed session ID
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      reporter_session_id,
      reported_session_id,
      reason,
      details,
    } = body;

    // Validate required fields
    if (!reporter_session_id || !reported_session_id || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate reason
    const validReasons = ['harassment', 'spam', 'inappropriate_content', 'other'];
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: 'Invalid reason' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Hash session IDs for privacy
    const hashedReporter = hashSessionId(reporter_session_id);
    const hashedReported = hashSessionId(reported_session_id);

    // Get session snapshot (profile info at time of report)
    const { data: reportedSession, error: sessionError } = await supabase
      .from('sessions')
      .select('id, merchant_id, profile, table_number, is_active')
      .eq('id', reported_session_id)
      .single();

    if (sessionError || !reportedSession) {
      return NextResponse.json(
        { error: 'Reported session not found' },
        { status: 404 }
      );
    }

    // Create report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        reporter_session_id: hashedReporter,
        reported_session_id: hashedReported,
        reason,
        details: details || null,
        session_snapshot: reportedSession,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single();

    if (reportError) {
      console.error('Error creating report:', reportError);
      return NextResponse.json(
        { error: 'Failed to create report' },
        { status: 500 }
      );
    }

    console.log('Report created:', {
      id: report.id,
      reason,
      hashedReporter,
    });

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        reason,
        status: 'pending',
      },
    });
  } catch (error) {
    console.error('Report API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reports
 * Get reports (admin only)
 */
export async function GET(request: NextRequest) {
  // This is admin-only, so we might want to add auth check here
  // For now, just return empty or implement pagination later
  try {
    const supabase = getSupabaseAdmin();

    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: reports || [],
    });
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
