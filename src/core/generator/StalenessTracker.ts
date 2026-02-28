import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { DocStatus } from '../../config/types.js';
import { CODEPLUG_DIR, DOC_HASHES_FILE } from '../../config/defaults.js';

interface DocHashRecord {
  [docName: string]: string;
}

const TRACKED_DOCS = [
  'README.md',
  'ARCHITECTURE.md',
  'CONVENTIONS.md',
  'CONTRIBUTING.md',
  'ONBOARDING.md',
];

export class StalenessTracker {
  private hashFilePath: string;
  private dirPath: string;

  constructor(private projectRoot: string) {
    this.dirPath = join(projectRoot, CODEPLUG_DIR);
    this.hashFilePath = join(this.dirPath, DOC_HASHES_FILE);
  }

  async check(): Promise<DocStatus[]> {
    const saved = await this.loadHashes();
    const currentHash = await this.computeSourceHash();

    return TRACKED_DOCS.map((name) => {
      const docPath = join(this.projectRoot, name);
      if (!existsSync(docPath)) {
        return { name, stale: true, reason: 'Document does not exist' };
      }
      const savedHash = saved[name];
      if (!savedHash) {
        return { name, stale: true, reason: 'No generation record found' };
      }
      if (savedHash !== currentHash) {
        return { name, stale: true, reason: 'Source code changed since last generation' };
      }
      return { name, stale: false };
    });
  }

  async update(docName: string, hash: string): Promise<void> {
    const saved = await this.loadHashes();
    saved[docName] = hash;
    await this.saveHashes(saved);
  }

  async computeSourceHash(): Promise<string> {
    const { globby } = await import('globby');

    const files = await globby(
      ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
      {
        cwd: this.projectRoot,
        gitignore: true,
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.codeplug/**'],
        absolute: false,
      },
    );

    files.sort();
    const hash = createHash('sha256');
    for (const file of files) {
      const content = await readFile(join(this.projectRoot, file), 'utf-8');
      hash.update(file);
      hash.update(content);
    }
    return hash.digest('hex');
  }

  private async loadHashes(): Promise<DocHashRecord> {
    if (!existsSync(this.hashFilePath)) {
      return {};
    }
    const raw = await readFile(this.hashFilePath, 'utf-8');
    return JSON.parse(raw) as DocHashRecord;
  }

  private async saveHashes(record: DocHashRecord): Promise<void> {
    if (!existsSync(this.dirPath)) {
      await mkdir(this.dirPath, { recursive: true });
    }
    await writeFile(this.hashFilePath, JSON.stringify(record, null, 2), 'utf-8');
  }
}
