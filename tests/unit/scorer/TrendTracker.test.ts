import { describe, it, expect, beforeEach } from 'vitest';
import { TrendTracker } from '../../../src/core/scorer/TrendTracker.js';
import type { ScoreRecord } from '../../../src/config/types.js';

function makeRecord(score: number, date: string): ScoreRecord {
  return {
    id: `test-${date}`,
    projectHash: 'abc123',
    score,
    breakdown: {},
    createdAt: date,
  };
}

describe('TrendTracker', () => {
  let tracker: TrendTracker;

  beforeEach(() => {
    tracker = new TrendTracker();
  });

  describe('computeTrend', () => {
    it('should return stable for empty history', () => {
      expect(tracker.computeTrend([])).toBe('stable');
    });

    it('should return stable for single data point', () => {
      expect(tracker.computeTrend([makeRecord(80, '2025-01-01')])).toBe('stable');
    });

    it('should return improving for steadily increasing scores', () => {
      const history = [
        makeRecord(60, '2025-01-01'),
        makeRecord(65, '2025-01-08'),
        makeRecord(72, '2025-01-15'),
        makeRecord(80, '2025-01-22'),
        makeRecord(85, '2025-01-29'),
      ];
      expect(tracker.computeTrend(history)).toBe('improving');
    });

    it('should return declining for steadily decreasing scores', () => {
      const history = [
        makeRecord(90, '2025-01-01'),
        makeRecord(82, '2025-01-08'),
        makeRecord(75, '2025-01-15'),
        makeRecord(68, '2025-01-22'),
        makeRecord(60, '2025-01-29'),
      ];
      expect(tracker.computeTrend(history)).toBe('declining');
    });

    it('should return stable for flat scores', () => {
      const history = [
        makeRecord(80, '2025-01-01'),
        makeRecord(80, '2025-01-08'),
        makeRecord(81, '2025-01-15'),
        makeRecord(80, '2025-01-22'),
      ];
      expect(tracker.computeTrend(history)).toBe('stable');
    });

    it('should only use last 8 data points', () => {
      const history = [
        makeRecord(100, '2025-01-01'),
        makeRecord(100, '2025-01-08'),
        makeRecord(90, '2025-01-15'),
        makeRecord(85, '2025-01-22'),
        makeRecord(78, '2025-01-29'),
        makeRecord(72, '2025-02-05'),
        makeRecord(65, '2025-02-12'),
        makeRecord(58, '2025-02-19'),
        makeRecord(50, '2025-02-26'),
        makeRecord(42, '2025-03-05'),
      ];
      expect(tracker.computeTrend(history)).toBe('declining');
    });

    it('should handle two-point edge case', () => {
      const history = [
        makeRecord(50, '2025-01-01'),
        makeRecord(90, '2025-01-08'),
      ];
      expect(tracker.computeTrend(history)).toBe('improving');
    });

    it('should handle equal scores as stable', () => {
      const history = [
        makeRecord(75, '2025-01-01'),
        makeRecord(75, '2025-01-08'),
        makeRecord(75, '2025-01-15'),
      ];
      expect(tracker.computeTrend(history)).toBe('stable');
    });
  });

  describe('renderTrendChart', () => {
    it('should return message for empty history', () => {
      expect(tracker.renderTrendChart([])).toBe('No score history available.');
    });

    it('should render ASCII bars with dates and scores', () => {
      const history = [
        makeRecord(80, '2025-01-01T00:00:00.000Z'),
        makeRecord(90, '2025-01-08T00:00:00.000Z'),
      ];
      const chart = tracker.renderTrendChart(history);

      expect(chart).toContain('2025-01-01');
      expect(chart).toContain('2025-01-08');
      expect(chart).toContain('80');
      expect(chart).toContain('90');
      expect(chart).toContain('\u2588');
      expect(chart).toContain('\u2502');
    });

    it('should limit output to 12 entries', () => {
      const history = Array.from({ length: 20 }, (_, i) =>
        makeRecord(50 + i, `2025-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`),
      );
      const chart = tracker.renderTrendChart(history);
      const lines = chart.split('\n');
      expect(lines.length).toBe(12);
    });

    it('should render wider bar for higher scores', () => {
      const history = [
        makeRecord(20, '2025-01-01T00:00:00.000Z'),
        makeRecord(100, '2025-01-08T00:00:00.000Z'),
      ];
      const chart = tracker.renderTrendChart(history);
      const lines = chart.split('\n');

      const filledCount = (line: string) => (line.match(/\u2588/g) ?? []).length;
      expect(filledCount(lines[1])).toBeGreaterThan(filledCount(lines[0]));
    });
  });
});
