import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { CustomRule } from '../config/types.js';
import { customRulesFileSchema } from '../config/ConventionSchema.js';
import { CODEPLUG_DIR, RULES_FILE } from '../config/defaults.js';

export class CustomRuleStore {
  private filePath: string;

  constructor(private projectRoot: string) {
    this.filePath = join(projectRoot, CODEPLUG_DIR, RULES_FILE);
  }

  async exists(): Promise<boolean> {
    return existsSync(this.filePath);
  }

  async load(): Promise<CustomRule[]> {
    const raw = await readFile(this.filePath, 'utf-8');
    const parsed = customRulesFileSchema.parse(JSON.parse(raw));
    return parsed.rules;
  }
}
