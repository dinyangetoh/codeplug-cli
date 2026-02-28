import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Violation } from '../config/types.js';
import { CODEPLUG_DIR, VIOLATIONS_FILE } from '../config/defaults.js';

export class ViolationStore {
  private filePath: string;
  private dirPath: string;

  constructor(private projectRoot: string) {
    this.dirPath = join(projectRoot, CODEPLUG_DIR);
    this.filePath = join(this.dirPath, VIOLATIONS_FILE);
  }

  async exists(): Promise<boolean> {
    return existsSync(this.filePath);
  }

  async load(): Promise<Violation[]> {
    if (!existsSync(this.filePath)) return [];
    const raw = await readFile(this.filePath, 'utf-8');
    return JSON.parse(raw) as Violation[];
  }

  async save(violations: Violation[]): Promise<void> {
    if (!existsSync(this.dirPath)) {
      await mkdir(this.dirPath, { recursive: true });
    }
    await writeFile(this.filePath, JSON.stringify(violations, null, 2), 'utf-8');
  }
}
