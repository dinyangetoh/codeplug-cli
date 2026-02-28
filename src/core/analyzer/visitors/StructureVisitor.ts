import type { AstVisitor, VisitorFinding } from './types.js';
import type { ParsedFile } from '../AstAnalyzer.js';

export class StructureVisitor implements AstVisitor {
  visit(_file: ParsedFile): VisitorFinding[] {
    // Structure analysis is done at the folder level in PatternAggregator.ingestStructure,
    // not per-file. This visitor is a no-op placeholder for consistency with the visitor pattern.
    return [];
  }
}
