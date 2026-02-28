import type { Convention } from '../../../config/types.js';

export interface ExportFormatter {
  format(conventions: Convention[]): string;
  readonly filename: string;
  readonly targetDir: string;
}
