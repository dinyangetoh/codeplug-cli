import type { AstVisitor, VisitorFinding } from './types.js';
import type { ParsedFile } from '../AstAnalyzer.js';
import traverse from '@babel/traverse';

export class ErrorHandlingVisitor implements AstVisitor {
  visit(file: ParsedFile): VisitorFinding[] {
    const findings: VisitorFinding[] = [];
    let tryCatchCount = 0;
    let asyncFnCount = 0;

    try {
      // @ts-expect-error -- @babel/traverse CJS default export not resolved under NodeNext
      traverse(file.ast, {
        TryStatement() {
          tryCatchCount++;
        },
        FunctionDeclaration(path: { node: { async: boolean } }) {
          if (path.node.async) asyncFnCount++;
        },
        ArrowFunctionExpression(path: { node: { async: boolean } }) {
          if (path.node.async) asyncFnCount++;
        },
        noScope: true,
      });
    } catch {
      return findings;
    }

    if (tryCatchCount > 0) {
      findings.push({
        dimension: 'error-handling',
        pattern: 'Try/catch error handling',
        count: tryCatchCount,
        total: Math.max(tryCatchCount, asyncFnCount),
        example: file.filePath,
      });
    }

    if (asyncFnCount > 0) {
      findings.push({
        dimension: 'api',
        pattern: 'Async/await pattern',
        count: asyncFnCount,
        total: asyncFnCount,
        example: file.filePath,
      });
    }

    return findings;
  }
}
