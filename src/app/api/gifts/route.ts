import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isValidUUID } from '@/lib/utils/validators';
import { getAllBlockedSessionIds } from '@/lib/security/block-check';

// GET /api/gifts - Get gifts for a session (sent and received)
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const sessionId = request.nextUrl.searchParams.get('sessionId');
  const type = request.nextUrl.searchParams.get('type') || 'all'; // 'sent' | 'received' | 'all'

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
    let query = supabase
      .from('gifts')
      .select(`
        id,
        amount,
        message,
        status,
        created_at,
        paid_at,
        menu:menus (
          id,
          name,
          price,
          image_url
        ),
        sender:sessions!gifts_sender_session_id_fkey (
          id,
          nickname,
          table_number
        ),
        receiver:sessions!gifts_receiver_session_id_fkey (
          id,
          nickname,
          table_number
        )
      `)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (type === 'sent') {
      query = query.eq('sender_session_id', sessionId);
    } else if (type === 'received') {
      query = query.eq('receiver_session_id', sessionId);
    } else {
      // Get both sent and received
      query = query.or(`sender_session_id.eq.${sessionId},receiver_session_id.eq.${sessionId}`);
    }

    const { data: gifts, error } = await query;

    if (error) {
      console.error('Error fetching gifts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch gifts' },
        { status: 500 }
      );
    }

    // Filter out gifts from/to blocked users
    const blockedIds = await getAllBlockedSessionIds(supabase, sessionId);
    const blockedSet = new Set(blockedIds);
    const filteredGifts = (gifts || []).filter((gift) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const senderArr = gift.sender as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const receiverArr = gift.receiver as any;
      const senderId = Array.isArray(senderArr) ? senderArr[0]?.id : senderArr?.id;
      const receiverId = Array.isArray(receiverArr) ? receiverArr[0]?.id : receiverArr?.id;
      // Exclude gifts where the other party is blocked
      const otherPartyId = senderId === sessionId ? receiverId : senderId;
      return !blockedSet.has(otherPartyId);
    });

    // Transform the data
    const transformedGifts = filteredGifts.map((gift) => {
      // Supabase returns relations as arrays, get the first item
      const senderData = Array.isArray(gift.sender) ? gift.sender[0] : gift.sender;
      const receiverData = Array.isArray(gift.receiver) ? gift.receiver[0] : gift.receiver;
      const menuData = Array.isArray(gift.menu) ? gift.menu[0] : gift.menu;

      return {
        id: gift.id,
        amount: gift.amount,
        message: gift.message,
        status: gift.status,
        createdAt: gift.created_at,
        paidAt: gift.paid_at,
        menu: menuData,
        sender: senderData,
        receiver: receiverData,
        isSent: senderData?.id === sessionId,
      };
    });

    return NextResponse.json({ gifts: transformedGifts });
  } catch (error) {
    console.error('Error in gifts API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
