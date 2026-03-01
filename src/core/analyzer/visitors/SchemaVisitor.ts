import type { AstVisitor, VisitorFinding } from './types.js';
import type { ParsedFile } from '../AstAnalyzer.js';
import traverse from '@babel/traverse';
import { extname } from 'node:path';

const PASCAL_CASE = /^[A-Z][a-zA-Z0-9]*$/;

export class SchemaVisitor implements AstVisitor {
  visit(file: ParsedFile): VisitorFinding[] {
    const ext = extname(file.filePath);
    if (ext !== '.ts' && ext !== '.tsx') return [];

    const findings: VisitorFinding[] = [];
    this.visitTypeORM(file, findings);
    return findings;
  }

  private visitTypeORM(file: ParsedFile, findings: VisitorFinding[]): void {
    try {
      let entityPascalCount = 0;
      let entityTotal = 0;
      // @ts-expect-error -- babel traverse
      traverse(file.ast, {
        ClassDeclaration(path: {
          node: {
            id: { name: string };
            decorators?: Array<{ expression?: { callee?: { name: string } } }>;
          };
        }) {
          const decorators = path.node.decorators ?? (path.node as { decorators?: unknown[] }).decorators;
          if (!Array.isArray(decorators)) return;
          const hasEntity = decorators.some(
            (d: { expression?: { callee?: { name: string } } }) =>
              d?.expression?.callee?.name === 'Entity',
          );
          if (!hasEntity) return;
          const name = path.node.id?.name;
          if (!name) return;
          entityTotal++;
          if (PASCAL_CASE.test(name)) entityPascalCount++;
        },
        noScope: true,
      });
      if (entityTotal > 0) {
        findings.push({
          dimension: 'naming',
          pattern: 'TypeORM entity names use PascalCase',
          count: entityPascalCount,
          total: entityTotal,
          example: file.filePath,
        });
      }
    } catch {
      // ignore
    }
  }
}
