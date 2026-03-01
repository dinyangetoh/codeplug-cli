import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, readFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import type { AnalysisResult, Convention, FolderNode } from '../../../src/config/types.js';
import type { GenerationContext } from '../../../src/core/generator/documents/types.js';
import { ReadmeGenerator } from '../../../src/core/generator/documents/ReadmeGenerator.js';
import { ArchitectureGenerator } from '../../../src/core/generator/documents/ArchitectureGenerator.js';
import { ConventionsGenerator } from '../../../src/core/generator/documents/ConventionsGenerator.js';
import { ContributingGenerator } from '../../../src/core/generator/documents/ContributingGenerator.js';
import { OnboardingGenerator } from '../../../src/core/generator/documents/OnboardingGenerator.js';
import { StalenessTracker } from '../../../src/core/generator/StalenessTracker.js';

const mockFolderStructure: FolderNode = {
  name: '.',
  path: '.',
  children: [
    { name: 'src', path: 'src', children: [], fileCount: 10 },
    { name: 'tests', path: 'tests', children: [], fileCount: 5 },
  ],
  fileCount: 15,
};

const mockAnalysis: AnalysisResult = {
  fileCount: 15,
  durationMs: 100,
  patterns: [
    {
      dimension: 'naming',
      pattern: 'camelCase functions',
      frequency: 20,
      total: 22,
      confidence: 0.91,
      examples: ['getUser', 'fetchData'],
    },
    {
      dimension: 'structure',
      pattern: 'barrel exports',
      frequency: 5,
      total: 6,
      confidence: 0.83,
      examples: ['src/index.ts'],
    },
    {
      dimension: 'testing',
      pattern: 'describe/it blocks',
      frequency: 10,
      total: 10,
      confidence: 1.0,
      examples: ['tests/unit/foo.test.ts'],
    },
  ],
  folderStructure: mockFolderStructure,
};

const mockConventions: Convention[] = [
  {
    id: 'conv-1',
    dimension: 'naming',
    rule: 'Use camelCase for function names',
    confidence: 0.9,
    confirmed: true,
    examples: ['getUser()', 'fetchData()'],
    severity: 'high',
  },
  {
    id: 'conv-2',
    dimension: 'structure',
    rule: 'Use barrel exports in each module',
    confidence: 0.85,
    confirmed: true,
    examples: ['index.ts'],
    severity: 'medium',
  },
];

function makeContext(overrides?: Partial<GenerationContext>): GenerationContext {
  return {
    analysis: mockAnalysis,
    conventions: mockConventions,
    projectRoot: '/tmp/test-project',
    audience: 'developers',
    style: 'professional',
    llmAvailable: false,
    ...overrides,
  };
}

describe('ReadmeGenerator', () => {
  const gen = new ReadmeGenerator();

  it('should generate markdown with all required sections', async () => {
    const result = await gen.generate(makeContext());

    expect(result).toContain('# test-project');
    expect(result).toContain('## Overview');
    expect(result).toContain('## Quick Start');
    expect(result).toContain('## Project Structure');
    expect(result).toContain('## Conventions');
  });

  it('should include file count in description', async () => {
    const result = await gen.generate(makeContext());
    expect(result).toContain('15 source files');
  });

  it('should list conventions grouped by dimension', async () => {
    const result = await gen.generate(makeContext());
    expect(result).toContain('### naming');
    expect(result).toContain('Use camelCase for function names');
  });

  it('should handle empty conventions gracefully', async () => {
    const result = await gen.generate(makeContext({ conventions: [] }));
    expect(result).not.toContain('## Conventions');
  });
});

describe('ArchitectureGenerator', () => {
  const gen = new ArchitectureGenerator();

  it('should generate markdown with architecture sections', async () => {
    const result = await gen.generate(makeContext());

    expect(result).toContain('# test-project — Architecture');
    expect(result).toContain('## Executive Summary');
    expect(result).toContain('## Directory Structure');
  });

  it('should include component relationships from structural patterns', async () => {
    const result = await gen.generate(makeContext());
    expect(result).toContain('## Component Relationships');
    expect(result).toContain('barrel exports');
  });

  it('should include design decisions for high-confidence patterns', async () => {
    const result = await gen.generate(makeContext());
    expect(result).toContain('## Design Decisions');
  });
});

describe('ConventionsGenerator', () => {
  const gen = new ConventionsGenerator();

  it('should render all conventions with metadata', async () => {
    const result = await gen.generate(makeContext());

    expect(result).toContain('# Conventions');
    expect(result).toContain('Use camelCase for function names');
    expect(result).toContain('high');
    expect(result).toContain('90%');
  });

  it('should group conventions by dimension', async () => {
    const result = await gen.generate(makeContext());
    expect(result).toContain('## naming');
    expect(result).toContain('## structure');
  });

  it('should handle empty conventions list', async () => {
    const result = await gen.generate(makeContext({ conventions: [] }));
    expect(result).toContain('No conventions have been detected');
  });
});

