import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isValidUUID } from '@/lib/utils/validators';

// POST /api/blocks - Block a user
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { blockerSessionId, blockedSessionId } = body;

    if (!blockerSessionId || !blockedSessionId) {
      return NextResponse.json(
        { error: 'blockerSessionId and blockedSessionId are required' },
        { status: 400 }
      );
    }

    if (!isValidUUID(blockerSessionId) || !isValidUUID(blockedSessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    if (blockerSessionId === blockedSessionId) {
      return NextResponse.json(
        { error: 'Cannot block yourself' },
        { status: 400 }
      );
    }

    // Verify both sessions exist
    const { data: sessions, error: sessionError } = await supabase
      .from('sessions')
      .select('id')
      .in('id', [blockerSessionId, blockedSessionId]);

    if (sessionError || !sessions || sessions.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid session IDs' },
        { status: 400 }
      );
    }

    // Check if already blocked
    const { data: existingBlock } = await supabase
      .from('blocks')
      .select('id')
      .eq('blocker_session_id', blockerSessionId)
      .eq('blocked_session_id', blockedSessionId)
      .single();

    if (existingBlock) {
      return NextResponse.json(
        { error: 'User already blocked' },
        { status: 409 }
      );
    }

    // Create block record
    const { data: block, error } = await supabase
      .from('blocks')
      .insert({
        blocker_session_id: blockerSessionId,
        blocked_session_id: blockedSessionId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating block:', error);
      return NextResponse.json(
        { error: 'Failed to block user' },
        { status: 500 }
      );
    }

    return NextResponse.json({ block }, { status: 201 });
  } catch (error) {
    console.error('Block error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/blocks?sessionId= - Get blocked users list
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
    const { data: blocks, error } = await supabase
      .from('blocks')
      .select(`
        id,
        created_at,
        blocked:sessions!blocks_blocked_session_id_fkey (
          id,
          nickname,
          table_number
        )
      `)
      .eq('blocker_session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching blocks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch blocked users' },
        { status: 500 }
      );
    }

    // Transform the data
    const blockedUsers = (blocks || []).map((block) => {
      const blockedData = Array.isArray(block.blocked) ? block.blocked[0] : block.blocked;
      return {
        id: block.id,
        createdAt: block.created_at,
        blocked: blockedData,
      };
    });

    return NextResponse.json({ blockedUsers });
  } catch (error) {
    console.error('Get blocks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/blocks?id= - Unblock a user
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  const blockId = request.nextUrl.searchParams.get('id');
  const sessionId = request.nextUrl.searchParams.get('sessionId');

  if (!blockId || !sessionId) {
    return NextResponse.json(
      { error: 'id and sessionId are required' },
      { status: 400 }
    );
  }

  if (!isValidUUID(blockId) || !isValidUUID(sessionId)) {
    return NextResponse.json(
      { error: 'Invalid ID format' },
      { status: 400 }
    );
  }

  try {
    // Verify ownership before deletion
    const { data: block, error: fetchError } = await supabase
      .from('blocks')
      .select('id, blocker_session_id')
      .eq('id', blockId)
      .single();

    if (fetchError || !block) {
      return NextResponse.json(
        { error: 'Block not found' },
        { status: 404 }
      );
    }

    if (block.blocker_session_id !== sessionId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('id', blockId);

    if (error) {
      console.error('Error deleting block:', error);
      return NextResponse.json(
        { error: 'Failed to unblock user' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unblock error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
