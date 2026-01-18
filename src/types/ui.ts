/**
 * UI Component Types
 */

import type { Session, Message, Menu, Gift } from './database';

// ============================================
// Common UI Types
// ============================================
export type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type Size = 'sm' | 'md' | 'lg';

// ============================================
// Button
// ============================================
export interface ButtonProps {
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

// ============================================
// Input
// ============================================
export interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  error?: string;
  maxLength?: number;
  className?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

// ============================================
// Card
// ============================================
export interface CardProps {
  variant?: 'default' | 'glow';
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

// ============================================
// Message Bubble
// ============================================
export interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  senderNickname?: string;
  showTimestamp?: boolean;
}

// ============================================
// Chat Room
// ============================================
export interface ChatRoomProps {
  currentSessionId: string;
  partnerSessionId: string;
  partnerNickname: string;
  partnerTableNumber: number;
}

export interface ChatMessage extends Message {
  senderNickname: string;
  isMine: boolean;
}

// ============================================
// Table Card
// ============================================
export interface TableCardProps {
  session: Pick<Session, 'id' | 'table_number' | 'nickname'>;
  isSelected?: boolean;
  onClick?: () => void;
}

// ============================================
// Menu Card
// ============================================
export interface MenuCardProps {
  menu: Menu;
  isSelected?: boolean;
  onClick?: () => void;
}

// ============================================
// Gift Notification
// ============================================
export interface GiftNotificationProps {
  gift: Gift;
  menuName: string;
  senderNickname: string;
  senderTableNumber: number;
  onClose: () => void;
  onThankYou?: () => void;
}

// ============================================
// Nickname Form
// ============================================
export interface NicknameFormProps {
  onSubmit: (nickname: string) => void;
  loading?: boolean;
  error?: string;
}

// ============================================
// Modal
// ============================================
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

// ============================================
// Toast / Notification
// ============================================
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

// ============================================
// Loading States
// ============================================
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// ============================================
// Form States
// ============================================
export interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

// ============================================
// Report Modal
// ============================================
export interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSessionId: string;
  messageId?: string;
  onSubmit: (reason: string, description?: string) => void;
}

// ============================================
// Block Button
// ============================================
export interface BlockButtonProps {
  targetSessionId: string;
  isBlocked: boolean;
  onBlock: () => void;
  onUnblock: () => void;
}

// ============================================
// Payment Form
// ============================================
export interface PaymentFormProps {
  amount: number;
  menuName: string;
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

// ============================================
// Navigation / Layout
// ============================================
export interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export interface ContainerProps {
  className?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: boolean;
}
