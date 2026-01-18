import { http, HttpResponse } from 'msw';

// Mock data
const mockSession = {
  id: 'session-123',
  merchant_id: 'merchant-456',
  table_number: 5,
  nickname: 'TestUser',
  is_active: true,
  created_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
};

const mockMessages = [
  {
    id: 'msg-1',
    sender_session_id: 'session-123',
    receiver_session_id: 'session-456',
    content: 'Hello!',
    is_read: false,
    created_at: new Date(Date.now() - 60000).toISOString(),
  },
  {
    id: 'msg-2',
    sender_session_id: 'session-456',
    receiver_session_id: 'session-123',
    content: 'Hi there!',
    is_read: true,
    created_at: new Date().toISOString(),
  },
];

const mockMenus = [
  {
    id: 'menu-1',
    merchant_id: 'merchant-456',
    name: 'ビール',
    description: '生ビール',
    price: 500,
    image_url: null,
    category: 'ドリンク',
    is_available: true,
    sort_order: 1,
  },
  {
    id: 'menu-2',
    merchant_id: 'merchant-456',
    name: '枝豆',
    description: '塩茹で枝豆',
    price: 300,
    image_url: null,
    category: 'おつまみ',
    is_available: true,
    sort_order: 2,
  },
];

export const handlers = [
  // Session APIs
  http.post('/api/sessions', async ({ request }) => {
    const body = await request.json() as { merchantId: string; tableNumber: number };
    return HttpResponse.json({
      session: {
        ...mockSession,
        merchant_id: body.merchantId,
        table_number: body.tableNumber,
      },
    }, { status: 201 });
  }),

  http.get('/api/sessions/:sessionId', ({ params }) => {
    const { sessionId } = params;
    if (sessionId === 'invalid') {
      return HttpResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    return HttpResponse.json({
      session: { ...mockSession, id: sessionId },
    });
  }),

  http.post('/api/sessions/:sessionId/join', async ({ params, request }) => {
    const { sessionId } = params;
    const body = await request.json() as { nickname: string };
    return HttpResponse.json({
      session: {
        ...mockSession,
        id: sessionId,
        nickname: body.nickname,
      },
    });
  }),

  // Messages APIs
  http.get('/api/messages', ({ request }) => {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    const partnerId = url.searchParams.get('partnerId');

    if (!sessionId || !partnerId) {
      return HttpResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    return HttpResponse.json({ messages: mockMessages });
  }),

  http.post('/api/messages', async ({ request }) => {
    const body = await request.json() as {
      senderSessionId: string;
      receiverSessionId: string;
      content: string;
    };

    if (!body.content || body.content.length > 500) {
      return HttpResponse.json({ error: 'Invalid message content' }, { status: 400 });
    }

    const newMessage = {
      id: `msg-${Date.now()}`,
      sender_session_id: body.senderSessionId,
      receiver_session_id: body.receiverSessionId,
      content: body.content,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    return HttpResponse.json({ message: newMessage }, { status: 201 });
  }),

  // Menus API
  http.get('/api/merchants/:merchantId/menus', ({ params }) => {
    const { merchantId } = params;
    return HttpResponse.json({
      menus: mockMenus.map(m => ({ ...m, merchant_id: merchantId })),
    });
  }),

  // Gifts API
  http.post('/api/gifts', async ({ request }) => {
    const body = await request.json() as {
      senderSessionId: string;
      receiverSessionId: string;
      menuId: string;
      message?: string;
      paymentIntentId: string;
    };

    const gift = {
      id: `gift-${Date.now()}`,
      sender_session_id: body.senderSessionId,
      receiver_session_id: body.receiverSessionId,
      menu_id: body.menuId,
      message: body.message || null,
      status: 'completed',
      stripe_payment_intent_id: body.paymentIntentId,
      created_at: new Date().toISOString(),
    };

    return HttpResponse.json({ gift }, { status: 201 });
  }),

  http.get('/api/gifts', ({ request }) => {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id');

    if (!sessionId) {
      return HttpResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    return HttpResponse.json({
      gifts: [
        {
          id: 'gift-1',
          sender_session_id: sessionId,
          receiver_session_id: 'session-other',
          menu_id: 'menu-1',
          amount: 500,
          message: 'Thank you!',
          status: 'completed',
          created_at: new Date().toISOString(),
        },
      ],
    });
  }),

  // Blocks API
  http.post('/api/blocks', async ({ request }) => {
    const body = await request.json() as {
      blockerSessionId: string;
      blockedSessionId: string;
    };

    return HttpResponse.json({
      block: {
        id: `block-${Date.now()}`,
        blocker_session_id: body.blockerSessionId,
        blocked_session_id: body.blockedSessionId,
        created_at: new Date().toISOString(),
      },
    }, { status: 201 });
  }),

  http.get('/api/blocks', ({ request }) => {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return HttpResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    return HttpResponse.json({ blocks: [] });
  }),

  // Reports API
  http.post('/api/reports', async ({ request }) => {
    const body = await request.json() as {
      reporterSessionId: string;
      reportedSessionId: string;
      reason: string;
      description?: string;
    };

    return HttpResponse.json({
      report: {
        id: `report-${Date.now()}`,
        reporter_session_id: body.reporterSessionId,
        reported_session_id: body.reportedSessionId,
        reason: body.reason,
        description: body.description || null,
        status: 'pending',
        created_at: new Date().toISOString(),
      },
    }, { status: 201 });
  }),

  // Tables API
  http.get('/api/tables', ({ request }) => {
    const url = new URL(request.url);
    const merchantId = url.searchParams.get('merchantId');
    const excludeSessionId = url.searchParams.get('excludeSessionId');

    if (!merchantId) {
      return HttpResponse.json({ error: 'Merchant ID required' }, { status: 400 });
    }

    return HttpResponse.json({
      tables: [
        {
          id: 'session-other-1',
          table_number: 3,
          nickname: 'Guest A',
        },
        {
          id: 'session-other-2',
          table_number: 7,
          nickname: 'Guest B',
        },
      ].filter(t => t.id !== excludeSessionId),
    });
  }),
];
