import type { AstVisitor, VisitorFinding } from './types.js';
import type { ParsedFile } from '../AstAnalyzer.js';
import { basename } from 'node:path';

export class ImportVisitor implements AstVisitor {
  visit(file: ParsedFile): VisitorFinding[] {
    const findings: VisitorFinding[] = [];
    let namedImportCount = 0;
    let defaultImportCount = 0;
    let totalImports = 0;
    let barrelImportCount = 0;

    try {
      const traverse = require('@babel/traverse').default ?? require('@babel/traverse');

      traverse(file.ast, {
        ImportDeclaration(path: {
          node: {
            specifiers: Array<{ type: string }>;
            source: { value: string };
          };
        }) {
          totalImports++;
          const specs = path.node.specifiers;
          const hasDefault = specs.some((s) => s.type === 'ImportDefaultSpecifier');
          const hasNamed = specs.some((s) => s.type === 'ImportSpecifier');

          if (hasDefault) defaultImportCount++;
          if (hasNamed) namedImportCount++;

          const src = path.node.source.value;
          if (src.endsWith('/index') || /^\.\.?\/[^/]+$/.test(src)) {
            const base = basename(src);
            if (base === 'index' || !base.includes('.')) {
              barrelImportCount++;
            }
          }
        },
        noScope: true,
      });
    } catch {
      return findings;
    }

    if (totalImports > 0) {
      if (namedImportCount > defaultImportCount) {
        findings.push({
          dimension: 'imports',
          pattern: 'Prefer named imports over default imports',
          count: namedImportCount,
          total: totalImports,
          example: file.filePath,
        });
      } else if (defaultImportCount > 0) {
        findings.push({
          dimension: 'imports',
          pattern: 'Default imports prevalent',
          count: defaultImportCount,
          total: totalImports,
          example: file.filePath,
        });
      }

      if (barrelImportCount > 0) {
        findings.push({
          dimension: 'imports',
          pattern: 'Barrel imports (index re-exports)',
          count: barrelImportCount,
          total: totalImports,
          example: file.filePath,
        });
      }
    }

    return findings;
  }
}
