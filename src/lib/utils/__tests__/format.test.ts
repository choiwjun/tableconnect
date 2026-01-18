import { describe, it, expect } from 'vitest';
import {
  formatPrice,
  formatDate,
  formatTime,
  formatRelativeTime,
  formatTableNumber,
  truncateText,
} from '../format';

describe('formatPrice', () => {
  it('should format price in JPY', () => {
    // Note: Intl.NumberFormat may use ￥ (fullwidth) or ¥ depending on environment
    expect(formatPrice(1000)).toMatch(/[¥￥]1,000/);
    expect(formatPrice(500)).toMatch(/[¥￥]500/);
    expect(formatPrice(12345)).toMatch(/[¥￥]12,345/);
  });

  it('should handle zero', () => {
    expect(formatPrice(0)).toMatch(/[¥￥]0/);
  });

  it('should handle large numbers', () => {
    expect(formatPrice(1000000)).toMatch(/[¥￥]1,000,000/);
  });
});

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-03-15');
    const result = formatDate(date);
    expect(result).toContain('2024');
    expect(result).toContain('3');
    expect(result).toContain('15');
  });

  it('should accept string input', () => {
    const result = formatDate('2024-03-15');
    expect(result).toContain('2024');
  });
});

describe('formatTime', () => {
  it('should format time in 24-hour format', () => {
    const date = new Date('2024-03-15T14:30:00');
    const result = formatTime(date);
    expect(result).toBe('14:30');
  });

  it('should handle single digit hours', () => {
    const date = new Date('2024-03-15T09:05:00');
    const result = formatTime(date);
    // May be '9:05' or '09:05' depending on environment
    expect(result).toMatch(/0?9:05/);
  });
});

describe('formatRelativeTime', () => {
  it('should return "たった今" for very recent times', () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe('たった今');
  });

  it('should return minutes ago', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinutesAgo)).toBe('5分前');
  });

  it('should return hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoHoursAgo)).toBe('2時間前');
  });

  it('should return days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(threeDaysAgo)).toBe('3日前');
  });
});

describe('formatTableNumber', () => {
  it('should pad single digit numbers', () => {
    expect(formatTableNumber(1)).toBe('01');
    expect(formatTableNumber(9)).toBe('09');
  });

  it('should not pad double digit numbers', () => {
    expect(formatTableNumber(10)).toBe('10');
    expect(formatTableNumber(99)).toBe('99');
  });
});

describe('truncateText', () => {
  it('should not truncate short text', () => {
    expect(truncateText('Hello', 10)).toBe('Hello');
  });

  it('should truncate long text with ellipsis', () => {
    expect(truncateText('Hello World', 8)).toBe('Hello W…');
  });

  it('should handle exact length', () => {
    expect(truncateText('Hello', 5)).toBe('Hello');
  });
});
