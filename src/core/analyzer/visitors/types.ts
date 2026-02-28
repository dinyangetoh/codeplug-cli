import type { ParsedFile } from '../AstAnalyzer.js';
import type { Dimension } from '../../../config/types.js';

export interface VisitorFinding {
  dimension: Dimension;
  pattern: string;
  count: number;
  total: number;
  example?: string;
}

export interface AstVisitor {
  visit(file: ParsedFile): VisitorFinding[];
}
