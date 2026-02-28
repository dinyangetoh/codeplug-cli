import { describe, it, expect } from 'vitest';
import { AstAnalyzer } from '../../../src/core/analyzer/AstAnalyzer.js';
import { join } from 'node:path';

const FIXTURE_ROOT = join(__dirname, '../../fixtures/sample-react-app');

describe('AstAnalyzer', () => {
  it('should analyze a fixture project and find files', async () => {
    const analyzer = new AstAnalyzer(FIXTURE_ROOT);
    const result = await analyzer.analyze();

    expect(result.fileCount).toBeGreaterThan(0);
    expect(result.durationMs).toBeGreaterThan(0);
    expect(result.patterns.length).toBeGreaterThan(0);
  });

  it('should detect naming patterns in fixture project', async () => {
    const analyzer = new AstAnalyzer(FIXTURE_ROOT);
    const result = await analyzer.analyze();

    const namingPatterns = result.patterns.filter((p) => p.dimension === 'naming');
    expect(namingPatterns.length).toBeGreaterThan(0);

    const pascalPattern = namingPatterns.find((p) => p.pattern.includes('PascalCase'));
    expect(pascalPattern).toBeDefined();
  });

  it('should build folder structure', async () => {
    const analyzer = new AstAnalyzer(FIXTURE_ROOT);
    const result = await analyzer.analyze();

    expect(result.folderStructure.name).toBe('.');
    expect(result.folderStructure.children.length).toBeGreaterThan(0);
  });
});
