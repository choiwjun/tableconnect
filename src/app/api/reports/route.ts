import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isValidUUID } from '@/lib/utils/validators';

type ReportReason = 'harassment' | 'spam' | 'inappropriate' | 'other';

const validReasons: ReportReason[] = ['harassment', 'spam', 'inappropriate', 'other'];

// POST /api/reports - Create a report
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { reporterSessionId, reportedSessionId, messageId, reason, description } = body;

    if (!reporterSessionId || !reportedSessionId || !reason) {
      return NextResponse.json(
        { error: 'reporterSessionId, reportedSessionId, and reason are required' },
        { status: 400 }
      );
    }

    if (!isValidUUID(reporterSessionId) || !isValidUUID(reportedSessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    if (messageId && !isValidUUID(messageId)) {
      return NextResponse.json(
        { error: 'Invalid message ID format' },
        { status: 400 }
      );
    }

    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: `Invalid reason. Must be one of: ${validReasons.join(', ')}` },
        { status: 400 }
      );
    }

    if (reporterSessionId === reportedSessionId) {
      return NextResponse.json(
        { error: 'Cannot report yourself' },
        { status: 400 }
      );
    }

    // Verify both sessions exist
    const { data: sessions, error: sessionError } = await supabase
      .from('sessions')
      .select('id')
      .in('id', [reporterSessionId, reportedSessionId]);

    if (sessionError || !sessions || sessions.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid session IDs' },
        { status: 400 }
      );
    }

    // If messageId provided, verify it exists
    if (messageId) {
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .select('id')
        .eq('id', messageId)
        .single();

      if (messageError || !message) {
        return NextResponse.json(
          { error: 'Message not found' },
          { status: 400 }
        );
      }
    }

    // Create report record
    const { data: report, error } = await supabase
      .from('reports')
      .insert({
        reporter_session_id: reporterSessionId,
        reported_session_id: reportedSessionId,
        message_id: messageId || null,
        reason,
        description: description?.trim() || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating report:', error);
      return NextResponse.json(
        { error: 'Failed to create report' },
        { status: 500 }
      );
    }

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error('Report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/reports?sessionId= - Get reports made by a session
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const sessionId = request.nextUrl.searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'sessionId is required' },
      { status: 400 }
    );
  }

  if (!isValidUUID(sessionId)) {
    return NextResponse.json(
      { error: 'Invalid session ID format' },
      { status: 400 }
    );
  }

  try {
    const { data: reports, error } = await supabase
      .from('reports')
      .select(`
        id,
        reason,
        description,
        status,
        created_at,
        reported:sessions!reports_reported_session_id_fkey (
          id,
          nickname,
          table_number
        )
      `)
      .eq('reporter_session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      );
    }

    // Transform the data
    const transformedReports = (reports || []).map((report) => {
      const reportedData = Array.isArray(report.reported) ? report.reported[0] : report.reported;
      return {
        id: report.id,
        reason: report.reason,
        description: report.description,
        status: report.status,
        createdAt: report.created_at,
        reported: reportedData,
      };
    });

    return NextResponse.json({ reports: transformedReports });
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
