import { stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { CODEPLUG_DIR, CONVENTIONS_FILE } from '../../config/defaults.js';

const EXPORT_TARGETS = [
  { file: 'CLAUDE.md', dir: '.' },
  { file: 'conventions.mdc', dir: '.cursor/rules' },
  { file: 'copilot-instructions.md', dir: '.github' },
  { file: 'codeplug-export.json', dir: '.codeplug/exports' },
  { file: 'ci-report.json', dir: CODEPLUG_DIR },
];

export class FreshnessChecker {
  private conventionsPath: string;

  constructor(private projectRoot: string) {
    this.conventionsPath = join(projectRoot, CODEPLUG_DIR, CONVENTIONS_FILE);
  }

  async check(): Promise<boolean> {
    if (!existsSync(this.conventionsPath)) {
      return true;
    }

    const convMtime = await this.getMtime(this.conventionsPath);
    if (convMtime === null) return true;

    let anyExportExists = false;

    for (const target of EXPORT_TARGETS) {
      const exportPath = join(this.projectRoot, target.dir, target.file);
      if (!existsSync(exportPath)) continue;

      anyExportExists = true;
      const exportMtime = await this.getMtime(exportPath);
      if (exportMtime === null || exportMtime < convMtime) {
        return false;
      }
    }

    return anyExportExists;
  }

  private async getMtime(filePath: string): Promise<number | null> {
    try {
      const s = await stat(filePath);
      return s.mtimeMs;
    } catch {
      return null;
    }
  }
}
