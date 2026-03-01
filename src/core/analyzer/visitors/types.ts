import type { ParsedFile } from '../AstAnalyzer.js';
import type { Dimension } from '../../../config/types.js';

export type ExportedKind = 'class' | 'instance' | 'component' | 'function' | 'hook';

export interface VisitorFinding {
  dimension: Dimension;
  pattern: string;
  count: number;
  total: number;
  example?: string;
  exportedName?: string;
  exportedKind?: ExportedKind;
  foundValue?: string;
}

export interface AstVisitor {
  visit(file: ParsedFile): VisitorFinding[];
}
