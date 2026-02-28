import { join, basename, extname } from 'node:path';
import { readFile } from 'node:fs/promises';
import type { Convention, Violation, ConventionAuditOptions } from '../../config/types.js';
import type { ParsedFile } from '../analyzer/AstAnalyzer.js';
import type { AstVisitor, VisitorFinding } from '../analyzer/visitors/types.js';

export class ViolationDetector {
  constructor(private projectRoot: string) {}

  async detect(conventions: Convention[], options: ConventionAuditOptions): Promise<Violation[]> {
    const confirmed = conventions.filter((c) => c.confirmed);
    if (confirmed.length === 0) return [];

    const files = await this.getTargetFiles(options);
    if (files.length === 0) return [];

    const [visitors, { randomUUID }] = await Promise.all([
      this.createVisitors(),
      import('node:crypto'),
    ]);

    const conventionMap = new Map<string, Convention>();
    for (const c of confirmed) {
      conventionMap.set(`${c.dimension}:${c.rule}`, c);
    }

    const violations: Violation[] = [];

    for (const filePath of files) {
      const parsed = await this.parseFile(filePath);
      if (!parsed) continue;

      for (const visitor of visitors) {
        try {
          const findings = visitor.visit(parsed);
          for (const finding of findings) {
            if (finding.count >= finding.total) continue;

            const key = `${finding.dimension}:${finding.pattern}`;
            const convention = conventionMap.get(key);
            if (!convention) continue;

            const isNamingFile = finding.dimension === 'naming' && finding.total === 1;
            const ext = extname(filePath);
            const expectedName = isNamingFile
              ? this.computeExpectedFilename(basename(filePath, ext), ext, finding.pattern)
              : null;

            violations.push({
              id: randomUUID(),
              conventionId: convention.id,
              severity: convention.severity,
              file: filePath,
              message: `Violates: ${finding.pattern}`,
              expected: expectedName ?? finding.pattern,
              found: isNamingFile ? basename(filePath) : this.describeFinding(finding, filePath),
              autoFixable: expectedName !== null,
            });
          }
        } catch {
          // Visitor may fail on certain files; skip gracefully
        }
      }
    }

    await this.persistViolations(violations);
    return violations;
  }

  private async persistViolations(violations: Violation[]): Promise<void> {
    const { ViolationStore } = await import('../../storage/ViolationStore.js');
    const store = new ViolationStore(this.projectRoot);
    await store.save(violations);
  }

  private async getTargetFiles(options: ConventionAuditOptions): Promise<string[]> {
    const { globby } = await import('globby');

    const allFiles = await globby(['**/*.{ts,tsx,js,jsx,mjs,cjs}'], {
      cwd: this.projectRoot,
      gitignore: true,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.codeplug/**'],
      absolute: false,
    });

    if (!options.since) return allFiles;

    const changedFiles = await this.getChangedFilesSince(options.since);
    if (changedFiles.length === 0) return [];

    const changedSet = new Set(changedFiles);
    return allFiles.filter((f) => changedSet.has(f));
  }

  private async getChangedFilesSince(since: string): Promise<string[]> {
    try {
      const { simpleGit } = await import('simple-git');
      const git = simpleGit(this.projectRoot);
      const isRepo = await git.checkIsRepo();
      if (!isRepo) return [];

      const result = await git.raw(['log', '--since', since, '--name-only', '--format=']);
      return [...new Set(result.split('\n').map((l) => l.trim()).filter(Boolean))];
    } catch {
      return [];
    }
  }

  private async parseFile(filePath: string): Promise<ParsedFile | null> {
    try {
      const absolutePath = join(this.projectRoot, filePath);
      const code = await readFile(absolutePath, 'utf-8');
      const { parse } = await import('@babel/parser');

      const ast = parse(code, {
        sourceType: 'module',
        plugins: [
          'typescript',
          'jsx',
          'decorators-legacy',
          'classProperties',
          'optionalChaining',
          'nullishCoalescingOperator',
          'dynamicImport',
        ],
        errorRecovery: true,
      });

      return { filePath, code, ast };
    } catch {
      return null;
    }
  }

  private async createVisitors(): Promise<AstVisitor[]> {
    const [
      { NamingVisitor },
      { ComponentVisitor },
      { TestVisitor },
      { ErrorHandlingVisitor },
      { ImportVisitor },
    ] = await Promise.all([
      import('../analyzer/visitors/NamingVisitor.js'),
      import('../analyzer/visitors/ComponentVisitor.js'),
      import('../analyzer/visitors/TestVisitor.js'),
      import('../analyzer/visitors/ErrorHandlingVisitor.js'),
      import('../analyzer/visitors/ImportVisitor.js'),
    ]);

    return [
      new NamingVisitor(),
      new ComponentVisitor(),
      new TestVisitor(),
      new ErrorHandlingVisitor(),
      new ImportVisitor(),
    ];
  }

  private describeFinding(finding: VisitorFinding, filePath: string): string {
    if (finding.total === 1) {
      return basename(filePath, extname(filePath));
    }
    return `${finding.count}/${finding.total} conforming`;
  }

  private computeExpectedFilename(stem: string, ext: string, pattern: string): string | null {
    const lower = pattern.toLowerCase();
    if (lower.includes('pascalcase')) {
      const converted = this.toPascalCase(stem);
      return converted !== stem ? converted + ext : null;
    }
    if (lower.includes('camelcase')) {
      const converted = this.toCamelCase(stem);
      return converted !== stem ? converted + ext : null;
    }
    return null;
  }

  private splitWords(str: string): string[] {
    return str
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
      .split(/[-_.\s]+/)
      .filter(Boolean);
  }

  private toCamelCase(str: string): string {
    const words = this.splitWords(str);
    if (words.length === 0) return str;
    return words
      .map((w, i) =>
        i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
      )
      .join('');
  }

  private toPascalCase(str: string): string {
    const words = this.splitWords(str);
    if (words.length === 0) return str;
    return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  }
}
