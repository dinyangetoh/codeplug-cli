import type { Convention, Severity } from '../../../config/types.js';
import type { ExportFormatter } from './types.js';

const SEVERITY_TO_LEVEL: Record<Severity, string> = {
  critical: 'error',
  high: 'warning',
  medium: 'note',
  low: 'note',
};

export class CiFormatter implements ExportFormatter {
  readonly filename = 'ci-report.json';
  readonly targetDir = '.codeplug';

  format(conventions: Convention[]): string {
    const report = {
      $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/main/sarif-2.1/schema/sarif-schema-2.1.0.json',
      version: '2.1.0',
      runs: [
        {
          tool: {
            driver: {
              name: 'codeplug',
              version: '0.1.0',
              rules: conventions.map(c => ({
                id: c.id,
                shortDescription: { text: c.rule },
                defaultConfiguration: {
                  level: SEVERITY_TO_LEVEL[c.severity],
                },
                properties: {
                  dimension: c.dimension,
                  severity: c.severity,
                  confidence: c.confidence,
                  confirmed: c.confirmed,
                },
              })),
            },
          },
          results: conventions.map(c => ({
            ruleId: c.id,
            level: SEVERITY_TO_LEVEL[c.severity],
            message: { text: c.rule },
            locations: c.examples.slice(0, 3).map(ex => ({
              physicalLocation: {
                artifactLocation: { uri: ex },
              },
            })),
          })),
        },
      ],
    };

    return JSON.stringify(report, null, 2) + '\n';
  }
}
