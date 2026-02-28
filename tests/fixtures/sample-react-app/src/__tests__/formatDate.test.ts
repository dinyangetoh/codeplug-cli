import { formatDate } from '../utils/formatDate';

describe('formatDate', () => {
  it('should format a date', () => {
    const d = new Date('2026-01-15');
    expect(formatDate(d)).toBe('1/15/2026');
  });

  it('should handle undefined', () => {
    expect(formatDate(undefined)).toBe('Unknown');
  });
});
