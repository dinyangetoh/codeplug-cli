import type { AstVisitor, VisitorFinding } from './types.js';
import type { ParsedFile } from '../AstAnalyzer.js';

export class TestVisitor implements AstVisitor {
  visit(file: ParsedFile): VisitorFinding[] {
    const findings: VisitorFinding[] = [];
    const fp = file.filePath;

    const isTestFile =
      fp.includes('.test.') || fp.includes('.spec.') || fp.includes('__tests__/');

    if (!isTestFile) return findings;

    if (fp.includes('__tests__/')) {
      findings.push({
        dimension: 'testing',
        pattern: 'Co-located __tests__/ directories',
        count: 1,
        total: 1,
        example: fp,
      });
    } else if (fp.startsWith('tests/') || fp.startsWith('test/')) {
      findings.push({
        dimension: 'testing',
        pattern: 'Separate tests/ directory',
        count: 1,
        total: 1,
        example: fp,
      });
    }

    if (fp.endsWith('.test.ts') || fp.endsWith('.test.tsx') || fp.endsWith('.test.js')) {
      findings.push({
        dimension: 'testing',
        pattern: 'Test files use .test.{ext} naming',
        count: 1,
        total: 1,
        example: fp,
      });
    } else if (fp.endsWith('.spec.ts') || fp.endsWith('.spec.tsx') || fp.endsWith('.spec.js')) {
      findings.push({
        dimension: 'testing',
        pattern: 'Test files use .spec.{ext} naming',
        count: 1,
        total: 1,
        example: fp,
      });
    }

    return findings;
  }
}
