import type { Convention } from '../../../config/types.js';
import type { ExportFormatter } from './types.js';

export class JsonFormatter implements ExportFormatter {
  readonly filename = 'codeplug-export.json';
  readonly targetDir = '.codeplug/exports';

  format(conventions: Convention[]): string {
    const payload = {
      $schema: 'codeplug-export-v1',
      exportedAt: new Date().toISOString(),
      conventionCount: conventions.length,
      conventions: conventions.map(c => ({
        id: c.id,
        dimension: c.dimension,
        rule: c.rule,
        severity: c.severity,
        confidence: c.confidence,
        confirmed: c.confirmed,
        examples: c.examples,
      })),
    };

    return JSON.stringify(payload, null, 2) + '\n';
  }
}
