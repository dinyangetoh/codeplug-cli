import type { Convention, Dimension } from '../../../config/types.js';
import type { ExportFormatter } from './types.js';

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

export class CursorFormatter implements ExportFormatter {
  readonly filename = 'conventions.mdc';
  readonly targetDir = '.cursor/rules';

  format(conventions: Convention[]): string {
    const frontmatter = [
      '---',
      'description: Project coding conventions detected by CodePlug',
      'globs:',
      'alwaysApply: true',
      '---',
    ].join('\n');

    const body: string[] = [
      '',
      '# Project Conventions',
      '',
      'These conventions were auto-detected by CodePlug and should be followed in all code changes.',
      '',
    ];

    const grouped = this.groupByDimension(conventions);

    for (const [dimension, items] of grouped) {
      body.push(`## ${DIMENSION_TITLES[dimension] ?? dimension}`);
      body.push('');

      for (const conv of items) {
        body.push(`- **[${conv.severity.toUpperCase()}]** ${conv.rule}`);
      }

      body.push('');
    }

    return frontmatter + body.join('\n');
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
