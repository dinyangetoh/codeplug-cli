import type { Convention, Dimension, Severity } from '../../../config/types.js';
import type { ExportFormatter } from './types.js';

const SEVERITY_PREFIX: Record<Severity, string> = {
  critical: 'MUST',
  high: 'SHOULD',
  medium: 'PREFER',
  low: 'CONSIDER',
};

const DIMENSION_TITLES: Record<Dimension, string> = {
  naming: 'Naming Conventions',
  structure: 'Project Structure',
  component: 'Component Patterns',
  testing: 'Testing Standards',
  'error-handling': 'Error Handling',
  imports: 'Import Conventions',
  git: 'Git Conventions',
  state: 'State Management',
  api: 'API Patterns',
};

export class CopilotFormatter implements ExportFormatter {
  readonly filename = 'copilot-instructions.md';
  readonly targetDir = '.github';

  format(conventions: Convention[]): string {
    const lines: string[] = [
      '# GitHub Copilot Instructions',
      '',
      'These instructions describe the coding conventions for this project.',
      'Follow them when generating or suggesting code.',
      '',
    ];

    const grouped = this.groupByDimension(conventions);

    for (const [dimension, items] of grouped) {
      lines.push(`## ${DIMENSION_TITLES[dimension] ?? dimension}`);
      lines.push('');

      for (const conv of items) {
        lines.push(`- **${SEVERITY_PREFIX[conv.severity]}**: ${conv.rule}`);
      }

      lines.push('');
    }

    return lines.join('\n');
  }

  private groupByDimension(conventions: Convention[]): Map<Dimension, Convention[]> {
    const map = new Map<Dimension, Convention[]>();
    for (const c of conventions) {
      const list = map.get(c.dimension) ?? [];
      list.push(c);
      map.set(c.dimension, list);
    }
    return map;
  }
}
