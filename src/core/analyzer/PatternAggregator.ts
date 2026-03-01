import type { ParsedFile } from './AstAnalyzer.js';
import type { AstVisitor } from './visitors/types.js';
import type { ConventionConfig, DetectedPattern, Dimension, FolderNode, NamingConfig, StructureConfig } from '../../config/types.js';
import { DEFAULT_CONVENTION, DEFAULT_STRUCTURE } from '../../config/defaults.js';
import { NamingVisitor } from './visitors/NamingVisitor.js';
import { ComponentVisitor } from './visitors/ComponentVisitor.js';
import { TestVisitor } from './visitors/TestVisitor.js';
import { ErrorHandlingVisitor } from './visitors/ErrorHandlingVisitor.js';
import { ImportVisitor } from './visitors/ImportVisitor.js';
import { SchemaVisitor } from './visitors/SchemaVisitor.js';

interface PatternAccumulator {
  dimension: Dimension;
  pattern: string;
  count: number;
  total: number;
  examples: string[];
}

export class PatternAggregator {
  private accumulators = new Map<string, PatternAccumulator>();
  private structureConfig?: StructureConfig;
  private minPatternConfidence: number;
  private visitors: AstVisitor[];

  constructor(options?: { structureConfig?: StructureConfig; namingConfig?: NamingConfig; conventionConfig?: ConventionConfig }) {
    this.structureConfig = options?.structureConfig;
    this.minPatternConfidence = options?.conventionConfig?.minPatternConfidence ?? DEFAULT_CONVENTION.minPatternConfidence ?? 50;
    this.visitors = [
      new NamingVisitor({ namingConfig: options?.namingConfig }),
      new ComponentVisitor(),
      new TestVisitor(),
      new ErrorHandlingVisitor(),
      new ImportVisitor(),
      new SchemaVisitor(),
    ];
  }

  ingest(files: ParsedFile[]): void {
    for (const file of files) {
      for (const visitor of this.visitors) {
        const findings = visitor.visit(file);
        for (const f of findings) {
          const key = `${f.dimension}:${f.pattern}`;
          const existing = this.accumulators.get(key);
          if (existing) {
            existing.count += f.count;
            existing.total += f.total;
            if (existing.examples.length < 5 && f.example) {
              existing.examples.push(f.example);
            }
          } else {
            this.accumulators.set(key, {
              dimension: f.dimension,
              pattern: f.pattern,
              count: f.count,
              total: f.total,
              examples: f.example ? [f.example] : [],
            });
          }
        }
      }
    }
  }

  ingestStructure(tree: FolderNode, filePaths?: string[]): void {
    const topDirs = tree.children.map((c) => c.name);
    const allDirs = this.collectAllDirs(tree);

    if (filePaths && filePaths.length > 0) {
      this.ingestDirectoryPlacement(filePaths, allDirs);
    }

    const arch = this.structureConfig?.architecture ?? DEFAULT_STRUCTURE.architecture;
    const featureLike = arch?.featureBased ?? DEFAULT_STRUCTURE.architecture?.featureBased ?? [];
    const mvcLike = arch?.mvc ?? DEFAULT_STRUCTURE.architecture?.mvc ?? [];
    const layeredLike = arch?.layered ?? DEFAULT_STRUCTURE.architecture?.layered ?? [];

    const featureFiltered = featureLike.filter((d) => topDirs.includes(d));
    const mvcFiltered = mvcLike.filter((d) => topDirs.includes(d));
    const layeredFiltered = layeredLike.filter((d) => topDirs.includes(d));

    const isFeatureBased = featureFiltered.length > 0;
    const isMvc = mvcFiltered.length >= 2;
    const isLayered = layeredFiltered.length >= 2;

    if (isFeatureBased) {
      this.addStructurePattern('Feature-based folder structure', topDirs);
    } else if (isMvc) {
      this.addStructurePattern('MVC folder structure', topDirs);
    } else if (isLayered) {
      this.addStructurePattern('Layered architecture folder structure', topDirs);
    }

    const hasSrcDir = topDirs.includes('src');
    if (hasSrcDir) {
      this.addStructurePattern('src/ root directory convention', ['src/']);
    }
  }

  getPatterns(): DetectedPattern[] {
    const results: DetectedPattern[] = [];

    for (const acc of this.accumulators.values()) {
      if (acc.total === 0) continue;
      const confidence = Math.round((acc.count / acc.total) * 100);
      if (confidence < this.minPatternConfidence) continue;

      results.push({
        dimension: acc.dimension,
        pattern: acc.pattern,
        frequency: acc.count,
        total: acc.total,
        confidence,
        examples: acc.examples,
      });
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  private collectAllDirs(node: FolderNode, prefix = ''): Set<string> {
    const dirs = new Set<string>();
    for (const c of node.children) {
      const path = prefix ? `${prefix}/${c.name}` : c.name;
      dirs.add(c.name);
      dirs.add(path);
      for (const sub of this.collectAllDirs(c, path)) {
        dirs.add(sub);
      }
    }
    return dirs;
  }

  private ingestDirectoryPlacement(filePaths: string[], allDirs: Set<string>): void {
    const configRules = this.structureConfig?.directoryPlacement ?? DEFAULT_STRUCTURE.directoryPlacement ?? [];
    const rules: Array<{ pattern: RegExp; dir: string; patternName: string }> = [];

    for (const r of configRules) {
      const dirExists = [...allDirs].some((d) => d === r.dir || d.endsWith(`/${r.dir}`));
      if (!dirExists) continue;
      rules.push({
        pattern: new RegExp(r.filePattern),
        dir: r.dir,
        patternName: r.patternName,
      });
    }

    for (const { pattern, dir, patternName } of rules) {
      let conforming = 0;
      let total = 0;
      const examples: string[] = [];

      for (const filePath of filePaths) {
        const base = filePath.split('/').pop() ?? '';
        const stem = base.replace(/\.[^.]+$/, '');
        const dirsInPath = filePath.split('/').slice(0, -1);

        if (!pattern.test(stem)) continue;
        total++;
        if (dirsInPath.includes(dir)) {
          conforming++;
        }
        if (examples.length < 5) examples.push(filePath);
      }

      if (total > 0) {
        const key = `structure:${patternName}`;
        this.accumulators.set(key, {
          dimension: 'structure',
          pattern: patternName,
          count: conforming,
          total,
          examples,
        });
      }
    }
  }

  private addStructurePattern(pattern: string, examples: string[]): void {
    const key = `structure:${pattern}`;
    this.accumulators.set(key, {
      dimension: 'structure',
      pattern,
      count: 1,
      total: 1,
      examples,
    });
  }
}
