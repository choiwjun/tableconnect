import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Toast } from '@/types/ui';

let toastIdCounter = 0;

interface ModalState {
  isOpen: boolean;
  type: string | null;
  data?: Record<string, unknown>;
}

interface UIState {
  // Loading states
  isGlobalLoading: boolean;
  loadingText: string | null;

  // Modal state
  modal: ModalState;

  // Toast notifications
  toasts: Toast[];

  // Sidebar/menu state
  isSidebarOpen: boolean;

  // Theme (for future use)
  theme: 'dark' | 'light';

  // Actions
  setGlobalLoading: (loading: boolean, text?: string) => void;
  openModal: (type: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      isGlobalLoading: false,
      loadingText: null,
      modal: {
        isOpen: false,
        type: null,
        data: undefined,
      },
      toasts: [],
      isSidebarOpen: false,
      theme: 'dark',

      setGlobalLoading: (loading, text) =>
        set(
          { isGlobalLoading: loading, loadingText: text || null },
          false,
          'setGlobalLoading'
        ),

      openModal: (type, data) =>
        set(
          {
            modal: {
              isOpen: true,
              type,
              data,
            },
          },
          false,
          'openModal'
        ),

      closeModal: () =>
        set(
          {
            modal: {
              isOpen: false,
              type: null,
              data: undefined,
            },
          },
          false,
          'closeModal'
        ),

      addToast: (toast) => {
        const id = `toast-${++toastIdCounter}`;
        set(
          (state) => ({
            toasts: [
              ...state.toasts,
              { ...toast, id, duration: toast.duration ?? 3000 },
            ],
          }),
          false,
          'addToast'
        );
        return id;
      },

      removeToast: (id) =>
        set(
          (state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
          }),
          false,
          'removeToast'
        ),

      clearToasts: () =>
        set({ toasts: [] }, false, 'clearToasts'),

      toggleSidebar: () =>
        set(
          (state) => ({ isSidebarOpen: !state.isSidebarOpen }),
          false,
          'toggleSidebar'
        ),

      setSidebarOpen: (open) =>
        set({ isSidebarOpen: open }, false, 'setSidebarOpen'),

      setTheme: (theme) =>
        set({ theme }, false, 'setTheme'),
    }),
    { name: 'UIStore' }
  )
);

// Toast helper functions using store directly
export const toast = {
  success: (message: string, duration?: number) =>
    useUIStore.getState().addToast({ type: 'success', message, duration }),
  error: (message: string, duration?: number) =>
    useUIStore.getState().addToast({ type: 'error', message, duration: duration ?? 5000 }),
  warning: (message: string, duration?: number) =>
    useUIStore.getState().addToast({ type: 'warning', message, duration }),
  info: (message: string, duration?: number) =>
    useUIStore.getState().addToast({ type: 'info', message, duration }),
};
