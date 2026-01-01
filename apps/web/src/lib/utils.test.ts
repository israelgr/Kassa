import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, formatDate } from './utils';

describe('cn()', () => {
  it('should merge class names correctly', () => {
    const result = cn('text-red-500', 'bg-blue-500');
    expect(result).toBe('text-red-500 bg-blue-500');
  });

  it('should handle empty inputs', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
    expect(cn(undefined)).toBe('');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('base', isActive && 'active');
    expect(result).toBe('base active');
  });

  it('should deduplicate Tailwind classes', () => {
    const result = cn('p-4', 'p-2');
    expect(result).toBe('p-2');
  });

  it('should handle arrays of classes', () => {
    const result = cn(['text-lg', 'font-bold']);
    expect(result).toBe('text-lg font-bold');
  });

  it('should handle object syntax', () => {
    const result = cn({ 'text-red-500': true, 'bg-blue-500': false });
    expect(result).toBe('text-red-500');
  });
});

describe('formatCurrency()', () => {
  it('should format positive amounts with $ symbol', () => {
    expect(formatCurrency(50)).toBe('$50.00');
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('should format zero correctly as $0.00', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('should format decimal amounts correctly', () => {
    expect(formatCurrency(19.99)).toBe('$19.99');
    expect(formatCurrency(0.5)).toBe('$0.50');
  });

  it('should format large numbers with commas', () => {
    expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    expect(formatCurrency(123456.78)).toBe('$123,456.78');
  });

  it('should handle negative amounts', () => {
    const result = formatCurrency(-50);
    expect(result).toBe('-$50.00');
  });
});

describe('formatDate()', () => {
  it('should format ISO date string to readable format', () => {
    const result = formatDate('2024-01-15T10:30:00Z');
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2024/);
  });

  it('should include time in output', () => {
    const result = formatDate('2024-01-15T14:30:00Z');
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it('should handle different date formats', () => {
    const result = formatDate('2024-06-20T08:00:00.000Z');
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/20/);
  });
});
