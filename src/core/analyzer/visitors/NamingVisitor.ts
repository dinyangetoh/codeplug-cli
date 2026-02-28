import type { AstVisitor, VisitorFinding } from './types.js';
import type { ParsedFile } from '../AstAnalyzer.js';
import traverse from '@babel/traverse';
import { basename, extname } from 'node:path';

const PASCAL_CASE = /^[A-Z][a-zA-Z0-9]*$/;
const CAMEL_CASE = /^[a-z][a-zA-Z0-9]*$/;
const SCREAMING_SNAKE = /^[A-Z][A-Z0-9_]*$/;
const HOOK_PREFIX = /^use[A-Z]/;

export class NamingVisitor implements AstVisitor {
  visit(file: ParsedFile): VisitorFinding[] {
    const findings: VisitorFinding[] = [];
    const fileName = basename(file.filePath, extname(file.filePath));
    const ext = extname(file.filePath);
    const isComponent = ext === '.tsx' || ext === '.jsx';

    if (isComponent) {
      findings.push({
        dimension: 'naming',
        pattern: 'React components use PascalCase file names',
        count: PASCAL_CASE.test(fileName) ? 1 : 0,
        total: 1,
        example: file.filePath,
      });
    } else if (ext === '.ts' || ext === '.js') {
      if (HOOK_PREFIX.test(fileName)) {
        findings.push({
          dimension: 'naming',
          pattern: 'Hooks use "use" prefix with camelCase',
          count: CAMEL_CASE.test(fileName) ? 1 : 0,
          total: 1,
          example: file.filePath,
        });
      } else if (PASCAL_CASE.test(fileName)) {
        findings.push({
          dimension: 'naming',
          pattern: 'Class/service files use PascalCase',
          count: 1,
          total: 1,
          example: file.filePath,
        });
      } else if (CAMEL_CASE.test(fileName)) {
        findings.push({
          dimension: 'naming',
          pattern: 'Utility files use camelCase',
          count: 1,
          total: 1,
          example: file.filePath,
        });
      }
    }

    this.visitConstants(file, findings);

    return findings;
  }

  private visitConstants(file: ParsedFile, findings: VisitorFinding[]): void {
    try {
      let screamingCount = 0;
      let constCount = 0;

      // @ts-expect-error -- @babel/traverse CJS default export not resolved under NodeNext
      traverse(file.ast, {
        VariableDeclarator(path: { node: { id: { type: string; name: string }; init: { type: string } | null } }) {
          const { node } = path;
          if (
            node.id.type === 'Identifier' &&
            node.init &&
            (node.init.type === 'StringLiteral' || node.init.type === 'NumericLiteral')
          ) {
            constCount++;
            if (SCREAMING_SNAKE.test(node.id.name)) {
              screamingCount++;
            }
          }
        },
        noScope: true,
      });

      if (constCount > 0) {
        findings.push({
          dimension: 'naming',
          pattern: 'Constants use SCREAMING_SNAKE_CASE',
          count: screamingCount,
          total: constCount,
          example: file.filePath,
        });
      }
    } catch {
      // traverse may fail on some files
    }
  }
}
