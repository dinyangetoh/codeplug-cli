import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Convention, ConventionsFile } from '../config/types.js';
import { conventionsFileSchema } from '../config/ConventionSchema.js';
import { CODEPLUG_DIR, CONVENTIONS_FILE } from '../config/defaults.js';

export class ConventionStore {
  private filePath: string;
  private dirPath: string;

  constructor(private projectRoot: string) {
    this.dirPath = join(projectRoot, CODEPLUG_DIR);
    this.filePath = join(this.dirPath, CONVENTIONS_FILE);
  }

  async exists(): Promise<boolean> {
    return existsSync(this.filePath);
  }

  async load(): Promise<Convention[]> {
    const raw = await readFile(this.filePath, 'utf-8');
    const parsed = conventionsFileSchema.parse(JSON.parse(raw));
    return parsed.conventions;
  }

  async save(conventions: Convention[]): Promise<void> {
    if (!existsSync(this.dirPath)) {
      await mkdir(this.dirPath, { recursive: true });
    }

    const now = new Date().toISOString();
    const file: ConventionsFile = {
      version: '1.0',
      created: now,
      updated: now,
      conventions,
    };

    await writeFile(this.filePath, JSON.stringify(file, null, 2), 'utf-8');
  }
}
