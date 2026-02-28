import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AutoFixer } from '../../../src/core/scorer/AutoFixer.js';
import type { Violation } from '../../../src/config/types.js';

function makeViolation(overrides: Partial<Violation> = {}): Violation {
  return {
    id: 'v-1',
    conventionId: 'c-1',
    severity: 'medium',
    file: 'src/auth_helper.ts',
    message: 'Violates: Utility files use camelCase',
    expected: 'authHelper.ts',
    found: 'auth_helper.ts',
    autoFixable: true,
    ...overrides,
  };
}

const { mockExists, mockLoad, mockSave } = vi.hoisted(() => ({
  mockExists: vi.fn().mockResolvedValue(true),
  mockLoad: vi.fn().mockResolvedValue([]),
  mockSave: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../src/storage/ViolationStore.js', () => ({
  ViolationStore: vi.fn().mockImplementation(() => ({
    exists: mockExists,
    load: mockLoad,
    save: mockSave,
  })),
}));

const mockRename = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return { ...actual, rename: mockRename };
});

const mockExistsSync = vi.hoisted(() => vi.fn().mockReturnValue(true));
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return { ...actual, existsSync: mockExistsSync };
});

describe('AutoFixer', () => {
  let fixer: AutoFixer;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fixer = new AutoFixer('/tmp/test-project');
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.clearAllMocks();
    mockExists.mockResolvedValue(true);
    mockLoad.mockResolvedValue([]);
    mockExistsSync.mockReturnValue(true);
    mockRename.mockResolvedValue(undefined);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('fixById', () => {
    it('should warn when no violations file exists', async () => {
      mockExists.mockResolvedValue(false);

      await fixer.fixById('v-1');

      const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
      expect(output).toContain('No violations found');
    });

    it('should warn when violation id is not found', async () => {
      mockLoad.mockResolvedValue([makeViolation({ id: 'v-other' })]);

      await fixer.fixById('v-missing');

      const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
      expect(output).toContain('not found');
    });

    it('should show manual guidance for non-autoFixable violations', async () => {
      mockLoad.mockResolvedValue([makeViolation({ autoFixable: false })]);

      await fixer.fixById('v-1');

      const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
      expect(output).toContain('not auto-fixable');
      expect(output).toContain('Manual fix needed');
    });

    it('should show dry-run preview before applying file rename', async () => {
      const violation = makeViolation();
      mockLoad.mockResolvedValue([violation]);

      await fixer.fixById('v-1');

      const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
      expect(output).toContain('Dry-run preview');
      expect(output).toContain('[rename]');
      expect(output).toContain('auth_helper.ts');
      expect(output).toContain('authHelper.ts');
    });

    it('should rename file and remove violation from store', async () => {
      const violation = makeViolation();
      mockLoad.mockResolvedValue([violation]);

      await fixer.fixById('v-1');

      expect(mockRename).toHaveBeenCalledOnce();
      expect(mockSave).toHaveBeenCalledWith([]);
      const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
      expect(output).toContain('Fix applied successfully');
    });

    it('should report error when source file does not exist', async () => {
      const violation = makeViolation();
      mockLoad.mockResolvedValue([violation]);
      mockExistsSync.mockReturnValue(false);

      await fixer.fixById('v-1');

      expect(mockRename).not.toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
      expect(output).toContain('File not found');
    });

    it('should handle rename failure gracefully', async () => {
      const violation = makeViolation();
      mockLoad.mockResolvedValue([violation]);
      mockRename.mockRejectedValueOnce(new Error('EPERM'));

      await fixer.fixById('v-1');

      const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
      expect(output).toContain('Rename failed');
      expect(output).toContain('EPERM');
    });
  });

  describe('fixAll', () => {
    it('should warn when no violations file exists', async () => {
      mockExists.mockResolvedValue(false);

      await fixer.fixAll();

      const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
      expect(output).toContain('No violations found');
    });

    it('should warn when no autoFixable violations exist', async () => {
      mockLoad.mockResolvedValue([makeViolation({ autoFixable: false })]);

      await fixer.fixAll();

      const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
      expect(output).toContain('No auto-fixable violations');
    });

    it('should show dry-run preview for all fixable violations', async () => {
      mockLoad.mockResolvedValue([
        makeViolation({ id: 'v-1', file: 'src/auth_helper.ts', found: 'auth_helper.ts', expected: 'authHelper.ts' }),
        makeViolation({ id: 'v-2', file: 'src/my_component.tsx', found: 'my_component.tsx', expected: 'MyComponent.tsx' }),
      ]);

      await fixer.fixAll();

      const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
      expect(output).toContain('2 auto-fixable violation(s)');
      expect(output).toContain('auth_helper.ts');
      expect(output).toContain('MyComponent.tsx');
    });

    it('should fix all autoFixable violations and persist remaining', async () => {
      const manualViolation = makeViolation({
        id: 'v-manual',
        autoFixable: false,
        expected: 'Constants use SCREAMING_SNAKE_CASE',
        found: '2/5 conforming',
      });
      const fixable = makeViolation({ id: 'v-fix' });
      mockLoad.mockResolvedValue([manualViolation, fixable]);

      await fixer.fixAll();

      expect(mockRename).toHaveBeenCalledOnce();
      expect(mockSave).toHaveBeenCalledWith([manualViolation]);
      const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
      expect(output).toContain('Fixed 1/1 violation(s)');
      expect(output).toContain('1 violation(s) remaining');
    });

    it('should print manual guidance for non-rename autoFixable violations', async () => {
      const violation = makeViolation({
        id: 'v-1',
        autoFixable: true,
        expected: 'Constants use SCREAMING_SNAKE_CASE',
        found: '2/5 conforming',
      });
      mockLoad.mockResolvedValue([violation]);

      await fixer.fixAll();

      const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
      expect(output).toContain('Manual fix needed');
    });
  });

  describe('file rename detection', () => {
    it('should detect file rename when both found and expected have matching extensions', async () => {
      const violation = makeViolation({
        found: 'auth_helper.ts',
        expected: 'authHelper.ts',
      });
      mockLoad.mockResolvedValue([violation]);

      await fixer.fixById('v-1');

      const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
      expect(output).toContain('[rename]');
    });

    it('should fall back to manual guidance when expected has no extension', async () => {
      const violation = makeViolation({
        expected: 'Utility files use camelCase',
        found: 'auth_helper',
      });
      mockLoad.mockResolvedValue([violation]);

      await fixer.fixById('v-1');

      const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
      expect(output).toContain('Manual fix needed');
    });
  });
});
