import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComplianceScorer } from '../../../src/core/scorer/ComplianceScorer.js';
import type { Violation } from '../../../src/config/types.js';

function makeViolation(overrides: Partial<Violation> = {}): Violation {
  return {
    id: 'v-1',
    conventionId: 'c-1',
    severity: 'medium',
    file: 'src/test.ts',
    message: 'Test violation',
    expected: 'PascalCase',
    found: 'camelCase',
    autoFixable: false,
    ...overrides,
  };
}

const { mockSave, mockGetHistory, mockClose } = vi.hoisted(() => ({
  mockSave: vi.fn().mockResolvedValue(undefined),
  mockGetHistory: vi.fn().mockResolvedValue([]),
  mockClose: vi.fn(),
}));

vi.mock('../../../src/storage/ScoreStore.js', () => ({
  ScoreStore: vi.fn().mockImplementation(() => ({
    save: mockSave,
    getHistory: mockGetHistory,
    close: mockClose,
  })),
}));

describe('ComplianceScorer', () => {
  let scorer: ComplianceScorer;

  beforeEach(() => {
    scorer = new ComplianceScorer();
    vi.clearAllMocks();
    mockGetHistory.mockResolvedValue([]);
  });

  describe('calculate', () => {
    it('should return 100 for no violations', () => {
      const score = scorer.calculate([]);
      expect(score.total).toBe(100);
      expect(score.violationCount).toBe(0);
      expect(score.breakdown).toEqual({ critical: 0, high: 0, medium: 0, low: 0 });
    });

    it('should deduct 15 for critical violations', () => {
      const score = scorer.calculate([makeViolation({ severity: 'critical' })]);
      expect(score.total).toBe(85);
      expect(score.breakdown.critical).toBe(1);
    });

    it('should deduct 8 for high violations', () => {
      const score = scorer.calculate([makeViolation({ severity: 'high' })]);
      expect(score.total).toBe(92);
      expect(score.breakdown.high).toBe(1);
    });

    it('should deduct 3 for medium violations', () => {
      const score = scorer.calculate([makeViolation({ severity: 'medium' })]);
      expect(score.total).toBe(97);
      expect(score.breakdown.medium).toBe(1);
    });

    it('should deduct 1 for low violations', () => {
      const score = scorer.calculate([makeViolation({ severity: 'low' })]);
      expect(score.total).toBe(99);
      expect(score.breakdown.low).toBe(1);
    });

    it('should never go below 0', () => {
      const violations = Array.from({ length: 20 }, (_, i) =>
        makeViolation({ id: `v-${i}`, severity: 'critical' }),
      );
      const score = scorer.calculate(violations);
      expect(score.total).toBe(0);
    });

    it('should accumulate deductions from mixed severities', () => {
      const violations = [
        makeViolation({ id: 'v-1', severity: 'critical' }),
        makeViolation({ id: 'v-2', severity: 'high' }),
        makeViolation({ id: 'v-3', severity: 'medium' }),
        makeViolation({ id: 'v-4', severity: 'low' }),
      ];
      const score = scorer.calculate(violations);
      expect(score.total).toBe(100 - 15 - 8 - 3 - 1);
      expect(score.violationCount).toBe(4);
    });

    it('should set threshold to 70', () => {
      const score = scorer.calculate([]);
      expect(score.threshold).toBe(70);
    });
  });

  describe('scoreAndPersist', () => {
    it('should calculate score and persist to store', async () => {
      const violations = [makeViolation({ severity: 'medium' })];
      const score = await scorer.scoreAndPersist(violations, '/tmp/test-project');

      expect(score.total).toBe(97);
      expect(mockSave).toHaveBeenCalledOnce();
      expect(mockClose).toHaveBeenCalledOnce();
    });

    it('should save a record with correct fields', async () => {
      await scorer.scoreAndPersist([makeViolation()], '/tmp/test-project');

      expect(mockSave).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          projectHash: expect.any(String),
          score: 97,
          breakdown: { critical: 0, high: 0, medium: 1, low: 0 },
          createdAt: expect.any(String),
        }),
      );
    });

    it('should determine trend from history', async () => {
      mockGetHistory.mockResolvedValueOnce([
        { id: '1', projectHash: 'abc', score: 60, breakdown: {}, createdAt: '2025-01-01' },
        { id: '2', projectHash: 'abc', score: 70, breakdown: {}, createdAt: '2025-01-08' },
        { id: '3', projectHash: 'abc', score: 80, breakdown: {}, createdAt: '2025-01-15' },
        { id: '4', projectHash: 'abc', score: 97, breakdown: {}, createdAt: '2025-01-22' },
      ]);

      const score = await scorer.scoreAndPersist([makeViolation()], '/tmp/test-project');
      expect(score.trend).toBe('improving');
    });

    it('should return stable trend for empty history', async () => {
      const score = await scorer.scoreAndPersist([], '/tmp/test-project');
      expect(score.trend).toBe('stable');
    });

    it('should close store even on error', async () => {
      mockSave.mockRejectedValueOnce(new Error('write failure'));
      await expect(scorer.scoreAndPersist([], '/tmp/test')).rejects.toThrow('write failure');
      expect(mockClose).toHaveBeenCalledOnce();
    });
  });

  describe('printReport', () => {
    it('should print report without errors', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const score = scorer.calculate([]);
      await scorer.printReport(score, []);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should print violations grouped by severity', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const violations = [
        makeViolation({ id: 'v-1', severity: 'critical' }),
        makeViolation({ id: 'v-2', severity: 'low' }),
      ];
      const score = scorer.calculate(violations);
      await scorer.printReport(score, violations);

      const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
      expect(output).toContain('CRITICAL');
      expect(output).toContain('LOW');
      consoleSpy.mockRestore();
    });

    it('should show auto-fixable hint for fixable violations', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const violations = [makeViolation({ autoFixable: true })];
      const score = scorer.calculate(violations);
      await scorer.printReport(score, violations);

      const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
      expect(output).toContain('Auto-fixable');
      consoleSpy.mockRestore();
    });
  });
});