describe('ContributingGenerator', () => {
  const gen = new ContributingGenerator();

  it('should generate markdown with contributing sections', async () => {
    const result = await gen.generate(makeContext());

    expect(result).toContain('# Contributing to test-project');
    expect(result).toContain('## Setup');
    expect(result).toContain('## Development Workflow');
    expect(result).toContain('## Coding Standards');
    expect(result).toContain('## Pull Request Process');
  });

  it('should include confirmed conventions in coding standards', async () => {
    const result = await gen.generate(makeContext());
    expect(result).toContain('Use camelCase for function names');
  });
});

describe('OnboardingGenerator', () => {
  const gen = new OnboardingGenerator();

  it('should generate markdown with onboarding sections', async () => {
    const result = await gen.generate(makeContext());

    expect(result).toContain('# Onboarding');
    expect(result).toContain('## Executive Summary');
    expect(result).toContain('## Environment Setup');
    expect(result).toContain('## Key Concepts');
    expect(result).toContain('## Common Tasks');
  });

  it('should describe top-level directories in architecture tour', async () => {
    const result = await gen.generate(makeContext());
    expect(result).toContain('**src/**');
    expect(result).toContain('**tests/**');
  });
});

describe('StalenessTracker', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'codeplug-test-'));
    await mkdir(join(tmpDir, '.codeplug'), { recursive: true });
    await mkdir(join(tmpDir, 'src'), { recursive: true });
    await writeFile(join(tmpDir, 'src', 'index.ts'), 'export const x = 1;');
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('should report all docs as stale when no hashes file exists', async () => {
    const tracker = new StalenessTracker(tmpDir);
    const statuses = await tracker.check();

    expect(statuses.length).toBe(5);
    for (const s of statuses) {
      expect(s.stale).toBe(true);
    }
  });

  it('should compute a consistent source hash', async () => {
    const tracker = new StalenessTracker(tmpDir);
    const hash1 = await tracker.computeSourceHash();
    const hash2 = await tracker.computeSourceHash();
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should detect changed source code as stale', async () => {
    const tracker = new StalenessTracker(tmpDir);

    const hash = await tracker.computeSourceHash();
    await tracker.update('README.md', hash);
    await writeFile(join(tmpDir, 'README.md'), '# Test');

    await writeFile(join(tmpDir, 'src', 'index.ts'), 'export const x = 2;');

    const statuses = await tracker.check();
    const readme = statuses.find((s) => s.name === 'README.md')!;
    expect(readme.stale).toBe(true);
    expect(readme.reason).toContain('Source code changed');
  });

  it('should report non-stale when hash matches', async () => {
    const tracker = new StalenessTracker(tmpDir);

    const hash = await tracker.computeSourceHash();
    await tracker.update('README.md', hash);
    await writeFile(join(tmpDir, 'README.md'), '# Test');

    const statuses = await tracker.check();
    const readme = statuses.find((s) => s.name === 'README.md')!;
    expect(readme.stale).toBe(false);
  });

  it('should save and load hashes across instances', async () => {
    const tracker1 = new StalenessTracker(tmpDir);
    await tracker1.update('README.md', 'abc123');

    const hashFile = join(tmpDir, '.codeplug', 'doc-hashes.json');
    expect(existsSync(hashFile)).toBe(true);

    const raw = JSON.parse(await readFile(hashFile, 'utf-8'));
    expect(raw['README.md']).toBe('abc123');
  });
});

describe('DocGenerator (integration)', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'codeplug-docgen-'));
    await mkdir(join(tmpDir, '.codeplug'), { recursive: true });
    await mkdir(join(tmpDir, 'src'), { recursive: true });
    await writeFile(join(tmpDir, 'src', 'index.ts'), 'export const app = true;');
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('should generate all documents with template fallback', async () => {
    vi.mock('../../../src/core/generator/llm/healthCheck.js', () => ({
      checkOllamaHealth: vi.fn().mockResolvedValue({ available: false, models: [] }),
    }));

    const { DocGenerator } = await import('../../../src/core/generator/DocGenerator.js');
    const gen = new DocGenerator(tmpDir);
    const result = await gen.generate({});

    expect(result.docsCreated).toBe(5);
    expect(result.documents).toContain('README.md');
    expect(result.documents).toContain('ARCHITECTURE.md');
    expect(result.documents).toContain('CONVENTIONS.md');
    expect(result.documents).toContain('CONTRIBUTING.md');
    expect(result.documents).toContain('ONBOARDING.md');

    const readme = await readFile(join(tmpDir, 'README.md'), 'utf-8');
    expect(readme).toContain('# ');
  });
});
