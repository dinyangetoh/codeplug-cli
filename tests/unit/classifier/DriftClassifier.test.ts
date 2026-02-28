import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DriftClassifier } from '../../../src/core/classifier/DriftClassifier.js';
import type { Convention } from '../../../src/config/types.js';

function makeConvention(overrides: Partial<Convention> = {}): Convention {
  return {
    id: 'test-1',
    dimension: 'naming',
    rule: 'Use camelCase for variables and functions',
    confidence: 0.9,
    confirmed: true,
    examples: ['getUserName', 'fetchData', 'handleClick'],
    severity: 'medium',
    ...overrides,
  };
}

function makeDiff(file: string, addedLines: string[]): string {
  const additions = addedLines.map((l) => `+${l}`).join('\n');
  return [
    `diff --git a/${file} b/${file}`,
    'index abc1234..def5678 100644',
    `--- a/${file}`,
    `+++ b/${file}`,
    '@@ -1,3 +1,5 @@',
    additions,
  ].join('\n');
}

describe('DriftClassifier', () => {
  let classifier: DriftClassifier;

  beforeEach(() => {
    classifier = new DriftClassifier();
  });

  describe('classifyDiff', () => {
    it('should return empty results for empty diff', async () => {
      const conventions = [makeConvention()];
      const results = await classifier.classifyDiff('', conventions);
      expect(results).toEqual([]);
    });

    it('should return empty results when no conventions are confirmed', async () => {
      const conventions = [makeConvention({ confirmed: false })];
      const diff = makeDiff('src/utils.ts', ['const my_bad_var = 1;']);
      const results = await classifier.classifyDiff(diff, conventions);
      expect(results).toEqual([]);
    });

    it('should detect naming drift with snake_case in a camelCase codebase', async () => {
      const conventions = [makeConvention()];
      const diff = makeDiff('src/utils.ts', [
        'const user_name = "alice";',
        'function get_user_data() {',
        '  return user_name;',
        '}',
      ]);

      const results = await classifier.classifyDiff(diff, conventions);
      expect(results.length).toBeGreaterThan(0);

      const drift = results[0];
      expect(drift.file).toBe('src/utils.ts');
      expect(drift.conventionId).toBe('test-1');
      expect(['drifting', 'ambiguous']).toContain(drift.classification);
      expect(drift.confidence).toBeGreaterThan(0);
    });

    it('should not flag correct camelCase naming', async () => {
      const conventions = [makeConvention()];
      const diff = makeDiff('src/utils.ts', [
        'const userName = "alice";',
        'function getUserData() {',
        '  return userName;',
        '}',
      ]);

      const results = await classifier.classifyDiff(diff, conventions);
      expect(results).toEqual([]);
    });

    it('should detect PascalCase naming drift', async () => {
      const conventions = [
        makeConvention({
          id: 'pascal-1',
          rule: 'Use PascalCase for class and component names',
          examples: ['UserProfile', 'AuthModal'],
        }),
      ];

      const diff = makeDiff('src/components/myComponent.ts', [
        'class userProfile {',
        '  constructor() {}',
        '}',
      ]);

      const results = await classifier.classifyDiff(diff, conventions);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].classification).not.toBe('following');
    });

    it('should detect default export drift when named exports expected', async () => {
      const conventions = [
        makeConvention({
          id: 'struct-1',
          dimension: 'structure',
          rule: 'Use named exports instead of default export',
          examples: ['export const foo = 1;', 'export function bar() {}'],
        }),
      ];

      const diff = makeDiff('src/utils.ts', [
        'export default function main() {',
        '  return "hello";',
        '}',
      ]);

      const results = await classifier.classifyDiff(diff, conventions);
      expect(results.length).toBe(1);
      expect(results[0].classification).toBe('drifting');
    });

    it('should handle import type convention checks', async () => {
      const conventions = [
        makeConvention({
          id: 'import-1',
          dimension: 'imports',
          rule: 'Use import type for type-only imports',
          examples: ["import type { Foo } from './foo';"],
        }),
      ];

      const diff = makeDiff('src/index.ts', [
        "import { SomeType } from './types';",
        'const x: type = {};',
      ]);

      const results = await classifier.classifyDiff(diff, conventions);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].dimension).toBe('imports');
    });

    it('should check multiple conventions against the same diff', async () => {
      const conventions = [
        makeConvention({ id: 'naming-1' }),
        makeConvention({
          id: 'struct-1',
          dimension: 'structure',
          rule: 'Use named exports instead of default export',
        }),
      ];

      const diff = makeDiff('src/foo.ts', [
        'const bad_name = 1;',
        'export default function bad_func() {}',
      ]);

      const results = await classifier.classifyDiff(diff, conventions);
      expect(results.length).toBe(2);
      const ids = results.map((r) => r.conventionId);
      expect(ids).toContain('naming-1');
      expect(ids).toContain('struct-1');
    });

    it('should skip dimensions without a matcher', async () => {
      const conventions = [
        makeConvention({
          id: 'state-1',
          dimension: 'state',
          rule: 'Use zustand for state management',
        }),
      ];

      const diff = makeDiff('src/store.ts', ['const store = createStore();']);
      const results = await classifier.classifyDiff(diff, conventions);
      expect(results).toEqual([]);
    });
  });

  describe('checkRecentCommits', () => {
    it('should handle non-git repositories gracefully', async () => {
      vi.doMock('../../../src/core/git/GitIntegration.js', () => ({
        GitIntegration: class {
          async isGitRepo() {
            return false;
          }
        },
      }));

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await classifier.checkRecentCommits([makeConvention()]);
      consoleSpy.mockRestore();
    });
  });
});
