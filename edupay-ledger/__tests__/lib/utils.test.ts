/**
 * Utility Functions Tests
 */

import {
  cn,
  formatCurrency,
  formatDate,
  formatDateRange,
  calculatePercentage,
  truncateText,
  generateId,
  debounce,
  throttle,
  groupBy,
  sortBy,
} from '@/lib/utils';

describe('Utility Functions', () => {
  describe('cn (className merger)', () => {
    it('merges class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('handles conditional classes', () => {
      expect(cn('base', true && 'included', false && 'excluded')).toBe('base included');
    });

    it('handles tailwind merge conflicts', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });
  });

  describe('formatCurrency', () => {
    it('formats Ugandan Shillings correctly', () => {
      expect(formatCurrency(1500000)).toBe('UGX 1,500,000');
    });

    it('handles zero', () => {
      expect(formatCurrency(0)).toBe('UGX 0');
    });

    it('handles negative values', () => {
      expect(formatCurrency(-50000)).toBe('UGX -50,000');
    });

    it('handles decimal values', () => {
      // UGX typically doesn't use decimals, but function should handle them
      expect(formatCurrency(1500.50)).toMatch(/UGX 1,500/);
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2024-01-15T10:30:00');

    it('formats date with default format', () => {
      expect(formatDate(testDate)).toMatch(/Jan|January/);
    });

    it('formats date with custom format', () => {
      expect(formatDate(testDate, 'yyyy-MM-dd')).toBe('2024-01-15');
    });

    it('handles string dates', () => {
      expect(formatDate('2024-01-15')).toBeTruthy();
    });
  });

  describe('formatDateRange', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-03-31');

    it('formats date range correctly', () => {
      const result = formatDateRange(startDate, endDate);
      expect(result).toContain('Jan');
      expect(result).toContain('Mar');
    });
  });

  describe('calculatePercentage', () => {
    it('calculates percentage correctly', () => {
      expect(calculatePercentage(25, 100)).toBe(25);
      expect(calculatePercentage(1, 4)).toBe(25);
      expect(calculatePercentage(500000, 1500000)).toBeCloseTo(33.33, 1);
    });

    it('handles zero total', () => {
      expect(calculatePercentage(25, 0)).toBe(0);
    });

    it('handles zero value', () => {
      expect(calculatePercentage(0, 100)).toBe(0);
    });
  });

  describe('truncateText', () => {
    it('truncates long text', () => {
      const longText = 'This is a very long piece of text that should be truncated';
      expect(truncateText(longText, 20)).toBe('This is a very long...');
    });

    it('does not truncate short text', () => {
      const shortText = 'Short';
      expect(truncateText(shortText, 20)).toBe('Short');
    });

    it('handles exact length', () => {
      const exactText = 'Exactly 20 chars!!!';
      expect(truncateText(exactText, 19)).toBe('Exactly 20 chars...');
    });
  });

  describe('generateId', () => {
    it('generates unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('generates IDs of correct length', () => {
      const id = generateId();
      expect(id.length).toBeGreaterThan(0);
    });

    it('generates IDs with prefix', () => {
      const id = generateId('payment_');
      expect(id.startsWith('payment_')).toBe(true);
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    it('debounces function calls', () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 300);

      debouncedFunc();
      debouncedFunc();
      debouncedFunc();

      expect(func).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);

      expect(func).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    jest.useFakeTimers();

    it('throttles function calls', () => {
      const func = jest.fn();
      const throttledFunc = throttle(func, 300);

      throttledFunc();
      throttledFunc();
      throttledFunc();

      expect(func).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(300);
      throttledFunc();

      expect(func).toHaveBeenCalledTimes(2);
    });
  });

  describe('groupBy', () => {
    const items = [
      { category: 'A', value: 1 },
      { category: 'B', value: 2 },
      { category: 'A', value: 3 },
    ];

    it('groups items by key', () => {
      const grouped = groupBy(items, 'category');
      expect(grouped['A']).toHaveLength(2);
      expect(grouped['B']).toHaveLength(1);
    });
  });

  describe('sortBy', () => {
    const items = [
      { name: 'Charlie', age: 30 },
      { name: 'Alice', age: 25 },
      { name: 'Bob', age: 35 },
    ];

    it('sorts items by key ascending', () => {
      const sorted = sortBy(items, 'age', 'asc');
      expect(sorted[0].name).toBe('Alice');
      expect(sorted[2].name).toBe('Bob');
    });

    it('sorts items by key descending', () => {
      const sorted = sortBy(items, 'age', 'desc');
      expect(sorted[0].name).toBe('Bob');
      expect(sorted[2].name).toBe('Alice');
    });
  });
});
