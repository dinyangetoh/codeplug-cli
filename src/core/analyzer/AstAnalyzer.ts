import { join, extname } from 'node:path';
import { readFile } from 'node:fs/promises';
import type { AnalysisConfig, AnalysisResult, ConventionConfig, FolderNode, NamingConfig, StructureConfig } from '../../config/types.js';
import { DEFAULT_ANALYSIS } from '../../config/defaults.js';

const SUPPORTED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const BATCH_SIZE = 50;

export class AstAnalyzer {
  private analysisConfig: AnalysisConfig;
  private structureConfig?: StructureConfig;
  private namingConfig?: NamingConfig;
  private conventionConfig?: ConventionConfig;

  constructor(
    private projectRoot: string,
    options?: { analysisConfig?: AnalysisConfig; structureConfig?: StructureConfig; namingConfig?: NamingConfig; conventionConfig?: ConventionConfig },
  ) {
    this.analysisConfig = options?.analysisConfig ?? DEFAULT_ANALYSIS;
    this.structureConfig = options?.structureConfig;
    this.namingConfig = options?.namingConfig;
    this.conventionConfig = options?.conventionConfig;
  }

  async analyze(): Promise<AnalysisResult> {
    const start = Date.now();
    const { globby } = await import('globby');

    const include = this.analysisConfig.include ?? DEFAULT_ANALYSIS.include;
    const ignore = this.analysisConfig.ignore ?? DEFAULT_ANALYSIS.ignore;

    const files = await globby(include ?? ['**/*.{ts,tsx,js,jsx,mjs,cjs}'], {
      cwd: this.projectRoot,
      gitignore: true,
      ignore: ignore,
      absolute: false,
    });

    const sourceFiles = files.filter((f) => SUPPORTED_EXTENSIONS.has(extname(f)));

    const { PatternAggregator } = await import('./PatternAggregator.js');
    const aggregator = new PatternAggregator({
      structureConfig: this.structureConfig,
      namingConfig: this.namingConfig,
      conventionConfig: this.conventionConfig,
    });

    for await (const batch of this.processBatches(sourceFiles)) {
      aggregator.ingest(batch);
    }

    const folderStructure = this.buildFolderTree(sourceFiles);
    aggregator.ingestStructure(folderStructure, sourceFiles);

    return {
      fileCount: sourceFiles.length,
      durationMs: Date.now() - start,
      patterns: aggregator.getPatterns(),
      folderStructure,
      filePaths: sourceFiles,
    };
  }

  private async *processBatches(files: string[]): AsyncGenerator<ParsedFile[]> {
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map((f) => this.parseFile(f)),
      );
      yield results.filter((r): r is ParsedFile => r !== null);
    }
  }

  private async parseFile(filePath: string): Promise<ParsedFile | null> {
    try {
      const absolutePath = join(this.projectRoot, filePath);
      const code = await readFile(absolutePath, 'utf-8');
      const { parse } = await import('@babel/parser');

      const ast = parse(code, {
        sourceType: 'module',
        plugins: [
          'typescript',
          'jsx',
          'decorators-legacy',
          'classProperties',
          'optionalChaining',
          'nullishCoalescingOperator',
          'dynamicImport',
        ],
        errorRecovery: true,
      });

      return { filePath, code, ast };
    } catch {
      return null;
    }
  }

  private buildFolderTree(files: string[]): FolderNode {
    const root: FolderNode = {
      name: '.',
      path: '.',
      children: [],
      fileCount: 0,
    };

    for (const file of files) {
      const parts = file.split('/');
      let current = root;
      current.fileCount++;

      for (let i = 0; i < parts.length - 1; i++) {
        const dirName = parts[i];
        let child = current.children.find((c) => c.name === dirName);
        if (!child) {
          child = {
            name: dirName,
            path: parts.slice(0, i + 1).join('/'),
            children: [],
            fileCount: 0,
          };
          current.children.push(child);
        }
        child.fileCount++;
        current = child;
      }
    }

    return root;
  }
}

import type { ParseResult } from '@babel/parser';
import type { File as BabelFile } from '@babel/types';

export interface ParsedFile {
  filePath: string;
  code: string;
  ast: ParseResult<BabelFile>;
}
