import type { AstVisitor, VisitorFinding } from './types.js';
import type { ParsedFile } from '../AstAnalyzer.js';
import type { StructureConfig } from '../../../config/types.js';
import { DEFAULT_STRUCTURE } from '../../../config/defaults.js';

interface DirRule {
  pattern: RegExp;
  dir: string;
  patternName: string;
}

export class StructureVisitor implements AstVisitor {
  private rules: DirRule[] = [];

  constructor(
    filePaths: string[] = [],
    structureConfig?: StructureConfig,
  ) {
    const allDirs = new Set<string>();
    for (const p of filePaths) {
      for (const seg of p.split('/').slice(0, -1)) {
        allDirs.add(seg);
      }
    }

    const placement = structureConfig?.directoryPlacement ?? DEFAULT_STRUCTURE.directoryPlacement ?? [];
    for (const r of placement) {
      if (![...allDirs].some((d) => d === r.dir)) continue;
      this.rules.push({
        pattern: new RegExp(r.filePattern),
        dir: r.dir,
        patternName: r.patternName,
      });
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
