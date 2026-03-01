import { describe, it, expect } from 'vitest';
import { PatternAggregator } from '../../../src/core/analyzer/PatternAggregator.js';
import { parse } from '@babel/parser';
import type { FolderNode } from '../../../src/config/types.js';

function makeParsedFile(filePath: string, code: string) {
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
    errorRecovery: true,
  });
  return { filePath, code, ast };
}

describe('PatternAggregator', () => {
  it('should aggregate patterns from multiple files', () => {
    const aggregator = new PatternAggregator();

    const files = [
      makeParsedFile('src/components/UserProfile.tsx', 'export const UserProfile = () => <div />;'),
      makeParsedFile('src/components/AuthModal.tsx', 'export const AuthModal = () => <div />;'),
      makeParsedFile('src/utils/formatDate.ts', 'export function formatDate() { return ""; }'),
      makeParsedFile('src/hooks/useAuth.ts', 'export function useAuth() { return {}; }'),
    ];

    aggregator.ingest(files);
    const patterns = aggregator.getPatterns();

    expect(patterns.length).toBeGreaterThan(0);

    const componentPascalPattern = patterns.find(
      (p) => p.pattern === 'React components use PascalCase file names',
    );
    expect(componentPascalPattern).toBeDefined();
    expect(componentPascalPattern!.confidence).toBe(100);
    expect(componentPascalPattern!.frequency).toBe(2);
  });

  it('should detect feature-based folder structure', () => {
    const aggregator = new PatternAggregator();

    const tree: FolderNode = {
      name: '.',
      path: '.',
      fileCount: 10,
      children: [
        { name: 'features', path: 'features', fileCount: 5, children: [] },
        { name: 'shared', path: 'shared', fileCount: 3, children: [] },
      ],
    };

    aggregator.ingestStructure(tree);
    const patterns = aggregator.getPatterns();
    const structurePattern = patterns.find((p) => p.dimension === 'structure');
    expect(structurePattern).toBeDefined();
    expect(structurePattern!.pattern).toContain('Feature-based');
  });

  it('should filter out low-confidence patterns', () => {
    const aggregator = new PatternAggregator();

    const files = [
      makeParsedFile('src/one.ts', 'export const x = 1;'),
    ];

    aggregator.ingest(files);
    const patterns = aggregator.getPatterns();
    const lowConfidence = patterns.filter((p) => p.confidence < 50);
    expect(lowConfidence.length).toBe(0);
  });
});
