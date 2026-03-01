import type { AstVisitor, VisitorFinding, ExportedKind } from './types.js';
import type { ParsedFile } from '../AstAnalyzer.js';
import traverse from '@babel/traverse';
import { basename, extname } from 'node:path';

const PASCAL_CASE = /^[A-Z][a-zA-Z0-9]*$/;
const CAMEL_CASE = /^[a-z][a-zA-Z0-9]*$/;
const SCREAMING_SNAKE = /^[A-Z][A-Z0-9_]*$/;
const HOOK_PREFIX = /^use[A-Z]/;

function isKebabCase(fileName: string): boolean {
  return fileName.includes('-');
}

export class NamingVisitor implements AstVisitor {
  visit(file: ParsedFile): VisitorFinding[] {
    const findings: VisitorFinding[] = [];
    const fileName = basename(file.filePath, extname(file.filePath));
    const ext = extname(file.filePath);
    const isComponent = ext === '.tsx' || ext === '.jsx';

    if (ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx') {
      findings.push({
        dimension: 'naming',
        pattern: 'Filenames use PascalCase or camelCase (no kebab-case)',
        count: isKebabCase(fileName) ? 0 : 1,
        total: 1,
        example: file.filePath,
      });
    }

    if (isComponent) {
      const exportInfo = this.getPrimaryExport(file);
      const expectedName = exportInfo?.name;
      const matches = expectedName
        ? basename(fileName) === expectedName
        : PASCAL_CASE.test(fileName);
      findings.push({
        dimension: 'naming',
        pattern: 'React components use PascalCase file names',
        count: matches ? 1 : 0,
        total: 1,
        example: file.filePath,
        exportedName: expectedName ?? undefined,
        exportedKind: 'component',
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
        const exportInfo = this.getPrimaryExport(file);
        const matches = !exportInfo || basename(fileName) === exportInfo.name;
        findings.push({
          dimension: 'naming',
          pattern: 'Class/service files use PascalCase',
          count: matches ? 1 : 0,
          total: 1,
          example: file.filePath,
          exportedName: exportInfo?.kind === 'class' ? exportInfo.name : undefined,
          exportedKind: exportInfo?.kind,
        });
      } else if (CAMEL_CASE.test(fileName)) {
        const exportInfo = this.getPrimaryExport(file);
        const matches = !exportInfo || basename(fileName) === exportInfo.name;
        findings.push({
          dimension: 'naming',
          pattern: 'Utility files use camelCase',
          count: matches ? 1 : 0,
          total: 1,
          example: file.filePath,
          exportedName: exportInfo?.kind === 'instance' ? exportInfo.name : undefined,
          exportedKind: exportInfo?.kind,
        });
      } else if (isKebabCase(fileName)) {
        const exportInfo = this.getPrimaryExport(file);
        findings.push({
          dimension: 'naming',
          pattern: 'Class/service files use PascalCase',
          count: 0,
          total: 1,
          example: file.filePath,
          exportedName: exportInfo?.name,
          exportedKind: exportInfo?.kind,
        });
      }
    }

    this.visitFileResponsibility(file, fileName, findings);
    this.visitClasses(file, findings);
    this.visitInterfaces(file, findings);
    this.visitTypes(file, findings);
    this.visitEnums(file, findings);
    this.visitParameters(file, findings);
    this.visitFactories(file, findings);
    this.visitObjectKeys(file, findings);
    this.visitConstants(file, findings);

    return findings;
  }

  private extractWords(s: string): string[] {
    return s
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      .split(/[-_.\s]+/)
      .map((w) => w.toLowerCase())
      .filter((w) => w.length >= 2 && !/^(helper|util|service|type|hook|api)$/.test(w));
  }

  private visitFileResponsibility(file: ParsedFile, fileName: string, findings: VisitorFinding[]): void {
    const exportInfo = this.getPrimaryExport(file);
    if (!exportInfo) return;
    const ext = extname(file.filePath);
    if (ext !== '.ts' && ext !== '.tsx') return;
    const stemWords = this.extractWords(fileName);
    if (stemWords.length === 0) return;
    const exportWords = this.extractWords(exportInfo.name);
    if (exportWords.length === 0) return;
    const overlap = stemWords.some((w) => exportWords.includes(w));
    findings.push({
      dimension: 'naming',
      pattern: 'File stem aligns with export responsibility',
      count: overlap ? 1 : 0,
      total: 1,
      example: file.filePath,
      exportedName: exportInfo.name,
    });
  }

  private getPrimaryExport(file: ParsedFile): { name: string; kind: ExportedKind } | null {
    let result: { name: string; kind: ExportedKind } | null = null;
    try {
      // @ts-expect-error -- babel traverse CJS default export not resolved under NodeNext
      traverse(file.ast, {
        ExportDefaultDeclaration(path: { node: { declaration: { type: string; id?: { name: string }; name?: string } } }) {
          if (result) return;
          const decl = path.node.declaration as { type: string; id?: { name: string }; name?: string };
          if (decl.type === 'ClassDeclaration' && decl.id) {
            result = { name: decl.id.name, kind: 'class' };
          } else if (decl.type === 'FunctionDeclaration' && decl.id) {
            result = { name: decl.id.name, kind: 'function' };
          } else if (decl.type === 'Identifier' && decl.name) {
            result = { name: decl.name, kind: 'instance' };
          }
        },
        ExportNamedDeclaration(path: { node: { declaration?: { type: string; id?: { name: string }; declarations?: Array<{ id: { type: string; name?: string } }> }; specifiers?: Array<{ exported: { name: string } }> } }) {
          if (result) return;
          const { node } = path;
          if (node.declaration) {
            const d = node.declaration;
            if (d.type === 'ClassDeclaration' && d.id) {
              result = { name: d.id.name, kind: 'class' };
            } else if (d.type === 'VariableDeclaration' && d.declarations?.[0]?.id) {
              const id = d.declarations[0].id;
              const name = id.type === 'Identifier' ? id.name : undefined;
              if (name) result = { name, kind: HOOK_PREFIX.test(name) ? 'hook' : 'instance' };
            } else if (d.type === 'FunctionDeclaration' && d.id) {
              result = { name: d.id.name, kind: 'function' };
            }
          } else if (node.specifiers?.[0]?.exported?.name) {
            result = { name: node.specifiers[0].exported.name, kind: 'instance' };
          }
        },
        noScope: true,
      });
    } catch {
      // ignore
    }
    return result;
  }

  private visitClasses(file: ParsedFile, findings: VisitorFinding[]): void {
    try {
      let pascalCount = 0;
      let total = 0;
      const violationRef: { found?: string; expected?: string } = {};

      // @ts-expect-error -- babel traverse
      traverse(file.ast, {
        ClassDeclaration(path: { node: { id: { name: string } } }) {
          const name = path.node.id?.name;
          if (!name) return;
          total++;
          if (PASCAL_CASE.test(name)) {
            pascalCount++;
          } else {
            const words = name.split(/[-_.\s]+/).filter(Boolean);
            const expected = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
            if (!violationRef.found) {
              violationRef.found = name;
              violationRef.expected = expected;
            }
          }
        },
        noScope: true,
      });

      if (total > 0) {
        findings.push({
          dimension: 'naming',
          pattern: 'Class names use PascalCase',
          count: pascalCount,
          total,
          example: file.filePath,
          exportedName: violationRef.expected,
          foundValue: violationRef.found,
        });
      }
    } catch {
      // ignore
    }
  }

  private visitInterfaces(file: ParsedFile, findings: VisitorFinding[]): void {
    try {
      let pascalCount = 0;
      let total = 0;
      // @ts-expect-error -- babel traverse
      traverse(file.ast, {
        TSInterfaceDeclaration(path: { node: { id: { name: string } } }) {
          const name = path.node.id?.name;
          if (!name) return;
          total++;
          if (PASCAL_CASE.test(name)) pascalCount++;
        },
        noScope: true,
      });
      if (total > 0) {
        findings.push({
          dimension: 'naming',
          pattern: 'Interface names use PascalCase',
          count: pascalCount,
          total,
          example: file.filePath,
        });
      }
    } catch {
      // ignore
    }
  }

  private visitTypes(file: ParsedFile, findings: VisitorFinding[]): void {
    try {
      let pascalCount = 0;
      let total = 0;
      // @ts-expect-error -- babel traverse
      traverse(file.ast, {
        TSTypeAliasDeclaration(path: { node: { id: { name: string } } }) {
          const name = path.node.id?.name;
          if (!name) return;
          total++;
          if (PASCAL_CASE.test(name)) pascalCount++;
        },
        noScope: true,
      });
      if (total > 0) {
        findings.push({
          dimension: 'naming',
          pattern: 'Type alias names use PascalCase',
          count: pascalCount,
          total,
          example: file.filePath,
        });
      }
    } catch {
      // ignore
    }
  }

  private visitEnums(file: ParsedFile, findings: VisitorFinding[]): void {
    try {
      let namePascalCount = 0;
      let nameTotal = 0;
      let memberCorrectCount = 0;
      let memberTotal = 0;
      // @ts-expect-error -- babel traverse
      traverse(file.ast, {
        TSEnumDeclaration(path: { node: { id: { name: string }; body?: { members: Array<{ id: { type: string; name?: string } }> }; members?: Array<{ id: { type: string; name?: string } }> } }) {
          const node = path.node;
          const enumName = node.id?.name;
          if (enumName) {
            nameTotal++;
            if (PASCAL_CASE.test(enumName)) namePascalCount++;
          }
          const members = node.body?.members ?? node.members ?? [];
          for (const m of members) {
            if (m.id?.type === 'Identifier' && m.id.name) {
              memberTotal++;
              if (PASCAL_CASE.test(m.id.name) || SCREAMING_SNAKE.test(m.id.name)) {
                memberCorrectCount++;
              }
            }
          }
        },
        noScope: true,
      });
      if (nameTotal > 0) {
        findings.push({
          dimension: 'naming',
          pattern: 'Enum names use PascalCase',
          count: namePascalCount,
          total: nameTotal,
          example: file.filePath,
        });
      }
      if (memberTotal > 0) {
        findings.push({
          dimension: 'naming',
          pattern: 'Enum members use PascalCase or SCREAMING_SNAKE_CASE',
          count: memberCorrectCount,
          total: memberTotal,
          example: file.filePath,
        });
      }
    } catch {
      // ignore
    }
  }

  private visitParameters(file: ParsedFile, findings: VisitorFinding[]): void {
    try {
      let camelCount = 0;
      let total = 0;
      // @ts-expect-error -- babel traverse
      traverse(file.ast, {
        Identifier(path: { node: { name: string }; parentPath: { parentKey: string; node: { type: string } } }) {
          const parentKey = path.parentPath?.parentKey;
          const parent = path.parentPath?.node;
          if (parentKey !== 'params' || !parent) return;
          if (parent.type !== 'FunctionDeclaration' && parent.type !== 'ArrowFunctionExpression') return;
          const name = path.node.name;
          if (name === 'this' || name.startsWith('_')) return;
          total++;
          if (CAMEL_CASE.test(name)) camelCount++;
        },
        noScope: true,
      });
      if (total > 0) {
        findings.push({
          dimension: 'naming',
          pattern: 'Function parameters use camelCase',
          count: camelCount,
          total,
          example: file.filePath,
        });
      }
    } catch {
      // ignore
    }
  }

  private visitFactories(file: ParsedFile, findings: VisitorFinding[]): void {
    try {
      const FACTORY_PREFIX = /^(create|build|make)[A-Z]/;
      let camelCount = 0;
      let total = 0;
      // @ts-expect-error -- babel traverse
      traverse(file.ast, {
        FunctionDeclaration(path: { node: { id: { name: string } | null } }) {
          const id = path.node.id;
          if (!id || !FACTORY_PREFIX.test(id.name)) return;
          total++;
          if (CAMEL_CASE.test(id.name)) camelCount++;
        },
        noScope: true,
      });
      if (total > 0) {
        findings.push({
          dimension: 'naming',
          pattern: 'Factory functions use camelCase',
          count: camelCount,
          total,
          example: file.filePath,
        });
      }
    } catch {
      // ignore
    }
  }

  private visitObjectKeys(file: ParsedFile, findings: VisitorFinding[]): void {
    try {
      let validCount = 0;
      let total = 0;
      // @ts-expect-error -- babel traverse
      traverse(file.ast, {
        ObjectProperty(path: { node: { key: { type: string; name?: string; value?: string } }; parent: { type: string } }) {
          if (path.parent?.type !== 'ObjectExpression') return;
          const key = path.node.key;
          if (key.type !== 'Identifier') return;
          const name = key.name ?? (key as { value?: string }).value;
          if (!name || name.includes('-')) {
            total++;
            return;
          }
          total++;
          if (CAMEL_CASE.test(name) || SCREAMING_SNAKE.test(name)) validCount++;
        },
        noScope: true,
      });
      if (total > 0) {
        findings.push({
          dimension: 'naming',
          pattern: 'Object keys use camelCase or SCREAMING_SNAKE_CASE',
          count: validCount,
          total,
          example: file.filePath,
        });
      }
    } catch {
      // ignore
    }
  }

  private visitConstants(file: ParsedFile, findings: VisitorFinding[]): void {
    try {
      let screamingCount = 0;
      let constCount = 0;

      // @ts-expect-error -- babel traverse
      traverse(file.ast, {
        VariableDeclarator(path: { node: { id: { type: string; name: string }; init: { type: string } | null } }) {
          const { node } = path;
          if (node.id.type !== 'Identifier' || !node.init) return;
          const initType = node.init.type;
          const isConstLike =
            initType === 'StringLiteral' ||
            initType === 'NumericLiteral' ||
            initType === 'MemberExpression' ||
            initType === 'CallExpression';
          if (!isConstLike) return;
          constCount++;
          if (SCREAMING_SNAKE.test(node.id.name)) {
            screamingCount++;
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
      // ignore
    }
  }
}
