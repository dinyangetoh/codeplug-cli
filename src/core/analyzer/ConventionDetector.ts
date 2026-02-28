import type { AnalysisResult, ConventionCandidate, Dimension, Severity } from '../../config/types.js';

const SEVERITY_MAP: Partial<Record<Dimension, Severity>> = {
  naming: 'medium',
  structure: 'high',
  component: 'medium',
  testing: 'medium',
  'error-handling': 'high',
  imports: 'low',
  git: 'low',
  state: 'medium',
  api: 'medium',
};

export class ConventionDetector {
  async detect(analysis: AnalysisResult): Promise<ConventionCandidate[]> {
    const candidates: ConventionCandidate[] = [];

    for (const pattern of analysis.patterns) {
      if (pattern.confidence < 60) continue;

      candidates.push({
        id: this.generateId(pattern.dimension, pattern.pattern),
        dimension: pattern.dimension,
        rule: pattern.pattern,
        confidence: pattern.confidence,
        examples: pattern.examples.slice(0, 5),
        severity: SEVERITY_MAP[pattern.dimension] ?? 'medium',
      });
    }

    return candidates.sort((a, b) => b.confidence - a.confidence);
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
