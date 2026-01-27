/**
 * Utility Functions Tests
 */

import {
  cn,
  formatCurrency,
  formatUGX,
  formatDate,
  formatCompact,
  calculatePercentage,
  generateId,
  generateReceiptNumber,
  generatePaymentId,
  debounce,
  getInitials,
  isValidUgandaPhone,
  formatPhone,
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

  describe('formatCurrency / formatUGX', () => {
    it('formats Ugandan Shillings correctly', () => {
      expect(formatCurrency(1500000)).toMatch(/UGX.*1.*500.*000/);
    });

    it('handles zero', () => {
      expect(formatCurrency(0)).toMatch(/UGX.*0/);
    });

    it('formatUGX is the same as formatCurrency', () => {
      expect(formatUGX(1000)).toBe(formatCurrency(1000));
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2024-01-15T10:30:00');

    it('formats date with default format', () => {
      expect(formatDate(testDate)).toMatch(/Jan|January/);
    });

    it('handles string dates', () => {
      expect(formatDate('2024-01-15')).toBeTruthy();
    });
  });

  describe('formatCompact', () => {
    it('formats millions correctly', () => {
      expect(formatCompact(1500000)).toBe('1.5M');
    });

    it('formats thousands correctly', () => {
      expect(formatCompact(45000)).toBe('45K');
    });

    it('returns small numbers as-is', () => {
      expect(formatCompact(500)).toBe('500');
    });
  });

  describe('calculatePercentage', () => {
    it('calculates percentage correctly', () => {
      expect(calculatePercentage(25, 100)).toBe(25);
      expect(calculatePercentage(1, 4)).toBe(25);
      expect(calculatePercentage(500000, 1500000)).toBeCloseTo(33.3, 0);
    });

    it('handles zero total', () => {
      expect(calculatePercentage(25, 0)).toBe(0);
    });

    it('handles zero value', () => {
      expect(calculatePercentage(0, 100)).toBe(0);
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
      const id = generateId('PAY');
      expect(id.startsWith('PAY-')).toBe(true);
    });
  });

  describe('generateReceiptNumber', () => {
    it('generates receipt numbers with RCP prefix', () => {
      const receipt = generateReceiptNumber();
      expect(receipt.startsWith('RCP-')).toBe(true);
    });

    it('generates unique receipt numbers', () => {
      const r1 = generateReceiptNumber();
      const r2 = generateReceiptNumber();
      expect(r1).not.toBe(r2);
    });
  });

  describe('generatePaymentId', () => {
    it('generates payment IDs with PAY prefix', () => {
      const paymentId = generatePaymentId();
      expect(paymentId.startsWith('PAY-')).toBe(true);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

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

  describe('getInitials', () => {
    it('gets initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD');
    });

    it('handles single name', () => {
      expect(getInitials('John')).toBe('J');
    });

    it('handles multiple names (max 2 initials)', () => {
      expect(getInitials('John Paul Doe')).toBe('JP');
    });
  });

  describe('isValidUgandaPhone', () => {
    it('validates +256 format', () => {
      expect(isValidUgandaPhone('+256700123456')).toBe(true);
    });

    it('validates 0 format', () => {
      expect(isValidUgandaPhone('0700123456')).toBe(true);
    });

    it('rejects invalid numbers', () => {
      expect(isValidUgandaPhone('12345')).toBe(false);
    });
  });

  describe('formatPhone', () => {
    it('formats +256 numbers', () => {
      const formatted = formatPhone('+256700123456');
      expect(formatted).toContain('+256');
    });

    it('formats 0xx numbers', () => {
      const formatted = formatPhone('0700123456');
      expect(formatted.length).toBeGreaterThan(10);
    });
  });
});
