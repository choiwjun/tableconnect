/**
 * API Request/Response Types
 */

import type {
  Session,
  Message,
  Gift,
  Menu,
  Report,
  ReportReason,
} from './database';

// ============================================
// Common API Response
// ============================================
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// ============================================
// Session API
// ============================================

// POST /api/sessions
export interface CreateSessionRequest {
  merchant_id: string;
  table_number: number;
}

export interface CreateSessionResponse {
  session: Session;
}

// GET /api/sessions/[id]
export interface GetSessionResponse {
  session: Session;
  is_valid: boolean;
}

// POST /api/sessions/[id]/join
export interface JoinSessionRequest {
  nickname: string;
}

export interface JoinSessionResponse {
  session: Session;
}

// GET /api/sessions/[id]/tables
export interface ActiveTable {
  session_id: string;
  table_number: number;
  nickname: string | null;
  joined_at: string;
}

export interface GetActiveTablesResponse {
  tables: ActiveTable[];
}

// ============================================
// Message API
// ============================================

// POST /api/messages
export interface SendMessageRequest {
  sender_session_id: string;
  receiver_session_id: string;
  content: string;
}

export interface SendMessageResponse {
  message: Message;
}

// GET /api/messages
export interface GetMessagesQuery {
  session_id: string;
  partner_session_id?: string;
  page?: number;
  limit?: number;
}

export type GetMessagesResponse = PaginatedResponse<Message>;

// ============================================
// Menu API
// ============================================

// GET /api/merchants/[id]/menus
export interface GetMenusResponse {
  menus: Menu[];
}

// ============================================
// Gift API
// ============================================

// POST /api/gifts
export interface CreateGiftRequest {
  sender_session_id: string;
  receiver_session_id: string;
  menu_id: string;
  message?: string;
}

export interface CreateGiftResponse {
  gift: Gift;
  client_secret: string; // Stripe PaymentIntent client_secret
}

// GET /api/gifts
export interface GetGiftsQuery {
  session_id: string;
  type?: 'sent' | 'received' | 'all';
  page?: number;
  limit?: number;
}

export type GetGiftsResponse = PaginatedResponse<Gift>;

// POST /api/gifts/[id]/complete
export interface CompleteGiftRequest {
  payment_intent_id: string;
}

export interface CompleteGiftResponse {
  gift: Gift;
}

// ============================================
// Payment API
// ============================================

// POST /api/payments/intent
export interface CreatePaymentIntentRequest {
  amount: number;
  menu_id: string;
  sender_session_id: string;
  receiver_session_id: string;
}

export interface CreatePaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
}

// POST /api/webhooks/stripe
export interface StripeWebhookEvent {
  type: string;
  data: {
    object: {
      id: string;
      status: string;
      metadata?: Record<string, string>;
    };
  };
}

// ============================================
// Block API
// ============================================

// POST /api/blocks
export interface CreateBlockRequest {
  blocker_session_id: string;
  blocked_session_id: string;
}

export interface CreateBlockResponse {
  success: boolean;
}

// DELETE /api/blocks/[id]
export interface DeleteBlockResponse {
  success: boolean;
}

// ============================================
// Report API
// ============================================

// POST /api/reports
export interface CreateReportRequest {
  reporter_session_id: string;
  reported_session_id: string;
  message_id?: string;
  reason: ReportReason;
  description?: string;
}

export interface CreateReportResponse {
  report: Report;
}

// ============================================
// Admin API
// ============================================

// GET /api/admin/settlements
export interface GetSettlementsQuery {
  merchant_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

// GET /api/admin/reports
export interface GetReportsQuery {
  status?: string;
  reason?: ReportReason;
  page?: number;
  limit?: number;
}

// PATCH /api/admin/reports/[id]
export interface UpdateReportRequest {
  status: 'reviewing' | 'resolved' | 'dismissed';
  admin_note?: string;
}

// ============================================
// Moderation API
// ============================================

export interface ModerationResult {
  flagged: boolean;
  categories: {
    hate: boolean;
    harassment: boolean;
    'self-harm': boolean;
    sexual: boolean;
    violence: boolean;
  };
  category_scores: Record<string, number>;
}
