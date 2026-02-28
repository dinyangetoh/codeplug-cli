import type { ParsedFile } from './AstAnalyzer.js';
import type { DetectedPattern, Dimension, FolderNode } from '../../config/types.js';
import { NamingVisitor } from './visitors/NamingVisitor.js';
import { ComponentVisitor } from './visitors/ComponentVisitor.js';
import { TestVisitor } from './visitors/TestVisitor.js';
import { ErrorHandlingVisitor } from './visitors/ErrorHandlingVisitor.js';
import { ImportVisitor } from './visitors/ImportVisitor.js';

interface PatternAccumulator {
  dimension: Dimension;
  pattern: string;
  count: number;
  total: number;
  examples: string[];
}

export class PatternAggregator {
  private accumulators = new Map<string, PatternAccumulator>();
  private visitors = [
    new NamingVisitor(),
    new ComponentVisitor(),
    new TestVisitor(),
    new ErrorHandlingVisitor(),
    new ImportVisitor(),
  ];

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

  ingestStructure(tree: FolderNode): void {
    const topDirs = tree.children.map((c) => c.name);

    const featureLike = ['features', 'modules', 'domains', 'pages'];
    const mvcLike = ['models', 'views', 'controllers'];
    const layeredLike = ['controllers', 'services', 'repositories', 'entities'];

    const isFeatureBased = featureLike.some((d) => topDirs.includes(d));
    const isMvc = mvcLike.filter((d) => topDirs.includes(d)).length >= 2;
    const isLayered = layeredLike.filter((d) => topDirs.includes(d)).length >= 2;

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
      if (confidence < 50) continue;

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
