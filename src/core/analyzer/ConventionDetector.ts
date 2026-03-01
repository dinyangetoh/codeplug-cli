import type {
  AnalysisResult,
  ConventionCandidate,
  ConventionConfig,
  Severity,
  StructureConfig,
} from '../../config/types.js';
import { DEFAULT_CONVENTION, DEFAULT_STRUCTURE } from '../../config/defaults.js';

export class ConventionDetector {
  private conventionConfig: ConventionConfig;
  private structureConfig?: StructureConfig;

  constructor(options?: { conventionConfig?: ConventionConfig; structureConfig?: StructureConfig }) {
    this.conventionConfig = options?.conventionConfig ?? DEFAULT_CONVENTION;
    this.structureConfig = options?.structureConfig;
  }

  async detect(analysis: AnalysisResult): Promise<ConventionCandidate[]> {
    const candidates: ConventionCandidate[] = [];
    const threshold = this.conventionConfig.confidenceThreshold ?? DEFAULT_CONVENTION.confidenceThreshold ?? 60;
    const severityMap = this.conventionConfig.severityMap ?? DEFAULT_CONVENTION.severityMap ?? {};

    for (const pattern of analysis.patterns) {
      if (pattern.confidence < threshold) continue;

      candidates.push({
        id: this.generateId(pattern.dimension, pattern.pattern),
        dimension: pattern.dimension,
        rule: pattern.pattern,
        confidence: pattern.confidence,
        examples: pattern.examples.slice(0, 5),
        severity: (severityMap[pattern.dimension] ?? 'medium') as Severity,
      });
    }

    const existingRules = new Set(candidates.map((c) => `${c.dimension}:${c.rule}`));
    const bootstrapped = this.bootstrapDirectoryPlacement(analysis, existingRules, severityMap);
    candidates.push(...bootstrapped);

    const semanticBootstrap = this.bootstrapSemanticConvention(existingRules, severityMap);
    candidates.push(...semanticBootstrap);

    return candidates.sort((a, b) => b.confidence - a.confidence);
  }

  private bootstrapSemanticConvention(
    existingRules: Set<string>,
    severityMap: Partial<Record<string, Severity>>,
  ): ConventionCandidate[] {
    if (!this.conventionConfig.enableSemanticCoherence) return [];

    const rule = 'Export semantically fits file context';
    const key = `naming:${rule}`;
    if (existingRules.has(key)) return [];

    existingRules.add(key);
    return [
      {
        id: this.generateId('naming', rule),
        dimension: 'naming',
        rule,
        confidence: 100,
        examples: [],
        severity: (severityMap.naming ?? 'medium') as Severity,
      },
    ];
  }

  private bootstrapDirectoryPlacement(
    analysis: AnalysisResult,
    existingRules: Set<string>,
    severityMap: Partial<Record<string, Severity>>,
  ): ConventionCandidate[] {
    const results: ConventionCandidate[] = [];
    const rules = this.structureConfig?.directoryPlacement ?? DEFAULT_STRUCTURE.directoryPlacement ?? [];
    const allDirs = this.collectDirsFromPaths(analysis.filePaths ?? []);

    for (const r of rules) {
      const dirExists = [...allDirs].some((d) => d === r.dir || d.endsWith(`/${r.dir}`));
      if (!dirExists) continue;

      const key = `structure:${r.patternName}`;
      if (existingRules.has(key)) continue;

      results.push({
        id: this.generateId('structure', r.patternName),
        dimension: 'structure',
        rule: r.patternName,
        confidence: 100,
        examples: [],
        severity: (severityMap.structure ?? 'high') as Severity,
      });
      existingRules.add(key);
    }

    return results;
  }

  private collectDirsFromPaths(filePaths: string[]): Set<string> {
    const dirs = new Set<string>();
    for (const p of filePaths) {
      const parts = p.split('/').slice(0, -1);
      for (let i = 0; i < parts.length; i++) {
        dirs.add(parts[i]);
        dirs.add(parts.slice(0, i + 1).join('/'));
      }
    }
    return dirs;
  }

  private generateId(dimension: string, pattern: string): string {
    const slug = pattern
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);
    return `${dimension}-${slug}`;
  }
}
