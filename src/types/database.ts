/**
 * Database Schema Types
 * Based on Database Design document
 */

// ============================================
// Merchant (가맹점)
// ============================================
export interface Merchant {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  business_hours: BusinessHours | null;
  settings: MerchantSettings;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

export interface DayHours {
  open: string;  // "18:00"
  close: string; // "02:00"
  closed?: boolean;
}

export interface MerchantSettings {
  fee_rate?: number;        // 수수료율 (0.15 = 15%)
  currency?: string;        // "JPY"
  timezone?: string;        // "Asia/Tokyo"
  max_tables?: number;      // 최대 테이블 수
  session_ttl_hours?: number; // 세션 만료 시간 (기본 2시간)
}

// ============================================
// Session (세션)
// ============================================
export type Gender = 'male' | 'female';
export type AgeRange = '20s_early' | '20s_mid' | '20s_late' | '30s_early' | '30s_mid' | '30s_late' | '40s';

export interface Session {
  id: string;
  merchant_id: string;
  table_number: number;
  nickname: string | null;
  gender: Gender | null;      // New field
  age_range: AgeRange | null;   // New field
  party_size: number | null;    // New field
  is_active: boolean;
  created_at: string;
  expires_at: string;
}

export interface SessionWithMerchant extends Session {
  merchant: Pick<Merchant, 'id' | 'name' | 'slug'>;
}

// ============================================
// Menu (메뉴)
// ============================================
export interface Menu {
  id: string;
  merchant_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  is_available: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// Message (메시지)
// ============================================
export interface Message {
  id: string;
  sender_session_id: string;
  receiver_session_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface MessageWithSender extends Message {
  sender: Pick<Session, 'id' | 'nickname' | 'table_number'>;
}

// ============================================
// Gift (선물)
// ============================================
export interface Gift {
  id: string;
  sender_session_id: string;
  receiver_session_id: string;
  menu_id: string | null;
  amount: number;
  message: string | null;
  status: GiftStatus;
  stripe_payment_intent_id: string | null;
  created_at: string;
}

export type GiftStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface GiftWithDetails extends Gift {
  sender: Pick<Session, 'id' | 'nickname' | 'table_number'>;
  receiver: Pick<Session, 'id' | 'nickname' | 'table_number'>;
  menu: Pick<Menu, 'id' | 'name' | 'price' | 'image_url'> | null;
}

// ============================================
// Settlement (정산)
// ============================================
export interface Settlement {
  id: string;
  merchant_id: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  fee_amount: number;
  net_amount: number;
  status: SettlementStatus;
  paid_at: string | null;
  created_at: string;
}

export type SettlementStatus = 'pending' | 'processing' | 'completed' | 'failed';

// ============================================
// Report (신고)
// ============================================
export interface Report {
  id: string;
  reporter_session_id: string;
  reported_session_id: string;
  message_id: string | null;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
}

export type ReportReason =
  | 'harassment'
  | 'inappropriate_content'
  | 'spam'
  | 'impersonation'
  | 'other';

export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';

// ============================================
// Block (차단)
// ============================================
export interface Block {
  id: string;
  blocker_session_id: string;
  blocked_session_id: string;
  created_at: string;
}

// ============================================
// Database Tables (Supabase 타입)
// ============================================
export interface Database {
  public: {
    Tables: {
      merchants: {
        Row: Merchant;
        Insert: Omit<Merchant, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Merchant, 'id' | 'created_at'>>;
      };
      menus: {
        Row: Menu;
        Insert: Omit<Menu, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Menu, 'id' | 'created_at'>>;
      };
      sessions: {
        Row: Session;
        Insert: Omit<Session, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Session, 'id' | 'created_at'>>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Message, 'id' | 'created_at'>>;
      };
      gifts: {
        Row: Gift;
        Insert: Omit<Gift, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Gift, 'id' | 'created_at'>>;
      };
      settlements: {
        Row: Settlement;
        Insert: Omit<Settlement, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Settlement, 'id' | 'created_at'>>;
      };
      reports: {
        Row: Report;
        Insert: Omit<Report, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Report, 'id' | 'created_at'>>;
      };
      blocks: {
        Row: Block;
        Insert: Omit<Block, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Block, 'id' | 'created_at'>>;
      };
    };
  };
}
