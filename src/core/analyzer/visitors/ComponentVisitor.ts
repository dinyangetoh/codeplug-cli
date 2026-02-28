import type { AstVisitor, VisitorFinding } from './types.js';
import type { ParsedFile } from '../AstAnalyzer.js';
import { extname } from 'node:path';

export class ComponentVisitor implements AstVisitor {
  visit(file: ParsedFile): VisitorFinding[] {
    const ext = extname(file.filePath);
    if (ext !== '.tsx' && ext !== '.jsx') return [];

    const findings: VisitorFinding[] = [];
    let hasFunctionalComponent = false;
    let hasClassComponent = false;
    let hasHooks = false;

    try {
      const traverse = require('@babel/traverse').default ?? require('@babel/traverse');

      traverse(file.ast, {
        FunctionDeclaration(path: { node: { body: { body: Array<{ type: string; argument?: { type: string } }> } } }) {
          if (returnsJSX(path.node.body)) hasFunctionalComponent = true;
        },
        ArrowFunctionExpression(path: { node: { body: { type: string; body?: Array<{ type: string; argument?: { type: string } }> } } }) {
          if (
            path.node.body.type === 'JSXElement' ||
            path.node.body.type === 'JSXFragment' ||
            (path.node.body.type === 'BlockStatement' && returnsJSX(path.node.body))
          ) {
            hasFunctionalComponent = true;
          }
        },
        ClassDeclaration(path: { node: { superClass?: { type: string; name?: string; property?: { name: string } } } }) {
          const sc = path.node.superClass;
          if (
            sc &&
            ((sc.type === 'Identifier' && sc.name === 'Component') ||
             (sc.type === 'MemberExpression' && sc.property?.name === 'Component'))
          ) {
            hasClassComponent = true;
          }
        },
        CallExpression(path: { node: { callee: { type: string; name?: string } } }) {
          if (
            path.node.callee.type === 'Identifier' &&
            /^use[A-Z]/.test(path.node.callee.name ?? '')
          ) {
            hasHooks = true;
          }
        },
        noScope: true,
      });
    } catch {
      return findings;
    }

    if (hasFunctionalComponent) {
      findings.push({
        dimension: 'component',
        pattern: 'Functional components',
        count: 1,
        total: 1,
        example: file.filePath,
      });
    }

    if (hasClassComponent) {
      findings.push({
        dimension: 'component',
        pattern: 'Class components',
        count: 1,
        total: 1,
        example: file.filePath,
      });
    }

    if (hasHooks) {
      findings.push({
        dimension: 'component',
        pattern: 'Hooks composition pattern',
        count: 1,
        total: 1,
        example: file.filePath,
      });
    }

    return findings;
  }
}

function returnsJSX(body: { body?: Array<{ type: string; argument?: { type: string } }> }): boolean {
  return body.body?.some(
    (stmt) =>
      stmt.type === 'ReturnStatement' &&
      (stmt.argument?.type === 'JSXElement' || stmt.argument?.type === 'JSXFragment'),
  ) ?? false;
}
