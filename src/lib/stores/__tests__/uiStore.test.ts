import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore, toast } from '../uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.setState({
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
    });
  });

  describe('setGlobalLoading', () => {
    it('should set loading state', () => {
      useUIStore.getState().setGlobalLoading(true);

      expect(useUIStore.getState().isGlobalLoading).toBe(true);
    });

    it('should set loading text', () => {
      useUIStore.getState().setGlobalLoading(true, 'Processing...');

      expect(useUIStore.getState().isGlobalLoading).toBe(true);
      expect(useUIStore.getState().loadingText).toBe('Processing...');
    });

    it('should clear loading text when loading is false', () => {
      useUIStore.getState().setGlobalLoading(true, 'Processing...');
      useUIStore.getState().setGlobalLoading(false);

      expect(useUIStore.getState().isGlobalLoading).toBe(false);
      expect(useUIStore.getState().loadingText).toBeNull();
    });
  });

  describe('modal', () => {
    it('should open modal with type', () => {
      useUIStore.getState().openModal('confirm');

      const modal = useUIStore.getState().modal;
      expect(modal.isOpen).toBe(true);
      expect(modal.type).toBe('confirm');
    });

    it('should open modal with data', () => {
      useUIStore.getState().openModal('gift', { userId: '123', amount: 1000 });

      const modal = useUIStore.getState().modal;
      expect(modal.isOpen).toBe(true);
      expect(modal.type).toBe('gift');
      expect(modal.data).toEqual({ userId: '123', amount: 1000 });
    });

    it('should close modal', () => {
      useUIStore.getState().openModal('confirm', { test: 'data' });
      useUIStore.getState().closeModal();

      const modal = useUIStore.getState().modal;
      expect(modal.isOpen).toBe(false);
      expect(modal.type).toBeNull();
      expect(modal.data).toBeUndefined();
    });
  });

  describe('toasts', () => {
    it('should add toast and return id', () => {
      const id = useUIStore.getState().addToast({
        type: 'success',
        message: 'Success!',
      });

      expect(id).toMatch(/^toast-/);
      expect(useUIStore.getState().toasts).toHaveLength(1);
      expect(useUIStore.getState().toasts[0]).toMatchObject({
        type: 'success',
        message: 'Success!',
      });
    });

    it('should set default duration of 3000', () => {
      useUIStore.getState().addToast({
        type: 'info',
        message: 'Info message',
      });

      expect(useUIStore.getState().toasts[0].duration).toBe(3000);
    });

    it('should use custom duration', () => {
      useUIStore.getState().addToast({
        type: 'info',
        message: 'Info message',
        duration: 5000,
      });

      expect(useUIStore.getState().toasts[0].duration).toBe(5000);
    });

    it('should remove toast by id', () => {
      const id1 = useUIStore.getState().addToast({ type: 'success', message: 'First' });
      useUIStore.getState().addToast({ type: 'error', message: 'Second' });

      useUIStore.getState().removeToast(id1);

      expect(useUIStore.getState().toasts).toHaveLength(1);
      expect(useUIStore.getState().toasts[0].message).toBe('Second');
    });

    it('should clear all toasts', () => {
      useUIStore.getState().addToast({ type: 'success', message: 'First' });
      useUIStore.getState().addToast({ type: 'error', message: 'Second' });

      useUIStore.getState().clearToasts();

      expect(useUIStore.getState().toasts).toHaveLength(0);
    });
  });

  describe('toast helpers', () => {
    it('toast.success should add success toast', () => {
      toast.success('Operation successful');

      const toasts = useUIStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('success');
      expect(toasts[0].message).toBe('Operation successful');
    });

    it('toast.error should add error toast with 5000ms duration', () => {
      toast.error('Something went wrong');

      const toasts = useUIStore.getState().toasts;
      expect(toasts[0].type).toBe('error');
      expect(toasts[0].duration).toBe(5000);
    });

    it('toast.warning should add warning toast', () => {
      toast.warning('Please be careful');

      const toasts = useUIStore.getState().toasts;
      expect(toasts[0].type).toBe('warning');
    });

    it('toast.info should add info toast', () => {
      toast.info('For your information');

      const toasts = useUIStore.getState().toasts;
      expect(toasts[0].type).toBe('info');
    });
  });

  describe('sidebar', () => {
    it('should toggle sidebar', () => {
      expect(useUIStore.getState().isSidebarOpen).toBe(false);

      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().isSidebarOpen).toBe(true);

      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().isSidebarOpen).toBe(false);
    });

    it('should set sidebar open state directly', () => {
      useUIStore.getState().setSidebarOpen(true);
      expect(useUIStore.getState().isSidebarOpen).toBe(true);

      useUIStore.getState().setSidebarOpen(false);
      expect(useUIStore.getState().isSidebarOpen).toBe(false);
    });
  });

  describe('theme', () => {
    it('should set theme', () => {
      expect(useUIStore.getState().theme).toBe('dark');

      useUIStore.getState().setTheme('light');
      expect(useUIStore.getState().theme).toBe('light');

      useUIStore.getState().setTheme('dark');
      expect(useUIStore.getState().theme).toBe('dark');
    });
  });
});
