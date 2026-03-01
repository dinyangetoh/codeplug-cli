import type { AstVisitor, VisitorFinding } from './types.js';
import type { ParsedFile } from '../AstAnalyzer.js';

interface DirRule {
  pattern: RegExp;
  dir: string;
  patternName: string;
}

export class StructureVisitor implements AstVisitor {
  private rules: DirRule[] = [];

  constructor(filePaths: string[] = []) {
    const allDirs = new Set<string>();
    for (const p of filePaths) {
      for (const seg of p.split('/').slice(0, -1)) {
        allDirs.add(seg);
      }
    }
    if ([...allDirs].some((d) => d === 'helpers')) {
      this.rules.push({ pattern: /[Hh]elper/, dir: 'helpers', patternName: '*Helper files in helpers/' });
    }
    if ([...allDirs].some((d) => d === 'hooks')) {
      this.rules.push({ pattern: /^use[A-Z]/, dir: 'hooks', patternName: 'use* hooks in hooks/' });
    }
    if ([...allDirs].some((d) => d === 'services')) {
      this.rules.push({ pattern: /Service$/, dir: 'services', patternName: '*Service files in services/' });
    }
  }

  visit(file: ParsedFile): VisitorFinding[] {
    const findings: VisitorFinding[] = [];
    const base = file.filePath.split('/').pop() ?? '';
    const stem = base.replace(/\.[^.]+$/, '');
    const dirsInPath = file.filePath.split('/').slice(0, -1);

    for (const { pattern, dir, patternName } of this.rules) {
      if (!pattern.test(stem)) continue;
      const inRightDir = dirsInPath.includes(dir);
      findings.push({
        dimension: 'structure',
        pattern: patternName,
        count: inRightDir ? 1 : 0,
        total: 1,
        example: file.filePath,
      });
    }
    return findings;
  }
}
